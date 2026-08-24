import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { authorizeDownload, noteDownload } from "@/lib/gate-service";
import { readClaimFromCookies } from "@/lib/gate-request";

/**
 * Serves the gated file, but only after re-deriving the fan's entitlement from
 * the database. Nothing the client sends is trusted, and the storage URL is
 * never exposed: Blob-backed files are streamed through this route so the
 * underlying URL cannot be shared around the gate.
 *
 * The file is always an artist-supplied asset. SoundCloud's API terms forbid
 * apps that persist or re-serve SoundCloud audio, so there is deliberately no
 * code path from a track to a download.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const claim = await readClaimFromCookies();

  const grant = await authorizeDownload({ slug, claim });
  if (!grant.ok) {
    return NextResponse.json({ error: grant.error }, { status: grant.status });
  }

  const { gate, unlock } = grant;

  // Artist-hosted files: hand the fan straight to the source. We record the
  // download first so the count is right even though we never see the bytes.
  if (gate.deliveryKind === "external_url" && gate.deliveryExternalUrl) {
    await noteDownload(unlock.id);
    return NextResponse.redirect(gate.deliveryExternalUrl);
  }

  if (!gate.deliveryBlobUrl) {
    return NextResponse.json(
      { error: "The download for this gate has not been uploaded yet." },
      { status: 503 },
    );
  }

  // The store is private, so this requires the read-write token / OIDC
  // rather than a plain fetch — `get` handles that authentication for us.
  let upstream;
  try {
    upstream = await get(gate.deliveryBlobUrl, {
      access: "private",
      useCache: false,
    });
  } catch (err) {
    console.error(`[gate] blob fetch failed for ${slug}:`, err);
    upstream = null;
  }
  if (!upstream || upstream.statusCode !== 200) {
    return NextResponse.json(
      { error: "The file could not be retrieved. Try again shortly." },
      { status: 502 },
    );
  }

  await noteDownload(unlock.id);

  const filename = gate.deliveryFilename ?? `${gate.slug}.mp3`;
  const headers = new Headers({
    "content-type":
      gate.deliveryContentType ??
      upstream.blob.contentType ??
      "application/octet-stream",
    "content-disposition": contentDisposition(filename),
    "content-length": String(upstream.blob.size),
    // Entitlement is per-fan, so this must never be cached by a CDN.
    "cache-control": "private, no-store",
  });

  return new NextResponse(upstream.stream, { status: 200, headers });
}

/**
 * RFC 6266 disposition with both a sanitised ASCII fallback and a UTF-8 form,
 * so track titles with accents or emoji still download with a sensible name.
 */
function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
