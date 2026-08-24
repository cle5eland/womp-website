import "server-only";

import { isDatabaseConfigured } from "@/lib/db";
import type { GateClaim } from "@/lib/gate-claim";
import {
  attachSoundcloud,
  captureContact,
  getPublishedGateBySlug,
  getUnlockByEmail,
  markAction,
  recordDownload,
  refreshUnlockState,
  toPublicGate,
} from "@/lib/gate-store";
import {
  EMPTY_PROGRESS,
  type GateActionKind,
  type GateClaimIdentity,
  type GateProgress,
  type GateRecord,
  type GateUnlockRecord,
  type GateViewState,
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  actionProvider,
  isUnlocked,
  progressKey,
} from "@/lib/gate-types";
import { isSameSoundcloudUser, performAction } from "@/lib/soundcloud-actions";
import { type FanSession, isMockMode } from "@/lib/soundcloud-user-auth";

/**
 * Gate business logic, kept out of the route handlers so the rules live in one
 * place: which actions a gate permits, when an action may be skipped, and when
 * a download is authorized.
 *
 * Identity is email (the claim cookie). SoundCloud's session is only required
 * for SoundCloud writes. Spotify steps are honor-system attestations.
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
  input: { claim: GateClaim | null; session: FanSession | null },
): Promise<GateViewState | null> {
  if (!isDatabaseConfigured()) return null;

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return null;

  let progress: GateProgress = EMPTY_PROGRESS;
  let claim: GateClaimIdentity | null = null;
  if (input.claim) {
    claim = input.claim;
    const existing = await getUnlockByEmail(gate.id, input.claim.email);
    if (existing) progress = existing.progress;
  }

  return {
    gate: toPublicGate(gate),
    claim,
    fan: input.session?.fan ?? null,
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
  claim: GateClaim | null;
};

export type ApplyActionSuccess = {
  ok: true;
  progress: GateProgress;
  unlocked: boolean;
};

/**
 * Perform one action and record it.
 *
 * SoundCloud kinds still hit the API with the fan token. Spotify kinds are an
 * attestation: the fan opened Spotify and says they followed. We check
 * "already done" before any write so a double-clicked comment is safe.
 */
