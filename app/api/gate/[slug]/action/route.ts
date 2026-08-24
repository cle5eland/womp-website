import { NextResponse } from "next/server";

import { applyAction } from "@/lib/gate-service";
import { readSessionFromCookies } from "@/lib/gate-request";
import {
  GATE_ACTION_KINDS,
  type GateActionKind,
  type GateActionResponse,
} from "@/lib/gate-types";

/**
 * Performs exactly one SoundCloud action for the connected fan.
 *
 * One action per request, by design. The API terms only permit acting on a
 * user's behalf for actions "specifically and deliberately initiated by the
 * user", so there is deliberately no batch endpoint that would let the UI fire
 * all four from a single press.
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
  const session = await readSessionFromCookies();

  let result: Awaited<ReturnType<typeof applyAction>>;
  try {
    result = await applyAction({
      slug,
      action: action as GateActionKind,
      commentBody: comment,
      session,
    });
  } catch (err) {
    console.error("[gate] action route threw", err);
    return json(
      { ok: false, error: "SoundCloud is having trouble. Try again." },
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
