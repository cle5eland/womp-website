This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment variables

Copy `.env.example` to `.env.local` and fill in any values you want to use locally:

```bash
cp .env.example .env.local
```

`.env*` is already gitignored, so real secrets stay out of the repo.

### SoundCloud API

The SoundCloud stats panel pulls live data from the official SoundCloud API. To enable it, register an app at [developers.soundcloud.com](https://developers.soundcloud.com/docs/api/register-app) and set:

| Variable | Required | Description |
| --- | --- | --- |
| `SOUNDCLOUD_CLIENT_ID` | Yes (for API path) | The client ID from your registered SoundCloud app. |
| `SOUNDCLOUD_CLIENT_SECRET` | Yes (for API path) | The matching client secret. Server-only; never exposed to the browser. |

The credentials are used server-side only (the module that reads them is marked `"server-only"`). Tokens are obtained via OAuth 2.1 client_credentials, cached in memory, and refreshed proactively to stay within SoundCloud's per-app rate limits (50 token requests per 12h).

If credentials are not configured, the site degrades gracefully by reading the same fields from the public profile page's hydration JSON, so local dev still works without secrets.

**Production:** set these in your host's secret manager (Vercel Project Settings → Environment Variables, or the Cursor Cloud Agents secrets dashboard). Don't paste real values into chat or commits — rotate immediately if you do.

## Download gates

A download gate is a public page for one song (`/gate/<slug>`) where a fan connects their SoundCloud account, likes / reposts / comments on / follows the track, leaves a name and email, and gets a download in return. Gates are managed at `/admin/gates`.

Design notes and the reasoning behind the constraints live in [`docs/download-gate-plan.md`](docs/download-gate-plan.md). A proposed Spotify follow step (app connection, structured for more Spotify actions later) is in [`docs/spotify-gate-plan.md`](docs/spotify-gate-plan.md). The short version of what matters when changing this code:

- **Writes need a user token.** `lib/soundcloud-auth.ts` holds an app-level client-credentials token that can only *read*. Like / repost / comment / follow all require the Authorization Code + PKCE flow in `lib/soundcloud-user-auth.ts`.
- **One action per click, no bulk button.** SoundCloud's API terms only permit acting on a user's behalf for actions "specifically and deliberately initiated by the user". Comment text is always written by the fan and never pre-filled.
- **The gated file is never SoundCloud audio.** The terms prohibit apps that persist or re-serve SoundCloud content, so the deliverable is always a file you upload or a URL you host. There is deliberately no code path from a track to a download.
- **Fan OAuth tokens are never stored.** They live in an encrypted cookie for their ~1 hour lifetime. Download entitlement comes from our own unlock record, so it survives token expiry.
- **The comment endpoint is not idempotent.** `gate_unlocks.commented_at` is the guard that stops a refresh from posting duplicate comments — check it before calling the API.

### Setup

1. **Database.** Any Postgres works; **Neon via the Vercel Marketplace** is the recommended option (Vercel → Storage → Create → Neon). Its integration injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) automatically, which is exactly what this code reads — so production needs no manual variable. Locally, `vercel env pull .env.local`, or paste the **pooled** string (its host contains `-pooler`) into `DATABASE_URL` by hand. Then apply the schema:

```bash
npm run db:migrate
npm run db:check   # verifies connection, schema, role permissions, and env vars
```

The app must use the pooled endpoint: serverless functions open a connection per instance and will exhaust a direct connection limit under load. `npm run db:check` warns if it spots a direct string. Migrations are the opposite case — DDL and multi-statement transactions are what a transaction-mode pooler handles worst — so `db:migrate` prefers `DATABASE_URL_UNPOOLED` when it exists and falls back to `DATABASE_URL`.

You can paste a provider's connection string verbatim. Neon appends `channel_binding=require` and Supabase's pooled string appends `pgbouncer=true`; both are client-side libpq parameters that `postgres.js` would otherwise forward to the server, which rejects them with a confusing `unrecognized configuration parameter`. `sanitizeConnectionString` in `lib/db.ts` strips them.

Neon's free tier suspends compute after ~5 minutes idle and wakes in a few hundred milliseconds, so the first gate view after a quiet spell is slightly slow. It never pauses permanently. (Supabase's free tier *does* pause after 7 days of inactivity and needs a manual unpause, which is why it is not the default recommendation for a site with bursty traffic.)

