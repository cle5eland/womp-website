#!/usr/bin/env node
/**
 * Applies SQL migrations in `db/migrations` in filename order.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npm run db:migrate
 *
 * Applied versions are recorded in `schema_migrations`, so re-running is a
 * no-op. Each migration runs inside its own transaction: a failure rolls that
 * file back and stops the run rather than leaving the schema half-applied.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations",
);

function loadEnvFile() {
  // `node --env-file` is not available on every Node version we support, so
  // read .env.local ourselves when DATABASE_URL is not already set.
  if (process.env.DATABASE_URL) return Promise.resolve();
  const path = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  return readFile(path, "utf8")
    .then((contents) => {
      for (const line of contents.split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        const value = match[2].replace(/^["']|["']$/g, "");
        if (!process.env[match[1]]) process.env[match[1]] = value;
      }
    })
    .catch(() => {});
}

async function main() {
  await loadEnvFile();

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local or pass it inline:\n" +
        "  DATABASE_URL=postgres://... npm run db:migrate",
    );
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

  try {
    await sql`
      create table if not exists schema_migrations (
        version    text primary key,
        applied_at timestamptz not null default now()
      )
    `;

    const applied = new Set(
      (await sql`select version from schema_migrations`).map(
        (row) => row.version,
      ),
    );

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migrations found.");
      return;
    }

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`· ${file} (already applied)`);
        continue;
      }
      const contents = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      process.stdout.write(`→ ${file} ... `);
      await sql.begin(async (tx) => {
        await tx.unsafe(contents);
        await tx`insert into schema_migrations (version) values (${file})`;
      });
      console.log("done");
      ran += 1;
    }

    console.log(
      ran === 0
        ? "Schema already up to date."
        : `Applied ${ran} migration${ran === 1 ? "" : "s"}.`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
