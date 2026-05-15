---
name: optimize-public-assets
description: >-
  Compress and resize images under public/assets before commit or deploy.
  Use when adding or replacing files in public/assets, the press gallery,
  hero.jpg, profile_pic, or when the user mentions image size, memory usage,
  next/image optimization, or slow page loads from large photos.
---

# Optimize public assets

Large originals under `public/assets/` cause high server memory when Next.js
`Image` optimizes them on demand (sharp decodes full megapixel bitmaps). Keep
sources web-sized **before** commit.

## When to run

Run after any of these:

- New or replaced files in `public/assets/gallery/`
- Changes to `public/assets/hero.jpg` or `public/assets/profile_pic.*`
- Any single image **> 400 KB** or long edge **> 2000px**

## Command

```bash
npm run optimize-assets
```

Script: `scripts/optimize-public-assets.mjs` (uses `sharp`).

## Targets (defaults)

| Role | Path pattern | Max long edge |
| --- | --- | --- |
| Hero | `hero.jpg` | 2560px |
| Profile | `profile_pic.*` | 1600px |
| Gallery | `gallery/*` | 2000px |

Opaque PNGs are converted to JPEG; PNGs with alpha stay PNG (prefer WebP if still large).

## After optimizing

1. If `profile_pic.png` became `profile_pic.jpg`, update `profileHighlightImage` in `lib/epk-data.ts`.
2. Avoid duplicate gallery stems (e.g. both `IMG_7673.jpg` and `IMG_7673.jpeg`); `get-press-shots.ts` keeps the smaller file, but delete the redundant file when possible.
3. Spot-check: `du -sh public/assets` should stay roughly **under ~15MB** total for this site.

## Do not

- Commit multi‑MB camera exports without running the script.
- Rely on `/_next/image` to shrink 10MB+ sources in production (spikes function memory).
