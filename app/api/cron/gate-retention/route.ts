import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { pruneAbandonedUnlocks } from "@/lib/gate-store";

/**
 * Deletes abandoned gate unlock rows — ones where a fan connected but never
 * finished, so we are holding their SoundCloud handle for no reason.
 *
 * The SoundCloud API terms require not retaining personal data longer than
 * necessary. Completed unlocks are kept, because they are the record of who is
 * entitled to the download; incomplete ones have no such purpose.
 */
const RETENTION_DAYS = 30;

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return new NextResponse(auth.message, { status: auth.status });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ skipped: "DATABASE_URL is not configured." });
  }

  try {
    const deleted = await pruneAbandonedUnlocks(RETENTION_DAYS);
    if (deleted > 0) {
      console.log(
        `[gate-retention] pruned ${deleted} abandoned unlock row(s) older than ${RETENTION_DAYS}d`,
      );
    }
    return NextResponse.json({ ok: true, deleted, retentionDays: RETENTION_DAYS });
  } catch (err) {
    const message = (err as Error).message;
    console.error("[gate-retention] failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
