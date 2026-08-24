# Targeting Laylo / ManyChat instead — market analysis and business assessment

Companion to [`saas-productization-analysis.md`](saas-productization-analysis.md), which
assessed competing with Hypeddit on download gates. This document assesses a different
target: **fan messaging and conversational marketing**, in the space occupied by Laylo
(music-specific "drop CRM") and ManyChat (horizontal Instagram DM automation).

Same four questions: is it buildable, is it winnable, what would it cost, what would it
be priced at.

---

## 1. Executive summary

**This is a better market than download gates, and a worse risk profile. Both facts
matter.**

Better, for three reasons that are individually verifiable:

1. **The platform door is open.** Meta's Instagram Messaging API requires business
   verification, Tech Provider access verification, and per-permission App Review — a
   bureaucratic slog, but there is **no minimum-scale requirement**. Compare Spotify,
   which now demands 250,000 MAU for extended quota and thereby locks new entrants out
   permanently. Meta will let you in if you do the paperwork. That is the single
   biggest structural difference between this option and the last one.
2. **The incumbent just evacuated the low end.** On 2 March 2026 ManyChat cut its free
   tier from 1,000 active contacts to **25** — a 97.5% reduction — and moved to
   $14/$29/$69/$139 tiers with per-contact overages. Every hobbyist and small creator
   running keyword campaigns on the free tier was displaced in a single day.
3. **ARPU is 2–3× higher.** Laylo anchors at $25/mo plus metered messaging; ManyChat
   Pro is $29/mo (annual) or $39/mo (monthly). Download gates anchor at $10–20/mo. Same
   customer, more money, because messaging is billed by usage rather than by seat.

Worse, for one reason that dominates everything:

> **You would be trading platform-policy risk for legal liability risk, and the legal
> tail is far worse.** If SoundCloud revokes an API key you lose a feature. If a
> customer uploads a scraped phone list to your SMS product, TCPA statutory damages are
> **$500 per message, trebled to $1,500 for willful conduct, with no cap** — a campaign
> touching 100,000 numbers is $50M of theoretical exposure. Courts have held a single
> unwanted text is a concrete injury.

The resolution is straightforward once stated: **launch Instagram DM and email. Do not
launch SMS.** That keeps the open-door platform advantage and the higher ARPU while
leaving the uncapped-damages statute alone. It also happens to be the highest-margin
configuration, because Meta charges nothing per Instagram DM while Laylo bills roughly
two cents for it.

**The wedge:** Laylo has messaging but no file fulfilment. This repo has file
fulfilment — entitlement checks, private storage, `authorizeDownload` — but no
messaging. The product neither of them offers is **"comment a keyword → get a DM →
receive an authenticated download → become a known fan on my list."** That is what a
download gate actually looks like in 2026, and it is a direct extension of code that
already exists here rather than a new business.

**Verdict:** more attractive than the Hypeddit option, and the better of the two if
either is pursued. Base case **$80–250k ARR**; the ceiling is higher than download
gates and the floor is similar. The deciding constraint is no longer platform
permission — it is Meta App Review, then distribution.

---

## 2. The two targets are not the same business

Worth separating, because "target Laylo or ManyChat" describes two different strategies.

| | **Laylo** | **ManyChat** |
| --- | --- | --- |
| What it is | "Drop CRM" for artists, festivals, creators | Horizontal chat marketing automation |
| Channels | SMS, email, Instagram DM | Instagram, Messenger, WhatsApp, (+SMS/email) |
| Vertical | Music/live events native | Ecommerce and creators generally; music-agnostic |
| Pricing | $25/mo + metered credits; unlimited contacts on Pro | $14 / $29 / $69 / $139 per month by contact count, plus overages |
| Free tier | 250 messaging credits/mo, unlimited contacts | **25 active contacts** (cut from 1,000 in March 2026) |
| Funding | Venture-backed, amount unverified | **$163.3M total**; $140M Series B led by Summit Partners, April 2025; reportedly profitable |
| Scale claim | "10,000+ creators", "$1B+ in tickets, merch and music" (self-reported) | Tens of thousands of businesses; global |
| Weak spot | No file fulfilment; thin SMS margins; niche | Hostile pricing model for spiky campaigns; no music context; complexity |

