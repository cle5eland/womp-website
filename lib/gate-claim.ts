import "server-only";

import { seal, unseal } from "@/lib/crypto-utils";
import {
  cookieOptions,
  getSessionSecret,
} from "@/lib/soundcloud-user-auth";

/**
 * Email-identity cookie for download gates.
 *
 * The fan's name and email are how we recognise them across visits and
 * platforms. SoundCloud's session cookie is only a capability token for the
 * like/repost/comment/follow writes; this cookie is who they are. Encrypted
 * rather than signed because it is personal data, even though it is not a
 * bearer credential.
 */

export const CLAIM_COOKIE = "womp_gate_claim";
export const CLAIM_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const CLAIM_PURPOSE = "gate-claim";

export type GateClaim = {
  email: string;
  firstName: string;
};

type ClaimPayload = {
  v: 1;
  email: string;
  firstName: string;
};

export function createClaimToken(claim: GateClaim, secret: string): string {
  return seal(
    {
      v: 1,
      email: claim.email,
      firstName: claim.firstName,
    } satisfies ClaimPayload,
    secret,
    CLAIM_PURPOSE,
  );
}

export function readClaimToken(
  cookieValue: string | undefined,
  secret: string,
): GateClaim | null {
  const payload = unseal<ClaimPayload>(cookieValue, secret, CLAIM_PURPOSE);
  if (
    !payload ||
    payload.v !== 1 ||
    typeof payload.email !== "string" ||
    typeof payload.firstName !== "string"
  ) {
    return null;
  }
  return { email: payload.email, firstName: payload.firstName };
}

export function claimCookieOptions() {
  return cookieOptions(CLAIM_COOKIE_MAX_AGE);
}

export { getSessionSecret };
