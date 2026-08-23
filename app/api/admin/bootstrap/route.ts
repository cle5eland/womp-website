import { NextResponse } from "next/server";

import { runBootstrap } from "@/lib/admin-auth";

/**
 * Creates the very first admin account from `ADMIN_BOOTSTRAP_EMAIL` /
 * `ADMIN_BOOTSTRAP_PASSWORD`.
 *
 * Self-closing: `runBootstrap` refuses once any account exists, so this cannot
 * be used to add accounts afterwards. Clear the bootstrap env vars once you
 * have signed in successfully.
 */
export async function POST() {
  const result = await runBootstrap();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, email: result.email });
}
