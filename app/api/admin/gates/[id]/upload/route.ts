import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/admin-auth";
import { getGateById } from "@/lib/gate-store";

/**
 * Issues a short-lived token so the admin's browser can upload the deliverable
 * straight to Vercel Blob.
 *
 * Client-side upload rather than posting the file through this route because
 * serverless request bodies cap out around 4.5 MB, and a WAV master is happily
 * ten times that. We only authorize the upload here; the bytes never touch the
 * function.
 *
 * `onUploadCompleted` cannot fire against localhost (Vercel calls it as a
 * webhook), so the client persists the resulting URL with a follow-up PATCH to
 * `/api/admin/gates/[id]`. That keeps local development working and means this
 * route's only job is authorization.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is not set. Connect a Blob store in Vercel, or use a download URL instead.",
      },
      { status: 503 },
    );
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await context.params;
  const gate = await getGateById(id);
  if (!gate) {
    return NextResponse.json({ error: "Gate not found." }, { status: 404 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/x-wav",
          "audio/flac",
          "audio/x-flac",
          "audio/aiff",
          "audio/x-aiff",
          "audio/mp4",
          "audio/aac",
          "application/zip",
        ],
        // Random suffix so the storage URL is unguessable even though the
        // download is always served through our own authorizing route.
        addRandomSuffix: true,
        maximumSizeInBytes: 500 * 1024 * 1024,
        tokenPayload: JSON.stringify({ gateId: gate.id, adminId: admin.id }),
      }),
      onUploadCompleted: async () => {
        // Intentionally empty — see the note above. The client PATCHes the
        // gate with the blob URL once the upload resolves.
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = (err as Error).message;
    console.error("[gate-admin] blob upload failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
