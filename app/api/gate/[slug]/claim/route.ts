import { NextResponse } from "next/server";

import {
  CLAIM_COOKIE,
  claimCookieOptions,
  createClaimToken,
  getSessionSecret,
} from "@/lib/gate-claim";
import { applyContact } from "@/lib/gate-service";
import type { GateActionResponse } from "@/lib/gate-types";

/**
 * Records the fan's first name, email, and required email-list opt-in — the
 * first step, and the identity we recognise them by on later visits.
 *
 * Separate from `/action` because it touches no SoundCloud API and has its own
 * consent semantics: `marketingConsent` must be true, and the timestamp we
 * store is the record that the box was ticked.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  let payload: {
    firstName?: unknown;
    email?: unknown;
    marketingConsent?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Malformed request." }, 400);
  }

  if (
    typeof payload.firstName !== "string" ||
    typeof payload.email !== "string"
  ) {
    return json({ ok: false, error: "Name and email are required." }, 400);
  }

  const result = await applyContact({
    slug,
    firstName: payload.firstName,
    email: payload.email,
    marketingConsent: payload.marketingConsent === true,
  });

  if (!result.ok) {
    return json(
      { ok: false, error: result.error, reconnect: result.reconnect },
      result.status,
    );
  }

  const secret = getSessionSecret();
  const response = json(
    { ok: true, progress: result.progress, unlocked: result.unlocked },
    200,
  );
  if (secret) {
    response.cookies.set(
      CLAIM_COOKIE,
      createClaimToken(result.claim, secret),
      claimCookieOptions(),
    );
  }
  return response;
}

function json(body: GateActionResponse, status: number) {
  return NextResponse.json(body, { status });
}
