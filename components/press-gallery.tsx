"use client";

import Image from "next/image";
import { startTransition, useEffect, useRef, useState } from "react";

type PressShot = {
  src: string;
  alt?: string;
};

type PressGalleryProps = {
  images: PressShot[];
  visibleCount?: number;
  intervalMs?: number;
};

export function PressGallery({
  images,
  visibleCount = 4,
  intervalMs = 6000,
}: PressGalleryProps) {
  const isReady = images.length > 0;
  const adjustedVisibleCount = Math.min(visibleCount, images.length || visibleCount);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const slotIndexRef = useRef(0);
  const nextImageRef = useRef(0);

  useEffect(() => {
    if (!isReady) {
      startTransition(() => {
        setVisibleIndexes([]);
      });
      slotIndexRef.current = 0;
      nextImageRef.current = 0;
      return;
    }

    const initial = Array.from(
      { length: adjustedVisibleCount },
      (_, idx) => idx % images.length,
    );

    startTransition(() => {
      setVisibleIndexes(initial);
    });
    slotIndexRef.current = 0;
    nextImageRef.current = adjustedVisibleCount % images.length;
  }, [isReady, adjustedVisibleCount, images.length]);

  useEffect(() => {
    if (
      !isReady ||
      images.length <= adjustedVisibleCount ||
      adjustedVisibleCount === 0
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setVisibleIndexes((prev) => {
        if (prev.length === 0) {
          return prev;
        }

        const slot = slotIndexRef.current;
        const nextImage = nextImageRef.current;
        const updated = [...prev];
        updated[slot] = nextImage;

        slotIndexRef.current = (slot + 1) % adjustedVisibleCount;
        nextImageRef.current = (nextImage + 1) % images.length;

        return updated;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [images.length, adjustedVisibleCount, intervalMs, isReady]);

  if (!isReady) {
    return null;
  }

  const displayedImages = visibleIndexes
    .map((index) => images[index])
    .filter(Boolean);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {displayedImages.map((image, idx) => (
          <div
            key={`${idx}-${image?.src}`}
            className="overflow-hidden rounded-3xl border border-white/10 bg-black transition hover:border-white/20"
          >
            <div className="imageFade relative aspect-[3/4]">
              {image ? (
                <Image
                  src={image.src}
                  alt={image.alt ?? "Press shot of womp"}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition duration-500 hover:scale-105"
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(1.015);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .imageFade {
          animation: fadeIn 700ms ease;
        }
      `}</style>
    </>
  );
}
