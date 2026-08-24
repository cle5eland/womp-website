"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bootstrap =
  | { available: true; email: string }
  | { available: false; reason: string };

/**
 * Admin sign-in, plus the one-time "create the first account" affordance.
 *
 * The bootstrap button only appears when the server has confirmed that no admin
 * exists yet and the bootstrap env vars are present — the decision is made
 * server-side, this just renders it.
 */
export function AdminLoginForm({ bootstrap }: { bootstrap: Bootstrap }) {
  const router = useRouter();
  const [email, setEmail] = useState(
    bootstrap.available ? bootstrap.email : "",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not sign in.");
        return;
      }
      router.push("/admin/gates");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function createFirstAdmin() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      const data = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create the account.");
        return;
      }
      setNotice(
        `Created ${data.email}. Sign in with ADMIN_BOOTSTRAP_PASSWORD, then remove the bootstrap variables.`,
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="username"
          required
          className="w-full border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          required
          className="w-full border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[color:var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : "Sign in"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 text-xs text-[color:var(--accent)]">{notice}</p>
      ) : null}

      {bootstrap.available ? (
        <div className="mt-8 border border-white/[0.09] bg-black/40 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            First run
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            No admin account exists yet. Create one for{" "}
            <span className="text-white">{bootstrap.email}</span> using the
            bootstrap password from your environment.
          </p>
          <button
            type="button"
            onClick={createFirstAdmin}
            disabled={busy}
            className="mt-3 border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-300 transition hover:border-white/40 hover:text-white disabled:opacity-50"
          >
            Create admin account
          </button>
        </div>
      ) : (
        <p className="mt-8 text-[10px] leading-relaxed text-zinc-600">
          {bootstrap.reason}
        </p>
      )}
    </div>
  );
}
