"use client";

import { motion, useReducedMotion } from "framer-motion";

export type StatItem = {
  label: string;
  value: string;
  /** Optional muted second line (e.g. a track title under a "Top track" number). */
  sub?: string;
  /** Optional href that wraps the entire card. */
  href?: string;
};

export type StatsGridProps = {
  items: StatItem[];
  /** Small grey caption rendered under the grid. */
  footnote?: string;
  /** Optional uppercase kicker (e.g. "Spotify", "SoundCloud") shown above the grid. */
  kicker?: string;
  /** When set, the kicker becomes an external link — used for source attribution. */
  kickerHref?: string;
  /** Tailwind color class for the kicker — defaults to the site accent. */
  kickerClassName?: string;
  className?: string;
};

/**
 * Reused for every "by-the-numbers" strip on the EPK — overview totals,
 * Spotify-specific stats, SoundCloud-specific stats, etc.
 */
export function StatsGrid({
  items,
  footnote,
  kicker,
  kickerHref,
  kickerClassName,
  className = "",
}: StatsGridProps) {
  const reduce = useReducedMotion();

  const kickerClass = `mb-5 inline-block text-[10px] font-semibold uppercase tracking-[0.45em] transition ${
    kickerClassName ?? "text-[var(--accent)]"
  }`;

  return (
    <div className={`mx-auto max-w-6xl ${className}`}>
      {kicker ? (
        kickerHref ? (
          <a
            href={kickerHref}
            target="_blank"
            rel="noreferrer"
            className={`${kickerClass} hover:underline`}
          >
            {kicker}
          </a>
        ) : (
          <p className={kickerClass}>{kicker}</p>
        )
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((stat, i) => {
          const card = (
            <>
              <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                {stat.label}
              </p>
              <p className="font-display mt-3 text-4xl text-white sm:text-5xl">
                {stat.value}
              </p>
              {stat.sub ? (
                <p className="mt-2 line-clamp-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  {stat.sub}
                </p>
              ) : null}
            </>
          );

          const baseClass =
            "block border border-white/[0.09] bg-black/50 p-6 transition";
          const interactiveClass = stat.href
            ? " hover:border-white/25 hover:bg-black/70"
            : "";

          return (
            <motion.div
              key={`${stat.label}-${i}`}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              {stat.href ? (
                <a
                  href={stat.href}
                  target="_blank"
                  rel="noreferrer"
                  className={baseClass + interactiveClass}
                >
                  {card}
                </a>
              ) : (
                <div className={baseClass}>{card}</div>
              )}
            </motion.div>
          );
        })}
      </div>
      {footnote ? (
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
