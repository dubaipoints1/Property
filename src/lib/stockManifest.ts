// Stock-image manifest loader (Phase E, May 2026 image-forward redesign).
//
// Tracks every photograph rendered on the site with full provenance:
// source, photographer, licence, fetched-at. Editor adds entries by
// running `npm run fetch:stock` against the Pexels API; the script
// downloads the file to public/images/stock/<slug>.jpg and appends a
// manifest entry. Hand-uploaded covers under public/cover/<slug>.jpg
// use source: "editorial" with photographer set to the credit owner.
//
// Module-load fails fast on schema drift so a malformed manifest can
// never reach production.

import { z } from "astro:content";
import manifestJson from "../../data/stock/manifest.json";

const STOCK_SOURCE = z.enum(["pexels", "unsplash", "editorial"]);

const StockEntrySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  source: STOCK_SOURCE,
  source_url: z.string().url().optional(),
  source_id: z.string().optional(),
  query: z.string().optional(),
  photographer: z.string(),
  photographer_url: z.string().url().optional(),
  licence: z.string(),
  licence_url: z.string().url().optional(),
  file: z.string().regex(/^(images\/stock|cover)\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1, "alt text must be present"),
  fetched_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fetched_at must be YYYY-MM-DD"),
  usage_hint: z.string().optional(),
});

const StockManifestSchema = z.object({
  version: z.literal(1),
  entries: z.array(StockEntrySchema),
});

const parsed = StockManifestSchema.safeParse(manifestJson);
if (!parsed.success) {
  throw new Error(
    `data/stock/manifest.json failed schema validation: ${parsed.error.message}`,
  );
}

export type StockEntry = z.infer<typeof StockEntrySchema>;
export type StockManifest = z.infer<typeof StockManifestSchema>;

const manifest: StockManifest = parsed.data;
const bySlug = new Map<string, StockEntry>(
  manifest.entries.map((entry) => [entry.slug, entry]),
);

export function getStockEntry(slug: string): StockEntry | undefined {
  return bySlug.get(slug);
}

export function hasStockEntry(slug: string): boolean {
  return bySlug.has(slug);
}

export function allStockEntries(): StockEntry[] {
  return manifest.entries;
}
