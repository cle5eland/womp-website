import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  type UpdateGatePatch,
  deleteGate,
  getGateById,
  updateGate,
} from "@/lib/gate-store";
import {
  GATE_ACTION_KINDS,
  type GateRequirements,
  type GateStatus,
} from "@/lib/gate-types";

const STATUSES: GateStatus[] = ["draft", "published", "archived"];

/** Updates a gate: copy, required actions, delivery target, or status. */
export async function PATCH(
  request: Request,
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

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const patch: UpdateGatePatch = {};

  if (typeof payload.title === "string") {
    const title = payload.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    patch.title = title;
  }

  if (typeof payload.description === "string") {
    patch.description = payload.description.trim() || null;
  }

  if (payload.status !== undefined) {
    if (
      typeof payload.status !== "string" ||
      !STATUSES.includes(payload.status as GateStatus)
    ) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = payload.status as GateStatus;
  }

  if (payload.requirements !== undefined) {
    const source = payload.requirements as Record<string, unknown>;
    const requirements = {} as GateRequirements;
    for (const kind of GATE_ACTION_KINDS) {
      requirements[kind] = source?.[kind] === true;
    }
    patch.requirements = requirements;
  }

  // Delivery: either a Blob upload the client just completed, or an
  // artist-hosted URL. Setting one clears the other so a gate can never have
  // two conflicting sources.
  if (typeof payload.deliveryBlobUrl === "string" && payload.deliveryBlobUrl) {
    if (!isBlobUrl(payload.deliveryBlobUrl)) {
      return NextResponse.json(
        { error: "That does not look like a Vercel Blob URL." },
        { status: 400 },
      );
    }
    patch.deliveryKind = "blob";
    patch.deliveryBlobUrl = payload.deliveryBlobUrl;
    patch.deliveryExternalUrl = null;
    if (typeof payload.deliveryFilename === "string") {
      patch.deliveryFilename = payload.deliveryFilename.slice(0, 255);
    }
    if (typeof payload.deliveryContentType === "string") {
      patch.deliveryContentType = payload.deliveryContentType.slice(0, 128);
    }
    if (typeof payload.deliverySizeBytes === "number") {
      patch.deliverySizeBytes = Math.max(0, Math.floor(payload.deliverySizeBytes));
    }
  } else if (typeof payload.deliveryExternalUrl === "string") {
    const url = payload.deliveryExternalUrl.trim();
    if (url.length === 0) {
      patch.deliveryExternalUrl = null;
    } else if (!isHttpUrl(url)) {
      return NextResponse.json(
        { error: "Enter a full https:// download URL." },
        { status: 400 },
      );
    } else {
      patch.deliveryKind = "external_url";
      patch.deliveryExternalUrl = url;
      patch.deliveryBlobUrl = null;
      if (typeof payload.deliveryFilename === "string") {
        patch.deliveryFilename = payload.deliveryFilename.trim().slice(0, 255) || null;
      }
    }
  }

  // Publishing implies the gate is complete enough to hand to the public.
  const nextStatus = patch.status ?? gate.status;
  if (nextStatus === "published") {
    const blob = patch.deliveryBlobUrl ?? gate.deliveryBlobUrl;
    const external =
      patch.deliveryExternalUrl !== undefined
        ? patch.deliveryExternalUrl
        : gate.deliveryExternalUrl;
    if (!blob && !external) {
      return NextResponse.json(
        { error: "Attach a file or a download URL before publishing." },
        { status: 400 },
      );
    }
    const requirements = patch.requirements ?? gate.requirements;
    if (!GATE_ACTION_KINDS.some((kind) => requirements[kind])) {
      return NextResponse.json(
        { error: "A published gate needs at least one required action." },
        { status: 400 },
      );
    }
  }

  const updated = await updateGate(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Gate not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteGate(id);
  return NextResponse.json({ ok: true });
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Only accept URLs on Vercel's Blob host. Without this, an admin typo (or a
 * tampered client request) could point the streaming download route at an
 * arbitrary server and have us fetch it.
 */
function isBlobUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
        parsed.hostname.endsWith(".blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}
