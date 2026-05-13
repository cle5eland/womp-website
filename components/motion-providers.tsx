"use client";

import { MotionConfig } from "framer-motion";

/**
 * `reducedMotion="user"` makes Framer Motion honor `prefers-reduced-motion`
 * by jumping animated values to their targets instead of tweening. Scroll
 * sections use normal `initial` / `whileInView` props so content still reaches
 * its visible end state; avoid branching on `useReducedMotion()` in children,
 * which can leave elements stuck at `opacity: 0` when combined with
 * undefined `animate` / `whileInView` during hydration.
 */
export function MotionProviders({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
