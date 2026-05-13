import "server-only";

import {
  getSoundcloudAccessToken,
  hasSoundcloudCredentials,
  invalidateSoundcloudAccessToken,
} from "@/lib/soundcloud-auth";
import { fetchWithRetry } from "@/lib/soundcloud-http";
import type {
  SoundcloudStats,
  SoundcloudTrack,
} from "@/lib/soundcloud-types";

/**
 * Fetches public stats for a SoundCloud profile.
 *
 * Primary path (used whenever `SOUNDCLOUD_CLIENT_ID` and
 * `SOUNDCLOUD_CLIENT_SECRET` are configured):
 *   - OAuth 2.1 client_credentials → `https://api.soundcloud.com`
 *   - `/resolve?url=https://soundcloud.com/<permalink>` for the user record
 *   - `/users/:id/tracks?linked_partitioning=true` for the catalog
 *
 * Fallback path (no credentials in env — useful for local dev):
 *   - Scrape the `window.__sc_hydration` JSON island from the public profile
 *     page. This is the same data SoundCloud's own web app ships to the
 *     browser, so it's public and unauthenticated.
 *
 * The function never throws and always returns `SoundcloudStats | null` so
 * a Server Component can render unconditionally.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; WompEPK/1.0; +https://djwomp.com) Chrome/124";

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBool(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

/**
 * Track field shape. Notes:
 *   - The official API uses `favoritings_count`.
 *   - `api-v2` (used by the SoundCloud web app and exposed via the hydration
 *     fallback) uses `likes_count`.
 * We accept either and normalize to a single `likesCount`.
 */
type RawTrack = {
  id?: number;
  title?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  playback_count?: number | null;
  likes_count?: number | null;
  favoritings_count?: number | null;
  reposts_count?: number | null;
  comment_count?: number | null;
  duration?: number | null;
  created_at?: string | null;
  display_date?: string | null;
};

function normalizeTrack(raw: RawTrack): SoundcloudTrack | null {
  if (!raw || typeof raw.id !== "number" || typeof raw.title !== "string") {
    return null;
  }
  return {
    id: raw.id,
    title: raw.title,
    permalinkUrl: raw.permalink_url ?? "",
    artworkUrl: raw.artwork_url ?? null,
    playbackCount: asNumber(raw.playback_count),
    likesCount: asNumber(raw.favoritings_count ?? raw.likes_count),
    repostsCount: asNumber(raw.reposts_count),
    commentCount: asNumber(raw.comment_count),
    durationMs: asNumber(raw.duration),
    createdAt: raw.display_date ?? raw.created_at ?? null,
  };
}

function aggregateTracks(rawTracks: RawTrack[]) {
  const tracks = rawTracks
    .map(normalizeTrack)
    .filter((t): t is SoundcloudTrack => t !== null);

  const totalPlays = tracks.reduce((acc, t) => acc + t.playbackCount, 0);
  const totalTrackLikes = tracks.reduce((acc, t) => acc + t.likesCount, 0);
  const totalTrackReposts = tracks.reduce((acc, t) => acc + t.repostsCount, 0);

  const topTrack =
    tracks.length > 0
      ? tracks.reduce((best, t) =>
          t.playbackCount > best.playbackCount ? t : best,
        )
      : null;

  const recentTracks = tracks
    .slice()
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      return 0;
    })
    .slice(0, 5);

  return { tracks, totalPlays, totalTrackLikes, totalTrackReposts, topTrack, recentTracks };
}

// ---------------------------------------------------------------------------
// Path 1: Official SoundCloud API
// ---------------------------------------------------------------------------

const API_BASE = "https://api.soundcloud.com";

type RawApiUser = {
  kind?: string;
  id?: number;
  username?: string;
  full_name?: string;
  description?: string;
  city?: string;
  country?: string;
  country_code?: string;
  verified?: boolean;
  avatar_url?: string;
  permalink?: string;
  permalink_url?: string;
  followers_count?: number;
  followings_count?: number;
  track_count?: number;
  playlist_count?: number;
  likes_count?: number;
  public_favorites_count?: number;
};

/**
 * Strip any tracking query params SoundCloud adds to `permalink_url`. The
 * official API tends to return URLs with `?utm_*` parameters appended — we
 * want a clean public URL for the EPK to link to.
 */
function cleanPermalinkUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

