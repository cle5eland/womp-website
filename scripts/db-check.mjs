#!/usr/bin/env node
/**
 * Verifies that the download-gate database and its surrounding configuration
 * are actually usable, and says what to do about anything that is not.
 *
 * Usage:
 *   npm run db:check
 *   DATABASE_URL=postgres://... npm run db:check
 *
 * Exits non-zero if anything required is missing, so it also works as a
 * post-deploy smoke check.
 */

import postgres from "postgres";

import { describeTarget, loadEnvLocal, sanitizeConnectionString } from "./db-url.mjs";

const PASS = "  ok  ";
const WARN = " warn ";
const FAIL = " fail ";

let failures = 0;
let warnings = 0;

function report(status, label, detail) {
  if (status === FAIL) failures += 1;
  if (status === WARN) warnings += 1;
  console.log(`[${status}] ${label}${detail ? `\n         ${detail}` : ""}`);
}

const EXPECTED_TABLES = ["gate_admins", "gates", "gate_unlocks", "schema_migrations"];

async function main() {
  await loadEnvLocal();

  console.log("Download gate — configuration check\n");

  // -- Connection ----------------------------------------------------------
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    report(
      FAIL,
      "DATABASE_URL is not set",
      "Provision Postgres (Vercel → Storage → Neon), then put the POOLED connection string here.",
    );
    return finish();
  }

  const url = sanitizeConnectionString(raw);
  if (url !== raw) {
    report(
      PASS,
      "DATABASE_URL contains client-only parameters; they are ignored automatically",
      "Nothing to change — pasting the provider's string verbatim is fine.",
    );
  }

  // A pooled endpoint matters on serverless: without it, concurrent functions
  // will exhaust the provider's direct connection limit under load.
  if (/neon\.tech/i.test(url) && !/-pooler\./i.test(url)) {
    report(
      WARN,
      "This looks like a Neon DIRECT connection string",
      "Use the pooled one (host contains `-pooler`) for serverless, or you will hit connection limits.",
    );
  } else if (/supabase\.(com|co)/i.test(url) && !/pooler\.supabase/i.test(url)) {
    report(
      WARN,
      "This looks like a Supabase DIRECT connection string",
      "Use the connection pooler string (port 6543 / `pooler.supabase.com`) for serverless.",
    );
  }

  console.log(`\nConnecting to ${describeTarget(url)} …\n`);

  const sql = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 15,
    onnotice: () => {},
  });

  try {
    const started = Date.now();
    const [{ version }] = await sql`select version()`;
    const elapsed = Date.now() - started;
    report(
      PASS,
      `Connected in ${elapsed} ms`,
      version.split(" ").slice(0, 2).join(" "),
    );
    if (elapsed > 3000) {
      report(
        WARN,
        "That connection was slow",
        "Likely a cold start from scale-to-zero, which is expected on the first hit after idle.",
      );
    }

    // -- Schema ------------------------------------------------------------
    const tables = (
      await sql`
        select table_name from information_schema.tables
        where table_schema = 'public'
      `
    ).map((row) => row.table_name);

    const missing = EXPECTED_TABLES.filter((name) => !tables.includes(name));
    if (missing.length > 0) {
      report(
        FAIL,
        `Missing table(s): ${missing.join(", ")}`,
        "Run `npm run db:migrate`.",
      );
    } else {
      report(PASS, "Schema is present");
    }

    // -- Write access ------------------------------------------------------
    // A read-only or restricted role fails here rather than at 2am on a gate.
    try {
      await sql.begin(async (tx) => {
        await tx`create temporary table _gate_check (id int)`;
        await tx`insert into _gate_check values (1)`;
      });
      report(PASS, "Role can write");
    } catch (err) {
      report(FAIL, "Role cannot write", err.message);
    }

    // -- Data ---------------------------------------------------------------
    if (missing.length === 0) {
      const [{ count: admins }] = await sql`select count(*)::int from gate_admins`;
      if (admins === 0) {
        const ready =
          process.env.ADMIN_BOOTSTRAP_EMAIL && process.env.ADMIN_BOOTSTRAP_PASSWORD;
        report(
          ready ? WARN : FAIL,
          "No admin account yet",
          ready
            ? "Bootstrap vars are set — visit /admin/login and press “Create admin account”."
            : "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (12+ chars), then visit /admin/login.",
        );
      } else {
        report(PASS, `${admins} admin account(s)`);
      }

      const [{ count: gates }] = await sql`select count(*)::int from gates`;
      const [{ count: published }] =
        await sql`select count(*)::int from gates where status = 'published'`;
      report(PASS, `${gates} gate(s), ${published} published`);
    }
  } catch (err) {
    report(FAIL, "Could not query the database", `${err.code ?? ""} ${err.message}`.trim());
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }

  // -- Surrounding configuration ------------------------------------------
  console.log("");
  checkEnv(
    "GATE_SESSION_SECRET",
    "Required in production — encrypts the fan session cookie and signs OAuth state. Generate with `openssl rand -base64 32`.",
    { required: true, minLength: 24 },
  );
  checkEnv(
    "SOUNDCLOUD_CLIENT_ID",
    "Needed for the real SoundCloud flow. Register an app (Artist Pro required).",
    { required: true },
  );
  checkEnv("SOUNDCLOUD_CLIENT_SECRET", "Pairs with SOUNDCLOUD_CLIENT_ID.", {
    required: true,
  });
  checkEnv(
    "SOUNDCLOUD_OAUTH_REDIRECT_URI",
    "Must exactly match the single redirect URI registered on the SoundCloud app.",
    { required: true },
  );
  checkEnv(
    "BLOB_READ_WRITE_TOKEN",
    "Only needed to upload files through the admin UI; an artist-hosted download URL works without it.",
    { required: false },
  );
  checkEnv(
    "PRIVACY_CONTACT_EMAIL",
    "Shown on /privacy for data deletion requests.",
    { required: false },
  );

  if (process.env.GATE_MOCK_SOUNDCLOUD === "true") {
    report(
      WARN,
      "GATE_MOCK_SOUNDCLOUD=true — SoundCloud is stubbed",
      "Fine locally; it is ignored when NODE_ENV=production.",
    );
  }

  finish();
}

function checkEnv(name, guidance, { required, minLength = 1 }) {
  const value = process.env[name];
  if (!value) {
    report(required ? FAIL : WARN, `${name} is not set`, guidance);
  } else if (value.length < minLength) {
    report(WARN, `${name} looks too short`, guidance);
  } else {
    report(PASS, `${name} is set`);
  }
}

function finish() {
  console.log("");
  if (failures > 0) {
    console.log(
      `${failures} problem(s) to fix${warnings ? `, ${warnings} warning(s)` : ""}.`,
    );
    process.exit(1);
  }
  console.log(
    warnings > 0
      ? `Ready, with ${warnings} warning(s) above.`
      : "Everything checks out.",
  );
}

main().catch((err) => {
  console.error("\nCheck failed unexpectedly:", err.message);
  process.exit(1);
});
