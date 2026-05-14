import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  IG_OAUTH_STATE_COOKIE,
  buildAuthorizeUrl,
  instagramSetupRoutesEnabled,
} from "@/lib/instagram-oauth-setup";

export async function GET() {
  if (!instagramSetupRoutesEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const clientId = process.env.INSTAGRAM_APP_ID?.trim();
  const clientSecret = process.env.INSTAGRAM_APP_SECRET?.trim();
  const redirectUri = process.env.INSTAGRAM_OAUTH_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse(
      "Missing INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, or INSTAGRAM_OAUTH_REDIRECT_URI",
      { status: 500 },
    );
  }

  const state = randomBytes(24).toString("hex");
  const url = buildAuthorizeUrl({ clientId, redirectUri, state });

  const res = NextResponse.redirect(url);
  res.cookies.set(IG_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
