import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron-auth";
import { readAccessToken, writeAccessToken } from "@/lib/instagram-store";
import {
  redactTokens,
  refreshInstagramToken,
  sendInstagramAlert,
  verifyInstagramToken,
} from "@/lib/instagram-token-refresh";

/**
 * Weekly cron (see `vercel.json`) that keeps the long-lived Instagram token
 * alive: refresh, verify the new token actually works, then persist it. Any
 * failure alerts Discord, because an expired token can't be refreshed at all
 * and recovery requires re-running OAuth by hand.
 *
 * For a read-only "is the token alive?" check, use `/api/cron/instagram-health`
 * instead — this route rotates the token as a side effect.
 */
export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return new NextResponse(auth.message, { status: auth.status });
  }

  const currentToken = await readAccessToken();
  if (!currentToken) {
    const msg =
      "Instagram token refresh: no token configured (INSTAGRAM_ACCESS_TOKEN and Edge Config are both empty). " +
      "Run the OAuth setup flow at /api/instagram/oauth to mint one.";
    console.warn(`[instagram-refresh] ${msg}`);
    await sendInstagramAlert(msg);
    // Non-200 so this also registers in Vercel's own cron failure metrics as a
    // second signal alongside the Discord alert.
    return NextResponse.json({ ok: false, reason: "no-token" }, { status: 500 });
  }

  let newToken: string | null = null;
  try {
    const refreshed = await refreshInstagramToken(currentToken);
    newToken = refreshed.accessToken;
    await verifyInstagramToken(newToken);

    const refreshedAtIso = new Date().toISOString();
    await writeAccessToken({ accessToken: newToken, refreshedAtIso });

    const expiresInDays =
      refreshed.expiresInSeconds !== null
        ? Math.round(refreshed.expiresInSeconds / 86400)
        : null;
    console.log(
      `[instagram-refresh] refreshed successfully; valid for ~${expiresInDays ?? 60} days`,
    );
    return NextResponse.json({ ok: true, refreshedAtIso, expiresInDays });
  } catch (err) {
    // Meta echoes the token back in some error messages, and this text goes to
    // a Discord channel — strip both the old and new values before sending.
    const detail = redactTokens((err as Error).message, [
      currentToken,
      newToken,
    ]);
    const msg =
      `Instagram token refresh failed: ${detail}\n` +
      "Stats will fall back to the last stored snapshot, then to the unavailable state once that ages out. " +
      "Rotate manually via /api/instagram/oauth if this keeps failing.";
    console.warn(`[instagram-refresh] ${detail}`);
    await sendInstagramAlert(msg);
    return NextResponse.json({ ok: false, reason: detail }, { status: 500 });
  }
}
