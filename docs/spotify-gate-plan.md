# Spotify Download-Gate Steps — Design Plan

Status: **proposed, decisions recorded** — this is a design, not a build. The
SoundCloud gate this extends is documented in
[`docs/download-gate-plan.md`](download-gate-plan.md).

A download gate today is SoundCloud-shaped: the fan connects SoundCloud,
completes like / repost / comment / follow as separate clicks, then leaves a
name and email. This plan does two things that land together:

1. **Email becomes the identity**, and the first step, on every gate (including
   existing ones — there are no real users yet).
2. **Spotify becomes a second provider** on the same gate. Every Spotify step
   is honor-system: we open the relevant Spotify page, the fan does the thing
   there, then attests on the gate. No Spotify OAuth, no allowlist, no API
   write on the fan's account.

SoundCloud steps stay API-verified, one click per action, as they are today.

---

## Decisions

| Question | Decision |
| --- | --- |
| Spotify verification | **Honor-system in all cases.** Open the Spotify page, then attest. No app connection, no allowlist, no `PUT /me/library`. Applies to follow and to later save / playlist / pre-save kinds. |
| Follow / save target | **Default WOMP's artist profile** (`SPOTIFY_ARTIST_ID` / `64XV9aZxwoLuxf9tgvu9Pb`). Admin can paste a different Spotify artist, track, album, or playlist URL per gate. Pre-save may be a freeform URL (distributor pre-save page). |
| Identity | **Email.** First name + email + list opt-in is step 1. Unlock rows key on `(gate_id, lower(email))`. |
| Existing gates | **Change them.** Email-first ships on live gates; there are no real users yet. |
| Connect vs action (Spotify) | **Two clicks: Open, then Attest.** Attest is disabled until Open has been clicked in this session. We still cannot verify the follow. |
| Connect vs action (SoundCloud) | Unchanged: real OAuth, one deliberate write per button. |
| New-gate default | Spotify checkboxes **off**. Turning one on is a conscious admin choice. |
| Later Spotify kinds | Same Open + Attest pattern: **save a track, save an album, follow a playlist, pre-save.** Pre-save does not need stored refresh tokens. |
| Spotify tokens | **None.** We never request a fan Spotify grant for the gate. |

---

## 1. Why honor-system, not the API

The original idea was a Spotify app connection that follows WOMP on the fan's
behalf, matching SoundCloud. That path is blocked for a public gate:

- This app is in **Development Mode**. User-authenticated writes work for **5
  allowlisted emails**; everyone else 403s after OAuth.
- **Extended Quota** (unlimited fans) is a partner application for
  organisations with ≥250k MAU, a launched commercial service, and (in
  practice) revenue proof. There is no dashboard toggle. Details and the
  official form live on
  [Quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes).
  djwomp.com will not meet that bar. A second Client ID does not help; quota
  is per developer account.
- The follow endpoint itself moved in 2026 (`PUT /v1/me/library` with a
  `spotify:artist:{id}` URI; old `PUT /me/following` is removed in Dev Mode).

So the gate never asks Spotify to act on the fan. We send them to Spotify's
own UI, which already has Follow / Save / heart, then take their word.

We still use the existing **Client Credentials** app token (`lib/spotify.ts`)
to resolve an admin-pasted URL into an id, name, and artwork for the step
label. That is a public read, not a fan grant, and is how the EPK already
works.