2. **Session secret.** `GATE_SESSION_SECRET=$(openssl rand -base64 32)`. Required in production; local dev falls back to a development default.

3. **SoundCloud app.** Registering one requires an **Artist Pro** subscription. Create it at [soundcloud.com/you/apps](https://soundcloud.com/you/apps), reuse the same `SOUNDCLOUD_CLIENT_ID` / `SOUNDCLOUD_CLIENT_SECRET` as the stats panel, and set the app's redirect URI to exactly:

```
https://djwomp.com/api/soundcloud/callback
```

Then set `SOUNDCLOUD_OAUTH_REDIRECT_URI` to the same value. **SoundCloud allows one redirect URI per app**, which is why there is a single site-wide callback and the gate slug travels in the signed OAuth `state`. It also means you cannot point the same app at localhost and production — see mock mode below, or ask SoundCloud support for a second credential set.

4. **File storage (optional).** Connect a Vercel Blob store to get `BLOB_READ_WRITE_TOKEN` and upload files through the admin UI. Files go from the browser straight to Blob, because serverless request bodies cap out well below the size of a master. Without a Blob store you can still paste a download URL you host.

5. **First admin.** Set `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` (12+ characters), visit `/admin/login`, press **Create admin account**, sign in, then remove both variables. The bootstrap route refuses to run once an account exists.

6. **Privacy policy.** `/privacy` is required — the API terms oblige any app processing user data to publish one. Set `PRIVACY_CONTACT_EMAIL` so deletion requests have somewhere to go.

Accounts live in `gate_admins` and every gate carries an `owner_id`, so adding a second person later is an insert rather than a migration.

### Local development without SoundCloud credentials

Because production owns the only redirect URI, set:

```bash
GATE_MOCK_SOUNDCLOUD=true
```

"Connect with SoundCloud" then mints a fake fan session and the four write calls become no-ops, so the entire gate flow is clickable end to end. Track resolution returns a synthetic track, so you can create gates too. The flag is ignored when `NODE_ENV=production`.

### Operations

- `/api/cron/gate-retention` runs daily (see `vercel.json`) and deletes abandoned unlock rows older than 30 days. Completed unlocks are kept, since they are the record of who earned a download. It uses the same `CRON_SECRET` as the Instagram crons.
- Each gate's admin page has a **CSV export** of completed unlocks — name, email, consent flag, per-action timestamps, download count.

## Public assets (images)

Press photos, hero, and profile images live under `public/assets/`. **Run this before committing new or replaced images:**

```bash
npm run optimize-assets
```

The script resizes/compresses large JPEG/PNG/WebP files (gallery long edge ≤ 2000px, hero ≤ 2560px, profile ≤ 1600px). Unoptimized multi‑megabyte originals make Next.js `Image` optimization spike server memory on Vercel.

**Checklist when adding gallery photos:**

1. Drop files in `public/assets/gallery/`
2. `npm run optimize-assets`
3. Remove duplicate stems if you have both `.jpg` and `.jpeg` for the same shot
4. If you renamed `profile_pic` (e.g. `.png` → `.jpg`), update `profileHighlightImage` in `lib/epk-data.ts`

Agents: use the project skill `.cursor/skills/optimize-public-assets` for the full workflow.

### Instagram Graph API

The Instagram stats panel pulls follower / following / post counts via the official Instagram Graph API (Instagram Login flow). To enable it:

1. Make sure the `@wompbass` Instagram account is set to **Business** or **Creator** (personal accounts can't read stats).
2. Register a Meta app at [developers.facebook.com/apps](https://developers.facebook.com/apps) (Business type) and add the **Instagram** product with **Instagram Login** / business login configured ([Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)).
3. In the app dashboard, add an **OAuth redirect URI** that points at this project’s callback, exactly matching the env var below (trailing slashes matter).

Then obtain a **long-lived user access token** (one of):

**A. Built-in setup route (recommended for first-time setup)**  
While developing locally (or on a HTTPS preview you control), set:

| Variable | Required for setup | Description |
| --- | --- | --- |
| `INSTAGRAM_APP_ID` | Yes | **Instagram App ID** from App Dashboard → Instagram → business login settings. |
| `INSTAGRAM_APP_SECRET` | Yes | **Instagram App Secret** (same screen). Server-only. |
| `INSTAGRAM_OAUTH_REDIRECT_URI` | Yes | e.g. `http://localhost:3000/api/instagram/callback` — must match the dashboard list exactly. |
| `INSTAGRAM_ENABLE_OAUTH_SETUP` | Yes | Set to `true` only during setup; set back to unset/false afterward. |

Run `npm run dev`, visit `/api/instagram/oauth`, complete the Instagram login, then copy the shown token into `INSTAGRAM_ACCESS_TOKEN`. Turn off `INSTAGRAM_ENABLE_OAUTH_SETUP` when done so the OAuth endpoints return 404.

**B. Manual exchange**  
Follow Meta’s code → short-lived → long-lived steps in the same Business Login doc, then set `INSTAGRAM_ACCESS_TOKEN`.

**Production runtime**

| Variable | Required | Description |
| --- | --- | --- |
| `INSTAGRAM_ACCESS_TOKEN` | Yes (for live panel) | Long-lived access token. Server-only. Bootstrap value only — see auto-refresh below for how it stays valid afterward. |

You do **not** need to publish the app to Live for a single owned account while you are a developer/admin on the app; you still complete OAuth once to grant scopes.

#### Token auto-refresh + health monitoring

Tokens expire after ~60 days, and an **expired token cannot be refreshed** — there's no grace period, so recovery means re-running the OAuth flow by hand. Two crons (`vercel.json`) keep that from happening unattended:

**Weekly refresh** → `/api/cron/instagram-refresh`

1. Reads the current token (Edge Config, falling back to `INSTAGRAM_ACCESS_TOKEN`).
2. Calls `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…` to mint a new ~60-day token.
3. Verifies the new token works against `/me` *before* trusting it.
4. Persists it via `lib/instagram-store.ts`, so `lib/instagram-stats.ts` picks it up with no redeploy — a plain env var can't be updated at runtime.

**Daily health check** → `/api/cron/instagram-health`

1. Exercises the live API (a token can die between refreshes — a password change or revoked grant kills it immediately).
2. Stores the result as a last-known-good snapshot.
3. Alerts if the refresh cron hasn't succeeded in over 10 days, i.e. it has stopped running.
4. Pings `HEALTHCHECK_PING_URL` only on a fully clean run.

This route rotates nothing, so it's also the safe way to ask "is the token alive right now?" by hand.

Failures from either cron post to Discord *and* return a 5xx, so they show up in Vercel's cron failure metrics too. Because crons only run against the production deployment, a rollback or a dropped `vercel.json` would silently disable all of the above — that's what the external `HEALTHCHECK_PING_URL` dead-man's-switch is for.

**Graceful degradation.** When the live call fails, the panel serves the stored snapshot labeled "As of <date>" instead of an empty state, so a token problem is invisible to visitors. Only once the snapshot passes 30 days old does it revert to `—` and "Data unavailable".

One-time setup:

1. Create a Global Config store in the Vercel dashboard and connect it to this project (Storage tab -> Connect Store). This auto-adds a connection string env var (`GLOBAL_CONFIG` or `EDGE_CONFIG` depending on when you connect it — the SDK checks both).
2. Create a **project-scoped** Vercel API token so a leak can't reach anything else, and set it as `VERCEL_API_TOKEN`:

   ```bash
   vercel tokens add "womp instagram cron" --project prj_...
   ```

3. Set the remaining production env vars: `EDGE_CONFIG_ID`, `CRON_SECRET` (required — the cron routes refuse to run without it rather than being publicly callable), `DISCORD_ALERT_WEBHOOK_URL`, and optionally `HEALTHCHECK_PING_URL`. See `.env.example` for descriptions.
4. Complete the manual OAuth flow above once to seed `INSTAGRAM_ACCESS_TOKEN` — the crons take over from there.
5. Verify before trusting the schedule: `vercel crons run /api/cron/instagram-health` (safe, read-only), then `vercel crons run /api/cron/instagram-refresh` for a real rotation. `vercel crons ls` shows what's registered.

If refresh starts failing (revoked grant, or a token that lapsed before this was set up), fall back to the manual OAuth flow above.

**Secrets:** never commit app secrets or access tokens. If a secret is pasted into chat or committed, rotate it in the Meta dashboard immediately.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
