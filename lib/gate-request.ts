import "server-only";

import { cookies } from "next/headers";

import {
  FAN_SESSION_COOKIE,
  type FanSession,
  getSessionSecret,
  readFanSession,
} from "@/lib/soundcloud-user-auth";

/**
 * Reads the connected fan out of the request cookie jar. Shared by the gate
 * page and every gate route so the cookie name and secret are looked up in
 * exactly one place.
 */
export async function readSessionFromCookies(): Promise<FanSession | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const jar = await cookies();
  return readFanSession(jar.get(FAN_SESSION_COOKIE)?.value, secret);
}
