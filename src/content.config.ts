import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

const REGION = z.enum(["UAE", "GCC", "Global"]);
const DEAL_CATEGORY = z.enum([
  "welcome-bonus",
  "transfer-bonus",
  "spend-promo",
  "fee-waiver",
  "other",
]);
const REWARD_TYPE = z.enum(["cash", "voucher", "cashback_monthly", "points"]);
const ADDITIONAL_PRODUCT = z.enum([
  "loan",
  "insurance",
  "savings",
  "mortgage",
  "credit_card",
  "other",
]);
// NETWORK, EMPLOYMENT_TYPE, CARD_CATEGORY moved to src/lib/cardsData.ts (L2).

const banks = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/banks" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    logo: z.string(),
    customerService: z.object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
    }),
    cards: z.array(reference("cards")).default([]),
  }),
});

// Cards content collection — editorial layer (L3) only.
// Card attributes (fees, earn rates, eligibility, perks, sources) live in
// `src/data/cards.json` and load via `src/lib/cardsData.ts`. The MDX file
// here is for editorial prose + per-card editor verdict.
const cards = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cards" }),
  schema: z.object({
    /** File-id slug — matches the key in src/data/cards.json. */
    slug: z.string(),

    // ── Editorial verdict (Audit 03 Decision 3) ─────────────────────────
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
    editorTake: z.string().optional(),
    verifiedBy: z.string().optional(),
  }),
});

const programs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/programs" }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    region: REGION,
    currencyName: z.string(),
    transferPartners: z.array(z.string()).default([]),
    sweetSpots: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
        }),
      )
      .default([]),
    expiryPolicy: z.string(),
  }),
});

const deals = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/deals" }),
  schema: z.object({
    title: z.string(),
    bank: reference("banks"),
    expiresOn: z.coerce.date(),
    category: DEAL_CATEGORY,
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    relatedCards: z.array(reference("cards")).default([]),
    relatedPrograms: z.array(reference("programs")).default([]),
  }),
});

const SalaryBand = z.object({
  minSalary: z.number().nonnegative(),
  maxSalary: z.number().positive().nullable(),
  rewardAmount: z.number().nonnegative(),
  rewardType: REWARD_TYPE,
  voucherRetailer: z.string().optional(),
  monthsToPayout: z.number().int().nonnegative(),
  components: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number().nonnegative(),
        requires: z.string().optional(),
      }),
    )
    .optional(),
});

const SalaryTransferOfferShape = z.object({
  bank: reference("banks"),
  name: z.string(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  tenureMonths: z.number().int().positive(),
  sharia: z.boolean(),
  creditCardRequired: z.boolean(),
  additionalProductsRequired: z.array(ADDITIONAL_PRODUCT).default([]),
  salaryBands: z.array(SalaryBand).min(1),
  requirements: z.array(z.string()).default([]),
  clawbackTerms: z.string(),
  sourceUrl: z.string().url(),
  lastVerified: z.coerce.date(),
  archived: z.boolean().default(false),
});

const salaryTransferOffers = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/salaryTransferOffers",
  }),
  schema: SalaryTransferOfferShape,
});

const salaryTransferOfferHistory = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/salaryTransferOfferHistory",
  }),
  schema: SalaryTransferOfferShape.extend({
    archived: z.literal(true),
    archivedReason: z.string().optional(),
  }),
});

const bankReputation = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/bankReputation",
  }),
  schema: z.object({
    bank: reference("banks"),
    customerServiceRating: z.number().min(0).max(5),
    appStoreRatingIOS: z.number().min(0).max(5).optional(),
    appStoreRatingAndroid: z.number().min(0).max(5).optional(),
    branchCount: z.number().int().nonnegative().optional(),
    digitalFirst: z.boolean(),
    salaryTransferTurnaroundDays: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  }),
});

const NEWS_CATEGORY = z.enum([
  "news",
  "deal-update",
  "card-launch",
  "regulation",
  "programme-change",
  "salary-transfer",
]);

const news = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/news" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: NEWS_CATEGORY.default("news"),
    relatedCards: z.array(reference("cards")).default([]),
    relatedPrograms: z.array(reference("programs")).default([]),
    relatedBanks: z.array(reference("banks")).default([]),
    sources: z.array(z.string().url()).default([]),
  }),
});

export const collections = {
  banks,
  cards,
  programs,
  deals,
  guides,
  news,
  salaryTransferOffers,
  salaryTransferOfferHistory,
  bankReputation,
};