**Attacking ManyChat head-on is a bad idea.** A profitable company with $163M raised,
pushing hard into AI agents, is not the thing to fight on its own ground. But you do not
have to. ManyChat is horizontal, and it has just told its smallest users to pay up or
leave.

**Attacking Laylo head-on is a fairer fight but a narrower prize.** They are well
positioned for music already — unlimited contacts, drop-shaped workflows, IG DM
integration, Shopify app. Beating them requires a real product difference, not a
cheaper clone.

### The pricing asymmetry that creates the opening

ManyChat bills by **active contacts per month**. Music release campaigns are spiky by
nature: a producer drops a track, five thousand people comment the keyword in a week,
and then nothing for two months.

On ManyChat Pro that month costs $29 plus (5,000 − 2,500) × $0.05 = **$125 in
overages**, i.e. $154 for one campaign. The artist captured those fans once; the bill
scales with the size of the spike rather than with the value delivered.

This is a genuine structural mismatch between ManyChat's pricing model and how music
marketing works, and it is not something ManyChat can easily fix without undermining
its core ecommerce business, where contact counts grow steadily rather than in bursts.
Laylo already exploits this with unlimited contacts plus metered sends. Any entrant
should too.

---

## 3. Is it technically buildable? Mostly yes — with one rule that shapes the product

### 3.1 Getting access: open door, long corridor

To send Instagram DMs on behalf of other businesses you need advanced access to
`instagram_manage_messages` (plus `instagram_basic`, `pages_show_list`,
`pages_manage_metadata`, `business_management`, and the Business Asset User Profile
Access feature). Requirements:

- **Business verification** with Meta — legal documents proving the entity exists.
- **Access Verification as a Tech Provider.** Meta's docs are explicit: apps claimed by
  a business "cannot be used by other businesses" unless that business is verified as a
  Tech Provider. This is required for exactly the multi-tenant case, and it is separate
  from App Review.
- **App Review per permission** — a written justification, a screencast showing the
  end-to-end flow including how a customer connects their account, a privacy policy,
  terms of service, and a live environment with test credentials for reviewers.

Crucially, **there is no MAU floor, no revenue requirement, and no fee.** This is a
process you can complete, unlike Spotify's extended quota mode. Budget for rejection on
first submission — it is common, usually for an unclear screencast or a weak permission
justification — and note that repeated sloppy resubmissions can flag a developer
account. So the realistic path is one careful submission after the product genuinely
works, not an early speculative one.

Requiring a business entity and a real privacy policy before you can ship is also, in
practice, a moat against the lowest tier of competitor.

### 3.2 The 24-hour window: the rule that defines the product

Instagram messaging is stricter than Meta's other surfaces, and getting this wrong is
how tools lose access.

- **Standard window:** you may message a person only within **24 hours of their last
  message to you.** Promotional content is allowed inside it. Sends outside it fail
  (error code 10, subcode 2534022).
- **Message tags:** on Instagram, only `HUMAN_AGENT` is available (7 days) and it is
  documented for genuine human support, not automation. `ACCOUNT_UPDATE`,
  `CONFIRMED_EVENT_UPDATE` and `CUSTOMER_FEEDBACK` are not available for Instagram.
  Using `HUMAN_AGENT` for bot sends is a fast route to losing API access.
- **Sponsored Messages are not available for the Instagram Messaging API.**

Third-party blogs conclude from this that you simply cannot reach fans on Instagram
outside 24 hours. **That is wrong**, and the difference is the whole product. Meta's own
documentation describes **Marketing Messages** (formerly Recurring Notifications):

> "Marketing Messages allows a Facebook Page **or Instagram Professional Account** to
> send messages outside the standard messaging window for people who have given you
> permission to do so."

The mechanics, which dictate the data model:

1. Inside an open 24-hour window, send an opt-in request (`notification_messages`
   template) naming a **topic** and a frequency of `DAILY`, `WEEKLY`, or `MONTHLY`.
2. When the fan accepts, a `messaging_optin` webhook returns a
   **`notification_messages_token`** — you send future messages addressed to that token,
   not to the user ID.
3. Token lifetimes are tied to frequency: `DAILY` = one message per 24h for **6
   months**; `WEEKLY` = one per week for **9 months**; `MONTHLY` = one per month for
   **12 months**. Fans can stop or resume, and can re-opt-in after expiry.
