import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gate admin",
  robots: { index: false, follow: false },
};

/**
 * Every admin route depends on the session cookie and on live database reads.
 * Without this, a build with no `DATABASE_URL` prerenders these pages as a
 * static "redirect to login" and production would serve that cached redirect to
 * signed-in admins forever.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        {children}
      </div>
    </div>
  );
}
