import "server-only";

import { fetchWithRetry } from "@/lib/soundcloud-http";

/**
 * OAuth 2.1 / Client Credentials helper for the SoundCloud API.
 *
 * Per the official guide (https://developers.soundcloud.com/docs/api/guide):
 *   - Token URL:      https://secure.soundcloud.com/oauth/token
 *   - Tokens expire:  ~1 hour
 *   - Rate limits:    50 token requests per 12h per app, 30 per 1h per IP
 *   - Auth method:    HTTP Basic for the client_credentials grant
 *   - Refresh tokens are single-use and required to stay within the rate limit
 *   - Required header on API calls: `Authorization: OAuth <access_token>`
 *
 * We never want to obtain a new access token if we already have a valid one,
 * so this module caches the current token in memory and refreshes it
 * proactively (slightly before expiry) using the refresh token returned by
 * the previous grant. Concurrent token requests are coalesced into a single
 * inflight Promise so we never burn through tokens during a render burst.
 */

const TOKEN_URL = "https://secure.soundcloud.com/oauth/token";

/** Refresh slightly before the server-side expiry to avoid edge-case 401s. */
const EXPIRY_SAFETY_WINDOW_MS = 60_000;

type TokenState = {
  accessToken: string;
  refreshToken: string | null;
  /** Absolute ms-since-epoch when this token should be considered expired. */
  expiresAt: number;
};

let cached: TokenState | null = null;
let inflight: Promise<TokenState> | null = null;

function isUsable(state: TokenState | null): state is TokenState {
  if (!state) return false;
  return state.expiresAt - Date.now() > EXPIRY_SAFETY_WINDOW_MS;
}

/**
 * Returns the refresh token from the current cached state, or null. Lives in
 * its own function so callers can read it without triggering TS's
 * control-flow narrowing on the module-level `cached` variable.
 */
function previousRefreshTokenSnapshot(): string | null {
  return cached?.refreshToken ?? null;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

function requireCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("missing-credentials");
  }
  return { clientId, clientSecret };
}

async function postToken(params: URLSearchParams): Promise<TokenState> {
  const { clientId, clientSecret } = requireCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // No `cache` option: Next does not cache POSTs by default, and passing
  // `cache: "no-store"` would force the parent route into dynamic rendering.
  // Token reuse is already handled by our in-memory cache above.
  //
  // 429 retry with bounded backoff: the token endpoint is the most
  // rate-limited one (50/12h per app), so a single throttle hiccup should
  // not blow up the page render.
  const res = await fetchWithRetry(
    TOKEN_URL,
    {
      method: "POST",
      headers: {
        accept: "application/json; charset=utf-8",
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${basic}`,
      },
      body: params.toString(),
    },
    { maxRetries: 2, baseDelayMs: 750 },
  );
  if (!res.ok) {
    throw new Error(`token-request-failed:${res.status}`);
  }
  const json = (await res.json()) as TokenResponse;
  if (!json.access_token || typeof json.expires_in !== "number") {
    throw new Error("token-response-malformed");
  }
  // Subtract a small skew so we don't sit right on the cliff edge.
  const expiresAt = Date.now() + (json.expires_in - 30) * 1000;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt,
  };
}

async function newClientCredentialsGrant(): Promise<TokenState> {
  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  return postToken(params);
}

async function refreshGrant(refreshToken: string): Promise<TokenState> {
  const { clientId, clientSecret } = requireCredentials();
  const params = new URLSearchParams();
  params.set("grant_type", "refresh_token");
  // The refresh flow accepts credentials either in the body or via Basic
  // auth; the docs show body parameters, so we follow that.
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("refresh_token", refreshToken);
  return postToken(params);
}

/**
 * Returns `true` when both `SOUNDCLOUD_CLIENT_ID` and
 * `SOUNDCLOUD_CLIENT_SECRET` are set in the process environment.
 */
export function hasSoundcloudCredentials(): boolean {
  return Boolean(
    process.env.SOUNDCLOUD_CLIENT_ID && process.env.SOUNDCLOUD_CLIENT_SECRET,
  );
}

/**
 * Returns a valid SoundCloud access token, refreshing as needed.
 *
 * Returns `null` if credentials are not configured or if the OAuth exchange
 * fails. Callers that get `null` should fall back to public (unauthenticated)
 * data sources rather than crash.
 */
export async function getSoundcloudAccessToken(): Promise<string | null> {
  if (isUsable(cached)) return cached.accessToken;

  if (inflight) {
    try {
      const state = await inflight;
      return state.accessToken;
    } catch {
      return null;
    }
  }

  // Snapshot the previous refresh token from the module-level state
  // without re-reading `cached` (which TS has narrowed to `null` after the
  // early-return check above).
  const previousRefreshToken: string | null = previousRefreshTokenSnapshot();

  inflight = (async () => {
    try {
      // Prefer the refresh-token path when we have one — single-use tokens
      // are the documented way to stay inside the per-app rate limit.
      if (previousRefreshToken) {
        try {
          const refreshed = await refreshGrant(previousRefreshToken);
          cached = refreshed;
          return refreshed;
        } catch {
          // Fall through to a fresh client_credentials grant.
        }
      }
      const fresh = await newClientCredentialsGrant();
      cached = fresh;
      return fresh;
    } finally {
      inflight = null;
    }
  })();

  try {
    const state = await inflight;
    return state.accessToken;
  } catch {
    return null;
  }
}

/**
 * Invalidate the cached token. Call this after observing a 401 from the
 * API so the next request triggers a fresh grant.
 */
export function invalidateSoundcloudAccessToken(): void {
  cached = null;
}