4. Limits: one opt-in request per user per topic per week; from an Instagram
   Professional account, roughly 10 opt-in requests for different titles per user per 7
   days with a sub-limit of 5 per day.

So the compliant loop is:

```
fan comments keyword on a post
    → private reply opens the 24-hour window
    → deliver the download link (authenticated, entitlement-checked)
    → ask for a Marketing Messages opt-in ("new releases", MONTHLY)
    → send release-day notifications for up to 12 months
    → re-opt-in on expiry
```

That is a real, sanctioned, ownable audience channel. Three consequences worth
designing for rather than discovering:

- **Fan acquisition must start with a fan-initiated action.** Comment triggers, story
  replies, and ice-breakers are the entry points. There is no cold DM.
- **Lists decay and must be re-consented.** Structurally the same problem as Spotify's
  6-month refresh-token expiry, and it needs the same answer: track token expiry per
  fan, surface "X fans expiring this month", and prompt re-opt-in on the next inbound
  interaction. This is a feature, and it is one artists will not think to ask for.
- **The surface is not stable.** Meta ended Messenger's recurring-notifications API on
  10 February 2026 and replaced it with a new Marketing Messages API, and deprecated
  the `CONFIRMED_EVENT_UPDATE` tag in April 2026. Assume this changes again. Keep the
  channel behind an abstraction so a policy change is a module rewrite, not a rebuild.

### 3.3 SMS: buildable, and the reason not to

Technically routine. Legally and operationally, the worst part of the plan.

**Cost stack (US, Twilio as reference):** ~$0.0083 per outbound segment, plus carrier
surcharges of ~$0.003–$0.005 (AT&T ~$0.002–0.003, T-Mobile ~$0.003–0.005, Verizon
~$0.0025), giving a real cost of roughly **$0.011–$0.013 per SMS**. A2P 10DLC
registration adds a one-time brand fee ($4.50 sole proprietor / low volume, ~$44–48
standard including vetting), ~$15–17 per campaign, a $50 T-Mobile campaign activation,
and **$1.50–$10 per campaign per month** ongoing. Short codes are $1,000–1,500/month.

**Throughput is capped by registration tier**, which is the operational trap: a Sole
Proprietor brand is limited to ~1,000 segments/day to T-Mobile (~3,000 across carriers)
and Low Volume Standard to ~2,000 (~6,000 across). A platform sending on behalf of many
artists therefore needs per-artist brands and numbers — meaning per-artist registration
queues of 1–4 weeks, per-artist monthly fees, and rejections you have to support. And
"free download, click here" is precisely the content pattern carrier filtering targets.

**The legal exposure is the actual argument.** TCPA statutory damages are $500 per
message, trebled to $1,500 for willful or knowing conduct, **with no aggregate cap**, and
no need to show actual harm. One customer importing a purchased list can generate
class-action exposure in the millions. Related current state of the law:

- The FCC's one-to-one consent rule was **vacated** by the Eleventh Circuit in
  *Insurance Marketing Coalition v. FCC* (24 January 2025); the standard reverts to
  pre-2023 prior express written consent. Less onerous than it nearly became — but
  documented written consent is still required.
- Opt-outs must be honoured within 10 business days (FCC rule effective 11 April 2025).
- The "revocation applies to all" rule is delayed to 31 January 2027.

Email, by contrast, is governed by CAN-SPAM, which has no private right of action.
Instagram DM is governed by Meta policy, where the worst case is losing API access.

**Recommendation: ship DM + email. Treat SMS as a later, gated, opt-in module** — and
only with per-artist 10DLC registration, enforced double opt-in with timestamped and
IP-logged consent records, automated STOP handling, and a contractual indemnity. A
one-person company should not casually take on uncapped statutory damages driven by
customer behaviour it cannot observe.

---

## 4. Market analysis

### 4.1 Demand direction

The structural trend is favourable and is the reason both Laylo and ManyChat exist:
platform reach is unreliable and rented, so artists are moving budget toward channels
they own. Hypeddit is telling its own users exactly this after losing SoundCloud API
access — that "an email list or a Spotify save is harder for a platform to revoke than
an API connection." Comment-to-DM is now a mainstream creator tactic rather than a
growth-hack curiosity, and it is the highest-intent acquisition surface most artists
have: the fan has already engaged publicly before you ever message them.

### 4.2 Competitive set

