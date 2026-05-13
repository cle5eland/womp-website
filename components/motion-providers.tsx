"use client";

import { MotionConfig } from "framer-motion";

/**
 * `reducedMotion="user"` lets framer-motion respect the OS-level
 * `prefers-reduced-motion: reduce` setting automatically — animations are
 * suppressed (values jump to their target) without the components having to
 * branch on the media query themselves. This avoids SSR/hydration mismatches
 * that occur when components manually call `useReducedMotion()` (which returns
 * `null`/`false` during SSR but the real value on the client).
 */
export function MotionProviders({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
