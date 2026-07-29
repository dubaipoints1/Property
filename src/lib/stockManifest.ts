// Stock-image manifest loader (Phase E, May 2026 image-forward redesign).
//
// Tracks every image rendered on the site with full provenance:
// source, photographer, licence, fetched-at. Editor adds entries by
// running `npm run fetch:stock` against the Pexels API; the script
// downloads the file to public/images/stock/<slug>.jpg and appends a
// manifest entry. Hand-uploaded covers under public/cover/<slug>.jpg
// use source: "editorial" with photographer set to the credit owner.
//
// AI-generated illustration (source: "ai-generated", added by the
// 2026-07-29 Charter amendment) lives under public/images/ai/ and is
// held to the same provenance standard: `generator` names the model
// and `prompt` records the full generating prompt. The prompt does for
// an AI image what source_url does for a stock photo — it is how
// anyone reconstructs where the picture came from — so the refinement
// below makes both fields mandatory on that source. `photographer` on
// an AI entry is the generating model's display name, which is what
// <ImageCredit> renders in the "not a photograph" label.
//
// Module-load fails fast on schema drift so a malformed manifest can
// never reach production — which is also what stops an unlabelled or
// unattributed AI image from shipping.

import { z } from "astro:content";
import manifestJson from "../../data/stock/manifest.json";

const STOCK_SOURCE = z.enum(["pexels", "unsplash", "editorial", "ai-generated"]);

const StockEntrySchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
    source: STOCK_SOURCE,
    source_url: z.string().url().optional(),
    source_id: z.string().optional(),
    query: z.string().optional(),
    photographer: z.string(),
    photographer_url: z.string().url().optional(),
    licence: z.string(),
    licence_url: z.string().url().optional(),
    file: z
      .string()
      .regex(/^(images\/stock|images\/ai|cover)\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().min(1, "alt text must be present"),
    fetched_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fetched_at must be YYYY-MM-DD"),
    usage_hint: z.string().optional(),
    /** AI only — the generating model, e.g. "FLUX.1 [dev] via fal.ai". */
    generator: z.string().optional(),
    /** AI only — the full generating prompt, verbatim. */
    prompt: z.string().optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.source === "ai-generated") {
      if (!entry.generator) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["generator"],
          message: `"${entry.slug}": ai-generated entries must name the generating model`,
        });
      }
      if (!entry.prompt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prompt"],
          message: `"${entry.slug}": ai-generated entries must record the full generating prompt`,
        });
      }
      if (!entry.file.startsWith("images/ai/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["file"],
          message: `"${entry.slug}": ai-generated files live under images/ai/, not alongside photographs`,
        });
      }
    } else if (entry.generator || entry.prompt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["generator"],
        message: `"${entry.slug}": generator/prompt are only valid on source "ai-generated"`,
      });
    }
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

/** True when the entry is AI illustration and must render the label. */
export function isAiGenerated(entry: StockEntry): boolean {
  return entry.source === "ai-generated";
}
