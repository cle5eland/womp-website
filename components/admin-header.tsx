"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
      <Link
        href="/admin/gates"
        className="text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500 transition hover:text-white"
      >
        womp · gate admin
      </Link>
      <div className="flex items-center gap-4">
        <span className="hidden text-[11px] text-zinc-600 sm:inline">{email}</span>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-500 transition hover:text-white disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
