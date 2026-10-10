#!/usr/bin/env node
// Download each card's issuer card art into public/images/cards/<slug>.webp.
//
// Card art policy (Chairman direction, 9 October 2026: "for the cards pull
// the actual images"): a card face is a factual claim about a product, so
// it comes from the ISSUER's own website and nowhere else — never AI, never
// an aggregator, never another card's art. The candidate URLs are collected
// by hand/agent into data/card-art/sources.json (slug -> { url, page, alt,
// note }); this script only fetches what that file names.
//
// Runs in GitHub Actions (fetch-card-art.yml) because the web sandbox cannot
// reach issuer hosts. Writes data/card-art/manifest.json — the provenance
// record (source image URL, the product page it came from, fetch date) that
// the site reads; a slug missing from the manifest renders the typographic
// tile instead.
//
// Usage: node scripts/images/fetch-card-art.mjs [--force]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";

const SOURCES = "data/card-art/sources.json";
const MANIFEST = "data/card-art/manifest.json";
const OUT_DIR = "public/images/cards";
const force = process.argv.includes("--force");

if (!existsSync(SOURCES)) {
  console.log(`${SOURCES} not present yet; nothing to fetch.`);
  process.exit(0);
}
const sources = JSON.parse(readFileSync(SOURCES, "utf8"));
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
mkdirSync(OUT_DIR, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
let ok = 0;
let failed = 0;

for (const [slug, src] of Object.entries(sources)) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`bad slug ${slug}`);
  if (!src?.url) continue;
  const url = new URL(src.url);
  if (url.protocol !== "https:") { console.log(`skip ${slug}: not https`); continue; }
  const file = `${OUT_DIR}/${slug}.webp`;
  if (!force && manifest[slug]?.url === src.url && existsSync(file)) continue;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
        accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
        referer: src.page ?? url.origin,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    // sharp refuses anything that is not an image (an HTML error page
    // served with a 200 fails here rather than being committed).
    const img = sharp(buf, { failOn: "error" });
    const meta = await img.metadata();
    if (!meta.width || meta.width < 200) throw new Error(`too small (${meta.width}px)`);
    const out = await img
      .trim({ threshold: 8 })
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 90 })
      .toBuffer({ resolveWithObject: true });
    writeFileSync(file, out.data);
    manifest[slug] = {
      file: `images/cards/${slug}.webp`,
      width: out.info.width,
      height: out.info.height,
      url: src.url,
      page: src.page ?? null,
      alt: src.alt ?? null,
      fetchedAt: today,
    };
    ok++;
    console.log(`ok   ${slug} ${out.info.width}x${out.info.height} ${out.data.length}B`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${slug}: ${err.message} (${src.url})`);
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
console.log(`done: ${ok} fetched, ${failed} failed, ${Object.keys(sorted).length} in manifest`);
