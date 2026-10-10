// Responsive derivatives of manifest images (scripts/images/make-thumbs.mjs).
//
// The manifest keeps one original per slug and that original stays the
// provenance record. The derivatives are the same picture resized to WebP,
// written beside it as <dir>/thumb/<slug>.webp (640w) and
// <dir>/md/<slug>.webp (1200w). They are listed in `srcset` only when the
// file is actually on disk at build time, so an image added before the
// script has been re-run renders from its original instead of a 404.

import { existsSync } from "node:fs";
import path from "node:path";
import type { StockEntry } from "./stockManifest";

// Keep in step with DERIVATIVES in scripts/images/make-thumbs.mjs.
const DERIVATIVES = [
  { dir: "thumb", width: 640 },
  { dir: "md", width: 1200 },
] as const;

const PUBLIC = path.join(process.cwd(), "public");

/** `srcset` for a manifest entry, or undefined when no derivative exists. */
export function stockSrcset(entry: StockEntry): string | undefined {
  const dir = path.posix.dirname(entry.file);
  const parts: string[] = [];
  for (const d of DERIVATIVES) {
    if (entry.width <= d.width) continue;
    const rel = `${dir}/${d.dir}/${entry.slug}.webp`;
    if (existsSync(path.join(PUBLIC, rel))) parts.push(`/${rel} ${d.width}w`);
  }
  if (parts.length === 0) return undefined;
  // The original closes the set, so a wide hero on a dense screen can
  // still reach full resolution.
  parts.push(`/${entry.file} ${entry.width}w`);
  return parts.join(", ");
}

/**
 * `sizes` values for the shared listing grids (.intel-grid / .intel-card-grid
 * on /news/, /guides/, /deals/, /banks/, /airlines/). Measured rendered
 * widths, 10 Oct 2026: tile 348 / 340 / 295 / 347px and featured
 * 348 / 702 / 611 / 715px at 390 / 768 / 1024 / 1280.
 */
export const LISTING_SIZES = {
  tile: "(max-width: 640px) calc(100vw - 42px), (max-width: 1023px) calc(50vw - 44px), 350px",
  featured: "(max-width: 640px) calc(100vw - 42px), (max-width: 1023px) calc(100vw - 66px), 720px",
} as const;

// Issuer card art (data/card-art/manifest.json) gets one 360w derivative
// for the ~120px rows on /cards/. Keep in step with CARD_ART_DERIVATIVES
// in scripts/images/make-thumbs.mjs.
const CARD_ART_THUMB = 360;

/** `srcset` for a card-art entry, or undefined when no derivative exists. */
export function cardArtSrcset(slug: string, art: { file: string; width: number }): string | undefined {
  if (art.width <= CARD_ART_THUMB) return undefined;
  const rel = `${path.posix.dirname(art.file)}/thumb/${slug}.webp`;
  if (!existsSync(path.join(PUBLIC, rel))) return undefined;
  return `/${rel} ${CARD_ART_THUMB}w, /${art.file} ${art.width}w`;
}
