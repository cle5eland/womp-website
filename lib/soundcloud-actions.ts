import "server-only";

import {
  getSoundcloudAccessToken,
  invalidateSoundcloudAccessToken,
} from "@/lib/soundcloud-auth";
import {
  fetchWithRetry,
  logSoundcloud,
  readSoundcloudErrorBody,
  soundcloudResponseMeta,
} from "@/lib/soundcloud-http";
import { isMockMode } from "@/lib/soundcloud-user-auth";
import type { GateActionKind } from "@/lib/gate-types";

/**
 * The four write actions a download gate can perform on a fan's behalf, plus
 * the public track lookup the admin UI uses.
 *
 * | Action  | Endpoint                            | Success  |
 * | ------- | ----------------------------------- | -------- |
 * | like    | POST /likes/tracks/{urn}            | 200      |
 * | repost  | POST /reposts/tracks/{urn}          | 201      |
 * | comment | POST /tracks/{urn}/comments         | 201      |
 * | follow  | PUT  /me/followings/{user_id}       | 200/201  |
 *
 * Two things worth knowing before changing this file:
 *
 *   - Every write needs a *user* token from `soundcloud-user-auth.ts`. The
 *     app-level token in `soundcloud-auth.ts` will 401 on all of them.
 *   - The comment endpoint is NOT idempotent — each call posts another comment.
 *     Callers must consult `commented_at` on the unlock row first. This module
 *     will happily post duplicates if asked to.
 *
 * Ids: the OpenAPI spec describes these paths in terms of URNs
 * (`soundcloud:tracks:123`), while the prose guide shows bare numeric ids.
 * Colons in an unencoded URN have also produced 400s from their gateway, which
 * we used to surface as a generic 502. We percent-encode the URN, send it, and
 * retry with the numeric id on 400/401/404 so either form keeps the gate up.
 *
 * Follow is flipped: the guide's `PUT /me/followings/:user_id` is numeric, and
 * that is the path we try first.
 */

const API_BASE = "https://api.soundcloud.com";

export type ActionFailureReason =
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "rate-limited"
  | "unprocessable"
  | "failed";

export type SoundcloudActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: ActionFailureReason;
      status: number;
      message?: string;
      path?: string;
    };

function classify(status: number): ActionFailureReason {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 429) return "rate-limited";
  if (status === 400 || status === 422) return "unprocessable";
  return "failed";
}

