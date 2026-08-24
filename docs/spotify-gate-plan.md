# Spotify Download-Gate Step — Design Plan

Status: **proposed** — this is a design, not a build. Decisions that still need
a call live in [Open questions](#open-questions). The SoundCloud gate this
extends is documented in [`docs/download-gate-plan.md`](download-gate-plan.md).

A download gate today is a SoundCloud-shaped page: the fan connects SoundCloud,
completes like / repost / comment / follow as separate clicks, leaves a name
and email, and gets an artist-hosted file. This plan adds **Spotify as a second
provider**, starting with one step — follow the artist — via a real Spotify app
connection (Authorization Code + PKCE), structured so later Spotify steps
(save a track, follow a playlist, save an album) are new action kinds rather
than a second architecture.

---

## 1. Feasibility: what the Spotify API supports

The site already talks to Spotify, but only with an **app-level Client
Credentials** token (`lib/spotify.ts`) used for the public artist profile and
stats. Following an artist is a **user** write. It needs an Authorization Code
token minted for the fan, the same split SoundCloud already has between
`lib/soundcloud-auth.ts` (app token) and `lib/soundcloud-user-auth.ts` (fan
token).

### Follow, as of 2026

Spotify collapsed the old per-type follow/save endpoints. For a **Development
Mode** app (which this project's dashboard app almost certainly is):

| Action | Endpoint | Scope | Success |
| ------ | -------- | ----- | ------- |
| Follow artist | `PUT /v1/me/library?uris=spotify:artist:{id}` | `user-follow-modify` | `200` |
| Already following? | `GET /v1/me/library/contains?uris=spotify:artist:{id}` | `user-follow-read` | `200` → `[true]` |
| Identity | `GET /v1/me` | none beyond the grant | `200` |
| Resolve artist URL | `GET /v1/artists/{id}` | app token is enough | `200` |

The older `PUT /v1/me/following?type=artist` is **deprecated and removed for
Development Mode apps** (February / March 2026). Extended Quota apps still have
it. The implementation should call `/me/library` first and only fall back to
`/me/following` if the library call 400s, so we work in both modes.

Caveat: the published `/me/library` reference lists `spotify:user:{id}` and
`spotify:playlist:{id}` as followable URIs, and `GET /me/library/contains`
explicitly lists `spotify:artist:{id}`, but the save-items page omits artist
from its "supported URI types" list even though the official migration guide's
example uses `spotify:artist:…`. That mismatch should be verified with a real
token before we lock the write path. If artist URIs 400 on `PUT /me/library`,
the fallback is the deprecated follow endpoint (Extended Quota only) or we
re-scope v1 to "follow the Spotify *user*" (`spotify:user:{id}`) — see
questions.

Follow / save is effectively **idempotent**. Repeating it on an already-followed
artist should succeed; we still check `contains` first so we can credit a fan
who already follows without a write, matching how SoundCloud treats an
already-liked track.

### Auth mechanics

- Authorize `https://accounts.spotify.com/authorize`, token
  `https://accounts.spotify.com/api/token`.
- Authorization Code **with PKCE** (`S256`). We already have the client secret
  (`SPOTIFY_CLIENT_SECRET`); send both, same as SoundCloud. Token exchange stays
  server-side.
- Access tokens live ~1 hour. Refresh tokens exist and are **reusable** (unlike
  SoundCloud's single-use refresh). We still should **not persist** them: a gate
  run is under a minute, and download entitlement lives on our unlock row. If
  the token expires mid-flow, the fan reconnects.
- API calls use `Authorization: Bearer <token>` (not SoundCloud's `OAuth`).
- **Multiple redirect URIs are allowed.** This is the one operational fact that
  is *better* than SoundCloud. Production and `http://127.0.0.1:<port>/…` can
  both be registered on the same app. (`localhost` as a hostname is not
  allowed; loopback IPs are.)

v1 scopes, deliberately small:

- `user-follow-modify` — perform the follow
- `user-follow-read` — treat "already following" as done
- Identity from `GET /me` does not need extra scopes. Do **not** request
  `user-read-email`; we already collect email on the contact step, and
  Development Mode stripped `email` off `/me` anyway.

Later steps reuse this grant by adding scopes at connect time
(`user-library-modify` / `user-library-read` for save-track / save-album,
`playlist-modify-public` for follow-playlist). Spotify re-prompts when the
scope set grows, so starting narrow is the right default.

### What we already have

`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_ARTIST_ID`
(`64XV9aZxwoLuxf9tgvu9Pb`) are already used for the public profile. The same
app can add a user-auth redirect URI; we do not need a second Client ID unless
we want to isolate stats from fan grants. Quota, however, is now counted per
**developer account**, not per Client ID, so a second app does not dodge the
limit below.

---

## 2. The constraint that may block a public gate

SoundCloud's hard constraint was "one redirect URI." Spotify's is **quota
mode.**

Newly created and migrated Development Mode apps:

- App owner must have **Spotify Premium** or the app stops working.
- **5 authenticated Spotify users**, each added by email on the dashboard
  allowlist. Anyone else can complete OAuth and then every API call returns
  **403**.
- Extended Quota Mode (unlimited fans, higher rate limits) is applied for as a
  registered organisation, through a company email, and the published bar
  includes **≥ 250k monthly active users** plus a launched commercial service.
  Review can take up to six weeks. An artist site will not meet that bar.

Client Credentials reads (the EPK stats panel) are unaffected. The allowlist
only bites **user-authenticated** calls, which is exactly the follow step.

So: the architecture below is the correct one, and it will work for allowlisted
testers. It will **not** work for arbitrary fans until Spotify grants Extended
Quota, which they are unlikely to. That is the decision this plan cannot make
on its own — see Q1.

Honor-system fallback, if we need a public step without quota: a button that
opens `https://open.spotify.com/artist/{id}` (or the `spotify:` URI) and a
second "I followed" confirm. We cannot verify. That is not an "app connection"
and is a different product. Worth having as a documented escape hatch, not as
the default design.

### Terms, same class of issue as SoundCloud comments

Spotify's Developer Policy, "Artificial manipulation":

> Don't artificially increase, or claim to artificially increase, play counts,
> follow counts or otherwise manipulate the Spotify Service. This includes:
> (i) using any bot, script or automated process; (ii) by providing any
> compensation (financial or otherwise); and (iii) any other means.

A download in exchange for a follow is compensation-in-kind. Hypeddit / Gleam /
Feature.fm still ship this, and we already run the same pattern on SoundCloud
(where the terms at least carve out user-initiated likes/follows). Exposure is
concentrated on this app's credentials: worst realistic case is quota denial
or app revocation, not a fan-data breach.

Mitigations that match the SoundCloud gate's posture:

1. **One explicit Follow click** after connect. Connecting must not follow as a
   side effect of the grant. No bulk "do everything" control.
2. Credit "already following" via `contains` rather than forcing a write.
3. Keep scopes minimal and say so on `/privacy`.
4. Never touch Spotify audio; the deliverable stays an artist-supplied file.
   Same hard boundary as SoundCloud §2(c).

---

## 3. Architecture

### 3.1 Provider-tagged steps, not a second gate type

Today `GateActionKind` is `"like" | "repost" | "comment" | "follow"` and all
four are SoundCloud. The follow target is the SoundCloud track's uploader
(`artist_user_urn`). Spotify follow cannot be inferred from that track.

Proposal: extend the existing kind union rather than introducing a parallel
requirements object.

```
GateActionKind =
  "like" | "repost" | "comment" | "follow"   // SoundCloud, unchanged
  | "spotify_follow"                        // v1
  // later: "spotify_save_track" | "spotify_follow_playlist" | "spotify_save_album"
```

`incompleteStep`, `requiredActions`, admin checkboxes, and
`POST /api/gate/[slug]/action` keep working. A kind maps to a provider:

```
actionProvider(kind) → "soundcloud" | "spotify"
```

Adding the next Spotify step is: one kind, one label, one timestamp column, one
URI builder. We do **not** need a generic `gate_steps` table for two providers
and a handful of kinds. If a third platform appears, that is when we
normalise.

Recommended display order (contact always last, unchanged):

1. SoundCloud like / repost / comment / follow (whatever the gate requires,
   current order)
2. `spotify_follow`
3. Name + email

Existing gates keep `require_spotify_follow = false`, so shipping this is a
no-op until an admin ticks the box.

### 3.2 Two sessions, one identity

Unlock rows stay keyed on `(gate_id, soundcloud_user_urn)`. SoundCloud remains
how we recognise a returning fan and how we authorize the download. Spotify is
a **capability cookie**, not a second identity.

```
womp_gate_fan       existing SoundCloud session (unchanged)
womp_gate_spotify   new encrypted Spotify session, same AES-GCM + HttpOnly
                    + Secure + SameSite=Lax treatment
```

Consequences, which are also questions:

- A gate that requires Spotify follow still requires Connect with SoundCloud
  first, because that is when the unlock row is born. Fine for v1: every gate
  still promotes a SoundCloud track.
- A returning fan who already unlocked reconnects SoundCloud and gets the file;
  we do not make them reconnect Spotify.
- If we ever want a Spotify-only gate (no SoundCloud track), identity has to
  become provider-agnostic. Out of scope. Do not pretend the v1 schema is that.

Fan Spotify tokens are **never written to Postgres**, same rule as SoundCloud.
What we persist on the unlock row: `spotify_user_id`, `spotify_display_name`,
`spotify_followed_at`.

`GateViewState` grows a `spotifyFan` (or `null`) so the UI knows whether to
show Connect with Spotify or the Follow button when the current step is
`spotify_follow`.

### 3.3 One-click-per-action still holds

Connect and Follow are two steps on purpose.

```
… SoundCloud steps …
  ├─ [ Connect with Spotify ]     → OAuth, returns to this page connected
  └─ once connected, as the Spotify display name:
       ○ Follow on Spotify        [ Follow ]
       Download still waits on contact, as today
```

Auto-following inside the callback would be the bulk action SoundCloud's terms
forbid and Spotify's "artificial manipulation" clause is aimed at. The callback
only writes the session cookie and `GET /me`.

If the fan is already following, the Follow handler credits the step from
`contains` and does not call `PUT`. If they *are* the artist account, credit
without a write (same own-account courtesy as SoundCloud follow/repost).

Token expiry between connect and follow: `reconnect: true` on the action
response, same as SoundCloud, but it must not clear the SoundCloud session.
`GateActionResponse.reconnect` should become provider-scoped
(`reconnect: "soundcloud" | "spotify"`) so the UI only drops the dead cookie.

### 3.4 Routes

Public additions, mirroring SoundCloud:

| Route | Purpose |
| ----- | ------- |
| `GET /api/gate/[slug]/spotify/connect` | PKCE + signed `state` (CSRF + gate slug + return path), verifier cookie, redirect to `accounts.spotify.com/authorize`. |
| `GET /api/spotify/callback` | Single site-wide callback. Verify `state`, exchange `code`, `GET /me`, write `womp_gate_spotify`, redirect to `/gate/<slug>`. |
| `POST /api/gate/[slug]/action` | Existing route. New `action: "spotify_follow"`. Dispatches to the Spotify session, not the SoundCloud one. |

Mock: `GATE_MOCK_SPOTIFY=true` (ignored in production), independent of
`GATE_MOCK_SOUNDCLOUD`, because Spotify *can* do real OAuth locally. Mock is
for UI work without a dashboard app, not a substitute for a missing redirect
URI.

Admin: one new checkbox on the create/edit forms. Optional per-gate Spotify
artist URL; default to `SPOTIFY_ARTIST_ID`. CSV export gains Spotify user id /
display name / followed-at.

### 3.5 Data model

Additive migration. No rewrite of `0001_download_gates.sql`.

```
gates
  require_spotify_follow   bool not null default false
  spotify_artist_id        text null
  -- null = SPOTIFY_ARTIST_ID env. Non-null when an admin pastes a
  -- different artist (a collab, a side project).

gate_unlocks
  spotify_user_id          text null
  spotify_display_name     text null
  spotify_followed_at      timestamptz null
```

`spotify_artist_id` is stored denormalised on the gate so a later env-var
change cannot retarget an already-published step. Resolve it at create/edit
time via `GET /v1/artists/{id}` (already in `lib/spotify.ts`).

Future Spotify kinds add `spotify_saved_track_at`, etc. That is a little ugly
and is the price of not building a steps table yet. Acceptable for a handful
of columns.

### 3.6 Modules

Keep Spotify user-auth out of `lib/spotify.ts`. That file is client-credentials
plus the unofficial Pathfinder scrape; mixing a fan token into it is how we
would accidentally call a write with the app token.

New, parallel to SoundCloud:

- `lib/spotify-user-auth.ts` — PKCE, signed state, token exchange, sealed
  session cookie, `GATE_MOCK_SPOTIFY`.
- `lib/spotify-actions.ts` — `followArtist`, `isFollowingArtist`, resolve
  artist URL → id. URI-based so `saveTrack(uri)` later is the same `PUT
  /me/library` with a different URI.

`lib/gate-service.ts` `applyAction` branches on `actionProvider(kind)` for
which session to require and which performer to call. The "already done /
own-account / persist timestamp / recompute unlock" skeleton stays shared.

`lib/gate-types.ts` labels:

```
spotify_follow: {
  title: "Follow on Spotify",
  helper: "Get new releases in your Spotify library.",
  cta: "Follow",
  done: "Following",
}
```

Admin should also relabel the existing SoundCloud `follow` to "Follow on
SoundCloud" so the two checkboxes are not ambiguous.

### 3.7 Privacy

`/privacy` currently only describes a SoundCloud connection. Shipping this
requires, in the same change:

- We collect the Spotify user id and display name.
- We do not collect the Spotify password or persist the access token.
- We do not read library, playlists, or listening history in v1.
- Follow happens only on an explicit click.
- Revoke from Spotify → Account → Apps.

---

## 4. Fan-facing flow (with Spotify follow on)

```
/gate/dubstep-single
  ├─ Track artwork, title, SoundCloud embed (unchanged)
  ├─ [ Connect with SoundCloud ]
  └─ once connected:
       ├─ ○ Like / Repost / Comment / Follow on SoundCloud
       ├─ [ Connect with Spotify ]          ← only if this step is next
       ├─ ○ Follow on Spotify        [ Follow ]
       └─ First name, email, list opt-in → [ Download ]
```

The one-at-a-time stepper in `components/gate-experience.tsx` already renders
whatever `incompleteStep` returns. The new work there is: when the current
kind's provider is Spotify and `spotifyFan` is missing, render a Connect panel
instead of the action button; keep SoundCloud's fan chip in the header so it
does not look like they were signed out.

Failure states to design, not discover: Spotify 403 (user not on the
Development Mode allowlist — this will be the common production failure if we
ship without Extended Quota), 429 `QUOTA_EXCEEDED` vs ordinary rate limit,
revoked grant, expired token, artist id missing on the gate.

---

## 5. Proposed build order

Independently reviewable, sequenced by dependency. Do not start this until Q1
is answered; the 403-for-everyone outcome is not a polish item.

1. **Spotify user auth.** `lib/spotify-user-auth.ts`, callback route, mock
   flag, env (`SPOTIFY_OAUTH_REDIRECT_URI`). Prove connect → `/me` → cookie on
   an allowlisted account.
2. **Follow write.** `lib/spotify-actions.ts`: `contains` then `PUT
   /me/library`, fallback to `PUT /me/following`, own-account / already-
   following credit. Confirm artist URIs actually save.
3. **Persistence.** Migration for the new columns; extend `gate-types`,
   `gate-store`, `isUnlocked`.
4. **Service + fan UI.** Provider-aware `applyAction`, Connect-with-Spotify
   panel, Follow button, reconnect scoped per provider.
5. **Admin.** Checkbox, optional artist URL resolve, CSV columns, SoundCloud
   follow relabel.
6. **Privacy + README + `.env.example`.** Operational notes: Premium on the
   dashboard owner, allowlist, redirect URIs including `127.0.0.1`.

---

## Recommended defaults (pending questions)

| Topic | Recommendation |
| --- | --- |
| Follow target | Site artist (`SPOTIFY_ARTIST_ID`), overridable per gate by pasting an artist URL. |
| Identity | SoundCloud remains the unlock key. Spotify is an extra connection. |
| Connect vs Follow | Two clicks. Callback never writes. |
| Existing gates | `require_spotify_follow` defaults false. New gates: checkbox off until OAuth is proven, then we can default it on. |
| Tokens | Encrypted cookie only. No refresh-token persistence. |
| Mock | Separate `GATE_MOCK_SPOTIFY`; real OAuth locally is possible and preferred. |
| Future steps | Same kind-union + `/me/library` URI. Do not build a steps table in v1. |
| Honor-system fallback | Only if Q1 says we must ship to the public without Extended Quota. |

---

## Open questions

1. **Quota mode of the existing Spotify app.** Dashboard → the app → Settings:
   is App Status Development Mode or Extended Quota? If Development Mode, an
   API-verified follow step only works for five allowlisted emails. Options:
   (a) build the real OAuth anyway, testers-only, and leave the public checkbox
   off; (b) add an honor-system "open Spotify → confirm" fallback for everyone
   else; (c) do not ship the step until quota changes. **This is the blocker.**
2. **Follow target.** Always WOMP's artist profile, or pasteable per gate from
   day one? Related: "follow my Spotify *account*" — artist id
   `spotify:artist:64XV9aZxwoLuxf9tgvu9Pb`, or the user profile behind it
   (`spotify:user:…`)? Artist follow is what fans mean by following WOMP.
3. **Honor-system fallback.** If (1) is Development Mode, do we want a public
   non-verified step in v1, or only the verified path?
4. **SoundCloud still required?** Recommendation yes for v1. Confirm we are not
   trying to make a Spotify-only gate yet.
5. **Step order.** After all SoundCloud actions and before email, or should
   the admin reorder?
6. **Next Spotify steps already in mind?** Save this release's track, follow a
   playlist, save an album — naming the kinds now keeps the union honest.
7. **Silent follow on connect.** Recommendation: no. Confirm.
8. **New-gate default.** Recommendation: checkbox off until the OAuth path is
   proven in production with an allowlisted account.
