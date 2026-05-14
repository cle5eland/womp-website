"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { InstagramIcon, SoundcloudIcon, SpotifyIcon } from "@/components/platform-icons";
import { EqualizerBars, StatTile } from "@/components/stat-tile";
import { performancesSupportCopy, recordLabels } from "@/lib/epk-data";
import type { InstagramStatsBundle } from "@/lib/instagram-types";
import type { SoundcloudStatsBundle } from "@/lib/soundcloud-types";
import type { SpotifyStatsBundle } from "@/lib/spotify";

function ProfileIconLink({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: ReactNode;
}) {
  if (!href) {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-black/30 opacity-40"
        aria-hidden
      />
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/15 bg-black/40 transition hover:border-white/35 hover:bg-white/[0.06]"
    >
      {children}
    </a>
  );
}

/** Brand-tinted frame around each streaming platform column. */
const spotifyFrame =
  "flex h-full min-h-0 flex-col gap-4 rounded-lg border border-[#1ED760]/55 bg-[#1ED760]/[0.06] p-4 shadow-[0_0_40px_-16px_rgba(30,215,96,0.35)] sm:p-5";
const scFrame =
  "flex h-full min-h-0 flex-col gap-4 rounded-lg border border-[#ff5500]/55 bg-[#ff5500]/[0.06] p-4 shadow-[0_0_40px_-16px_rgba(255,85,0,0.3)] sm:p-5";
const igFrame =
  "flex h-full min-h-0 flex-col gap-4 rounded-lg border border-[#E1306C]/55 bg-[#E1306C]/[0.06] p-4 shadow-[0_0_40px_-16px_rgba(225,48,108,0.28)] sm:p-5";

/** Single accent frame for Labels + Performances below the streaming row. */
const labelsPerformancesFrame =
  "rounded-lg border border-[var(--accent)]/45 bg-[var(--accent)]/[0.06] p-5 shadow-[0_0_48px_-18px_var(--accent-dim)] sm:p-6";

type Props = {
  spotify: {
    stats: SpotifyStatsBundle | null;
    artistUrl?: string;
    fetchedAtLabel?: string;
  };
  soundcloud: {
    data: SoundcloudStatsBundle | null;
    artistUrl?: string;
    fetchedAtLabel?: string;
  };
  instagram: {
    data: InstagramStatsBundle | null;
    artistUrl?: string;
    fetchedAtLabel?: string;
  };
};

/**
 * Highlights: three streaming lanes, then one shared accent box for Labels +
 * Performances.
 */
export function StreamingSnapshot({
  spotify: sp,
  soundcloud: sc,
  instagram: ig,
}: Props) {
  const spLive = sp.stats !== null;
  const scLive = sc.data !== null;
  const igLive = ig.data !== null;

  const monthly = sp.stats?.monthlyListeners ?? null;
  const streams = sp.stats?.totalTrackedStreams ?? null;
  const spFollowers = sp.stats?.followers ?? null;

  const scFollowers = sc.data?.followers ?? null;
  const scPlays = sc.data?.totalPlays ?? null;

  const igFollowers = ig.data?.followers ?? null;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-5"
      >
        {/* Spotify */}
        <div className={spotifyFrame}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <EqualizerBars active={spLive} barClassName="bg-[#1ED760]" />
              <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-[#1ED760]">
                Spotify
              </p>
            </div>
            <ProfileIconLink href={sp.artistUrl} label="Open Spotify profile">
              <SpotifyIcon className="h-4 w-4 text-[#1ED760]" />
            </ProfileIconLink>
          </div>

          <div className="flex min-h-0 flex-1 flex-col divide-y divide-white/[0.08]">
            <StatTile
              bare
              kicker="Right now"
              label="Monthly listeners"
              value={monthly}
              delay={0}
            />
            <StatTile
              bare
              kicker="All-time"
              label="Streams"
              value={streams}
              delay={0.04}
              footnote="Sum of catalog playcounts on Spotify."
            />
            <StatTile
              bare
              kicker="Audience"
              label="Followers"
              value={spFollowers}
              delay={0.08}
            />
          </div>

          {!spLive ? (
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Data unavailable — check Spotify creds.
            </p>
          ) : sp.fetchedAtLabel ? (
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Updated {sp.fetchedAtLabel}
            </p>
          ) : null}
        </div>

        {/* SoundCloud */}
        <div className={scFrame}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <EqualizerBars active={scLive} barClassName="bg-[#ff5500]" />
              <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-[#ff5500]">
                SoundCloud
              </p>
            </div>
            <ProfileIconLink href={sc.artistUrl} label="Open SoundCloud profile">
              <SoundcloudIcon className="h-[18px] w-[18px] text-[#ff5500]" />
            </ProfileIconLink>
          </div>

          <div className="flex min-h-0 flex-1 flex-col divide-y divide-white/[0.08]">
            <StatTile
              bare
              kicker="Audience"
              label="Followers"
              value={scFollowers}
              delay={0.02}
            />
            <StatTile
              bare
              kicker="All-time"
              label="Total plays"
              value={scPlays}
              delay={0.06}
              footnote="Sum of playback counts across the catalog on SoundCloud."
            />
          </div>

          {!scLive ? (
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Data unavailable — check SoundCloud creds.
            </p>
          ) : sc.fetchedAtLabel ? (
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Updated {sc.fetchedAtLabel}
            </p>
          ) : null}
        </div>

        {/* Instagram */}
        <div className={igFrame}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <EqualizerBars active={igLive} barClassName="bg-[#E1306C]" />
              <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-[#E1306C]">
                Instagram
              </p>
            </div>
            <ProfileIconLink href={ig.artistUrl} label="Open Instagram profile">
              <InstagramIcon className="h-4 w-4 text-[#E1306C]" />
            </ProfileIconLink>
          </div>

          <div className="flex min-h-0 flex-1 flex-col divide-y divide-white/[0.08]">
            <StatTile bare kicker="Audience" label="Followers" value={igFollowers} delay={0.03} />
          </div>

          {!igLive ? (
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Data unavailable — check Instagram token.
            </p>
          ) : ig.fetchedAtLabel ? (
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Updated {ig.fetchedAtLabel}
            </p>
          ) : null}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.05 }}
        className={labelsPerformancesFrame}
      >
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <div className="min-w-0 md:pr-2">
            <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-[var(--accent)]">
              Labels
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {recordLabels.map((label) => (
                <li key={label.name}>
                  <a
                    href={label.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block border-b border-white/10 pb-3 text-sm font-medium text-zinc-200 transition last:border-0 hover:text-white"
                  >
                    <span className="font-display text-xl uppercase tracking-wide text-white group-hover:text-[var(--accent)]">
                      {label.name}
                    </span>
                    <span className="mt-1 block text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                      {label.linkLabel ?? "Official site →"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 md:border-l md:border-[var(--accent)]/25 md:pl-8">
            <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-[var(--accent)]">
              Performances
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-200 sm:text-base">
              {performancesSupportCopy}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