Spotify Developer Policy still frowns on incentivised follows ("compensation
(financial or otherwise)"). Honor-system is the same class of issue as a
required SoundCloud comment, with less API-terms surface because we never
write to the fan's library. Worst case is the same: they dislike the
promotion, not a revoked user-auth app.

---

## 2. Architecture

### 2.1 Email is the identity, and it is step 1

Today unlocks are unique on `(gate_id, soundcloud_user_urn)`, email is last,
and `authorizeDownload` requires a live SoundCloud session.

After this:

```
1. First name + email + list opt-in          ← creates / resumes the unlock
2. SoundCloud connect + required SC actions  ← only if this gate requires them
3. Spotify Open + Attest steps               ← only if this gate requires them
4. Download
```

`incompleteStep` puts `contact` first. `isUnlocked` stays "email captured AND
every required action has a timestamp."

**Claim cookie** `womp_gate_claim`: sealed email + gate id + unlock id,
HttpOnly / Secure / SameSite=Lax, ~30 days (aligned with incomplete-row
retention). This is who the browser is. The SoundCloud cookie stays a
capability cookie for SC writes only. There is no Spotify session cookie.

```
womp_gate_claim     email identity (new)
womp_gate_fan       SoundCloud access token (unchanged)
```

Returning fan: cookie still valid → skip the form, next incomplete step or
download. Cookie gone → type the same email, resume. Unverified, matching
today. Download keys off the claim cookie, not a platform session — a fan who
earned the file last week re-enters email and downloads without reconnecting
SoundCloud.

### 2.2 Data model

Additive migration. `soundcloud_user_urn` becomes nullable (the row exists
before Connect with SoundCloud). Email is required once step 1 completes.

```
gate_unlocks
  email                    text not null after step 1
  first_name               text not null after step 1
  soundcloud_user_urn      text null
  soundcloud_username      text null

  unique (gate_id, lower(email))                              -- identity
  unique (gate_id, soundcloud_user_urn) where urn is not null -- one SC per gate
```

Normalise email on write (`trim` + lowercase). We do **not** store a Spotify
user id; we never see one.

Attest timestamps sit next to the SoundCloud ones:

```
  spotify_followed_at          timestamptz null   -- v1
  spotify_playlist_followed_at timestamptz null   -- phase 2
  spotify_track_saved_at       timestamptz null
  spotify_album_saved_at       timestamptz null
  spotify_presaved_at          timestamptz null
```

Existing incomplete rows (SC connected, no email): show step 1 on next load;
`captureContact` fills the row. If they type an email that already exists on
this gate, resume that row.

### 2.3 Provider-tagged steps

```
GateActionKind =
  "like" | "repost" | "comment" | "follow"     // SoundCloud, API write
  | "spotify_follow"                           // v1, Open + Attest
  | "spotify_follow_playlist"                  // phase 2, same UX
  | "spotify_save_track"
  | "spotify_save_album"
  | "spotify_presave"
```

```
actionProvider(kind) → "soundcloud" | "spotify"
stepFulfillment(kind) → "api" | "attest"
```

SoundCloud kinds keep going through `performAction`. Spotify kinds are a
timestamp write after the fan posts `{ action, attested: true }`. The server
does not call Spotify. `incompleteStep`, admin checkboxes, and
`POST /api/gate/[slug]/action` stay the dispatcher.

v1 only *implements* `spotify_follow`. The Open + Attest UI should be generic
(`openUrl` + `attestLabel`) so phase 2 is more checkboxes, not a second
component.

Display order: contact, current SoundCloud order, then Spotify kinds (follow
artist, follow playlist, save track, save album, pre-save).

### 2.4 Per-gate Spotify targets

Default artist is WOMP. Anything else is a pasted `open.spotify.com` URL,
resolved at save time with the app token (`GET /v1/{type}/{id}`) so the step
can show a name. Store the resolved id on the gate so an env-var change cannot
retarget a live step.

```
gates
  require_spotify_follow            bool not null default false
  require_spotify_follow_playlist   bool not null default false
  require_spotify_save_track        bool not null default false
  require_spotify_save_album        bool not null default false
  require_spotify_presave           bool not null default false

  spotify_artist_id                 text null   -- null → SPOTIFY_ARTIST_ID
  spotify_playlist_id               text null
  spotify_track_id                  text null
  spotify_album_id                  text null
  spotify_presave_url               text null   -- freeform; may not be Spotify
```

Publish rules: a required kind needs its target. Follow-artist may omit
`spotify_artist_id` and fall back to `SPOTIFY_ARTIST_ID`. Relabel SoundCloud's
`follow` checkbox to "Follow on SoundCloud".

Open URLs we send to the browser (public, fine on `PublicGate`):

| Kind | URL |
| ---- | --- |
| `spotify_follow` | `https://open.spotify.com/artist/{id}` |
| `spotify_follow_playlist` | `https://open.spotify.com/playlist/{id}` |
| `spotify_save_track` | `https://open.spotify.com/track/{id}` |
| `spotify_save_album` | `https://open.spotify.com/album/{id}` |
| `spotify_presave` | admin-supplied URL |

On mobile, `open.spotify.com` usually offers to hand off to the app. We can
also expose a `spotify:{type}:{id}` href as a secondary "Open in app" control.
Do not use `localhost` deep-link tricks; the web URL is enough.

CSV: email stays the lead column; add per-kind Spotify attest timestamps. No
Spotify username column.

### 2.5 Fan-facing Spotify step

```
/gate/dubstep-single
  ├─ Track artwork, title, SoundCloud embed
  ├─ First name, email, list opt-in
  ├─ [ Connect with SoundCloud ] + SC actions
  └─ Follow on Spotify
       [ Open Spotify ]     → new tab, artist page
       [ I followed ]       → enabled after Open, POST attest
```

Copy should say they need to follow (or save, or pre-save) on the page that
just opened, then come back. "I followed" is a statement, not a connection.

Client-side only: Attest stays disabled until Open is clicked in this visit.
Easy to bypass; it just stops a one-click skip. The server still trusts the
attest POST, same as it trusts that they typed a real comment on SoundCloud.

If they already follow WOMP, they still open and attest — we cannot know, and
that is fine.

### 2.6 Routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/gate/[slug]/claim` | Existing. Becomes step 1. Creates or resumes by normalised email, writes `womp_gate_claim`. |
| `GET /api/gate/[slug]/connect` | Existing SoundCloud connect. Requires a claim cookie. |
| `POST /api/gate/[slug]/action` | Existing. Spotify kinds skip the SoundCloud session and `performAction`; they require a claim cookie and `attested: true`. |
| `GET /api/gate/[slug]/download` | Requires the claim cookie and an unlocked row. No live platform token. |

No `/api/spotify/callback`, no `spotify/connect`, no `GATE_MOCK_SPOTIFY`. Admin
resolve of pasted URLs reuses `lib/spotify.ts` client credentials, with mock
already implied when those env vars are missing (same as the EPK).

### 2.7 Modules

- Claim cookie + email resume: `lib/gate-service.ts` / a small `lib/gate-claim.ts`.
- Spotify kinds: no `spotify-user-auth.ts`. A tiny helper to build open URLs
  from stored ids is enough, colocated with gate-types or `lib/spotify.ts`.
- `applyAction` branches on `stepFulfillment(kind)`.

Labels (v1):

```
spotify_follow: {
  title: "Follow on Spotify",
  helper: "Opens WOMP on Spotify. Follow there, then come back.",
  cta: "I followed",
  done: "Followed",
}
```

Helper text should use the resolved artist name when the target is not WOMP.

### 2.8 Privacy

Same change as email-first, plus Spotify is *less* than a connection:

- Email and name are how we recognise you, collected first.
- SoundCloud username when you connect SoundCloud (unchanged).
- We do not connect to Spotify, collect a Spotify id, or store a Spotify token.
- We record that you attested each Spotify step.
- SoundCloud writes still happen only on that specific button.

---

## 3. Proposed build order

Email-first is independently useful and unblocks Spotify-only-ish gates later.
Ship it first or in the same build as follow.

1. **Email-first identity.** Claim cookie, unique `(gate_id, lower(email))`,
   nullable SoundCloud URN, flip `incompleteStep` / `authorizeDownload` /
   claim route / fan UI, privacy copy. Existing gates start with the form.
2. **`spotify_follow`.** Target columns, Open + Attest UI, attest path in
   `applyAction`, admin checkbox + optional artist URL (default WOMP), CSV
   timestamp, SoundCloud follow relabel.
3. **Phase 2 kinds** — follow playlist, save track, save album. Same UI,
   more checkboxes and target fields.
4. **Pre-save** — same UI, freeform URL. No cron, no token store.

---

## Open questions

None that block v1. Phase 2/3 admin copy and whether pre-save allows
non-Spotify URLs can wait until those checkboxes are built.

Quota / OAuth remains a documented non-path for this feature, not a backlog
item, unless Extended Quota ever appears.
