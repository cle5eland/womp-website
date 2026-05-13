"use client";

import { motion } from "framer-motion";

import { EqualizerBars, StatTile } from "@/components/stat-tile";
import type { InstagramStatsBundle } from "@/lib/instagram-types";

/**
 * Visual parallel to `SpotifyStats` and `SoundcloudStats` — same equalizer
 * header, same animated stat-tile grid, scoped to an Instagram profile.
 * Brand color is Instagram pink (#E1306C); everything else mirrors the
 * other two panels.
 */

type Props = {
  data: InstagramStatsBundle | null;
  artistName?: string;
  artistUrl?: string;
  fetchedAtLabel?: string;
};

// Brand-color overrides for the shared tile primitives. Instagram doesn't
// publish a single brand color (their identity is a gradient) — #E1306C is
// the dominant magenta in their visual identity and the most recognizable
// single-color stand-in for the gradient.
const IG_BAR_CLASS = "bg-[#E1306C]";
const IG_HIGHLIGHT_BORDER = "border-[#E1306C]/35 bg-[#E1306C]/[0.04]";
const IG_HIGHLIGHT_TEXT = "text-[#E1306C]";
const IG_HIGHLIGHT_RULE = "bg-[#E1306C]/60";

export function InstagramStats({
  data,
  artistName,
  artistUrl,
  fetchedAtLabel,
}: Props) {
  const isLive = data !== null;
  const followers = data?.followers ?? null;
  const following = data?.following ?? null;
  const posts = data?.posts ?? null;

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-3 border border-white/[0.07] bg-[#0a0a09] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex items-center gap-4">
          <EqualizerBars active={isLive} barClassName={IG_BAR_CLASS} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#E1306C]">
              {isLive ? "Live · Instagram" : "Instagram"}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {artistName ?? "Artist"} · social snapshot
            </p>
          </div>
        </div>
        {artistUrl ? (
          <a
            href={artistUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[#E1306C] hover:text-[#E1306C]"
          >
            Open profile
          </a>
        ) : null}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          kicker="Audience"
          label="Followers"
          value={followers}
          delay={0}
          highlight
          highlightBorderClass={IG_HIGHLIGHT_BORDER}
          highlightTextClass={IG_HIGHLIGHT_TEXT}
          highlightRuleClass={IG_HIGHLIGHT_RULE}
        />
        <StatTile
          kicker="Engagement"
          label="Following"
          value={following}
          delay={0.07}
        />
        <StatTile
          kicker="Catalog"
          label="Posts"
          value={posts}
          delay={0.14}
        />
      </div>

      {!isLive ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Live data unavailable — showing placeholders. Check Instagram token.
        </p>
      ) : fetchedAtLabel ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Updated {fetchedAtLabel}
        </p>
      ) : null}
    </div>
  );
}
