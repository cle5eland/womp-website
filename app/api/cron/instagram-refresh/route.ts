import { NextResponse } from "next/server";

import { resolveInstagramAccessToken } from "@/lib/instagram-stats";
import {
  refreshInstagramToken,
  sendInstagramAlert,
  verifyInstagramToken,
  writeInstagramTokenToEdgeConfig,
} from "@/lib/instagram-token-refresh";

/**
 * Weekly cron (see `vercel.json`) that keeps the Instagram long-lived token
 * alive indefinitely: refresh -> verify -> persist to Edge Config. Any
 * failure sends a Discord alert with the underlying reason (e.g. "token
 * already expired") so a human can rotate it manually via
 * `/api/instagram/oauth` well before the page-facing stats break.
 *
 * Protected by `CRON_SECRET`: Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` on cron-triggered requests when that
 * env var is set. See https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const currentToken = await resolveInstagramAccessToken();
  if (!currentToken) {
    const msg =
      "🔴 Instagram token refresh: no token configured (INSTAGRAM_ACCESS_TOKEN / Edge Config both empty). " +
      "Run the OAuth setup flow at /api/instagram/oauth to mint one.";
    console.warn(`[instagram-refresh] ${msg}`);
    await sendInstagramAlert(msg);
    // Non-200 so this also registers in Vercel's own cron/function failure
    // metrics as a second, independent signal alongside the Discord alert.
    return NextResponse.json({ ok: false, reason: "no-token" }, { status: 500 });
  }

  try {
    const { accessToken, expiresInSeconds } =
      await refreshInstagramToken(currentToken);
    await verifyInstagramToken(accessToken);

    const refreshedAtIso = new Date().toISOString();
    await writeInstagramTokenToEdgeConfig({
      accessToken,
      refreshedAtIso,
    });

    const days =
      typeof expiresInSeconds === "number"
        ? Math.round(expiresInSeconds / 86400)
        : "~60";
    console.log(
      `[instagram-refresh] refreshed successfully; new token valid for ~${days} days`,
    );
    return NextResponse.json({ ok: true, refreshedAtIso, expiresInDays: days });
  } catch (err) {
    const detail = (err as Error).message;
    const msg =
      `🔴 Instagram token refresh failed: ${detail}\n` +
      "The site will keep showing the placeholder 'Data unavailable — check Instagram token.' " +
      "until this is fixed. Rotate manually via /api/instagram/oauth if this keeps failing.";
    console.warn(`[instagram-refresh] ${detail}`);
    await sendInstagramAlert(msg);
    return NextResponse.json({ ok: false, reason: detail }, { status: 500 });
  }
}