| Player | Position | Threat level |
| --- | --- | --- |
| **Laylo** | Direct competitor, music-native, well positioned | **High** — the real fight |
| **ManyChat** | Horizontal, huge, funded, profitable | Medium — not music-specific, and retreating from the low end |
| **Hypeddit / Feature.fm** | Gates and smart links; adding messaging is plausible | Medium — adjacent, could expand into this |
| **Klaviyo / Attentive / Postscript** | Ecommerce SMS/email at scale | Low — priced and built for merchants, not artists |
| Beacons, Komi, Linktree | Link-in-bio with light messaging | Low |
| Community.com, Subtext, SuperPhone | Earlier artist-SMS generation | Low — this cohort largely struggled |

That last row deserves weight: artist-to-fan SMS has a graveyard. The economics are
thin (see §6), the compliance burden is heavy, and artists churn. The survivors —
Laylo — did it by making SMS one channel among several rather than the whole product.
Do not read "Laylo is doing fine" as "artist messaging is easy."

### 4.3 The displacement event

The single most actionable fact in this document: **ManyChat's free tier went from 1,000
active contacts to 25 on 2 March 2026.** Confirmed in ManyChat's own help
documentation, which describes the new pricing model and its gradual rollout to
pre-existing accounts country by country.

That rollout is still in progress, which means the displaced cohort is still being
created right now rather than having already resettled. These are, by definition,
price-sensitive users running low-volume keyword campaigns — which describes a great
many independent producers. They are actively looking for somewhere to go, and they
are reachable through exactly the kind of content and community presence an artist-
operator can produce.

A genuinely usable free tier is the entire acquisition strategy here, and — unlike the
download-gate business, where free users cost real egress money — a free tier in DM +
email is nearly costless to serve (§6).

---

## 5. What to build, and what already exists

The strategic point of this section: this is not a new product. It is a channel bolted
onto an engine that already works.

### Reusable as-is

| Asset | Role in the messaging product |
| --- | --- |
| `authorizeDownload` in `lib/gate-service.ts` | The fulfilment step at the end of a DM flow. Entitlement is already re-derived from the database rather than trusted from the client — exactly right when the request arrives from a DM link. |
| Private file delivery (`app/api/gate/[slug]/download/route.ts`) | Unchanged. This is the thing Laylo and ManyChat cannot do. |
| Email-as-identity, `(gate_id, lower(email))` | The seed of the multi-channel fan record. |
| `lib/crypto-utils.ts`, session sealing | Signed, expiring tokens for DM-delivered download links. |
| OAuth patterns in `lib/soundcloud-user-auth.ts` | Same shape as the Meta connect flow: signed state, encrypted token storage, refresh handling. |
| Gate step engine (`incompleteStep`, `GateProgress`) | Generalises into flow steps for a DM conversation. |
| Retention cron | Extends naturally to token-expiry sweeps and re-opt-in prompts. |

### New work

1. **Meta connect flow** — OAuth for Facebook Page + Instagram Professional account,
   token storage and refresh, webhook subscription per tenant.
2. **Webhook ingest** — comments, DMs, story replies, `messaging_optin` events, with
   signature verification, idempotency, and fast acknowledgement. This is the highest-
   risk component: it is realtime, it fans out across tenants, and duplicate handling
   bugs become duplicate DMs to real people.
3. **Flow engine** — keyword triggers, private replies, conditional steps, delivery of
   an authenticated link, then the opt-in request. Deliberately not a general-purpose
   visual bot builder; opinionated music templates instead (see below).
4. **Fan record, multi-channel** — one fan, several identities (email, IG-scoped ID,
   notification token per topic), consent state and provenance per channel, and token
   expiry tracking. This is the durable asset and should be designed first.
5. **Broadcast scheduler** — send to a topic's opted-in token set, respecting frequency
   caps, with per-fan send ledger for audit.
6. **Compliance surface** — consent logs, opt-out handling, per-tenant rate limiting,
   and hard enforcement of the 24-hour window in code so a customer cannot configure
   their way into a violation.
7. **Tenancy, billing, abuse controls** — as in the companion document §5, including the
   two latent bugs (missing ownership checks; site-wide WOMP defaults) that must be
   fixed before a second tenant exists.

### The opinionated templates are the product

