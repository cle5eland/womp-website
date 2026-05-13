"use client";

import Image from "next/image";

type PressShot = {
  src: string;
  alt?: string;
};

type PressGalleryProps = {
  images: PressShot[];
};

/**
 * Static responsive grid — no rotation or enter animations so layout stays
 * stable across breakpoints and respects reduced-motion preferences.
 */
export function PressGallery({ images }: PressGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
      {images.map((image) => (
        <figure
          key={image.src}
          className="overflow-hidden border border-white/10 bg-black"
        >
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={image.src}
              alt={image.alt ?? "Press shot of womp"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 36vw"
              className="object-cover"
            />
          </div>
        </figure>
      ))}
    </div>
  );
}
