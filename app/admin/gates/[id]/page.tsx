import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminGateEditor } from "@/components/admin-gate-editor";
import { AdminHeader } from "@/components/admin-header";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getGateById, listUnlocks } from "@/lib/gate-store";

export default async function EditGatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const gate = await getGateById(id);
  if (!gate) notFound();

  const unlocks = await listUnlocks(gate.id, 50);

  return (
    <main>
      <AdminHeader email={admin.email} />

      <Link
        href="/admin/gates"
        className="mt-8 inline-block text-[10px] uppercase tracking-[0.25em] text-zinc-500 hover:text-white"
      >
        ← All gates
      </Link>

      <AdminGateEditor
        gate={{
          id: gate.id,
          slug: gate.slug,
          title: gate.title,
          status: gate.status,
          trackTitle: gate.trackTitle,
          trackPermalinkUrl: gate.trackPermalinkUrl,
          artistUsername: gate.artistUsername,
          requirements: gate.requirements,
          deliveryKind: gate.deliveryKind,
          // The blob URL itself stays server-side; the admin only needs to know
          // whether a file is attached and what it is called.
          hasBlobFile: Boolean(gate.deliveryBlobUrl),
          deliveryExternalUrl: gate.deliveryExternalUrl,
          deliveryFilename: gate.deliveryFilename,
          deliverySizeBytes: gate.deliverySizeBytes,
          spotifyArtistUrl: gate.spotifyArtistId
            ? `https://open.spotify.com/artist/${gate.spotifyArtistId}`
            : "",
        }}
        unlocks={unlocks.map((row) => ({
          id: row.id,
          username: row.soundcloudUsername,
          firstName: row.firstName,
          email: row.email,
          unlockedAt: row.progress.unlockedAt,
          downloadCount: row.downloadCount,
        }))}
      />
    </main>
  );
}
