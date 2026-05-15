import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  fallbackPressShots,
  type PressShot,
} from "@/lib/epk-data";

const galleryDirectory = path.join(process.cwd(), "public/assets/gallery");

function formatPressShotAlt(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  return `Press — ${withoutExtension.replace(/[-_]+/g, " ")}`;
}

export function getPressShots(): PressShot[] {
  if (!fs.existsSync(galleryDirectory)) {
    return fallbackPressShots();
  }

  const pressShotFiles = fs
    .readdirSync(galleryDirectory)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file));

  if (pressShotFiles.length === 0) {
    return fallbackPressShots();
  }

  // Prefer one file per basename (e.g. skip 12MB .jpg when a smaller .jpeg exists).
  const byStem = new Map<string, string>();
  for (const file of pressShotFiles) {
    const stem = file.replace(/\.[^.]+$/i, "").toLowerCase();
    const abs = path.join(galleryDirectory, file);
    const size = fs.statSync(abs).size;
    const prev = byStem.get(stem);
    if (!prev) {
      byStem.set(stem, file);
      continue;
    }
    const prevSize = fs.statSync(path.join(galleryDirectory, prev)).size;
    if (size < prevSize) byStem.set(stem, file);
  }

  return Array.from(byStem.values()).map((file) => ({
    src: `/assets/gallery/${file}`,
    alt: formatPressShotAlt(file),
  }));
}
