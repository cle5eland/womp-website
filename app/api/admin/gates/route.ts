import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/admin-auth";
import { createGate, isSlugTaken } from "@/lib/gate-store";
import {
  GATE_ACTION_KINDS,
  type GateRequirements,
  isValidSlug,
  normalizeSlug,
} from "@/lib/gate-types";
import { resolveTrackByUrl } from "@/lib/soundcloud-actions";

/**
 * Creates a gate from a pasted SoundCloud track URL.
 *
 * The track is resolved server-side so the stored URN, numeric id, title and
 * artist all come from SoundCloud rather than from the form — the admin only
 * supplies the URL, the slug, and which actions to require. The public
 * headline defaults to the SoundCloud track title.
 *
 * New gates always start as drafts. Publishing is a separate PATCH, which keeps
 * a half-configured gate (no file attached yet) from being publicly reachable.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let payload: {
    soundcloudUrl?: unknown;
    slug?: unknown;
    title?: unknown;
    requirements?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (typeof payload.soundcloudUrl !== "string" || !payload.soundcloudUrl.trim()) {
    return NextResponse.json(
      { error: "Paste the SoundCloud track URL." },
      { status: 400 },
    );
  }

  const slug = normalizeSlug(
    typeof payload.slug === "string" ? payload.slug : "",
  );
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      {
        error:
          "Slug must be lowercase letters, numbers and hyphens, e.g. `midnight-vip`.",
      },
      { status: 400 },
    );
  }
  if (await isSlugTaken(slug)) {
    return NextResponse.json(
      { error: `The slug "${slug}" is already in use.` },
      { status: 409 },
    );
  }

  const requirements = parseRequirements(payload.requirements);

  const resolved = await resolveTrackByUrl(payload.soundcloudUrl);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 422 });
  }

  // A gate that requires a comment on a track with comments turned off could
  // never be completed, so refuse it rather than shipping a dead end.
  if (requirements.comment && !resolved.track.commentable) {
    return NextResponse.json(
      {
        error:
          "Comments are disabled on that track, so a comment cannot be required. Enable comments on SoundCloud or untick the comment step.",
      },
      { status: 422 },
    );
  }

  const title =
    typeof payload.title === "string" && payload.title.trim().length > 0
      ? payload.title.trim()
      : resolved.track.title;

  const gate = await createGate({
    ownerId: admin.id,
    slug,
    title,
    description: null,
    soundcloudUrl: payload.soundcloudUrl.trim(),
    trackUrn: resolved.track.trackUrn,
    trackId: resolved.track.trackId,
    trackTitle: resolved.track.title,
    trackPermalinkUrl: resolved.track.permalinkUrl,
    artworkUrl: resolved.track.artworkUrl,
    artistUserUrn: resolved.track.artistUserUrn,
    artistUsername: resolved.track.artistUsername,
    requirements,
  });

  return NextResponse.json({ ok: true, id: gate.id, slug: gate.slug });
}

/** Defaults to requiring everything; only explicit `false` turns a step off. */
export function parseRequirements(value: unknown): GateRequirements {
  const source = (value ?? {}) as Record<string, unknown>;
  const requirements = {} as GateRequirements;
  for (const kind of GATE_ACTION_KINDS) {
    requirements[kind] = source[kind] !== false;
  }
  return requirements;
}
