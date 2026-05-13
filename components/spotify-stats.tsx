"use client";

import { motion } from "framer-motion";

import { EqualizerBars, StatTile } from "@/components/stat-tile";
import type { SpotifyStatsBundle } from "@/lib/spotify";

type Props = {
  data: SpotifyStatsBundle | null;
  artistName?: string;
  artistUrl?: string;
  showStreamsDisclaimer?: boolean;
  fetchedAtLabel?: string;
};

export function SpotifyStats({
  data,
  artistName,
  artistUrl,
  showStreamsDisclaimer = true,
  fetchedAtLabel,
}: Props) {
  const isLive = data !== null;
  const monthly = data?.monthlyListeners ?? null;
  const streams = data?.totalTrackedStreams ?? null;
  const followers = data?.followers ?? null;

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-3 border border-white/[0.07] bg-[#0a0a09] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex items-center gap-4">
          <EqualizerBars active={isLive} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[var(--accent)]">
              {isLive ? "Live · Spotify" : "Spotify"}
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
            className="inline-flex shrink-0 border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Open profile
          </a>
        ) : null}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          kicker="Right now"
          label="Monthly listeners"
          value={monthly}
          delay={0}
          highlight
        />
        <StatTile
          kicker="All-time"
          label="Tracked streams"
          value={streams}
          delay={0.07}
          footnote={
            showStreamsDisclaimer
              ? "Sum of catalog playcounts on Spotify."
              : undefined
          }
        />
        <StatTile
          kicker="Audience"
          label="Followers"
          value={followers}
          delay={0.14}
        />
      </div>

      {!isLive ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Live data unavailable — showing placeholders. Check Spotify creds.
        </p>
      ) : fetchedAtLabel ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Updated {fetchedAtLabel}
        </p>
      ) : null}
    </div>
  );
}
