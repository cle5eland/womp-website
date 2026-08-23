import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  cookieOptions,
  login,
} from "@/lib/admin-auth";

/** Admin sign-in. */
export async function POST(request: Request) {
  let payload: { email?: unknown; password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (typeof payload.email !== "string" || typeof payload.password !== "string") {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const result = await login(payload.email, payload.password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    result.cookie,
    cookieOptions(ADMIN_SESSION_MAX_AGE),
  );
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", cookieOptions(0));
  return response;
}
