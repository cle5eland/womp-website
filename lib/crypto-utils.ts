import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from "node:crypto";

/**
 * Primitives shared by the download-gate session and OAuth-state code.
 *
 * Three jobs:
 *   - `seal` / `unseal`  — authenticated encryption (AES-256-GCM) for cookies
 *     that carry a fan's SoundCloud access token. We encrypt rather than merely
 *     sign because the payload is a bearer credential.
 *   - `sign` / `verify`  — HMAC-SHA256 for values that are not secret but must
 *     not be forgeable, i.e. the OAuth `state` parameter.
 *   - `hashPassword` / `verifyPassword` — scrypt for admin credentials.
 *
 * Every secret is run through HKDF with a purpose-specific `info` label, so a
 * single env secret yields independent keys per use and a token minted for one
 * purpose can never be unsealed as another.
 */

/**
 * Hand-rolled rather than `promisify`d: `promisify` resolves to the
 * three-argument overload of `scrypt`, which cannot pass tuning parameters.
 */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

const KEY_BYTES = 32;
const IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_KEY_BYTES = 64;
/** OWASP-recommended floor for interactive logins. */
const SCRYPT_COST = 2 ** 16;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
/** scryptSync's default maxmem (32 MB) is too small for N=2^16, r=8. */
const SCRYPT_MAXMEM = 192 * 1024 * 1024;

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

/**
 * Derive a fixed-length key from an arbitrary-length env secret. The `purpose`
 * label is the HKDF `info` parameter, which is what keeps the fan-session key
 * distinct from the state-signing key even when both come from one secret.
 */
function deriveKey(secret: string, purpose: string): Buffer {
  if (!secret) throw new Error("crypto-utils: empty secret");
  return Buffer.from(
    hkdfSync("sha256", secret, "womp-gate-v1", purpose, KEY_BYTES),
  );
}

// ---------------------------------------------------------------------------
// Authenticated encryption
// ---------------------------------------------------------------------------

/**
 * Encrypt a JSON-serializable value into an opaque, tamper-evident string.
 *
 * Format: `v1.<base64url iv>.<base64url ciphertext||tag>`
 */
export function seal(
  payload: unknown,
  secret: string,
  purpose: string,
): string {
  const key = deriveKey(secret, purpose);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    toBase64Url(iv),
    toBase64Url(Buffer.concat([ciphertext, tag])),
  ].join(".");
}

/**
 * Reverse of `seal`. Returns `null` for anything that is not a well-formed,
 * authentic token sealed with the same secret and purpose — a wrong key, a
 * truncated cookie, a tampered payload, and a token from another purpose are
 * all indistinguishable to the caller, which is what we want.
 */
export function unseal<T>(
  token: string | undefined | null,
  secret: string,
  purpose: string,
): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  try {
    const key = deriveKey(secret, purpose);
    const iv = fromBase64Url(parts[1]);
    const combined = fromBase64Url(parts[2]);
    if (iv.length !== IV_BYTES || combined.length <= GCM_TAG_BYTES) return null;

    const ciphertext = combined.subarray(0, combined.length - GCM_TAG_BYTES);
    const tag = combined.subarray(combined.length - GCM_TAG_BYTES);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch {
    // Bad tag, bad key, or malformed JSON — all treated as "not authentic".
    return null;
  }
}

// ---------------------------------------------------------------------------
// Signing (non-secret but unforgeable)
// ---------------------------------------------------------------------------

/**
 * Sign a JSON-serializable value. The payload stays readable — use this only
 * for values that are not confidential, such as the OAuth `state` parameter,
 * which SoundCloud echoes back through the user's browser.
 *
 * Format: `<base64url json>.<base64url hmac>`
 */
export function sign(payload: unknown, secret: string, purpose: string): string {
  const key = deriveKey(secret, purpose);
  const body = toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  const mac = createHmac("sha256", key).update(body).digest();
  return `${body}.${toBase64Url(mac)}`;
}

/** Reverse of `sign`. Returns `null` when the signature does not match. */
export function verify<T>(
  token: string | undefined | null,
  secret: string,
  purpose: string,
): T | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const provided = token.slice(separator + 1);

  try {
    const key = deriveKey(secret, purpose);
    const expected = createHmac("sha256", key).update(body).digest();
    const providedMac = fromBase64Url(provided);
    if (providedMac.length !== expected.length) return null;
    if (!timingSafeEqual(providedMac, expected)) return null;
    return JSON.parse(fromBase64Url(body).toString("utf8")) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

/**
 * Hash an admin password with scrypt.
 *
 * Format: `scrypt$<N>$<r>$<p>$<base64url salt>$<base64url hash>`. The
 * parameters are stored alongside the digest so they can be raised later
 * without invalidating existing hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derived = await scrypt(password, salt, SCRYPT_KEY_BYTES, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: SCRYPT_MAXMEM,
  });
  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    toBase64Url(salt),
    toBase64Url(derived),
  ].join("$");
}

/** Constant-time password check against a hash produced by `hashPassword`. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number.parseInt(parts[1], 10);
  const r = Number.parseInt(parts[2], 10);
  const p = Number.parseInt(parts[3], 10);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  try {
    const salt = fromBase64Url(parts[4]);
    const expected = fromBase64Url(parts[5]);
    const derived = await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: SCRYPT_MAXMEM,
    });
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Timing-safe string comparison for non-hashed secrets. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** URL-safe random token, used for PKCE verifiers and CSRF nonces. */
export function randomToken(bytes = 32): string {
  return toBase64Url(randomBytes(bytes));
}
