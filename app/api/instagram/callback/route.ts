import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  IG_OAUTH_STATE_COOKIE,
  exchangeCodeForShortLivedToken,
  exchangeShortLivedForLongLived,
  instagramSetupRoutesEnabled,
} from "@/lib/instagram-oauth-setup";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  if (!instagramSetupRoutesEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const err = searchParams.get("error");
  const errDesc = searchParams.get("error_description");

  if (err) {
    return new NextResponse(
      `Authorization failed: ${err} — ${errDesc ?? ""}`,
      { status: 400 },
    );
  }

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  const cookieStore = await cookies();
  const expected = cookieStore.get(IG_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(IG_OAUTH_STATE_COOKIE);

  if (!expected || expected !== state) {
    return new NextResponse("Invalid or expired OAuth state", { status: 400 });
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

  let longLived: string;
  let expiresIn: number | undefined;
  try {
    const short = await exchangeCodeForShortLivedToken({
      clientId,
      clientSecret,
      redirectUri,
      code,
    });
    const exchanged = await exchangeShortLivedForLongLived({
      clientSecret,
      shortLivedAccessToken: short.access_token,
    });
    longLived = exchanged.access_token;
    expiresIn = exchanged.expires_in;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(msg, { status: 502 });
  }

  const days =
    typeof expiresIn === "number"
      ? Math.round(expiresIn / 86400)
      : "about 60";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Instagram token</title>
</head>
<body style="font-family: system-ui; max-width: 56rem; margin: 2rem auto; padding: 0 1rem;">
  <h1>Instagram long-lived token</h1>
  <p>Add this to <strong>.env.local</strong> and Vercel as <code>INSTAGRAM_ACCESS_TOKEN</code> (server-only; never <code>NEXT_PUBLIC_</code>).</p>
  <pre style="background:#111;color:#eee;padding:1rem;overflow:auto;word-break:break-all;">${escapeHtml(longLived)}</pre>
  <p>Meta reports roughly <strong>${escapeHtml(String(days))}</strong> days until expiry; refresh before then (<code>refresh_access_token</code> with <code>grant_type=ig_refresh_token</code>).</p>
  <p>Disable this flow when finished: unset <code>INSTAGRAM_ENABLE_OAUTH_SETUP</code> or set it to anything other than <code>true</code>.</p>
  <p><strong>Security:</strong> if your app secret was ever pasted into chat, email, or a ticket, rotate it in the Meta app dashboard and treat the old secret as compromised.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
