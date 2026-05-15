/**
 * Resize/compress images under public/assets for web delivery.
 * Run: node scripts/optimize-public-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/assets");
const MIN_BYTES = 400 * 1024;

/** Long edge caps by role (pixels). */
const CAPS = {
  hero: 2560,
  profile: 1600,
  gallery: 2000,
};

function roleFor(relPath) {
  const base = path.basename(relPath).toLowerCase();
  if (base === "hero.jpg" || base.startsWith("hero.")) return "hero";
  if (base.includes("profile")) return "profile";
  return "gallery";
}

async function optimizeFile(absPath) {
  const stat = fs.statSync(absPath);
  if (stat.size < MIN_BYTES) return null;

  const rel = path.relative(ROOT, absPath);
  const cap = CAPS[roleFor(rel)];
  const before = stat.size;

  const image = sharp(absPath, { failOn: "none" });
  const meta = await image.metadata();
  const hasAlpha = meta.hasAlpha === true;
  const ext = path.extname(absPath).toLowerCase();
  const isPng = ext === ".png";

  let pipeline = image.rotate().resize({
    width: cap,
    height: cap,
    fit: "inside",
    withoutEnlargement: true,
  });

  let outPath = absPath;
  if (isPng && hasAlpha) {
    pipeline = pipeline.png({ compressionLevel: 9, palette: false });
  } else if (isPng && !hasAlpha) {
    outPath = absPath.replace(/\.png$/i, ".jpg");
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  } else {
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    if (ext !== ".jpg" && ext !== ".jpeg") {
      outPath = absPath.replace(/\.[^.]+$/i, ".jpg");
    }
  }

  const buf = await pipeline.toBuffer();
  if (buf.length >= before * 0.95) return null;

  if (outPath !== absPath && fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
  fs.writeFileSync(outPath, buf);
  return {
    rel,
    before,
    after: buf.length,
    out: path.basename(outPath),
  };
}

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...(await walk(abs)));
    else if (/\.(jpe?g|png|webp)$/i.test(ent.name)) files.push(abs);
  }
  return files;
}

const files = await walk(ROOT);
let saved = 0;
for (const f of files) {
  const result = await optimizeFile(f);
  if (result) {
    saved += result.before - result.after;
    console.log(
      `${result.rel}: ${(result.before / 1024 / 1024).toFixed(1)}MB → ${(result.after / 1024 / 1024).toFixed(2)}MB (${result.out})`,
    );
  }
}
console.log(`\nTotal saved: ${(saved / 1024 / 1024).toFixed(1)} MB across ${files.length} files scanned.`);
