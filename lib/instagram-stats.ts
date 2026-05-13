import "server-only";

import { unstable_cache } from "next/cache";

// Reuse the generic retry helper that lives in the SoundCloud namespace —
// it isn't actually SoundCloud-specific, just where it first landed.
import { fetchWithRetry } from "@/lib/soundcloud-http";
import type { InstagramStats } from "@/lib/instagram-types";

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
 * We read the token from the `INSTAGRAM_ACCESS_TOKEN` env var only and call
 * `GET https://graph.instagram.com/v21.0/me` with `?access_token=<token>`.
 * The endpoint resolves "me" from the token itself, so we don't need to
 * store the user id separately.
 *
 * Token rotation note: tokens expire after ~60 days. Refresh-on-the-fly is
 * unhelpful in a serverless environment because the refreshed token can't
 * be persisted back into the env var. Operators must rotate the env value
 * manually before the window lapses (or wire up a cron). When the token is
 * absent or rejected, the fetcher returns `null` and the UI falls back to
 * the placeholder state without breaking the page.
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
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN);
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
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
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
