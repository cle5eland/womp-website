import "server-only";

import { unstable_cache } from "next/cache";
import { get as getEdgeConfigValue } from "@vercel/edge-config";

// Reuse the generic retry helper that lives in the SoundCloud namespace —
// it isn't actually SoundCloud-specific, just where it first landed.
import { fetchWithRetry } from "@/lib/soundcloud-http";
import type { InstagramStats } from "@/lib/instagram-types";
import { EDGE_CONFIG_TOKEN_KEY } from "@/lib/instagram-token-refresh";

/**
 * Instagram Graph API (Instagram Login flow).
 *
 * Authoritative reference:
 *   - https://developers.facebook.com/docs/instagram-platform/instagram-graph-api
 *   - https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 *
 * Unlike Spotify and SoundCloud — both of which support OAuth2 client_credentials
 * for app-level access to public data — Instagram requires a user-authorized
 * long-lived access token (60-day expiry, refreshable). The account must be
 * a Business or Creator account; personal accounts cannot read stats.
 *
 * We call `GET https://graph.instagram.com/v21.0/me` with `?access_token=<token>`.
 * The endpoint resolves "me" from the token itself, so we don't need to
 * store the user id separately.
 *
 * Token source + rotation: a weekly cron (`app/api/cron/instagram-refresh/route.ts`)
 * refreshes the long-lived token and writes it to Edge Config, since env vars
 * baked into a serverless function can't be updated at runtime without a
 * redeploy. We read from Edge Config first and fall back to the
 * `INSTAGRAM_ACCESS_TOKEN` env var (used for local dev, and as the initial
 * bootstrap value before the cron has ever run). See `lib/instagram-token-refresh.ts`
 * for the refresh logic and README for manual-rotation instructions if the
 * cron ever alerts that it's failing. When no valid token is available, the
 * fetcher returns `null` and the UI falls back to the placeholder state
 * without breaking the page.
 */

const API_BASE = "https://graph.instagram.com/v21.0";

const PROFILE_FIELDS = [
  "user_id",
  "username",
  "name",
  "account_type",
  "biography",
  "profile_picture_url",
  "followers_count",
  "follows_count",
  "media_count",
].join(",");

type RawInstagramProfile = {
  user_id?: string | number;
  username?: string;
  name?: string;
  account_type?: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
};

type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

export function hasInstagramCredentials(): boolean {
  return Boolean(process.env.EDGE_CONFIG || process.env.INSTAGRAM_ACCESS_TOKEN);
}

/**
 * Resolves the current access token, preferring the cron-maintained Edge
 * Config value over the static env var. Never throws — any Edge Config
 * failure just falls back to the env var (or `null`). Exported so the
 * refresh cron can find the token it needs to hand to
 * `refreshInstagramToken`.
 */
export async function resolveInstagramAccessToken(): Promise<string | null> {
  if (process.env.EDGE_CONFIG) {
    try {
      const token = await getEdgeConfigValue<string>(EDGE_CONFIG_TOKEN_KEY);
      if (typeof token === "string" && token.length > 0) return token;
    } catch (err) {
      console.warn(
        "[instagram] Edge Config read failed, falling back to env var:",
        (err as Error).message,
      );
    }
  }
  return process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatFetchedAtLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

async function fetchInstagramInner(
  revalidateSeconds: number,
): Promise<InstagramStats | null> {
  const token = await resolveInstagramAccessToken();
  if (!token) return null;

  const url = new URL(`${API_BASE}/me`);
  url.searchParams.set("fields", PROFILE_FIELDS);
  url.searchParams.set("access_token", token);

  let res: Response;
  try {
    res = await fetchWithRetry(
      url.toString(),
      {
        headers: { accept: "application/json" },
        next: { revalidate: revalidateSeconds },
      },
      { maxRetries: 3, baseDelayMs: 500 },
    );
  } catch (err) {
    console.warn("[instagram] network error:", (err as Error).message);
    return null;
  }

  if (!res.ok) {
    // Graph API returns a structured error body for 4xx. Surface enough
    // detail in the server log to debug expired/invalid tokens without
    // leaking the token itself.
    let detail = "";
    try {
      const body = (await res.json()) as GraphErrorBody;
      detail = body.error?.message ?? "";
    } catch {
      // ignore parse errors
    }
    console.warn(
      `[instagram] /me failed: HTTP ${res.status}${detail ? ` — ${detail}` : ""}`,
    );
    return null;
  }

  let data: RawInstagramProfile;
  try {
    data = (await res.json()) as RawInstagramProfile;
  } catch (err) {
    console.warn("[instagram] /me JSON parse failed:", (err as Error).message);
    return null;
  }

  const username = asString(data.username);
  if (!username) {
    // No username means we can't even build a profile URL — bail out cleanly.
    console.warn("[instagram] /me returned no username");
    return null;
  }

  const now = new Date();
  return {
    userId:
      typeof data.user_id === "number"
        ? String(data.user_id)
        : (asString(data.user_id) ?? ""),
    username,
    name: asString(data.name),
    accountType: asString(data.account_type),
    biography: asString(data.biography),
    profilePictureUrl: asString(data.profile_picture_url),
    profileUrl: `https://www.instagram.com/${username}/`,
    followersCount: asNumber(data.followers_count),
    followsCount: asNumber(data.follows_count),
    mediaCount: asNumber(data.media_count),
    fetchedAt: now.toISOString(),
    fetchedAtLabel: formatFetchedAtLabel(now),
  };
}

/**
 * Cached aggregate fetch — mirrors `getSpotifyArtistData` and the SoundCloud
 * caching pattern. Revalidates hourly and is tagged so callers can invalidate
 * via `revalidateTag("instagram")` from a webhook if desired.
 */
const cachedFetchInstagramStats = unstable_cache(
  async () => fetchInstagramInner(60 * 60),
  ["instagram-stats"],
  { revalidate: 3600, tags: ["instagram"] },
);

export async function fetchInstagramStats(): Promise<InstagramStats | null> {
  return cachedFetchInstagramStats();
}

/**
 * Safe wrapper that never throws — returns `null` on hard failure. Mirrors
 * `getSpotifyArtistDataSafe` and `getSoundcloudStatsSafe` for symmetry at
 * the call site (`app/page.tsx`).
 */
export async function getInstagramStatsSafe(): Promise<InstagramStats | null> {
  try {
    return await fetchInstagramStats();
  } catch (err) {
    console.warn(
      "[instagram] fetchInstagramStats failed:",
      (err as Error).message,
    );
    return null;
  }
}
