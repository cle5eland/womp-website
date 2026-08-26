# Turning the download gate into a public product — feasibility, scope, pricing, costs

Status: **analysis only.** No product code changes.

> A companion assessment of a different target market — fan messaging, competing with
> Laylo and ManyChat rather than Hypeddit — is in
> [`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md). It
> reaches a more favourable conclusion, largely because Meta's API access is open where
> Spotify's is closed. Read both before choosing. Its supporting research is split across
> [`fan-messaging-research-2026.md`](fan-messaging-research-2026.md) (platform and legal
> groundwork) and [`laylo-market-research-2026.md`](laylo-market-research-2026.md)
> (Laylo profile, competitive set, demand signals, comment-to-DM).

This document exists to answer four questions before any multi-tenant code gets written:

1. What would it take to let *other* artists create download gates and smart links?
2. What else could be sold alongside them?
3. Is this market winnable?
4. What would it cost to run?

The short answer is at the top. The reasoning, and the parts that change the answer,
follow.

---

## 1. Executive summary

**The infrastructure is the easy part. The platform policy is the hard part.**

The gate implementation in this repo is genuinely good — compliance-aware by design,
with the difficult pieces (OAuth 2.1 + PKCE, encrypted sessions, private blob
delivery, entitlement re-derived server-side) already built and reasoned about in
`docs/download-gate-plan.md`. Multi-tenancy is a few weeks of unglamorous work, not a
rewrite.

The problem is that the single most valuable feature — *requiring* a SoundCloud like,
repost, comment, or follow in exchange for a download — is something SoundCloud has
published a policy against, and enforced against the market leader inside the last
three months.

Three findings drive everything else:

| Finding | Consequence |
| --- | --- |
| SoundCloud's Help Center states that "any service that offers to sell social interactions or other types of promotional activities on SoundCloud is strictly prohibited," and the User Terms forbid *offering or selling* such services to other Platform users. | Charging other artists for SoundCloud action-gating is against stated policy. Doing it for yourself is a much smaller exposure than selling it. |
| In June 2026 SoundCloud paused Hypeddit's API access, making SoundCloud gate steps voluntary. On 10 Aug 2026 a SoundCloud engineer said publicly they "did not block such services in general and do not plan to" ([soundcloud/api#550](https://github.com/soundcloud/api/issues/550)). | The category leader's flagship feature is currently degraded, and nobody outside SoundCloud knows the real rule. That is simultaneously the opportunity and the risk. |
| Spotify's extended quota mode now requires a registered business with **≥250,000 MAU**; development mode is capped at **5 authorized users**. | Spotify pre-save and Spotify follow-gating are effectively **unavailable to any new entrant**. Incumbents are grandfathered. This is a moat protecting Hypeddit and Feature.fm *from you*. |

So the product that is obvious to build (a Hypeddit clone) is the one most exposed to
being switched off by a third party. The product worth building is the one whose value
survives platform whiplash: **owned-audience infrastructure** — email-first file
delivery, a real fan CRM, paid downloads, Discord access, smart links, and an EPK —
with platform actions demoted to optional, honor-system nudges.

**Verdict:** viable as a deliberately-scoped, organically-marketed niche business,
most likely landing in the **$50k–160k ARR** range within a couple of years of
sustained effort. Not viable as a venture-scale play, and not viable at all if
SoundCloud action-gating is the core of the pitch. The highest-return variant is not
$9/mo artists at all — it is **labels** (see §6.4 and §8.5).

---

## 2. What already exists (the asset inventory)

Worth being precise about this, because it determines how much of the build is real
work versus already-solved.

### Already built and reusable

| Asset | Where | Multi-tenant ready? |
| --- | --- | --- |
| Fan gate flow, one step at a time | `components/gate-experience.tsx` | Yes, cosmetics aside |
| SoundCloud user OAuth (2.1 + PKCE, signed state, encrypted cookie) | `lib/soundcloud-user-auth.ts` | Yes — one app can authorize many fans |
| SoundCloud writes with retry/backoff | `lib/soundcloud-actions.ts`, `lib/soundcloud-http.ts` | Yes |
| Entitlement model — download re-checks DB, never client state | `lib/gate-service.ts` (`authorizeDownload`) | Yes |
| Private Blob delivery, storage URL never exposed | `app/api/gate/[slug]/download/route.ts` | Yes, but see cost §7 |
| Email-as-identity with `(gate_id, lower(email))` uniqueness | `db/migrations/0002_*.sql` | Yes |
| Admin accounts, scrypt hashing, encrypted sessions | `lib/admin-auth.ts`, `lib/crypto-utils.ts` | Partly — no signup/reset |
| `gates.owner_id` FK and `listGates(ownerId)` | `db/migrations/0001_*.sql`, `lib/gate-store.ts` | Schema yes, enforcement no |
| Retention cron pruning abandoned unlocks | `app/api/cron/gate-retention/route.ts` | Yes |
| CSV export with formula-injection guard | `app/api/admin/gates/[id]/unlocks/route.ts` | Yes |
| Live Spotify / SoundCloud / Instagram stat fetching | `lib/*-stats.ts` | Reusable for an EPK product |
| EPK page | `app/epk/page.tsx`, `lib/epk-data.ts` | Hardcoded, but the pattern is there |

That is a lot of solved problems. The compliance thinking already baked in — one
explicit click per action, no bulk button, fan-authored comment text, no code path
from a SoundCloud track to a download — is exactly what a commercial version needs,
and most competitors got there by accident or not at all.

### Does not exist

- **Smart links.** Greenfield. No routes, tables, or click tracking anywhere.
- **Tenancy.** No organizations, memberships, roles, or invitations.
- **Billing.** No Stripe, plans, entitlements, or usage metering.
- **Self-service onboarding.** Admin creation is a one-shot env-var bootstrap; there
  is no signup, email verification, or password reset.
- **Abuse controls.** No CAPTCHA, IP rate limiting, or bot detection on any public
  gate endpoint.
- **Outbound email.** Addresses are captured and exportable; nothing sends mail.

### Two bugs that are harmless today and blocking tomorrow

These are worth fixing regardless of whether the SaaS happens, because they are the
difference between "single-tenant app" and "data breach".

**1. Missing ownership checks (IDOR).** `app/api/admin/gates/[id]/route.ts` loads the
gate by id and checks only that *somebody* is signed in:

```21:34:app/api/admin/gates/[id]/route.ts
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await context.params;
  const gate = await getGateById(id);
  if (!gate) {
    return NextResponse.json({ error: "Gate not found." }, { status: 404 });
  }
```

`admin.id` is never compared to `gate.ownerId`. With one admin that is invisible. With
paying customers, any signed-in user who guesses or obtains a gate UUID can edit,
unpublish, re-point the delivery file, or read the email list of another artist's
gate. The same gap applies to the `unlocks` export and the `upload` token route — the
latter meaning one tenant could obtain an upload token scoped to another tenant's
gate.

**2. Site-wide defaults leak the operator's own identity.** A null
`spotify_artist_id` means "use the site default", and the site default is WOMP:

```9:10:lib/spotify-gate.ts
/** WOMP. Same default as `SPOTIFY_ARTIST_ID` / `lib/spotify.ts`. */
export const DEFAULT_SPOTIFY_ARTIST_ID = "64XV9aZxwoLuxf9tgvu9Pb";
```

`lib/instagram-gate.ts` does the same with `wompbass`. In a multi-tenant product, a
customer who leaves those fields blank would send their fans to *your* Spotify and
Instagram. In the best case that is an embarrassing bug; in the worst case it looks
like deliberately harvesting your customers' audiences. Every "site default" has to
become a per-tenant value with no global fallback.

---

## 3. The platform problem (read this before anything else)

This is the section that should decide whether the project happens in the form
originally imagined.

### 3.1 SoundCloud: selling promo services is prohibited

Two documents matter, and they point the same way.

The **User Terms** prohibit using services designed to misrepresent activity on the
platform, and then go further:

> You must not employ any techniques or make use of any services, automated or
> otherwise, designed to misrepresent the popularity of your Content or the content of
> other users on the Platform, or to misrepresent your or other users activity on the
> Platform, including … apps, plugins, extensions or other automated means to …
> add followers to your or other users account, play Content, follow or unfollow other
> users, send messages, post comments, or otherwise to act on your behalf …
> **You must not offer, sell or promote the availability of any such techniques or
> services to any other users of the Platform.**

The **Help Center** is blunter:

> Any service that offers to sell social interactions or other types of promotional
> activities on SoundCloud is strictly prohibited. This includes services that charge
> users to repost content… We view charging for promotional activities as a form of
> unauthorized advertising, which directly violates our Terms of Use.

The **API Terms** cut both ways. Acceptable commercial use explicitly includes
"services aimed at helping a user to promote his/her User Content via authenticated
access to the user's account" — which is a fair description of a download gate. But
that permission is conditioned on "provided this does not constitute a breach of the
User Terms", which loops straight back to the clause above. And two further clauses
bite:

- **No reselling API access.** "You must not rent, sell or lease access to the
  SoundCloud API … and must not sell or transfer, or offer to sell or transfer, your
  Security Code to any third party without the prior written approval of SoundCloud."
  A subscription whose value is *your* SoundCloud app performing actions for *paying
  customers* is arguably exactly this.
- **Discretionary revocation.** "We reserve the right to revoke API access for any app
  that we determine is not providing added benefit to SoundCloud users and/or is not
  in the best interests of SoundCloud or our users."

There is also a narrower clause that the current implementation already sits against.
The carve-out permitting comments requires that they are "not made in response to any
encouragement or incentive provided by you or your app." A download gate is an
incentive by definition. `docs/download-gate-plan.md` §2(b) already identified this
and chose the safer of two bad options (fan-authored text, never pre-filled). For a
personal site that is a defensible risk on your own credentials. In a product sold to
strangers, **required comments should not ship at all.**

### 3.2 What actually happened to Hypeddit, and why it matters

- **June 2026:** SoundCloud paused Hypeddit's API connection. SoundCloud steps in
  download gates became voluntary — fans can now skip them and still download.
  Hypeddit attributed it to "pressure from parts of the industry."
- **10 Aug 2026:** on [soundcloud/api#550](https://github.com/soundcloud/api/issues/550),
  SoundCloud's Danny Preussler wrote: "Although we cant comment on individual cases, I
  can say: we did not block such services in general and do not plan to." Artists in
  the thread immediately read that as Hypeddit having been cut for something specific
  rather than for the category.
- **May–June 2026, pulling the other way:** SoundCloud opened *self-serve* API keys to
  any Artist Pro subscriber, shipped an OpenAPI spec and a credentials CLI, and wrote
  developer-friendly blog posts about it.

The honest reading is that SoundCloud is welcoming developers while reserving the
right to switch off any individual app for reasons it will not explain. Whether
Hypeddit was cut for the category, for reselling API access, for required comments, or
for something unrelated is unknowable from outside — and every one of those
possibilities is a rule you would also be subject to.

**What follows architecturally: bring-your-own-credentials.** Because API keys are now
self-serve for Artist Pro subscribers ($8.25/mo billed annually, $99/yr), each customer
can register their *own* SoundCloud app and point its single redirect URI at your
callback. That changes the risk profile substantially:

- You are not reselling API access — the customer holds their own credentials and
  accepted the API Terms themselves.
- Rate limits and enforcement are per-customer, so one bad actor cannot take down
  every tenant.
- SoundCloud cannot disable the whole platform with one action, which is precisely
  what happened to Hypeddit.

The costs are real: it adds an onboarding step most artists will find intimidating, it
requires them to hold a paid Artist Pro subscription, and it will be your single
largest source of support tickets. It also does not make incentivized engagement
compliant — it only stops one revocation from being fatal, and moves the ToS
relationship to the person actually doing the promoting. Treat it as risk
distribution, not absolution.

### 3.3 Spotify: closed to new entrants

This one is unambiguous and it kills a feature customers will absolutely ask for.

- **Development mode:** 1 client ID per developer (raised to 25 in July 2026), **5
  authorized users per app**, owner must hold Spotify Premium, and a reduced set of
  endpoints. Spotify's own words: development mode "is intentionally limited and should
  not be relied on as a foundation for building or scaling a business on Spotify."
- **Extended quota mode:** requires a registered business entity, a launched service,
  **≥250,000 MAU**, availability in key markets, proof of commercial viability, and a
  discretionary review.

You cannot reach 250k MAU through a 5-user cap. There is no ramp. So for a new entrant:

- **Spotify pre-save: not buildable.** This is the single most requested feature in
  this category, and it is off the table.
- **Spotify follow-gating via API: not buildable.** (It would also breach the
  Developer Policy's ban on increasing follow counts "by providing any compensation
  (financial or otherwise)", which is what a download is.)
- **Spotify metadata for smart links:** use **Odesli/Songlink** instead. Free, no
  Spotify relationship needed, 10 req/min without a key and higher with one
  (`developers@song.link`). Metadata is highly cacheable, so 10 req/min is plenty.

Worth noting how much this hurts incumbents too: in June 2026 Spotify put a 6-month
expiry on refresh tokens (enforced for existing apps from 20 July 2026), which broke
"forever pre-save" everywhere. Hypeddit and Laylo now have to nag fans to
re-authenticate every six months. The pre-save feature you cannot build is also
quietly decaying for the people who can.

### 3.4 Where that leaves the feature set

| Feature | Platform dependency | Can a new entrant ship it? |
| --- | --- | --- |
| Email-gated file download | None | **Yes — fully safe** |
| Smart links (via Odesli) | None | **Yes — fully safe** |
| Paid downloads / tips | Stripe only | **Yes — fully safe** |
| Discord role on unlock | Discord bot (permissive) | **Yes — low risk** |
| EPK with live stats | Read-only public APIs | Yes, moderate fragility |
| "Follow me" honor-system nudge | None (deep link only) | Yes — no API, no revocation lever |
| SoundCloud like/repost/follow gate | SoundCloud API + policy | **Only via BYO credentials, and against stated policy** |
| Required SoundCloud comment | SoundCloud API | **No — should not ship** |
| Spotify follow gate (API-enforced) | Spotify API | **No** |
| Spotify / Apple pre-save | Spotify API | **No** |

The safe column is not a consolation prize. It is a coherent product — and it is
exactly where Hypeddit is being pushed anyway, telling its own users that "an email
list or a Spotify save is harder for a platform to revoke than an API connection."

---

## 4. Competitive landscape

Positioning matters more than features here, because two of the three things you would
sell are already free somewhere.

| Competitor | What it is | Pricing (2026) |
| --- | --- | --- |
| **Hypeddit** | The category incumbent, grew up on SoundCloud gates | Free tier; Basic $10/mo; Pro $20/mo (adds Meta CAPI, ad automation); Elite $100/mo (adds coaching) |
| **Feature.fm** | Polished, label-friendly smart links + pre-save | Paid tiers, positioned above Hypeddit |
| **Linkfire** | Enterprise/label smart links and analytics | Enterprise pricing |
| **Symphony** | Marketing automation, runs ads for you | $25 / $49 / $99 per month, credit-based |
| **Odesli (song.link)** | Smart links | **Free**, incl. customization |
| **HyperFollow (DistroKid)** | Smart links + pre-save | **Free** with distribution |
| **Linktree** | Generic link-in-bio | Free / ~$5–24 per month |

Three conclusions:

1. **Smart links are a commodity.** Odesli is free and powers other tools' matching;
   DistroKid bundles HyperFollow free with a $22.99/yr distribution plan. Smart links
   are table stakes you must have and cannot meaningfully charge for. Anyone whose
   business plan rests on smart-link revenue has misread the market.
2. **The price ceiling is set at $10–20/mo** by a ten-year incumbent with brand
   recognition, SEO, and an existing user base. There is no room to charge more for the
   same feature list, and racing to charge less is a bad trade.
3. **Hypeddit's moat is temporarily breached.** Its defining feature — enforced
   SoundCloud gating — currently does not work. If there was ever a moment to enter
   with a working SoundCloud gate, it is now. But note *why* theirs is broken: not
   because they built it badly, but because SoundCloud turned it off. Entering on that
   basis is entering a fight you have no ability to win if SoundCloud decides the same
   thing about you.

### Market size, honestly

Precise numbers are not publicly available and any figure claiming otherwise should be
distrusted. The structural shape is clear enough without them:

- Download gates are a niche within a niche — producers in electronic genres
  (dubstep, bass, DnB, house) who release free tracks and remixes to build a following.
  That is where this repo's own audience sits, which is an advantage.
- SoundCloud reports on the order of 140M registered users, but the addressable
  slice is *artists who actively run free-download campaigns and will pay for tooling*
  — plausibly in the tens of thousands globally, not millions.
- Hypeddit has owned that niche for roughly a decade. If they have on the order of
  20,000 paying users at ~$15 blended, that is ~$3.6M ARR — a good small business, and
  it is the **market leader's** ceiling.

A realistic entrant capturing a few percent of that niche lands at a few hundred to a
couple of thousand paying customers. Which is a real business, and worth being clear-
eyed about rather than disappointed by.

### The customers are price-sensitive and churn hard

This deserves emphasis because it is the most common way products like this fail:

- Artists buy tools **per release campaign**, then cancel. Churn in prosumer creative
  tooling at $10–20/mo is commonly 8–15% *monthly*, implying an average customer life
  of roughly 7–12 months.
- At $12/mo and 10% monthly churn, LTV is around $120 gross, maybe $100 after payment
  fees and hosting.
- That means paid acquisition is essentially closed: a CAC above ~$35 makes the unit
  economics fail, and competitive CPCs in music-marketing keywords run well past that.

**Consequence: the only viable go-to-market is organic** — your own audience, the
scene you are already in, content, and word of mouth. Which happens to be the one
genuine structural advantage here (§9).

---

## 5. What multi-tenancy actually requires

Ordered by dependency, not by calendar. The point of this section is that the
engineering is tractable and mostly boring — which is why it should not be the thing
that decides the question.

**Foundations (must precede any customer)**

1. **Fix the two bugs in §2.** Ownership checks on every admin route that takes an id;
   remove every global default in favour of per-tenant values.
2. **Tenancy model.** `organizations`, `memberships` (owner/admin/member), and an
   `org_id` on every tenant-owned row. Row-level scoping in `lib/gate-store.ts` rather
   than at each call site, so a forgotten `where` clause cannot leak data.
3. **Slug namespacing.** `gates.slug` is currently globally unique, so the first
   customer to take `free-download` takes it forever. Move to
   `(org_id, slug)` uniqueness plus per-tenant URL prefixes or subdomains
   (`artist.yourdomain.com/gate/slug`).
4. **Real auth.** Self-service signup, email verification, password reset, and
   invitations. The current one-shot `ADMIN_BOOTSTRAP_*` flow does not survive contact
   with customers.

**Commercial**

5. **Billing and entitlements.** Stripe Checkout + webhooks, a `plan` on the org, and a
   metering table for the limits you enforce (active gates, monthly unlocks, storage).
   Entitlements must be checked server-side in the gate and download paths, not just
   in the UI.
6. **Storage migration.** Move gated files off Vercel Blob to R2 before launch, not
   after — see §7. Retrofitting this once customers have files is far worse.

**Trust and safety (do not defer these)**

7. **Abuse controls.** Cloudflare Turnstile on the claim step, per-IP and per-email
   rate limits on all public gate endpoints, and per-plan storage/bandwidth caps.
   Without these a free tier is an open file-hosting service.
8. **Copyright and takedowns.** You will be hosting audio uploaded by strangers.
   That requires DMCA registration and an agent, a takedown workflow, a repeat-
   infringer policy, and acceptance that some users will upload material they do not
   own. This is a legal obligation, not a feature.
9. **GDPR.** Each customer becomes a data controller for their fans and you become
   their processor: a DPA, subprocessor list, deletion and export flows, retention
   policy, and breach notification. Note the SoundCloud API Terms already treat you as
   an *independent* controller for SoundCloud personal data, and require deletion of a
   user's data when they revoke access.

**Then the product**

10. **Smart links.** `smart_links`, `smart_link_destinations`, `link_clicks`; Odesli
    resolution with aggressive caching; a public renderer; click and referrer
    analytics. This is the most self-contained piece of new work in the whole plan.

Items 7–9 are the ones that tend to get skipped and then become emergencies. A
platform hosting other people's unreleased music, collecting other people's fans'
email addresses, is a meaningfully different liability posture than a personal site.

---

## 6. What else could be offered

Ranked by (differentiation × safety) ÷ build cost. The recurring theme: the best ideas
are the ones with no third-party kill switch.

### 6.1 Build these first — safe and differentiating

**Fan CRM across gates.** Today an unlock row belongs to one gate. Promote the fan to a
first-class per-tenant entity, deduplicated by email across every gate and link, with
tags, source attribution, engagement history, and repeat-download detection. This is
the thing artists actually want ("who are my 500 real fans?") and no platform can
revoke it. It is also the natural anchor for a paid tier, and the schema is already
half-way there.

**Discord role granting on unlock.** Fan unlocks a gate, gets a role in the artist's
Discord automatically. In bass/electronic scenes Discord *is* the community, and the
current tooling for this is duct tape. A permissive API, low build cost, high perceived
value, real differentiation. This is the single best feature-to-effort ratio on the list.

**Stem, remix-pack, and sample-pack delivery.** Large ZIPs with per-file manifests,
resumable downloads, and licence acceptance capture (a click-through licence recorded
with a timestamp — remix packs need this and nobody does it well). Directly serves the
producer niche and turns the boring egress problem into a feature. Requires the R2
migration in §7 to be affordable.

**Paid downloads and tip jars.** Stripe Connect, take a percentage. Strategically this
is the most interesting item on the list for three reasons: revenue scales with
customer success instead of seat count, it monetises free users who would never pay a
subscription, and it means you are charging for *commerce* rather than for
"promotional activities" — which is squarely outside the language SoundCloud objects to.

**Email delivery of the download link, then broadcasts.** Currently nothing sends mail,
which makes the captured list half-useful. Start with transactional delivery, then
"email everyone who downloaded X". Be careful: see the cost warning in §7.4 — this is
the one feature that can quietly become your largest expense and your biggest
deliverability risk.

### 6.2 Strong second wave

**EPK builder.** `app/epk/page.tsx` and `lib/*-stats.ts` already do this for one
artist: a press kit with live follower counts, press shots, and links. Generalising it
is mostly parameterisation, and nobody in this space bundles a decent one. Good
retention feature — an EPK is a thing you keep, unlike a gate you use for one release.

**Tracking pixels and conversion events.** Meta CAPI, TikTok, GA4. Hypeddit gates this
behind its $20 tier, so it is an expected line item on any comparison table. Moderate
build, no platform risk, mostly a compliance/consent chore.

**Custom domains.** Expected at the paid tier and a genuine retention hook (a customer
with DNS pointed at you does not casually leave). Check Vercel's per-project domain
limits before promising it at scale; Cloudflare for SaaS is the fallback.

**Pre-order and "notify me" campaigns.** The compliant substitute for pre-save: collect
emails and send a link on release day. Less magical than a real pre-save, but it works,
it is yours, and it cannot be revoked.

### 6.3 Deliberately avoid

- **Spotify / Apple pre-save** — not buildable (§3.3). Say so plainly in marketing
  rather than half-shipping it.
- **Required SoundCloud comments** — against the API Terms' explicit carve-out
  condition.
- **Follower/play counts as a paid promise** — this is what SoundCloud's fake-activity
  policy targets. Never advertise guaranteed engagement numbers.
- **Being a general Linktree competitor** — commodity, free alternatives, no edge.

### 6.4 The variant that is probably a better business

**Label tooling and white-label.** Labels — especially the bass/dubstep imprints
already in this scene — run constant free-download, remix-contest, and demo-submission
campaigns across a roster. They have budget, they churn far less than individual
artists, and one label is worth thirty $9/mo artists.

Concretely: multi-artist rosters with seats and permissions, a demo submission portal
with reviewer workflow (a genuinely unsolved problem that every label complains about),
remix contests with stem distribution and submission handling, and white-labelling
onto the label's own domain.

Ten labels at $199/mo is $24k ARR from ten support relationships. Reaching the same
revenue through $12/mo artists takes ~165 customers and roughly fifteen times the
support load. If the goal is revenue rather than user count, this is the more efficient
path — and it uses the same core engine.

---

## 7. Costs

Good news: infrastructure is not the constraint, provided one architectural decision is
made correctly. Bad news: that decision is load-bearing, and the non-infrastructure
costs are larger than the infrastructure ones.

*Figures are list prices at time of writing and should be re-checked before being used
in a financial model; the ratios matter more than the absolute numbers.*

### 7.1 The decision that dominates everything: where files are served from

Gate downloads are egress-heavy. The current implementation streams the file *through*
a serverless function so the storage URL is never exposed — the right call for
security, and the wrong one for cost at scale, because it pays for bandwidth twice
(storage egress plus platform data transfer) and burns function time proportional to
file size.

Typical payloads: a 320kbps MP3 of a four-minute track is ~10 MB; a 24-bit/44.1kHz WAV
is ~40 MB; a stem or sample pack is 150–500 MB.

Cost of **1,000 downloads of a 40 MB WAV (40 GB)**:

| Path | Egress cost | Notes |
| --- | --- | --- |
| Vercel Blob streamed through a function | **~$8** | Blob transfer plus platform data transfer, plus function GB-hours |
| Cloudflare R2 + short-TTL presigned URL | **~$0** | R2 charges **no egress fees**; only ~$0.015/GB-month storage and trivial Class B operation costs |

At 1,000 customers averaging 500 downloads/month of 30 MB files — 15 TB/month — that is
the difference between roughly **$3,000/month** and roughly **$5/month**. Against
$12,000/month of revenue, one architecture spends a quarter of gross revenue on
bandwidth and the other spends nothing.

**Therefore: migrate gated files to R2 (or Bunny) before launch, and switch from
streaming to short-TTL presigned URLs.** Keep the authorization check exactly where it
is — the function still verifies the unlock record and *then* issues a URL valid for
~60 seconds. The only thing given up is that the URL is briefly shareable, which is
acceptable for free promo files and can be tightened by binding the signature to the
requesting IP.

This also makes a free tier survivable. On the streaming architecture, one free user
uploading a 500 MB pack that gets 50,000 downloads costs ~$3,750 in bandwidth. On R2 it
costs approximately nothing. **A free tier is only safe on zero-egress storage.**

### 7.2 Marginal cost per unlock (on the corrected architecture)

One fan completing a gate: ~6–10 function invocations, one row plus a handful of
updates, one email, and the file transfer.

| Component | Per unlock |
| --- | --- |
| Function invocations and compute | ~$0.0002 |
| Postgres | negligible per row |
| File egress (R2) | ~$0.00 |
| Email (one delivery) | $0.0001 (SES) – $0.0004 (Resend) |
| Turnstile | free |
| **Total** | **~$0.0005–0.001** |

So a million unlocks per month costs on the order of $500–1,000 in variable spend.
Comfortable at any plausible scale.

### 7.3 Fixed monthly platform costs

| Item | Early (0–100 customers) | At ~1,000 customers |
| --- | --- | --- |
| Vercel Pro (per seat) | $20 | $20–40 + usage |
| Postgres (Neon) | $0–19 | $69 |
| Object storage (R2) | ~$1 | ~$5–15 |
| Email | $0–20 | $50–200 (see §7.4) |
| Error monitoring (Sentry) | $0–29 | $29–80 |
| Product analytics | $0–20 | $20–50 |
| Domain, misc. | ~$5 | ~$10 |
| **Total** | **~$50–110/mo** | **~$200–450/mo** |

Infrastructure at 1,000 customers is roughly 2–4% of revenue. It is not the problem.

### 7.4 The costs that actually matter

**Payment processing takes a bigger bite than it looks.** Stripe at 2.9% + $0.30 on a
$12/mo subscription is $0.65 — **5.4%** — before Stripe Billing's recurring fee, +1.5%
on international cards, and ~1% currency conversion. For a worldwide audience of
artists, an effective 8–9% on small monthly charges is realistic.

Two mitigations, both worth taking:
- **Sell annually.** On $120/year the $0.30 fixed fee is 0.25% instead of 2.5%, taking
  the effective rate to roughly 3–4%. Annual billing also directly attacks the churn
  problem in §4.
- **Consider a merchant of record** (Paddle et al., ~5% + fixed) at least initially.
  It costs more per transaction but absorbs global VAT and sales-tax registration and
  filing, which for a solo operator selling into dozens of countries is otherwise a
  genuine and recurring administrative burden.

**Email is the sleeper.** Transactional delivery is trivially cheap. *Marketing
broadcasts to fan lists are not.* 1,000 artists with 5,000 fans each, sending twice a
month, is 10 million emails per month. Even at SES rates that is ~$1,000/month, and at
Resend-style pricing it is many times that. Worse, gate-collected lists are
low-engagement by construction, so sending them from shared IPs risks reputation damage
that degrades delivery for every customer at once.

Recommendation: **do not build a bulk email sender initially.** Ship transactional
delivery plus one-click export and native integrations (Mailchimp, Klaviyo, Beehiiv).
If broadcasting later becomes a paid feature, meter it explicitly and put it on
dedicated IPs.

**Support and your own time are the largest real costs.** Multi-tenant social
integrations generate tickets structurally: expired tokens, wrong redirect URIs,
"why didn't my follower count go up", refund requests. Budget roughly one ticket per
10–20 customers per month in steady state, with severe spikes whenever a platform
changes something — as SoundCloud did in June 2026 and Spotify did in July 2026. At
1,000 customers that is a part-time job that cannot be skipped, because responsiveness
is the only defensible advantage a small competitor has over an incumbent.

**One-off costs before launch:** business entity, DMCA agent registration, a lawyer
reviewing ToS/DPA/privacy policy, and a trademark check. Low four figures, and not
optional once you are hosting strangers' audio and their fans' personal data.

---

## 8. Pricing

### 8.1 Constraints to design within

- Hypeddit anchors the market at $10–20/mo, so that is the ceiling for a comparable
  feature list.
- Smart links cannot carry a price (Odesli and HyperFollow are free).
- Monthly churn is high, so annual billing is worth a real discount.
- Small monthly charges lose 5–9% to payment fees; annual loses 3–4%.
- A free tier is mandatory for distribution in this market — and safe only after the
  R2 migration.

### 8.2 Option A — Freemium subscription (recommended core)

| Tier | Price | Includes |
| --- | --- | --- |
| **Free** | $0 | 1 active gate, unlimited smart links, 250 unlocks/mo, 100 MB storage, platform branding, CSV export capped |
| **Artist** | **$9/mo or $84/yr** | Unlimited gates, 2,500 unlocks/mo, 2 GB storage, full export + integrations, no branding, Discord roles |
| **Pro** | **$19/mo or $180/yr** | 10,000 unlocks/mo, 20 GB, custom domain, pixels/CAPI, stem packs, paid downloads, fan CRM |
| **Label** | **$99–199/mo** | Multi-artist roster, seats, demo portal, remix contests, white-label, priority support |

Deliberate choices: undercut Basic by a dollar rather than racing to the bottom; put
the genuinely differentiated features (Discord, stems, CRM, paid downloads) on paid
tiers rather than competing on gate count; make the free tier generous on smart links
(they cost nothing) and tight on unlocks and storage (they cost something).

### 8.3 Option B — Usage-based

$0 base plus ~$0.01 per unlock. Aligns cost with value, monetises spikes, and lets
someone try it for free. But artists strongly prefer predictable pricing, a viral free
download becomes a surprise invoice, and it makes comparison against Hypeddit's flat
$10 look bad. **Not recommended as the primary model**; fine as overage on top of
Option A.

### 8.4 Option C — Transaction fee on commerce

Free tools, take 5–8% of paid downloads and tips. Zero adoption friction, scales with
customer success, monetises the large free tier, and — as noted in §6.1 — moves the
revenue away from "charging for promotional activities". Too slow on its own for a cold
start, but an excellent **second revenue line** alongside Option A.

### 8.5 Option D — Label / white-label deals

$199–499/mo, or annual contracts. Fewer, larger, stickier customers with far less
support overhead per dollar. See §6.4 — on a revenue-per-unit-of-effort basis this is
likely the strongest option in the document, and it is under-served because everyone
else is chasing individual artists.

### 8.6 Recommendation

**A + C + D, annual-first.** Freemium subscription as the funnel and the baseline
revenue, transaction fees on paid downloads as the line that grows without new
customers, and label deals as the disproportionate revenue. Lead with annual pricing
(displayed as the monthly equivalent, as Hypeddit and SoundCloud both do) to blunt
churn and payment fees at once.

Avoid lifetime deals. They are tempting for cold-start cash and they saddle you with
permanent support obligations from the least committed cohort you will ever have. If
used at all, cap them hard (e.g. 100 seats) and treat the proceeds as marketing spend.

---

## 9. Is it winnable?

### Genuine advantages

1. **Timing.** The incumbent's flagship feature is currently degraded. This will not
   stay true indefinitely.
2. **A working, compliance-aware implementation already exists**, with the awkward
   parts solved and documented. Most people attempting this start from zero and get the
   ToS reasoning wrong.
3. **Credibility and distribution.** You are an artist in the exact scene that uses
   download gates. Given that paid acquisition is economically closed (§4), being
   *inside* the target market is not a nice-to-have — it is the only viable channel.
4. **Speed and focus.** An incumbent serving every genre cannot ship Discord roles and
   remix-pack licensing for bass producers. You can.

### Genuine risks

1. **Stated policy is against the headline feature.** SoundCloud's own documents
   prohibit selling promotional services and reselling API access. This is the risk
   that does not go away, and it is why the product must not depend on that feature.
2. **Spotify is closed.** You will lose comparison-table checkboxes on pre-save with
   no way to win them back.
3. **Commodity pressure and a hard price ceiling** on two of the three headline
   features.
4. **Brutal churn** in a price-sensitive segment, with paid acquisition uneconomic.
5. **Trust.** Artists must upload unreleased music to an unknown operator. Overcoming
   that takes visible track record, which takes time.
6. **New liabilities:** DMCA, GDPR processor obligations, and being the custodian of
   other people's fan data.
7. **Opportunity cost.** This is a support-and-marketing business far more than a
   coding business. The engineering is the small part.

### Scenarios

| | Probability | Outcome |
| --- | --- | --- |
| **Bear** | ~50% | Under 200 paying customers, <$25k ARR. Churn outruns organic acquisition, or a platform change breaks the headline feature. Becomes a maintained side project or is wound down. |
| **Base** | ~35% | 400–1,200 paying customers, **$50–160k ARR**. Sustainable solo or two-person business on continuous content marketing and scene presence. Infra under 4% of revenue; time is the binding constraint. |
| **Bull** | ~15% | Convert the Hypeddit disruption into position, land 10–30 label accounts, 2,500+ paying artists. **$400–800k ARR**, small team, acquisition interest. Requires the SoundCloud question to resolve favourably. |

**Overall: a legitimate small business, not a large one.** The deciding variable is not
whether the software can be built — it can, and most of it already is. It is whether
you want to spend the next couple of years on customer support, content marketing, and
platform-policy risk management, which is what this business actually consists of.

### What would change the answer

- **Positive:** SoundCloud publishing a clear, permissive stance on gate tooling; or an
  early label deal proving the §6.4 thesis; or the Discord/stems angle turning out to
  pull customers on its own.
- **Negative:** SoundCloud restoring Hypeddit's access (the window closes); a
  SoundCloud enforcement action against you; or discovering during validation that
  artists want pre-save badly enough that its absence is disqualifying.

---

## 10. Suggested sequence

The ordering is deliberate: the cheapest way to be wrong is to find out before writing
multi-tenant code.

**Step 1 — Validate, before building (cheapest and most valuable).**
Talk to 20–30 artists and 5 labels in your own scene. Specifically test: would they pay
$9/mo; is missing Spotify pre-save disqualifying; do they care about Discord roles and
stem packs; would a label pay $199/mo for roster tooling and a demo portal. A landing
page with a waitlist costs nothing and answers the market question that no amount of
code can.

**Step 2 — De-risk the platform question in parallel.**
Ask SoundCloud directly, in writing, whether a multi-tenant gate tool using
customer-supplied credentials is acceptable. The worst case is no reply, which is
itself informative; a written answer either way is worth more than any amount of
speculation, including this document's.

**Step 3 — Fix what is broken regardless.**
The IDOR and the site-default leakage in §2 should be fixed whether or not the SaaS
happens. They are small changes and currently latent bugs.

**Step 4 — Only then, foundations.**
Tenancy, slug namespacing, real auth, R2 migration, abuse controls. Ship smart links
early since they are self-contained and expected.

**Step 5 — Lead with the safe, differentiated features.**
Email-first gating, fan CRM, Discord roles, stem delivery, paid downloads. Position
SoundCloud actions as an optional BYO-credentials extra — never the headline. That way
the next platform policy change is an inconvenience rather than an extinction event.

---

## Appendix: sources

- SoundCloud API Terms of Use — <https://developers.soundcloud.com/docs/api/terms-of-use>
- SoundCloud Terms of Use (09-2025), clause (v) on misrepresenting activity —
  <https://pages.soundcloud.com/geo/uk_us_ie/legal/terms-of-use/09-2025.std.html>
- SoundCloud Help Center, "Using or charging for Promotional Services" —
  <https://help.soundcloud.com/hc/en-us/articles/115003447767>
- SoundCloud self-serve API keys (18 May 2026) —
  <https://developers.soundcloud.com/blog/vibe-coding-ai-agent-docs-self-serve-api-keys/>
- Hypeddit API pause announcement — <https://hypeddit.com/news/a-change-to-soundcloud-download-gates/>
- SoundCloud response on third-party gate services — <https://github.com/soundcloud/api/issues/550>
- Spotify quota modes (5-user dev cap, 250k MAU for extended) —
  <https://developer.spotify.com/documentation/web-api/concepts/quota-modes>
- Spotify developer access update (Feb 2026) —
  <https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security>
- Spotify refresh token expiration (June 2026) —
  <https://developer.spotify.com/blog/2026-06-18-refresh-token-expiration>
- Spotify Developer Policy, artificial manipulation — <https://developer.spotify.com/policy>
- Hypeddit plans and pricing — <https://hypeddit.zendesk.com/hc/en-us/articles/360007224874-Plans-and-features>
- SoundCloud Artist Pro pricing — <https://soundcloud.com/getstarted/pricing>
- Odesli features — <https://odesli.co/pricing>
