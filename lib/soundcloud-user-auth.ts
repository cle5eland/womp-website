import "server-only";

import { createHash } from "node:crypto";

import { randomToken, seal, sign, unseal, verify } from "@/lib/crypto-utils";
import type { GateFanIdentity } from "@/lib/gate-types";
import {
  fetchWithRetry,
  logSoundcloud,
  readSoundcloudErrorBody,
  soundcloudResponseMeta,
} from "@/lib/soundcloud-http";

/**
 * SoundCloud Authorization Code + PKCE flow, used to act on a fan's behalf.
 *
 * This is a different credential from `lib/soundcloud-auth.ts`. That module
 * holds an app-level client_credentials token, which can only read public data;
 * liking, reposting, commenting and following all require a token minted for a
 * specific user, which is what this module produces.
 *
 * Two constraints from the SoundCloud docs drive the design:
 *
 *   1. PKCE is mandatory, and all clients are treated as *confidential* — so
 *      the token exchange needs the client secret as well as the verifier, and
 *      must happen server-side.
 *   2. An app gets exactly ONE registered redirect URI. That is why there is a
 *      single site-wide callback and the gate being unlocked travels in the
 *      signed `state` parameter instead of the path.
 *
 * Access tokens last ~1 hour and refresh tokens are single-use. We deliberately
 * do not implement refresh: a gate run takes under a minute, the download is
 * authorized by our own unlock record rather than a live token, and a
 * single-use refresh token invites a lost-token race on double-clicks. When a
 * token does expire the fan reconnects with one click, which SoundCloud
 * normally satisfies without re-prompting.
 */

const AUTHORIZE_URL = "https://secure.soundcloud.com/authorize";
const TOKEN_URL = "https://secure.soundcloud.com/oauth/token";
const API_BASE = "https://api.soundcloud.com";

/** How long a fan has to complete the SoundCloud redirect round trip. */
const PKCE_TTL_MS = 10 * 60 * 1000;

const PKCE_PURPOSE = "soundcloud-pkce";
const STATE_PURPOSE = "soundcloud-state";
const SESSION_PURPOSE = "gate-fan-session";

export const PKCE_COOKIE = "womp_gate_pkce";
export const FAN_SESSION_COOKIE = "womp_gate_fan";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Stubs SoundCloud entirely. Necessary rather than merely convenient: the app
 * has one redirect URI, so if production owns it, local development cannot run
 * the real flow at all. Refuses to engage in production.
 */
