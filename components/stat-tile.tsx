"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";

/**
 * Shared visual primitives for "streaming snapshot" stat strips.
 *
 * The same Counter / StatTile / EqualizerBars are used by both the Spotify
 * and SoundCloud panels on the EPK so the platforms stay visually parallel.
 */

/**
 * Compact stat formatting with ceiling rounding:
 *   - Values < 1000 render as integers (14, 287).
 *   - Values >= 1000 render with the standard "K" / "M" suffix.
 *   - The number is rounded **up** rather than to-nearest, so 292,475 → 293K
 *     instead of 292K. The user explicitly asked for round-up.
 *   - No decimals: 292,475 → 293K, 1,584 → 2K, 1,200,000 → 2M. Consistent
 *     with the visual style elsewhere on the page.
 */
const formatStat = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 0,
        roundingMode: "ceil",
      }).format(n);

/**
 * Animated count-up that uses `useInView` to start once visible. Server
 * renders a static, pre-formatted value so hydration is stable; client takes
 * over and animates from 0 → target.
 *
 * Formatting is shared across all stat tiles via `formatStat` so the Spotify,
 * SoundCloud, and Instagram panels stay visually consistent.
 */
export function Counter({
  value,
  durationSec = 1.4,
}: {
  value: number | null;
  durationSec?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const motionValue = useMotionValue(value ?? 0);
  const display = useTransform(motionValue, (latest) =>
    formatStat(Math.round(latest)),
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
  highlightBorderClass?: string;
  highlightTextClass?: string;
  highlightRuleClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ delay, duration: 0.45 }}
      className={
        "relative overflow-hidden border bg-black/50 p-6 sm:p-7 " +
        (highlight ? highlightBorderClass : "border-white/[0.09]")
      }
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-zinc-500">
        {kicker}
      </p>
      <p
        className={
          "font-display mt-3 text-5xl leading-none sm:text-6xl " +
          (highlight ? highlightTextClass : "text-white")
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
          (highlight ? highlightRuleClass : "bg-white/15")
        }
      />
    </motion.div>
  );
}

export function EqualizerBars({
  active = true,
  /** Tailwind background color for the bars. Defaults to site accent. */
  barClassName = "bg-[var(--accent)]",
}: {
  active?: boolean;
  barClassName?: string;
}) {
  const bars = [0.4, 0.85, 0.55, 1, 0.7];
  return (
    <div className="flex items-end gap-1" aria-hidden>
      {bars.map((peak, i) => (
        <motion.span
          key={i}
          className={`block w-1.5 origin-bottom ${barClassName}`}
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
