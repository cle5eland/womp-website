"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";

import type { SpotifyStatsBundle } from "@/lib/spotify";

type Props = {
  data: SpotifyStatsBundle | null;
  artistName?: string;
  artistUrl?: string;
  showStreamsDisclaimer?: boolean;
  fetchedAtLabel?: string;
};

const formatCompact = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);

const formatFull = (n: number | null | undefined): string =>
  n == null ? "—" : new Intl.NumberFormat("en-US").format(n);

/**
 * Animated count-up that uses `useInView` to start once visible. Server
 * renders a static, pre-formatted value so hydration is stable; client takes
 * over and animates from 0 → target.
 */
function Counter({
  value,
  durationSec = 1.4,
  compact = false,
}: {
  value: number | null;
  durationSec?: number;
  compact?: boolean;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const motionValue = useMotionValue(value ?? 0);
  const display = useTransform(motionValue, (latest) =>
    compact ? formatCompact(Math.round(latest)) : formatFull(Math.round(latest)),
  );

  useEffect(() => {
    if (value == null) return;
    if (!inView) return;
    motionValue.set(0);
    const controls = animate(motionValue, value, {
      duration: durationSec,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [inView, motionValue, value, durationSec]);

  if (value == null) {
    return <span ref={ref}>—</span>;
  }
  return <motion.span ref={ref}>{display}</motion.span>;
}

function StatTile({
  kicker,
  label,
  value,
  delay = 0,
  highlight = false,
  footnote,
}: {
  kicker: string;
  label: string;
  value: number | null;
  delay?: number;
  highlight?: boolean;
  footnote?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ delay, duration: 0.45 }}
      className={
        "relative overflow-hidden border bg-black/50 p-6 sm:p-7 " +
        (highlight
          ? "border-[var(--accent)]/35 bg-[var(--accent)]/[0.04] glow-box"
          : "border-white/[0.09]")
      }
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-zinc-500">
        {kicker}
      </p>
      <p
        className={
          "font-display mt-3 text-5xl leading-none sm:text-6xl " +
          (highlight ? "text-[var(--accent)]" : "text-white")
        }
      >
        <Counter value={value} />
      </p>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-400">
        {label}
      </p>
      {footnote ? (
        <p className="mt-2 text-[10px] text-zinc-600">{footnote}</p>
      ) : null}

      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left" }}
        className={
          "absolute inset-x-0 bottom-0 h-px " +
          (highlight ? "bg-[var(--accent)]/60" : "bg-white/15")
        }
      />
    </motion.div>
  );
}

function EqualizerBars({ active = true }: { active?: boolean }) {
  const bars = [0.4, 0.85, 0.55, 1, 0.7];
  return (
    <div className="flex items-end gap-1" aria-hidden>
      {bars.map((peak, i) => (
        <motion.span
          key={i}
          className="block w-1.5 origin-bottom bg-[var(--accent)]"
          style={{ height: `${Math.round(peak * 24)}px` }}
          animate={
            active
              ? { scaleY: [0.35, peak, 0.5, peak * 0.85, 0.45] }
              : { scaleY: 0.6 }
          }
          transition={
            active
              ? {
                  duration: 1.2 + i * 0.15,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

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
