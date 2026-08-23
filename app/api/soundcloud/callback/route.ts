import { NextResponse } from "next/server";

import {
  FAN_SESSION_COOKIE,
  FAN_SESSION_MAX_AGE,
  PKCE_COOKIE,
  cookieOptions,
  createFanSession,
  exchangeCodeForToken,
  fetchFanIdentity,
  getSessionSecret,
  getUserAuthConfig,
  slugFromState,
  validateCallback,
} from "@/lib/soundcloud-user-auth";

/**
 * The single SoundCloud OAuth callback for the whole site.
 *
 * SoundCloud issues one redirect URI per app, so this route serves every gate
 * and works out where to return the fan from the signed `state` parameter. Set
 * `SOUNDCLOUD_OAUTH_REDIRECT_URI` to exactly this path (including scheme and
 * host) and register the same value on the app at soundcloud.com/you/apps.
 *
 * Errors always redirect back to a gate page with an `error` query parameter
 * rather than rendering here — a fan should never end up staring at JSON.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const secret = getSessionSecret();

  // Best-effort: recover the gate from `state` so failures can land somewhere
  // useful even when the exchange never happens.
  const slug = secret ? slugFromState(state, secret) : null;
  const fallback = new URL(slug ? `/gate/${encodeURIComponent(slug)}` : "/", origin);

  const fail = (reason: string) => {
    fallback.searchParams.set("error", reason);
    return NextResponse.redirect(fallback);
  };

  if (oauthError) {
    // The fan pressed "Cancel" on SoundCloud's consent screen.
    return fail(oauthError === "access_denied" ? "denied" : "oauth_error");
  }
  if (!secret) {
    console.error("[gate] GATE_SESSION_SECRET is not configured.");
    return fail("not_configured");
  }
  if (!code) return fail("missing_code");

  const configured = getUserAuthConfig();
  if (!configured.ok) {
    console.error(
      `[gate] SoundCloud OAuth is not configured; missing: ${configured.missing.join(", ")}`,
    );
    return fail("not_configured");
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const pkceCookie = readCookie(cookieHeader, PKCE_COOKIE);

  const validated = validateCallback({
    state,
    pkceCookie,
    sessionSecret: secret,
  });
  if (!validated.ok) {
    console.warn(`[gate] OAuth callback rejected: ${validated.error}`);
    return fail(validated.error === "expired" ? "expired" : "bad_state");
  }

  let sessionCookie: string;
  try {
    const token = await exchangeCodeForToken({
      code,
      verifier: validated.verifier,
      config: configured.config,
    });
    const fan = await fetchFanIdentity(token.accessToken);
    sessionCookie = createFanSession({ token, fan, sessionSecret: secret });
  } catch (err) {
    console.error("[gate] token exchange failed:", (err as Error).message);
    return fail("exchange_failed");
  }

  const destination = new URL(
    `/gate/${encodeURIComponent(validated.slug)}`,
    origin,
  );
  destination.searchParams.set("connected", "1");

  const response = NextResponse.redirect(destination);
  response.cookies.set(
    FAN_SESSION_COOKIE,
    sessionCookie,
    cookieOptions(FAN_SESSION_MAX_AGE),
  );
  // The verifier is single-use; drop it so a replayed callback cannot reuse it.
  response.cookies.delete(PKCE_COOKIE);
  return response;
}

/**
 * Read one cookie from a raw `Cookie` header. Next's `cookies()` helper would
 * also work, but this route needs only a single value and avoids opting the
 * handler into the dynamic-request APIs.
 */
function readCookie(header: string, name: string): string | undefined {
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return undefined;
}
