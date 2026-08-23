# SoundCloud Download Gate — Design Plan (Iteration 1)

Status: **implemented** — see [Decisions](#decisions) for the choices this build
reflects and [Still open](#still-open) for what is deliberately not done yet.

A download gate is a public page for one song. A fan lands on it, connects their
SoundCloud account, likes / reposts / comments on the track, and in exchange gets
a download link for a file we host. Think Hypeddit, but first-party and on
`djwomp.com`.

This document records what the SoundCloud API actually allows, the rules we have
to design around, and the architecture that follows from those two things.

---

## 1. Feasibility: what the SoundCloud API supports

All three fan actions are available on the official public API
(`api.soundcloud.com`), and all three require a **user** access token obtained
via the Authorization Code flow. The app-level Client Credentials token we
already use for EPK stats cannot perform them.

| Action  | Endpoint                                   | Success | Notes |
| ------- | ------------------------------------------ | ------- | ----- |
| Like    | `POST /likes/tracks/{track_urn}`           | `200`   | Repeatable / effectively idempotent |
| Repost  | `POST /reposts/tracks/{track_urn}`         | `201`   | `DELETE` is deprecated |
| Comment | `POST /tracks/{track_urn}/comments`        | `201`   | Body `{ comment: { body, timestamp? } }`. **Not** idempotent — creates a new comment every call |
| Identity | `GET /me`                                 | `200`   | Gives us the fan's user URN + username |
| Resolve | `GET /resolve?url=<permalink>`             | `200`   | Turns an admin-pasted track URL into a track record |

Auth mechanics, all confirmed against the current API guide:

- Authorization URL `https://secure.soundcloud.com/authorize`, token URL
  `https://secure.soundcloud.com/oauth/token`.
- **OAuth 2.1, PKCE required** (`code_challenge_method=S256`).
- All clients are treated as *confidential*, so the token exchange needs
  `client_secret` as well as the PKCE verifier. This must stay server-side —
  which it naturally does, since we exchange in a route handler.
- Access tokens live ~1 hour. Refresh tokens are single-use.
- Every API call needs `Authorization: OAuth <token>` (note: `OAuth`, not
  `Bearer`).

`track_urn` is the `soundcloud:tracks:123456` form. The guide's curl examples use
a bare numeric id, so both appear to be accepted; the OpenAPI spec is written in
terms of URNs. The client will send the URN and fall back to the numeric id on a
`404` so we are not guessing.

### Rate limits are not a problem here

The only limits SoundCloud currently enforces are 15,000 play-stream requests per
24h (we never call `/stream`) and Client Credentials token exchanges (50/12h per
app, 30/h per IP). Authorization Code grants are not listed as rate-limited, and
there is no enforced global call limit. A gate can therefore scale without
tripping anything, provided we keep using the existing shared app token for
public reads and do not mint client-credentials tokens per visitor.

### Prerequisites we do not yet have

1. **SoundCloud Artist Pro subscription** on the account that registers the app.
   This is now a hard requirement for getting API credentials.
2. A registered app with `client_id` + `client_secret`. Self-serve at
   `soundcloud.com/you/apps`.
3. **A registered redirect URI — and you get exactly one per app.** This is the
   single most constraining operational fact, and it shapes the routing below.

---

## 2. Rules we have to design around

The SoundCloud API Terms of Use are directly relevant to a download gate. Three
clauses matter, and they are not all equally comfortable.

**a) Acting on a user's behalf is explicitly permitted, with a condition.**

> You must not use the SoundCloud API to upload User Content, create accounts,
> play sounds, add followers, like sounds or make comments on behalf of a user,
> **unless those actions are specifically and deliberately initiated by the user
> via an authenticated use of your app.**

A gate where the fan authenticates and then clicks a distinct button per action
fits the exception. A single "do all three" button, or performing actions the fan
did not individually press, does not. This is why the design below has **one
explicit click per action and no bulk button** — that is a compliance
requirement, not a UX preference.

**b) The comment carve-out has an extra condition that a gate structurally
violates.**