async function apiFetch(
  pathOrUrl: string,
  accessToken: string,
  revalidateSeconds: number,
): Promise<Response> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  // 429 retries with bounded exponential backoff per the SoundCloud API
  // rate-limit guidance. We honor Retry-After when present.
  return fetchWithRetry(
    url,
    {
      headers: {
        authorization: `OAuth ${accessToken}`,
        accept: "application/json; charset=utf-8",
        "user-agent": USER_AGENT,
      },
      next: { revalidate: revalidateSeconds },
    },
    { maxRetries: 3, baseDelayMs: 500 },
  );
}

async function fetchAllTracksViaApi(
  userId: number,
  accessToken: string,
  revalidateSeconds: number,
): Promise<RawTrack[]> {
  const initial =
    `/users/${userId}/tracks` +
    `?linked_partitioning=true&limit=200&access=playable,preview`;
  let next: string | null = initial;
  const out: RawTrack[] = [];
  const maxPages = 20;

  for (let page = 0; page < maxPages && next; page++) {
    const res = await apiFetch(next, accessToken, revalidateSeconds);
    if (!res.ok) break;
    const json: { collection?: RawTrack[]; next_href?: string | null } =
      await res.json();
    if (Array.isArray(json.collection)) out.push(...json.collection);
    next =
      typeof json.next_href === "string" && json.next_href.length > 0
        ? json.next_href
        : null;
  }
  return out;
}

