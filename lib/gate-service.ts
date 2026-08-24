import "server-only";

import { isDatabaseConfigured } from "@/lib/db";
import {
  captureContact,
  getOrCreateUnlock,
  getPublishedGateBySlug,
  getUnlock,
  markAction,
  recordDownload,
  refreshUnlockState,
  toPublicGate,
} from "@/lib/gate-store";
import {
  EMPTY_PROGRESS,
  type GateActionKind,
  type GateProgress,
  type GateRecord,
  type GateUnlockRecord,
  type GateViewState,
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  isUnlocked,
} from "@/lib/gate-types";
import { performAction } from "@/lib/soundcloud-actions";
import { type FanSession, isMockMode } from "@/lib/soundcloud-user-auth";

/**
 * Gate business logic, kept out of the route handlers so the rules live in one
 * place: which actions a gate permits, when an action may be skipped, and when
 * a download is authorized.
 *
 * The invariant worth protecting: a gate only ever performs actions it
 * actually requires, only once each, and only for a fan who authenticated in
 * this browser. Route handlers do not get to decide any of that.
 */

export type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
  reconnect?: boolean;
};

// ---------------------------------------------------------------------------
// Reading state
// ---------------------------------------------------------------------------

/** Everything `/gate/[slug]` needs to render, or `null` if there is no gate. */
export async function loadGateViewState(
  slug: string,
  session: FanSession | null,
): Promise<GateViewState | null> {
  if (!isDatabaseConfigured()) return null;

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return null;

  let progress: GateProgress = EMPTY_PROGRESS;
  if (session) {
    // Read-only here: a page view should not create rows for a fan who is only
    // looking. The row appears on their first action.
    const existing = await getUnlock(gate.id, session.fan.userUrn);
    if (existing) progress = existing.progress;
  }

  return {
    gate: toPublicGate(gate),
    fan: session?.fan ?? null,
    progress,
    unlocked: isUnlocked(gate.requirements, progress),
    mockMode: isMockMode(),
  };
}

// ---------------------------------------------------------------------------
// Performing an action
// ---------------------------------------------------------------------------

export type ApplyActionInput = {
  slug: string;
  action: GateActionKind;
  commentBody?: string;
  session: FanSession | null;
};

export type ApplyActionSuccess = {
  ok: true;
  progress: GateProgress;
  unlocked: boolean;
};

/**
 * Perform one action on the fan's behalf and record it.
 *
 * Ordering matters here. We check "already done" *before* calling SoundCloud,
 * which is what makes a double-clicked comment button safe — the comment
 * endpoint creates a new comment on every call, so the stored timestamp is the
 * only thing standing between a refresh and a spammed track.
 */
export async function applyAction(
  input: ApplyActionInput,
): Promise<ApplyActionSuccess | ServiceFailure> {
  const { slug, action, commentBody, session } = input;

  if (!isDatabaseConfigured()) {
    return { ok: false, status: 503, error: "Gates are not configured." };
  }
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Connect your SoundCloud account first.",
      reconnect: true,
    };
  }

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return { ok: false, status: 404, error: "Gate not found." };

  // A gate may only ever do what it advertises. Anything else would be an
  // action the fan was never shown, let alone deliberately initiated.
  if (!gate.requirements[action]) {
    return {
      ok: false,
      status: 400,
      error: "This gate does not ask for that action.",
    };
  }

  const trimmedComment = commentBody?.trim() ?? "";
  if (action === "comment") {
    if (trimmedComment.length < MIN_COMMENT_LENGTH) {
      return {
        ok: false,
        status: 400,
        error: "Write a comment before posting.",
      };
    }
    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      return {
        ok: false,
        status: 400,
        error: `Keep it under ${MAX_COMMENT_LENGTH} characters.`,
      };
    }
  }

  const unlock = await getOrCreateUnlock(gate.id, session.fan);

  // Already done — return current state without touching the API.
  if (unlock.progress[action]) {
    return finish(gate, unlock);
  }

  if (session.tokenExpired) {
    return {
      ok: false,
      status: 401,
      error: "Your SoundCloud session expired. Reconnect to continue.",
      reconnect: true,
    };
  }

  const result = await performAction({
    action,
    accessToken: session.accessToken,
    track: { trackUrn: gate.trackUrn, trackId: gate.trackId },
    artist: { artistUserUrn: gate.artistUserUrn },
    commentBody: trimmedComment,
  });

  if (!result.ok) {
    console.warn(
      `[gate] ${slug} ${action} failed: ${result.reason} (${result.status})`,
      result.message ?? "",
    );
    return { ok: false, ...describeFailure(result.reason, result.message) };
  }

  const updated = await markAction(gate.id, session.fan.userUrn, action);
  return finish(gate, updated ?? unlock);
}

