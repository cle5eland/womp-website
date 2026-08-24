# Instagram Download-Gate Follow Step — Design Plan

Status: **proposed, decisions recorded** — this is a design, not a build. The
SoundCloud gate this extends is documented in
[`docs/download-gate-plan.md`](download-gate-plan.md). Email-first identity and
Spotify provider steps are documented in
[`docs/spotify-gate-plan.md`](spotify-gate-plan.md) (PR / branch
`cursor/spotify-gate-plan-bf6d`). This plan assumes that email-first flow has
landed or lands in the same change set.

A download gate today is SoundCloud-shaped: the fan connects SoundCloud,
completes like / repost / comment / follow as separate clicks, then leaves a
name and email. Spotify adds a second verified provider. Instagram cannot be
verified the same way, so this plan adds an **attested (honor-system) follow**
step that still requires a deliberate open + confirm.

---

## Decisions

| Question | Decision |
| --- | --- |
| Verification | **Honor system.** Meta does not expose a practical “did this visitor follow @handle?” check for a public download gate. See [§1](#1-feasibility-why-not-an-api). |
| Step order | **After SoundCloud and Spotify.** Contact (email) is first — see the Spotify plan. Display order: contact → SoundCloud kinds → Spotify kinds → Instagram follow → download. |
| New-gate default | **On.** `require_instagram_follow` defaults to `true` for new gates. Existing gates keep whatever they have after migration (`false` unless backfilled). |
| Target account | **Default `@wompbass`** (`instagramPermalink` / `instagramProfileUrl` in `lib/epk-data.ts`). Admin may override with a different handle or profile URL per gate. |
| SoundCloud session | **Not required.** Instagram only needs the email claim cookie (identity). A fan can complete Instagram without connecting SoundCloud, as long as no remaining SC/Spotify steps block them in order. |
| Confirm UX | Fan must **open the Instagram profile URL** (new tab) before “I’ve followed” becomes available. Opening alone does not credit the step. |
| Fan Instagram OAuth | **Out of scope.** No Instagram Login for fans, no fan IG tokens. |

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

Hypeddit-style attested follow is therefore the product choice, not a temporary
shortcut. Soft friction (must open the profile link first) raises the bar
without pretending we verified the follow.

Privacy / ToS note: we are **not** acting on a fan’s Instagram account. We only
record that they confirmed a follow after opening our profile. That is lighter
than SoundCloud/Spotify writes and does not need an Instagram app review for
fan OAuth.

---

## 2. Architecture

### 2.1 Depends on email-first identity

Unlocks key on `(gate_id, lower(email))` after the Spotify-plan identity
change. Instagram stamps a timestamp on that same unlock row. There is no
Instagram user id column in v1 — we never learn who they are on Instagram.

```
1. First name + email + list opt-in     ← claim cookie (Spotify plan)
2. SoundCloud connect + required SC actions
3. Spotify connect + required Spotify actions
4. Instagram: open profile → confirm follow
5. Download
```

`incompleteStep` includes Instagram after all SoundCloud and Spotify kinds.
`isUnlocked` is unchanged in spirit: email captured **and** every required
action (including Instagram when enabled) has a timestamp.

### 2.2 Provider / step typing

Keep SoundCloud `GateActionKind` values as they are. Instagram is a separate
kind so `/action` does not pretend to call a write API:

```
GateFlowStep =
  | "contact"
  | GateActionKind            // SoundCloud + Spotify kinds from spotify plan
  | "instagram_follow"
```

Alternatively fold `instagram_follow` into an extended `GateActionKind` with
`actionProvider(kind) → "soundcloud" | "spotify" | "instagram"`, where the
Instagram branch never touches a platform session. Prefer one dispatcher and
one progress object either way.

Display / completion order (once Spotify kinds exist):

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
  require_instagram_follow   bool not null default true   -- new gates; see note
  instagram_handle           text null   -- null → use epk-data "wompbass"
  instagram_profile_url      text null   -- optional override; else derived

gate_unlocks
  instagram_followed_at      timestamptz null
```

**Default nuance:** Postgres `DEFAULT true` applies to new **rows**. A
migration that adds the column to existing gates should set existing rows to
`false` (or leave them false via `DEFAULT false` then flip the application
default for creates) so published gates do not suddenly gain a new required
step. Application create path sets `require_instagram_follow: true`.

Store a normalised handle on the gate when the admin saves (strip `@`,
lowercase). Resolve profile URL as
`https://www.instagram.com/{handle}/` unless `instagram_profile_url` is an
explicit override (rare; useful if Instagram ever changes URL shape or for a
non-standard link).

Admin validation: if `require_instagram_follow` is true and both handle and
URL are empty, fall back to `instagramPermalink` from `lib/epk-data.ts` —
same pattern as Spotify follow falling back to `SPOTIFY_ARTIST_ID`.

CSV export: add `instagram_followed_at`.

### 2.4 Fan-facing flow

```
/gate/dubstep-single
  ├─ Track artwork, title, embeds
  ├─ First name, email, list opt-in          ← step 1 (always)
  ├─ SoundCloud connect + actions             ← when required / next
  ├─ Spotify connect + actions                ← when required / next
  ├─ Follow on Instagram
  │     [ Open Instagram ]  → opens profile in a new tab
  │     [ I’ve followed ]   → enabled only after Open was clicked this session
  └─ Download
```

Rules:

1. **Claim required.** `POST` that credits Instagram rejects without a valid
   claim cookie. No SoundCloud or Spotify cookie needed.
2. **Open before confirm.** Client tracks that the fan activated the profile
   link (e.g. clicked “Open Instagram”). Server may additionally require a
   short-lived signed “opened” cookie or a prior `POST .../instagram/open`
   so a bare confirm request without that signal is rejected. Bypassable by a
   determined user; enough to stop accidental one-click credits.
3. **Already following.** Same control: they still open the URL, then confirm.
   Copy: “Follow @handle — or open the profile if you already do.”
4. **Idempotent.** If `instagram_followed_at` is already set, return success.
5. **One deliberate confirm.** No bulk “complete all socials” control.

Labels (colocated with other gate labels):

```
instagram_follow: {
  title: "Follow on Instagram",
  helper: "Open the profile, follow, then confirm here.",
  cta: "I’ve followed",
  openCta: "Open Instagram",
  done: "Following",
}
```

### 2.5 Routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/gate/[slug]/claim` | Step 1 (existing / email-first). Prerequisite for Instagram. |
| `POST /api/gate/[slug]/instagram/open` | Optional. Records that this claim opened the profile (sets short-lived cookie or unlock flag). Prefer this over trusting client-only state. |
| `POST /api/gate/[slug]/instagram/confirm` | Credits `instagram_followed_at` if claim is valid and open signal present. Returns `GateActionResponse`. |
| Or single `POST /api/gate/[slug]/action` with `action: "instagram_follow"` | Acceptable if the dispatcher branches on provider and does not call SC/Spotify writers. Still requires the open signal. |

Download and unlock recompute stay shared: Instagram is just another required
timestamp.

Mock: no Instagram network calls in v1. A `GATE_MOCK_INSTAGRAM` flag is
unnecessary unless we later add Graph calls; open + confirm can always run
locally.

### 2.6 Modules / touch points

| Area | Change |
| --- | --- |
| Migration | `require_instagram_follow`, handle/url columns, `instagram_followed_at` |
| `lib/gate-types.ts` | Step kind, labels, `incompleteStep` / `gateStepCounts` / `isUnlocked`, progress field |
| `lib/gate-store.ts` | Parse requirements, `markAction` / mark Instagram, admin create defaults |
| `lib/gate-service.ts` | Confirm path: claim required, open signal, stamp, refresh unlock |
| Fan UI | `components/gate-experience.tsx` — open + confirm step after SC/Spotify |
| Admin | Create/edit toggle (default on), handle/URL override field |
| Privacy | Note that we record an Instagram follow confirmation timestamp; we do not connect to Instagram accounts or store IG handles of fans |
| README | Short bullet under Download gates pointing at this doc |

Do **not** reuse `lib/instagram-stats.ts` for this step. Stats remain EPK-only.

### 2.7 Soft open-signal options

Pick one at implement time; recommendation is **(A)**.

**(A) Signed open cookie (recommended).**  
`POST .../instagram/open` (or the Open link hitting a redirect route that sets
the cookie then 302s to Instagram) writes `womp_gate_ig_open` sealed with
gate id + unlock id + expiry (~15 minutes). Confirm checks that cookie.

**(B) Client-only.** Enable “I’ve followed” after `onClick` on the open link.
Simpler, easier to forge with DevTools. Acceptable if we want minimal surface.

**(C) Dwell timer.** Enable confirm N seconds after open. Annoying on mobile
and still forgeable. Skip unless abuse appears.

---

## 3. Interaction with Spotify / SoundCloud plans

| Concern | Rule |
| --- | --- |
| Email-first | **Prerequisite.** Do not ship Instagram against URN-keyed unlocks if email-first is still pending — either land email-first first, or include it in the same PR series. |
| Step order | Contact → SC → Spotify → Instagram. Hard-code provider order in `incompleteStep`, not admin drag-and-drop (v1). |
| SC not required for IG | If a gate has only Instagram (and contact), fan claims email then does Instagram. If SC steps remain incomplete, Instagram waits its turn in the sequence. |
| Defaults | New gates: Instagram **on**; Spotify checkboxes **off** until OAuth/quota is proven (per Spotify plan). SoundCloud requirements unchanged. |
| Relabel | Admin “Follow” for SoundCloud stays “Follow on SoundCloud”; Instagram is its own checkbox “Follow on Instagram”. |

---

## 4. Proposed build order

Plan-only is done when this document is merged. Implementation later:

1. **Email-first identity** (from Spotify plan) if not already shipped.
2. **Migration + types + store** for Instagram requirement, handle, timestamp.
3. **Confirm API** (+ recommended open cookie route).
4. **Fan UI** step after SC/Spotify in `incompleteStep`.
5. **Admin** toggle default on + handle override; CSV column; privacy + README.

No Instagram app configuration or new env vars for v1 beyond what email-first
already needs.

---

## Open questions

1. **Open via redirect vs plain `target=_blank`.** Redirect-through-our-origin
   makes the open cookie reliable; plain new-tab + separate `POST /open` is
   simpler but two round trips. Recommendation: **redirect route that sets
   cookie then 302s to Instagram**, with confirm checking that cookie.
2. **Existing published gates.** Recommendation: migration leaves
   `require_instagram_follow = false` on existing rows; only **new** gates
   default on. Confirm if any live gate should be flipped on manually after
   ship.
3. **Handle-only vs full URL in admin.** Recommendation: single text field
   that accepts `@wompbass`, `wompbass`, or a full `instagram.com/…` URL and
   normalises to a handle; store derived canonical profile URL.