> This section does not apply to any use of the SoundCloud API to enable users to
> send messages or make comments ... where these messages and comments are
> specifically and deliberately initiated by the relevant user via authenticated
> access, **and are not made in response to any encouragement or incentive
> provided by you or your app.**

A download gate is, by definition, an incentive. So a *required* comment is the
one part of the requested feature that reads as offside — a required like or
repost only has to clear condition (a), but a required comment also has to clear
"not made in response to any incentive", which it cannot if the download depends
on it.

Mitigations, in descending order of safety:

1. Comment is **optional** — shown as a bonus step that does not block the
   download. (Recommended default.)
2. Comment is required, but the fan **writes their own text** — we never
   pre-fill, suggest, or template it.
3. Comment is required and pre-filled. Not recommended.

The build supports all three via a per-gate flag; the question is which is the
default and whether you want option 3 available at all. See
[Open questions](#open-questions). Note the exposure is concentrated on your own
account and API credentials, since it is your app and your artist account —
worst realistic case is credential revocation.

**c) We must not serve SoundCloud's audio.**

> Your app must not include file-save functionality, or otherwise designed to
> cache, download or persistently store any User Content.

So the gated file is **always an artist-supplied asset** — you upload it, or you
point at a URL you control. We never touch `/tracks/{id}/download` or
`/tracks/{id}/stream` to produce the deliverable. The SoundCloud track is the
thing being *promoted*; the file being *delivered* is a separate object we host.
This is a hard architectural boundary, enforced by the data model having no path
from a track to a download.

**d) A privacy policy becomes mandatory.** The terms require one for any app
processing user personal data, and we will be handling SoundCloud usernames.
There is no privacy policy on the site today. Adding one is in scope.

---

## 3. Architecture

### 3.1 The one-redirect-URI constraint

SoundCloud allows a single redirect URI per app, so we cannot have
`/gate/<slug>/callback` per gate, and we cannot easily have separate localhost
and production callbacks.

Consequences:

- **One fixed callback route** for the whole site:
  `https://djwomp.com/api/soundcloud/callback`.
- The gate being unlocked is carried in the OAuth **`state`** parameter, which we
  sign (HMAC) so a visitor cannot point a callback at a different gate. `state`
  therefore does double duty: CSRF nonce and return address.
- **Local development cannot use the real OAuth flow** while production owns the
  redirect URI. To keep the gate developable and demo-able, the build includes a
  `GATE_MOCK_SOUNDCLOUD=true` mode that fakes a connected fan and no-ops the
  three write calls. Without this, no one can work on the gate UI without
  stealing the production callback.
- If you want real OAuth locally too, SoundCloud support will issue a second
  credential set on request. Worth opening that ticket early.

### 3.2 Fan token handling

Fan access tokens are **never persisted server-side.** The flow needs the token
across several requests (connect, then like, then repost, then comment), so it
lives in an encrypted, `HttpOnly`, `Secure`, `SameSite=Lax` session cookie
(AES-GCM via Web Crypto, keyed by `GATE_SESSION_SECRET`), scoped to the gate and
expiring with the token's ~1 hour life.

This is deliberate. The terms tell us not to request more personal data than we
need or retain it longer than necessary, and a database of fan OAuth tokens is a
liability with no upside for this feature — we have no background work to do on a
fan's account. What we *do* persist is only what an unlock record needs: the
fan's SoundCloud URN, their username, and which steps they completed.

### 3.3 Storage

The site currently has no database. Global Config is the only durable store and
it is the wrong tool here: writes go through the Vercel REST API, it is built for
low-cardinality configuration rather than per-visitor rows, and unlock records
are exactly per-visitor rows.

Recommended:

- **Postgres (Neon, via the Vercel Marketplace)** for gates and unlocks. Free
  tier is ample; two small tables.
- **Vercel Blob** for the gated audio file, served through our own route so the
  blob URL is never handed out directly.

