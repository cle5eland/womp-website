import "server-only";

/**
 * Spotify integration. Two complementary sources:
 *
 *  1. Official Web API (Client Credentials flow) — used for things the
 *     documented API exposes: artist profile, followers, genres, top tracks
 *     with names/images/preview URLs. Needs SPOTIFY_CLIENT_ID +
 *     SPOTIFY_CLIENT_SECRET.
 *
 *  2. Internal `api-partner.spotify.com` GraphQL ("Pathfinder") — used only
 *     for the two numbers the public API does NOT surface: monthly listeners
 *     and per-track playcounts (which we sum into a "total tracked streams"
 *     figure). It's reached with an anonymous bearer token extracted from the
 *     public embed page — no user login or scope needed. This is undocumented,
 *     so we treat it as best-effort: any failure leaves those fields `null`
 *     and the UI degrades to the embed + official-API data.
 *
 * Everything runs server-side and is wrapped with `unstable_cache` so the
 * landing page doesn't refetch on every request.
 */

import { unstable_cache } from "next/cache";

const DEFAULT_ARTIST_ID = "64XV9aZxwoLuxf9tgvu9Pb";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const PARTNER_API = "https://api-partner.spotify.com/pathfinder/v1/query";
const EMBED_URL = (id: string) => `https://open.spotify.com/embed/artist/${id}`;

const FETCH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// The persistedQuery hash for `queryArtistOverview`. Spotify rotates these
// occasionally; if the partner call starts 400ing, refresh this from a
// network capture of open.spotify.com. We catch the error either way.
const ARTIST_OVERVIEW_SHA =
  "35648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497";

export const SPOTIFY_ARTIST_ID =
  process.env.SPOTIFY_ARTIST_ID || DEFAULT_ARTIST_ID;

export const SPOTIFY_ARTIST_URL = `https://open.spotify.com/artist/${SPOTIFY_ARTIST_ID}`;

export const SPOTIFY_ARTIST_EMBED_SRC = `https://open.spotify.com/embed/artist/${SPOTIFY_ARTIST_ID}?utm_source=generator&theme=0`;

// ---------- types exposed to UI components ----------

export type SpotifyImage = { url: string; width: number; height: number };

export type SpotifyArtist = {
  id: string;
  name: string;
  url: string;
  followers: number;
  genres: string[];
  popularity: number;
  image: SpotifyImage | null;
};

export type SpotifyTopTrack = {
  id: string;
  name: string;
  url: string;
  durationMs: number;
  previewUrl: string | null;
  explicit: boolean;
  album: {
    name: string;
    image: string | null;
    releaseDate: string;
  };
  /** Lifetime playcount from partner API, or null if unavailable. */
  playcount: number | null;
};

export type SpotifyStatsBundle = {
  monthlyListeners: number | null;
  followers: number;
  /** Sum of playcounts across the top-tracks payload, or null if unavailable. */
  totalTrackedStreams: number | null;
};

export type SpotifyArtistData = {
  artist: SpotifyArtist;
  topTracks: SpotifyTopTrack[];
  stats: SpotifyStatsBundle;
  /** When all server-side data is unavailable, UI falls back to plain embed. */
  hasLiveData: boolean;
  /** ISO timestamp (UTC). Use a fixed formatter on the client. */
  fetchedAt: string;
  /** Pre-formatted UTC string safe to render in SSR + hydration. */
  fetchedAtLabel: string;
};

// ---------- App (server) token caching ----------

let appTokenCache: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  const now = Date.now();
  if (appTokenCache && appTokenCache.expiresAt > now + 30_000) {
    return appTokenCache.token;
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify credentials missing: set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET",
    );
  }
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Spotify token request failed: ${res.status} ${await res.text()}`,
    );
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  appTokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in - 30) * 1000,
  };
  return json.access_token;
}

async function spotifyFetch<T>(path: string, market = "US"): Promise<T> {
  const token = await getAppToken();
  const sep = path.includes("?") ? "&" : "?";
  const url = `${SPOTIFY_API}${path}${sep}market=${market}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Spotify ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// ---------- Anonymous (partner) token ----------

let anonTokenCache: { token: string; expiresAt: number } | null = null;

async function getAnonToken(artistId: string): Promise<string | null> {
  const now = Date.now();
  if (anonTokenCache && anonTokenCache.expiresAt > now + 30_000) {
    return anonTokenCache.token;
  }
  try {
    const html = await fetch(EMBED_URL(artistId), {
      headers: { "User-Agent": FETCH_UA },
      // Tokens are short-lived; let it cache briefly but refresh often.
      next: { revalidate: 300 },
    }).then((r) => (r.ok ? r.text() : ""));
    if (!html) return null;

    const match = html.match(/"accessToken":"([^"]+)"/);
    const expMatch = html.match(/"accessTokenExpirationTimestampMs":(\d+)/);
    if (!match) return null;
    anonTokenCache = {
      token: match[1],
      expiresAt: expMatch ? Number(expMatch[1]) - 30_000 : now + 30 * 60_000,
    };
    return match[1];
  } catch {
    return null;
  }
}

// ---------- Partner GraphQL: queryArtistOverview ----------

type PartnerTrackItem = {
  track: {
    uri: string;
    name: string;
    playcount?: string;
  };
};

type PartnerArtistOverview = {
  data?: {
    artistUnion?: {
      profile?: { name?: string };
      stats?: { monthlyListeners?: number; worldRank?: number };
      discography?: {
        topTracks?: { items?: PartnerTrackItem[] };
      };
    };
  };
};

