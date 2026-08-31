# Spotify Analytics Admin Page — Design Plan

Status: **proposed**. Nothing is built yet; see [Open questions](#open-questions)
for the forks that should be settled before code lands.

Goal: `/admin/spotify` — one page that answers "how is WOMP doing on Spotify?"
the way Songstats does. Numbers that move, over time, with enough context to
tell whether a release or a playlist add caused the movement.

The hard part is not the page. It is that **Spotify gives you a live snapshot
and no history**. Songstats is valuable because it has been recording daily for
years. So the real deliverable is a capture pipeline that starts recording
today, plus a page that renders whatever has accumulated. Day one it shows
current standings; a month in it shows trends; a year in it is genuinely the
tool being asked for.

---

## Decisions

| Question | Decision |
| --- | --- |
| Primary data source | **The internal `api-partner.spotify.com` Pathfinder API**, which `lib/spotify.ts` already uses for monthly listeners. Verified below: it carries every number this page needs, with **no credentials at all**. |
| Official Web API role | **Optional overlay, never a dependency.** Spotify's Feb 2026 Dev Mode changes remove `artist.followers`, `artist.popularity`, `track.popularity`, and `GET /artists/{id}/top-tracks` outright. Anything sourced only from there is on borrowed time. |
| History | **Daily snapshots into Postgres.** Full copy of every metric each capture day, never mutated. Volume is ~45 rows/day, so there is no reason to be clever. |
| Render path | **Reads Postgres only.** The page never calls Spotify. A manual "Refresh" button exists but is not how the page normally loads. |
| Charts | **Hand-rolled SVG components**, no chart library. Rationale in §2.8. |
| Spotify for Artists data | **Out of scope for v1.** Demographics, source-of-streams, and saves live only behind a logged-in S4A session. Optional Tier 3, see §1.3. |
| Backfill | **None exists.** The page labels itself "collecting since <date>" and hides deltas without a baseline. Optional CSV import if history exists elsewhere. |
| Scope | **Spotify only**, but named and structured so SoundCloud / Instagram siblings can join later without a rewrite. |
| Personal data | **None.** Every number here is about WOMP, not about fans. No privacy-policy change. |

---

## 1. What data we can actually get

Everything in Tier 1 and Tier 2 was **verified live against
`spotify:artist:64XV9aZxwoLuxf9tgvu9Pb` on 31 Aug 2026** from a bare Node
script with no Spotify credentials in the environment. Real values are quoted
so the schema below is sized against reality rather than guesses.

### 1.1 Tier 1 — the partner API (free, no credentials, undocumented)

One anonymous bearer token scraped from the public embed page unlocks all of
this. `lib/spotify.ts` already does exactly this for the homepage.

| Query | What it returns | Verified value |
| --- | --- | --- |
| `queryArtistOverview` | `stats.followers` | **1,573** |
| | `stats.monthlyListeners` | **6,143** |
| | `stats.worldRank` | `0` (unranked — render as "—") |
| | `stats.topCities[]` — city, region, country, listeners | Denver 116, Chicago 94, Dallas 86, Los Angeles 78, Portland 77 |
| | `discography.topTracks[]` with lifetime `playcount` | 10 tracks |
| | `relatedContent.discoveredOnV2` — playlists carrying the catalog | **28 playlists** |
| | `relatedContent.relatedArtists` — "fans also like" | present |
| | `profile.externalLinks`, `biography`, `verified` | Instagram + TikTok |
| | `goods.events.concerts` | 0 |
| `queryArtistDiscographyAll` | Every release group | **11 singles**, 0 albums |
| `queryAlbumTracks` | Per-track lifetime `playcount` for *any* release | 11 tracks, **343,000 lifetime streams** total |
| `fetchPlaylist` | Playlist name, owner, **follower count** — including Spotify-owned editorial playlists | *Sub Low* (Spotify editorial) **391,186 followers**; *Songs that go "womp"* **13,472** |

Two things there matter more than they look.

**Full-catalog playcounts, not just the top 10.** `queryArtistOverview` alone
gives 10 tracks. Walking `queryArtistDiscographyAll` → `queryAlbumTracks` gives
every track WOMP has ever released. That is the difference between a total
streams figure that jitters as tracks enter and leave the top 10, and one that
is actually a catalog total. Today the two happen to be close (11 tracks), but
the top-10 approach silently breaks at the 11th release — which already
happened.

**Playlist follower counts work for editorial playlists.** The official Web API
404s on Spotify-owned playlists (`37i9…`) for anything but a grandfathered
extended-quota app. The partner API returns them fine. That makes "playlist
reach" — the sum of followers across every playlist carrying the catalog, about
**421k today**, dominated by one editorial add — a metric we can actually track,
including the day it appears and the day it disappears.

**Correction to a comment in the current code.** `lib/spotify.ts` says the
partner path "doesn't carry a followers figure" and therefore renders followers
as `—` whenever the Web API is unavailable. It does carry one (1,573, above).
Worth fixing while we are in here; it makes the public EPK more robust too.

### 1.2 Tier 2 — the official Web API (credentialed, shrinking)

After the [February 2026 Dev Mode
changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026),
a Development Mode app keeps `GET /artists/{id}`, `GET /artists/{id}/albums`,
`GET /albums/{id}`, `GET /tracks/{id}` and `GET /search` (limit capped at 10) —
but the `followers` and `popularity` fields are stripped from artist responses,
`popularity` is stripped from tracks and albums, and
`GET /artists/{id}/top-tracks` is removed entirely.

Spotify postponed applying the endpoint changes to *existing* Dev Mode
integrations, and extended-quota apps are exempt, so the current app may still
be returning all of it today. That is a reprieve, not a plan.

Net: the only thing Tier 2 adds that Tier 1 cannot is **popularity, at both the
artist and the individual track level** — the 0–100 score on `GET /artists/{id}`
and on `GET /tracks/{id}`. The partner API has no equivalent field; a full
partner track object is `name`, `uri`, `artists`, `duration`, `trackNumber`,
`discNumber`, `contentRating`, `playability`, `saved`, and `playcount`, and
that's the lot.

So we capture popularity per track, opportunistically:

- One `GET /tracks/{id}` per track per day. The batch `GET /tracks?ids=` endpoint
  was removed, so it's one request each — 11 today, trivially cheap.
- The column is nullable in `spotify_track_snapshots`, and the page hides the
  popularity column entirely rather than showing a wall of dashes if the field
  stops coming back.

Worth being clear about what popularity is and isn't, because it reads like a
more precise number than it is. It's a **relative, recency-weighted score**
computed against Spotify's entire catalog, not a count and not a rank among your
own tracks. Two tracks with identical lifetime streams get different scores if
one is getting played this week and the other peaked last year. At WOMP's
current scale most of the catalog will cluster in a narrow band near the bottom
of the 0–100 range, so day-to-day movement is largely noise.

That's why the design leans on playcount rather than popularity: `playcount`
deltas give actual streams per day per track, which is strictly more
informative and comes from the source that isn't being restricted. Popularity is
a useful secondary signal — it's the closest thing to "is the algorithm
currently pushing this track" — but it's a column in the tracks table, not the
backbone of the page. See [open question 5](#open-questions) for confirming
whether this app still gets the field.

### 1.3 Tier 3 — Spotify for Artists (not in v1)

Everything Songstats *can't* show either, because it is private to the artist:
listener demographics by age and gender, source of streams (playlist vs. artist
profile vs. search vs. library vs. radio), saves, listener segments
(active / previously active / programmed), per-country breakdowns beyond the top
5 cities, and follower growth as a real time series.

There is no API. Getting it programmatically means storing a logged-in
`sp_dc` session cookie for the WOMP Spotify account and replaying browser
requests — which breaks on password change, is hostile to 2FA, plainly violates
the S4A terms, and puts a credential to a personal account in our env vars. That
is a materially different risk class from the anonymous public reads in Tier 1,
and it should be a deliberate choice, not a default.

The low-risk version of the same idea: S4A can export CSVs. A
`scripts/spotify-import-s4a.mjs` that ingests a manually downloaded file gets
most of the value with none of the credential risk, at the cost of remembering
to do it. This is [open question 1](#open-questions).

---

## 2. Architecture

### 2.1 Capture, then render

Two independent halves, and keeping them independent is the whole design:

```
daily cron ──► partner API ──► capture run ──► Postgres snapshot rows
                                                      │
admin page ◄──────────────────────────────────────────┘
```

The page is a Postgres read. It cannot be slow, cannot be rate-limited, and
cannot show a spinner because Spotify rotated a query hash. The capture is a
background job whose failures are visible but not fatal — a missed day is a gap
in a chart, not a broken page.

This mirrors the Instagram snapshot pattern already in the repo
(`lib/instagram-store.ts` + `/api/cron/instagram-health`), with Postgres instead
of Global Config because we want a time series rather than one last-known-good
blob.

**Bonus:** once daily snapshots exist, the public homepage and EPK can fall back
to yesterday's row when the live partner call fails, instead of rendering "—".
That is a real robustness win for pages a promoter might be looking at.

### 2.2 Data model

New migration `db/migrations/0004_spotify_analytics.sql`. Everything is keyed by
`(artist_id, captured_on)` so a re-run on the same day overwrites rather than
duplicates, and so a second artist could be tracked later without a migration.

```
spotify_snapshots               -- one row per artist per capture day
  artist_id          text
  captured_on        date
  captured_at        timestamptz
  followers          integer null
  monthly_listeners  integer null
  world_rank         integer null
  popularity         integer null      -- web api only; often null
  catalog_streams    bigint  null      -- sum of per-track playcounts
  tracked_tracks     integer null
  playlist_count     integer null
  playlist_reach     bigint  null      -- sum of playlist followers
  primary key (artist_id, captured_on)

spotify_track_snapshots         -- full catalog, every day
  artist_id, captured_on, track_id
  track_name, album_id, album_name, released_on date null
  playcount          bigint null       -- partner api; the primary signal
  popularity         integer null      -- web api 0-100; null when unavailable
  top_track_rank     integer null      -- position in topTracks, or null
  primary key (artist_id, captured_on, track_id)

spotify_city_snapshots
  artist_id, captured_on, rank
  city, region, country, listeners
  primary key (artist_id, captured_on, rank)

spotify_playlist_snapshots
  artist_id, captured_on, playlist_id
  name, owner_name, is_editorial boolean, image_url
  followers          integer null
  primary key (artist_id, captured_on, playlist_id)

spotify_captures                -- run log; powers the health strip
  id uuid, artist_id, started_at, finished_at
  ok boolean, partner_ok boolean, web_api_ok boolean
  requests integer, error text null
```

Two deliberate choices worth defending:

**Full daily copies, not change records.** 11 tracks + 5 cities + 28 playlists +
1 artist row is ~45 rows per day, about 16k rows a year. Storing complete
snapshots means "what did it look like on 3 March?" is a `where captured_on =`
and playlist adds/removals fall out of presence-by-day
(`min(captured_on)` is the add date, the last consecutive day is the removal
date). A change-log schema would be smaller and much harder to query, for no
benefit at this volume.

**No derived-metrics table, no insights table.** Deltas, rolling averages,
milestones, and the activity feed are all computed at read time from the
snapshots. That means a bug in the derivation is a deploy away from fixed rather
than a backfill, and the snapshots stay the single source of truth.

Retention: keep everything. At 16k rows/year there is nothing to prune for
years, and the whole point is long history.

### 2.3 The capture run

`GET /api/cron/spotify-capture`, `CRON_SECRET`-authorised like the existing
crons, added to `vercel.json` at **06:00 UTC** daily (clear of the 04:00 gate
retention and the 12:00/13:00 Instagram jobs).

Sequence, roughly 42 requests for today's catalog:

1. Scrape the anonymous token from the artist embed page.
2. `queryArtistOverview` → artist stats, cities, playlists, top-track ranks.
3. `queryArtistDiscographyAll` → every release group (11).
4. `queryAlbumTracks` per release → per-track playcounts.
5. `fetchPlaylist` per discovered-on playlist → follower counts, capped at 60
   playlists so a viral moment can't blow the function's time budget.
6. Optionally, if Web API creds exist and the field still comes back:
   `GET /artists/{id}` for artist popularity, plus one `GET /tracks/{id}` per
   track for per-track popularity.
7. Upsert every table, write the `spotify_captures` row.

Requests are sequential with a small delay. This is a handful of reads per day
about our own artist from a server with a normal user agent — the same class of
access the homepage already makes, at a lower rate.

**Partial success is a first-class outcome.** If the playlist loop fails, we
still write the artist row and the tracks, flag `partner_ok` appropriately, and
record the error. Losing a whole day because one playlist 404'd would be the
worst possible failure mode for a dataset whose value is continuity.

### 2.4 When Spotify changes the locks

The persisted-query SHA hashes rotate. The one in `lib/spotify.ts` works today;
so do the four others this design needs (all verified above). They will not work
forever.

- All hashes move into one `PARTNER_QUERIES` registry in
  `lib/spotify-partner.ts`, with a comment explaining how to re-capture them
  from a browser network trace. One place to edit when it breaks.
- A `PersistedQueryNotFound` response is detected specifically and reported as
  "Spotify rotated the query hashes", not as a generic failure — that is the
  difference between a five-minute fix and an afternoon.
- Capture failures reuse the existing Discord webhook. `sendInstagramAlert` in
  `lib/instagram-token-refresh.ts` gets generalised into a small
  `lib/ops-alert.ts` so both integrations share it.
- The page shows a degraded banner when the last successful capture is over 48h
  old, with the last-known values still rendered and clearly labelled stale.

Stretch, once the basics work: harvest the hashes at runtime from the web
player's JS bundle when a persisted query 400s, and self-heal. Nice, not v1.

### 2.5 Routes

| Route | Purpose |
| --- | --- |
| `GET /admin/spotify` | The page. Server component, `getCurrentAdmin()` → redirect, Postgres reads only. |
| `GET /api/cron/spotify-capture` | Daily capture. `CRON_SECRET`. |
| `POST /api/admin/spotify/capture` | Manual "Refresh now". Admin-authed, refuses if a run succeeded in the last 10 minutes. |
| `GET /api/admin/spotify/export?dataset=…` | CSV export — `daily`, `tracks`, `playlists`, `cities`. Reuses the defensive `csvCell` quoting from the gate unlocks export. |

### 2.6 Modules

```
lib/spotify-partner.ts          typed Pathfinder client: anon token, query
                                runner, the five operations, SHA registry
lib/spotify-capture.ts          orchestrates one capture run, writes rows
lib/spotify-analytics-store.ts  every read: series, deltas, tracks, playlists,
                                cities, activity feed
lib/spotify-analytics-types.ts  shared types
lib/ops-alert.ts                Discord webhook, generalised from Instagram
components/admin/*              chart primitives (§2.8) + page sections
```

`lib/spotify.ts` keeps its current job — feeding the public homepage and EPK —
but its partner-API guts move into `lib/spotify-partner.ts` so there is one
implementation of the token scrape and query runner rather than two. It also
gains the Postgres snapshot fallback described in §2.1.

### 2.7 The page

Nav is the one place this touches existing UI: `AdminHeader` currently has a
single brand link, so it grows a two-item nav (`Gates` · `Spotify`) with the
active item marked. Same typography, same borders, no new visual language.

```
womp · admin                                    Gates   Spotify        me@… · sign out

SPOTIFY                          Captured 31 Aug 2026 06:04 UTC · partner ✓ · web api —
[7d] [28d] [90d] [1y] [all]                                    [ Refresh ]  [ Export ]

┌ Monthly listeners ─┐ ┌ Followers ────┐ ┌ Catalog streams ─┐ ┌ Playlist reach ──┐
│ 6,143      ▲ 4.2%  │ │ 1,573   ▲ 18  │ │ 343,000  ▲ 1,240 │ │ 421,338   28 pls │
│ ▁▂▃▄▅▆▇            │ │ ▁▂▃▄▅▆▇       │ │ ▁▂▃▄▅▆▇          │ │ ▁▂▃▄▅▆▇          │
└────────────────────┘ └───────────────┘ └──────────────────┘ └──────────────────┘
  streams/day (7d avg) · follower conversion 25.6% · streams per listener · world rank

┌ Trend ─────────────────────────────────────────────────────────────────────────┐
│  multi-series line chart, metric toggles, release dates marked on the axis      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌ Tracks ────────────────────────────────────────────────────────────────────────┐
│  #  Track            Released     Streams    Δ7d    Δ28d   /day  Pop  ▁▂▃▄▅▆▇   │
│  1  Bounce           2024-xx-xx    69,149   +310   +1,204    44   31            │
└─────────────────────────────────────────────────────────────────────────────────┘
   Pop is the Web API's 0-100 popularity score; the column disappears when the
   field is unavailable rather than rendering a row of dashes.

┌ Playlists ─────────────────────────┐ ┌ Cities ──────────────────────────────────┐
│  Sub Low        Spotify   391,186  │ │  Denver        US-CO   116  ▇▇▇▇▇▇▇▇▇▇▇   │
│  Songs that…    womp       13,472  │ │  Chicago       US-IL    94  ▇▇▇▇▇▇▇▇▇     │
│  … added 12 Jul · lost 3 Aug       │ │  … share of top-5 listeners              │
└────────────────────────────────────┘ └──────────────────────────────────────────┘

┌ Activity ──────────────────────────────────────────────────────────────────────┐
│  12 Jul  Added to Sub Low (Spotify, 391k followers)                             │
│  21 Aug  Released "Like You Mean It"                                            │
│  28 Aug  Monthly listeners crossed 6,000                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

The derived metrics are where "like Songstats" actually lives, and they are all
just arithmetic over the snapshot table:

- **Streams per day**, per track and total — the delta of cumulative playcount.
  This is the number that tells you whether a release is working, and Spotify
  never shows it to you directly.
- **7-day rolling average** and **momentum** (this week's delta vs. last
  week's), so a single quiet Tuesday doesn't read as a decline.
- **Follower conversion** — followers ÷ monthly listeners, 25.6% today. Whether
  people who hear WOMP come back on purpose.
- **Streams per listener** — catalog depth vs. one-track discovery.
- **Playlist reach**, and how much of it is one editorial add. Currently ~93% of
  reach is *Sub Low* alone, which is exactly the kind of concentration risk this
  page should make obvious.
- **Release performance** — streams in the first 7 / 28 days, compared across
  releases. Only meaningful for releases that happen after capture starts, so
  the page hides it until it has one.

**Deltas must be computed against the nearest snapshot on or before the target
date, not by subtracting a fixed number of rows.** Captures will occasionally
fail, and a naive "7 rows back" would silently mislabel a 9-day delta as
weekly.

### 2.8 Charts without a chart library

The repo has no charting dependency, and I'd rather not add one. Recharts would
become the largest client-side dependency in the app, ships its own D3 subset,
and would need heavy restyling to stop looking like a SaaS dashboard bolted onto
a bass-music site.

Instead: three small server-rendered SVG components — a sparkline, a line/area
chart, and a horizontal bar list — plus one thin client wrapper for hover
tooltips. Total maybe 200 lines. The datasets are tiny (a year of daily points
is 365 numbers), the visual language already exists in `StatTile` and
`StreamingSnapshot`, and framer-motion is already available for the reveal
animations.

The counter-argument, honestly: if this page later wants stacked areas, dual
axes, or brushing, hand-rolling stops being cheap. That is
[open question 3](#open-questions).

### 2.9 Starting from zero

There is no way to backfill from Spotify. Day one the page has one data point
and no trend lines, which is worth being upfront about rather than shipping
something that looks broken:

- Every delta is hidden, not zeroed, until a baseline exists.
- The header says "collecting since 31 Aug 2026" so the empty charts read as
  intentional.
- Lifetime figures — catalog streams, playlist reach, top cities — are
  meaningful immediately, so the page is not useless on day one.

If history exists elsewhere (a Songstats or Chartmetric account, old S4A CSV
exports), a one-off `scripts/spotify-import-*.mjs` can seed `spotify_snapshots`
before the first cron run and the page starts with real trends. That is
[open question 2](#open-questions).

### 2.10 Terms and privacy

The partner API is undocumented and unsupported. What we do with it: read public
data about our own artist, roughly 40 requests once a day, from a server, with a
normal user agent, and cache it in our own database. The homepage already does a
smaller version of this. We are not proxying it to the public, not scraping
other artists at scale, and not building a product on top of it.

No personal data is involved — every field is about WOMP, not about listeners.
The privacy policy does not change.

Tier 3 (§1.3) is where the risk profile changes, and it is deliberately not in
this plan.

---

## 3. Proposed build order

1. **Capture pipeline.** `lib/spotify-partner.ts`, migration, `lib/spotify-capture.ts`,
   the cron, the run log. No UI. Verify a few days of rows accumulate correctly
   and that a forced failure degrades the way it should. Everything else depends
   on this, and every day it isn't running is a day of history we don't get.
2. **The page, standings only.** Nav, KPI tiles, tracks table, playlists, cities.
   No trends yet — there is no history to trend. Immediately useful.
3. **Trends.** Chart primitives, range toggles, deltas, sparklines, release
   markers. Lands naturally once a couple of weeks of snapshots exist.
4. **Activity feed and export.** Derived from snapshot diffs; CSV export.
5. **Public-page fallback.** Point the homepage and EPK at the snapshot table
   when the live call fails, and fix the followers-from-partner bug in §1.1.
6. **Optional tiers.** S4A import, cross-platform sections, hash self-healing.

Steps 1–2 are the useful floor. Everything after compounds on the data step 1
is collecting.

---

## Open questions

These change what gets built, so they are worth answering before step 1.

1. **Spotify for Artists.** Do you want demographics, source-of-streams, saves,
   and listener segments (§1.3)? The automated route means storing an `sp_dc`
   session cookie for your Spotify account — fragile, against S4A's terms, and a
   real credential in env vars. The manual route is a CSV you export and upload.
   Or we skip the tier entirely. Default if you don't care: skip.
2. **Existing history.** Do you have a Songstats / Chartmetric / Soundcharts
   account, or old S4A exports? If yes, the page has real trend lines on day one
   instead of in a month, and it's worth a one-off import script.
3. **Charts.** Hand-rolled SVG (my recommendation, §2.8) or add Recharts? Only
   matters if you expect to want chart types beyond lines and bars.
4. **Scope.** Spotify-only, or should this be `/admin/analytics` with SoundCloud,
   Instagram, and gate-unlock conversion folded in as sibling sections? Cheap to
   decide now, annoying to retrofit — it changes the route, the nav, and the
   table names.
5. **The Spotify app registration.** Is `SPOTIFY_CLIENT_ID` a pre-Nov-2024 app,
   an extended-quota app, or one registered recently? This decides whether
   popularity — artist and per-track — still comes back (§1.2). I can't test it
   from here: the anonymous web-player token that unlocks the partner API is
   deliberately 429'd against `api.spotify.com`, so confirming needs the real
   client credentials. Easiest check, run locally with `.env.local` loaded:

   ```bash
   TOKEN=$(curl -s -X POST https://accounts.spotify.com/api/token \
     -d grant_type=client_credentials \
     -u "$SPOTIFY_CLIENT_ID:$SPOTIFY_CLIENT_SECRET" | jq -r .access_token)
   curl -s -H "Authorization: Bearer $TOKEN" \
     https://api.spotify.com/v1/tracks/5lWRSAQZOMK9FMvEWIeLZn | jq '.name, .popularity'
   ```

   A number means we capture it. `null` or a missing key means the field is
   already gone and the tracks table drops the column. The design works either
   way — playcount, not popularity, is the backbone.
6. **Cadence and cron budget.** Daily at 06:00 UTC is planned; the underlying
   numbers only move daily, so hourly would add 24× the requests and no signal.
   This would be the fourth entry in `vercel.json` — any plan limit to worry
   about?
7. **Alerts.** The capture job will alert to Discord when it fails. Do you also
   want it to alert on good news — playlist adds, milestone crossings — or keep
   that in the page only?
8. **Backup.** Once this runs for a year, the Postgres rows are the only copy of
   history that cannot be recreated. Want a weekly JSON dump to Vercel Blob as
   insurance?