`.env.example` has commented-out Supabase placeholders, which would also work
(Postgres + object storage in one, and you may already have an account). Either
is fine — this is an open question, not a blocker. The data access layer will sit
behind a thin module (`lib/gate-store.ts`) so the choice is swappable.

### 3.4 Data model

```
gates
  id                      uuid pk
  slug                    text unique      -- /gate/<slug>
  title                   text
  status                  text             -- draft | published | archived
  soundcloud_url          text             -- as pasted by admin
  track_urn               text             -- soundcloud:tracks:123456
  track_id                bigint
  track_title             text
  artwork_url             text null
  require_like            bool default true
  require_repost          bool default true
  require_comment         bool default false   -- see §2(b)
  require_follow          bool default false   -- cheap to add, see questions
  delivery_kind           text             -- blob | external_url
  delivery_blob_path      text null
  delivery_external_url   text null
  delivery_filename       text null
  created_at, updated_at  timestamptz

gate_unlocks
  id                    uuid pk
  gate_id               uuid fk -> gates
  soundcloud_user_urn   text
  soundcloud_username   text
  liked_at              timestamptz null
  reposted_at           timestamptz null
  commented_at          timestamptz null
  followed_at           timestamptz null
  unlocked_at           timestamptz null
  download_count        int default 0
  last_download_at      timestamptz null
  created_at            timestamptz
  unique (gate_id, soundcloud_user_urn)
```

The per-action timestamps are what make the comment step safe to repeat-proof:
`POST /tracks/{urn}/comments` is not idempotent, so `commented_at` is the guard
that stops a refresh or double-click from spamming the track with duplicate
comments. Same records give you basic conversion analytics for free.

### 3.5 Routes

Public:

| Route | Purpose |
| ----- | ------- |
| `GET /gate/[slug]` | Server component. Loads the gate, renders track art, the SoundCloud embed player, and the action checklist. |
| `GET /api/gate/[slug]/connect` | Generates PKCE verifier + signed `state`, stores the verifier in a short-lived cookie, redirects to `secure.soundcloud.com/authorize`. |
| `GET /api/soundcloud/callback` | The single registered redirect URI. Verifies `state`, exchanges `code` + verifier for a token, calls `GET /me`, writes the encrypted session cookie, redirects back to `/gate/<slug>`. |
| `POST /api/gate/[slug]/action` | `{ action: "like" \| "repost" \| "comment", body?: string }`. Performs exactly one action with the session token, records the timestamp, recomputes unlock state. |
| `GET /api/gate/[slug]/download` | Verifies the unlock record server-side, increments the counter, streams the file. |

Admin:

| Route | Purpose |
| ----- | ------- |
| `GET /admin/gates` | List, with unlock counts. |
| `GET /admin/gates/new`, `GET /admin/gates/[id]` | Create / edit: paste a SoundCloud URL (resolved and previewed via the existing client-credentials token), toggle required actions, upload the file, publish. |

Admin auth: there is no auth surface on the site today, and this needs the
smallest one that is genuinely safe. Proposal: a single `GATE_ADMIN_PASSWORD`
env var, constant-time compared, exchanged for a signed `HttpOnly` session
cookie. Alternative worth considering: authenticate the admin *through
SoundCloud* and check the returned user URN against your own — no shared secret
to leak, and you are already building the OAuth flow. See questions.

### 3.6 Fan-facing flow

```
/gate/dubstep-single
  ├─ Track artwork, title, SoundCloud embed player (attribution per SC guidelines)
  ├─ [ Connect with SoundCloud ]         → OAuth, returns to this page connected
  └─ once connected, as @fanusername:
       ├─ ○ Like this track        [ Like ]
       ├─ ○ Repost to followers    [ Repost ]
       ├─ ○ Leave a comment        [ textarea, empty ]  ← optional by default
       └─ Download unlocks when required steps are ✓ → [ Download ]
```

