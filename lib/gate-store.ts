import "server-only";

import { requireDb } from "@/lib/db";
import {
  type GateActionKind,
  type GateDeliveryKind,
  type GateFanIdentity,
  type GateProgress,
  type GateRecord,
  type GateRequirements,
  type GateStatus,
  type GateUnlockRecord,
  type PublicGate,
  isUnlocked,
} from "@/lib/gate-types";

/**
 * Data access for download gates.
 *
 * Every function here is the only thing that knows about SQL or column names;
 * routes deal in the camelCase types from `lib/gate-types.ts`. `toPublicGate`
 * is the sole bridge from a full row to something safe to send to a browser.
 */

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guards hand-typed or route-param ids so a malformed value 404s instead of throwing a Postgres syntax error. */
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function asIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.length > 0) {
    return new Date(value).toISOString();
  }
  return null;
}

function requireIso(value: unknown): string {
  return asIso(value) ?? new Date(0).toISOString();
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function mapGate(row: Row): GateRecord {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    slug: String(row.slug),
    title: String(row.title),
    description: asText(row.description),
    status: String(row.status) as GateStatus,
    soundcloudUrl: String(row.soundcloud_url),
    trackUrn: String(row.track_urn),
    // bigint arrives as a string from postgres.js.
    trackId: asInt(row.track_id),
    trackTitle: String(row.track_title),
    trackPermalinkUrl: String(row.track_permalink_url),
    artworkUrl: asText(row.artwork_url),
    artistUserUrn: String(row.artist_user_urn),
    artistUsername: String(row.artist_username),
    requirements: {
      like: row.require_like === true,
      repost: row.require_repost === true,
      comment: row.require_comment === true,
      follow: row.require_follow === true,
    },
    deliveryKind: String(row.delivery_kind) as GateDeliveryKind,
    deliveryBlobUrl: asText(row.delivery_blob_url),
    deliveryExternalUrl: asText(row.delivery_external_url),
    deliveryFilename: asText(row.delivery_filename),
    deliveryContentType: asText(row.delivery_content_type),
    deliverySizeBytes: row.delivery_size_bytes == null
      ? null
      : asInt(row.delivery_size_bytes),
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at),
  };
}

function mapProgress(row: Row): GateProgress {
  return {
    like: asIso(row.liked_at),
    repost: asIso(row.reposted_at),
    comment: asIso(row.commented_at),
    follow: asIso(row.followed_at),
    emailCapturedAt: asIso(row.email_captured_at),
    unlockedAt: asIso(row.unlocked_at),
  };
}

function mapUnlock(row: Row): GateUnlockRecord {
  return {
    id: String(row.id),
    gateId: String(row.gate_id),
    soundcloudUserUrn: String(row.soundcloud_user_urn),
    soundcloudUsername: String(row.soundcloud_username),
    firstName: asText(row.first_name),
    email: asText(row.email),
    marketingConsentAt: asIso(row.marketing_consent_at),
    progress: mapProgress(row),
    downloadCount: asInt(row.download_count),
    lastDownloadAt: asIso(row.last_download_at),
    createdAt: requireIso(row.created_at),
  };
}

/**
 * Strip a gate row down to what a browser may see. Notably drops every
 * `delivery*` URL — the download is only ever served through
 * `/api/gate/[slug]/download`, which checks the unlock record first.
 */
export function toPublicGate(gate: GateRecord): PublicGate {
  return {
    slug: gate.slug,
    title: gate.title,
    description: gate.description,
    trackTitle: gate.trackTitle,
    trackPermalinkUrl: gate.trackPermalinkUrl,
    artworkUrl: gate.artworkUrl,
    artistUsername: gate.artistUsername,
    trackId: gate.trackId,
    requirements: gate.requirements,
    deliveryFilename: gate.deliveryFilename,
  };
}

// ---------------------------------------------------------------------------
// Admin accounts
// ---------------------------------------------------------------------------

export type AdminAccount = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  isActive: boolean;
};

