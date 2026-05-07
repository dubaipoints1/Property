// Card data layer (L2).
//
// Loads + validates `src/data/cards.json` — the canonical, machine-readable
// store for every card's attributes (fees, earn rates, eligibility, perks,
// sources). Hand-edited or scraper-merged; never auto-generated as MDX.
//
// Editorial prose for each card lives separately in
// `src/content/cards/<slug>.mdx` (L3). Pages join L2 + L3 by slug.

import { z } from "astro:content";
import cardsJson from "../data/cards.json";

const NETWORK = z.enum(["Visa", "Mastercard", "Amex"]);
const EMPLOYMENT_TYPE = z.enum([
  "salaried",
  "self-employed",
  "business-owner",
  "any",
]);
const CARD_CATEGORY = z.enum([
  "travel",
  "cashback",
  "shopping",
  "dining",
  "lifestyle",
  "co-brand",
  "Islamic",
]);

/** Per-field provenance — used by the matcher to filter unverified fields. */
const PROVENANCE = z.enum([
  "scraped",          // emitted by the weekly scraper, not editor-reviewed
  "editor-confirmed", // hand-curated or scraper output then reviewed
  "editor-corrected", // overridden by an editor after scrape disagreement
  "needs-review",     // flagged by a parser as suspicious (e.g. earn rate >10%)
]);

const CardDataSchema = z.object({
  bank: z.string(),
  name: z.string(),
  network: NETWORK,
  categories: z.array(CARD_CATEGORY).default([]),

  joiningFee: z
    .object({
      amount: z.number().nonnegative(),
      currency: z.literal("AED").default("AED"),
    })
    .optional(),
  annualFee: z.object({
    amount: z.number().nonnegative(),
    currency: z.literal("AED").default("AED"),
  }),
  annualFeeWaiver: z.string().optional(),
  fxFee: z.number().min(0).max(10),
  interestRate: z
    .object({ monthly: z.number(), annual: z.number().optional() })
    .optional(),
  minPayment: z.string().optional(),
  cashAdvanceFee: z.string().optional(),

  loyaltyProgram: z.string().optional(),
  earnRates: z.object({
    dining: z.number().optional(),
    groceries: z.number().optional(),
    shopping: z.number().optional(),
    travel: z.number().optional(),
    fuel: z.number().optional(),
    entertainment: z.number().optional(),
    online: z.number().optional(),
    international: z.number().optional(),
    everythingElse: z.number(),
  }),
  earnUnit: z.string().optional(),

  welcomeBonus: z.string().optional(),
  welcomeBonusValue: z.number().optional(),

  eligibility: z.object({
    minSalary: z.number().nonnegative(),
    salaryTransferRequired: z.boolean(),
    residencyRequired: z.boolean(),
    employmentTypes: z.array(EMPLOYMENT_TYPE).default(["salaried"]),
    minAge: z.number().optional(),
    nationalities: z.string().optional(),
    documents: z.array(z.string()).default([]),
  }),

  perks: z.array(z.string()).default([]),
  transferPartners: z.array(z.string()).default([]),

  applyUrl: z.string().url().optional(),
  kfsUrl: z.string().url().optional(),
  lastVerified: z.coerce.date(),
  sources: z.array(z.string().url()).min(1),

  /** Per-field provenance map. Keys mirror dotted paths into the data. */
  _provenance: z.record(z.string(), PROVENANCE).default({}),
  /** ISO date the scraper last touched this card (or null). */
  _lastScraped: z.string().nullable().default(null),
  /** ISO date an editor last reviewed this card (or null). */
  _lastReviewed: z.string().nullable().default(null),
});

export type CardData = z.infer<typeof CardDataSchema>;

const AllCardsSchema = z.record(z.string(), CardDataSchema);

// Validate at module load — fail fast on any schema drift.
const validated = AllCardsSchema.parse(cardsJson);

/** Get one card by slug. Returns undefined if unknown. */
export function getCardData(slug: string): CardData | undefined {
  return validated[slug];
}

/** Get every card, sorted by minimum salary ascending (lowest first). */
export function getAllCards(): Array<CardData & { slug: string }> {
  return Object.entries(validated)
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => a.eligibility.minSalary - b.eligibility.minSalary);
}

/** Filter to cards with all matcher-relevant fields editor-confirmed. */
export function getEditorConfirmedCards(): Array<CardData & { slug: string }> {
  const matcherKeys = [
    "annualFee",
    "fxFee",
    "eligibility",
    "earnRates",
  ];
  return getAllCards().filter((c) => {
    for (const k of matcherKeys) {
      const p = c._provenance[k];
      if (p === "scraped" || p === "needs-review") return false;
    }
    return true;
  });
}

/** Filter cards by bank slug. */
export function getCardsByBank(bankSlug: string): Array<CardData & { slug: string }> {
  return getAllCards().filter((c) => c.bank === bankSlug);
}
