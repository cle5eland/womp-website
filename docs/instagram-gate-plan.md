# Instagram Download-Gate Follow Step — Design Plan

Status: **proposed, decisions recorded** — this is a design, not a build.
Prerequisites (email-first identity + honor-system Spotify follow) are
**implemented** on PR #22 (`cursor/spotify-gate-plan-bf6d`); see
[`docs/spotify-gate-plan.md`](spotify-gate-plan.md). The SoundCloud gate is
documented in [`docs/download-gate-plan.md`](download-gate-plan.md).

Instagram is another **Open + Attest** step, after SoundCloud and Spotify.
Meta cannot verify a public “did this visitor follow us?” for a download gate,
so we open the profile and take their word — the same fulfillment model as
`spotify_follow`.

SoundCloud steps stay API-verified. Spotify and Instagram do not.

---

## Decisions

| Question | Decision |
| --- | --- |
| Verification | **Honor system (Open + Attest).** Same class as `spotify_follow`. See [§1](#1-feasibility-why-not-an-api). |
| Step order | **After SoundCloud and Spotify.** `GATE_ACTION_KINDS` order already drives `incompleteStep` (contact first via email check, then kinds in array order). Append `instagram_follow` after `spotify_follow`. |
| New-gate default | **On.** `DEFAULT_GATE_REQUIREMENTS.instagram_follow = true`. Migration column default `false` so existing rows do not gain the step. |
| Target account | **Default `@wompbass`** (`instagramPermalink` in `lib/epk-data.ts`). Admin may override per gate. |
| SoundCloud session | **Not required.** Attest kinds only need the claim cookie (already true for Spotify in `applyAction`). |
| Open before attest | Client enables “I followed” only after Open this visit — **same as `SpotifyStep`**. Server does not re-check the open signal. |
| Fan Instagram OAuth | **Out of scope.** No IG Login, tokens, or fan IG id on the unlock row. |
| Shared UX | **Generalize `SpotifyStep` into a shared attest step** (or add `InstagramStep` that copies it). Do not invent a third pattern. |

---

## 1. Feasibility: why not an API

The site already has an Instagram Graph token (`INSTAGRAM_ACCESS_TOKEN`) for
EPK stats (`lib/instagram-stats.ts`). That token reads **our** follower count.
It cannot answer “does visitor X follow us?”

| Approach | Why it does not fit |
| --- | --- |
| Artist Graph token | No lookup of an arbitrary visitor’s follow relationship. |
| Fan Instagram Login | Needs a professional account; still no clean follow-write / contains for `@wompbass`. |
| Messaging `is_user_follow_business` | Only after the fan DMs the business. Not acceptable UX. |

Attested follow is the product choice. Soft friction (Open before Attest)
matches Spotify and stops accidental one-click skips.

---

## 2. Architecture (against the PR #22 codebase)

### 2.1 Flow

```
1. Contact (email-first claim cookie)     ← already shipped on #22
2. SoundCloud connect + API actions       ← if required
3. Spotify Open + Attest                  ← if required (spotify_follow)
4. Instagram Open + Attest                ← if required (instagram_follow)
5. Download
```

Cookies stay as on #22 — Instagram adds none:

```
womp_gate_claim     email identity
womp_gate_fan       SoundCloud access token
```

### 2.2 Types

Extend what #22 already has in `lib/gate-types.ts`:

```
GateActionKind = … | "spotify_follow" | "instagram_follow"

GATE_ACTION_KINDS = [ like, repost, comment, follow, spotify_follow, instagram_follow ]

GateActionProvider = "soundcloud" | "spotify" | "instagram"

actionProvider(kind):
  kind.startsWith("spotify_") → "spotify"
  kind.startsWith("instagram_") → "instagram"
  else → "soundcloud"

progressKey("instagram_follow") → "instagramFollow"

DEFAULT_GATE_REQUIREMENTS.instagram_follow = true   // new gates only
```

`incompleteStep` / `isUnlocked` / `gateStepCounts` already walk
`GATE_ACTION_KINDS` via `progressKey` — appending the kind is enough for order.

Labels (match Spotify’s “I followed” voice):

```
instagram_follow: {
  title: "Follow on Instagram",
  helper: "Opens the profile on Instagram. Follow there, then come back.",
  cta: "I followed",
  done: "Followed",
}
```

UI helper should interpolate the gate’s handle/name like `SpotifyStep` does
with `artistName`.

### 2.3 Data model

New migration (e.g. `0003_instagram_follow.sql`), additive:

```
gates
  require_instagram_follow   bool not null default false
  instagram_handle           text null   -- null → epk-data "wompbass"
  instagram_profile_name     text null   -- optional display label

gate_unlocks
  instagram_followed_at      timestamptz null
```

`PublicGate` gains `instagramHandle`, `instagramProfileUrl` (and optional
display name), analogous to `spotifyArtistName` / `spotifyArtistUrl`.

Create path: set `require_instagram_follow: true` in admin create /
`DEFAULT_GATE_REQUIREMENTS`. CSV unlocks: add `instagram_followed_at`.

### 2.4 Helpers

Add `lib/instagram-gate.ts` (client-safe), mirroring `lib/spotify-gate.ts`:

- `DEFAULT_INSTAGRAM_HANDLE = "wompbass"` (or re-export from `epk-data`)
- `instagramProfileOpenUrl(handle)` → `https://www.instagram.com/{handle}/`
- `parseInstagramHandle(input)` — accepts `@wompbass`, `wompbass`, or a full
  `instagram.com/…` URL; empty → site default; invalid → error string

Do **not** call `lib/instagram-stats.ts` from the gate path.

### 2.5 Service / route

`POST /api/gate/[slug]/action` already accepts any `GATE_ACTION_KINDS` entry.
Extend `applyAction` so Instagram kinds behave like Spotify:

- Require claim cookie
- Do **not** require SoundCloud session
- If progress already set → success
- Else `markAction` / stamp `instagram_followed_at`, refresh unlock

No `attested: true` body field (Spotify implementation does not use one).
Open-gate is client-only.

### 2.6 Fan UI

Today `gate-experience.tsx` branches `isSpotifyAction(currentStep)` →
`SpotifyStep` (Open + Attest, local `opened` state).

Preferred: rename/generalize to `AttestStep` with `{ provider, openUrl,
openLabel, brandColor, icon, title, helper, onAttest, busy, disabled }`.
Wire both `spotify_follow` and `instagram_follow` through it.

Instagram brand accent: existing site pink `#E1306C` (used on the EPK
Instagram panel) — keep it for the Open button so the step is recognizable.

### 2.7 Admin

- Create/edit: checkbox “Follow on Instagram” (default checked on create)
- Optional handle / profile URL field; empty = `@wompbass`
- Relabel already done for SoundCloud (“Follow on SoundCloud”) on #22

### 2.8 Privacy / README

- Privacy: we record that you attested the Instagram follow; we do not connect
  to Instagram or store a fan Instagram id (parallel to Spotify copy on #22)
- README Download gates section: one bullet + link to this doc

---

## 3. Interaction with Spotify / SoundCloud

| Concern | Rule |
| --- | --- |
| Prerequisite | Merge or rebase onto #22 (email-first + Spotify attest) before implementing. |
| Attest UX | Shared `AttestStep`; Instagram is not a second component family. |
| Step order | Contact → SC → Spotify → Instagram via `GATE_ACTION_KINDS`. |
| Defaults | Instagram **on** for new gates; Spotify follow **off** until admin enables. |
| SC-only gates | Instagram waits until required SC (and Spotify) steps are done. Gate with contact + Instagram only: claim, then Open + Attest. |

---

## 4. Proposed build order

1. Land / rebase onto **email-first + Spotify follow** (#22).
2. Migration + `lib/instagram-gate.ts` + types (`instagram_follow`, progress,
   defaults, `PublicGate` fields).
3. Store + `applyAction` attest branch for Instagram (copy Spotify path).
4. Fan UI: generalize `SpotifyStep` → `AttestStep`, wire Instagram.
5. Admin toggle + handle field; CSV; privacy; README; a small flow test like
   `lib/gate-flow.test.ts`.

No new Instagram env vars.

---

## Open questions

1. **Existing published gates.** Recommendation: leave `false` after
   migration; only new gates default on. (Email-first on #22 already applies
   to all gates; Instagram requirement is separate.)
2. **Generalize vs copy `SpotifyStep`.** Recommendation: **generalize** in the
   same PR that adds Instagram so a third attest provider does not fork UI.
3. **Display name.** Store only handle, or also a freeform label? Recommendation:
   handle is enough; helper text uses `@handle`.