function mapAdmin(row: Row): AdminAccount {
  return {
    id: String(row.id),
    email: String(row.email),
    name: asText(row.name),
    passwordHash: String(row.password_hash),
    isActive: row.is_active === true,
  };
}

export async function countAdmins(): Promise<number> {
  const db = requireDb();
  const rows = await db`select count(*)::int as count from gate_admins`;
  return asInt(rows[0]?.count);
}

export async function getAdminByEmail(
  email: string,
): Promise<AdminAccount | null> {
  const db = requireDb();
  const rows = await db`
    select * from gate_admins where email = ${email.toLowerCase()} limit 1
  `;
  return rows.length > 0 ? mapAdmin(rows[0]) : null;
}

export async function getAdminById(id: string): Promise<AdminAccount | null> {
  const db = requireDb();
  const rows = await db`select * from gate_admins where id = ${id} limit 1`;
  return rows.length > 0 ? mapAdmin(rows[0]) : null;
}

export async function createAdmin(input: {
  email: string;
  name: string | null;
  passwordHash: string;
}): Promise<AdminAccount> {
  const db = requireDb();
  const rows = await db`
    insert into gate_admins (email, name, password_hash)
    values (${input.email.toLowerCase()}, ${input.name}, ${input.passwordHash})
    returning *
  `;
  return mapAdmin(rows[0]);
}

