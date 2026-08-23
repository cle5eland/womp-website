import "server-only";

import postgres from "postgres";

/**
 * Postgres connection for the download-gate tables.
 *
 * Deliberately vendor-neutral: everything goes through a standard
 * `DATABASE_URL`, so the same code runs against Neon (Vercel Marketplace),
 * Supabase, or a local Postgres. Point `DATABASE_URL` at a **pooled**
 * connection string in production — both Neon and Supabase expose one, and
 * serverless functions will exhaust a direct connection limit without it.
 *
 * `prepare: false` is required for transaction-mode poolers (PgBouncer and
 * Neon's pooler), which cannot carry named prepared statements across the
 * connection reuse boundary.
 *
 * The rest of the site predates this database and must keep working without
 * it, so `getDb()` returns `null` when `DATABASE_URL` is unset rather than
 * throwing at import time. Gate routes degrade to a "not configured" state;
 * the homepage and EPK never touch this module.
 */

type Sql = ReturnType<typeof postgres>;

declare global {
  // Reused across hot reloads in development so `next dev` does not open a new
  // pool on every file change.
  var __wompGateDb: Sql | undefined;
}

function createClient(url: string): Sql {
  return postgres(url, {
    prepare: false,
    // Serverless invocations are short-lived and concurrent; a small ceiling
    // per instance keeps us well inside the provider's connection limit.
    max: process.env.VERCEL ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Returns the shared client, or `null` when no `DATABASE_URL` is configured.
 * Callers in request paths should treat `null` as "the gate feature is not set
 * up on this deployment" and respond accordingly.
 */
export function getDb(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (!globalThis.__wompGateDb) {
    globalThis.__wompGateDb = createClient(url);
  }
  return globalThis.__wompGateDb;
}

/** Like `getDb`, but throws — for code paths that cannot proceed without it. */
export function requireDb(): Sql {
  const db = getDb();
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured; the download-gate feature is unavailable.",
    );
  }
  return db;
}
