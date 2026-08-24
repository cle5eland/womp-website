import { NextResponse } from "next/server";

import { readClaimFromCookies } from "@/lib/gate-request";
import {
  FAN_SESSION_COOKIE,
  FAN_SESSION_MAX_AGE,
  PKCE_COOKIE,
  PKCE_COOKIE_MAX_AGE,
  beginAuthorization,
  cookieOptions,
  createMockSession,
  getSessionSecret,
  getUserAuthConfig,
  isMockMode,
} from "@/lib/soundcloud-user-auth";

/**
 * Starts the "Connect with SoundCloud" flow for one gate.
 *
 * The gate slug cannot travel in the redirect URI — SoundCloud allows a single
 * registered URI per app — so it is carried in the signed `state` parameter and
 * the shared callback at `/api/soundcloud/callback` sends the fan back here.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const origin = new URL(request.url).origin;
  const gateUrl = new URL(`/gate/${encodeURIComponent(slug)}`, origin);

  const claim = await readClaimFromCookies();
  if (!claim) {
    gateUrl.searchParams.set("error", "claim_required");
    return NextResponse.redirect(gateUrl);
  }

  // Local development: SoundCloud is stubbed, so mint a session directly.
  if (isMockMode()) {
    const secret = getSessionSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "GATE_SESSION_SECRET is not configured." },
        { status: 500 },
      );
    }
    gateUrl.searchParams.set("connected", "mock");
    const response = NextResponse.redirect(gateUrl);
    response.cookies.set(
      FAN_SESSION_COOKIE,
      createMockSession(secret),
      cookieOptions(FAN_SESSION_MAX_AGE),
    );
    return response;
  }

  const configured = getUserAuthConfig();
  if (!configured.ok) {
    console.error(
      `[gate] SoundCloud OAuth is not configured; missing: ${configured.missing.join(", ")}`,
    );
    gateUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(gateUrl);
  }

  const { authorizeUrl, pkceCookie } = beginAuthorization({
    slug,
    config: configured.config,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    PKCE_COOKIE,
    pkceCookie,
    cookieOptions(PKCE_COOKIE_MAX_AGE),
  );
  return response;
}