Not a blank canvas. Pre-built, music-shaped flows: *free download* (comment → DM →
gated file → opt-in), *release day* (opt-in campaign → broadcast on drop), *remix pack*
(stems plus click-through licence acceptance), *demo submission*, *ticket presale*,
*Discord invite*. ManyChat can do any of these and none of them out of the box; that
gap — generic power versus a working flow in five minutes — is the whole value
proposition against a vastly better-resourced incumbent.

---

## 6. Costs and unit economics

The headline: **this is a structurally better-margin business than gated downloads**,
because Meta does not charge for Instagram messaging and email is nearly free, while
both can be billed like SMS.

### 6.1 Per-message margins

| Channel | Reference price (Laylo) | Marginal cost | Gross margin |
| --- | --- | --- | --- |
| **Instagram DM** | ~10 credits ≈ **$0.02** | **$0** — Meta charges no per-message fee for IG/Messenger messaging (unlike WhatsApp, which is per-conversation) | **~100%** |
| **Email** | $10 / 5,000 = **$0.002** | ~$0.0001 (Amazon SES) | **~95%** |
| **SMS (US)** | $10 / 650 = **$0.0154** | $0.011–0.013 all-in | **~15–30%** |

This table is the business case. Laylo prices an Instagram DM roughly the same as an
SMS while paying nothing to send it. SMS — the channel with the legal exposure, the
registration burden, and the carrier filtering — is also the only one with bad margins.
Declining to build SMS costs you a checkbox and protects both your margin and your
balance sheet.

### 6.2 Fixed monthly costs

Broadly unchanged from the companion analysis, and still not the constraint:

| Item | Early | ~1,000 customers |
| --- | --- | --- |
| Vercel Pro | $20 | $20–40 + usage |
| Postgres (Neon) | $0–19 | $69 |
| Object storage (R2, for delivered files) | ~$1 | ~$5–15 |
| Email (SES) | ~$1 | $20–100 |
| Redis / queue (webhook ingest, rate limiting) | $0–10 | $10–50 |
| Sentry, analytics | $0–50 | $50–130 |
| **Total** | **~$50–100/mo** | **~$200–400/mo** |

One genuine difference from the gate business: webhook ingest is realtime and bursty, so
a queue is not optional. When an artist with a large following posts, comment webhooks
arrive in a spike and every one of them may trigger a DM. Under-provisioning that path
produces the worst possible failure — duplicate or missing DMs to real fans.

### 6.3 What actually costs money

- **Meta App Review time**, including at least one rejection cycle, before you can
  onboard a single customer. This is a hard gate on revenue, not a background task.
- **Support**, and more than the gate business had. Symptoms are realtime and
  channel-specific: "my keyword didn't trigger", "the DM went to the wrong person",
  "my token expired". Every failure is visible to the artist's audience, which raises
  the emotional stakes of each ticket.
- **On-call sensitivity.** A broken gate is an inconvenience. A broken DM flow during a
  release is a customer's launch day. Expectations are higher and less forgiving.
- **Storage and egress** for delivered files — solved the same way as before: Cloudflare
  R2 with short-TTL presigned URLs, which is what makes a free tier safe.

Infrastructure lands around 2–3% of revenue. Your time is the binding constraint, as
before.

---

## 7. Pricing

### Design constraints

- ManyChat: $14 / $29 / $69 / $139 per month by contact count, plus $0.018–$0.10
  per-contact overages, plus a ~$29/mo AI add-on. Free tier is now 25 contacts.
- Laylo: $25/mo plus metered credits; unlimited contacts; 250 free credits/mo.
- Per-active-contact pricing is actively wrong for spiky release campaigns (§2).
- Instagram DM and email cost nothing meaningful to send, so metered messaging is
  almost pure margin — and a generous free tier is nearly free to provide.

### Recommended structure

**Unlimited contacts, metered messages, flat feature tiers.** Copy Laylo's shape
(because it fits music) and beat ManyChat's (because per-contact pricing punishes
exactly your customer's usage pattern).

| Tier | Price | Includes |
| --- | --- | --- |
| **Free** | $0 | Unlimited fans, 1 active flow, 500 DMs + 2,000 emails/mo, gated file delivery, branding on pages |
| **Artist** | **$19/mo or $180/yr** | Unlimited flows, 5,000 DMs + 25,000 emails/mo, no branding, all music templates, fan CRM, Discord |
| **Pro** | **$39/mo or $360/yr** | 25,000 DMs + 150,000 emails, custom domain, pixels/CAPI, stem packs with licence capture, paid downloads, API |
| **Label** | **$149–399/mo** | Multi-artist roster, seats, demo portal, white-label, priority support |
| Overage | — | $0.004/DM, $0.0005/email — roughly 4–5× cost, far below Laylo's ~$0.02/DM |