export async function applyAction(
  input: ApplyActionInput,
): Promise<ApplyActionSuccess | ServiceFailure> {
  const { slug, action, commentBody, session, claim } = input;

  if (!isDatabaseConfigured()) {
    return { ok: false, status: 503, error: "Gates are not configured." };
  }
  if (!claim) {
    return {
      ok: false,
      status: 401,
      error: "Enter your name and email first.",
    };
  }

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return { ok: false, status: 404, error: "Gate not found." };

  if (!gate.requirements[action]) {
    return {
      ok: false,
      status: 400,
      error: "This gate does not ask for that action.",
    };
  }

  const unlock = await getUnlockByEmail(gate.id, claim.email);
  if (!unlock || !unlock.progress.emailCapturedAt) {
    return {
      ok: false,
      status: 401,
      error: "Enter your name and email first.",
    };
  }

  if (unlock.progress[progressKey(action)]) {
    return finish(gate, unlock);
  }

  if (actionProvider(action) === "spotify") {
    const updated = await markAction(unlock.id, action);
    return finish(gate, updated ?? unlock);
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

  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Connect your SoundCloud account first.",
      reconnect: true,
    };
  }

  const attached = await attachSoundcloud(unlock, session.fan);
  if ("conflict" in attached) {
    return {
      ok: false,
      status: 409,
      error:
        attached.conflict === "other-account"
          ? "This download is tied to a different SoundCloud account. Use the one you connected first."
          : "That SoundCloud account already unlocked this download with a different email.",
    };
  }

  if (session.tokenExpired) {
    return {
      ok: false,
      status: 401,
      error: "Your SoundCloud session expired. Reconnect to continue.",
      reconnect: true,
    };
  }

  // SoundCloud will not let you follow yourself or repost your own track.
  // Credit the step so the artist can test the live gate, rather than mapping
  // those rejections onto a "reconnect" or a 502.
  const actingOnOwnAccount = isSameSoundcloudUser(
    session.fan.userUrn,
    gate.artistUserUrn,
  );
  if (actingOnOwnAccount && (action === "follow" || action === "repost")) {
    console.log("[gate] credited own-account action without SoundCloud write", {
      slug,
      action,
      fan: session.fan.username,
    });
    const updated = await markAction(attached.id, action);
    return finish(gate, updated ?? attached);
  }

  let result: Awaited<ReturnType<typeof performAction>>;
  try {
    result = await performAction({
      action: action as Exclude<GateActionKind, "spotify_follow">,
      accessToken: session.accessToken,
      track: { trackUrn: gate.trackUrn, trackId: gate.trackId },
      artist: { artistUserUrn: gate.artistUserUrn },
      commentBody: trimmedComment,
    });
  } catch (err) {
    console.error("[gate] action threw", {
      slug,
      action,
      fan: session.fan.username,
      err,
    });
    return {
      ok: false,
      status: 502,
      error: "SoundCloud is having trouble. Try again.",
    };
  }

  if (!result.ok) {
    const log = result.status >= 500 ? console.error : console.warn;
    log("[gate] action failed", {
      slug,
      action,
      fan: session.fan.username,
      reason: result.reason,
      status: result.status,
      path: result.path,
      message: result.message,
    });
    return { ok: false, ...describeFailure(result.reason, result.message) };
  }

  const updated = await markAction(attached.id, action);
  return finish(gate, updated ?? attached);
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
    case "forbidden":
      return {
        status: 403,
        error: message ?? "SoundCloud would not allow that action.",
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
        error: message ?? "SoundCloud would not accept that action.",
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
// Contact capture (step 1 — this is the identity)
// ---------------------------------------------------------------------------

/** Deliberately permissive — we reject obvious nonsense, not unusual domains. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

export async function applyContact(input: {
  slug: string;
  firstName: string;
  email: string;
  marketingConsent: boolean;
}): Promise<
  | (ApplyActionSuccess & { claim: GateClaim })
  | ServiceFailure
> {
  const { slug } = input;

  if (!isDatabaseConfigured()) {
    return { ok: false, status: 503, error: "Gates are not configured." };
  }

  const firstName = input.firstName.trim();
  const email = input.email.trim().toLowerCase();

  if (firstName.length === 0 || firstName.length > 100) {
    return { ok: false, status: 400, error: "Enter your first name." };
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { ok: false, status: 400, error: "Enter a valid email address." };
  }
  if (!input.marketingConsent) {
    return {
      ok: false,
      status: 400,
      error: "Join the email list to continue.",
    };
  }

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return { ok: false, status: 404, error: "Gate not found." };

  const updated = await captureContact(gate.id, {
    firstName,
    email,
    marketingConsent: input.marketingConsent,
  });

  const settled = await finish(gate, updated);
  return {
    ...settled,
    claim: { firstName, email },
  };
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
 * progress rather than trusting anything the client sends. Entitlement is tied
 * to the email claim, not a live SoundCloud token, so a fan returning next
 * week still gets their file.
 */
export async function authorizeDownload(input: {
  slug: string;
  claim: GateClaim | null;
}): Promise<DownloadGrant | ServiceFailure> {
  const { slug, claim } = input;

  if (!isDatabaseConfigured()) {
    return { ok: false, status: 503, error: "Gates are not configured." };
  }
  if (!claim) {
    return {
      ok: false,
      status: 401,
      error: "Enter your name and email to download.",
    };
  }

  const gate = await getPublishedGateBySlug(slug);
  if (!gate) return { ok: false, status: 404, error: "Gate not found." };

  const unlock = await getUnlockByEmail(gate.id, claim.email);
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
