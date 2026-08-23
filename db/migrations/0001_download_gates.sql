-- Download gate schema.
--
-- Three tables:
--   gate_admins   — who can create gates. One row for now, but gates are
--                   owner-scoped from day one so adding collaborators later
--                   needs no data migration.
--   gates         — one row per gated song.
--   gate_unlocks  — one row per (gate, SoundCloud fan). Holds per-action
--                   timestamps plus the name/email we collect.
--
-- Note there is no column anywhere that points from a track to SoundCloud
-- audio. The deliverable is always an artist-supplied file, because the
-- SoundCloud API terms forbid apps that persist SoundCloud User Content.
--
-- Fan OAuth tokens are intentionally absent: they live only in an encrypted
-- cookie for the ~1 hour they are valid and are never written to disk.

create table if not exists gate_admins (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  name                text,
  password_hash       text not null,
  -- Optional: lets a future version authenticate an admin via SoundCloud
  -- instead of a password.
  soundcloud_user_urn text,
  is_active           boolean not null default true,
  last_login_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists gates (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references gate_admins (id) on delete cascade,
  slug                  text not null unique,
  title                 text not null,
  description           text,
  status                text not null default 'draft'
                          check (status in ('draft', 'published', 'archived')),

  -- SoundCloud track being promoted.
  soundcloud_url        text not null,
  track_urn             text not null,
  track_id              bigint not null,
  track_title           text not null,
  track_permalink_url   text not null,
  artwork_url           text,
  -- Track owner; the follow target when require_follow is set.
  artist_user_urn       text not null,
  artist_username       text not null,

  require_like          boolean not null default true,
  require_repost        boolean not null default true,
  require_comment       boolean not null default true,
  require_follow        boolean not null default true,

  -- The deliverable. Either a file we hold in Vercel Blob or a URL the artist
  -- hosts themselves; never SoundCloud audio.
  delivery_kind         text not null default 'external_url'
                          check (delivery_kind in ('blob', 'external_url')),
  delivery_blob_url     text,
  delivery_external_url text,
  delivery_filename     text,
  delivery_content_type text,
  delivery_size_bytes   bigint,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists gates_owner_idx on gates (owner_id);
create index if not exists gates_status_idx on gates (status);

create table if not exists gate_unlocks (
  id                   uuid primary key default gen_random_uuid(),
  gate_id              uuid not null references gates (id) on delete cascade,

  -- Stable SoundCloud identity (urn) plus the handle, for display.
  soundcloud_user_urn  text not null,
  soundcloud_username  text not null,

  first_name           text,
  email                text,
  marketing_consent_at timestamptz,

  -- Per-action completion. commented_at doubles as the duplicate guard: the
  -- comment endpoint is not idempotent, so this is what stops a refresh from
  -- posting the same comment twice.
  liked_at             timestamptz,
  reposted_at          timestamptz,
  commented_at         timestamptz,
  followed_at          timestamptz,

  email_captured_at    timestamptz,
  unlocked_at          timestamptz,

  download_count       integer not null default 0,
  last_download_at     timestamptz,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (gate_id, soundcloud_user_urn)
);

create index if not exists gate_unlocks_gate_idx on gate_unlocks (gate_id);
create index if not exists gate_unlocks_email_idx on gate_unlocks (email);
create index if not exists gate_unlocks_created_idx on gate_unlocks (created_at);
