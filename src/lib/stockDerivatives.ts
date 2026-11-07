// Responsive derivatives of manifest images (scripts/images/make-thumbs.mjs).
//
// The manifest keeps one original per slug and that original stays the
// provenance record. The derivatives are the same picture resized to WebP,
// written beside it as <dir>/thumb/<slug>.webp (640w) and
// <dir>/md/<slug>.webp (1200w). They are listed in `srcset` only when the
// file is actually on disk at build time, so an image added before the
// script has been re-run renders from its original instead of a 404.

import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import path from "node:path";
import type { StockEntry } from "./stockManifest";

// Keep in step with DERIVATIVES in scripts/images/make-thumbs.mjs.
const DERIVATIVES = [
  { dir: "thumb", width: 640 },
  { dir: "md", width: 1200 },
] as const;

const PUBLIC = path.join(process.cwd(), "public");
export type StockDelivery = "compact" | "feature";
const DELIVERY_WIDTHS = {
  compact: [240, 400],
  feature: [400, 800, 960],
} as const;

/** `srcset` for a manifest entry, or undefined when no derivative exists. */
export function stockSrcset(entry: StockEntry, delivery?: StockDelivery): string | undefined {
  const dir = path.posix.dirname(entry.file);
  const parts: { src: string; width: number }[] = [];
  // Static builds produce the referenced copies in astro:build:done. Dev
  // keeps using committed derivatives and the original without that hook.
  if (delivery && (dir === "images/stock" || dir === "images/ai")) {
    for (const width of DELIVERY_WIDTHS[delivery]) {
      if (entry.width > width) parts.push({ src: `/${dir}/compact/${entry.slug}-${width}.webp`, width });
    }
  }
  for (const d of DERIVATIVES) {
    if (entry.width <= d.width) continue;
    const rel = `${dir}/${d.dir}/${entry.slug}.webp`;
    if (existsSync(path.join(PUBLIC, rel))) parts.push({ src: `/${rel}`, width: d.width });
  }
  if (parts.length === 0) return undefined;
  // The original closes the set, so a wide hero on a dense screen can
  // still reach full resolution.
  parts.push({ src: `/${entry.file}`, width: entry.width });
  return parts.sort((a, b) => a.width - b.width).map((part) => `${part.src} ${part.width}w`).join(", ");
}

/** Build-only AVIF enhancement; existing WebP/JPEG delivery is unchanged.
 * The optional 1365w copy is original-sized only, never an invented upscale.
 * Keep the candidate widths/eligibility in step with compact-assets.mjs. */
export function stockAvifSrcset(entry: StockEntry, delivery?: "feature"): string | undefined {
  if (delivery !== "feature") return undefined;
  const dir = path.posix.dirname(entry.file);
  if ((dir !== "images/stock" && dir !== "images/ai") || !/^[a-z0-9-]+$/.test(entry.slug)
    || !Number.isInteger(entry.width) || entry.width <= 0
    || !new RegExp(`^${entry.slug}\\.(?:jpe?g|png|webp|avif)$`).test(path.posix.basename(entry.file))) return undefined;
  const widths = [400, 800, 960, 1200].filter(width => width <= entry.width);
  if (entry.width === 1365) widths.push(entry.width);
  return widths.length
    ? widths.map(width => `/${dir}/compact/${entry.slug}-${width}.avif ${width}w`).join(", ")
    : undefined;
}

/** PNG delivery copy for a modest logo slot, leaving the approved original as src. */
export function compactLogoSrcset(src: string): string | undefined {
  const match = /^\/logos\/(partners|banks)\/([a-z0-9-]+)\.png$/.exec(src);
  if (!match) return undefined;
  const [, folder, name] = match;
  const file = path.join(PUBLIC, "logos", folder, `${name}.png`);
  const original = statSync(file, { throwIfNoEntry: false });
  if (!original?.isFile() || original.size < 12 * 1024) return undefined;
  // PNG IHDR carries the intrinsic width in its fixed first 24 bytes.
  // Keep the original width as the last candidate for dense screens.
  const header = Buffer.alloc(24);
  const fd = openSync(file, "r");
  try {
    if (readSync(fd, header, 0, header.length, 0) !== header.length) return undefined;
  } finally {
    closeSync(fd);
  }
  if (header.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || header.toString("ascii", 12, 16) !== "IHDR") return undefined;
  const width = header.readUInt32BE(16);
  const widths = (folder === "partners" ? [192, 360] : [192]).filter((candidate) => candidate < width);
  if (!widths.length) return undefined;
  return [...widths.map((candidate) => `/logos/${folder}/compact/${name}-${candidate}.png ${candidate}w`), `${src} ${width}w`].join(", ");
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

/** Same approved artwork: modest row thumb, optional feature copy, original. */
export function cardArtSrcset(slug: string, art: { file: string; width: number }, delivery?: "feature"): string | undefined {
  if (art.width <= CARD_ART_THUMB) return undefined;
  const dir = path.posix.dirname(art.file);
  const rel = `${dir}/thumb/${slug}.webp`;
  const parts: { src: string; width: number }[] = [];
  if (existsSync(path.join(PUBLIC, rel))) parts.push({ src: `/${rel}`, width: CARD_ART_THUMB });
  // Build-only, source-validated by compact-assets. Dev and all existing
  // callers retain their committed thumb/original delivery unchanged.
  if (delivery === "feature" && dir === "images/cards" && /^[a-z0-9-]+$/.test(slug) && art.width > 720) {
    parts.push({ src: `/${dir}/compact/${slug}-720.webp`, width: 720 });
  }
  if (!parts.length) return undefined;
  parts.push({ src: `/${art.file}`, width: art.width });
  return parts.map(part => `${part.src} ${part.width}w`).join(", ");
}
