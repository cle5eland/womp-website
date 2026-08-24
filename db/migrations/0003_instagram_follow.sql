-- Honor-system Instagram follow step for download gates.
--
-- Same fulfillment model as Spotify follow: the fan opens the profile and
-- attests. We store a timestamp, not an Instagram user id. The handle target
-- lives on the gate; null means the site default (wompbass).
--
-- Column default is false so existing gates do not suddenly require Instagram.
-- New gates set require_instagram_follow true via DEFAULT_GATE_REQUIREMENTS.

alter table gate_unlocks
  add column if not exists instagram_followed_at timestamptz;

alter table gates
  add column if not exists require_instagram_follow boolean not null default false,
  add column if not exists instagram_handle text;