Each row is an independent button hitting `/action` once — no bulk "do
everything" control, per §2(a). Rows show ✓ with the timestamp once done, and are
disabled thereafter. A returning fan who already unlocked the gate gets the
download immediately after connecting, since the unlock record is keyed on their
user URN.

Failure states worth designing rather than discovering: fan revokes access
mid-flow, token expires between steps (re-connect prompt rather than a dead
button), fan already liked the track outside the gate (POST still succeeds, so we
just mark it done), track deleted or made private after gate creation, and
SoundCloud 5xx.

Visually this reuses the existing dark / purple `--accent` / Bebas + IBM Plex
Mono system, the grain overlay, and the `glow-box` treatment, so a gate page
looks like the rest of `djwomp.com` rather than a third-party landing page.

---

## 4. Proposed build order

Each step is independently reviewable; the phases are sequenced by dependency,
not by calendar.

1. **Foundation.** `lib/soundcloud-user-auth.ts` (PKCE, signed state, token
   exchange, encrypted session cookie) and `lib/soundcloud-actions.ts`
   (like / repost / comment / resolve / `me`, with the URN→id fallback and 401
   handling). Plus `GATE_MOCK_SOUNDCLOUD` so this is testable before credentials
   exist.
2. **Persistence.** Chosen database, schema migration, `lib/gate-store.ts`.
3. **Fan-facing gate.** `/gate/[slug]`, the connect + callback + action routes,
   and the UI.
4. **Delivery.** File upload, the guarded download route, download counting.
5. **Admin.** Auth, gate CRUD, unlock list.
6. **Operational polish.** Privacy policy page, a retention cron that prunes old
   unlock rows, and structured logging on action failures.

Steps 1 and 2 are the ones worth reviewing most carefully; 3–5 are mostly
mechanical once those land.

---

## Decisions

| Question | Decision |
| --- | --- |
| Comment requirement | **Required, fan-authored.** The textarea is never pre-filled, the server rejects anything under 3 characters, and gate creation refuses to require a comment on a track that has comments disabled. This is option (b) from §2(b) — see the caveat below. |
| Follow the artist | **Included** as a fourth action, targeting the track's uploader. |
| Email capture | **First name + email required**, collected as the final step before the download unlocks, with an optional marketing-consent checkbox recorded as a timestamp. |
| Database | **Any Postgres via `DATABASE_URL`.** Neon and Supabase both work unchanged; nothing in the code is vendor-specific. |
| File delivery | **Both.** Browser-to-Blob upload from the admin UI, or an artist-hosted URL. Blob-backed files stream through an authorizing route so the storage URL is never handed out. |
| URL shape | `/gate/<slug>`, slug hand-set per gate. |
| Admin auth | **Password**, but account-shaped: credentials live in `gate_admins` and gates carry `owner_id`, so a second collaborator is an insert rather than a migration. |
| Multiple gates | **Full admin CRUD** at `/admin/gates`. |

On the required comment: this is the one choice that sits against the letter of
§2(b), since the terms' comment carve-out asks for comments "not made in
response to any encouragement or incentive". Requiring fan-authored text is the
safer of the two ways to do it, and the code deliberately makes the unsafe
version impossible — there is no field for templated comment text anywhere in
the schema or the API. Flipping `require_comment` to false per gate is a
checkbox in the admin UI if the position ever needs to change.

## Still open

- **The one redirect URI.** Production and localhost cannot share it.
  `GATE_MOCK_SOUNDCLOUD=true` covers local development by stubbing SoundCloud
  entirely; a second credential set from SoundCloud support would be needed to
  exercise the real flow anywhere but production.
- **Blob uploads are untested end to end.** The code path is written but there
  was no `BLOB_READ_WRITE_TOKEN` available to run it against. The external-URL
  path is fully tested.
- **Email delivery.** Addresses are captured and exportable as CSV, but nothing
  sends mail. Wiring the list to a provider is a separate piece of work.
- **`PRIVACY_CONTACT_EMAIL`** is unset, so `/privacy` currently points people at
  the homepage links for deletion requests.
