#!/usr/bin/env node
// make-thumbs — responsive WebP derivatives for every manifest image.
//
// Listing tiles render 300–720 CSS px wide, but every manifest photograph
// is a full-size original (mostly 1880px JPEG, 150–550 KB). On 10 October
// 2026 that made /news/ ~8.4 MB and /guides/ ~4.9 MB on a full scroll.
// This writes two derivatives beside each original:
//
//   public/<dir>/thumb/<slug>.webp   640px wide
//   public/<dir>/md/<slug>.webp      1200px wide
//
// where <dir> is the original's own directory (images/stock or images/ai),
// so an AI illustration's derivatives stay under images/ai/ with it.
// The originals are kept untouched and remain the manifest's `file` — the
// manifest entry (source, photographer, licence, prompt) is still the one
// provenance record; a derivative is the same picture, resized, and
// carries no separate claim. StockImage.astro builds `srcset` from
// whichever derivatives exist on disk (src/lib/stockDerivatives.ts), so an
// image added by fetch:stock / gen:ai before this has run still renders
// from its original.
//
// Issuer card art (data/card-art/manifest.json, 2026-10-09 amendment:
// "unmodified apart from trimming and resizing") gets one smaller
// derivative, public/images/cards/thumb/<slug>.webp at 360px, for the
// ~120px rows on /cards/; src/components/CardImage.astro lists it in
// srcset beside the original.
//
// Usage:
//   npm run images:thumbs            # write missing derivatives
//   npm run images:thumbs -- --force # rewrite all
//   npm run images:thumbs -- --check # exit 1 if any are missing (no writes)
//
// Derivatives are committed: they are static assets, and Cloudflare Pages
// deploys public/ as-is. Re-run after adding a manifest image.

import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Keep in step with src/lib/stockDerivatives.ts.
export const DERIVATIVES = [
  { dir: "thumb", width: 640 },
  { dir: "md", width: 1200 },
];
const QUALITY = 72;
export const CARD_ART_DERIVATIVES = [{ dir: "thumb", width: 360 }];
const CARD_ART_QUALITY = 82; // card faces carry small type; keep it crisp

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const check = args.has("--check");

const exists = (p) => stat(p).then(() => true, () => false);

const manifest = JSON.parse(await readFile(path.join(ROOT, "data/stock/manifest.json"), "utf8"));
const cardArt = JSON.parse(await readFile(path.join(ROOT, "data/card-art/manifest.json"), "utf8"));
let written = 0;
let skipped = 0;
let bytes = 0;
const missing = [];

const jobs = [
  ...manifest.entries.map((e) => ({ slug: e.slug, file: e.file, width: e.width, set: DERIVATIVES, quality: QUALITY })),
  ...Object.entries(cardArt)
    .filter(([, e]) => e && e.file && e.width)
    .map(([slug, e]) => ({ slug, file: e.file, width: e.width, set: CARD_ART_DERIVATIVES, quality: CARD_ART_QUALITY })),
];

for (const entry of jobs) {
  const src = path.join(PUBLIC, entry.file);
  const dir = path.dirname(entry.file);
  for (const d of entry.set) {
    // No upscaling: an original narrower than the derivative gets none.
    if (entry.width <= d.width) continue;
    const out = path.join(PUBLIC, dir, d.dir, `${entry.slug}.webp`);
    if (!force && (await exists(out))) {
      skipped += 1;
      continue;
    }
    if (check) {
      missing.push(path.relative(ROOT, out));
      continue;
    }
    await mkdir(path.dirname(out), { recursive: true });
    const info = await sharp(src)
      .rotate()
      .resize({ width: d.width, withoutEnlargement: true })
      .webp({ quality: entry.quality, effort: 5 })
      .toFile(out);
    written += 1;
    bytes += info.size;
  }
}

if (check) {
  if (missing.length) {
    console.error(`[thumbs] ${missing.length} derivative(s) missing — run npm run images:thumbs`);
    for (const m of missing) console.error(`  ${m}`);
    process.exit(1);
  }
  console.log(`[thumbs] all derivatives present (${skipped})`);
} else {
  console.log(`[thumbs] wrote ${written} (${(bytes / 1024 / 1024).toFixed(2)} MB), kept ${skipped} existing`);
}
