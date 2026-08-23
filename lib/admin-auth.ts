import "server-only";

import { cookies } from "next/headers";

import { hashPassword, seal, unseal, verifyPassword } from "@/lib/crypto-utils";
import { isDatabaseConfigured } from "@/lib/db";
import {
  type AdminAccount,
  countAdmins,
  createAdmin,
  getAdminByEmail,
  getAdminById,
  recordAdminLogin,
} from "@/lib/gate-store";

/**
 * Admin authentication for the gate dashboard.
 *
 * Password-based today, but account-shaped rather than a single shared secret:
 * credentials live in `gate_admins` and every gate carries an `owner_id`, so
 * adding a second person later is a matter of inserting a row, not a schema
 * change or a data migration.
 *
 * The session cookie is encrypted and carries only the admin id; the account is
 * re-read on every request so deactivating an admin takes effect immediately
 * rather than whenever their cookie happens to expire.
 */

export const ADMIN_SESSION_COOKIE = "womp_admin";

const SESSION_PURPOSE = "admin-session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

type AdminSessionPayload = {
  v: 1;
  adminId: string;
  issuedAt: number;
};

/**
 * Admin sessions may use their own secret, but default to the gate secret.
 * That is safe because `crypto-utils` domain-separates every key by purpose, so
 * a fan session token can never be unsealed as an admin session.
 */
function sessionSecret(): string | null {
  const dedicated = process.env.ADMIN_SESSION_SECRET;
  if (dedicated) return dedicated;
  const shared = process.env.GATE_SESSION_SECRET;
  if (shared) return shared;
  return process.env.NODE_ENV === "production"
    ? null
    : "womp-admin-development-only-secret";
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Strict: nothing should ever navigate into an admin action cross-site.
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true; admin: AdminAccount; cookie: string }
  | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const secret = sessionSecret();
  if (!secret) {
    return { ok: false, error: "Admin sessions are not configured." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "The database is not configured." };
  }

  const admin = await getAdminByEmail(email.trim());

  // Same message and roughly the same work either way, so a wrong email and a
  // wrong password are not distinguishable from the outside.
  if (!admin || !admin.isActive) {
    await verifyPassword(password, DUMMY_HASH);
    return { ok: false, error: "Incorrect email or password." };
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return { ok: false, error: "Incorrect email or password." };

  await recordAdminLogin(admin.id);

  return {
    ok: true,
    admin,
    cookie: seal(
      { v: 1, adminId: admin.id, issuedAt: Date.now() } satisfies AdminSessionPayload,
      secret,
      SESSION_PURPOSE,
    ),
  };
}

/**
 * A structurally valid scrypt hash of a random value, compared against when no
 * account matches so the failure path costs about the same as the success path.
 */
const DUMMY_HASH =
  "scrypt$65536$8$1$AAAAAAAAAAAAAAAAAAAAAA$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

// ---------------------------------------------------------------------------
// Session reading
// ---------------------------------------------------------------------------

/** The signed-in admin, or `null`. Safe to call from pages and route handlers. */
export async function getCurrentAdmin(): Promise<AdminAccount | null> {
  const secret = sessionSecret();
  if (!secret || !isDatabaseConfigured()) return null;

  const jar = await cookies();
  const payload = unseal<AdminSessionPayload>(
    jar.get(ADMIN_SESSION_COOKIE)?.value,
    secret,
    SESSION_PURPOSE,
  );
  if (!payload || payload.v !== 1) return null;

  try {
    const admin = await getAdminById(payload.adminId);
    return admin?.isActive ? admin : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// First-run bootstrap
// ---------------------------------------------------------------------------

export type BootstrapState =
  | { available: true; email: string }
  | { available: false; reason: string };

/**
 * Whether the "create the first admin" path is open. It closes permanently as
 * soon as one account exists, so it cannot be used to add accounts later.
 */
export async function bootstrapState(): Promise<BootstrapState> {
  if (!isDatabaseConfigured()) {
    return { available: false, reason: "DATABASE_URL is not configured." };
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    return {
      available: false,
      reason:
        "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD to create the first admin.",
    };
  }
  if (password.length < 12) {
    return {
      available: false,
      reason: "ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.",
    };
  }

  try {
    if ((await countAdmins()) > 0) {
      return { available: false, reason: "An admin account already exists." };
    }
  } catch {
    return {
      available: false,
      reason: "Could not reach the database. Have you run `npm run db:migrate`?",
    };
  }

  return { available: true, email };
}

export async function runBootstrap(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const state = await bootstrapState();
  if (!state.available) return { ok: false, error: state.reason };

  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD!;
  const admin = await createAdmin({
    email: state.email,
    name: process.env.ADMIN_BOOTSTRAP_NAME ?? null,
    passwordHash: await hashPassword(password),
  });

  return { ok: true, email: admin.email };
}