The deliberate choices:

- **Undercut on messaging, not on subscription.** Laylo's ~$0.02 per DM has ~100%
  margin. Charging $0.004 is still a 4–5× markup, reads as dramatically cheaper on any
  comparison, and remains highly profitable. Compete where the incumbent's margin is
  fat, not where it is thin.
- **A real free tier**, because it costs almost nothing and it is the entire strategy
  for capturing ManyChat's displaced users. 500 DMs a month is a genuinely useful
  campaign, not a 25-contact trial.
- **Unlimited fans on every tier**, including free. This is the anti-ManyChat message
  and it is cheap to promise, since a stored fan row costs a fraction of a cent per
  year.
- **Annual-first**, for the churn and payment-fee reasons in the companion document.
- **No SMS line item**, and say why in the marketing. "We don't do SMS because doing it
  responsibly costs more than it's worth to you" is a credible, differentiating
  position with artists who have been burned by carrier filtering — and it converts a
  missing feature into a trust signal.

---

## 8. Feasibility verdict

### Compared with the download-gate option

| | Download gates (Hypeddit) | Fan messaging (Laylo / ManyChat) |
| --- | --- | --- |
| Platform access | SoundCloud discretionary; Spotify closed | **Meta open via App Review** |
| Stated policy risk | **High** — selling promo services prohibited | Low — DM automation is a sanctioned, documented use case |
| Legal exposure | Moderate (DMCA, GDPR) | **High if SMS; moderate if DM + email** |
| ARPU | $10–20/mo | **$19–39/mo + metered** |
| Gross margin | Good after R2 migration | **Better — near-zero marginal send cost** |
| Free tier cost | Dangerous (egress) | **Negligible** |
| Incumbent posture | Wounded but entrenched | **Retreating from the low end** |
| Build cost from here | Low | Moderate — webhooks, flows, Meta review |
| Time to first revenue | Fast | Slower — App Review gates everything |

On balance this is the stronger option. The risk that made the gate business
structurally unattractive — the core feature being against the platform's published
policy — does not have an equivalent here, provided SMS is left alone.

### Scenarios

| | Probability | Outcome |
| --- | --- | --- |
| **Bear** | ~40% | Meta App Review drags or is repeatedly rejected; or the product ships but Laylo's head start and ManyChat's brand hold. Under 300 paying customers, <$40k ARR. |
| **Base** | ~40% | Capture a slice of ManyChat's displaced free tier plus organic scene distribution. 600–1,500 paying customers at ~$25 blended, **$80–250k ARR**. Sustainable one-to-two person business. |
| **Bull** | ~20% | The DM-native file delivery wedge proves genuinely unique, label tier lands, metered messaging lifts blended ARPU past $40. **$400k–1M ARR**, small team, plausible acquisition interest from Hypeddit or a distributor. |

Higher ceiling and a comparable floor versus the gate business, mainly because metered
messaging means revenue grows with customer success rather than only with customer
count.

### What would change the answer

- **Positive:** App Review approved on first or second attempt; ManyChat's migration
  displacing more users than expected; a label paying for roster tooling; the file-
  delivery wedge pulling customers on its own.
- **Negative:** Meta tightening Marketing Messages the way it tightened Messenger in
  February 2026 (this is the analogue of the SoundCloud risk, and it is real); Laylo
  shipping gated file delivery; or App Review rejecting the use case outright, which
  would be a hard stop.

### The honest caveat

Every advantage listed above is an advantage in *positioning*, and positioning is worth
nothing without distribution. Being an artist inside the scene remains the only
acquisition channel that works at this price point, exactly as in the companion
analysis. The technical case here is stronger than the download-gate case; the go-to-
market case is identical, and it is still the harder half.

---

## 9. Recommended sequence

Order chosen so that the two things most likely to kill the project — Meta's review and
customer indifference — are tested before significant code is written.