function describeFailure(
  reason: string,
  message?: string,
): { status: number; error: string; reconnect?: boolean } {
  switch (reason) {
    case "unauthorized":
      return {
        status: 401,
        error: "SoundCloud rejected the request. Reconnect and try again.",
        reconnect: true,
      };
    case "not-found":
      return {
        status: 404,
        error: "This track is no longer available on SoundCloud.",
      };
    case "rate-limited":
      return {
        status: 429,
        error: "SoundCloud is rate limiting us. Wait a moment and retry.",
      };
    case "unprocessable":
      return {
        status: 422,
        error: message ?? "SoundCloud would not accept that.",
      };
    default:
      return { status: 502, error: "SoundCloud is having trouble. Try again." };
  }
}

async function finish(
  gate: GateRecord,
  unlock: GateUnlockRecord,
): Promise<ApplyActionSuccess> {
  const settled = await refreshUnlockState(gate, unlock);
  return {
    ok: true,
    progress: settled.progress,
    unlocked: isUnlocked(gate.requirements, settled.progress),
  };
}

// ---------------------------------------------------------------------------
// Contact capture
// ---------------------------------------------------------------------------

/** Deliberately permissive — we reject obvious nonsense, not unusual domains. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

export async function applyContact(input: {
  slug: string;
  firstName: string;
  email: string;
  marketingConsent: boolean;
  session: FanSession | null;
}): Promise<ApplyActionSuccess | ServiceFailure> {
  const { slug, session } = input;

  if (!isDatabaseConfigured()) {
    return { ok: false, status: 503, error: "Gates are not configured." };
  }
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Connect your SoundCloud account first.",
      reconnect: true,
    };
  }

  const firstName = input.firstName.trim();
  const email = input.email.trim();

  if (firstName.length === 0 || firstName.length > 100) {
    return { ok: false, status: 400, error: "Enter your first name." };
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { ok: false, status: 400, error: "Enter a valid email address." };
  }

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return { ok: false, status: 404, error: "Gate not found." };

  await getOrCreateUnlock(gate.id, session.fan);
  const updated = await captureContact(gate.id, session.fan.userUrn, {
    firstName,
    email,
    marketingConsent: input.marketingConsent,
  });

  if (!updated) {
    return { ok: false, status: 500, error: "Could not save your details." };
  }
  return finish(gate, updated);
}

// ---------------------------------------------------------------------------
// Download authorization
// ---------------------------------------------------------------------------

export type DownloadGrant = {
  ok: true;
  gate: GateRecord;
  unlock: GateUnlockRecord;
};

/**
 * Decide whether this fan may download, re-deriving the answer from stored
 * progress rather than trusting anything the client sends. Note this does not
 * require a live SoundCloud token: the entitlement was earned earlier, so a fan
 * returning next week still gets their file.
 */
export async function authorizeDownload(input: {
  slug: string;
  session: FanSession | null;
}): Promise<DownloadGrant | ServiceFailure> {
  const { slug, session } = input;

  if (!isDatabaseConfigured()) {
    return { ok: false, status: 503, error: "Gates are not configured." };
  }
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Connect your SoundCloud account first.",
      reconnect: true,
    };
  }

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return { ok: false, status: 404, error: "Gate not found." };

  const unlock = await getUnlock(gate.id, session.fan.userUrn);
  if (!unlock || !isUnlocked(gate.requirements, unlock.progress)) {
    return {
      ok: false,
      status: 403,
      error: "Finish the steps above to unlock the download.",
    };
  }

  const target = gate.deliveryBlobUrl ?? gate.deliveryExternalUrl;
  if (!target) {
    return {
      ok: false,
      status: 503,
      error: "The download for this gate has not been uploaded yet.",
    };
  }

  return { ok: true, gate, unlock };
}

export async function noteDownload(unlockId: string): Promise<void> {
  await recordDownload(unlockId);
}
