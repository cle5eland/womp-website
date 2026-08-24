# Instagram Download-Gate Follow Step — Design Plan

Status: **proposed, decisions recorded** — this is a design, not a build. The
SoundCloud gate this extends is documented in
[`docs/download-gate-plan.md`](download-gate-plan.md). Email-first identity and
Spotify Open + Attest steps are documented in
[`docs/spotify-gate-plan.md`](spotify-gate-plan.md) (PR #22 /
`cursor/spotify-gate-plan-bf6d`). This plan assumes that email-first flow has
landed or lands in the same change set.

A download gate today is SoundCloud-shaped: the fan connects SoundCloud,
completes like / repost / comment / follow as separate clicks, then leaves a
name and email. The Spotify plan adds email-first identity and **honor-system**
Spotify steps (open the Spotify page, then attest). Instagram fits the same
attest pattern: Meta cannot verify a public “did this visitor follow us?” for a
download gate, so we **open the profile, then attest**.

SoundCloud steps stay API-verified. Spotify and Instagram do not.

---

## Decisions

| Question | Decision |
| --- | --- |
| Verification | **Honor system (Open + Attest).** Same class of step as Spotify in the Spotify plan. See [§1](#1-feasibility-why-not-an-api). |
| Step order | **After SoundCloud and Spotify.** Contact (email) is first. Display order: contact → SoundCloud kinds → Spotify kinds → Instagram follow → download. |
| New-gate default | **On.** Application create sets `require_instagram_follow: true`. Migration leaves existing rows `false` so live gates do not gain a new step. |
| Target account | **Default `@wompbass`** (`instagramPermalink` / `instagramProfileUrl` in `lib/epk-data.ts`). Admin may override with a different handle or profile URL per gate. |
| SoundCloud session | **Not required.** Instagram only needs the email claim cookie. |
| Open before attest | Fan must **open the Instagram profile URL** this visit before “I followed” enables. Opening alone does not credit the step. Already following: still open + attest. |
| Fan Instagram OAuth | **Out of scope.** No Instagram Login, no fan IG tokens, no IG user id on the unlock row. |
| Shared UX with Spotify | **Reuse the same Open + Attest control.** One generic component; Instagram is another `stepFulfillment: "attest"` kind. |

---

## 1. Feasibility: why not an API

The site already has an Instagram Graph token (`INSTAGRAM_ACCESS_TOKEN`) used
only for EPK stats (`lib/instagram-stats.ts`). That token can read **our**
follower count and profile. It cannot answer “does visitor X follow us?”

| Approach | Why it does not fit |
| --- | --- |
| Artist Graph token | No endpoint to look up an arbitrary visitor’s follow relationship. |
| Fan Instagram Login (Business Login) | Fan must have a professional account; still no clean “follow @wompbass” write or general contains-check for a third-party profile. |
| Messaging `is_user_follow_business` | Only after the fan has messaged the business (consent via DM). Gate UX would be “DM me first,” which we are not doing. |

Attested follow is the product choice, not a temporary shortcut — the same
conclusion the Spotify plan reached for quota reasons. Soft friction (must
open the profile first) stops accidental one-click skips without pretending we
verified the follow.

We are **not** acting on a fan’s Instagram account. We only record that they
attested a follow after opening our profile. No Instagram app review for fan
OAuth.

---

## 2. Architecture

### 2.1 Depends on email-first identity

Unlocks key on `(gate_id, lower(email))` after the Spotify-plan identity
change. Instagram stamps a timestamp on that same unlock row. There is no
Instagram user id column — we never learn who they are on Instagram.

```
1. First name + email + list opt-in          ← claim cookie
2. SoundCloud connect + required SC actions  ← API writes, if required
3. Spotify Open + Attest steps               ← if required
4. Instagram Open + Attest                   ← if required
5. Download
```

`incompleteStep` includes Instagram after all SoundCloud and Spotify kinds.
`isUnlocked` stays “email captured AND every required action has a timestamp.”

Cookies (from the Spotify plan; Instagram adds none):

```
womp_gate_claim     email identity
womp_gate_fan       SoundCloud access token (SC writes only)
```

### 2.2 Provider / step typing

Align with the Spotify plan’s dispatcher:

```
GateActionKind =
  "like" | "repost" | "comment" | "follow"   // SoundCloud, API
  | "spotify_follow" | …                     // Spotify, attest
  | "instagram_follow"                       // Instagram, attest

actionProvider(kind) → "soundcloud" | "spotify" | "instagram"
stepFulfillment(kind) → "api" | "attest"
```

`POST /api/gate/[slug]/action` stays the single mutation route. Attest kinds
require a claim cookie and `{ action, attested: true }`; they never call
SoundCloud or Instagram APIs.

Display / completion order:

```
contact
→ like, repost, comment, follow          // SoundCloud
→ spotify_follow, …                      // Spotify (when required)
→ instagram_follow                       // Instagram (when required)
→ download
```

Until Spotify ships, order is contact → SC → Instagram.

### 2.3 Data model

Additive migration:

```
gates
  require_instagram_follow   bool not null default false  -- DB default
  instagram_handle           text null   -- null → epk-data "wompbass"
  instagram_profile_url      text null   -- optional override; else derived

gate_unlocks
  instagram_followed_at      timestamptz null
```

**Defaults:** column default `false` so existing rows stay off. Admin/create
API sets `require_instagram_follow: true` for **new** gates.

Store a normalised handle on save (strip `@`, lowercase). Profile URL is
`https://www.instagram.com/{handle}/` unless `instagram_profile_url` is set.
If the requirement is on and handle/URL are empty, fall back to
`instagramPermalink` from `lib/epk-data.ts` (same idea as Spotify →
`SPOTIFY_ARTIST_ID`).

Expose the open URL on `PublicGate` (public profile link, fine to send to the
browser). CSV: add `instagram_followed_at`.

### 2.4 Fan-facing flow

Same Open + Attest chrome as Spotify:

```
/gate/dubstep-single
  ├─ Track artwork, title, embeds
  ├─ First name, email, list opt-in
  ├─ SoundCloud connect + API actions
  ├─ Spotify Open + Attest (when required)
  └─ Follow on Instagram
       [ Open Instagram ]  → new tab, profile page
       [ I followed ]      → enabled after Open this visit; POST attest
```

Rules:

1. **Claim required.** Attest rejects without `womp_gate_claim`. No SoundCloud
   cookie needed.
2. **Open before attest.** Client enables “I followed” only after Open is
   clicked this visit — **same client-only gate as the Spotify plan.** Easy to
   bypass; stops accidental one-click credits. Server trusts `attested: true`
   the same way it trusts a typed SoundCloud comment.
3. **Already following.** Still open + attest. Copy can say follow there, or
   confirm if they already do.
4. **Idempotent.** If `instagram_followed_at` is set, return success.
5. **No bulk attest.** One deliberate confirm per step.

Labels (match Spotify’s “I followed” voice):

```
instagram_follow: {
  title: "Follow on Instagram",
  helper: "Opens @wompbass on Instagram. Follow there, then come back.",
  openCta: "Open Instagram",
  cta: "I followed",
  done: "Followed",
}
```

Helper text should use the gate’s resolved handle when it is not `wompbass`.

### 2.5 Routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/gate/[slug]/claim` | Step 1 (email-first). Prerequisite. |
| `GET /api/gate/[slug]/connect` | SoundCloud only. Unchanged. |
| `POST /api/gate/[slug]/action` | `instagram_follow` with `attested: true`: claim cookie, stamp `instagram_followed_at`, refresh unlock. No platform session. |
| `GET /api/gate/[slug]/download` | Claim cookie + unlocked row. |

No Instagram callback, connect, or mock env flag. Open is a plain
`target=_blank` (or `window.open`) to the public profile URL on `PublicGate`.

### 2.6 Modules / touch points

| Area | Change |
| --- | --- |
| Migration | requirement + handle/url + `instagram_followed_at` |
| `lib/gate-types.ts` | `instagram_follow` kind, `actionProvider` / `stepFulfillment`, labels, progress, `incompleteStep` order |
| `lib/gate-store.ts` | requirements, mark attest, create default `true` |
| `lib/gate-service.ts` | attest branch: claim required, no SC session |
| Fan UI | Shared Open + Attest step in `gate-experience.tsx` (Spotify + Instagram) |
| Admin | Toggle default on for creates; handle/URL field; “Follow on Instagram” |
| Privacy | We record Instagram attest timestamps; we do not connect Instagram or store fan IG handles |
| README | Point at this doc under Download gates |

Do **not** reuse `lib/instagram-stats.ts`. Stats stay EPK-only.

---

## 3. Interaction with Spotify / SoundCloud plans

| Concern | Rule |
| --- | --- |
| Email-first | **Prerequisite** (Spotify plan). Land first or in the same series. |
| Attest UX | **Share one Open + Attest component** with Spotify. Instagram is not a second UI pattern. |
| Step order | Contact → SC → Spotify → Instagram. Hard-coded in `incompleteStep`. |
| SC not required for IG | Gate with only contact + Instagram: claim, then Open + Attest. Remaining SC/Spotify steps still block Instagram until done (order). |
| Defaults | New gates: Instagram **on**; Spotify kinds **off** (Spotify plan). SoundCloud unchanged. |
| Relabel | SoundCloud follow → “Follow on SoundCloud”; Instagram → “Follow on Instagram”. |

---

## 4. Proposed build order

Plan-only is done when this document is merged. Implementation later:

1. **Email-first + Spotify attest foundation** (Spotify plan) if not shipped —
   claim cookie, `stepFulfillment`, shared Open + Attest UI.
2. **Migration + types + store** for Instagram requirement, handle, timestamp.
3. **Wire `instagram_follow`** through `/action` attest branch + step order.
4. **Admin** toggle (create default on) + handle override; CSV; privacy; README.

No new Instagram env vars for v1.

---

## Open questions

1. **Existing published gates.** Recommendation: migration leaves them off;
   only new gates default on. Flip any live gate on manually after ship if
   wanted. (Spotify plan flips **email-first** onto all gates because there
   are no real users yet — Instagram requirement is separate.)
2. **Handle field shape.** Recommendation: one text field that accepts
   `@wompbass`, `wompbass`, or a full `instagram.com/…` URL and normalises to a
   handle; store derived canonical profile URL on the gate.
3. **Ship with Spotify or after?** Recommendation: implement Instagram as soon
   as the shared attest UI exists — either the same PR as Spotify follow, or
   immediately after. Do not invent a second Open + Attest control.
