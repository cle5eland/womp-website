import "server-only";

/**
 * Automated Instagram long-lived token refresh + failure alerting.
 *
 * Long-lived Instagram tokens (minted via `lib/instagram-oauth-setup.ts`)
 * last ~60 days, but can be refreshed any time they're at least 24h old and
 * not yet expired — each refresh extends validity another ~60 days
 * (`GET https://graph.instagram.com/refresh_access_token`). This module is
 * driven by the weekly cron at `app/api/cron/instagram-refresh/route.ts`:
 * it refreshes the token, verifies the new one actually works against the
 * Graph API, and persists it to Edge Config so `lib/instagram-stats.ts` can
 * pick it up at runtime without a redeploy. If any step fails, it posts a
 * Discord alert so a human can rotate the token manually via
 * `/api/instagram/oauth` before it goes stale — see README for that flow.
 */

const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const ME_URL = "https://graph.instagram.com/v21.0/me";

/** Edge Config keys written by this module and read by `lib/instagram-stats.ts`. */
export const EDGE_CONFIG_TOKEN_KEY = "instagram_access_token";
export const EDGE_CONFIG_REFRESHED_AT_KEY = "instagram_token_refreshed_at";

type GraphErrorBody = {
  error?: { message?: string; type?: string; code?: number };
};

async function extractGraphError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as GraphErrorBody;
    return body.error?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export type RefreshedToken = {
  accessToken: string;
  expiresInSeconds: number | null;
};

/** Exchanges a still-valid token for a new one with a fresh ~60-day expiry. */
export async function refreshInstagramToken(
  currentToken: string,
): Promise<RefreshedToken> {
  const url = new URL(REFRESH_URL);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `refresh_access_token failed: ${await extractGraphError(res)}`,
    );
  }

  const raw = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;
  if (!raw?.access_token) {
    throw new Error("refresh_access_token: unexpected response shape");
  }
  return {
    accessToken: raw.access_token,
    expiresInSeconds:
      typeof raw.expires_in === "number" ? raw.expires_in : null,
  };
}

/** Confirms a token actually works before we commit to persisting it. */
export async function verifyInstagramToken(token: string): Promise<void> {
  const url = new URL(ME_URL);
  url.searchParams.set("fields", "user_id");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`verification /me failed: ${await extractGraphError(res)}`);
  }
}

/**
 * Writes the refreshed token to Edge Config via the Vercel REST API. This is
 * separate from `process.env.INSTAGRAM_ACCESS_TOKEN` because env vars baked
 * into a serverless function can't be updated at runtime without a redeploy;
 * Edge Config reads are near-instant and take effect immediately.
 */
export async function writeInstagramTokenToEdgeConfig(input: {
  accessToken: string;
  refreshedAtIso: string;
}): Promise<void> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!edgeConfigId || !apiToken) {
    throw new Error(
      "Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN — cannot persist refreshed token",
    );
  }

  const url = new URL(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
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
      items: [
        {
          operation: "upsert",
          key: EDGE_CONFIG_TOKEN_KEY,
          value: input.accessToken,
        },
        {
          operation: "upsert",
          key: EDGE_CONFIG_REFRESHED_AT_KEY,
          value: input.refreshedAtIso,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Edge Config write failed: HTTP ${res.status}${detail ? ` — ${detail}` : ""}`,
    );
  }
}

/**
 * Best-effort Discord alert. Never throws — a broken alert channel should
 * never mask (or crash on top of) the original failure it's reporting.
 */
export async function sendInstagramAlert(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      "[instagram-refresh] no DISCORD_ALERT_WEBHOOK_URL set; alert not sent:",
      message,
    );
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.warn(
      "[instagram-refresh] failed to send Discord alert:",
      (err as Error).message,
    );
  }
}
