"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { InstagramIcon, SoundcloudIcon, SpotifyIcon } from "@/components/platform-icons";
import { EqualizerBars, StatTile } from "@/components/stat-tile";
import { performancesSupportCopy, profileHighlightImage, recordLabels } from "@/lib/epk-data";
import type { InstagramStatsBundle } from "@/lib/instagram-types";
import type { SoundcloudStatsBundle } from "@/lib/soundcloud-types";
import type { SpotifyStatsBundle } from "@/lib/spotify";

function ProfileIconLink({
  href,
  label,
  children,
  compact = false,
}: {
  href?: string;
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const box = compact
    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/10 bg-black/30 opacity-40"
    : "flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-black/30 opacity-40";
  const linkBox = compact
    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/15 bg-black/40 transition hover:border-white/35 hover:bg-white/[0.06]"
    : "flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/15 bg-black/40 transition hover:border-white/35 hover:bg-white/[0.06]";
  if (!href) {
    return (
      <span className={box} aria-hidden />
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={linkBox}
    >
      {children}
    </a>
  );
}

/** One row height for platform label + bars + profile button (all columns match). */
const platformHeaderRow =
  "flex h-9 shrink-0 items-center justify-between gap-2.5";

const platformLabelClass =
  "text-[8px] font-medium uppercase tracking-[0.28em]";

/** Shared flex + stretch for highlight grid columns (width/height from the row on lg+). */
const highlightsColumnBase =
  "flex min-h-0 flex-col gap-3 rounded-lg border lg:h-full";

const highlightsColumnPad = "p-3 sm:p-4";

/** Padded shell — matches Spotify column layout behavior. */
const highlightsColumnShell = `${highlightsColumnBase} ${highlightsColumnPad}`;

/** Brand-tinted frame around each streaming platform column. */
const spotifyFrame = `${highlightsColumnShell} border-[#1ED760]/55 bg-[#1ED760]/[0.06] shadow-[0_0_32px_-14px_rgba(30,215,96,0.35)]`;
const scFrame =
  "flex min-h-0 flex-col gap-3 rounded-lg border border-[#ff5500]/55 bg-[#ff5500]/[0.06] p-3 shadow-[0_0_32px_-14px_rgba(255,85,0,0.3)] sm:p-4";
const igFrame =
  "flex min-h-0 flex-col gap-3 rounded-lg border border-[#E1306C]/55 bg-[#E1306C]/[0.06] p-3 shadow-[0_0_32px_-14px_rgba(225,48,108,0.28)] sm:p-4";

/** Single accent frame for Labels + Performances below the streaming row. */
const labelsPerformancesFrame =
  "rounded-lg border border-[var(--accent)]/45 bg-[var(--accent)]/[0.06] p-4 shadow-[0_0_40px_-16px_var(--accent-dim)] sm:p-5";

type Props = {
  spotify: {
    stats: SpotifyStatsBundle | null;
    artistUrl?: string;
  };
  soundcloud: {
    data: SoundcloudStatsBundle | null;
    artistUrl?: string;
  };
  instagram: {
    data: InstagramStatsBundle | null;
    artistUrl?: string;
  };
};

/**
 * Highlights: profile + Spotify + stacked SoundCloud + Instagram in one grid on lg+.
 * Profile is hidden below `md` (mobile). Equal-width columns on lg+; row height follows the tallest column.
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
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 1, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        className="grid min-h-0 gap-3 lg:grid-cols-3 lg:items-stretch lg:gap-4"
      >
        {/* Same flex + stretch as Spotify column; hidden below md (matches hero overlay). */}
        <div
          className={`${highlightsColumnBase} max-md:hidden max-lg:h-auto overflow-hidden border-white/[0.10] bg-zinc-950/90 p-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
        >
          <figure className="relative aspect-[3/4] w-full min-h-[12rem] min-w-0 max-lg:max-w-md max-lg:mx-auto lg:mx-0 lg:aspect-auto lg:h-full lg:min-h-0 lg:max-w-none lg:flex-1">
            <Image
              src={profileHighlightImage}
              alt="womp"
              fill
              className="object-cover object-[center_18%]"
              sizes="(max-width: 1024px) min(100vw, 28rem), 33vw"
            />
          </figure>
        </div>

        {/* Spotify — same shell + brand tint; flex growth on lg+ */}
        <div className={`${spotifyFrame} min-h-0 max-lg:h-auto`}>
              <div className={platformHeaderRow}>
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <EqualizerBars active={spLive} barClassName="bg-[#1ED760]" compact />
                  <p className={`${platformLabelClass} text-[#1ED760]`}>Spotify</p>
                </div>
                <ProfileIconLink href={sp.artistUrl} label="Open Spotify profile" compact>
                  <SpotifyIcon className="h-3.5 w-3.5 text-[#1ED760]" />
                </ProfileIconLink>
              </div>

              <div className="flex min-h-0 max-lg:flex-none flex-col divide-y divide-white/[0.08] lg:flex-1">
                <StatTile
                  bare
                  dense
                  className="min-h-0 justify-start lg:flex-1 lg:basis-0 lg:justify-center"
                  kicker="Right now"
                  label="Monthly listeners"
                  value={monthly}
                  delay={0}
                />
                <StatTile
                  bare
                  dense
                  className="min-h-0 justify-start lg:flex-1 lg:basis-0 lg:justify-center"
                  kicker="All-time"
                  label="Streams"
                  value={streams}
                  delay={0.04}
                />
                <StatTile
                  bare
                  dense
                  className="min-h-0 justify-start lg:flex-1 lg:basis-0 lg:justify-center"
                  kicker="Audience"
                  label="Followers"
                  value={spFollowers}
                  delay={0.08}
                />
              </div>

              {!spLive ? (
                <p className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                  Data unavailable — check Spotify creds.
                </p>
              ) : null}
        </div>

        {/* SoundCloud + Instagram — natural height; column stretches with the row on lg+ */}
        <div className="flex min-h-0 flex-col gap-3 max-lg:h-auto lg:h-full lg:justify-start">
              <div className={scFrame}>
                <div className={platformHeaderRow}>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <EqualizerBars active={scLive} barClassName="bg-[#ff5500]" compact />
                    <p className={`${platformLabelClass} text-[#ff5500]`}>SoundCloud</p>
                  </div>
                  <ProfileIconLink href={sc.artistUrl} label="Open SoundCloud profile" compact>
                    <SoundcloudIcon className="h-[15px] w-[15px] text-[#ff5500]" />
                  </ProfileIconLink>
                </div>

                <div className="flex flex-col divide-y divide-white/[0.08]">
                  <StatTile
                    bare
                    dense
                    kicker="Audience"
                    label="Followers"
                    value={scFollowers}
                    delay={0.02}
                  />
                  <StatTile
                    bare
                    dense
                    kicker="All-time"
                    label="Total plays"
                    value={scPlays}
                    delay={0.06}
                  />
                </div>

                {!scLive ? (
                  <p className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                    Data unavailable — check SoundCloud creds.
                  </p>
                ) : null}
              </div>

              <div className={igFrame}>
                <div className={platformHeaderRow}>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <EqualizerBars active={igLive} barClassName="bg-[#E1306C]" compact />
                    <p className={`${platformLabelClass} text-[#E1306C]`}>Instagram</p>
                  </div>
                  <ProfileIconLink href={ig.artistUrl} label="Open Instagram profile" compact>
                    <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" />
                  </ProfileIconLink>
                </div>

                <div className="flex min-h-0 flex-col divide-y divide-white/[0.08]">
                  <StatTile
                    bare
                    dense
                    kicker="Audience"
                    label="Followers"
                    value={igFollowers}
                    delay={0.03}
                  />
                </div>

                {!igLive ? (
                  <p className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                    Data unavailable — check Instagram token.
                  </p>
                ) : null}
              </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 1, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ delay: 0.05 }}
        className={labelsPerformancesFrame}
      >
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
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
