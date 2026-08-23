import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin-header";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { listGates } from "@/lib/gate-store";

export default async function AdminGatesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const gates = await listGates(admin.id);

  return (
    <main>
      <AdminHeader email={admin.email} />

      <div className="mt-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl leading-none text-white">Gates</h1>
        <Link
          href="/admin/gates/new"
          className="border border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[color:var(--accent)]/30"
        >
          New gate
        </Link>
      </div>

      {gates.length === 0 ? (
        <p className="mt-8 border border-white/[0.09] bg-black/40 px-4 py-6 text-sm text-zinc-500">
          No gates yet. Create one to get started.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-white/[0.07] border border-white/[0.09] bg-black/40">
          {gates.map((gate) => (
            <li
              key={gate.id}
              className="flex flex-wrap items-center gap-4 px-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/gates/${gate.id}`}
                  className="truncate text-sm font-medium text-white hover:text-[color:var(--accent)]"
                >
                  {gate.title}
                </Link>
                <p className="mt-1 truncate text-[11px] text-zinc-500">
                  /gate/{gate.slug} · {gate.trackTitle}
                </p>
              </div>

              <StatusPill status={gate.status} />

              <div className="flex gap-6 text-right">
                <Metric label="Unlocks" value={gate.unlockCount} />
                <Metric label="Downloads" value={gate.downloadCount} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-xl leading-none text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-zinc-600">
        {label}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "border-[color:var(--accent)]/50 text-[color:var(--accent)]",
    draft: "border-white/15 text-zinc-400",
    archived: "border-white/10 text-zinc-600",
  };
  return (
    <span
      className={`border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.25em] ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
