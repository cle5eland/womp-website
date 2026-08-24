import { NextResponse } from "next/server";

import { applyAction } from "@/lib/gate-service";
import {
  readClaimFromCookies,
  readSessionFromCookies,
} from "@/lib/gate-request";
import {
  GATE_ACTION_KINDS,
  type GateActionKind,
  type GateActionResponse,
} from "@/lib/gate-types";

/**
 * Performs exactly one gate action for the claimed fan.
 *
 * SoundCloud kinds still need a live user token and one deliberate click.
 * Spotify / Instagram kinds are attestations: the fan opened the profile and
 * says they did the thing. There is deliberately no batch endpoint.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  let payload: { action?: unknown; comment?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Malformed request." }, 400);
  }

  const action = payload.action;
  if (
    typeof action !== "string" ||
    !GATE_ACTION_KINDS.includes(action as GateActionKind)
  ) {
    return json({ ok: false, error: "Unknown action." }, 400);
  }

  const comment = typeof payload.comment === "string" ? payload.comment : undefined;
  const [session, claim] = await Promise.all([
    readSessionFromCookies(),
    readClaimFromCookies(),
  ]);

  let result: Awaited<ReturnType<typeof applyAction>>;
  try {
    result = await applyAction({
      slug,
      action: action as GateActionKind,
      commentBody: comment,
      session,
      claim,
    });
  } catch (err) {
    console.error("[gate] action route threw", err);
    return json(
      { ok: false, error: "Something went wrong. Try again." },
      502,
    );
  }

  if (!result.ok) {
    return json(
      { ok: false, error: result.error, reconnect: result.reconnect },
      result.status,
    );
  }

  return json(
    { ok: true, progress: result.progress, unlocked: result.unlocked },
    200,
  );
}

function json(body: GateActionResponse, status: number) {
  return NextResponse.json(body, { status });
}
