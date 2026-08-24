import "server-only";

import { cookies } from "next/headers";

import {
  CLAIM_COOKIE,
  type GateClaim,
  readClaimToken,
} from "@/lib/gate-claim";
import {
  FAN_SESSION_COOKIE,
  type FanSession,
  getSessionSecret,
  readFanSession,
} from "@/lib/soundcloud-user-auth";

/**
 * Reads the claim and SoundCloud cookies out of the request jar. Shared by the
 * gate page and every gate route so cookie names and secrets are looked up in
 * exactly one place.
 */

export async function readClaimFromCookies(): Promise<GateClaim | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const jar = await cookies();
  return readClaimToken(jar.get(CLAIM_COOKIE)?.value, secret);
}

export async function readSessionFromCookies(): Promise<FanSession | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const jar = await cookies();
  return readFanSession(jar.get(FAN_SESSION_COOKIE)?.value, secret);
}
