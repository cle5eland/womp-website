"use client";

import { motion } from "framer-motion";

import { EqualizerBars, StatTile } from "@/components/stat-tile";
import type { SoundcloudStatsBundle } from "@/lib/soundcloud-types";

/**
 * Visual parallel to `SpotifyStats` — same equalizer header, same animated
 * stat-tile grid, scoped to a SoundCloud profile. Brand color is the
 * SoundCloud orange (#ff5500); everything else mirrors the Spotify panel.
 */

type Props = {
  data: SoundcloudStatsBundle | null;
  artistName?: string;
  artistUrl?: string;
  fetchedAtLabel?: string;
};

// Brand-color overrides for the shared tile primitives — same values used in
// SoundCloud's own logo lockups.
const SC_BAR_CLASS = "bg-[#ff5500]";
const SC_HIGHLIGHT_BORDER = "border-[#ff5500]/35 bg-[#ff5500]/[0.04]";
const SC_HIGHLIGHT_TEXT = "text-[#ff5500]";
const SC_HIGHLIGHT_RULE = "bg-[#ff5500]/60";

export function SoundcloudStats({
  data,
  artistName,
  artistUrl,
  fetchedAtLabel,
}: Props) {
  const isLive = data !== null;
  const followers = data?.followers ?? null;
  const plays = data?.totalPlays ?? null;

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-3 border border-white/[0.07] bg-[#0a0a09] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex items-center gap-4">
          <EqualizerBars active={isLive} barClassName={SC_BAR_CLASS} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#ff5500]">
              {isLive ? "Live · SoundCloud" : "SoundCloud"}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {artistName ?? "Artist"} · streaming snapshot
            </p>
          </div>
        </div>
        {artistUrl ? (
          <a
            href={artistUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[#ff5500] hover:text-[#ff5500]"
          >
            Open profile
          </a>
        ) : null}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          kicker="Audience"
          label="Followers"
          value={followers}
          delay={0}
        />
        <StatTile
          kicker="All-time"
          label="Total plays"
          value={plays}
          delay={0.07}
          highlight
          highlightBorderClass={SC_HIGHLIGHT_BORDER}
          highlightTextClass={SC_HIGHLIGHT_TEXT}
          highlightRuleClass={SC_HIGHLIGHT_RULE}
          footnote="Sum of playback counts across the catalog on SoundCloud."
        />
      </div>

      {!isLive ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Live data unavailable — showing placeholders. Check SoundCloud creds.
        </p>
      ) : fetchedAtLabel ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Updated {fetchedAtLabel}
        </p>
      ) : null}
    </div>
  );
}