export function isMockMode(): boolean {
  return (
    process.env.GATE_MOCK_SOUNDCLOUD === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Outside production, fall back to a fixed development secret so the gate flow
 * runs with zero configuration under `GATE_MOCK_SOUNDCLOUD`. Production always
 * requires a real secret, and the fallback is not a valid one there.
 */
const DEV_SESSION_SECRET = "womp-gate-development-only-secret";

export function getSessionSecret(): string | null {
  const configured = process.env.GATE_SESSION_SECRET;
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : DEV_SESSION_SECRET;
}

export type UserAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sessionSecret: string;
};

/**
 * Returns the OAuth configuration, or `null` with the reason when incomplete,
 * so routes can render a useful setup message instead of a blank 500.
 */
export function getUserAuthConfig():
  | { ok: true; config: UserAuthConfig }
  | { ok: false; missing: string[] } {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  const redirectUri = process.env.SOUNDCLOUD_OAUTH_REDIRECT_URI;
  const sessionSecret = getSessionSecret();

  const missing: string[] = [];
  if (!clientId) missing.push("SOUNDCLOUD_CLIENT_ID");
  if (!clientSecret) missing.push("SOUNDCLOUD_CLIENT_SECRET");
  if (!redirectUri) missing.push("SOUNDCLOUD_OAUTH_REDIRECT_URI");
  if (!sessionSecret) missing.push("GATE_SESSION_SECRET");

  if (missing.length > 0) return { ok: false, missing };
  return {
    ok: true,
    config: {
      clientId: clientId!,
      clientSecret: clientSecret!,
      redirectUri: redirectUri!,
      sessionSecret: sessionSecret!,
    },
  };
}

// ---------------------------------------------------------------------------
// PKCE + state
// ---------------------------------------------------------------------------

function codeChallengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

type PkcePayload = {
  verifier: string;
  nonce: string;
  slug: string;
  issuedAt: number;
};

type StatePayload = {
  nonce: string;
  slug: string;
  issuedAt: number;
};

/**
 * Begin the flow for one gate. Returns the URL to redirect the fan to, plus the
 * sealed cookie value that lets the callback prove the response belongs to this
 * request.
 */
export function beginAuthorization(input: {
  slug: string;
  config: UserAuthConfig;
}): { authorizeUrl: string; pkceCookie: string } {
  const { slug, config } = input;
  const verifier = randomToken(48);
  const nonce = randomToken(16);
  const issuedAt = Date.now();

  const state = sign(
    { nonce, slug, issuedAt } satisfies StatePayload,
    config.sessionSecret,
    STATE_PURPOSE,
  );

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", codeChallengeFor(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);

  const pkceCookie = seal(
    { verifier, nonce, slug, issuedAt } satisfies PkcePayload,
    config.sessionSecret,
    PKCE_PURPOSE,
  );

  return { authorizeUrl: url.toString(), pkceCookie };
}

/**
 * Validate a callback. Confirms the state signature, that the nonce matches the
 * cookie minted alongside it (so a state lifted from another browser is
 * useless), that the gate has not been swapped, and that the round trip
 * happened inside `PKCE_TTL_MS`.
 */
export function validateCallback(input: {
  state: string | null;
  pkceCookie: string | undefined;
  sessionSecret: string;
}): { ok: true; slug: string; verifier: string } | { ok: false; error: string } {
  const { state, pkceCookie, sessionSecret } = input;

  if (!state) return { ok: false, error: "missing-state" };

  const pkce = unseal<PkcePayload>(pkceCookie, sessionSecret, PKCE_PURPOSE);
  if (!pkce) return { ok: false, error: "missing-pkce-cookie" };

  const parsed = verify<StatePayload>(state, sessionSecret, STATE_PURPOSE);
  if (!parsed) return { ok: false, error: "bad-state-signature" };

  if (parsed.nonce !== pkce.nonce) return { ok: false, error: "state-mismatch" };
  if (parsed.slug !== pkce.slug) return { ok: false, error: "gate-mismatch" };
  if (Date.now() - pkce.issuedAt > PKCE_TTL_MS) {
    return { ok: false, error: "expired" };
  }

  return { ok: true, slug: pkce.slug, verifier: pkce.verifier };
}

/** Reads the gate slug out of a state value without validating the cookie. */
export function slugFromState(
  state: string | null,
  sessionSecret: string,
): string | null {
  if (!state) return null;
  return verify<StatePayload>(state, sessionSecret, STATE_PURPOSE)?.slug ?? null;
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export type UserToken = {
  accessToken: string;
  /** Absolute ms-since-epoch, with a safety margin already subtracted. */
  expiresAt: number;
};

export async function exchangeCodeForToken(input: {
  code: string;
  verifier: string;
  config: UserAuthConfig;
}): Promise<UserToken> {
  const { code, verifier, config } = input;

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", config.clientId);
  body.set("client_secret", config.clientSecret);
  body.set("redirect_uri", config.redirectUri);
  body.set("code_verifier", verifier);
  body.set("code", code);

  const res = await fetchWithRetry(
    TOKEN_URL,
    {
      method: "POST",
      headers: {
        accept: "application/json; charset=utf-8",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
    { maxRetries: 2, baseDelayMs: 500 },
  );

  if (!res.ok) {
    const { message, body } = await readSoundcloudErrorBody(res);
    logSoundcloud("error", "token-exchange-failed", {
      method: "POST",
      path: "/oauth/token",
      message,
      body,
      ...soundcloudResponseMeta(res),
    });
    throw new Error(`token-exchange-failed:${res.status}`);
  }

  const json = (await res.json()) as TokenResponse;
  if (!json.access_token) {
    logSoundcloud("error", "token-exchange-malformed", {
      method: "POST",
      path: "/oauth/token",
      keys: Object.keys(json),
    });
    throw new Error("token-response-malformed");
  }

  const lifetime = typeof json.expires_in === "number" ? json.expires_in : 3600;
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + Math.max(0, lifetime - 60) * 1000,
  };
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

type RawMe = {
  urn?: string;
  id?: number;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  permalink_url?: string;
};

/** `GET /me` — establishes who we are acting for. */
export async function fetchFanIdentity(
  accessToken: string,
): Promise<GateFanIdentity> {
  const res = await fetchWithRetry(
    `${API_BASE}/me`,
    {
      headers: {
        authorization: `OAuth ${accessToken}`,
        accept: "application/json; charset=utf-8",
      },
      cache: "no-store",
    },
    { maxRetries: 2, baseDelayMs: 400 },
  );

  if (!res.ok) {
    const { message, body } = await readSoundcloudErrorBody(res);
    logSoundcloud("error", "me-failed", {
      method: "GET",
      path: "/me",
      message,
      body,
      ...soundcloudResponseMeta(res),
    });
    throw new Error(`me-failed:${res.status}`);
  }

  const raw = (await res.json()) as RawMe;
  const urn =
    typeof raw.urn === "string" && raw.urn.length > 0
      ? raw.urn
      : typeof raw.id === "number"
        ? `soundcloud:users:${raw.id}`
        : null;

  if (!urn || typeof raw.username !== "string") {
    throw new Error("me-response-malformed");
  }

  return {
    userUrn: urn,
    username: raw.username,
    displayName: raw.full_name ?? null,
    avatarUrl: raw.avatar_url ?? null,
    permalinkUrl: raw.permalink_url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Fan session cookie
// ---------------------------------------------------------------------------

type FanSessionPayload = {
  v: 1;
  accessToken: string;
  expiresAt: number;
  fan: GateFanIdentity;
};

export type FanSession = {
  accessToken: string;
  expiresAt: number;
  fan: GateFanIdentity;
  /** True when the SoundCloud token has aged out but we still know the fan. */
  tokenExpired: boolean;
};

/**
 * Seal a fan session for the cookie jar. The payload contains a live bearer
 * credential, so this is encrypted rather than merely signed.
 */
export function createFanSession(input: {
  token: UserToken;
  fan: GateFanIdentity;
  sessionSecret: string;
}): string {
  return seal(
    {
      v: 1,
      accessToken: input.token.accessToken,
      expiresAt: input.token.expiresAt,
      fan: input.fan,
    } satisfies FanSessionPayload,
    input.sessionSecret,
    SESSION_PURPOSE,
  );
}

/**
 * Read a fan session. An expired token still yields a session with
 * `tokenExpired: true`, because knowing *who* the fan is remains useful — their
 * completed progress can be shown, and a download they already earned still
 * works, without forcing a reconnect they may not need.
 */
export function readFanSession(
  cookieValue: string | undefined,
  sessionSecret: string,
): FanSession | null {
  const payload = unseal<FanSessionPayload>(
    cookieValue,
    sessionSecret,
    SESSION_PURPOSE,
  );
  if (!payload || payload.v !== 1 || !payload.fan?.userUrn) return null;

  return {
    accessToken: payload.accessToken,
    expiresAt: payload.expiresAt,
    fan: payload.fan,
    tokenExpired: Date.now() >= payload.expiresAt,
  };
}

/** Cookie options shared by both gate cookies. */
export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const PKCE_COOKIE_MAX_AGE = Math.floor(PKCE_TTL_MS / 1000);
/**
 * Outlives the ~1h token on purpose so a returning fan is still recognised and
 * can re-download without reconnecting.
 */
export const FAN_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Mock mode
// ---------------------------------------------------------------------------

export const MOCK_FAN: GateFanIdentity = {
  userUrn: "soundcloud:users:000000",
  username: "mock_fan",
  displayName: "Mock Fan",
  avatarUrl: null,
  permalinkUrl: "https://soundcloud.com/mock_fan",
};

export function createMockSession(sessionSecret: string): string {
  return createFanSession({
    token: {
      accessToken: "mock-access-token",
      expiresAt: Date.now() + 60 * 60 * 1000,
    },
    fan: MOCK_FAN,
    sessionSecret,
  });
}
