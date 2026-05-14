"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

type Shot = { src: string; alt: string };

/** Delay between one cell’s swap and the next (cells rotate 0 → 1 → 2 → 3 → …). */
const ROTATE_STEP_MS = 2000;
const SLOT_COUNT = 4;

function pickRandom<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)]!;
}

/** Uniform pick in `[0, n)` excluding `current` when `n > 1` (last resort). */
function randomIndexDifferentFrom(current: number, n: number): number {
  if (n <= 1) return 0;
  const pick = Math.floor(Math.random() * (n - 1));
  return pick < current ? pick : pick + 1;
}

/** Four distinct indices when `n >= 4`; otherwise best-effort. */
function randomSlotIndicesDistinct(n: number): number[] {
  if (n <= 0) return Array.from({ length: SLOT_COUNT }, () => 0);
  if (n >= SLOT_COUNT) {
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const j = i + Math.floor(Math.random() * (n - i));
      [indices[i], indices[j]] = [indices[j]!, indices[i]!];
    }
    return indices.slice(0, SLOT_COUNT);
  }
  return Array.from({ length: SLOT_COUNT }, (_, i) => i % n);
}

function deterministicSlotIndices(n: number): number[] {
  if (n <= 0) return Array.from({ length: SLOT_COUNT }, () => 0);
  if (n >= SLOT_COUNT) return Array.from({ length: SLOT_COUNT }, (_, i) => i);
  return Array.from({ length: SLOT_COUNT }, (_, i) => i % n);
}

/**
 * Pick a new image index for `slot` that is not shown on any other tile when
 * possible, and prefer a change from the current image.
 */
function pickNextSlotIndex(slot: number, prev: readonly number[], n: number): number {
  const cur = prev[slot] ?? 0;
  const usedElsewhere = new Set(
    prev.flatMap((idx, j) => (j === slot ? [] : [idx])),
  );

  const prefer = Array.from({ length: n }, (_, i) => i).filter(
    (i) => i !== cur && !usedElsewhere.has(i),
  );
  if (prefer.length > 0) return pickRandom(prefer);

  const noCollision = Array.from({ length: n }, (_, i) => i).filter(
    (i) => !usedElsewhere.has(i),
  );
  if (noCollision.length > 0) return pickRandom(noCollision);

  return randomIndexDifferentFrom(cur, n);
}

type PressPhotoCarouselProps = {
  /** Press + live photos in one list — four cells rotate independently. */
  images: Shot[];
};

/**
 * Four-up photo grid: every {@link ROTATE_STEP_MS}, one cell updates to a new
 * image, cycling slots. New picks avoid matching any other tile when possible;
 * with four or more photos, tiles stay pairwise distinct after the post-mount shuffle.
 */
export function PressPhotoCarousel({ images }: PressPhotoCarouselProps) {
  const n = images.length;
  // Deterministic first paint so SSR + hydration match; randomize after paint.
  const [slotIndex, setSlotIndex] = useState<number[]>(() =>
    deterministicSlotIndices(n),
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPaused(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (n === 0) return;
    const id = requestAnimationFrame(() => {
      setSlotIndex(randomSlotIndicesDistinct(n));
    });
    return () => cancelAnimationFrame(id);
  }, [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    let slot = 0;
    const id = window.setInterval(() => {
      setSlotIndex((prev) => {
        const next = [...prev];
        next[slot] = pickNextSlotIndex(slot, prev, n);
        return next;
      });
      slot = (slot + 1) % SLOT_COUNT;
    }, ROTATE_STEP_MS);
    return () => clearInterval(id);
  }, [paused, n]);

  if (n === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: SLOT_COUNT }, (_, slot) => {
        const idx = slotIndex[slot] ?? 0;
        const shot = images[idx];
        if (!shot) return null;
        return (
          <figure
            key={slot}
            className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-black"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={`${slot}-${shot.src}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={shot.src}
                  alt={shot.alt ?? "Photo"}
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </figure>
        );
      })}
    </div>
  );
}