1. **Validate the wedge, not the category.** Ask 20–30 producers a specific question:
   *do you already run comment-to-DM for free downloads, what with, and what breaks?*
   If most say "I've never tried it", the wedge is education rather than product, which
   is a different and slower business. Ask 5 labels about roster tooling.
2. **Start Meta business verification immediately.** It gates everything, it is
   independent of product work, and it is pure waiting. Begin now regardless of what
   else is decided.
3. **Prototype the loop single-tenant, on your own account.** Comment trigger → private
   reply → authenticated download → Marketing Messages opt-in → release broadcast. This
   is also, conveniently, a genuine marketing channel for WOMP, so the work has value
   even if the SaaS never ships. Standard access on your own account is enough for this.
4. **Fix the tenancy blockers** (companion doc §2 and §5): ownership checks, per-tenant
   defaults, R2 migration, abuse controls.
5. **Submit for App Review** with a working product and a careful screencast. Assume one
   rejection.
6. **Launch DM + email only.** Aim explicitly at displaced ManyChat free-tier users with
   a genuinely usable free tier and music-shaped templates.
7. **Revisit SMS only when there is a customer base worth the risk**, and only with
   per-artist 10DLC registration, enforced double opt-in, and legal review.

Step 3 is the one to weight most heavily. It is small, it produces value for the artist
project on its own terms, and it answers the question no amount of research can: whether
the flow actually converts fans in this specific scene.

---

## Appendix: sources

**Meta / Instagram messaging**
- Messenger Platform and IG Messaging API policy — <https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy>
- Marketing Messages (recurring notifications) — <https://developers.facebook.com/docs/messenger-platform/marketing-messages/>
- Product template for Instagram Messaging (opt-in requests, frequency enums) — <https://developers.facebook.com/docs/messenger-platform/instagram/features/product-template/>
- `messaging_optins` webhook reference (token lifetimes, stop/resume) — <https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_optins/>
- Tech Providers — <https://developers.facebook.com/docs/development/release/tech-providers/>
- Access Verification — <https://developers.facebook.com/docs/development/release/access-verification/>
- End of Messenger recurring marketing messages, 10 Feb 2026 — <https://www.socialmediatoday.com/news/metas-recurring-marketing-messages-api-will-end-this-week/811668/>

**Competitors**
- Laylo pricing and channels — <https://laylo.com/music>, <https://apps.shopify.com/laylo>
- ManyChat Pro plan, March 2026 pricing model — <https://help.manychat.com/hc/en-us/articles/25800228332572-Pro-plan>
- ManyChat $140M Series B, April 2025 — <https://www.summitpartners.com/news/manychat-raises-140m-to-fuel-the-future-of-ai-driven-customer-engagement-on-social-and-messaging-platforms>
- ManyChat funding history — <https://www.cbinsights.com/company/manychat/financials>

**SMS cost and law**
- Twilio A2P 10DLC compliance and throughput tiers — <https://www.twilio.com/docs/messaging/compliance/a2p-10dlc>
- Twilio 10DLC brand fees — <https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand>
- Eleventh Circuit vacates one-to-one consent rule — <https://www.venable.com/insights/publications/2025/01/eleventh-circuit-overrules-fccs-one-to-one>, <https://www.wiley.law/alert-UPDATE-11th-Circuit-Vacates-FCCs-One-to-One-TCPA-Consent-Rule>
- TCPA damages and current posture — <https://www.huschblackwell.com/newsandinsights/fcc-delaysthen-eleventh-circuit-defenestratesnew-tcpa-requirements-for-prior-express-written-consent>, <https://www.rumberger.com/insights/unwanted-text-messages-causing-a-state-federal-litigation-divide/>

**Unverified / self-reported**
- Laylo's "10,000+ creators" and "$1B+ in tickets, merch and music" are Laylo marketing
  claims, not independently confirmed.
- Laylo's funding history could not be verified and is deliberately omitted.
- Per-credit channel costs on Laylo ($0.002/email, ~$0.0154/SMS, 10 credits/IG DM) come
  from Laylo's Shopify App Store listing plus secondary comparison sites; the secondary
  sites appear to be SEO content and their finer details should be re-checked before
  use in a model.
- Several Instagram-limit articles surfaced in research are competitor marketing blogs
  and contradict Meta's own documentation on whether promotional messaging outside 24
  hours is possible. Meta's docs were treated as authoritative throughout.
