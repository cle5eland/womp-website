/**
 * Human-facing stat counts for the EPK (Spotify / SoundCloud / Instagram tiles
 * and Spotify track rows).
 *
 * - Values with magnitude &lt; 1000 render as plain integers (no loss of
 *   precision for typical follower / play counts in that range).
 * - Larger values use `notation: "compact"` with **two** significant digits
 *   so we never collapse to a single-digit mantissa (e.g. 2.1K instead of 3K).
 * - Compact values use **ceil** rounding so displayed counts never read lower
 *   than the underlying API integer.
 */
export function formatCompactStat(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const v = Math.round(n);
  if (v === 0) return "0";
  if (Math.abs(v) < 1000) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      v,
    );
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 2,
    roundingMode: "ceil",
  }).format(v);
}
