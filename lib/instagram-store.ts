import "server-only";

import { get as getGlobalConfigValue } from "@vercel/global-config";

import type { InstagramStats } from "@/lib/instagram-types";

/**
 * Durable state for the Instagram integration, kept in Vercel Global Config
 * (the current name for what used to be branded "Edge Config" — same store).
 *
 * Two things live here, both written by the crons in `app/api/cron/*` and read
 * on the render path by `lib/instagram-stats.ts`:
 *
 *   - the current long-lived access token, because env vars baked into a
 *     serverless function can't be updated at runtime without a redeploy, and
 *     the whole point of the refresh cron is to rotate the token unattended;
 *   - the last successful stats snapshot, so a broken token degrades to
 *     slightly stale follower counts rather than a visible "unavailable"
 *     state on the page.
 *
 * Reads go through `@vercel/global-config`'s default client, which resolves
 * its connection string as `GLOBAL_CONFIG ?? EDGE_CONFIG` — whichever one
 * Vercel injected when the store was connected to this project (this has
 * been observed to vary). Writes go through the REST API, which needs a
 * Vercel API token — see README for scoping it to this project only.
 */

export const TOKEN_KEY = "instagram_access_token";
export const REFRESHED_AT_KEY = "instagram_token_refreshed_at";
export const SNAPSHOT_KEY = "instagram_stats_snapshot";

/**
 * Beyond this age a cached snapshot stops being "slightly stale" and starts
 * being misleading, so the UI reverts to the explicit unavailable state.
 */
const SNAPSHOT_MAX_AGE_DAYS = 30;

function storeConfigured(): boolean {
  return Boolean(process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG);
}

async function readKey<T>(key: string): Promise<T | undefined> {
  if (!storeConfigured()) return undefined;
  try {
    return await getGlobalConfigValue<T>(key);
  } catch (err) {
    console.warn(
      `[instagram-store] read of "${key}" failed:`,
      (err as Error).message,
    );
    return undefined;
  }
}

/**
 * Current access token, preferring the cron-maintained Edge Config value over
 * the static env var. The env var remains the bootstrap value (and the only
 * source in local dev). Never throws.
 */
export async function readAccessToken(): Promise<string | null> {
  const stored = await readKey<string>(TOKEN_KEY);
  if (typeof stored === "string" && stored.length > 0) return stored;
  return process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
}

/** When the refresh cron last succeeded, or `null` if it never has. */
export async function readRefreshedAt(): Promise<Date | null> {
  const raw = await readKey<string>(REFRESHED_AT_KEY);
  if (typeof raw !== "string") return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Last known-good stats, or `null` if there aren't any recent enough to show.
 * Returned with `isStale` set so callers can label it honestly.
 */
export async function readStatsSnapshot(): Promise<InstagramStats | null> {
  const raw = await readKey<InstagramStats>(SNAPSHOT_KEY);
  if (!raw || typeof raw !== "object" || typeof raw.username !== "string") {
    return null;
  }

  const capturedAt = new Date(raw.fetchedAt);
  if (Number.isNaN(capturedAt.getTime())) return null;

  const ageDays = (Date.now() - capturedAt.getTime()) / 86_400_000;
  if (ageDays > SNAPSHOT_MAX_AGE_DAYS) return null;

  return { ...raw, isStale: true };
}

type EdgeConfigItem = { key: string; value: unknown };

/**
 * Batch upsert against the documented `global-config` REST path (Edge Config's
 * current name in Vercel's API; the older `edge-config` path is still aliased
 * but this is the one the docs track).
 *
 * Deliberately does not include the response body in thrown errors: the
 * request body carries the access token, and these errors are relayed to a
 * Discord channel.
 */
async function upsertItems(items: EdgeConfigItem[]): Promise<void> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!edgeConfigId || !apiToken) {
    throw new Error(
      "Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN — cannot persist Instagram state",
    );
  }

  const url = new URL(
    `https://api.vercel.com/v1/global-config/${edgeConfigId}/items`,
  );
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      items: items.map((item) => ({ operation: "upsert", ...item })),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const code = await extractVercelErrorCode(res);
    throw new Error(
      `Edge Config write failed: HTTP ${res.status}${code ? ` (${code})` : ""}`,
    );
  }
}

/**
 * Pulls only the machine-readable error code out of a Vercel error body.
 * We never surface the raw text, which can echo back submitted values.
 */
async function extractVercelErrorCode(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: { code?: string } };
    const code = body.error?.code;
    return typeof code === "string" ? code.slice(0, 64) : null;
  } catch {
    return null;
  }
}

export async function writeAccessToken(input: {
  accessToken: string;
  refreshedAtIso: string;
}): Promise<void> {
  await upsertItems([
    { key: TOKEN_KEY, value: input.accessToken },
    { key: REFRESHED_AT_KEY, value: input.refreshedAtIso },
  ]);
}

export async function writeStatsSnapshot(stats: InstagramStats): Promise<void> {
  // Strip the staleness marker so a snapshot served from cache and then
  // re-saved can't get permanently branded as stale.
  const fresh: InstagramStats = { ...stats };
  delete fresh.isStale;
  await upsertItems([{ key: SNAPSHOT_KEY, value: fresh }]);
}
