import "server-only";

import {
  getSoundcloudAccessToken,
  invalidateSoundcloudAccessToken,
} from "@/lib/soundcloud-auth";
import { fetchWithRetry } from "@/lib/soundcloud-http";
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
 * | follow  | PUT  /me/followings/{user_urn}      | 200/201  |
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
 * (`soundcloud:tracks:123`), while the prose guide shows bare numeric ids. We
 * send the URN and retry once with the numeric id on a 404, so a change on
 * their side does not take the gate down.
 */

const API_BASE = "https://api.soundcloud.com";

export type ActionFailureReason =
  | "unauthorized"
  | "not-found"
  | "rate-limited"
  | "unprocessable"
  | "failed";

export type SoundcloudActionResult =
  | { ok: true }
  | { ok: false; reason: ActionFailureReason; status: number; message?: string };

function classify(status: number): ActionFailureReason {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 404) return "not-found";
  if (status === 429) return "rate-limited";
  if (status === 422) return "unprocessable";
  return "failed";
}

/** Best-effort extraction of SoundCloud's human-readable error message. */
async function errorMessage(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    if (!text) return undefined;
    const parsed = JSON.parse(text) as {
      errors?: { error_message?: string; message?: string }[];
      error?: string;
      message?: string;
    };
    return (
      parsed.errors?.[0]?.error_message ??
      parsed.errors?.[0]?.message ??
      parsed.error ??
      parsed.message ??
      text.slice(0, 200)
    );
  } catch {
    return undefined;
  }
}

type WriteInit = {
  method: "POST" | "PUT";
  body?: string;
  contentType?: string;
};

async function userWrite(
  path: string,
  accessToken: string,
  init: WriteInit,
): Promise<Response> {
  const headers: Record<string, string> = {
    authorization: `OAuth ${accessToken}`,
    accept: "application/json; charset=utf-8",
  };
  if (init.contentType) headers["content-type"] = init.contentType;

  return fetchWithRetry(
    `${API_BASE}${path}`,
    { method: init.method, headers, body: init.body, cache: "no-store" },
    { maxRetries: 2, baseDelayMs: 600 },
  );
}

/**
 * Run a write against the URN path, retrying once against the numeric-id path
 * if the URN form 404s. `expected` lists the statuses that mean success — they
 * differ per endpoint (like returns 200, repost 201, follow either).
 */
async function writeWithUrnFallback(input: {
  urnPath: string;
  idPath: string | null;
  accessToken: string;
  init: WriteInit;
  expected: number[];
}): Promise<SoundcloudActionResult> {
  const { urnPath, idPath, accessToken, init, expected } = input;

  let res = await userWrite(urnPath, accessToken, init);

  if (res.status === 404 && idPath) {
    res = await userWrite(idPath, accessToken, init);
  }

  if (expected.includes(res.status)) return { ok: true };

  return {
    ok: false,
    reason: classify(res.status),
    status: res.status,
    message: await errorMessage(res),
  };
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
  return writeWithUrnFallback({
    urnPath: `/likes/tracks/${target.trackUrn}`,
    idPath: target.trackId ? `/likes/tracks/${target.trackId}` : null,
    accessToken,
    init: { method: "POST" },
    expected: [200, 201, 204],
  });
}

export async function repostTrack(
  accessToken: string,
  target: TrackTarget,
): Promise<SoundcloudActionResult> {
  return writeWithUrnFallback({
    urnPath: `/reposts/tracks/${target.trackUrn}`,
    idPath: target.trackId ? `/reposts/tracks/${target.trackId}` : null,
    accessToken,
    init: { method: "POST" },
    expected: [200, 201, 204],
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
  return writeWithUrnFallback({
    urnPath: `/tracks/${target.trackUrn}/comments`,
    idPath: target.trackId ? `/tracks/${target.trackId}/comments` : null,
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
  return writeWithUrnFallback({
    urnPath: `/me/followings/${target.artistUserUrn}`,
    idPath: null,
    accessToken,
    init: { method: "PUT" },
    expected: [200, 201, 204],
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
    invalidateSoundcloudAccessToken();
    token = await getSoundcloudAccessToken();
    if (!token) return { ok: false, error: "Could not authenticate with SoundCloud." };
    res = await request(token);
  }

  if (res.status === 404) {
    return { ok: false, error: "SoundCloud could not find that URL." };
  }
  if (!res.ok) {
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
