import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/admin-auth";
import { getGateById, listUnlocks } from "@/lib/gate-store";

/**
 * CSV export of a gate's unlocks — the mailing list the gate exists to build.
 *
 * Only completed unlocks are exported: a row where the fan bailed halfway has
 * no email on it and is not a contact.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await context.params;
  const gate = await getGateById(id);
  if (!gate) {
    return NextResponse.json({ error: "Gate not found." }, { status: 404 });
  }

  const unlocks = await listUnlocks(id, 5000);
  const completed = unlocks.filter((row) => row.progress.unlockedAt !== null);

  const header = [
    "first_name",
    "email",
    "soundcloud_username",
    "marketing_consent",
    "liked_at",
    "reposted_at",
    "commented_at",
    "followed_at",
    "unlocked_at",
    "download_count",
  ];

  const lines = [header.join(",")];
  for (const row of completed) {
    lines.push(
      [
        row.firstName ?? "",
        row.email ?? "",
        row.soundcloudUsername,
        row.marketingConsentAt ? "yes" : "no",
        row.progress.like ?? "",
        row.progress.repost ?? "",
        row.progress.comment ?? "",
        row.progress.follow ?? "",
        row.progress.unlockedAt ?? "",
        String(row.downloadCount),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${gate.slug}-unlocks.csv"`,
      "cache-control": "private, no-store",
    },
  });
}

/**
 * Quote defensively. A leading `=`, `+`, `-` or `@` is prefixed with an
 * apostrophe so a spreadsheet treats a hostile display name as text rather than
 * a formula.
 */
function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}
