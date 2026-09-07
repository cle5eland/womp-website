# Fan messaging market research — Laylo and the competitive set

Research date: **24 August 2026.** All prices, figures and statuses are as of that date
unless stated otherwise.

This is market and competitor research, not a recommendation. It backs
[`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md), which
carries the strategic argument and the verdict; that assessment's other research file,
[`fan-messaging-research-2026.md`](fan-messaging-research-2026.md), covers the platform
and legal groundwork (ManyChat, Meta API access, WhatsApp, SMS law). The parallel
assessment of the download-gate market is in
[`saas-productization-analysis.md`](saas-productization-analysis.md).

## How to read the confidence labels

Every material claim carries one of these:

| Label | Meaning |
| --- | --- |
| **Confirmed** | Taken from a primary source: the company's own live pricing page, an SEC filing, a wire-service press release, or official platform documentation. |
| **Vendor claim** | The company says it about itself, in marketing material. Directionally useful, not independently checked. |
| **Third-party estimate** | A data aggregator (PitchBook, CB Insights, Tracxn, Sacra) or analyst. Often wrong, frequently contradictory. |
| **Unverified** | Reported somewhere but I could not corroborate it, or the sources disagree. |
| **Likely false** | I found a source asserting it and primary evidence contradicting it. |

**§6 lists every source I judged to be SEO or AI-generated spam, and why.** Read that
section before you reuse any number from a blog. A large fraction of the 2026 web on
this topic is machine-written affiliate content, and several widely-repeated "facts"
about this market are simply wrong.

---

## 1. Laylo — full profile

### 1.1 What the product does today

**Confirmed** from Laylo's own live site and help centre (laylo.com, help.laylo.com,
docs.laylo.com), August 2026.

Laylo positions itself as a **"drop CRM"**: fan capture pages plus a fan database plus
multi-channel messaging, wrapped around the moment an artist releases something.

Capture and pages:

- **Drop / RSVP pages** — auto-generated landing pages, one-click fan signup, automatic
  notification when the drop goes live. Laylo claims these convert **7x better** than
  traditional pages (**vendor claim**, no methodology published).
- **Multidrop / Touring suite** — one page for a whole tour; fans pick a city and get
  notified when that city's tickets go on sale, nearest city listed first.
- **Flexible embeds** for the artist's own site, plus tracking pixels (Meta, Google,
  TikTok).
- **Spotify pre-saves and one-click auto-follow** on drop pages.
- **Gated content** — Laylo's own help centre publishes a "Blueprint: Gated Content"
  telling artists to put a private SoundCloud, Dropbox or Google Drive link inside the
  automated RSVP confirmation message. This is the closest thing Laylo has to your
  download gate, and it is **a manual link paste, not a file-delivery system**. There is
  no per-fan entitlement, no expiring URL, no re-checking on download.
  ([help.laylo.com/Blueprint-Gated-Content-99b23cdfc61582d096c681394bc41dbf](https://help.laylo.com/Blueprint-Gated-Content-99b23cdfc61582d096c681394bc41dbf))
- **Instagram capture** — keyword-triggered DMs from Story replies, and comment-triggered
  DMs on posts and reels. Comments are a **paid add-on** (see pricing).
- **Voicemail campaigns** — fans call a number, hear a teaser, get texted.

CRM and messaging:

- Fan list with segmentation by location, signup method, drop engagement, purchase
  history, and Instagram engagement; fans sortable by follower count to spot potential
  collaborators.
- Omni-channel send: write once, deliver across SMS, email and Instagram DM, each fan on
  the channel they signed up through.
- Scheduled messages, 1:1 SMS replies, custom phone number with a contact card.
- **RealFan** — anti-scalping / broker detection, announced 5 August 2026.
- **Upsells** at checkout.

AI agents (new in 2026):

- **Ticket Sales Agent**, launched ~4 June 2026 with DICE as a launch partner. Follows up
  with fans based on behaviour, in the artist's voice: cart abandoners get reminders,
  browsers get low-inventory alerts, buyers get nudged to bring friends. Laylo says early
  agents outperform traditional re-engagement by **3x** (**vendor claim**).
  ([news.pollstar.com/2026/06/04/laylo-launches-new-ai-ticket-sales-agent-partners-with-dice/](https://news.pollstar.com/2026/06/04/laylo-launches-new-ai-ticket-sales-agent-partners-with-dice/))
- **UGC Agent**, July 2026. When a fan tags the artist in a Story, the agent evaluates the
  clip and asks the fan for the original file *and the rights* before the Story expires.
  Free to switch on. Integrates with swsh, FanMoments, FanVids.

Integrations (**confirmed**, from laylo.com/integrations): Instagram, Spotify, Shopify,
DICE, Set.live, Merchtable, Posh, Tixr, Samply.

**The Samply integration matters most to you.** Announced 6 August 2026: fans unlock
unreleased tracks on Samply by joining the artist's Laylo list; every unlock syncs into
the Laylo CRM as an email and SMS contact. Artists named: Dijon, Hudson Freeman. This is
Laylo moving directly into "gate unreleased audio behind fan capture" — the exact
mechanic your download gate implements, executed as a partnership rather than a native
feature.
([laylo.com/integrations/samply](https://laylo.com/integrations/samply),
[laylo.com/partner/samply](https://laylo.com/partner/samply))

RSVP, waitlists and ticketing: **confirmed** — RSVP is the core primitive, tour/presale
routing is a first-class product, and ticketing is via integrations (DICE, Tixr, Posh)
rather than Laylo selling tickets itself. Shopify: **confirmed**, two-way — product,
customer and purchase data sync into the Laylo CRM, and Laylo can message any customer
who opted into marketing at Shopify checkout.

### 1.2 Pricing — exact figures

**Confirmed.** I rendered [laylo.com/pricing](https://laylo.com/pricing) in a headless
browser on 24 August 2026 (the page is client-side rendered, so plain fetches return only
CSS — worth knowing if you check it yourself).

**Pro — $25/month, or $300/year.**

Annual saves $50 and includes 25,000 message credits, which Laylo prices as a "$50 value"
— that pins the credit at **$0.002**. Laylo notes 25,000 credits is 5,000 Instagram DMs.

Pro includes: custom drops and profile, tour & schedule pages, Shopify integration,
Instagram DMs, Spotify one-click pre-saves, custom phone number.

**Messaging — pay as you go, $150 for 75,000 credits** ($0.002/credit, consistent with the
annual bundle).

| Channel | Credits | Effective price |
| --- | --- | --- |
| Email | 1 | $0.002 |
| Instagram DM | 10 | $0.02 |
| SMS / RCS (US, Canada) | 10 per segment | $0.02 per segment |
| MMS (US, Canada) | 20 | $0.04 |
| SMS / RCS (international) or WhatsApp | 25 per segment | $0.05 per segment |

**Add-ons:**

| Add-on | Price |
| --- | --- |
| Instagram Comments | **$15/month** |
| Voicemail | **$700 one-time** |
| WhatsApp number | **$450/month** |
| RCS sender enablement | **$1,500/year** (from help.laylo.com, not the pricing page) |
| A2P 10DLC campaign vetting | **$15 one-time** (from Laylo's own blog) |

**Enterprise — $25/month + per-account fees, three-account minimum**, plus pay-as-you-go
credits. Roster-wide dashboard, per-account custom numbers, flexible billing (charge the
company or bill per account).

**Free tier: exists, limits not published. ⚠️ Unverified.** The pricing page has a "Start
for free" call to action but publishes no free-plan limits anywhere. The only figures I
could source are stale:

- Laylo's own help centre (written August 2022, never updated): every creator gets
  **250 credits per month free**.
  ([docs.laylo.com/en/articles/6520299-messaging-credits](https://docs.laylo.com/en/articles/6520299-messaging-credits))
- Music Ally, March 2023: the free "Basic" tier included unlimited drops, 250 free
  credits, CTR tracking, SMS and email RSVPs.
  ([musically.com/2023/03/29/tools-laylo/](https://musically.com/2023/03/29/tools-laylo/))

I found **no evidence of a fan-count cap on the free tier**, and several sources claiming
one are wrong (see §6).

**Per-subscriber pricing: no. Per-message pricing: yes, entirely.** Laylo does not charge
by list size at all — it charges $25/month flat plus metered credits. This is a
genuinely different shape from ManyChat, Klaviyo, Attentive and most link-in-bio tools,
all of which meter by contact count.

**Price history — Laylo's per-message prices have roughly doubled to tripled since 2023,
while the credit price stayed flat.** **Confirmed** by comparing the 2022 help doc and
the March 2023 Music Ally writeup against today's pricing page:

| Channel | 2022–23 | 2026 | Change |
| --- | --- | --- | --- |
| Credit block | $10 / 5,000 = $0.002 | $150 / 75,000 = $0.002 | flat |
| SMS (US/CAN) | 5 credits = $0.01 | 10 credits = $0.02 | **2x** |
| Instagram DM | 3 credits = $0.006 | 10 credits = $0.02 | **3.3x** |
| International SMS | 25 credits = $0.05 | 25 credits = $0.05 | flat |
| MMS | 10 credits = $0.02 | 20 credits = $0.04 | **2x** |
| Email | 1 credit = $0.002 | 1 credit = $0.002 | flat |
| Base plan | $25/mo | $25/mo | flat |

They held the headline subscription price and quietly doubled the metered rate. Facebook
Messenger and Discord (1 credit each in 2022) have disappeared from the 2026 price list
entirely.

**One inconsistency:** the pricing page lists "custom phone number" as included in Pro,
but Laylo's own blog says custom phone numbers are **$10/month**
([laylo.com/blog/set-up-a-custom-phone-number](https://laylo.com/blog/set-up-a-custom-phone-number)).
The blog post is undated and may predate a packaging change. A Trustpilot complaint
(§1.7) describes exactly this confusion costing a customer real money.

### 1.3 Funding history

**Confirmed**, from BusinessWire releases:

| Date | Event | Lead | Cumulative total |
| --- | --- | --- | --- |
| 26 Jul 2021 | Strategic investment round | Eldridge | **">$5M"** |
| 12 Oct 2022 | Strategic investment round | Eldridge | **">$8M"** |

2021 participants: Y Combinator; Charlie Walker and Charles Attal (founders, C3 Presents);
Jason Robins (CEO, DraftKings); Kevin Mayer (Candle Media / DAZN, ex-TikTok); Sony
Music's The Orchard; Moment Ventures.
([businesswire.com/news/home/20210726005637/en/](https://www.businesswire.com/news/home/20210726005637/en/Laylo-Announces-Strategic-Investment-Round-Led-by-Eldridge))

2022 participants: Third Prime Ventures; LVRN Management; Shane Mac (XMTP); Gil Weisblum
(Ranger Global); Patricio Worthalter (POAP); Jonathan Strauss (Create Music Group);
Damian Manning (HiFi); Summer Watson and Micah Johnson (Aku World); Sam Evitt (Method
Music); Moment Ventures.
([businesswire.com/news/home/20221012005885/en/](https://www.businesswire.com/news/home/20221012005885/en/Laylo-Announces-Latest-Round-of-Strategic-Investment))

Alec Ellin's LinkedIn headline reads "YC S20", and his education section lists Y
Combinator, Summer 2020 — so the company went through YC in 2020, a year before the first
announced round.

**Total raised: just over $8M, all of it seed-stage, none of it announced since October
2022.** That is nearly four years without a publicly announced raise, at a company that
is clearly still spending (remote team offsite, four open roles in June 2026, a senior
exec hire from Perplexity in July 2026).

Two readings, and I cannot distinguish them from public data: either they are
capital-efficient and near enough to profitable that they do not need to raise, or they
have raised quietly and not announced it. Ellin's public posts lean toward the first —
"our biggest month ever (again)" in June 2026 — but that is a founder talking.

**Aggregator numbers conflict badly and should not be used:**

| Source | Claim | Assessment |
| --- | --- | --- |
| CB Insights | Total raised **$4.5M** | Contradicts the 2022 press release. **Likely wrong.** |
| Tracxn | **$8M over 4 seed rounds** | Total matches. The per-round table is visibly garbled — it renders "1139310" as a funding amount and "8656224" as an investor. Ignore the detail. |
| LinkedIn data overlay | **$7.6M**, 4 prior rounds | Close to the press-release total; unattributed provider data. |
| Gaebler.com | "Laylo closed a **$8 million funding round** on 10/12/2022" | Misreads the *cumulative total* as the round size. Also files Laylo under "Industry: Blockchain" and lists a 2019-era company description. **Do not cite.** |

### 1.4 Scale signals — and why they don't add up

Laylo's own public numbers are internally inconsistent, which is itself a finding.

| Source | Date | Creators | Sales / GMV | Fan interactions |
| --- | --- | --- | --- | --- |
| Music Ally | Mar 2023 | **20,000** creators and brands | — | — |
| laylo.com homepage | Aug 2026 | **10,000** artists, events, creators | **$1BN revenue generated** | **150M+** |
| laylo.com blog (Shin hire) | Jul 2026 | **more than 10,000** | **$1B+ since 2021** | **250M+ fan actions** |
| laylo.com/integrations/samply | Aug 2026 | — | $1B in sales from drops | **250M+** |
| Alec Ellin, LinkedIn "About" | current | **40,000+ creators** | **$250M+ tickets, $75M+ merch** | "tens of millions of fans" |

The creator count has been stated as 20,000 (2023), 10,000 (2026 website) and 40,000 (CEO
bio) simultaneously. The GMV claim is $1B on the website and $325M in the CEO's bio. Fan
interactions are 150M on the homepage and 250M on the blog and the Samply page. **Treat
every one of these as a vendor claim with no reconciliation.** The most conservative
defensible reading is: order of 10,000 paying-or-active accounts, hundreds of millions of
messages, and hundreds of millions of dollars of attributable GMV.

Other scale signals:

- **200,000+ drops in 2025** (CEO, on the *You Had to Be There* podcast, published 12 Feb
  2026). **Vendor claim.**
- **30 million messages/month** as of the dot.LA profile (undated, but references the
  Clutch ChatGPT integration, so ~2023). **Vendor claim, stale.**
- **Revenue: $1M–$10M annual range, 20–30 employees.** **Third-party estimate**, from the
  data-provider overlay on Ellin's LinkedIn profile. Low confidence, but the headcount is
  consistent with the ~23 people Ellin named in his July 2026 retreat post.
- **Notable customers** (from the site's own logo wall and case studies): Ariana Grande,
  Sabrina Carpenter, Chappell Roan, Fred again.., Diplo, HAIM, Rosalía, Nicki Minaj,
  Lucy Dacus, Vampire Weekend, Gracie Abrams, Japanese Breakfast, All Time Low, JVKE,
  The Beaches, Cooper Alan, John Summit, Olivia Dean, Nate Bargatze, Usher; festivals
  CRSSD, Outside Lands, All Things Go, Hulaween, Teletech; plus DICE and Madeon. The
  festival and touring side looks like the real commercial centre of gravity.

### 1.5 Message delivery — channels and providers

**Confirmed channels (2026):** SMS, MMS, RCS, email, Instagram DM, Instagram comment
private replies, WhatsApp, ringless voicemail. **Discontinued or de-emphasised:** Facebook
Messenger and Discord, both priced at 1 credit in the 2022 doc and absent from the 2026
price list.

**Providers:**

- **SMS: almost certainly Twilio.** **Unverified but strongly indicated** — Laylo's own
  setup guide links customers to
  `support.twilio.com/hc/en-us/articles/1260800720410-What-is-A2P-10DLC-` for an
  explanation of registration. Laylo has never publicly named its CPaaS. The 10DLC
  mechanics they describe (Campaign Registry vetting, $15 one-time campaign vetting fee,
  3–5 business day registration, Sole Proprietor route recommended under 3,000
  messages/day, alphanumeric sender IDs outside the US) are standard Twilio.
- **Instagram: Meta's official Instagram Graph API.** **Confirmed** — requires an
  Instagram Business account, a desktop-only OAuth connection, and explicit Meta
  permission grants. Laylo is operating inside the sanctioned API, not scraping.
- **Email: provider not disclosed.** Laylo's help centre tells artists to set up a custom
  email sending domain for deliverability, which implies a standard ESP relationship.
- **WhatsApp: $450/month sender enablement**, priced as an add-on, i.e. a WhatsApp
  Business API number.
- **RCS: $1,500/year sender enablement**, verified sender with images and tappable
  buttons, falling back to SMS.

### 1.6 Recent news, 2025–2026

| Date | Event |
| --- | --- |
| Jul 2025 | The Beaches case study — email list +300% in 30 days, 56x over two years via Instagram DMs, giveaways and merch (**vendor claim**) |
| Sep–Oct 2025 | CRSSD, All Time Low case studies |
| 21 Nov 2025 | Cooper Alan case study — Instagram comment-to-DM becomes his #1 acquisition channel; 40,000 pre-saves; #1 Country iTunes album (**vendor claim**) |
| 12 Feb 2026 | Ellin on *You Had to Be There*: 200,000+ drops in 2025, $1B+ since 2021 |
| 27 Feb 2026 | Talking Heads-adjacent case study: Tour Suite, 2.5x fan list, >$50M gross ticket sales (**vendor claim**) |
| 4 Jun 2026 | **AI Ticket Sales Agent launched, DICE as launch partner**; Stranger Than among first promoters (Pollstar) |
| 18 Jun 2026 | Four open roles: Head of Finance, Account Manager (Dance & Pop), Account Executive, Customer Success |
| Jun 2026 | "Biggest month ever (again)"; team offsite + hackathon in the Catskills (~23 people named) |
| 16 Jul 2026 | **UGC Agent** launched — rights-cleared fan video capture, free to enable |
| 17 Jul 2026 | **Brian Shin hired from Perplexity as Head of Growth** |
| 5 Aug 2026 | **RealFan** anti-scalping suite publicised |
| 6 Aug 2026 | **Laylo x Samply** — fans unlock unreleased tracks by joining the Laylo list |
| 13 Aug 2026 | Hiring a Brand Editorial Lead |

**Signs of trouble: none found.** No layoffs, no shutdown, no acquisition, no down round
reported anywhere I searched. One employee departure (Natalia Genie, August 2026, to do an
MBA) — normal attrition, and she posted warmly about the company. The hiring, the senior
exec import, the DICE partnership and the shipping cadence all read as a company in
expansion, not distress. The only genuine question mark is the four-year gap since the
last announced raise.

**On Spotify's July 2026 refresh-token expiry:** this is real, it broke "forever
pre-saves" industry-wide, and Laylo has a workaround.

- **Confirmed, primary:** Spotify announced on 18 June 2026 that refresh tokens now expire
  **6 months from the user's original authorisation**. New apps: immediately. Existing
  apps: **from 20 July 2026**. Refreshing an access token does *not* reset the clock.
  Expired tokens return `400` with `{"error": "invalid_grant"}`, and the app must send the
  user back through the authorisation flow.
  ([developer.spotify.com/blog/2026-06-18-refresh-token-expiration](https://developer.spotify.com/blog/2026-06-18-refresh-token-expiration),
  [developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens))
- **Confirmed, trade press:** Music Ally, 31 July 2026 — "fans have to reauthenticate to
  keep their forever pre-saves active. Promotional tools have to be compliant with these
  changes as of July 2026." On the vendor responses: *"On Laylo, when a fan replies to a
  message or clicks a button within a message, Laylo immediately uses their cached data to
  trigger the pre-save again."* Hypeddit instead puts a one-tap reconnect button in its
  automated release emails.
  ([musically.com/2026/07/31/new-spotify-updates-change-how-forever-pre-saves-work/](https://musically.com/2026/07/31/new-spotify-updates-change-how-forever-pre-saves-work/))

The strategic read: Laylo's mitigation only works *because it already owns a messaging
channel to the fan*. A pre-save tool without SMS/email/DM has no way to re-prompt. Spotify
just made owning the message channel more valuable relative to owning the pre-save. That
is good news for Laylo and bad news for pure pre-save tools — and it compounds the
constraint already documented in `saas-productization-analysis.md` §1, where Spotify's
extended quota mode requires a registered business with ≥250,000 MAU, effectively closing
Spotify pre-save to new entrants entirely.

### 1.7 Reviews and complaints

**This is the thinnest part of the public record, and you should treat the gap as
meaningful.** Laylo has no G2 profile, no Capterra profile, and its Shopify app has
**0 reviews and a 0.0 rating** despite being live. Reddit search returns 403 to automated
fetching; several blogs claim to summarise Reddit sentiment about Laylo but cite no
threads and quote no users — I am confident those summaries are fabricated (§6).

The only real user reviews I found are **7 reviews on Trustpilot**
([trustpilot.com/review/laylo.com](https://www.trustpilot.com/review/laylo.com)). Small
sample, self-selected, but the complaints are specific and internally consistent:

1. **Undisclosed add-on costs, especially around SMS.** *"Spent SO much money on the
   texting phone plan thing only for it to not work as intended and leaving out very
   important details. These details and add on charges need to be said in the BEGINING of
   purchasing the subscription, not later when you are advertising that the platform is
   for SMS notification but that means buying another add on and buying a completely new
   number... we all hate them here in denver as many of us experienced the same thing."*
   This matches the pricing ambiguity I found independently in §1.2 — the pricing page
   implies the custom number is bundled into Pro, the blog says $10/month, and Instagram
   Comments, WhatsApp, RCS and voicemail are all separately priced.
2. **SMS delivery failures on presale codes.** Two separate reviews. One fan missed
   Laneway Festival tickets: *"Did not receive my Laylo Laneway Festival presale code so I
   missed out on buying tickets... does not work at all with presale codes, this is tooo
   bad. understand many people have the same problem, for weeks."* Another: *"Catastrophic
   experience, SMS codes repeatedly not sent... long-lasting server problems, not fixed."*
3. **Poor international performance.** *"It doesn't work at all outside the US."*
   Consistent with the pricing structure — international SMS is 2.5x the US rate and
   depends on alphanumeric sender IDs.
4. **Fan-side perception as a spam funnel.** One review titled "SMS spammerd" complains
   about having to give a phone number before seeing an unsubscribe path.
5. **Customer support.** Named as a problem in two of the negative reviews.

⚠️ One of the seven is a five-star review that reproduces Laylo's own homepage copy almost
phrase for phrase ("juggling email, SMS, presaves, and merch sales across different
platforms... Laylo replaced all of them in one"). I would treat it as solicited or
inauthentic.

**The pattern worth acting on:** the complaints are not about the product concept. They
are about *SMS reliability at the exact moment it matters* (presale code delivery), about
*surprise add-on billing*, and about *non-US coverage*. Those are the seams.

---

## 2. The competitive set

### 2.1 Community.com — **alive, pivoted, larger than Laylo**

⚠️ **Your instinct that it "had trouble" is half right, but the popular story is wrong.**
There is an article titled "Why Community Failed" on unicornburn.com asserting the company
"ceased operations" in 2024 after raising $113M. **That is false.** community.com is live
today, publishes a 2026 blog, carries a SOC 2 Type 2 report with a compliance check dated
**21 August 2026**, and lists a full executive team. See §6 for why that page is spam.

What actually happened, **confirmed**:

- Founded 2019 by Guy Oseary, Ashton Kutcher, Josh Rosenheck and Matthew Peltier
  ([community.com/about](https://community.com/about)).
- **$25M raised April 2023**, with returning investor Salesforce Ventures plus Morgan
  Stanley Next Level Fund, HubSpot, Pier 70 Ventures, Verizon Ventures, GSW Ventures,
  Backstage Capital and Wocstar Fund. Diankha Linear appointed President & CEO; Robert
  Wolf Chairman.
  ([businesswire.com/news/home/20230424005259/en/](https://www.businesswire.com/news/home/20230424005259/en/Community-the-SMS-Engagement-Platform-Secures-%2425MM-in-Funding-to-Fuel-Its-Rapid-Growth-and-Expansion))
- **Total funding ≈ $115M**, with the April 2023 round labelled Series C
  (**third-party estimate**, Built In).
- **CEO change again: Jeremy Schultz joined November 2024.** Six further C-suite
  appointments announced 13 May 2025.
  ([accessnewswire.com/newsroom/en/computers-technology-and-internet/community-appoints-new-c-suite-leadership-team-1026803](https://www.accessnewswire.com/newsroom/en/computers-technology-and-internet/community-appoints-new-c-suite-leadership-team-1026803))
- **The pivot:** from "celebrities text their fans" to enterprise conversational
  messaging. Channels now SMS, MMS, WhatsApp, Apple Messages for Business, and RCS (early
  access). Verticals include retail, politics and advocacy, sports teams. Music is one
  segment among several, not the identity.
- **Pricing: custom only.** Three named tiers — Small Business, Mid Market, Enterprise —
  with no published figures. [community.com/pricing](https://community.com/pricing)
  requires a quote request.

**Real trouble signals** (**third-party estimate**, Built In's automated company analysis):
prior layoffs and fluctuating headcount, and successive CEO appointments across 2023–2024.
Three CEOs in roughly five years is a lot. But the company is operating, hiring and
shipping.

**Read-across for you:** Community is the cautionary tale, not because it died but because
it had to *stop being a music company* to survive. Celebrity-to-fan SMS as a standalone
business did not sustain $115M of venture expectations.

### 2.2 Subtext — **alive and growing fast; the most under-rated player here**

**Confirmed**, from a GlobeNewswire release dated 25 March 2026
([globenewswire.com/news-release/2026/03/25/3262208/0/en/](https://www.globenewswire.com/news-release/2026/03/25/3262208/0/en/Subtext-Surpasses-28-Million-Subscribers-and-10-Billion-Messages-in-2025-Achieves-105-Revenue-Growth-YoY.html)):

- **28 million subscribers**, +200% year over year.
- **Revenue +105% year over year.**
- **10 billion messages** sent in 2025.
- **Churn below 1%.**
- Clients: NBCUniversal, **Sony Music, Warner Music**, Forbes, Hearst, USA Today Network,
  The Washington Post, **SoundCloud**.
- Fast Company's 2025 World's Most Innovative Companies list.

Background: founded 2019 inside Advance Local's Alpha Group incubator, its fourth spinout.
Operates in 200 countries. Two revenue models — a platform licence plus message volume
(publishers), or a paid fan-subscription revenue share (individual creators), Substack-style.

**Pricing: no public rate card**, but there is one hard number and it is the most
important price in this document. **Confirmed**, from the SoundCloud partnership announced
July 2025: Subtext is a **SoundCloud Artist Pro benefit at a 41% discount — $41.25/month
billed annually, including a dedicated channel and up to 10,000 text messages per month.**
([hypebot.com/soundcloud-adds-sms-text-messages/](https://www.hypebot.com/soundcloud-adds-sms-text-messages/),
[info.joinsubtext.com/blog/subtext-and-soundcloud-team-up-to-bring-artists-and-fans-closer-together-through-sms](https://info.joinsubtext.com/blog/subtext-and-soundcloud-team-up-to-bring-artists-and-fans-closer-together-through-sms))

That implies an undiscounted list price around **$70/month** and an all-in effective cost
of **~$0.004 per message at the cap** — roughly **one fifth of Laylo's $0.02 per SMS
segment.** Subtext also explicitly **charges per message, not per segment**: a message that
splits into three SMS segments still costs one message. Laylo charges per segment.

**This is the single sharpest competitive fact in the whole research.** A DSP is bundling a
cheaper, better-metered SMS product to independent artists, and Laylo's per-segment
pricing looks expensive next to it.

### 2.3 SuperPhone — **alive, small, effectively a lifestyle business**

- Founded April 2015 by Ryan Leslie; he is still Founder & CEO.
- **Pricing: confirmed**, from the Shopify App Store listing. Three tiers, all quoted as
  *minimum* fees with metered overages:

| Tier | Monthly minimum | Subscriber overage | Message overage | Sized for |
| --- | --- | --- | --- | --- |
| Growth | **$19.99** | $0.10/subscriber | $0.01/message | 100 subscribers, 1,000 messages |
| Scaling | **$99.99** | $0.08/subscriber | $0.01/message | 550 subscribers, 5,500 messages |
| High Volume | **$499.99** | $0.01/subscriber | $0.01/message | high volume |

  ([apps.shopify.com/superphone](https://apps.shopify.com/superphone))

- **$0.01 per message across all tiers — half Laylo's SMS rate.**
- Holds a US patent, **US 11114087 B1**, "Automated Digital Conversation Manager".
- **Third-party estimates, low confidence and mutually inconsistent:** SignalHire says
  10–50 employees, <$1M revenue, $1.5M total funding; the LinkedIn data overlay says 10–20
  employees (4–5% YoY decline) and $6.5M total funding across 5 rounds. Do not rely on
  either.
- Best-known campaign: Bad Bunny's 2022 *Un Verano Sin Ti* push, where the team targeted
  750,000 phone numbers via a fake Bugatti classified listing with a voicemail teaser
  (per CB Insights' write-up of an ADWEEK panel). Leslie says he keeps in touch with
  150,000+ people via his own SuperPhone; a CB Insights piece cites 53,000 superfans.

**Read-across:** eleven years in, SuperPhone is still tiny. That is evidence about the
size of the standalone artist-SMS niche.

### 2.4 Bandsintown for Artists — **the free-tier problem**

**Confirmed scale** (Music Business Worldwide, 2026): **100 million registered fans**
across 196 countries, **700,000+ registered artists**, 65,000 venues and promoters, 2.3M
events, 450M personalised recommendations/month, adding ~900,000 fans and 5,000 artists
monthly. Distribution partnerships with Spotify, Apple Music, YouTube Music, Amazon Music,
Google, Shazam and Bing; integrations with Linktree and Feature.fm.
([musicbusinessworldwide.com/live-music-discovery-platform-bandsintown-reaches-100m-registered-users/](https://www.musicbusinessworldwide.com/live-music-discovery-platform-bandsintown-reaches-100m-registered-users/))

**Pricing — confirmed, from their own help centre:**

- **Posts:** unlimited messages to followers via email and push notification, **free**.
- **Email Builder: 10,000 free emails per month.** Beyond that: **$0.002/email** for your
  own collected contacts, **$0.06/email** for Bandsintown-sourced followers.
  ([help.artists.bandsintown.com/en/articles/7053479-how-much-does-it-cost-to-use-the-email-builder](https://help.artists.bandsintown.com/en/articles/7053479-how-much-does-it-cost-to-use-the-email-builder), updated 19 May 2026)
- **Presale SMS alerts: $0.016 per SMS**, $1.00 minimum per campaign, **US and Canada
  only**. Charged on successful delivery.
  ([help.artists.bandsintown.com/en/articles/9579809-launch-presales-for-your-tours-and-events](https://help.artists.bandsintown.com/en/articles/9579809-launch-presales-for-your-tours-and-events))
- **Promoted Campaigns:** paid reach to fans of similar artists, **$50 minimum**.

**This is the free-tier floor of the entire category.** An indie artist gets unlimited
posts plus 10,000 emails a month for nothing, and presale SMS at 20% below Laylo's rate.
Bandsintown's email price for own-collected contacts is *identical* to Laylo's ($0.002).
Anything you build has to be meaningfully better than free.

### 2.5 Link-in-bio and creator platforms

**Linktree.** ⚠️ **Medium confidence — I could not retrieve Linktree's own pricing page,
and every source below is an affiliate or competitor blog.** They agree with each other,
which is weak corroboration at best, since they may all be scraping the same page. Four
tiers: **Free $0 / Starter $8 / Pro $15 / Premium $35** per month, with annual discounts.
Seller fee on digital sales: 12% / 9% / 9% / 0%. **Email and SMS subscriber capture
unlocks at Pro ($15).** Audience integrations with Mailchimp, Klaviyo, Kit and Google
Sheets at Pro. **Instagram auto-replies capped at 2,500/month on Pro, unlimited on
Premium.** One source states prices rose in November 2025 from $5/$9/$24 — **unverified**.

**Beacons.** **Confirmed from beacons.ai's own pricing page**: a $0/month free-forever
plan; paid plans from **$10/month** ($8.33 annual). Four tiers per secondary sources:
Free $0 / Creator $10 / Creator Plus $30 / Creator Max $90. **9% seller fee on Free and
Creator, 0% on Plus and Max.** Free plan includes a bio page, media kit, unlimited digital
products, **Smart Reply Auto-DMs**, and 50 email sends/month; Creator 500/month; Plus
unlimited email. ⚠️ Funding is unclear — one aggregator's page titles itself "$23.0M" and
says "$30M Total Raised" in the body. Ignore both.

**Komi.** Alive. Positions as a "creator ecosystem": link-in-bio mini-sites, brand-deal
matching, digital product monetisation, and explicitly **"capture and own your fan data"**.
Claims 100,000+ creators, and names Kim Kardashian, The Rock, Usher and Amelia
Dimoldenberg. 14-day free trial, no public price list found. Funding ~$18M
(**third-party estimate**, low confidence).

**Fanfix.** Alive but **not really a competitor** — it is a paid-subscription content
platform (exclusive posts, PPV, paid DMs) under SuperOrdinary, not a fan-messaging CRM.
Notable instability: **both co-founders have now left.** Harry Gestetner departed April
2025 (now founder/CEO of Orion); Simon Pompan stepped down as CEO in March 2026 (joined
fintech Erebor). Dylan Harari took over, then announced his own departure on 17 August
2026, on the way out citing **$300M cumulative creator payouts and 7M+ active paying
users** (**vendor claim**, from a departing exec's LinkedIn post). Creators reportedly
migrating to lower-fee platforms like Passes (which advertises a 10% take rate).

**Passes.** Adjacent, not competing: creator monetisation with mass DMs, paid DMs,
memberships, 1:1 calls; 90% creator revenue share. **$66M raised** (**third-party
estimate**).

### 2.6 Ecommerce SMS — the horizontal threat

These are the companies that could flatten the vertical if they ever cared to. They
mostly don't, which is the opportunity.

**Klaviyo — the most reliable data in this entire document, because it files with the
SEC.**

| Metric | Value | Source |
| --- | --- | --- |
| FY2025 revenue | **$1.234B**, +31.6% YoY | FY26 annual report |
| Q2 FY2026 revenue | **$370.6M**, +26% YoY | Q2 FY26 earnings release |
| Annualised run rate | **~$1.5B** | Q2 FY26 |
| FY26 guidance | **$1.526B–$1.534B**, +24% | Q2 FY26 |
| Total customers | **>205,000** | Q2 FY26 |
| Customers >$50k ARR | **4,477**, +36% YoY | Q2 FY26 |
| Q2 FY26 gross margin | 73% (non-GAAP 73.4%, **down ~3pts YoY**) | Q2 FY26 |

([sec.gov/Archives/edgar/data/1835830/000183583026000039/confidentialfiscalq22026ea.htm](https://www.sec.gov/Archives/edgar/data/1835830/000183583026000039/confidentialfiscalq22026ea.htm),
[sec.gov/Archives/edgar/data/1835830/000183583026000020/kvyo-2026arsfinal.pdf](https://www.sec.gov/Archives/edgar/data/1835830/000183583026000020/kvyo-2026arsfinal.pdf))

**The single most important line in Klaviyo's Q2 FY26 filing, for your purposes:** gross
margin fell about three points year over year, *"driven largely by a mix shift toward
faster-growing text messaging"* and *"higher carrier fees in that channel, which had
previously been absorbed."* Klaviyo **updated its mobile pricing in Q3 2026 to pass
through carrier fee increases, including T-Mobile's, to customers.**

Read that twice. The best-run public company in this space is telling investors that SMS
is a **structurally lower-margin business than email, and getting worse**. Any business
plan of yours that assumes fat margins on resold SMS is wrong.

Klaviyo prices by active consumer profiles plus email/SMS/WhatsApp volume, does not
charge per seat, and offers a free tier (250 contacts, 500 emails/month —
**unverified**, from a secondary source).

**Attentive.** Private, SMS-first, now expanding into email.

- **$470M Series E, June 2021, at ~$6.9–7.0B post-money**, led by Coatue with Tiger
  Global, IVP, Bain Capital Ventures, Sequoia, Wellington and others.
- **Total raised ~$863M–$922M** (Sacra and Contrary say $863M; PitchBook and one
  aggregator say $922M as of March 2025). **Third-party estimates, sources disagree.**
- **$500M ARR announced January 2025** for full-year 2024. 8,000+ brands, ~10B messages
  per year as of March 2025.
- IPO planned for mid-2024, **shelved** — Contrary attributes this partly to Klaviyo's
  weak post-listing performance.
- **Secondary marks $2.7B–$5.8B** per mutual-fund holders like BlackRock — i.e. **a
  substantial markdown from the 2021 peak**.
  ([research.contrary.com/company/attentive](https://research.contrary.com/company/attentive))

⚠️ There are 2026 articles on ecommerce-times.com giving wildly different figures — a
"$10B valuation in its 2021 Series E", a "$1.9B valuation from its 2024 secondary", and a
Klaviyo with "$915M TTM revenue and 167,000 paying accounts." All contradict primary
sources. See §6.

**Postscript.** Shopify-native SMS. ⚠️ **I could not verify anything about it from a
primary source.** A search synthesis attributed "$60 million in annual revenue" to it, and
one calculator site estimated "$0–$1,500/month, est. $300/mo". **Treat both as unverified.**
Postscript is real and well-known in the Shopify ecosystem, but I have no defensible 2026
numbers for it.

**Why the horizontals don't currently threaten Laylo:** their entire product surface
assumes a store, a cart, a catalogue and a purchase event. Nothing in Klaviyo understands
a tour routing, a presale code, a pre-save or a drop page. Klaviyo's Shopify integration
is deeper than Laylo's; Laylo's understanding of what an artist actually does is deeper
than Klaviyo's. That gap is the whole reason Laylo exists — and the reason a smaller,
sharper vertical tool can also exist.

### 2.7 New entrants, 2025–2026

**In music specifically:**

- **Belong** — launched from stealth July 2026, New York. Founded by **Nick Holmstén**
  (ran Spotify's music team until 2019) and **Ash Pournouri** (Avicii's former manager).
  Backed by Troy Carter, Chris Zarou and Hans Vestberg. Verifies fans via **bank-grade
  KYC**, builds a "Know Your Fan" graph across streaming, social, merch and ticket
  history, and issues a branded wallet "Passport" per artist that unlocks face-value
  presale access and member-only drops. First artist programs invitation-only. 18 months
  in stealth.
  ([musicbusinessworldwide.com/nick-holmsten-and-ash-pournouri-officially-launch-superfan-startup-belong.../](https://www.musicbusinessworldwide.com/nick-holmsten-and-ash-pournouri-officially-launch-superfan-startup-belong-backed-by-troy-carter-chris-zarou-and-hans-vestberg/))
- **Clique Apps** — launched **29 July 2026**, Los Angeles. Builds each artist a
  standalone branded iOS app in about a week, on shared infrastructure, with toggleable
  modules including **direct fan messaging**, community, monetisation and ticketing.
  Invite-only.
  ([musicbusinessworldwide.com/clique-apps-enters-the-superfan-market.../](https://www.musicbusinessworldwide.com/clique-apps-enters-the-superfan-market-with-standalone-apps-built-for-individual-artists/))
- **Openstage** (openstage.live) — the closest direct Laylo clone I found. Fan data
  consolidation across streaming, social, ticketing, merch, plus email, SMS, Instagram
  DMs, landing pages, smart links, pre-saves, **forever saves**, link-in-bio, contests,
  surveys, fan uploads, "call fans", segmentation and automations. No public pricing.
- **EVEN** — direct-to-fan sales with Luminate/Billboard chart reporting; a Secretly
  Distribution partnership (announced July 2025) auto-creates storefronts for distributed
  artists. Scale claims (80,000+ artists, 2,200+ labels, 110+ countries, $20+ average
  fan spend) come from a single SEO-heavy blog — **unverified**.
- **SoundCloud acquired Nina Protocol** in 2026, after Nina announced it was winding down
  its standalone platform.

**In Instagram DM automation aimed at musicians** — a genuinely crowded cohort of
2025–2026 micro-startups, all cheap, all Instagram-only, all marketing themselves via
AI-generated SEO content: **CreatorFlow** ($15/mo, has a `/for/musicians` page),
**Inro** (Free 100 contacts / Pro €12.99/mo, has a `/solutions/artists` page),
**InstantDM** ($8–9.99/mo, unlimited contacts), **ReplyKaro** (free-forever 100 DMs/month,
`/use-case/musicians`), **ReplyRush**, **Spur**, **Regent**, **BooSend**, **UnlockDM**,
**IGMsg**. None of them publish verifiable customer counts. I would assume most are
sub-$1M ARR and some will not exist in a year — but collectively they have already priced
the floor of comment-to-DM at under $15/month with unlimited contacts.

**The competitive summary you actually need:**

| Player | Status | Base price | Per-SMS | Music-native? |
| --- | --- | --- | --- | --- |
| **Laylo** | Growing, ~$8M raised, no round since 2022 | $25/mo | **$0.02/segment** | Yes, deeply |
| **Subtext** | Growing fast, +105% rev | ~$70/mo list; **$41.25/mo via SoundCloud** | **~$0.004** at cap, per *message* | Partly |
| **Bandsintown** | 100M fans, 700k artists | **Free** | **$0.016** (presale only, US/CAN) | Yes |
| **SuperPhone** | Alive, small, 11 years old | $19.99–$499.99/mo | **$0.01** | Somewhat |
| **Community** | Alive, pivoted to enterprise | Custom quote | Not published | No longer |
| **Openstage** | Active clone | Not published | Not published | Yes |
| **ManyChat** | $163M raised, profitable | $0–$139/mo by contacts | n/a (IG DM) | No |
| **Klaviyo** | $1.5B run rate, public | By profiles + volume | Passing through carrier hikes | No |

---

## 3. Market demand signals

### 3.1 Is artist-to-fan SMS/DM growing?

**Growing — but the growth is in the horizontal and enterprise layers, not obviously in
the artist niche.** Evidence, strongest first:

**Confirmed, primary:**

1. **Klaviyo's SEC filings** show text messaging is its *fastest-growing* channel, growing
   faster than the rest of a $1.5B run-rate business — while simultaneously compressing
   gross margin by ~3 points because of carrier fees. Demand up, unit economics down.
2. **Subtext's March 2026 results**: subscribers +200% YoY to 28M, revenue +105% YoY,
   churn <1%. That is a real, audited-adjacent growth curve in exactly this category,
   including music clients (Sony, Warner, SoundCloud).
3. **ManyChat raised $140M on 22 April 2025**, led by Summit Partners, bringing total
   funding to **$163.3M** since 2015. The company was **already profitable**, has around
   **1.5 million customers across 170 countries**, and sends "billions" of messages
   annually across Instagram, WhatsApp, Messenger and TikTok.
   ([summitpartners.com/news/manychat-raises-140m...](https://www.summitpartners.com/news/manychat-raises-140m-to-fuel-the-future-of-ai-driven-customer-engagement-on-social-and-messaging-platforms),
   [techcrunch.com/2025/04/22/manychat-taps-140m-to-boost-its-business-messaging-platform-with-ai/](https://techcrunch.com/2025/04/22/manychat-taps-140m-to-boost-its-business-messaging-platform-with-ai/))
4. **SoundCloud bundled Subtext into Artist Pro in July 2025.** A DSP paying to put SMS in
   front of independent artists is a strong demand signal — and simultaneously the
   strongest pricing threat in the market.
5. **Bandsintown added SMS presale alerts** to a free product with 700,000 artists.
6. **Community expanded channels** into WhatsApp, Apple Messages for Business and RCS.

**Counter-evidence, and it is not trivial:**

- **Community.com is the control experiment.** Roughly $115M raised on "celebrities text
  their fans", three CEOs, prior layoffs, and a pivot away from creators toward enterprise.
  The creator-SMS thesis did not carry that much capital.
- **SuperPhone is eleven years old and still has 10–20 employees.**
- **Laylo has not announced a raise since October 2022.**
- **Carrier economics are deteriorating**, per Klaviyo's own disclosure. The cost floor
  under everyone's SMS margin is rising.

**Honest verdict: the category is growing, the *artist-specific* segment is growing more
slowly than the horizontal, and margin on the SMS leg is shrinking. The growth in the
artist niche is concentrated in live events and touring — which is where Laylo's DICE
partnership, Ticket Sales Agent, RealFan and festival logo wall are all pointed.**

### 3.2 SMS vs email conversion in 2026

I found exactly one benchmark I would use for planning, because it is built on a real
platform dataset with monthly granularity rather than a round number in a blog post.

**Omnisend, 2025 dataset** ([omnisend.com/blog/sms-marketing-benchmarks/](https://www.omnisend.com/blog/sms-marketing-benchmarks/)):

| Metric | SMS campaigns | Email campaigns | SMS automations | Email automations |
| --- | --- | --- | --- | --- |
| Click-through rate | **12.39%** | **0.74%** | **20.34%** | **4.66%** |
| Conversion rate | **0.12%** | **0.08%** | **0.78%** | **1.49%** |
| Revenue per message | **$0.150** | — | — | — |

Two things jump out. First, **SMS wins clicks by roughly 17x and wins conversion by only
1.5x** — the click advantage does not carry through to purchase. Second, **email
automations out-convert SMS automations (1.49% vs 0.78%)**, which is the opposite of the
industry folklore. Note also the seasonality: SMS campaign CTR ranged from **3.47% in
January to 23.92% in December**, so any single-point CTR benchmark is meaningless without
a month attached.

**Corroborating range** (SAP Emarsys omnichannel benchmarks): email open 35–45%, email CTR
1.5–4%, unique email CTR 1–3%; **SMS CTR 10–30%**, SMS open 90–98%, SMS unsubscribe
0.3–1.5%.
([emarsys.com/learn/blog/omnichannel-engagement-benchmarks/](https://emarsys.com/learn/blog/omnichannel-engagement-benchmarks/))

**Media & entertainment email CTR: 2.31%**; all-industry average 2.62%
(digitalapplied.com compilation, **unverified aggregation**).

⚠️ **Numbers to distrust.** "SMS has a 98% open rate versus email's 20%" appears verbatim
across dozens of 2026 pages and is never sourced to a dataset. Subtext's own **2026 SMS
Benchmark Report** — 98% open rate, 95% opened within three minutes, CTR above 20% in five
of eight industries — is at least computed over a real corpus (10 billion messages), but it
is a **vendor claim measuring the vendor's own best-case channel**, and "open rate" for SMS
is not directly measurable the way email opens are. Similarly, Attentive's "$8.60 ROI per
dollar" and "19.3% median click rate" reach me only via a third-party blog quoting the
report, not the report itself.

**The number that should shape your product thinking:** at Omnisend's $0.150 revenue per
SMS and Laylo's $0.02 per segment, gross margin on a *well-run ecommerce* SMS send is
about 87%. For a musician sending a "new single is out" text with no purchase attached,
revenue per message is effectively zero and the $0.02 is pure cost. **Artist SMS is
economically much weaker than ecommerce SMS, and that is why the artist-native players are
all small.**

### 3.3 Market size

⚠️ **The A2P market-size reports disagree by more than 40% for the same year. Use them as
mood lighting, not as inputs.**

| Source | 2026 market size | Forecast |
| --- | --- | --- |
| Mordor Intelligence | **$54.22B** | $65.05B by 2031, 3.71% CAGR |
| GII / Business Research (enterprise A2P) | **$58.44B** | $81.61B by 2034, 4.3% CAGR |
| Coherent Market Insights | **$70.91B** | $101.79B by 2033, 5.3% CAGR |
| The Business Research Company | **$77.14B** | $99.97B by 2030, 6.8% CAGR |
| Grand View Research | **$77.43B** | $125.79B by 2033, 7.2% CAGR |

CRM applications are put at **32.9%–40%** of that. Music is an invisible rounding error
inside it.

**The music-specific number worth quoting** is Goldman Sachs' *Music in the Air*: superfan
monetisation represents a **$4.3 billion annual revenue uplift**, based on 2026
projections, assuming 20% of paid streaming subscribers are superfans spending 2x the
average. Luminate data underneath it: US superfans spend **66% more on live music** and
**2x on physical**. ⚠️ Note the provenance carefully — this figure is from the **June 2025
edition** (published 3 June 2025, 91 pages, led by Lisa Yang), not a 2026 report, even
though 2026 articles cite it as "recent."
([musicbusinessworldwide.com/emerging-markets-superfans-and-price-rises-7-takeaways.../](https://www.musicbusinessworldwide.com/emerging-markets-superfans-and-price-rises-7-takeaways-from-goldman-sachs-new-music-in-the-air-report/))

**How many artists use fan-messaging tools? ⚠️ No reliable public number exists.** The
available data points do not combine into an estimate: Laylo says 10,000 (and 20,000, and
40,000); Bandsintown has 700,000 artists but that is event listings, not messaging;
Subtext's 28M subscribers span media, sports, politics and music; ManyChat's 1.5M
customers are overwhelmingly not musicians. Anyone quoting you a TAM for "artist fan
messaging" made it up.

### 3.4 Are artists moving budget from social to owned channels?

⚠️ **There is no hard spend-reallocation data. I looked for it and it does not exist
publicly.** Every article asserting the shift is SEO content with no survey, no panel and
no spend figures behind it.

What *does* exist is **strong circumstantial evidence from platform behaviour**, which is
arguably better:

- SoundCloud paid to bundle SMS into Artist Pro (July 2025).
- DICE partnered with Laylo on an AI ticket-sales agent (June 2026).
- **Warner Music Group is building its own superfan app**; CEO Robert Kyncl says WMG is
  *"focused on making sure that artists get data on these superfans."*
- Belong raised and launched an entire company around KYC-verified fan identity (July 2026).
- Spotify tightening third-party token access (July 2026) *increases* the value of owned
  channels by making rented ones less durable.
- Goldman Sachs put a $4.3B number on superfan monetisation and the whole industry started
  quoting it.

And one useful piece of adversarial framing from Laylo's own CEO, worth reading because it
is the pitch you would be arguing against — an artist showed him "20,000 fans" from a
presale who turned out to be reachable at only ~3,500, because the other 80% never ticked
the second "also share my info with the artist" box on the ticketing platform. Whether the
80% figure is accurate is **unverified**, but the mechanism is real and it is the strongest
argument for owned capture that exists.

---

## 4. Comment-to-DM automation in music

### 4.1 What Meta actually permits — the rules, from Meta

**Confirmed, primary** (developers.facebook.com/docs/instagram-platform/private-replies and
/docs/messenger-platform/instagram/features/private-replies/ and /docs/instagram-platform/overview):

- **One private reply per comment.** Not per person — per comment.
- **Must be sent within 7 days** of the comment's creation, for posts, ad posts and reels.
- **Instagram Live comments: replies only during the broadcast.** Once it ends, never.
- **Follow-ups only if the recipient responds**, and then within **24 hours of their
  response**.
- **Rate limits: 750 calls/hour per Instagram professional account** for private replies to
  post and reel comments; **100 calls/second** for Live comments.
- The Human Agent tag extends the window to 7 days, but only for genuine human support.
- Invalid targets return **error 100, subcode 2534025** ("The comment is invalid for a
  private reply").
- Requires an Instagram professional account, a linked Facebook Page as the OAuth surface,
  and `instagram_manage_messages` + `instagram_manage_comments` scopes via an app that has
  passed Meta App Review.

**⚠️ Three widely-repeated claims I could NOT verify, and one I believe is wrong:**

1. **"Meta cut the automated DM limit from 5,000 to 200 per hour in October 2024."** This
   appears on keyapi.ai, replyrush.com, spurnow.com and others. **It contradicts Meta's own
   published 750 calls/hour.** One of the vendor blogs (creatorflow.so) is honest enough to
   say the ~200/hour figure is *"a convention the tools set, not a Meta-published number."*
   **I believe the 200/hour figure is tool-imposed throttling being misreported as Meta
   policy.**
2. **"One automated DM per user per 24 hours from comment or Story triggers, new in 2026."**
   Plausible, appears in several vendor blogs, **not found in Meta's documentation**.
3. **"Message tags CONFIRMED_EVENT_UPDATE, ACCOUNT_UPDATE and POST_PURCHASE_UPDATE were
   deprecated on 27 April 2026 and now return error 100."** Repeated consistently across
   vendors, which is mildly corroborating, but **I could not confirm it** —
   developers.facebook.com returned HTTP 400 to every automated fetch I attempted. If this
   matters to your build, check the Messenger Platform changelog manually in a browser.

**The constraint that matters most for a download-gate business: Instagram DMs cannot carry
file attachments.** No ZIPs, no audio, no PDFs. Everything must be a link to externally
hosted content. This is consistently stated across every source, though I could not
primary-verify it. **It means "comment-to-DM + file delivery" is necessarily
"comment-to-DM + link to a gated download page" — which is precisely the shape of the
product you already have.**

**A second constraint, and it does not apply to comment-to-DM but does bound the wider
product:** Meta's Marketing Messages (formerly Recurring Notifications) — the mechanism
for *recurring promotional broadcast* outside the messaging window — was closed to new
integrations on **1 September 2025**, and the Messenger version was deprecated on
**10 February 2026**. Existing partners keep it; there is no application process to join
them. So everything in this section about comment-to-DM remains fully available to a new
entrant, but "message your whole Instagram list whenever you drop" is not. Laylo, which
integrated years earlier, is on the right side of that line. See
[`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md) §3.2 for
the primary-source detail and what it implies.