export async function recordAdminLogin(id: string): Promise<void> {
  const db = requireDb();
  await db`
    update gate_admins set last_login_at = now(), updated_at = now()
    where id = ${id}
  `;
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

export async function getGateBySlug(slug: string): Promise<GateRecord | null> {
  const db = requireDb();
  const rows = await db`select * from gates where slug = ${slug} limit 1`;
  return rows.length > 0 ? mapGate(rows[0]) : null;
}

/** Published-only lookup, for the public gate page. */
export async function getPublishedGateBySlug(
  slug: string,
): Promise<GateRecord | null> {
  const gate = await getGateBySlug(slug);
  return gate && gate.status === "published" ? gate : null;
}

export async function getGateById(id: string): Promise<GateRecord | null> {
  if (!isUuid(id)) return null;
  const db = requireDb();
  const rows = await db`select * from gates where id = ${id} limit 1`;
  return rows.length > 0 ? mapGate(rows[0]) : null;
}

export type GateSummary = GateRecord & {
  unlockCount: number;
  downloadCount: number;
};

/** Gate list for the admin dashboard, with conversion counts. */
export async function listGates(ownerId?: string): Promise<GateSummary[]> {
  const db = requireDb();
  const rows = ownerId
    ? await db`
        select g.*,
               count(u.id) filter (where u.unlocked_at is not null)::int as unlock_count,
               coalesce(sum(u.download_count), 0)::int as download_count
        from gates g
        left join gate_unlocks u on u.gate_id = g.id
        where g.owner_id = ${ownerId}
        group by g.id
        order by g.created_at desc
      `
    : await db`
        select g.*,
               count(u.id) filter (where u.unlocked_at is not null)::int as unlock_count,
               coalesce(sum(u.download_count), 0)::int as download_count
        from gates g
        left join gate_unlocks u on u.gate_id = g.id
        group by g.id
        order by g.created_at desc
      `;
  return rows.map((row) => ({
    ...mapGate(row),
    unlockCount: asInt(row.unlock_count),
    downloadCount: asInt(row.download_count),
  }));
}

export type CreateGateInput = {
  ownerId: string;
  slug: string;
  title: string;
  description: string | null;
  soundcloudUrl: string;
  trackUrn: string;
  trackId: number;
  trackTitle: string;
  trackPermalinkUrl: string;
  artworkUrl: string | null;
  artistUserUrn: string;
  artistUsername: string;
  requirements: GateRequirements;
};

export async function createGate(input: CreateGateInput): Promise<GateRecord> {
  const db = requireDb();
  const rows = await db`
    insert into gates (
      owner_id, slug, title, description, status,
      soundcloud_url, track_urn, track_id, track_title, track_permalink_url,
      artwork_url, artist_user_urn, artist_username,
      require_like, require_repost, require_comment, require_follow
    ) values (
      ${input.ownerId}, ${input.slug}, ${input.title}, ${input.description}, 'draft',
      ${input.soundcloudUrl}, ${input.trackUrn}, ${input.trackId},
      ${input.trackTitle}, ${input.trackPermalinkUrl},
      ${input.artworkUrl}, ${input.artistUserUrn}, ${input.artistUsername},
      ${input.requirements.like}, ${input.requirements.repost},
      ${input.requirements.comment}, ${input.requirements.follow}
    )
    returning *
  `;
  return mapGate(rows[0]);
}

export type UpdateGatePatch = {
  title?: string;
  description?: string | null;
  status?: GateStatus;
  requirements?: GateRequirements;
  deliveryKind?: GateDeliveryKind;
  deliveryBlobUrl?: string | null;
  deliveryExternalUrl?: string | null;
  deliveryFilename?: string | null;
  deliveryContentType?: string | null;
  deliverySizeBytes?: number | null;
};

export async function updateGate(
  id: string,
  patch: UpdateGatePatch,
): Promise<GateRecord | null> {
  const db = requireDb();

  // Built as a whitelisted column map so `db(...)` only ever sees identifiers
  // we control, never anything derived from a request body.
  const columns: Record<string, unknown> = {};
  if (patch.title !== undefined) columns.title = patch.title;
  if (patch.description !== undefined) columns.description = patch.description;
  if (patch.status !== undefined) columns.status = patch.status;
  if (patch.requirements !== undefined) {
    columns.require_like = patch.requirements.like;
    columns.require_repost = patch.requirements.repost;
    columns.require_comment = patch.requirements.comment;
    columns.require_follow = patch.requirements.follow;
  }
  if (patch.deliveryKind !== undefined) {
    columns.delivery_kind = patch.deliveryKind;
  }
  if (patch.deliveryBlobUrl !== undefined) {
    columns.delivery_blob_url = patch.deliveryBlobUrl;
  }
  if (patch.deliveryExternalUrl !== undefined) {
    columns.delivery_external_url = patch.deliveryExternalUrl;
  }
  if (patch.deliveryFilename !== undefined) {
    columns.delivery_filename = patch.deliveryFilename;
  }
  if (patch.deliveryContentType !== undefined) {
    columns.delivery_content_type = patch.deliveryContentType;
  }
  if (patch.deliverySizeBytes !== undefined) {
    columns.delivery_size_bytes = patch.deliverySizeBytes;
  }

  if (Object.keys(columns).length === 0) return getGateById(id);
  columns.updated_at = new Date();

  const rows = await db`
    update gates set ${db(columns)} where id = ${id} returning *
  `;
  return rows.length > 0 ? mapGate(rows[0]) : null;
}

export async function deleteGate(id: string): Promise<void> {
  const db = requireDb();
  await db`delete from gates where id = ${id}`;
}

export async function isSlugTaken(
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const db = requireDb();
  const rows = exceptId
    ? await db`select 1 from gates where slug = ${slug} and id <> ${exceptId} limit 1`
    : await db`select 1 from gates where slug = ${slug} limit 1`;
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Unlocks
// ---------------------------------------------------------------------------

/** Column per action. Also the whitelist that `markAction` validates against. */
const ACTION_COLUMN: Record<GateActionKind, string> = {
  like: "liked_at",
  repost: "reposted_at",
  comment: "commented_at",
  follow: "followed_at",
};

export async function getUnlock(
  gateId: string,
  userUrn: string,
): Promise<GateUnlockRecord | null> {
  const db = requireDb();
  const rows = await db`
    select * from gate_unlocks
    where gate_id = ${gateId} and soundcloud_user_urn = ${userUrn}
    limit 1
  `;
  return rows.length > 0 ? mapUnlock(rows[0]) : null;
}

/**
 * Fetch the fan's unlock row, creating it on first visit. The username is
 * refreshed on every call so a handle change on SoundCloud does not leave us
 * displaying a stale name.
 */
export async function getOrCreateUnlock(
  gateId: string,
  fan: GateFanIdentity,
): Promise<GateUnlockRecord> {
  const db = requireDb();
  const rows = await db`
    insert into gate_unlocks (gate_id, soundcloud_user_urn, soundcloud_username)
    values (${gateId}, ${fan.userUrn}, ${fan.username})
    on conflict (gate_id, soundcloud_user_urn) do update
      set soundcloud_username = ${fan.username}, updated_at = now()
    returning *
  `;
  return mapUnlock(rows[0]);
}

/**
 * Stamp an action as done. `coalesce` keeps the original timestamp if the row
 * already has one, so a double-click cannot rewrite history — and, for
 * comments, the caller uses the pre-existing timestamp to skip the API call
 * entirely rather than posting a second comment.
 */
export async function markAction(
  gateId: string,
  userUrn: string,
  action: GateActionKind,
): Promise<GateUnlockRecord | null> {
  const db = requireDb();
  const column = ACTION_COLUMN[action];
  if (!column) throw new Error(`unknown gate action: ${action}`);

  const rows = await db`
    update gate_unlocks
    set ${db(column)} = coalesce(${db(column)}, now()), updated_at = now()
    where gate_id = ${gateId} and soundcloud_user_urn = ${userUrn}
    returning *
  `;
  return rows.length > 0 ? mapUnlock(rows[0]) : null;
}

export async function captureContact(
  gateId: string,
  userUrn: string,
  input: { firstName: string; email: string; marketingConsent: boolean },
): Promise<GateUnlockRecord | null> {
  const db = requireDb();
  const rows = await db`
    update gate_unlocks
    set first_name = ${input.firstName},
        email = ${input.email.toLowerCase()},
        email_captured_at = coalesce(email_captured_at, now()),
        marketing_consent_at = ${input.marketingConsent ? new Date() : null},
        updated_at = now()
    where gate_id = ${gateId} and soundcloud_user_urn = ${userUrn}
    returning *
  `;
  return rows.length > 0 ? mapUnlock(rows[0]) : null;
}

/**
 * Set `unlocked_at` once every requirement is satisfied. Idempotent, and the
 * single place that decides a gate is open — routes call this after any
 * progress change rather than deciding for themselves.
 */
export async function refreshUnlockState(
  gate: GateRecord,
  unlock: GateUnlockRecord,
): Promise<GateUnlockRecord> {
  const qualifies = isUnlocked(gate.requirements, unlock.progress);
  if (!qualifies || unlock.progress.unlockedAt) return unlock;

  const db = requireDb();
  const rows = await db`
    update gate_unlocks
    set unlocked_at = coalesce(unlocked_at, now()), updated_at = now()
    where id = ${unlock.id}
    returning *
  `;
  return rows.length > 0 ? mapUnlock(rows[0]) : unlock;
}

export async function recordDownload(unlockId: string): Promise<void> {
  const db = requireDb();
  await db`
    update gate_unlocks
    set download_count = download_count + 1,
        last_download_at = now(),
        updated_at = now()
    where id = ${unlockId}
  `;
}

/** Unlock rows for one gate, newest first — the admin's export view. */
export async function listUnlocks(
  gateId: string,
  limit = 500,
): Promise<GateUnlockRecord[]> {
  const db = requireDb();
  const rows = await db`
    select * from gate_unlocks
    where gate_id = ${gateId}
    order by created_at desc
    limit ${limit}
  `;
  return rows.map(mapUnlock);
}

/**
 * Delete abandoned unlock rows older than `days` — rows where the fan never
 * finished, so we are holding a SoundCloud handle for no reason. The API terms
 * require not retaining personal data longer than necessary; completed unlocks
 * are kept because they are the record of who is entitled to the download.
 */
export async function pruneAbandonedUnlocks(days: number): Promise<number> {
  const db = requireDb();
  const rows = await db`
    delete from gate_unlocks
    where unlocked_at is null
      and created_at < now() - make_interval(days => ${days})
    returning id
  `;
  return rows.length;
}
