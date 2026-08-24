-- Email-first unlock identity and Spotify follow attestation.
--
-- Unlock rows used to be born when a fan connected SoundCloud, unique on
-- (gate_id, soundcloud_user_urn), with email collected last. Email is now
-- the identity and the first step, so the SoundCloud columns become nullable
-- and a unique (gate_id, email_normalized) key is added. Multiple rows with
-- a null email remain allowed (PostgreSQL unique treats nulls as distinct),
-- which covers any leftover in-progress SoundCloud-only rows.
--
-- Spotify follow is honor-system: we store a timestamp when the fan attests,
-- not a Spotify user id. The artist target lives on the gate.

alter table gate_unlocks
  alter column soundcloud_user_urn drop not null,
  alter column soundcloud_username drop not null;

alter table gate_unlocks
  add column if not exists email_normalized text
    generated always as (lower(email)) stored;

alter table gate_unlocks
  add constraint gate_unlocks_gate_email_key
    unique (gate_id, email_normalized);

alter table gate_unlocks
  add column if not exists spotify_followed_at timestamptz;

alter table gates
  add column if not exists require_spotify_follow boolean not null default false,
  add column if not exists spotify_artist_id text,
  add column if not exists spotify_artist_name text;
