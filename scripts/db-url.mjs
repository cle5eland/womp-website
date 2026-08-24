/**
 * Connection-string handling shared by the db scripts.
 *
 * Mirrors `sanitizeConnectionString` in `lib/db.ts` — keep the two lists in
 * step. They are separate because the app is TypeScript and these are plain
 * node scripts run outside the bundler.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_ONLY_PARAMS = new Set([
  "channel_binding",
  "pgbouncer",
  "connection_limit",
  "pool_timeout",
  "target_session_attrs",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "schema",
]);

/**
 * Remove parameters that belong to the client rather than the server.
 * postgres.js forwards unrecognised query parameters to Postgres as startup
 * options, and Postgres rejects unknown ones — so Neon's default string
 * (`channel_binding=require`) or Supabase's pooled string (`pgbouncer=true`)
 * would otherwise fail to connect for a non-obvious reason.
 */
export function sanitizeConnectionString(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  for (const key of [...parsed.searchParams.keys()]) {
    if (CLIENT_ONLY_PARAMS.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  return parsed.toString();
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Populate `process.env` from `.env.local` when the variable is not already
 * set, so the scripts work the same way `next dev` does.
 */
export async function loadEnvLocal() {
  try {
    const contents = await readFile(join(REPO_ROOT, ".env.local"), "utf8");
    for (const line of contents.split("\n")) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    // No .env.local — rely on the ambient environment.
  }
}

/** Reads DATABASE_URL, exiting with guidance when it is missing. */
export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local, or pass it inline:\n" +
        "  DATABASE_URL=postgres://... npm run db:migrate",
    );
    process.exit(1);
  }
  return sanitizeConnectionString(url);
}

/** Hides credentials so a connection target can be printed safely. */
export function describeTarget(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "(unparseable connection string)";
  }
}
