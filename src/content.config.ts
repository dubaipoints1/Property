import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

const NETWORK = z.enum(["Visa", "Mastercard", "Amex"]);
const REGION = z.enum(["UAE", "GCC", "Global"]);
const DEAL_CATEGORY = z.enum([
  "welcome-bonus",
  "transfer-bonus",
  "spend-promo",
  "fee-waiver",
  "other",
]);
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

const cards = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cards" }),
  schema: z.object({
    bank: reference("banks"),
    name: z.string(),
    network: NETWORK,
    categories: z.array(CARD_CATEGORY).default([]),

    // ── Fees ──────────────────────────────────────────────────────────────
    joiningFee: z
      .object({ amount: z.number().nonnegative(), currency: z.literal("AED").default("AED") })
      .optional(),
    annualFee: z.object({
      amount: z.number().nonnegative(),
      currency: z.literal("AED").default("AED"),
    }),
    annualFeeWaiver: z.string().optional(),
    fxFee: z.number().min(0).max(10),
    interestRate: z
      .object({
        monthly: z.number(),
        annual: z.number().optional(),
      })
      .optional(),
    minPayment: z.string().optional(),
    cashAdvanceFee: z.string().optional(),

    // ── Earn ──────────────────────────────────────────────────────────────
    loyaltyProgram: z.string().optional(),
    earnRates: z.object({
      dining: z.number().optional(),
      groceries: z.number().optional(),
      travel: z.number().optional(),
      fuel: z.number().optional(),
      entertainment: z.number().optional(),
      online: z.number().optional(),
      international: z.number().optional(),
      everythingElse: z.number(),
    }),
    earnUnit: z.string().optional(),

    // ── Welcome offer ─────────────────────────────────────────────────────
    welcomeBonus: z.string().optional(),
    welcomeBonusValue: z.number().optional(),

    // ── Eligibility ───────────────────────────────────────────────────────
    eligibility: z.object({
      minSalary: z.number().nonnegative(),
      salaryTransferRequired: z.boolean(),
      residencyRequired: z.boolean(),
      employmentTypes: z.array(EMPLOYMENT_TYPE).default(["salaried"]),
      minAge: z.number().optional(),
      nationalities: z.string().optional(),
      documents: z.array(z.string()).default([]),
    }),

    // ── Perks & partners ─────────────────────────────────────────────────
    perks: z.array(z.string()).default([]),
    transferPartners: z.array(reference("programs")).default([]),

    // ── Meta ─────────────────────────────────────────────────────────────
    applyUrl: z.string().url().optional(),
    kfsUrl: z.string().url().optional(),
    lastVerified: z.coerce.date(),
    sources: z.array(z.string().url()).min(1),
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

export const collections = { banks, cards, programs, deals, guides };
