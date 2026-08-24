# Spotify Download-Gate Steps — Design Plan

Status: **proposed, decisions recorded** — this is a design, not a build. The
SoundCloud gate this extends is documented in
[`docs/download-gate-plan.md`](download-gate-plan.md).

A download gate today is SoundCloud-shaped: the fan connects SoundCloud,
completes like / repost / comment / follow as separate clicks, then leaves a
name and email. This plan does two things that have to land together:

1. **Email becomes the identity**, and the first step, so a returning fan is
   recognised by address rather than by whichever platform they connected.
2. **Spotify becomes a second provider** on the same gate, starting with follow
   the artist, with save-track / save-album / follow-playlist as the same
   pattern and pre-save as a later exception.

---

## Decisions

| Question | Decision |
| --- | --- |
| Spotify app quota | **Development Mode today.** Extended Quota is a partner application, not a dashboard toggle — see [§2](#2-leaving-development-mode). Public verified follows will 403 for anyone not on the 5-user allowlist until that changes. |
| Follow / save target | **Default WOMP's artist profile** (`SPOTIFY_ARTIST_ID` / `64XV9aZxwoLuxf9tgvu9Pb`). Admin can paste a different Spotify artist, track, album, or playlist URL per gate. |
| Identity | **Email.** First name + email + list opt-in is step 1 on every gate. Unlock rows key on `(gate_id, lower(email))`. Platform connections attach to that row. |
| Connect vs action | **Two clicks.** OAuth callback never follows or saves. Each Spotify write is its own button. |
| New-gate default | Spotify checkboxes **off** until the OAuth path is proven with an allowlisted account. |
| Later Spotify kinds | Follow artist (v1), then **save a track, save an album, follow a playlist**. **Pre-save** is a later phase because it has to persist refresh tokens. |
| Tokens (immediate steps) | Encrypted cookie only, ~1 hour, never written to Postgres. Same rule as SoundCloud. |
| Honor-system fallback | **Still open** — see [Open questions](#open-questions). |

---

## 1. Feasibility: what the Spotify API supports

The site already talks to Spotify, but only with an **app-level Client
Credentials** token (`lib/spotify.ts`) used for the public artist profile and
stats. Follow and save are **user** writes. They need an Authorization Code
token minted for the fan, the same split SoundCloud already has between
`lib/soundcloud-auth.ts` (app token) and `lib/soundcloud-user-auth.ts` (fan
token).

### Library writes, as of 2026

Spotify collapsed the old per-type follow/save endpoints. For a Development
Mode app (this one):

| Action | URI | Scope | Endpoint |
| ------ | --- | ----- | -------- |
| Follow artist | `spotify:artist:{id}` | `user-follow-modify` | `PUT /v1/me/library` |
| Follow playlist | `spotify:playlist:{id}` | `playlist-modify-public` | `PUT /v1/me/library` |
| Save track | `spotify:track:{id}` | `user-library-modify` | `PUT /v1/me/library` |
| Save album | `spotify:album:{id}` | `user-library-modify` | `PUT /v1/me/library` |
| Already done? | same URI | matching `*-read` scope | `GET /v1/me/library/contains` |
| Identity | — | none extra | `GET /v1/me` |
| Resolve a pasted URL | `open.spotify.com/{type}/{id}` | app token | `GET /v1/{type}s/{id}` |

The older `PUT /v1/me/following?type=artist` is **deprecated and removed for
Development Mode apps** (February / March 2026). Extended Quota apps still have
it. Call `/me/library` first; fall back to `/me/following` only if the library
call 400s.

Caveat: the published `/me/library` reference lists `spotify:user:{id}` and
`spotify:playlist:{id}` as followable URIs, and `GET /me/library/contains`
explicitly lists `spotify:artist:{id}`, but the save-items page omits artist
from its "supported URI types" list even though the official migration guide's
example uses `spotify:artist:…`. Verify artist URIs with a real token before
locking the write path.

All of these writes are effectively **idempotent**. Check `contains` first so a
fan who already follows / saved is credited without a write.

### Auth mechanics

- Authorize `https://accounts.spotify.com/authorize`, token
  `https://accounts.spotify.com/api/token`.
- Authorization Code **with PKCE** (`S256`). We already have the client secret;
  send both, same as SoundCloud. Token exchange stays server-side.
- Access tokens live ~1 hour. Refresh tokens exist and are **reusable** (unlike
  SoundCloud's single-use refresh). Immediate steps still must not persist
  them. Pre-save is the exception, below.
- API calls use `Authorization: Bearer <token>` (not SoundCloud's `OAuth`).
- **Multiple redirect URIs are allowed.** Production and
  `http://127.0.0.1:<port>/api/spotify/callback` can both be registered.
  (`localhost` as a hostname is not allowed; loopback IPs are.)

v1 scopes, only what follow needs:

- `user-follow-modify` / `user-follow-read`

When a gate also requires save-track / save-album / follow-playlist, the
connect URL requests the union of scopes for **that gate's remaining Spotify
steps**. Spotify re-prompts when the set grows, so we do not ask for library
or playlist scopes on a follow-only gate. Do **not** request `user-read-email`;
we collect email ourselves.

### What we already have

`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_ARTIST_ID` are
already used for the public profile. The same app adds a user-auth redirect
URI. A second Client ID does not help: quota is counted per **developer
account**.

### Pre-save is a different product

Spotify has no pre-save endpoint. Third-party pre-save is:

1. Fan grants `user-library-modify`.
2. **We store the refresh token** until release day.
3. A cron saves `spotify:album:{id}` or `spotify:track:{id}` once the URI is
   live.

That breaks the gate's "fan tokens never hit the database" rule, which is why
it is not v1. Immediate "save this album / track" (URI already live) does not
need persistence and can ship with follow-playlist in the phase after v1.
Pre-save is phase 3: encrypted refresh tokens on the unlock row, a release-at
timestamp, a cron, and a privacy-policy change.

---

## 2. Leaving Development Mode

There is no "switch to production" button. Non-dev is **Extended Quota Mode**.
As of May 15, 2025 Spotify only takes new requests from organisations, and the
bar is written for a launched commercial product, not an artist site.

### What the allowlist actually does

Development Mode (this app, today):

- The **app owner needs Spotify Premium** or the app stops working.
- **5 authenticated Spotify users**, each added by email under Dashboard →
  the app → Settings → Users Management. Anyone else can finish OAuth; every
  follow/save call then returns **403**.
- Client Credentials reads (the EPK stats panel) are unaffected. The allowlist
  only bites **user-authenticated** writes, which is the whole gate step.

### The official path

Two hops. The in-dashboard "Quota extension Request" tab is the second hop and
often does not appear until the first is approved.

1. **Partner Application**, from a **company email**, via the form linked from
   [Quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
   (Google Form). Spotify's published requirements:
   - Legally registered business or organisation
   - An active, launched service
   - **At least 250k monthly active users**, with analytics export ≤ 30 days old
   - Available in key Spotify markets
   - Commercial viability (they have asked for 12 months of revenue proof)
   - Adherence to the Developer Terms
2. If that is approved: Developer Dashboard → the app → Settings → **Quota
   extension Request** → four-step questionnaire → Submit. Review can take up
   to six weeks. They will email the address on the Spotify account.

Criteria and rationale:
[Updating the Criteria for Web API Extended Access](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)
(April 15, 2025). Existing Extended Quota apps were grandfathered; new ones
are not.

### Honest read for djwomp.com

This site will not meet the 250k MAU / launched-commercial-service bar. Filing
the form is allowed; expecting a yes is not. A second app or a new Client ID
does not dodge the cap.

Practical options while stuck in Development Mode:

- **Allowlisted testers only.** You plus a few people on Users Management.
  The real OAuth + Follow path works for them. Public checkbox stays off.
- **Honor-system fallback for everyone else.** "Open Spotify → follow/save
  there → confirm." We cannot verify. Not an app connection. Still open,
  because without it a public Spotify step is dead on arrival.
- **Do not ship the Spotify step to production fans** until quota changes.

Build the real OAuth either way so the day quota (or an allowlisted drop)
exists, the verified path is ready.

### Terms, same class of issue as SoundCloud comments

Spotify Developer Policy, "Artificial manipulation":

> Don't artificially increase, or claim to artificially increase, play counts,
> follow counts or otherwise manipulate the Spotify Service. This includes:
> (i) using any bot, script or automated process; (ii) by providing any
> compensation (financial or otherwise); and (iii) any other means.

A download in exchange for a follow is compensation-in-kind. Same exposure
class as the required SoundCloud comment: credentials revoked or quota denied.
Mitigations that match the existing gate:

1. One explicit click per write. Connect must not follow or save.
2. Credit already-done via `contains`.
3. Minimal scopes, described on `/privacy`.
4. Never touch Spotify audio; the deliverable stays an artist-supplied file.

---

## 3. Architecture

### 3.1 Email is the identity, and it is step 1

This is a gate-wide change, not a Spotify-only one. It applies to existing
SoundCloud-only gates as soon as it ships.

Today unlocks are unique on `(gate_id, soundcloud_user_urn)`, email is collected
last, and `authorizeDownload` requires a live SoundCloud session. After this:

```
1. First name + email + list opt-in     ← creates / resumes the unlock row
2. SoundCloud connect + required SC actions
3. Spotify connect + required Spotify actions
4. Download
```

`incompleteStep` flips so `contact` is first, not last. `isUnlocked` stays
"email captured AND every required action has a timestamp" — email is just no
longer the last conjunct.

**Claim cookie** `womp_gate_claim`: sealed email + gate id + unlock id,
HttpOnly / Secure / SameSite=Lax, lifetime on the order of 30 days (aligned
with incomplete-row retention). This is who the browser is. SoundCloud and
Spotify cookies become **capability** cookies only.

```
womp_gate_claim     email identity (new)
womp_gate_fan       SoundCloud access token (unchanged shape)
womp_gate_spotify   Spotify access token (new)
```

Returning fan:

- Cookie still valid → skip the form, land on the next incomplete step or the
  download. No need to reconnect SoundCloud or Spotify if the row is already
  unlocked.
- Cookie gone → type the same email again, resume. Unverified, same as today
  (we already accept whatever address they type). Magic-link verification is
  a later hardening, not v1.

Download authorization keys off the claim cookie, not a platform session. A
fan who earned the file last week can re-enter their email and download
without OAuth.

### 3.2 Data model

Additive migration. `soundcloud_user_urn` becomes nullable (the row now exists
before Connect with SoundCloud). Email is required once step 1 completes.

```
gate_unlocks
  email                    text not null after step 1
  first_name               text not null after step 1
  soundcloud_user_urn      text null          -- set when they connect SC
  soundcloud_username      text null
  spotify_user_id          text null
  spotify_display_name     text null

  unique (gate_id, lower(email))                              -- identity
  unique (gate_id, soundcloud_user_urn) where urn is not null -- one SC per gate
  unique (gate_id, spotify_user_id) where id is not null      -- one Spotify per gate
```

Normalise email on write (`trim` + lowercase). The SoundCloud unique keeps a
fan from farming two emails with one SC account on the same gate.

Existing incomplete rows (SC connected, no email yet): they still have a URN.
When they next load the gate, show step 1; `captureContact` fills the row
instead of inserting. If they type an email that already exists on this gate,
resume that row rather than duplicating.

### 3.3 Provider-tagged steps

```
GateActionKind =
  "like" | "repost" | "comment" | "follow"     // SoundCloud
  | "spotify_follow"                           // v1
  | "spotify_follow_playlist"                  // phase 2
  | "spotify_save_track"
  | "spotify_save_album"
  // phase 3: "spotify_presave"
```

```
actionProvider(kind) → "soundcloud" | "spotify"
```

`incompleteStep`, admin checkboxes, and `POST /api/gate/[slug]/action` stay
the dispatcher. Adding a kind is: label, requirement bool, timestamp column,
target id, URI builder.

v1 only *implements* `spotify_follow`. The other kinds are named in types and
the admin UI can wait until phase 2, but the URI-based writer should be
generic from day one (`saveToLibrary(uri)`).

Display order: contact, then current SoundCloud order, then Spotify kinds
(follow artist, follow playlist, save track, save album).

Existing gates: `require_spotify_*` default false. New gates: same, until OAuth
is proven.

### 3.4 Per-gate Spotify targets

Default artist is WOMP. Everything else is a pasteable `open.spotify.com`
URL, resolved at save time with the app token (individual `GET /v1/{type}/{id}`,
not the removed batch endpoints).

```
gates
  require_spotify_follow            bool not null default false
  require_spotify_follow_playlist   bool not null default false
  require_spotify_save_track        bool not null default false
  require_spotify_save_album        bool not null default false

  spotify_artist_id                 text null   -- null → SPOTIFY_ARTIST_ID
  spotify_playlist_id               text null
  spotify_track_id                  text null
  spotify_album_id                  text null
```

Store the resolved id on the gate so an env-var change cannot retarget a live
step. Admin validation: a required kind without its target id cannot publish
(except follow-artist, which may fall back to `SPOTIFY_ARTIST_ID`). Relabel
SoundCloud's existing `follow` checkbox to "Follow on SoundCloud".

CSV export: email stays the lead column; add Spotify user id / display name /
per-kind timestamps.

### 3.5 One-click-per-action

```
/gate/dubstep-single
  ├─ Track artwork, title, SoundCloud embed
  ├─ First name, email, list opt-in          ← step 1, always
  ├─ [ Connect with SoundCloud ]
  ├─ ○ Like / Repost / Comment / Follow on SoundCloud
  ├─ [ Connect with Spotify ]                ← when a Spotify step is next
  ├─ ○ Follow on Spotify              [ Follow ]
  └─ Download
```

If the fan is already following, credit from `contains`. If they *are* the
artist account, credit without a write (same own-account courtesy as
SoundCloud follow/repost).

Token expiry: `GateActionResponse.reconnect` becomes
`"soundcloud" | "spotify"` so the UI only drops the dead cookie. The claim
cookie is untouched.

### 3.6 Routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/gate/[slug]/claim` | Existing. Becomes step 1. Creates or resumes the unlock by normalised email, writes `womp_gate_claim`. |
| `GET /api/gate/[slug]/connect` | Existing SoundCloud connect. Requires a claim cookie. |
| `GET /api/gate/[slug]/spotify/connect` | PKCE + signed `state`, verifier cookie, redirect to Spotify. Requires a claim cookie. Scopes = union of this gate's remaining Spotify kinds. |
| `GET /api/spotify/callback` | Site-wide callback. Verify `state`, exchange `code`, `GET /me`, write `womp_gate_spotify`, attach `spotify_user_id` to the claim's unlock row, redirect to `/gate/<slug>`. |
| `POST /api/gate/[slug]/action` | Existing. New Spotify kinds dispatch to the Spotify session. |
| `GET /api/gate/[slug]/download` | Requires the claim cookie and an unlocked row. No live platform token. |

Mock: `GATE_MOCK_SPOTIFY=true` (ignored in production), independent of
`GATE_MOCK_SOUNDCLOUD`. Real Spotify OAuth locally is possible and preferred.

### 3.7 Modules

Keep fan auth out of `lib/spotify.ts`.

- `lib/gate-claim.ts` (or extend gate-service) — claim cookie, email
  normalisation, resume-or-create.
- `lib/spotify-user-auth.ts` — PKCE, signed state, token exchange, sealed
  session, `GATE_MOCK_SPOTIFY`.
- `lib/spotify-actions.ts` — URI-based `saveToLibrary` / `libraryContains`,
  plus resolve-URL helpers. v1 calls it with `spotify:artist:{id}`.

`lib/gate-service.ts` `applyAction` branches on `actionProvider(kind)` for
which session to require. The already-done / own-account / persist timestamp /
recompute unlock skeleton stays shared.

Labels:

```
spotify_follow: {
  title: "Follow on Spotify",
  helper: "Get new releases in your Spotify library.",
  cta: "Follow",
  done: "Following",
}
```

Phase 2 adds save-track / save-album / follow-playlist copy the same way.

### 3.8 Privacy

`/privacy` has to move in the same change:

- Email and name are how we recognise you, collected first.
- We collect SoundCloud username when you connect SoundCloud, and Spotify user
  id / display name when you connect Spotify.
- We do not collect passwords. Access tokens live in cookies (~1 hour) and are
  not stored.
- Each follow or save happens only on that button.
- Revoke from SoundCloud and from Spotify → Account → Apps.
- Pre-save, if it ever ships, must disclose stored refresh tokens.

---

## 4. Proposed build order

Email-first is independently useful and unblocks a Spotify-only future. Ship
it before, or in the same build as, the follow step.

1. **Email-first identity.** Claim cookie, unique `(gate_id, lower(email))`,
   nullable SoundCloud URN, `incompleteStep` / `authorizeDownload` / claim
   route, fan UI step order, privacy copy. Existing SoundCloud gates keep
   working; returning fans re-enter email instead of reconnecting SoundCloud.
2. **Spotify user auth.** `lib/spotify-user-auth.ts`, callback, mock flag,
   `SPOTIFY_OAUTH_REDIRECT_URI`. Prove connect → `/me` → cookie on an
   allowlisted account.
3. **Follow write.** `lib/spotify-actions.ts`: `contains` then `PUT
   /me/library`, fallback, own-account / already-following. Confirm artist
   URIs actually save.
4. **Wire `spotify_follow`.** Migration columns, types, service, Connect +
   Follow UI, admin checkbox + optional artist URL, CSV, reconnect scoped per
   provider.
5. **Phase 2 kinds** (after v1 is proven): follow playlist, save track, save
   album. Same writer, more checkboxes and target fields.
6. **Phase 3 pre-save:** persisted refresh tokens, release-at, cron. Explicit
   privacy + terms review before this starts.

---

## Open questions

1. **Public Spotify step without Extended Quota.** Verified follow will 403
   for anyone not on the 5-user allowlist. Do we (a) keep Spotify checkboxes
   off in production and only test with allowlisted accounts, (b) add an
   honor-system "open Spotify, then confirm" fallback for everyone else, or
   (c) both — verified path when the API succeeds, honor-system when it 403s?
   Recommendation: **(a) for v1**, do not pretend a public Spotify step works.
   Add (b) only if you want the checkbox usable on a real drop.
2. **Email verification.** Recommendation: **unverified**, matching today.
   Magic link later if the list gets abused.
3. **Email-first on live gates.** Recommendation: **yes, all gates**, not only
   ones with Spotify on. Confirm that existing published gates should start
   with the form next time we ship.