async function fetchViaApi(
  permalink: string,
  profileUrl: string,
  revalidateSeconds: number,
): Promise<SoundcloudStats | null> {
  let accessToken = await getSoundcloudAccessToken();
  if (!accessToken) return null;

  let resolveRes = await apiFetch(
    `/resolve?url=${encodeURIComponent(profileUrl)}`,
    accessToken,
    revalidateSeconds,
  );

  // If the cached token went stale between checks, drop it and try once more.
  if (resolveRes.status === 401) {
    invalidateSoundcloudAccessToken();
    accessToken = await getSoundcloudAccessToken();
    if (!accessToken) return null;
    resolveRes = await apiFetch(
      `/resolve?url=${encodeURIComponent(profileUrl)}`,
      accessToken,
      revalidateSeconds,
    );
  }
  if (!resolveRes.ok) return null;

  const user = (await resolveRes.json()) as RawApiUser;
  if (user.kind !== undefined && user.kind !== "user") {
    // Defensive: /resolve also resolves tracks and playlists.
    return null;
  }
  if (typeof user.id !== "number") return null;

  let rawTracks: RawTrack[] = [];
  try {
    rawTracks = await fetchAllTracksViaApi(
      user.id,
      accessToken,
      revalidateSeconds,
    );
  } catch {
    rawTracks = [];
  }
  const agg = aggregateTracks(rawTracks);

  return {
    permalink,
    username: asString(user.username) ?? permalink,
    fullName: asString(user.full_name),
    description: asString(user.description),
    city: asString(user.city),
    // Official API returns country full name; we prefer code if hydration
    // ever fills it in, but display falls back to either.
    countryCode: asString(user.country_code) ?? asString(user.country),
    verified: asBool(user.verified),
    avatarUrl: asString(user.avatar_url),
    profileUrl:
      cleanPermalinkUrl(user.permalink_url) ?? profileUrl,
    followersCount: asNumber(user.followers_count),
    followingsCount: asNumber(user.followings_count),
    trackCount: asNumber(user.track_count),
    playlistCount: asNumber(user.playlist_count),
    likesGivenCount: asNumber(
      user.public_favorites_count ?? user.likes_count,
    ),
    totalPlays: agg.totalPlays,
    totalTrackLikes: agg.totalTrackLikes,
    totalTrackReposts: agg.totalTrackReposts,
    topTrack: agg.topTrack,
    recentTracks: agg.recentTracks,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Path 2: Public profile hydration scrape (no-credentials fallback)
// ---------------------------------------------------------------------------

/** Read the inline `window.__sc_hydration` array from a profile page. */
function extractHydration(html: string): unknown[] | null {
  const match = html.match(
    /window\.__sc_hydration\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/,
  );
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type HydrationEntry = { hydratable?: string; data?: Record<string, unknown> };

function findEntry(
  hydration: unknown[],
  ...names: string[]
): Record<string, unknown> | null {
  for (const entry of hydration as HydrationEntry[]) {
    if (
      entry &&
      typeof entry === "object" &&
      entry.hydratable &&
      names.includes(entry.hydratable)
    ) {
      return (entry.data as Record<string, unknown>) ?? null;
    }
  }
  return null;
}

async function fetchAllTracksViaHydration(
  userId: number,
  clientId: string,
  revalidateSeconds: number,
): Promise<RawTrack[]> {
  const initial = new URL(
    `https://api-v2.soundcloud.com/users/${userId}/tracks`,
  );
  initial.searchParams.set("limit", "50");
  initial.searchParams.set("client_id", clientId);

  let nextUrl: string | null = initial.toString();
  const out: RawTrack[] = [];
  const maxPages = 20;

  for (let page = 0; page < maxPages && nextUrl; page++) {
    const url: URL = new URL(nextUrl);
    if (!url.searchParams.has("client_id")) {
      url.searchParams.set("client_id", clientId);
    }
    const res = await fetchWithRetry(
      url.toString(),
      {
        headers: { accept: "application/json", "user-agent": USER_AGENT },
        next: { revalidate: revalidateSeconds },
      },
      { maxRetries: 2, baseDelayMs: 500 },
    );
    if (!res.ok) break;
    const json: { collection?: RawTrack[]; next_href?: string | null } =
      await res.json();
    if (Array.isArray(json.collection)) out.push(...json.collection);
    nextUrl =
      typeof json.next_href === "string" && json.next_href.length > 0
        ? json.next_href
        : null;
  }
  return out;
}

async function fetchViaHydration(
  permalink: string,
  profileUrl: string,
  revalidateSeconds: number,
): Promise<SoundcloudStats | null> {
  let html: string;
  try {
    const res = await fetchWithRetry(
      profileUrl,
      {
        headers: {
          "user-agent": USER_AGENT,
          "accept-language": "en-US,en;q=0.9",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        next: { revalidate: revalidateSeconds },
      },
      { maxRetries: 2, baseDelayMs: 500 },
    );
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const hydration = extractHydration(html);
  if (!hydration) return null;

  const user = findEntry(hydration, "user", "userPage");
  const apiClient = findEntry(hydration, "apiClient");
  if (!user) return null;

  const clientId = asString(apiClient?.["id"]);
  const userId = asNumber(user["id"]);

  let rawTracks: RawTrack[] = [];
  if (clientId && userId) {
    try {
      rawTracks = await fetchAllTracksViaHydration(
        userId,
        clientId,
        revalidateSeconds,
      );
    } catch {
      rawTracks = [];
    }
  }
  const agg = aggregateTracks(rawTracks);

  return {
    permalink,
    username: asString(user["username"]) ?? permalink,
    fullName: asString(user["full_name"]),
    description: asString(user["description"]),
    city: asString(user["city"]),
    countryCode: asString(user["country_code"]),
    verified: asBool(user["verified"]),
    avatarUrl: asString(user["avatar_url"]),
    profileUrl: cleanPermalinkUrl(asString(user["permalink_url"])) ?? profileUrl,
    followersCount: asNumber(user["followers_count"]),
    followingsCount: asNumber(user["followings_count"]),
    trackCount: asNumber(user["track_count"]),
    playlistCount: asNumber(user["playlist_count"]),
    likesGivenCount: asNumber(user["likes_count"]),
    totalPlays: agg.totalPlays,
    totalTrackLikes: agg.totalTrackLikes,
    totalTrackReposts: agg.totalTrackReposts,
    topTrack: agg.topTrack,
    recentTracks: agg.recentTracks,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export type FetchSoundcloudStatsOptions = {
  /** Profile permalink, e.g. `wompbass` for soundcloud.com/wompbass. */
  permalink: string;
  /** Cache duration for the underlying fetches (seconds). Defaults to 30 min. */
  revalidateSeconds?: number;
};

export async function fetchSoundcloudStats(
  options: FetchSoundcloudStatsOptions,
): Promise<SoundcloudStats | null> {
  const { permalink, revalidateSeconds = 60 * 30 } = options;
  const profileUrl = `https://soundcloud.com/${encodeURIComponent(permalink)}`;

  if (hasSoundcloudCredentials()) {
    try {
      const viaApi = await fetchViaApi(permalink, profileUrl, revalidateSeconds);
      if (viaApi) return viaApi;
    } catch {
      // Fall through to the hydration fallback below.
    }
  }
  return fetchViaHydration(permalink, profileUrl, revalidateSeconds);
}
