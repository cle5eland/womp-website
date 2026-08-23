import "server-only";

/**
 * Instagram token refresh + operational alerting.
 *
 * Long-lived Instagram tokens (minted via `lib/instagram-oauth-setup.ts`) last
 * ~60 days and can be refreshed once they're at least 24h old and still valid,
 * which resets the clock to 60 days
 * (https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/).
 * An *expired* token cannot be refreshed at all — there's no grace period, and
 * recovery means re-running OAuth by hand. That asymmetry is why the cron runs
 * weekly rather than near the expiry boundary, and why every failure alerts.
 *
 * Persistence lives in `lib/instagram-store.ts`; this module only talks to Meta
 * and to the alert channel.
 */

const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const ME_URL = "https://graph.instagram.com/v21.0/me";

const REQUEST_TIMEOUT_MS = 10_000;

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

/**
 * Removes access tokens from text bound for logs or Discord. Meta echoes the
 * token in some error messages, and the alert channel is not a secret store.
 */
export function redactTokens(
  message: string,
  tokens: (string | null)[],
): string {
  return tokens.reduce<string>((acc, token) => {
    if (!token || token.length < 8) return acc;
    return acc.split(token).join("[redacted]");
  }, message);
}

export type RefreshedToken = {
  accessToken: string;
  expiresInSeconds: number | null;
};

/** Exchanges a still-valid token for one with a fresh ~60-day expiry. */
export async function refreshInstagramToken(
  currentToken: string,
): Promise<RefreshedToken> {
  const url = new URL(REFRESH_URL);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentToken);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
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

/** Confirms a token works before we commit to persisting it. */
export async function verifyInstagramToken(token: string): Promise<void> {
  const url = new URL(ME_URL);
  url.searchParams.set("fields", "user_id");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`verification /me failed: ${await extractGraphError(res)}`);
  }
}

/**
 * Best-effort Discord alert. Never throws — a broken alert channel should not
 * mask, or crash on top of, the failure it's reporting.
 */
export async function sendInstagramAlert(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      "[instagram] no DISCORD_ALERT_WEBHOOK_URL set; alert not sent:",
      message,
    );
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: message }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.warn(
      "[instagram] failed to send Discord alert:",
      (err as Error).message,
    );
  }
}

/**
 * Optional heartbeat for an external dead-man's-switch (healthchecks.io and
 * similar). Vercel crons only run against the production deployment, so a
 * rollback or a dropped `vercel.json` silently stops all of the monitoring in
 * this repo. An outside service that alerts when pings *stop* is the only
 * thing that catches that class of failure.
 */
export async function pingHeartbeat(): Promise<void> {
  const url = process.env.HEALTHCHECK_PING_URL;
  if (!url) return;
  try {
    await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    console.warn("[instagram] heartbeat ping failed:", (err as Error).message);
  }
}
