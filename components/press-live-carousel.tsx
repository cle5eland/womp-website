"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

type Shot = { src: string; alt: string };

/** Staggered rotation so slots do not flip in sync. */
const SLOT_INTERVAL_MS = [5200, 6100, 5750, 6800] as const;
const SLOT_COUNT = 4;

type PressPhotoCarouselProps = {
  /** Press + live photos in one list — four cells rotate independently. */
  images: Shot[];
};

/**
 * Four-up photo grid: each cell advances through `images` on its own timer
 * (different intervals + starting offsets so swaps rarely line up).
 */
export function PressPhotoCarousel({ images }: PressPhotoCarouselProps) {
  const n = images.length;
  const [slotIndex, setSlotIndex] = useState<number[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => (n > 0 ? i % n : 0)),
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
    setSlotIndex(Array.from({ length: SLOT_COUNT }, (_, i) => i % n));
  }, [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const ids = SLOT_INTERVAL_MS.map((ms, slot) =>
      window.setInterval(() => {
        setSlotIndex((prev) => {
          const next = [...prev];
          next[slot] = (next[slot] + 1) % n;
          return next;
        });
      }, ms),
    );
    return () => ids.forEach((id) => window.clearInterval(id));
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
