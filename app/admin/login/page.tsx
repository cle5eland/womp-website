import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { bootstrapState, getCurrentAdmin } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/gates");

  const dbReady = isDatabaseConfigured();
  const bootstrap = dbReady
    ? await bootstrapState()
    : { available: false as const, reason: "DATABASE_URL is not configured." };

  return (
    <main className="mx-auto max-w-md">
      <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
        womp
      </p>
      <h1 className="font-display mt-2 text-4xl leading-none text-white">
        Gate admin
      </h1>

      {!dbReady ? (
        <p className="mt-8 border border-amber-400/40 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-200">
          <code>DATABASE_URL</code> is not configured, so gates are unavailable
          on this deployment. Add it and run{" "}
          <code>npm run db:migrate</code>.
        </p>
      ) : (
        <AdminLoginForm
          bootstrap={
            bootstrap.available
              ? { available: true, email: bootstrap.email }
              : { available: false, reason: bootstrap.reason }
          }
        />
      )}
    </main>
  );
}
