import "server-only";

import type {
  SoundcloudStats,
  SoundcloudTrack,
} from "@/lib/soundcloud-types";

/**
 * SoundCloud closed public API registration years ago, so there is no clean
 * way to get a `client_id`. However, the public profile page at
 * `https://soundcloud.com/<permalink>` is server-rendered with a JSON island
 * (`window.__sc_hydration = [...]`) that contains the full user record —
 * follower count, track count, playlist count, etc. — *and* an `apiClient.id`
 * value that the web app itself uses to call the documented `api-v2`
 * endpoints. Both are public, unauthenticated data; we read them server-side
 * so we never expose extra requests to the browser.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; WompEPK/1.0; +https://djwomp.com) Chrome/124";

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

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBool(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

type RawTrack = {
  id?: number;
  title?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  playback_count?: number | null;
  likes_count?: number | null;
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
    likesCount: asNumber(raw.likes_count),
    repostsCount: asNumber(raw.reposts_count),
    commentCount: asNumber(raw.comment_count),
    durationMs: asNumber(raw.duration),
    createdAt: raw.display_date ?? raw.created_at ?? null,
  };
}

/**
 * Fetch all of the artist's tracks via the same `api-v2.soundcloud.com`
 * endpoint that the SoundCloud web player itself uses, paginating until the
 * `next_href` cursor runs out. We cap pages defensively so a misbehaving
 * cursor can't loop forever.
 */
async function fetchAllTracks(
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
    const res: Response = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        "user-agent": USER_AGENT,
      },
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) break;
    const json: { collection?: RawTrack[]; next_href?: string | null } =
      await res.json();
    if (Array.isArray(json.collection)) {
      out.push(...json.collection);
    }
    nextUrl =
      typeof json.next_href === "string" && json.next_href.length > 0
        ? json.next_href
        : null;
  }
  return out;
}

export type FetchSoundcloudStatsOptions = {
  /** Profile permalink, e.g. `wompbass` for soundcloud.com/wompbass. */
  permalink: string;
  /** Cache duration for the underlying fetches (seconds). Defaults to 30 min. */
  revalidateSeconds?: number;
};

/**
 * Returns aggregated SoundCloud stats for a profile, or `null` if the page
 * could not be fetched / parsed. Designed to be safe to call from a Server
 * Component during render — never throws.
 */
export async function fetchSoundcloudStats(
  options: FetchSoundcloudStatsOptions,
): Promise<SoundcloudStats | null> {
  const { permalink, revalidateSeconds = 60 * 30 } = options;
  const profileUrl = `https://soundcloud.com/${encodeURIComponent(permalink)}`;

  let html: string;
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "user-agent": USER_AGENT,
        "accept-language": "en-US,en;q=0.9",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: revalidateSeconds },
    });
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

  let allTracks: RawTrack[] = [];
  if (clientId && userId) {
    try {
      allTracks = await fetchAllTracks(userId, clientId, revalidateSeconds);
    } catch {
      allTracks = [];
    }
  }

  const normalizedTracks = allTracks
    .map(normalizeTrack)
    .filter((t): t is SoundcloudTrack => t !== null);

  const totalPlays = normalizedTracks.reduce(
    (acc, t) => acc + t.playbackCount,
    0,
  );
  const totalTrackLikes = normalizedTracks.reduce(
    (acc, t) => acc + t.likesCount,
    0,
  );
  const totalTrackReposts = normalizedTracks.reduce(
    (acc, t) => acc + t.repostsCount,
    0,
  );

  const topTrack =
    normalizedTracks.length > 0
      ? normalizedTracks.reduce((best, t) =>
          t.playbackCount > best.playbackCount ? t : best,
        )
      : null;

  const recentTracks = normalizedTracks
    .slice()
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      return 0;
    })
    .slice(0, 5);

  return {
    permalink,
    username: asString(user["username"]) ?? permalink,
    fullName: asString(user["full_name"]),
    description: asString(user["description"]),
    city: asString(user["city"]),
    countryCode: asString(user["country_code"]),
    verified: asBool(user["verified"]),
    avatarUrl: asString(user["avatar_url"]),
    profileUrl: asString(user["permalink_url"]) ?? profileUrl,
    followersCount: asNumber(user["followers_count"]),
    followingsCount: asNumber(user["followings_count"]),
    trackCount: asNumber(user["track_count"]),
    playlistCount: asNumber(user["playlist_count"]),
    likesGivenCount: asNumber(user["likes_count"]),
    totalPlays,
    totalTrackLikes,
    totalTrackReposts,
    topTrack,
    recentTracks,
    fetchedAt: new Date().toISOString(),
  };
}
