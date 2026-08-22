import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const REGION = z.enum(["UAE", "GCC", "Global"]);
const DEAL_CATEGORY = z.enum([
  "welcome-bonus",
  "transfer-bonus",
  "spend-promo",
  "fee-waiver",
  // Travel-desk variants (2026-07-27 council follow-up): airline and
  // hotel offers are not bank products and need their own categories.
  "fare-sale",
  "points-promo",
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
      email: z.email().optional(),
      website: z.url().optional(),
    }),
    cards: z.array(reference("cards")).default([]),
    /** Optional reward-currency overview for the bank hub. Falls back to
        a placeholder when absent. Qualitative prose only — no typed
        numerics per Charter §6. */
    rewardCurrencies: z.string().optional(),
    /** Related guides surfaced in the hub's reading section. */
    relatedGuides: z.array(reference("guides")).default([]),
  }),
});

// Cards content collection — editorial layer (L3) only.
// Card attributes (fees, earn rates, eligibility, perks, sources) live in
// `src/data/cards.json` and load via `src/lib/cardsData.ts`. The MDX file
// here is for editorial prose + per-card editor verdict.

// ── Phase 2a.2.3 (2026-05-20) — Editor scorecard schema ─────────────────
// Tier badge, five dimension scores (0–5 in 0.5 steps), and one-line
// Apply / Skip qualifiers. Surfaced by <EditorScorecard /> at the end
// of the article body; replaces the layout's old `.dp-spec-card.is-call`
// repetition. Rubric documented at /editorial-policy/how-we-score/.
const TIER = z.enum(["editors-pick", "strong", "solid", "niche", "skip"]);

const ScoreDimensions = z.object({
  welcomeValue: z.number().min(0).max(5).multipleOf(0.5).optional(),
  earnRate: z.number().min(0).max(5).multipleOf(0.5).optional(),
  perks: z.number().min(0).max(5).multipleOf(0.5).optional(),
  feeValue: z.number().min(0).max(5).multipleOf(0.5).optional(),
  access: z.number().min(0).max(5).multipleOf(0.5).optional(),
});

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

    // ── Phase 2a.2.3 (2026-05-20) — Editor scorecard ────────────────────
    /** 1–2 sentence, ≤30-word kicker. Surfaced by <EditorVerdict /> when
     * present; otherwise falls back to the first sentence of editorTake.
     * Cap raised from 160 → 200 chars in implementation to fit the
     * Standards-Editor-locked Skywards Infinite reference copy (177ch /
     * 30 words). Still meaningful as a marketing-prose guard. */
    kicker: z.string().max(200).optional(),
    tier: TIER.optional(),
    scores: ScoreDimensions.optional(),
    applyIf: z.string().max(120).optional(),
    skipIf: z.string().max(120).optional(),

    // ── Phase 2a.2.5 (2026-05-21) — Key takeaways ──────────────────────
    // 2–4 short bullets surfaced by <KeyTakeaways /> near the top of the
    // card review. Modelled on Upgraded Points' "Key Takeaways" pattern:
    // the reader who only reads the first screen still leaves with the
    // headline judgement, the headline figure, and the headline caveat.
    keyTakeaways: z
      .array(z.string().min(8).max(140))
      .min(2)
      .max(4)
      .optional(),

    // ── Phase 2a.2.4 (2026-05-21) — Hero photograph ────────────────────
    // Optional licensed editorial photo above the card-review body.
    // `src` is a filename in `src/assets/cards/library/` (the per-image
    // licensing register lives in that directory's LIBRARY.md). The
    // `<HeroImage />` component resolves the filename at build time
    // and hands the resolved metadata to Astro's <Image> optimiser.
    heroImage: z
      .object({
        src: z
          .string()
          .regex(/^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i, "must be a library filename"),
        alt: z.string().min(8).max(140),
        caption: z.string().max(120).optional(),
        credit: z.string().max(80).optional(),
      })
      .optional(),
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

// Deals carry ONE issuer, which is either a UAE bank (card offers — the
// original shape) or a loyalty programme (airline/hotel offers — added
// 2026-07-27 when the Travel nav's "Airline deals" row had nowhere real
// to point; the `programs` collection covers both airline and hotel
// programmes). Exactly one must be set: a deal with neither has no
// issuer to attribute, and one with both is ambiguous about whose offer
// it is. `.superRefine` gives a message naming the file's own fields
// rather than a bare union error.
const deals = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/deals" }),
  schema: z
    .object({
      title: z.string(),
      /** UAE bank issuing a card offer. Mutually exclusive with `program`. */
      bank: reference("banks").optional(),
      /** Airline/hotel loyalty programme running the offer. Mutually exclusive with `bank`. */
      program: reference("programs").optional(),
      /** When the deal was first published. RSS pubDate; `expiresOn` is not a publication date. */
      publishedAt: z.coerce.date(),
      /** When a human last checked the offer against the issuer's page. */
      lastVerified: z.coerce.date(),
      expiresOn: z.coerce.date(),
      /**
       * Set true when the deal expires. Expired-but-unarchived deals fail
       * scripts/ci/check-deal-expiry.mjs — the weekly sweep the 2026-H2
       * editorial strategy mandates, enforced instead of remembered.
       */
      archived: z.boolean().default(false),
      category: DEAL_CATEGORY,
    })
    .superRefine((data, ctx) => {
      const hasBank = data.bank !== undefined;
      const hasProgram = data.program !== undefined;
      if (!hasBank && !hasProgram) {
        ctx.addIssue({
          code: "custom",
          message:
            "A deal needs an issuer: set either `bank` (card offers) or `program` (airline/hotel offers).",
        });
      }
      if (hasBank && hasProgram) {
        ctx.addIssue({
          code: "custom",
          message:
            "Set `bank` OR `program`, not both — a deal is attributed to a single issuer.",
        });
      }
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
  sourceUrl: z.url(),
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

// ── News desks (2026-07-27 council session: travel-news-desks-strategy) ──
// `beat` is a second, orthogonal axis to `category`. Category answers
// "what kind of story is this?" (deal-update, programme-change, …);
// beat answers "which desk filed it?" (banking / airline / hotel). The
// two must not be conflated: a Skywards devaluation is an *airline*-beat
// *programme-change*. Beat is optional — publication-level posts (e.g.
// the newsroom launch note) carry no beat and appear only on /news/.
// Beat-filtered indexes live at /news/banking/, /news/airlines/,
// /news/hotels/.
const NEWS_BEAT = z.enum(["banking", "airline", "hotel"]);

const news = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/news" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    // The date after which the story's claims stop being safe to serve
    // as-is (a promotion window closing, a registration deadline). Set by
    // the editor from the story's own prose — never extracted (§6). Past
    // it, the news-expiry sweep (scripts/ci/check-news-expiry.mjs) flags
    // the story until updatedAt is bumped past staleAfter by a re-check.
    staleAfter: z.coerce.date().optional(),
    category: NEWS_CATEGORY.default("news"),
    beat: NEWS_BEAT.optional(),
    relatedCards: z.array(reference("cards")).default([]),
    relatedPrograms: z.array(reference("programs")).default([]),
    relatedBanks: z.array(reference("banks")).default([]),
    sources: z.array(z.url()).default([]),
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
