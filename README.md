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
| `INSTAGRAM_ACCESS_TOKEN` | Yes (for live panel) | Long-lived access token. Server-only. |

You do **not** need to publish the app to Live for a single owned account while you are a developer/admin on the app; you still complete OAuth once to grant scopes.

Token rotation: tokens expire after ~60 days. Rotate the env var before the window lapses (or wire up a cron that calls `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…` and pushes the new token back into the secret manager). When the token is missing or rejected, the Instagram tiles gracefully render `—` rather than breaking the page.

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
