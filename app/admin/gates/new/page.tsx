import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin-header";
import { AdminGateCreateForm } from "@/components/admin-gate-create-form";
import { getCurrentAdmin } from "@/lib/admin-auth";

export default async function NewGatePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <main>
      <AdminHeader email={admin.email} />

      <Link
        href="/admin/gates"
        className="mt-8 inline-block text-[10px] uppercase tracking-[0.25em] text-zinc-500 hover:text-white"
      >
        ← All gates
      </Link>

      <h1 className="font-display mt-3 text-3xl leading-none text-white">
        New gate
      </h1>
      <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-500">
        Paste the SoundCloud track URL and pick a URL slug. The headline
        defaults to the track title; artwork and artist are also read from
        SoundCloud. The gate is created as a draft — attach the download file
        on the next screen, then publish.
      </p>

      <AdminGateCreateForm />
    </main>
  );
}
