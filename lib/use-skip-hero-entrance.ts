"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/**
 * After a bfcache restore, `pageshow` has `persisted` true. We store the URL
 * path at restore time so only that route skips hero entrance on first paint.
 */
let restoreBfTargetPath: string | null = null;
const bfListeners = new Set<() => void>();

function bfSubscribe(onChange: () => void) {
  bfListeners.add(onChange);
  return () => bfListeners.delete(onChange);
}

function bfGetSnapshot() {
  return restoreBfTargetPath;
}

function bfGetServerSnapshot() {
  return null;
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "pageshow",
    (e: PageTransitionEvent) => {
      if (e.persisted) {
        restoreBfTargetPath = window.location.pathname;
      } else {
        restoreBfTargetPath = null;
      }
      bfListeners.forEach((l) => l());
    },
    true,
  );
}

function navTypeIsBackForward(): boolean {
  if (typeof performance === "undefined") return false;
  try {
    const n = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    return n?.type === "back_forward";
  } catch {
    return false;
  }
}

/**
 * True when this page was shown via browser back/forward (including bfcache) so
 * hero entrance motion can be skipped and content stays visible immediately.
 */
export function useSkipHeroEntrance(): boolean {
  const pathname = usePathname();

  const fromNavType = useSyncExternalStore(
    () => () => {},
    navTypeIsBackForward,
    () => false,
  );

  const restorePath = useSyncExternalStore(
    bfSubscribe,
    bfGetSnapshot,
    bfGetServerSnapshot,
  );

  const fromBfCache =
    restorePath != null && pathname != null && restorePath === pathname;

  return fromNavType || fromBfCache;
}