/** Pull the trailing numeric id out of a URN or a bare-digit string. */
export function numericIdFromUrn(urn: string): number | null {
  const trimmed = urn.trim();
  if (/^\d+$/.test(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  const match = trimmed.match(/:(\d+)$/);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function isSameSoundcloudUser(a: string, b: string): boolean {
  if (a === b) return true;
  const idA = numericIdFromUrn(a);
  const idB = numericIdFromUrn(b);
  return idA != null && idA === idB;
}

/**
 * SoundCloud rejects some writes that, for a download gate, already mean the
 * fan has done the thing: they follow the artist, they already reposted, or
 * they *are* the artist (you cannot follow or repost yourself). Treating those
 * as success is what lets the artist test their own gate and lets existing
 * followers through.
 */
function isAlreadySatisfied(status: number, message?: string): boolean {
  if (status === 409) return true;
  const text = (message ?? "").toLowerCase();
  if (!text) return false;
  if (
    /\balready\b/.test(text) &&
    /\b(follow|repost|like|favorite)/.test(text)
  ) {
    return true;
  }
  return (
    /cannot follow yourself/.test(text) ||
    /can't follow yourself/.test(text) ||
    /cannot repost your own/.test(text) ||
    /can't repost your own/.test(text) ||
    /repost your own (track|sound)/.test(text)
  );
}

type WriteInit = {
  method: "POST" | "PUT";
  body?: string;
  contentType?: string;
};

const WRITE_TIMEOUT_MS = 5_000;
/** Like/repost/follow are effectively idempotent; a 5xx after a silent success
 *  is safer to retry than to fail the fan. Comments are not. */
const IDEMPOTENT_RETRY = [429, 500, 502, 503, 504];
/** URN vs numeric-id disagreement (and unencoded-colon 400s) show up as these. */
const ID_FALLBACK_STATUSES = new Set([400, 401, 404, 500, 502, 503]);

async function userWrite(
  path: string,
  accessToken: string,
  init: WriteInit,
  retryableStatuses: number[] = [429],
): Promise<Response> {
  const headers: Record<string, string> = {
    authorization: `OAuth ${accessToken}`,
    accept: "application/json; charset=utf-8",
  };
  if (init.contentType) headers["content-type"] = init.contentType;

  try {
    return await fetchWithRetry(
      `${API_BASE}${path}`,
      { method: init.method, headers, body: init.body, cache: "no-store" },
      {
        maxRetries: 1,
        baseDelayMs: 400,
        maxTotalWaitMs: 8_000,
        retryableStatuses,
        timeoutMs: WRITE_TIMEOUT_MS,
      },
    );
  } catch (err) {
    const error = err as Error;
    logSoundcloud("error", "write network error", {
      method: init.method,
      path,
      name: error.name,
      message: error.message,
    });
    return new Response(JSON.stringify({ error: "network" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}

function logWriteOutcome(input: {
  event: "write failed" | "write already satisfied" | "write fallback";
  level: "warn" | "error";
  action: string;
  method: string;
  path: string;
  status: number;
  message?: string;
  body?: string;
  reason?: ActionFailureReason;
  fallbackPath?: string;
  meta?: Record<string, unknown>;
}): void {
  logSoundcloud(input.level, input.event, {
    action: input.action,
    method: input.method,
    path: input.path,
    status: input.status,
    message: input.message,
    body: input.body,
    reason: input.reason,
    fallbackPath: input.fallbackPath,
    ...input.meta,
  });
}

/**
 * Run a write against `primaryPath`, retrying once against `fallbackPath` when
 * the first status looks like an id-format miss rather than a real rejection.
 * `expected` lists the statuses that mean success — they differ per endpoint
 * (like returns 200, repost 201, follow either).
 */
async function writeWithIdFallback(input: {
  action: GateActionKind;
  primaryPath: string;
  fallbackPath: string | null;
  accessToken: string;
  init: WriteInit;
  expected: number[];
  retryableStatuses?: number[];
  /** Follow: an empty 400 after a numeric id is "already following". */
  empty400IsDone?: boolean;
}): Promise<SoundcloudActionResult> {
  const {
    action,
    primaryPath,
    fallbackPath,
    accessToken,
    init,
    expected,
    retryableStatuses,
    empty400IsDone,
  } = input;

  const attempt = (path: string) =>
    userWrite(path, accessToken, init, retryableStatuses ?? [429]);

  const asResult = (
    path: string,
    status: number,
    message?: string,
  ): SoundcloudActionResult => {
    if (expected.includes(status)) return { ok: true };
    if (isAlreadySatisfied(status, message)) return { ok: true };
    if (empty400IsDone && status === 400 && !message) return { ok: true };
    return {
      ok: false,
      reason: classify(status),
      status,
      message,
      path,
    };
  };

  const readFailure = async (res: Response, path: string) => {
    if (expected.includes(res.status)) {
      return { message: undefined as string | undefined, body: undefined as string | undefined, meta: soundcloudResponseMeta(res), path, status: res.status };
    }
    const { message, body } = await readSoundcloudErrorBody(res);
    return { message, body, meta: soundcloudResponseMeta(res), path, status: res.status };
  };

  const first = await readFailure(await attempt(primaryPath), primaryPath);
  const firstResult = asResult(first.path, first.status, first.message);
  if (firstResult.ok) {
    if (!expected.includes(first.status)) {
      logWriteOutcome({
        event: "write already satisfied",
        level: "warn",
        action,
        method: init.method,
        path: first.path,
        status: first.status,
        message: first.message,
        body: first.body,
        meta: first.meta,
      });
    }
    return firstResult;
  }

  if (!fallbackPath || !ID_FALLBACK_STATUSES.has(first.status)) {
    logWriteOutcome({
      event: "write failed",
      level: first.status >= 500 ? "error" : "warn",
      action,
      method: init.method,
      path: first.path,
      status: first.status,
      message: first.message,
      body: first.body,
      reason: firstResult.reason,
      meta: first.meta,
    });
    return firstResult;
  }

  logWriteOutcome({
    event: "write fallback",
    level: "warn",
    action,
    method: init.method,
    path: first.path,
    status: first.status,
    message: first.message,
    body: first.body,
    fallbackPath,
    meta: first.meta,
  });

  const second = await readFailure(await attempt(fallbackPath), fallbackPath);
  const secondResult = asResult(second.path, second.status, second.message);
  if (secondResult.ok) {
    if (!expected.includes(second.status)) {
      logWriteOutcome({
        event: "write already satisfied",
        level: "warn",
        action,
        method: init.method,
        path: second.path,
        status: second.status,
        message: second.message,
        body: second.body,
        meta: second.meta,
      });
    }
    return secondResult;
  }

  logWriteOutcome({
    event: "write failed",
    level: second.status >= 500 ? "error" : "warn",
    action,
    method: init.method,
    path: second.path,
    status: second.status,
    message: second.message,
    body: second.body,
    reason: secondResult.reason,
    meta: second.meta,
  });
  return secondResult;
}

// ---------------------------------------------------------------------------
// Individual actions
// ---------------------------------------------------------------------------

export type TrackTarget = { trackUrn: string; trackId: number };
export type ArtistTarget = { artistUserUrn: string };

/**
 * Like a track. Repeating this on an already-liked track still returns success,
 * so a fan who liked the song before finding the gate is not stuck.
 */
export async function likeTrack(
  accessToken: string,
  target: TrackTarget,
): Promise<SoundcloudActionResult> {
  return writeWithIdFallback({
    action: "like",
    primaryPath: `/likes/tracks/${encodeURIComponent(target.trackUrn)}`,
    fallbackPath: target.trackId ? `/likes/tracks/${target.trackId}` : null,
    accessToken,
    init: { method: "POST" },
    expected: [200, 201, 204],
    retryableStatuses: IDEMPOTENT_RETRY,
  });
}

export async function repostTrack(
  accessToken: string,
  target: TrackTarget,
): Promise<SoundcloudActionResult> {
  return writeWithIdFallback({
    action: "repost",
    primaryPath: `/reposts/tracks/${encodeURIComponent(target.trackUrn)}`,
    fallbackPath: target.trackId ? `/reposts/tracks/${target.trackId}` : null,
    accessToken,
    init: { method: "POST" },
    expected: [200, 201, 204],
    retryableStatuses: IDEMPOTENT_RETRY,
  });
}

/**
 * Post a comment. `body` must be text the fan typed themselves — the API terms
 * only permit comments the user "specifically and deliberately" initiated, so
 * callers must never synthesise or template this.
 *
 * No `timestamp` is sent, which posts a general comment rather than one pinned
 * to a position in the waveform.
 */
export async function commentOnTrack(
  accessToken: string,
  target: TrackTarget,
  body: string,
): Promise<SoundcloudActionResult> {
  const payload = JSON.stringify({ comment: { body } });
  return writeWithIdFallback({
    action: "comment",
    primaryPath: `/tracks/${encodeURIComponent(target.trackUrn)}/comments`,
    fallbackPath: target.trackId ? `/tracks/${target.trackId}/comments` : null,
    accessToken,
    init: {
      method: "POST",
      body: payload,
      contentType: "application/json; charset=utf-8",
    },
    expected: [200, 201],
  });
}

/**
 * Follow the track's artist. A 422 here is expected and benign in one case:
 * SoundCloud caps how many accounts a user may follow, and says so in the
 * response message.
 */
export async function followArtist(
  accessToken: string,
  target: ArtistTarget,
): Promise<SoundcloudActionResult> {
  const userId = numericIdFromUrn(target.artistUserUrn);
  // Guide documents numeric `/me/followings/:user_id`. Unencoded URNs have
  // 400'd in production (surfaced to the fan as a 502), so numeric goes first.
  const numericPath = userId != null ? `/me/followings/${userId}` : null;
  const urnPath = `/me/followings/${encodeURIComponent(target.artistUserUrn)}`;

  return writeWithIdFallback({
    action: "follow",
    primaryPath: numericPath ?? urnPath,
    fallbackPath: numericPath ? urnPath : null,
    accessToken,
    init: { method: "PUT" },
    expected: [200, 201, 204],
    retryableStatuses: IDEMPOTENT_RETRY,
    empty400IsDone: true,
  });
}

/** Dispatch by action kind. Mock mode short-circuits every network call. */
export async function performAction(input: {
  action: GateActionKind;
  accessToken: string;
  track: TrackTarget;
  artist: ArtistTarget;
  commentBody?: string;
}): Promise<SoundcloudActionResult> {
  if (isMockMode()) return { ok: true };

  switch (input.action) {
    case "like":
      return likeTrack(input.accessToken, input.track);
    case "repost":
      return repostTrack(input.accessToken, input.track);
    case "follow":
      return followArtist(input.accessToken, input.artist);
    case "comment": {
      const body = input.commentBody?.trim();
      if (!body) {
        return { ok: false, reason: "unprocessable", status: 400 };
      }
      return commentOnTrack(input.accessToken, input.track, body);
    }
    default: {
      const exhaustive: never = input.action;
      throw new Error(`unhandled action: ${String(exhaustive)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Track resolution (public data, app-level token)
// ---------------------------------------------------------------------------

export type ResolvedTrack = {
  trackUrn: string;
  trackId: number;
  title: string;
  permalinkUrl: string;
  artworkUrl: string | null;
  artistUserUrn: string;
  artistUsername: string;
  /** Whether the uploader left comments enabled — a gate requiring a comment
   *  on a track with comments off would be unwinnable. */
  commentable: boolean;
};

type RawResolvedTrack = {
  kind?: string;
  id?: number;
  urn?: string;
  title?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  commentable?: boolean;
  user?: {
    id?: number;
    urn?: string;
    username?: string;
    permalink?: string;
  };
};

export type ResolveResult =
  | { ok: true; track: ResolvedTrack }
  | { ok: false; error: string };

/**
 * Turn an admin-pasted `soundcloud.com/...` track URL into the ids the gate
 * needs. Uses the app-level client_credentials token, since this is public
 * data and no fan is involved yet.
 */
export async function resolveTrackByUrl(url: string): Promise<ResolveResult> {
  const trimmed = url.trim();
  if (!/^https?:\/\/(www\.|m\.)?soundcloud\.com\//i.test(trimmed)) {
    return { ok: false, error: "Not a soundcloud.com URL." };
  }

  if (isMockMode()) return { ok: true, track: mockResolve(trimmed) };

  let token = await getSoundcloudAccessToken();
  if (!token) {
    return {
      ok: false,
      error:
        "SoundCloud app credentials are not configured (SOUNDCLOUD_CLIENT_ID / SOUNDCLOUD_CLIENT_SECRET).",
    };
  }

  const request = (accessToken: string) =>
    fetchWithRetry(
      `${API_BASE}/resolve?url=${encodeURIComponent(trimmed)}`,
      {
        headers: {
          authorization: `OAuth ${accessToken}`,
          accept: "application/json; charset=utf-8",
        },
        cache: "no-store",
      },
      { maxRetries: 2, baseDelayMs: 500 },
    );

  let res = await request(token);
  if (res.status === 401) {
    logSoundcloud("warn", "resolve unauthorized, refreshing app token", {
      method: "GET",
      path: "/resolve",
      ...soundcloudResponseMeta(res),
    });
    invalidateSoundcloudAccessToken();
    token = await getSoundcloudAccessToken();
    if (!token) return { ok: false, error: "Could not authenticate with SoundCloud." };
    res = await request(token);
  }

  if (res.status === 404) {
    return { ok: false, error: "SoundCloud could not find that URL." };
  }
  if (!res.ok) {
    const { message, body } = await readSoundcloudErrorBody(res);
    logSoundcloud(res.status >= 500 ? "error" : "warn", "resolve failed", {
      method: "GET",
      path: "/resolve",
      url: trimmed,
      message,
      body,
      ...soundcloudResponseMeta(res),
    });
    return { ok: false, error: `SoundCloud returned ${res.status}.` };
  }

  const raw = (await res.json()) as RawResolvedTrack;

  // /resolve also resolves users and playlists; a gate needs a track.
  if (raw.kind && raw.kind !== "track") {
    return {
      ok: false,
      error: `That URL is a ${raw.kind}, not a track. Paste a link to a single track.`,
    };
  }
  if (typeof raw.id !== "number" || typeof raw.title !== "string") {
    return { ok: false, error: "Unexpected response from SoundCloud." };
  }

  const artistUserUrn =
    raw.user?.urn ??
    (typeof raw.user?.id === "number" ? `soundcloud:users:${raw.user.id}` : null);
  if (!artistUserUrn) {
    return { ok: false, error: "Could not determine the track's artist." };
  }

  return {
    ok: true,
    track: {
      trackUrn: raw.urn ?? `soundcloud:tracks:${raw.id}`,
      trackId: raw.id,
      title: raw.title,
      permalinkUrl: raw.permalink_url ?? trimmed,
      artworkUrl: raw.artwork_url ?? null,
      artistUserUrn,
      artistUsername: raw.user?.username ?? raw.user?.permalink ?? "unknown",
      commentable: raw.commentable !== false,
    },
  };
}

function mockResolve(url: string): ResolvedTrack {
  const slug = url.replace(/\/+$/, "").split("/").pop() || "mock-track";
  return {
    trackUrn: "soundcloud:tracks:999999999",
    trackId: 999999999,
    title: slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    permalinkUrl: url,
    artworkUrl: null,
    artistUserUrn: "soundcloud:users:111111",
    artistUsername: "womp",
    commentable: true,
  };
}