async function fetchPartnerOverview(
  artistId: string,
): Promise<PartnerArtistOverview | null> {
  const token = await getAnonToken(artistId);
  if (!token) return null;

  const variables = {
    uri: `spotify:artist:${artistId}`,
    locale: "",
    includePrerelease: true,
  };
  const extensions = {
    persistedQuery: { version: 1, sha256Hash: ARTIST_OVERVIEW_SHA },
  };
  const url = new URL(PARTNER_API);
  url.searchParams.set("operationName", "queryArtistOverview");
  url.searchParams.set("variables", JSON.stringify(variables));
  url.searchParams.set("extensions", JSON.stringify(extensions));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "App-Platform": "WebPlayer",
        Accept: "application/json",
        "User-Agent": FETCH_UA,
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PartnerArtistOverview;
  } catch {
    return null;
  }
}

// ---------- Top-level: aggregated artist data ----------

type RawSpotifyArtistResponse = {
  id: string;
  name: string;
  followers: { total: number };
  genres: string[];
  popularity: number;
  images: SpotifyImage[];
  external_urls: { spotify: string };
};

type RawSpotifyTopTracksResponse = {
  tracks: Array<{
    id: string;
    name: string;
    explicit: boolean;
    duration_ms: number;
    preview_url: string | null;
    external_urls: { spotify: string };
    album: {
      name: string;
      release_date: string;
      images: SpotifyImage[];
    };
  }>;
};

async function fetchArtistDataInner(
  artistId: string,
): Promise<SpotifyArtistData> {
  let officialArtist: SpotifyArtist | null = null;
  let officialTopTracks: SpotifyTopTrack[] = [];
  let officialOk = false;
  try {
    const [a, t] = await Promise.all([
      spotifyFetch<RawSpotifyArtistResponse>(`/artists/${artistId}`),
      spotifyFetch<RawSpotifyTopTracksResponse>(
        `/artists/${artistId}/top-tracks`,
      ),
    ]);
    officialArtist = {
      id: a.id,
      name: a.name,
      url: a.external_urls?.spotify ?? `https://open.spotify.com/artist/${a.id}`,
      followers: a.followers?.total ?? 0,
      genres: a.genres ?? [],
      popularity: a.popularity ?? 0,
      image: a.images?.[0] ?? null,
    };
    officialTopTracks = (t.tracks ?? []).map((track) => ({
      id: track.id,
      name: track.name,
      url:
        track.external_urls?.spotify ??
        `https://open.spotify.com/track/${track.id}`,
      durationMs: track.duration_ms,
      previewUrl: track.preview_url,
      explicit: track.explicit,
      album: {
        name: track.album?.name ?? "",
        image: track.album?.images?.[0]?.url ?? null,
        releaseDate: track.album?.release_date ?? "",
      },
      playcount: null,
    }));
    officialOk = true;
  } catch (err) {
    console.warn("[spotify] official API failed:", (err as Error).message);
  }

  // Partner data — best-effort overlay.
  const partner = await fetchPartnerOverview(artistId);
  const au = partner?.data?.artistUnion;
  const monthlyListeners = au?.stats?.monthlyListeners ?? null;
  const partnerTopTracks = au?.discography?.topTracks?.items ?? [];

  // Build a uri -> playcount map.
  const playcountByUri = new Map<string, number>();
  for (const item of partnerTopTracks) {
    const pc = Number(item.track?.playcount ?? NaN);
    if (item.track?.uri && Number.isFinite(pc)) {
      playcountByUri.set(item.track.uri, pc);
    }
  }

  // Overlay playcount onto the official top-track list when possible.
  const topTracks = officialTopTracks.map((t) => ({
    ...t,
    playcount: playcountByUri.get(`spotify:track:${t.id}`) ?? null,
  }));

  // Pick the best "total streams" we can muster:
  //   - sum of overlaid playcounts (official list)
  //   - else sum of all partner top-track playcounts
  let totalTrackedStreams: number | null = null;
  const overlaySum = topTracks.reduce(
    (acc, t) => acc + (t.playcount ?? 0),
    0,
  );
  if (overlaySum > 0) {
    totalTrackedStreams = overlaySum;
  } else if (playcountByUri.size > 0) {
    totalTrackedStreams = Array.from(playcountByUri.values()).reduce(
      (a, b) => a + b,
      0,
    );
  }

  // If official API failed, synthesize a minimal artist from partner data.
  const fallbackArtist: SpotifyArtist = officialArtist ?? {
    id: artistId,
    name: au?.profile?.name ?? "Artist",
    url: `https://open.spotify.com/artist/${artistId}`,
    followers: 0,
    genres: [],
    popularity: 0,
    image: null,
  };

  const now = new Date();
  const fetchedAtLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(now);

  return {
    artist: fallbackArtist,
    topTracks,
    stats: {
      monthlyListeners,
      followers: fallbackArtist.followers,
      totalTrackedStreams,
    },
    hasLiveData: officialOk || monthlyListeners !== null,
    fetchedAt: now.toISOString(),
    fetchedAtLabel,
  };
}

/** Cached, server-side aggregated fetch. Revalidates hourly. */
export const getSpotifyArtistData = unstable_cache(
  async (artistId: string) => fetchArtistDataInner(artistId),
  ["spotify-artist-data"],
  { revalidate: 3600, tags: ["spotify"] },
);

/** Safe wrapper: never throws — returns `null` on hard failure. */
export async function getSpotifyArtistDataSafe(
  artistId: string = SPOTIFY_ARTIST_ID,
): Promise<SpotifyArtistData | null> {
  try {
    return await getSpotifyArtistData(artistId);
  } catch (err) {
    console.warn("[spotify] getSpotifyArtistData failed:", (err as Error).message);
    return null;
  }
}