### 4.2 How widely is it used in music?

⚠️ **No independent adoption data exists.** Nobody has surveyed musicians about
comment-to-DM. What follows is inference from where vendors are pointing their money.

**Strongest signal: the category leader charges extra for it, and its own case studies lead
with it.**

- Laylo sells **Instagram Comments as a $15/month paid add-on** — 60% on top of the $25
  base plan. You do not put a feature behind a separate paywall unless people want it
  badly enough to pay twice.
- Laylo's Instagram integration page claims **"Capture 40% more opt-ins with keywords."**
  (**Vendor claim.**)
- Laylo's Cooper Alan case study (21 November 2025) is the most detailed public account of
  the mechanic in music: he teased an album on Instagram and asked fans to comment or DM
  the keyword **"snippet"**; Laylo's comment and DM automations delivered an exclusive
  preview plus a one-click signup; *"Every comment and DM became a new phone number or
  email"*; **"Instagram is now Cooper's #1 acquisition channel"**; he generated **40,000
  pre-saves** and debuted **#1 on the Country iTunes Album Chart**. (**Vendor case study** —
  no control, no baseline, no attribution methodology.)
  ([laylo.com/case-studies/cooper-alan](https://laylo.com/case-studies/cooper-alan))
- **The Beaches**: **email list +300% in 30 days**, 56x over two years, via Instagram DMs,
  giveaways and merch drops. (**Vendor case study.**)

**Second signal: a whole cohort of tools has built musician-specific landing pages.**
CreatorFlow `/for/musicians`, Inro `/solutions/artists`, ReplyKaro `/use-case/musicians`.
Vendors build vertical landing pages when they see vertical search volume. That is
indirect evidence of real demand — but it is evidence about *search traffic*, not about
paying customers.

**My honest read: comment-to-DM is now standard practice among promotionally-sophisticated
artists and producers, and near-zero among everyone else. But I cannot put a number on it,
and neither can anyone else.**

### 4.3 Which tools do musicians actually use?

| Tool | Price (2026) | Model | Notes |
| --- | --- | --- | --- |
| **ManyChat** | Free (25 contacts) / $14 / $29 / $69 / $139 annual; $17/$39/$99/$199 monthly | Per active contact | Meta + TikTok Business Partner. ⚠️ Prices below are from secondary sources only — manychat.com/pricing sits behind Cloudflare and blocked every fetch. |
| **Laylo** | $25/mo + **$15/mo** IG Comments add-on | Flat + credits | Only tool combining comment-to-DM with SMS/email CRM |
| **Inro** | Free (100 contacts) / Pro €12.99/mo | Per active contact | Instagram-only, AI agent on Pro, states Meta Tech Provider |
| **InstantDM** | ~$8–9.99/mo | **Flat, unlimited contacts** | Instagram-only |
| **CreatorFlow** | $15/mo | Flat | Has a musicians page |
| **ReplyKaro** | Free forever, 100 DMs/mo | Flat | Has a musicians page |
| **Beacons** | Included free ("Smart Reply Auto-DMs") | Free tier | Bundled into link-in-bio |
| **Linktree** | Pro $15/mo, 2,500 auto-replies/mo | Included | Unlimited on Premium $35 |

**⚠️ ManyChat's March 2026 repricing is the most important development in this row, and it
creates an opening.** Multiple independent secondary sources agree that on **2 March 2026**
ManyChat restructured from a simple two-tier model to five tiers and **cut the free plan to
25 active contacts** with a "Sent via ManyChat" watermark on every DM. Overage runs roughly
$0.10/contact on Essential, $0.05 on Pro, $0.025 on Business. AI features are a **separate
$29/month add-on**.

The consequence, stated bluntly by several of the competitor blogs and inherently
plausible: **a single viral reel with a comment-to-DM campaign blows through the contact
cap and spikes the bill.** ManyChat's pricing is now actively hostile to exactly the spiky,
one-big-post-then-nothing usage pattern that music release cycles produce. That is why
every new entrant in the table above is advertising **flat-rate, unlimited-contact
pricing**. It is a real, current, dated wedge.

### 4.4 Is there a music-specific comment-to-DM + file delivery tool?

**Not properly, no. This is the clearest gap I found.**

What exists:

- **Laylo** does comment-to-DM and tells you to paste a Dropbox/Drive/private SoundCloud
  link into the confirmation message. No file hosting, no per-fan entitlement, no expiring
  URLs, no download analytics beyond link clicks. Their own help doc even warns that if you
  set a drop *date*, the signup form stops capturing after it passes — you must toggle the
  drop message off to run an evergreen gate. That is a workaround, documented as a
  "blueprint," not a product.
- **Laylo x Samply** (6 August 2026) is the closest anyone has come: fans unlock unreleased
  tracks by joining the artist's list. But it is **streaming playback of works-in-progress,
  not a download**, and it requires the artist to already use Samply.
- The Instagram-only tools (CreatorFlow, Inro, InstantDM, ReplyKaro) all deliver **links
  only**. Several of their own musician pages explicitly explain that Instagram cannot
  attach a ZIP or audio file, so you must host elsewhere.
- **Hypeddit and the gate incumbents** do file delivery and platform actions, but not
  comment-to-DM.

**So the unoccupied square is: comment a keyword → automated DM → a gated page that
verifies the fan, captures email, optionally requires platform actions, and serves the
actual file with a server-side entitlement check.** Your repo already implements the right
half of that (`authorizeDownload` re-checking the database, private Blob delivery, email-as-
identity, formula-injection-guarded CSV export). The missing half is the Instagram comment
trigger and the DM send — which, per §4.1, runs on a **documented, open, sanctioned Meta
API**, unlike Spotify's extended quota gate or SoundCloud's stated policy against selling
social-action services.

**That asymmetry is the single most important finding in this document**, and it is the
same point [`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md)
opens on: Meta's door is open where Spotify's is shut.

### 4.5 Effectiveness data, and why you should not trust it

Every effectiveness number I found is published by a company selling the tool. The ranges
are so wide they are useless for planning:

| Metric | Claimed range | Sources |
| --- | --- | --- |
| Email capture from DM | **35%–85%** | UnlockDM 35–50%, CreatorFlow 40–60% (default 50%), ReplyRush 40–80%, CreatorFlow elsewhere 60–85% |
| DM open rate | 80–90% | ReplyRush, UnlockDM, CreatorFlow |
| Link click from DM | **10%–65%** | UnlockDM 10–20%, CreatorFlow default 65%, ReplyRush 40–65% |
| Comments per post | 1–3% of reach | CreatorFlow |
| Final conversion | 5–15% | UnlockDM |

The same vendor (CreatorFlow) publishes both "40–60%" and "60–85%" for email capture on
different pages. CreatorFlow's own calculator page is at least honest: *"Every output is a
projection built from the assumption rates shown."*

Two named case studies circulate widely — running coach Claire Bartholic collecting 2,000
emails at 80% conversion, and an unnamed course creator making $20,000 from 4,000 emails.
Neither is in music, neither is independently reported, and both appear on a vendor's blog.

One quote worth noting because it is at least attributed: *"Comment-to-DM triggered
automations see up to 278% higher engagement compared to standard broadcast messages"* —
attributed to **ManyChat, 2026**, quoted second-hand by tryunlockdm.com. I could not find
the primary ManyChat publication.

**Plan on: comment-to-DM converts substantially better than a link in bio, and you will not
know your real numbers until you run it.** Anything more precise is invented.

### 4.6 Is Meta cracking down?

**No evidence of a crackdown on compliant, API-based comment-to-DM — in music or
anywhere.** The consistent story across every source, including Meta's own docs, is:

- **Sanctioned:** automated replies to user-initiated actions (comments, Story replies,
  inbound DMs) through the official Instagram Graph API with OAuth.
- **Banned:** browser bots, Chrome extensions, password-sharing tools, scrapers,
  follower-scraping "growth" services, and cold DMs to people who never engaged.

The enforcement waves that vendors describe target the second category. Meta *built* the
private-reply endpoint specifically to make the first category possible.

⚠️ **One claim to disbelieve:** creatorlanehq.com states that *"In 2026, Meta executed its
largest-ever automated cleanup, suspending over 10 million Instagram accounts globally...
thousands of legitimate creators... were swept up."* No citation, no date, no link. This
looks like a distortion of Meta's July 2025 announcement about removing roughly 10 million
*impersonation* profiles — a different thing entirely. The same page also claims a
"perfect record of 0 accounts banned" for its own product, which is the tell.

**The real risk to a comment-to-DM business is not enforcement. It is that Meta owns the
channel and can reprice, rate-limit or deprecate it at will** — as it apparently did with
message tags in April 2026. That is the same class of platform risk as Spotify's token
change, just currently pointed the other way.

---

## 5. What this means for you, briefly

The full strategic argument belongs in
[`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md). Six
findings from this research change the picture:

1. **Meta's door is open where Spotify's is shut — for acquisition.** Comment-to-DM runs
   on a documented, public API with published limits and no business-size gate. Spotify
   pre-save requires ≥250,000 MAU for extended quota. If you want a growth mechanic you
   can actually ship, Instagram is it. The caveat is recurring *broadcast*: Marketing
   Messages closed to new integrations on 1 September 2025, so Instagram is an acquisition
   channel and email has to be the broadcast channel.
2. **Laylo is already circling your exact use case, and hasn't landed on it.** The "Gated
   Content Blueprint" is a support article telling artists to paste a Dropbox link. The
   Samply partnership is streaming, not downloads. Nobody in this market has built proper
   file delivery with per-fan entitlement behind a comment-to-DM trigger.
3. **Don't build on reselling SMS.** Klaviyo told its investors that SMS margin is
   compressing under carrier fees and it is passing hikes through. Subtext sells 10,000
   texts/month for $41.25 through SoundCloud. Bandsintown does presale SMS at $0.016. You
   cannot win on SMS price and you should not try.
4. **Email is where the margin is, and Laylo prices it at $0.002 — same as Bandsintown.**
   An email-first product with commodity ESP costs underneath has room that an SMS-first
   product does not.
5. **ManyChat's March 2026 repricing left an opening.** A 25-contact free tier and
   per-active-contact billing punishes exactly the spiky release-cycle usage that musicians
   generate. Every new entrant is attacking it with flat, unlimited-contact pricing. That
   window is open now and will not stay open.
6. **The niche is small, and eleven years of SuperPhone plus Community's $115M pivot are
   the proof.** Nothing here supports a venture-scale plan. It supports the same
   conclusion [`fan-messaging-business-assessment.md`](fan-messaging-business-assessment.md)
   reached: a deliberately-scoped, organically-marketed business — with the difference that
   the growth mechanic is one you can legally and reliably operate.

---

## 6. ⚠️ Sources I judged to be SEO or AI-generated spam

I am listing these because several are ranking highly and repeat each other's errors. If
you search this topic yourself, you will hit them.

**Actively false:**

| Source | Claim | Why it's wrong |
| --- | --- | --- |
| **unicornburn.com/autopsy/community-social-usa** | "Why Community Failed" — closed 2024, ceased operations, raised $113M | community.com is live, has a SOC 2 check dated 21 Aug 2026, a 2026 blog, a CEO appointed Nov 2024 and six execs hired May 2025. The page is a formulaic "startup autopsy" template with an LLM-generated post-mortem quote. |
| **symphonyos.co/vs/laylo** | "Laylo prices by fan count... free (500 fans), $15–20/mo for 2,500 fans, $49–59/mo for 10,000" | Laylo's live pricing page has **one** paid tier at $25/mo and meters by credits, not fans. Competitor-authored comparison page; the numbers appear fabricated. |
| **saaspartout.com/marketplace/laylo** | "from $29/mo... Starter Plan $29/mo up to 500 contacts... free plan up to 100 contacts... (data verified July 2026)" | No $29 tier, no Starter plan, no 500-contact cap exist. Also asserts Laylo "does not offer advanced CRM" — Laylo's entire positioning is CRM. Affiliate disclosure on page. |
| **gaebler.com** (Laylo entry) | "$8 million funding round on 10/12/2022"; industry "Blockchain" | Misreads the cumulative total as the round size; company description is from a defunct 2019 product. |
| **ecommerce-times.com** (two Klaviyo/Attentive articles) | "Attentive $10B valuation in 2021 Series E"; "$1.9B from 2024 secondary"; "Klaviyo $915M TTM revenue, 167,000 paying accounts" | Attentive's Series E was ~$6.9–7.0B. Klaviyo's Q2 FY26 filing shows ~$1.5B run rate and 205,000+ customers. The two articles also contradict each other. Fabricated precision throughout, including an invented "eMarsys Q1 2026 Mobile Commerce Report." |
| **creatoreconomytools.com** | "Cliqz provides a free SMS option for smaller creators" | Cliqz was a defunct German browser, shut down 2020. Hallucinated. Same site rates Laylo "4/5" and recycles the unsourced "98% vs 20%" open-rate cliché. |
| **creatorlanehq.com** | "In 2026, Meta suspended over 10 million Instagram accounts... thousands of legitimate creators swept up" | Uncited; appears to distort Meta's July 2025 impersonation-profile removals. Same page claims "0 accounts banned" for its own product. |

**Probably machine-written, numbers unreliable, treat as unusable:**

- **toddbaileymusic.com** — "Laylo Review & 2026 Guide." Claims to summarise what
  "musicians discussing Laylo on Reddit often mention" without linking a single thread,
  gives a "Final Review: 8.8/10," and lists **invented promo codes** ("LAYLO10",
  "LAYLOCREATOR", "LAYLOFREE") described as "potential promo searches musicians are using."
- **music.loop.fans/alternatives/laylo-pricing** — competitor-hosted "Laylo pricing" page
  with a 500-fan free-tier cap I could not corroborate; hedged, contentless prose
  throughout ("may vary," "typically offers," "generally provide enough time").
- **costbench.com** — "Community pricing calculator." Invents "Implementation: $5,000–
  $10,000 **per user**" and "hidden costs add ~42%" for a company that publishes no
  pricing at all. Confidence badges and "last verified" dates on entirely synthetic data.
- **extruct.ai** — Beacons page titled "$23.0M" with "$30M Total Raised" in the body, and a
  pricing description ("Store Pro, $30/month") that does not match Beacons' live tiers.
- **letsmetrix.com** — mirrors the Shopify App Store listing and then states "Free all: Not
  available. Paid plans only," which contradicts Beacons-style freemium reality and Laylo's
  own free tier.
- **chartlex.com, andrmusic.co, sonikit.com, boost-collective.com** — music-marketing SEO
  content citing proprietary datasets that do not exist publicly ("Chartlex campaign data
  from 2,400+ campaigns", "artist teams typically see only about 15% of the data their fans
  generate"). The 15% figure is gated behind a lead magnet and sourced nowhere.
- **The entire Instagram-DM-compliance blog cohort** — creatorflow.so, replyrush.com,
  spurnow.com, keyapi.ai, conferbot.com, boosend.ai, igmsg.com, heyregent.com,
  instantdm.com, tryunlockdm.com, sociahive.com, dmtracker.ai, welpmagazine.com,
  toptenaiagents.co.uk. These are vendor blogs. Some are accurate — conferbot.com in
  particular quotes Meta's docs correctly, including the 750/hour limit. But they collectively
  originated the "200 DMs/hour Meta limit" error, and every "benchmark" they publish is
  self-generated. Cross-check anything from them against
  developers.facebook.com directly.

**Legitimate but vendor-interested — use with attribution, not as fact:**
laylo.com case studies and blog; Subtext's 2026 SMS Benchmark Report; Attentive's 2026 SMS
Benchmarks Report; ManyChat's own blog; Community's blog.

**Primary or high-quality sources I'd trust:** SEC filings (Klaviyo); BusinessWire,
PRNewswire, GlobeNewswire and AccessNewswire releases; developer.spotify.com;
developers.facebook.com; help.artists.bandsintown.com; docs.laylo.com and help.laylo.com;
laylo.com/pricing (rendered); apps.shopify.com listings; TechCrunch; Music Business
Worldwide; Music Ally; Pollstar; Music Week; Press Gazette; Contrary Research.

**What I could not verify at all:**

- Laylo's current free-tier limits (contacts, credits, drops).
- Laylo's revenue, headcount and current customer count, beyond third-party estimates.
- Laylo's SMS provider (Twilio strongly indicated, never stated).
- Whether Laylo has raised since October 2022.
- Reddit sentiment about Laylo (Reddit returns 403 to automated fetching; every blog
  claiming to summarise it cites nothing).
- ManyChat's live pricing page (Cloudflare-blocked).
- Linktree's live pricing page.
- Postscript's 2026 revenue, funding or pricing.
- Meta's April 2026 message-tag deprecation (developers.facebook.com returned HTTP 400).
- Any independent, non-vendor study of comment-to-DM conversion rates. I do not believe
  one exists.
