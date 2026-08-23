import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron-auth";
import { fetchInstagramStatsLive } from "@/lib/instagram-stats";
import { readRefreshedAt, writeStatsSnapshot } from "@/lib/instagram-store";
import {
  pingHeartbeat,
  sendInstagramAlert,
} from "@/lib/instagram-token-refresh";

/**
 * Daily health check (see `vercel.json`), covering the two gaps the weekly
 * refresh cron can't:
 *
 *   - a token can die between refreshes (a password change or a revoked app
 *     grant kills it immediately), so we exercise the real data path daily
 *     rather than trusting last Sunday's success;
 *   - if the refresh cron itself stops running, nothing else would notice, so
 *     we alert when the last successful refresh gets too old.
 *
 * On success it stores the stats as the last-known-good snapshot, which is
 * what `getInstagramStatsSafe` serves when the live call fails. That's what
 * keeps a token problem off the page entirely.
 *
 * This route is also the safe way to answer "is the token alive right now?" by
 * hand — unlike the refresh route, it doesn't rotate anything.
 */

/**
 * Refresh runs weekly, so ~10 days without a success means at least one run
 * was missed. Comfortably inside the 60-day expiry window, so there's time to
 * fix it before anything user-visible breaks.
 */
const REFRESH_STALE_AFTER_DAYS = 10;

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return new NextResponse(auth.message, { status: auth.status });
  }

  const problems: string[] = [];

  const live = await fetchInstagramStatsLive();
  if (live) {
    try {
      await writeStatsSnapshot(live);
    } catch (err) {
      problems.push(`could not store stats snapshot: ${(err as Error).message}`);
    }
  } else {
    problems.push(
      "the Instagram API returned no usable data (see the [instagram] server logs for the exact error)",
    );
  }

  const refreshedAt = await readRefreshedAt();
  if (refreshedAt) {
    const ageDays = (Date.now() - refreshedAt.getTime()) / 86_400_000;
    if (ageDays > REFRESH_STALE_AFTER_DAYS) {
      problems.push(
        `the token refresh cron last succeeded ${Math.round(ageDays)} days ago — it may have stopped running`,
      );
    }
  }

  if (problems.length > 0) {
    const msg = [
      "Instagram health check found problems:",
      ...problems.map((p) => `- ${p}`),
      "Rotate the token manually via /api/instagram/oauth if the refresh cron can't recover on its own.",
    ].join("\n");
    console.warn(`[instagram-health] ${problems.join("; ")}`);
    await sendInstagramAlert(msg);
    return NextResponse.json({ ok: false, problems }, { status: 500 });
  }

  // Only ping the external dead-man's-switch on a fully clean run, so a
  // missing ping means "something is wrong" and not merely "cron didn't fire".
  await pingHeartbeat();

  return NextResponse.json({
    ok: true,
    username: live?.username ?? null,
    followersCount: live?.followersCount ?? null,
    lastRefreshAt: refreshedAt?.toISOString() ?? null,
  });
}
