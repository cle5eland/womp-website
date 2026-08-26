# Fan-messaging SaaS — market and technical feasibility research

Research backing for [`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md).
All facts below were gathered on **24 August 2026**. Every claim carries a source URL and a
source-quality label:

- **[PRIMARY]** — the platform's, vendor's, court's, or regulator's own document.
- **[SECONDARY]** — reputable third party (law firm alert, national press, review aggregator).
- **[WEAK]** — competitor blog, affiliate page, or SEO/AI-generated content. Directionally
  useful at best. Treat every number as unverified.
- **[UNVERIFIED]** / **[CONTRADICTED]** — claims that circulate widely but that I could not
  substantiate, or that conflict with a primary source.

A note on the source landscape, because it shaped this research: the query "Instagram DM
automation rules 2026" returns an almost unbroken wall of AI-generated content marketing
published by ManyChat competitors — `creatorflow.so`, `dmlinkr.com`, `creatorlanehq.com`,
`igmsg.com`, `heyregent.com`, `keyapi.ai`, `sumgenius.ai`, `replyrush.com`, `postengage.ai`,
`communipass.com`, `hooka.to`, `instantdm.com`, `sociahive.com`, `inflowave.io`. These pages
cite Meta docs by name, invent plausible-looking statistics, and cross-cite each other. At
least one widely repeated number (§2.7) appears to be fabricated. Everything material in
this document was re-verified against `developers.facebook.com`, vendor pricing pages, or
court and FCC documents.

---

## Part 1 — ManyChat

### 1.1 Pricing (current model, introduced 2 March 2026)

ManyChat replaced its old pricing with an **Active Contacts** model on 2 March 2026. An
Active Contact is a person the account interacts with through DMs or automations during a
billing month, counted once regardless of message volume. **[PRIMARY]**

| Plan | Monthly | Annual (per mo) | Active Contacts | Overage / extra contact (monthly / annual) |
| --- | --- | --- | --- | --- |
| Free | $0 | — | 25 | not available |
| Essential | $17 | $14 (18% off) | 250 | $0.10 / $0.082 |
| Pro | $39 | $29 (25% off) | 2,500 | $0.05 / $0.038 |
| Business | $99 | $69 (30% off) | 7,500 | $0.025 / $0.018 |
| Advanced | $199 | $139 (30% off) | 25,000 | "custom" |

Sources: <https://help.manychat.com/hc/en-us/articles/25800228332572-Pro-plan>,
<https://help.manychat.com/hc/en-us/articles/25800347122716-Manychat-subscription-How-to-choose-the-right-one-for-you>,
<https://help.manychat.com/hc/en-us/articles/25800323349020-Active-Contacts> **[PRIMARY]**

Caveats worth carrying forward:

- **Advanced overage is documented as "custom pricing"** on ManyChat's own help centre.
  A widely copied figure of $0.004/$0.0028 appears only on affiliate pages. **[WEAK]**
- **The new pricing is not universal yet.** By default it applies to accounts created on
  or after 2 March 2026; ManyChat is migrating older accounts country by country. Legacy
  accounts are still on old plans, so competitive comparisons against "ManyChat's price"
  are ambiguous depending on which cohort a prospect sits in. **[PRIMARY]**
- **The free tier collapsed from 1,000 Active Contacts to 25** — a 97.5% cut. This is
  the single most exploitable fact in the whole profile and it is confirmed by ManyChat's
  own documentation of the 25-contact free plan.

**Feature gating by tier** (from ManyChat's pricing page and help centre):
Free and Essential allow 2 eligible channels (from Instagram, TikTok, Messenger,
Telegram); Pro allows 3 and unlocks WhatsApp, SMS, Email, AI-powered automation,
broadcasts, and API access; Business and Advanced allow all eligible channels. Email
sending caps are 10k / 30k / 100k across the higher tiers. Free plan messages carry a
"Powered by ManyChat" watermark on the first message to a contact.
<https://manychat.com/pricing> **[PRIMARY]**

### 1.2 Channels in 2026

Instagram, Facebook Messenger, TikTok, Telegram, WhatsApp, SMS, Email.
<https://manychat.com/pricing> **[PRIMARY]**

TikTok is supported but requires a **TikTok Business Account** — creator and personal
accounts are excluded — and is unavailable in some regions. **[WEAK on the region detail;
consistent with TikTok's own EEA/UK/Switzerland restriction documented in §4.]**

AI: "Manychat AI" launched in 2024 and per the company's own funding release is "already
used by tens of thousands of creators and businesses."
<https://manychat.com/blog/manychat-raises-140m/> **[PRIMARY]**

### 1.3 Funding — correcting the premise

**Your recollection is close but the year is wrong.** The Summit Partners round was
announced **22 April 2025**, not 2024.

- **$140M** growth round **led by Summit Partners**, announced 22 April 2025.
- Brings **total funding to $163.3M** since founding in 2015.
- First institutional round was **$18M in 2019 from Bessemer Venture Partners**.
- TechCrunch characterises the $140M as a **Series B**; PitchBook put the Series A
  post-money valuation at **$58M**. No valuation disclosed for the 2025 round.
- Sophia Popova (Summit Partners) joined the board.
- The company describes itself as **already profitable**.

Sources: <https://www.summitpartners.com/news/manychat-raises-140m-to-fuel-the-future-of-ai-driven-customer-engagement-on-social-and-messaging-platforms>,
<https://www.prnewswire.com/news-releases/manychat-raises-140m-to-fuel-the-future-of-ai-driven-customer-engagement-on-social-and-messaging-platforms-302433976.html>,
<https://manychat.com/blog/manychat-raises-140m/> **[PRIMARY]**;
<https://techcrunch.com/2025/04/22/manychat-taps-140m-to-boost-its-business-messaging-platform-with-ai/>,
<https://www.bloomberg.com/news/articles/2025-04-22/social-media-marketing-startup-manychat-raises-140-million> **[SECONDARY]**

### 1.4 Scale

| Metric | Figure | Source quality |
| --- | --- | --- |
| Businesses served | **1M+ across 170+ countries** | **[PRIMARY]** — ManyChat blog + PR |
| Instagram accounts | "over 100,000" | **[PRIMARY]** but from an undated ManyChat blog post; likely stale given 1M+ total |
| Messages | "billions per year" | **[PRIMARY]**, unaudited |
| Employees | **435** (Q1 2026), up from 169 in 2023 | **[SECONDARY]** — Revelio Labs workforce data |
| Employees | ~560 (July 2026) | **[SECONDARY]** — LeadIQ |
| Revenue / ARR | **no reliable figure** | see below |

Employee estimates disagree by ~30% and neither is company-confirmed. Revenue is worse:
LeadIQ shows a "$250M–$500M" band, other data brokers show $60–73M, and these cannot both
be true. **Treat ManyChat's revenue as unknown.** For modelling purposes the only
defensible anchor is the arithmetic: 1M+ businesses at a $14–29 modal price point with a
large free/inactive tail implies mid-tens to low-hundreds of millions, which is a range so
wide it is not decision-useful. **[UNVERIFIED]**

<https://www.reveliolabs.com/companies/manychat/employees>,
<https://leadiq.com/c/manychat/5aba69c8520000580148b181>

Headquarters is also inconsistently reported — Palo Alto (2025 PR), Austin (LeadIQ), San
Francisco (Revelio). The PR release is the best source: **Palo Alto, CA**, with a
distributed team.

### 1.5 Meta Business Partner status — and what it does *not* confer

ManyChat is an **Official Meta Business Partner** and also a TikTok partner; it says so on
its own pricing page. <https://manychat.com/pricing> **[PRIMARY]**

The important finding is what the badge is worth, and ManyChat itself is refreshingly
blunt about this:

> "Our partnership with Meta means we work directly with Instagram's official APIs...
> **But — and it's a big but — we don't control Meta's rules or have a hotline to
> reinstate accounts.**... We can't reverse bans or account restrictions — Meta holds
> that power, not us. We can't override their spam detection system, even if you use
> Manychat properly."

It does claim one concrete benefit: "As an official Meta Business Partner, we meet with
their product team weekly."
<https://manychat.com/blog/manychat-official-meta-business-partner/> **[PRIMARY]**

Generally, the programme has two tiers — Member (resources, no badge) and **Badged**
(badge, public directory listing, priority/live-chat support, early feature access).
Eligibility is assessed per specialty on integration quality, real messaging volume, and
policy compliance. It cannot be bought. **[SECONDARY / WEAK — this is described
consistently across many partner-agency blogs but I could not retrieve Meta's own
programme criteria page.]**

**Assessment for a new entrant:** Business Partner status is a *marketing* asset, not an
*access* asset. It does not gate the API — App Review and Tech Provider verification do
(§2). You can ship a fully functional Instagram DM product without it. Do not model it as
a barrier to entry; do model it as a trust signal you will lack at launch.

### 1.6 What users complain about

Review-aggregator split is the tell:

| Source | Score | Reviews | As of |
| --- | --- | --- | --- |
| G2 | 4.5–4.6 / 5 | ~150–165 | Aug 2026 |
| Capterra | 4.6 / 5 | 72 | May 2026 |
| Trustpilot | **2.9 / 5** | 250 | page updated 12 Mar 2026 |

<https://www.g2.com/compare/manychat-vs-omnichat>,
<https://www.trustpilot.com/review/manychat.com> **[PRIMARY/SECONDARY]**

G2 and Capterra capture product reviewers (positive on the flow builder and automation).
Trustpilot captures customer-service experiences (negative). Capterra's own sub-ratings
show the same fault line: Ease of Use 4.4, Value for Money 4.2, **Customer Service 4.0 —
its lowest dimension**.

Trustpilot's own auto-generated summary of the 250 reviews names the themes directly:
"some people were dissatisfied with the customer service, describing it as non-existent or
unhelpful, particularly when facing billing issues or technical problems. Several
customers reported billing issues... There were also complaints about... bugs, difficulties
logging in, or issues with the app's connectivity to social media platforms."
**[PRIMARY]** Trustpilot also flags that ManyChat **"hasn't replied to negative reviews."**

Recurring complaints, in rough order of frequency:

1. **The billing model punishes the thing customers are optimising for.** Comment-to-DM
   funnels exist to maximise DM entries; DM entries are the billed unit. A viral Reel is
   simultaneously your best month and your most expensive month.
2. **Silent tier upgrades / overages.** Multiple reviewers report discovering higher
   charges on a card statement rather than via email warning.
3. **Charges after cancellation, and refund denials.**
4. **Support quality**, especially on lower tiers.
5. **Instagram connection instability and account suspensions.**
6. **Too complex** for users who want simple auto-replies.

Caveat: much of the *aggregation* of these complaints appears on competitor blogs
**[WEAK]**, and specific quoted Reddit posts could not be individually verified. But the
themes are corroborated by the Trustpilot 2.9/250 distribution and Capterra's
customer-service sub-rating, which are primary. The direction is solid; treat individual
anecdotes as illustrative rather than evidentiary.

### 1.7 2025–26 events

- **2 March 2026** — pricing restructure to Active Contacts; free tier cut to 25.
  **[PRIMARY]**
- **Meta-dependency outages** (from ManyChat's own status page — this is the most
  operationally interesting finding in the section):
  - **22 July 2026** — "Messaging on Meta platforms is partially down (FB/IG/WA)",
    classified **major outage**, **~10 hours** (14:08 → 00:06 UTC).
  - **19 July 2026** — degraded performance, ~1.5 hours. ManyChat advised customers to
    "pause paid ad campaigns that drive traffic into Instagram/Messenger/WhatsApp
    automations... to avoid paying for clicks that may not convert."
  - **23 June 2026** — two incidents, ~25m and ~45m.
  - **12 June 2026** — ~1h55m down plus ~3h25m degraded.
  - StatusGator has logged **297+ outages** affecting ManyChat's Instagram API component
    since May 2019.

  <https://status.manychat.com/history/1>, <https://statusgator.com/services/manychat/3rd-party-instagram-api>
  **[PRIMARY]**

  Every one of these was a **Meta-side** failure, not a ManyChat failure. That is the
  point: this is the shared, unavoidable risk of the entire category, and it lands on you
  identically. Build the status page and the customer-comms playbook on day one.

- **[UNVERIFIED]** "Meta suspended over 10 million Instagram accounts in 2026 and swept up
  legitimate creators." Appears on competitor blogs; no primary or press confirmation
  found.

---

## Part 2 — Meta / Instagram Messaging API access for a new entrant

**This is the section you asked me to be rigorous on, so the headline first:**

> **This is not a Spotify-style wall. There is no minimum-scale, MAU, or volume
> eligibility bar anywhere in Meta's documentation for Instagram messaging permissions.**
> It is a genuine bureaucratic gauntlet — three sequential approvals, per-permission
> screencasts, an annual security questionnaire, and annual re-certification — but it is
> a gauntlet any legitimately incorporated, verifiable business with a working product can
> complete. The gate is *effort and ongoing compliance*, not *size*.

The caveat that matters more than the gate itself: **the out-of-window promotional path is
closed to new entrants** (§2.6). That is the real structural disadvantage, and it is
easy to miss.

### 2.1 Which API, and which permissions

Meta offers two configurations and **an app must use one or the other, not both**:

| | Instagram API with **Instagram Login** | Instagram API with **Facebook Login** |
| --- | --- | --- |
| Host | `graph.instagram.com` | `graph.facebook.com` |
| Auth | Business Login for Instagram | Facebook Login for Business |
| User logs in with | Instagram credentials | Facebook credentials |
| Requires linked FB Page | No | **Yes** |
| Messaging | Native | via Messenger Platform |
| Hashtag search / product tagging / Partnership Ads | No | Yes |

<https://developers.facebook.com/docs/instagram-platform/overview> (updated **30 June
2026**) **[PRIMARY]**

**Permissions you need for the two jobs you named:**

*(a) Reading Instagram comments on a business's posts, and (b) sending DMs on their behalf:*

- **Instagram Login path:** `instagram_business_basic`,
  `instagram_business_manage_comments`, `instagram_business_manage_messages`,
  plus the **Human Agent** feature.
- **Facebook Login path:** `instagram_basic`, `instagram_manage_comments`,
  `instagram_manage_messages`, `pages_show_list`, `pages_read_engagement`,
  plus **Human Agent**. (`business_management` is additionally required for some
  Marketing-Messages flows — see §2.6.)

Comment reads use `GET /<IG_MEDIA_ID>/comments` (max 50 per query, reverse-chronological,
top-level only unless you expand `replies`, cannot filter by timestamp — **use the
`comments` webhook instead, Meta explicitly recommends this to avoid rate limiting**).
DM sends use `POST /<IG_ID>/messages`.

<https://developers.facebook.com/docs/instagram-platform/comment-moderation>,
<https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api> (updated **6 May 2026**, Graph API v26.0) **[PRIMARY]**

**One trap worth flagging.** Meta's overview page states that if reviewers cannot test your
app "because it is behind a private intranet, has no user interface, or has not implemented
Facebook Login for Business, you can request approval **only** for `instagram_basic` and
`instagram_manage_comments`." Messaging is *not* on that list. A headless or
API-only product cannot get messaging permissions — **you must ship a reviewable web UI
with a real login flow.** Relatedly, "Web or mobile Web is the only platform that currently
supports Instagram API with Instagram Login." **[PRIMARY]**

### 2.2 Advanced Access — the three gates

Standard Access only covers accounts you own or have added to your app in the dashboard.
Serving other people's Instagram accounts requires **Advanced Access**, which requires
**App Review** *and* **Business Verification**. Separately and independently, acting as a
multi-tenant provider requires **Tech Provider access verification**. **[PRIMARY]**

**Gate 1 — Business Verification.** Connect the app to a Meta Business, then complete
verification in Business Manager (legal entity documents, business details). Only a
Business *Admin* can complete it. Required as of 1 February 2023 for any app requesting
advanced permissions or used by app users outside your own Business.
<https://developers.facebook.com/docs/development/release/business-verification> **[PRIMARY]**

**Gate 2 — Tech Provider access verification.** This is the one people miss, and Meta is
explicit that it is **"independent of App Review and permission access levels."**

- **Who needs it:** "Any business that has created or claimed an app that will be used by
  other businesses and requires any of the permissions listed below."
- **The listed permissions include** `instagram_basic`, `instagram_business_basic`,
  `business_management`, `pages_show_list`, `pages_read_engagement`,
  `instagram_manage_insights`, `instagram_content_publish`, `ads_management`, and others.
  **Note the nuance:** `instagram_manage_messages` and `instagram_manage_comments` are
  *not themselves* on the list — but `instagram_basic` / `instagram_business_basic` are,
  and every DM product needs one of those. **So in practice Tech Provider verification is
  mandatory for this product.**
- **Prerequisites:** Business Verification complete, and no restrictions on the business
  account.
- **What you submit:** a Business Admin must "categorize and describe how the business
  uses other businesses' data to provide a service for those businesses." Accessible from
  App Dashboard → Basics → Verifications → Access verification.
- **Decision time: ~5 days.** One-time — "Verified businesses won't have to verify
  again," and once verified, *any* app that business claims passes the check.
- **Failure mode:** calls from users without a role on your app return **error code
  100**, "Unsupported get request." Silent-ish and easy to misdiagnose.
- **You can lose it** if the business becomes unverified, the app is disconnected from the
  claiming business, or the business account becomes restricted. It auto-restores when the
  condition is reversed.
- Existing businesses given notice have **60 days** before verification checks phase in.

<https://developers.facebook.com/docs/development/release/access-verification> **[PRIMARY]**

**Gate 3 — App Review, per permission.** Meta's own scenario table is unambiguous:
"I am a Tech Provider and my app serves multiple businesses" → Advanced Access → **App
Review Required**, on both login paths.

Concrete requirements:

- **A separate submission per permission**, each with (i) a written description of how
  your app uses *that specific* permission and (ii) **a screencast showing the end-to-end
  user experience for that specific permission**. If a permission depends on another, both
  must be in the submission.
- **"To request Advanced Access to certain permissions, you need to make at least 1
  successful API call"** — so you must build and exercise the integration under Standard
  Access before you can ask for Advanced.
- Confirm the app **can be loaded and tested externally**; the login button must be
  visible in app and screencast and follow brand guidelines.
- **Step-by-step reviewer instructions** per platform, plus test credentials if needed.
- App settings: **1024×1024 icon**, **Privacy Policy URL**, App Category, Business Email.
- **Data Deletion Callback URL or Data Deletion Instructions URL.**
- Screencasts should be in English or captioned; explain non-obvious UI.
- Explicit warning: "If you request permissions or features that your app does not use or
  does not align with the allowed usage for that permission or feature, your submission
  will not be approved."

<https://developers.facebook.com/docs/instagram-platform/app-review> (updated **30 June
2026**) **[PRIMARY]**

**Cost:** Meta documents **no fee** for Business Verification, Tech Provider verification,
or App Review. Contrast with A2P 10DLC, which has hard registry fees (§5.1). The cost here
is engineering and calendar time, not licence fees.

### 2.3 Ongoing obligations — the part that is easy to under-budget

| Obligation | Cadence | Detail |
| --- | --- | --- |
| **Data Protection Assessment (DPA)** | **Annual** | Questionnaire on how you use, share, and protect Platform Data. **60 days to complete or risk losing platform access.** Meta: "Providing incomplete or vague answers may result in loss of platform access," and recommends involving legal, policy, and security staff. |
| **Data Use Checkup (DUC)** | **Annual** | Certify continued compliance with Platform Terms and Developer Policies. |
| **Product Use Checkup** | **Annual** | Recertify any products requiring Product Use Certification. |
| **Inactive-app rule** | Rolling 90 days | No logins, no API calls, and no webhooks for 90 days → **all access tokens invalidated**, API access blocked. Permissions removed during inactivity **must be re-approved through App Review**. |

<https://developers.facebook.com/docs/development/maintaining-data-access/>,
<https://developers.facebook.com/docs/development/maintaining-data-access/data-protection-assessment> **[PRIMARY]**

Also relevant to architecture: long-lived access tokens are valid **60 days** and must be
refreshed; authorization codes and short-lived tokens expire in **1 hour**. Token refresh
is not optional infrastructure.

### 2.4 Is there a hard eligibility bar like Spotify's 250,000 MAU?

**No.** I searched Meta's Instagram Platform overview, App Review, Access Verification,
Business Verification, Access Levels, and Messenger Platform policy documentation. There
is **no user-count, MAU, revenue, volume, funding, company-age, or headcount threshold**
anywhere in the Instagram messaging permission path.

The qualitative bars are:

1. A verifiable legal business entity (Business Verification).
2. A defensible multi-tenant use case description (Tech Provider verification).
3. A working, externally testable product with a real UI and login (App Review).
4. Willingness to answer a security questionnaire annually (DPA) and re-certify (DUC).

That is a materially different structure from Spotify's, where the gate is a number you
cannot reach without already having the access. **Meta's gate is passable on day one by a
two-person company with a working demo.** The honest counterweight: rejection is common
and iterative, screencast quality genuinely matters, and there is no SLA on approval — so
plan for multiple review cycles rather than one.

### 2.5 Messaging windows, tags, and rate limits

**The 24-hour standard messaging window.** From Meta's own policy page (updated **6 April
2026**):

> "Standard Messaging — Businesses have up to 24 hours to respond to a user. **Messages
> sent within the 24-hour window may contain promotional content.**"

Critically for Instagram: **"Conversations only begin when an Instagram user sends a
message to your app user."** You cannot initiate. The clock resets each time the user
messages again.

**Escalation paths outside 24 hours — and which ones Instagram actually has:**

| Mechanism | Messenger | **Instagram** | Notes |
| --- | --- | --- | --- |
| Reply inside 24h | Yes | **Yes** | Promotional content allowed |
| **Human Agent tag** | Yes | **Yes** | **7 days** from the user's message. Allowed usage is genuine human support ("business closed for the weekend," issue needs >24h). Requires the Human Agent feature via App Review. |
| **Private replies to comments** | Yes | **Yes** | **One message per comment**, within **7 days** of the comment. Instagram Live: only during the broadcast. Follow-ups only if the recipient responds, and within 24h of that response. |
| One-Time Notification | Yes (Beta) | **No** | Explicitly "not available for IG Messaging API" |
| **Sponsored Messages** | Yes | **No** | Explicitly "not available for IG Messaging API" |
| News messaging (NPI) | Yes | **No** | Explicitly not available for IG |

<https://developers.facebook.com/docs/messenger-platform/policy/policy-overview>,
<https://developers.facebook.com/docs/instagram-platform/private-replies> **[PRIMARY]**

**Rate limits — verified directly against Meta's rate-limiting doc:**

| API | Limit (per Instagram professional account) |
| --- | --- |
| **Send API** — text, links, reactions, stickers | **100 calls/second** |
| **Send API** — audio or video | **10 calls/second** |
| **Conversations API** (thread reads) | **2 calls/second** |
| **Private Replies** — comments on posts and reels | **750 calls/hour** |
| **Private Replies** — Instagram Live comments | 100 calls/second |

(Under the older "Messenger API for Instagram" surface the Send API text limit is
**300/second**, and Meta warns "your app may be rate limited if too many messages are
being sent to a single thread.")

<https://developers.facebook.com/docs/graph-api/overview/rate-limiting> **[PRIMARY]**

**750 private replies/hour per account is the real ceiling for comment-to-DM.** Note it is
per *account*, not per app — so you cannot scale around a single viral customer by adding
servers, and you must queue. This is the number to engineer against.

Other hard product constraints **[PRIMARY]**:

- Message text must be UTF-8 and **≤1,000 bytes**. Links must be valid formatted URLs.
- Media: images ≤8MB (png/jpeg); audio, video, and PDF ≤25MB each.
- **No group messaging** — one customer per conversation.
- Conversations in the **Requests** folder inactive for **30 days** stop being returned by
  the API.
- You must handle **`message_deletions`**-class webhooks — Platform Terms require deleting
  messages when notified.
- Automated-experience **disclosure** is required where law demands it, with California
  and Germany called out by name ("I'm the [Page Name] bot," etc.).
- Messenger's **responsiveness policy** requires automated bots to respond to any user
  input **within 30 seconds**; non-compliance can limit sending after a 7-day notice.
- New in the changelog and relevant to any inbox build: webhook **sticker attachment type**
  migration completes **30 August 2026**; the legacy Instagram post **`share` attachment**
  is being removed in favour of `ig_post`.

### 2.6 Promotional content outside the 24-hour window — the actual bad news

**Short answer: on Instagram, no. And the paid workaround is closed to new entrants.**

Inside 24 hours you can send promotional content freely. Outside it, Instagram has
Human Agent (human-written only) and one private reply per comment. Sponsored Messages and
One-Time Notification — the two Messenger mechanisms for paid or opted-in out-of-window
promotion — are **explicitly unavailable on the Instagram Messaging API**. **[PRIMARY]**

The legacy **Marketing Messages / Recurring Notifications** product did support Instagram
Professional accounts. It is being retired, and the key sentence for you is:

> "Starting September 1, 2025, marketing messages (also known as Recurring Notifications)
> **access will be limited to existing Partners and end-clients. No new integrations will
> be allowed.**"

...with deprecation on Messenger dated **10 February 2026** in the same document.
<https://developers.facebook.com/docs/messenger-platform/marketing-messages> **[PRIMARY]**
(ManyChat's own help centre says Meta "will begin sunsetting globally on January 12,
2026" — a ~1 month discrepancy with Meta's doc. Minor, but flag it: **[PRIMARY, conflicting]**.)

The replacement is the **Marketing Message API for Messenger** (MAPI-D), and it has a hard
gate:

> "The Marketing Message API for Messenger is available **exclusively to tech providers
> with an existing app that has successfully completed Meta App Review** for the following
> permissions: `ads_management`, `pages_messaging`, `paid_marketing_messages` **or**
> `marketing_messages_messenger`."

Plus: tech providers may only serve businesses in **20 listed countries** (US and Vietnam
are in; the EU and UK are not on the provider list). Messages may be sent to subscribers
in all regions **except the EU, Japan, South Korea, Australia, and the UK**. **Web
applications only.** The API is free to integrate but **Meta charges the sending business
per message**, billed through an ad account. Onboarding requires the client to have a
Business Portfolio, a Page, and an ad account with a valid payment method; there are three
onboarding flows, and Flow 3 (partner-billed) additionally requires **`business_management`
App Review**.

<https://developers.facebook.com/docs/marketing-messages-on-messenger> (updated **17 April
2026**) **[PRIMARY]**

**Read that carefully: it is named "for Messenger."** I found no primary documentation
confirming Instagram is a supported surface on the new MAPI-D. **[UNVERIFIED — needs
direct confirmation from Meta before any roadmap depends on it.]**

**Implication for the business model.** Out-of-window promotional reach on Instagram is
effectively unavailable to a new entrant. Everything must run inside the 24-hour window
opened by a user action — a comment, a story reply, or an inbound DM. That is fine for
comment-to-DM fulfilment, which is exactly your wedge. It is fatal for "broadcast a drop
announcement to my 50,000 Instagram DM subscribers," which is the thing Laylo's
customers actually want. **Whatever broadcast capability you offer will have to run on
email, WhatsApp templates, or SMS — not Instagram DM.** This is the single most important
technical finding in this document and it constrains the product materially.

### 2.7 Has Meta cracked down on comment-to-DM tools?

**Confirmed policy changes (primary):**

- **27 April 2026** — message tags `CONFIRMED_EVENT_UPDATE`, `ACCOUNT_UPDATE`, and
  `POST_PURCHASE_UPDATE` are deprecated; requests containing them return **error code
  100**. Announced in the changelog on 27 March 2026 — **one month's notice**. Migration
  path: Utility Templates or Marketing Messages API.
  <https://developers.facebook.com/docs/messenger-platform/changelog> **[PRIMARY]**
- **1 September 2025** — legacy Marketing Messages closed to new integrations; subscriber
  cooldown moved from one send per 24h to one per 48h. **[PRIMARY]**
- **25 June 2026** — new error code `10-1893063` added for "Pages temporarily restricted
  from sending messages." A restriction mechanism getting its own error code is a mild
  signal of enforcement volume. **[PRIMARY]**

**What I could NOT verify — and one claim that looks fabricated:**

> **[CONTRADICTED] "Meta cut the Instagram automated-DM limit from 5,000/hour to 200/hour
> in October 2024 (or October 2025)."**

This claim is repeated across at least six competitor blogs, sometimes as "a 96%
reduction," sometimes as "enforced at the API layer." **It does not appear in Meta's
rate-limiting documentation, the Messenger Platform changelog, or the Graph API changelog.**
Meta's published Instagram messaging limits are per-second (100/s send, 2/s conversations)
plus **750/hour private replies** — there is no flat hourly DM cap at all.

One publisher in this cluster has since posted a correction:

> "An earlier version of this post stated that Meta cut Instagram DM API rate limits from
> 5,000 per hour to 200 per hour... We went looking for the primary source and could not
> find that change in any Meta documentation or changelog. Meta publishes no flat hourly
> DM cap for Instagram... The widely repeated '200' appears to trace back to Meta's
> Messenger formula 'Calls within 24 hours = 200 × Number of Engaged Users', which is not
> an hourly cap."
> <https://sumgenius.ai/blog/instagram-dm-bot-ban-wave-2026/>

Two other pages in the same cluster now describe "200 DMs/hour" honestly as **a tool-side
pacing convention that vendors apply voluntarily to stay well under Meta's real ceilings** —
not a Meta rule.

**Conclusion:** the "200/hour" figure is a vendor pacing convention that got laundered into
a fake Meta policy through SEO cross-citation. **Engineer against 750/hour, pace
conservatively below it by choice, and ignore the 200 number.** More broadly: I found **no
primary evidence of Meta banning or de-platforming any specific official-API comment-to-DM
tool** in 2025–26. The enforcement that is real and well-documented targets
password-sharing browser bots and scrapers, which is a different product category
entirely.

---

## Part 3 — TikTok DM automation

**There is a public API, but it cannot do comment-to-DM.**

The **TikTok Business Messaging API** exists and is live, accessed through
<https://business-api.tiktok.com/portal> with docs at
`business-api.tiktok.com/portal/docs?id=1832183871604753` and a Business Messaging API
Education Hub. **[PRIMARY — portal and doc URLs confirmed to exist]**

Access path **[SECONDARY — from Chatwoot's and ChatbotX's integration docs, which are
consistent with each other and with Qiscus's]**:

1. TikTok **Business Account** in an eligible region (personal and creator accounts are
   **not** supported).
2. Account must accept DMs from **everyone**, or messages need manual acceptance in-app.
3. Developer account at `developers.tiktok.com`.
4. Register an app at `business-api.tiktok.com/portal/apps` → App ID / App Secret.
5. **Apply for the Business Messaging API product**, submitting use case, data-handling
   practices, and organisation details. Review typically **a few business days**, longer
   for specialised access. You cannot integrate until approved.
6. Enable the **TikTok Accounts** permission scope.

**Region restriction:** the Business Messaging API is **unavailable for accounts registered
in the EEA, Switzerland, or the UK.** **[SECONDARY, stated identically in two independent
integration docs]**

**Functional limits** — this is the part that kills the use case:

- **Inbound only.** A user must message the business account first.
- **~48-hour** reply window (vs Meta's 24).
- **No comment webhook and no private-reply-to-comment API.** There is no TikTok equivalent
  of Meta's Private Replies. Comment-to-DM does not exist on TikTok through official means.
- **No broadcasting**, no cold outreach, roughly 10 automated messages per window.
- Enterprise-gated; creator accounts have no access.

**[SECONDARY for the "no comment-to-DM" conclusion — Qiscus's integration doc confirms
"only send messages to customers who contact you first"; the 48-hour window and
10-message figures come from competitor blogs and should be treated as **[WEAK]** until
confirmed against TikTok's own docs, which are behind a portal login.]**

Also worth knowing, because it explains the market: every tool advertising **outbound or
cold** TikTok DMs is running headless browser sessions against real accounts, outside the
official API, in violation of TikTok's developer terms. One such vendor says so on its own
homepage. Do not go there.

**Assessment:** TikTok is a "we support TikTok too" checkbox for inbound customer service.
It is **not** a second comment-to-DM channel. ManyChat's TikTok support does not undermine
this — it is subject to the same API.

---

## Part 4 — WhatsApp Business Platform pricing, 2026

Meta moved from conversation-based to **per-message pricing on 1 July 2025**. Conversation
pricing is deprecated. **Your recollection is correct.** **[PRIMARY]**

How billing works now:

- **Charged only when a template message is delivered** (`"type":"template"`).
- Rates vary by **template category** (marketing / utility / authentication) and the
  **recipient's country calling code**.
- **All non-template messages are free** — but they can only be sent inside an open
  customer service window.
- Since **1 July 2025**, **utility templates delivered inside an open customer service
  window are free** (`type: free_customer_service`).
- Since **1 November 2024**, service conversations are free for all businesses.
- **Free entry point window:** all messages, including templates, are free for **72 hours**.
- **Volume tiers** unlock lower rates — **utility and authentication only. Marketing gets
  no volume discount and is billed on every delivery.**

Meta's advance-notice commitments are contractually useful to know: **1 month** for a rate
card change, **3 months** for a pricing-model add-on, **6 months** for a pricing-model
change.

**Actual USD rates, effective 1 July 2026** — downloaded from Meta's own rate-card CSV
linked off the pricing page:

| Market | Marketing | Utility | Authentication |
| --- | --- | --- | --- |
| **North America (US, CA)** | **$0.0250** | **$0.0034** | **$0.0034** |
| United Kingdom | $0.0635 | $0.0220 | $0.0220 |
| Germany | $0.1365 | $0.0550 | $0.0550 |
| Netherlands | $0.1597 | $0.0500 | $0.0500 |
| Italy | $0.0795 | $0.0300 | $0.0300 |
| Spain | $0.0707 | $0.0200 | $0.0200 |
| Brazil | $0.0625 | $0.0068 | $0.0068 |
| India | $0.0118 | $0.0014 | $0.0014 |
| Mexico | $0.0305 | $0.0085 | $0.0085 |
| Rest of Western Europe | $0.0592 | $0.0171 | $0.0171 |
| Other | $0.0604 | $0.0077 | $0.0077 |

Source: <https://developers.facebook.com/docs/whatsapp/pricing> → "USD rates" CSV,
header reads *"Cost per message in USD on the WhatsApp Business Platform, effective July 1,
2026."* **[PRIMARY]**

**The number that matters: a US WhatsApp marketing message costs 2.5¢, versus roughly
1.2¢ for a US SMS segment (§5.2) and $0.00 for an in-window Instagram DM.** WhatsApp
marketing is the most expensive of the three per message and has no volume discount.
Recent rate movement has been upward in Western Europe: effective 1 July 2026, Italy,
Spain, and the UK all got **higher** marketing rates.

Also in the 2026 changelog: **billing localisation** to INR (from 1 Jan 2026, mandatory
migration by 31 Dec 2026) and BRL (from 1 Jul 2026, mandatory by 30 Jun 2027) for
providers whose Sold-To country is India or Brazil — a real operational obligation if you
ever resell WhatsApp into those markets.

---

## Part 5 — SMS economics and legal exposure (US)

### 5.1 A2P 10DLC registration — fees and timeline

**Registry fees, from Twilio's own Trust Hub documentation [PRIMARY]:**

| Fee | Frequency | Cost |
| --- | --- | --- |
| Brand registration with TCR | One-time | **$4.50** |
| Standard Brand vetting | One-time, auto-charged during Standard Brand registration | **$41.50** |
| Brand appeal (Standard Brand rejections only) | Per request | **$11** |
| Authentication Plus (public, for-profit brands only) | Per request | **$12.50** |
| Brand political vetting | **Yearly** | **$66–$96** |

<https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand> **[PRIMARY]**

Twilio's docs confirm monthly campaign fees exist ("There are monthly campaign fees to
cover the cost of creating and maintaining a campaign record with The Campaign Registry")
but push the amounts to a help-centre article I could not retrieve. The following figures
are consistent across a Twilio reseller's passthrough fee schedule and an independent
pricing breakdown, so I'd treat them as reliable-but-unconfirmed:

| Campaign use case | Monthly fee |
| --- | --- |
| Low-Volume Mixed | **$1.50** |
| Sole Proprietor (Starter) | **$2.00** |
| Charity / 501(c)(3) | **$3.00** |
| Emergency Services | **$5.00** |
| **Standard** (what a marketing campaign is) | **$10.00** |

Plus a **~$15 one-time campaign vetting fee**. Monthly fees accrue while the campaign is
active regardless of whether you send anything.
<https://help.gohighlevel.com/support/solutions/articles/155000005200-a2p-10dlc-messaging-fees-registration-monthly-and-carrier-costs>,
<https://apidog.com/blog/twilio-sms-api-cost/> **[SECONDARY]**

**Timeline — sources disagree materially, so plan for the pessimistic end:**

- Brand: minutes to 2 business days. Campaign: 3–10 business days. **[SECONDARY]**
- Twilio's own number-comparison guide: **"3–5 weeks with secondary vetting required."**
  **[PRIMARY]**

The gap is real: brand approval is fast, but carrier-side campaign vetting after TCR
approval is where the weeks go. **Budget 3–5 weeks per customer brand.**

**Throughput is not fixed — it's assigned.** Registration produces a **Trust Score** that
dictates messages-per-second and daily volume. Twilio's guide gives a range of **3–180
MPS** with T-Mobile daily limits of **10k–200k**; a third-party guide gives a much lower
tier table (0.25 MPS / 200 msgs/day at the bottom, 15 MPS / 5,000+ at the top). These
**conflict by two orders of magnitude** and I could not reconcile them from primary
sources. **[CONTRADICTED — verify with your chosen carrier before promising throughput
to anyone.]**

**Unregistered traffic is blocked outright** by major US carriers — reported as of
1 February 2025. **[SECONDARY]**

**Toll-free as the pragmatic alternative [PRIMARY]:**

- Verification is handled **in-house by Twilio** — no external registry vetting — so it's
  faster: **5–14 days** (Twilio's comparison table says 7–21).
- **3 MPS** default, scaling to **150+ MPS**; **no total volume limits**.
- Handset-level delivery receipts, versus carrier-level for 10DLC.
- While `IN_REVIEW`: 2,000 segments/day, 6,000/week, 10,000/month.
- **From 17 February 2026, a business registration number is required for all new
  toll-free submissions except sole proprietorships.**
  <https://www.twilio.com/en-us/changelog/business-registration-numbers-required-for-toll-free-messaging-p>

**Short codes:** 6–10 weeks provisioning, 100+ MPS, unlimited volume — and the pricing in
§5.2 makes them irrelevant at your scale.

### 5.2 Per-message cost, four vendors

**Twilio (US) [PRIMARY]** — <https://www.twilio.com/en-us/sms/pricing/us>

Base, per segment, identical across long code / toll-free / short code:

| | Outbound | Inbound |
| --- | --- | --- |
| SMS | **$0.0083** | $0.0083 |
| MMS | **$0.022** | $0.0165 (long code / short code), $0.02 (toll-free) |

Carrier fees stack on top, per segment, by destination carrier (long code):

| Carrier | SMS out | SMS in | MMS out | MMS in |
| --- | --- | --- | --- | --- |
| AT&T | $0.0035 | $0.0035 | $0.009 | $0.009 |
| T-Mobile | $0.0045 | $0.0025 | $0.010 | $0.010 |
| Verizon | $0.0045 | — | $0.007 | — |
| US Cellular | $0.0050 | $0.0025 | $0.010 | $0.010 |
| All others | $0.0040 | — | $0.010 | — |

Plus a **$0.001 failed-message processing fee** on messages terminating in `Failed`.

> **All-in Twilio US: ~$0.0118–$0.0133 per SMS segment; ~$0.029–$0.032 per MMS.**

**Telnyx [PRIMARY]** — <https://telnyx.com/pricing/messaging>
$0.004 per message part + carrier fee (SMS, both directions); MMS $0.015 out / $0.005 in +
carrier fee. Volume discounts begin above 100M messages/month (next 150M at $0.0020/part),
which is irrelevant at your scale. **All-in ≈ $0.0075–$0.0090 per SMS segment** —
noticeably cheaper than Twilio.

**Plivo [PRIMARY]** — <https://www.plivo.com/sms/pricing/us/>
Long code $0.0077/SMS, toll-free $0.0079, short code $0.0077. MMS: long code $0.0180,
toll-free/short code $0.0200. Same carrier surcharge table as Twilio (AT&T $0.0035,
T-Mobile $0.0045/$0.0025, Verizon $0.0045, others $0.0050). Long code rental **$0.50/mo**.
Short codes carry a **$1,500 one-time** fee.

**Sinch** — publishes no public US per-message rate; pricing page routes to sales.
<https://www.sinch.com/pricing/> **[PRIMARY, but no usable number.]** Sinch does confirm
the July 2025 conversation→per-message shift for WhatsApp.
<https://sinch.com/blog/whatsapp-business-pricing/>

**Number and short-code costs (Twilio) [PRIMARY]:**

| Number type | Twilio-leased / month | Bring your own / month |
| --- | --- | --- |
| Long code | $1.15 | $0.50 |
| Toll-free | $2.15 | $0.50 |
| **Random short code** | **$1,000** (billed quarterly) | — |
| **Vanity short code** | **$1,500** (billed quarterly) | $500 (billed quarterly) |

All MMS-enabled short codes carry a **$500 one-time fee**. Short codes are a
$12,000–18,000/year line item before a single message — categorically out of reach for a
small SaaS, and only worth revisiting if you ever need T-Mobile's Free-To-End-User
programme, which **requires a dedicated short code**.

### 5.3 TCPA — current state of the law

**Statutory damages:** **$500 per violation**, trebled to **$1,500 for willful or knowing**
conduct, under 47 U.S.C. § 227. Courts generally treat **each individual call or text as a
separate violation**, and there is **no cap on aggregate exposure**. **[SECONDARY —
consistent across a Bryan Cave Leighton Paisner client alert and multiple practitioner
summaries.]**
<https://www.bclplaw.com/en-US/events-insights-news/tcpa-update-the-fcc-delays-portions-of-revocation-of-consent-rules-by-one-year.html>

**The one-to-one consent rule — your recollection is correct.**

The FCC's December 2023 order (Part III.D) would have required that consent name **no more
than one identified seller** and be **"logically and topically associated with the
interaction that prompted the consent."** It was scheduled to take effect 27 January 2025.

**It was vacated on 24 January 2025** by a unanimous panel of the **US Court of Appeals for
the Eleventh Circuit** in **_Insurance Marketing Coalition Ltd. v. FCC_, 2025 WL 289152
(11th Cir. Jan. 24, 2025)**. The court held the FCC exceeded its statutory authority because
the restrictions conflicted with the ordinary meaning of "prior express consent." Vacated
and remanded to the FCC.

Hours earlier the FCC had postponed the effective date by 12 months to 26 January 2026; the
ruling **mooted** that order.

**Current state as of August 2026: the rule is not in effect, and bundled multi-seller
consent remains permissible.** The FCC's Consumer and Governmental Affairs Bureau stated
that "the previous requirements for prior express written consent" continue to apply.

Sources: <https://www.goodwinlaw.com/en/insights/publications/2025/01/alerts-otherindustries-eleventh-circuit-deals-fatal-blow>,
<https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/eleventh-circuit-vacates-tcpa-11-consent-rule>,
<https://www.venable.com/insights/publications/2025/01/eleventh-circuit-overrules-fccs-one-to-one>,
<https://www.troutman.com/insights/eleventh-circuit-re-opens-tcpa-lead-generator-loophole-and-signals-further-erosion-of-judicial-deference-to-administrative-rules/>
**[SECONDARY — four independent law firms, unanimous.]**

**What *is* in force: the revocation rules.**

- **Effective 11 April 2025** (47 C.F.R. § 64.1200, 89 Fed. Reg. 15756): a consumer may
  revoke consent by **any reasonable method** — a reply text, a verbal request to an agent,
  an email — and the caller must **honour it within 10 business days**. No magic keyword
  required. **This is the operative compliance obligation and it is live now.**
- **§ 64.1200(a)(10)** — the "revoke-all" provision, under which one revocation would apply
  to all future robocalls and robotexts from that caller **on unrelated matters** — remains
  **waived**. The FCC first delayed it to 11 April 2026, then extended again.

  **Primary source, verified from the PDF:** FCC Order **DA 26-12**, CG Docket No. 02-278,
  adopted and released **6 January 2026**: "we find that good cause exists to extend the
  effective date for this requirement **until January 31, 2027**." The Order emphasises the
  waiver "does not alter the status quo relating to any other prior Commission rules or
  rulings addressing revocation of consent." <https://ecacusa.org/DA26.pdf> **[PRIMARY]**

**Recent settlements** — for calibrating exposure. **[SECONDARY, from ClassAction.org's
news wire, TopClassActions, and settlement aggregators; individual dockets not
independently pulled.]**

| Defendant | Amount | Status / date |
| --- | --- | --- |
| Momentum Solar | up to **$30M** | 2025 — reportedly largest in solar |
| Citibank | **$29.5M** | Jan 2025 |
| **Sirius XM** | **$28M** | Final approval **6 July 2026** (DNC calls, Apr 2019–Oct 2025) |
| Realogy / Coldwell Banker | **$20M** | Final approval Mar 2026; ~700k calls, ~298,494 class members |
| **O'Reilly Automotive** | **$18.8M** | Final approval hearing **5 Nov 2026** — DNC **text messages**; est. **up to $22/person** |
| Kaiser Foundation Health Plan | **$10.5M** | Paid 16 Mar 2026 — **texts after "stop"**; **up to $75 per post-opt-out text** |
| Gen Digital (Norton/LifeLock) | **$9.95M** | Mar 2026 |
| Zales | $7.5M | Sep 2025 — spam texts |
| Albertsons | $5.95M | Aug 2025 |
| Athena Bitcoin | $4.5M | texts after opt-out |

Two of these are worth internalising. **Kaiser paid up to $75 per text sent after
someone replied "stop"** — that is the price of an opt-out suppression bug. And
**O'Reilly's is a pure texting case** heading to final approval in November 2026, which
tells you DNC-registry texting is an actively litigated theory right now, not a historical
one.

State law adds to this: Texas's mini-TCPA reportedly allows **$500–$5,000 per violation**,
and Florida's FTSA was co-pleaded in the Kaiser case. At least a dozen states have their
own regimes. **[WEAK on the specific figures.]**

### 5.4 Platform liability versus sender liability — the case law you asked for

**There is real, recent, directly on-point case law, and it cuts both ways.** The dividing
line is *passive conduit* versus *active participant*.

**The governing standard** comes from the FCC: a technology vendor is directly liable when
it is **"so involved in the placing of a specific telephone call as to be directly liable
for making it"** (*In re Dish Network*, 28 FCC Rcd. 6574 (2013)).

**Case 1 — the bad one. _Connor v. ServiceQuik Inc. and Woosender Inc._, 2025 WL 2855393
(D. Colo. 2025).** The plaintiff sued not only the business that sent the texts but
**Woosender, the messaging platform it used**. Woosender moved to dismiss. **The court
refused**, quoting the complaint's allegations that Woosender's service:

> "goes [f]ar beyond merely providing the platform that enables them to send messages"
> and includes **"actually setting up and providing intimate support for their customers'
> campaigns and strategies."**

The court held these allegations sufficient to establish a **"direct connection"** between
the platform and transmission of the texts. Motion to dismiss **denied**; the platform
proceeds to discovery.

<https://tcpaworld.com/2025/10/09/platform-liabile-for-illegal-calls-court-refuses-to-dismiss-woosender-from-tcpa-class-action-owing-to-allegations-of-setting-up-campaigns/>,
<https://www.henson-legal.com/newsroom/were-just-the-platform-a-court-explains-why-that-might-not-be-enough>
**[SECONDARY — practitioner blogs quoting the opinion at length; the opinion itself was
not retrieved.]**

Note precisely what this is and isn't: it's a ruling on a motion to dismiss, not a finding
of liability. But it is a roadmap. **Onboarding help, campaign setup services, "we'll build
your first flow for you," and an over-helpful customer success team are the exact facts
that defeat a platform's early exit from a TCPA class action.** For a founder-led SaaS
where high-touch onboarding is the natural growth motion, that is a direct and
uncomfortable tension.

**Case 2 — the good one. _Dobronski v. WinRed, Inc._, 2026 WL 2168723 (E.D. Mich. July 28,
2026).** A repeat litigator claimed 80+ illegal texts from political campaigns running on
WinRed. **Summary judgment granted for WinRed.** The court accepted that WinRed offered no
calling platform — only a payment platform — and so declined to apply the platform-
involvement test at all, analysing instead traditional vicarious liability. Because the
texts were sent "powered by" WinRed rather than "on behalf of" WinRed, there was no basis
for liability.
<https://tcpaworld.com/2026/07/29/winred-wins-court-finds-winred-not-responsible-for-illegal-texts-sent-by-political-campaigns-that-were-powered-by-winred/>
**[SECONDARY]**

**Case 3 — the older template. _Sheski v. Shopify_ (N.D. Cal., 13 May 2020).** Motion to
dismiss **granted**. Shopify provided "a suite of software options for retailers, who then
determine which options to utilize" — which fell short of alleging Shopify controlled or
had the right to control any text campaign. No direct liability, no vicarious liability,
no negligence.
<https://www.consumerfinancialserviceslawmonitor.com/2020/05/california-federal-court-grants-platform-providers-motion-to-dismiss-in-tcpa-case/>
**[SECONDARY]**

**Synthesis — what actually determines which side you land on:**

| Increases platform exposure | Reduces platform exposure |
| --- | --- |
| Setting up customers' campaigns for them | Self-serve configuration only |
| "Intimate support" for campaign strategy | Documentation and generic support |
| Supplying or drafting message content | Customer authors all content |
| Granular control over send flows on the customer's behalf | Customer controls targeting and timing |
| No enforced opt-out mechanics | Platform-enforced STOP suppression across all campaigns |
| Not monitoring for illegal patterns | Active monitoring, throttling, and documented enforcement |
| Vague or absent contractual allocation | Explicit AUP, consent warranties, indemnity, addenda |

The Blacklist Alliance's summary of the doctrine adds that the FCC has imposed
**multi-million-dollar forfeitures** where it found platform-level participation, and that
carriers and dialing platforms are expected to "monitor traffic for patterns of illegal
calling... enforce opt-out performance, and maintain documentation of mitigation steps to
rebut 'active facilitation' allegations."
<https://www.blacklistalliance.com/blog/direct-and-vicarious-tcpa-liability-what-matters-for-compliance-risk-and-enforcement>
**[SECONDARY]**

**Bottom line for the assessment: a platform is not automatically safe.** The
"we're just the pipes" defence is available but it is a *design constraint*, not a legal
given — and the behaviour that earns it (hands-off, self-serve, aggressively enforced
opt-outs) is in direct tension with the high-touch onboarding that a small SaaS normally
relies on to convert its first hundred customers.

### 5.5 Carrier filtering and "free download" content

**Yes — this content profile is squarely in the filtered category, for two independent
reasons: the word "free," and the link.**

**On links — T-Mobile's Code of Conduct is the authoritative text [PRIMARY]:**

- **§3.3 Use One Recognizable Domain Name.** "Each program should be associated with a
  single business's web domain... While a full domain is preferred, a branded short URL
  may be used."
- **§4.7 URL Cycling / Public URL Shorteners.** Using multiple FQDNs in bulk messaging with
  similar content to evade filters or dilute reputation is **prohibited**. "The practice of
  using **public URL shorteners** in bulk messaging is **highly discouraged, and messages
  containing them may be subject to blocking.**" Using *multiple* public shorteners with
  similar content is **prohibited** outright.
- **§4.8 URL Redirects/Forwarding.** Multiple redirects are discouraged; T-Mobile's spam
  filters specifically check for them.
- **§4.9 Number Cycling** — using multiple numbers to distribute similar content is
  prohibited without special approval.
- **§6.3 Free-To-End-User** programmes require a **dedicated short code**.

<https://infobip-cdn-h0h7ekhqhgh4hgau.a02.azurefd.net/1g8x60m5haaeebc38sw9etdnqwq2orfxs6yjtxwklw767cqz71/t-mobile_code_of_conduct_v2.2_2020_.pdf>

**AT&T reportedly blocks public link shorteners outright** (bit.ly, rb.gy, tinyurl), and
when AT&T blocks a number the block typically persists **30 days** and is generally not
appealable. **[SECONDARY / WEAK — consistently reported by Twilio resellers and
deliverability vendors; AT&T's own policy document was not retrievable.]**

**On content**, the terms that filtering systems weight against you include, verbatim from
deliverability guidance: **"free money," "act now," "limited time," "you've been
selected," "winner,"** all-caps, and excessive punctuation (**"FREE!!!"**). Also flagged:
newly registered domains, domains with no sending history, and domains previously
associated with filtered traffic.
<https://www.text-em-all.com/blog/why-your-sms-messages-get-filtered-and-how-to-fix-it>,
<https://help.gohighlevel.com/support/solutions/articles/48001240115-understanding-the-potential-delivery-issues-of-text-messages-with-shortened-urls>
**[SECONDARY]**

**Direct answer to your question:** a message reading *"Your free download is ready 🔥
bit.ly/xyz"* combines a spam-trigger keyword, a public URL shortener, a redirect chain,
and — for a brand-new SaaS — a domain with zero sending reputation. It is close to a
worst-case content profile. **Filtering is also silent: blocked messages typically produce
no error and no bounce, just non-delivery.** You would be debugging invisible failures for
your customers, at your support cost, with your brand taking the blame.

If SMS ever ships, the minimum viable mitigations are: a **branded** short domain on a
single FQDN (never a public shortener, never rotating domains), no redirect chains, URLs at
the end of the message, avoid the word "free" in the first message, mandatory
"Reply STOP to unsubscribe," gradual volume ramp, and per-brand 10DLC registration.

### 5.6 EU / UK note

**UK — PECR Regulation 22 [PRIMARY, ICO].** You must not send marketing texts to
individuals unless either (a) they have **specifically consented**, or (b) the **"soft
opt-in"** applies: they are an existing customer who bought or negotiated to buy a
**similar** product, **and** you gave them a simple opt-out **both when you first collected
their details and in every message since**. Consent must be knowingly and freely given,
clear, specific, and affirmative — **pre-ticked boxes are not valid consent** under UK
GDPR. Consent must cover both your organisation and the channel. **Purchased or rented
lists never qualify for soft opt-in.** The same rule covers "emails, texts, picture
messages, video messages, voicemails, **direct messages via social media** or any similar
message that is stored electronically" — which means **Instagram DM marketing to UK
individuals is in scope of PECR too**, a point that is easy to miss.
<https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/>

**The UK penalty ceiling changed recently, and one widely cited figure is stale.** The
**Data (Use and Access) Act 2025** (Royal Assent 19 June 2025) raised the maximum PECR fine
from **£500,000** to **£17.5 million or 4% of annual global turnover**, whichever is higher,
and gave the ICO the full GDPR enforcement toolkit including information notices,
enforcement notices, and **stop orders**. **These provisions came into force on 5 February
2026.** The requirement to prove substantial damage and distress was also removed.
Pre-February-2026 breaches remain under the old £500k cap.
<https://www.pinsentmasons.com/en-gb/out-law/news/updated-uk-data-laws-take-effect-this-week>,
<https://www.mayerbrown.com/en/insights/publications/2025/06/the-data-use-and-access-act-pecr-reform-rules-relating-to-electronic-marketing-and-cookies-in-the-uk>,
<https://usercentrics.com/knowledge-hub/data-use-and-access-act-2025-duaa-compliance/>
**[SECONDARY, but from two law firms plus a compliance vendor, and consistent.]** I found at
least one 2026-dated guide still asserting the £500k cap — **[CONTRADICTED]**, it is out of
date.

**EU.** The **ePrivacy Regulation was formally withdrawn by the European Commission in
February 2025**, so the **2002 ePrivacy Directive** remains governing, transposed
separately in each member state. The result is a fragmented regime: German case law
requires de facto double opt-in, and CNIL (France) is the most active enforcer. A CJEU
ruling (*Inteligo*, November 2025) reportedly clarified that the ePrivacy soft opt-in is a
standalone legal basis. **[WEAK — this came from a single vendor compliance index; verify
with counsel before relying on it.]**

Also relevant: several Meta and TikTok messaging products are **unavailable in the EU/UK
entirely** — TikTok's Business Messaging API excludes the EEA, Switzerland, and the UK
(§3), and Meta's Marketing Message API cannot send to the EU or UK (§2.6). **EU/UK
expansion is constrained by platform availability before it is constrained by law.**

---

## Appendix A — Claims I could not verify

| Claim | Status |
| --- | --- |
| "Meta cut Instagram automated DMs from 5,000/hour to 200/hour (Oct 2024 or Oct 2025)" | **[CONTRADICTED]** Absent from Meta's rate-limiting doc and both changelogs. Meta publishes no flat hourly DM cap. One publisher has retracted it; two others now describe 200/hour as a voluntary tool-side pacing convention. Real limits: 100/s Send API, 750/hour private replies. |
| "Meta suspended 10M+ Instagram accounts in 2026, sweeping up legitimate creators" | **[UNVERIFIED]** Competitor blogs only. No press or primary confirmation. |
| ManyChat revenue / ARR | **[UNVERIFIED]** Data brokers give $60–73M and $250–500M. Irreconcilable. Company has never disclosed. |
| ManyChat headcount | **[SECONDARY, conflicting]** 435 (Revelio, Q1 2026) vs ~560 (LeadIQ, Jul 2026). |
| ManyChat Advanced-tier overage rate | **[WEAK]** Help centre says "custom." The $0.004/$0.0028 figure appears only on affiliate pages. |
| Instagram support in the new Marketing Message API (MAPI-D) | **[UNVERIFIED]** Product is named "for Messenger"; no primary doc confirms Instagram. Confirm with Meta before any roadmap depends on it. |
| Legacy Marketing Messages sunset date | **[PRIMARY, conflicting]** Meta doc says 10 Feb 2026 (Messenger); ManyChat help says global sunset begins 12 Jan 2026. |
| 10DLC monthly campaign fees ($1.50–$10) and ~$15 campaign vetting | **[SECONDARY]** Consistent across two independent sources; Twilio confirms fees exist but publishes amounts only in an unretrievable help article. |
| 10DLC Trust Score throughput tiers | **[CONTRADICTED]** Twilio: 3–180 MPS, T-Mobile 10k–200k/day. Third party: 0.25–15 MPS, 200–5,000+/day. Two orders of magnitude apart. |
| TikTok 48-hour window and ~10 automated messages per window | **[WEAK]** Competitor blogs; the direction (inbound-only, windowed) is corroborated by Qiscus's integration doc, but the specific numbers are not primary. |
| AT&T fully blocks public URL shorteners; 30-day non-appealable blocks | **[SECONDARY]** Widely and consistently reported; AT&T's own policy doc not retrievable. T-Mobile's equivalent rules **are** primary-confirmed. |
| Specific Reddit complaint quotes about ManyChat | **[WEAK]** Aggregated on competitor blogs; individual posts not verified. Themes are corroborated by primary Trustpilot/Capterra data. |
| Individual TCPA settlement dockets | **[SECONDARY]** From ClassAction.org and settlement aggregators; dockets not independently pulled. |
| CJEU *Inteligo* (Nov 2025) soft-opt-in holding | **[WEAK]** Single vendor source. |
| Meta Business Partner programme eligibility criteria | **[SECONDARY/WEAK]** Consistent across partner-agency blogs; Meta's own criteria page not retrieved. |
| Twilio 10DLC campaign fee page, Sinch US SMS rates, G2/Trustpilot direct pages | Blocked (403 / Cloudflare / login). Worked around via search-tool extraction and Meta/vendor CSVs. |

## Appendix B — Bottom lines

1. **Meta is not Spotify.** No scale, MAU, or volume bar exists on the Instagram messaging
   permission path. Three sequential approvals — Business Verification → Tech Provider
   access verification (~5-day decision) → per-permission App Review with screencasts —
   plus an annual DPA and Data Use Checkup. No licence fees. Passable by a two-person
   company with a working web app. **Surmountable bureaucratic hurdle, not a wall.**
2. **But the out-of-window door is shut.** Instagram has no Sponsored Messages, no
   One-Time Notification, and the legacy Marketing Messages product has been **closed to
   new integrations since 1 September 2025**. Its replacement is Messenger-named,
   region-limited, ad-account-billed, and gated behind App Review for
   `paid_marketing_messages`. **Everything you send on Instagram must live inside a
   24-hour window a fan opened.** Comment-to-DM fulfilment fits this perfectly.
   "Broadcast my drop to 50k DM subscribers" does not.
3. **Engineer against 750 private replies/hour per account.** That is the documented
   comment-to-DM ceiling, it is per-account rather than per-app, and queueing during
   virality is a launch requirement, not a v2 feature. Ignore the fictitious 200/hour.
4. **ManyChat's March 2026 repricing is the opening, and its own weakness is the billing
   model.** Free tier cut from 1,000 Active Contacts to 25; Trustpilot 2.9/5 on 250
   reviews against G2 4.5–4.6; complaints concentrated on billing surprises and support,
   not product capability. The structural flaw is that the billed unit *is* the metric
   customers are trying to maximise.
5. **Meta-side outages are the category's shared risk.** ManyChat's own status page logs a
   ~10-hour major Meta messaging outage on 22 July 2026 and three more incidents in the
   preceding six weeks. Budget for a status page and a customer-comms playbook at launch.
6. **SMS is cheap per message and expensive per mistake.** ~$0.012/segment all-in on
   Twilio, ~$0.008 on Telnyx, plus $4.50 + $41.50 brand fees, ~$10/month per standard
   campaign, and 3–5 weeks of per-brand registration. Against that: **$500–$1,500 per
   message, uncapped**, with *Connor v. ServiceQuik* establishing that a platform offering
   "intimate support for their customers' campaigns" does not get out of a TCPA class
   action at the pleadings stage. **And a "your free download is ready + short link"
   message is close to a worst-case carrier-filtering profile** — silently blocked, no
   bounce, your support burden.
7. **The recommendation in the existing assessment survives this research: ship Instagram
   DM and email; do not ship SMS.** Two findings strengthen it. First, the out-of-window
   restriction (#2) means Instagram cannot serve broadcast anyway, so email is doing real
   work rather than being a nice-to-have. Second, *Connor* means the "we're just the pipes"
   defence is a design constraint that conflicts with high-touch onboarding — so if SMS
   ever ships, it must be self-serve, with platform-enforced STOP suppression, from day
   one.
