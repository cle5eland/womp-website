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

  return pressShotFiles.map((file) => ({
    src: `/assets/gallery/${file}`,
    alt: formatPressShotAlt(file),
  }));
}
