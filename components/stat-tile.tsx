"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";

import { formatCompactStat } from "@/lib/format-compact-stat";

/**
 * Shared visual primitives for "streaming snapshot" stat strips.
 *
 * The same Counter / StatTile / EqualizerBars are used by the unified
 * `StreamingSnapshot` panel so the platforms stay visually parallel.
 */

/**
 * Animated count-up that uses `useInView` to start once visible. Server
 * renders a static, pre-formatted value so hydration is stable; client takes
 * over and animates from 0 → target.
 *
 * Formatting is shared across all stat tiles via `formatCompactStat` so the
 * Spotify, SoundCloud, and Instagram panels stay visually consistent.
 */
export function Counter({
  value,
  durationSec = 1.4,
}: {
  value: number | null;
  durationSec?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const motionValue = useMotionValue(value ?? 0);
  const display = useTransform(motionValue, (latest) =>
    formatCompactStat(Math.round(latest)),
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

export function StatTile({
  kicker,
  label,
  value,
  delay = 0,
  highlight = false,
  footnote,
  className = "",
  /** No card border or background — for use inside a framed column. */
  bare = false,
  /** Tighter type + padding (streaming snapshot). */
  dense = false,
  /** Tailwind classes for the highlight border + tint. Defaults to site accent. */
  highlightBorderClass = "border-[var(--accent)]/35 bg-[var(--accent)]/[0.04] glow-box",
  /** Tailwind text color used when `highlight` is true. */
  highlightTextClass = "text-[var(--accent)]",
  /** Tailwind background color for the animated baseline rule. */
  highlightRuleClass = "bg-[var(--accent)]/60",
}: {
  kicker: string;
  label: string;
  value: number | null;
  delay?: number;
  highlight?: boolean;
  footnote?: string;
  className?: string;
  bare?: boolean;
  dense?: boolean;
  highlightBorderClass?: string;
  highlightTextClass?: string;
  highlightRuleClass?: string;
}) {
  const cardFrame =
    !bare &&
    "relative flex min-h-0 flex-col overflow-hidden border bg-black/50 p-4 sm:p-5 " +
    (highlight ? highlightBorderClass : "border-white/[0.09]");

  const bareFrame =
    bare &&
    (dense
      ? "relative flex min-h-0 flex-col py-3"
      : "relative flex min-h-0 flex-col py-4");

  const valueColor =
    highlight && !bare ? highlightTextClass : "text-white";

  const kickerClass = dense
    ? "text-[8px] font-medium uppercase tracking-[0.3em] text-zinc-500"
    : "text-[9px] font-medium uppercase tracking-[0.35em] text-zinc-500";

  const valueClass = dense
    ? "font-display mt-1 text-3xl leading-none sm:text-4xl " + valueColor
    : "font-display mt-1.5 text-4xl leading-none sm:text-5xl " + valueColor;

  const labelClass = dense
    ? "mt-1 text-[9px] font-medium uppercase tracking-[0.28em] text-zinc-400"
    : "mt-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-400";

  return (
    <motion.div
      initial={{ opacity: 1, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{ delay, duration: 0.4 }}
      className={[cardFrame, bareFrame, className].filter(Boolean).join(" ")}
    >
      <p className={kickerClass}>{kicker}</p>
      <p className={valueClass}>
        <Counter value={value} />
      </p>
      <p className={labelClass}>{label}</p>
      {footnote ? (
        <p className="mt-2 text-[10px] leading-snug text-zinc-500">{footnote}</p>
      ) : null}

      {!bare ? (
        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ delay: delay + 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left" }}
          className={
            "absolute inset-x-0 bottom-0 h-px " +
            (highlight ? highlightRuleClass : "bg-white/15")
          }
        />
      ) : null}
    </motion.div>
  );
}

export function EqualizerBars({
  active = true,
  /** Tailwind background color for the bars. Defaults to site accent. */
  barClassName = "bg-[var(--accent)]",
  /** Slightly shorter bars for dense streaming panels. */
  compact = false,
}: {
  active?: boolean;
  barClassName?: string;
  compact?: boolean;
}) {
  const px = compact ? 18 : 24;
  const barWidth = compact ? "w-1" : "w-1.5";
  const bars = [0.4, 0.85, 0.55, 1, 0.7];
  return (
    <div className={`flex items-end ${compact ? "gap-0.5" : "gap-1"}`} aria-hidden>
      {bars.map((peak, i) => (
        <motion.span
          key={i}
          className={`block ${barWidth} origin-bottom ${barClassName}`}
          style={{ height: `${Math.round(peak * px)}px` }}
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
