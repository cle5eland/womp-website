"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type VideoClip = {
  title: string;
  url: string;
  duration: string;
};

type VideoClipsCarouselProps = {
  videos: readonly VideoClip[];
};

export function VideoClipsCarousel({ videos }: VideoClipsCarouselProps) {
  const count = videos.length;
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) return null;

  const video = videos[index]!;

  return (
    <motion.div
      initial={{ opacity: 1, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      className="overflow-hidden border border-white/[0.09] bg-black/60"
    >
      <article key={video.url}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="aspect-video w-full"
        >
          <iframe
            className="h-full w-full"
            src={video.url}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          />
        </motion.div>
        <motion.div
          layout
          className="border-t border-white/[0.06] px-5 py-4 sm:px-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={video.url}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-white">
                {video.title}
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                {video.duration}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </article>

      {count > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4 sm:px-6">
          <motion.div layout className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous video"
              className="border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300 transition hover:border-[var(--accent)]/35 hover:text-[var(--accent)]"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next video"
              className="border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300 transition hover:border-[var(--accent)]/35 hover:text-[var(--accent)]"
            >
              Next →
            </button>
          </motion.div>

          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-600">
            {index + 1} / {count}
          </p>

          <motion.div
            layout
            className="flex w-full flex-wrap justify-center gap-1.5 sm:w-auto sm:justify-end"
            role="tablist"
            aria-label="Video clips"
          >
            {videos.map((v, i) => (
              <button
                key={v.url}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Video ${i + 1}: ${v.title}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === index
                    ? "bg-[var(--accent)]"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </motion.div>
        </div>
      ) : null}
    </motion.div>
  );
}
