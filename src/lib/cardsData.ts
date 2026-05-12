// Card data layer (L2) — Audit 06: typed features + structured welcomeBonus +
// structured annualFeeWaiver + earn caps.
//
// Loads + validates `src/data/cards.json` — the canonical, machine-readable
// store for every card's attributes. Editorial prose lives separately in
// `src/content/cards/<slug>.mdx` (L3); pages join L2 + L3 by slug.
//
// Schema evolution from Audit 05:
//   - welcomeBonus: string  →  structured object { amount, unit, spend_threshold_aed, qualify_window_days, headline_value_aed }
//   - annualFeeWaiver: string → structured object { year_one_waived, ongoing_threshold_aed, threshold_period }
//   - perks: string[]       →  kept (free-text fallback for stuff not yet typed)
//   - _features: NEW       —  discriminated union of 14 typed perk types
//   - earnRates._caps: NEW  —  monthly cap totals + per-category caps
//
// Per Karim's rule: the scraper does NOT write _features. Editor reads
// scraper-output free-text perks (in _scraped_freetext) and adds typed
// _features by hand. Provenance for _features is always "editor-confirmed".

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

// ── PartnerBrand enum (C1) ───────────────────────────────────────────────
//
// Brand-affinity filter slugs. Codified from the May 2026
// `uaecreditcardmatch.com` competitor analysis Q5 list (20 slugs) plus two
// UAE co-brand staples (du, careem) the competitor missed. Each slug names
// the brand cluster the editor folds together when typing partnerBrands[]
// (per the C1.1 backfill SOP). New slugs require Chairman approval per
// Charter §1.
//
// The single-line JSDoc per slug is the contract the editor SOP references
// when deciding which slug a co-brand mention belongs to.
const PARTNER_BRAND = z.enum([
  /** Emaar group: Dubai Mall, Address Hotels, Burj Khalifa, U by Emaar. */
  "emaar",
  /** Majid Al Futtaim: Carrefour, SHARE, City Centres, MAF malls, VOX. */
  "majid-al-futtaim",
  /** LuLu Hypermarket and LuLu rewards. */
  "lulu",
  /** noon Group: noon.com, noon Minutes, noon Food, NowNow, Namshi. */
  "noon",
  /** Talabat food delivery. */
  "talabat",
  /** ADNOC fuel network and Oasis stores. */
  "adnoc",
  /** ENOC / EPPCO fuel network plus YES Card loyalty. */
  "enoc",
  /** Al-Futtaim Blue Rewards: IKEA, ACE, M&S, Toys R Us, Robinsons. */
  "al-futtaim",
  /** Etihad Airways and Etihad Guest miles. */
  "etihad",
  /** Emirates Airline and Skywards miles. */
  "skywards",
  /** Marriott Bonvoy hotels and rewards. */
  "marriott",
  /** Booking.com travel platform. */
  "booking-com",
  /** Amazon.ae marketplace. */
  "amazon-ae",
  /** Shukran loyalty: Centrepoint, MAX, Splash, Lifestyle, Babyshop,
   *  Shoemart, Homebox, Styli. */
  "shukran",
  /** Aldar properties, Yas Island, Yas Mall (Darna programme). */
  "aldar",
  /** GEMS Education: school fees, bus, canteen, uniforms. */
  "gems",
  /** dnata Travel and Emirates Leisure Retail. */
  "dnata",
  /** Air Arabia airline and AirRewards. */
  "air-arabia",
  /** Etisalat: Smiles app, Smiles rewards, elGrocer. */
  "etisalat",
  /** Choithrams supermarkets. */
  "choithrams",
  /** du telco rewards (not in competitor Q5; UAE-reality addition). */
  "du",
  /** Careem rides and Careem Plus (not in competitor Q5; UAE-reality
   *  addition). */
  "careem",
]);

export type PartnerBrand = z.infer<typeof PARTNER_BRAND>;

/** Per-field provenance — used by the matcher to filter unverified fields. */
const PROVENANCE = z.enum([
  "scraped",
  "editor-confirmed",
  "editor-corrected",
  "needs-review",
]);

// ── Structured welcomeBonus + annualFeeWaiver ────────────────────────────

const REWARD_UNIT = z.enum([
  "skywards_miles",
  "etihad_guest_miles",
  "qatar_avios",
  "saudia_alfursan",
  "share_points",
  "lulu_points",
  "upoints",
  "fab_rewards",
  "enbd_plus_points",
  "enbd_smiles",
  "adcb_touchpoints",
  "mashreq_salaam",
  "aed_cashback",
  "aed_voucher",
  "aed_credit",
]);

const WelcomeBonus = z.object({
  amount: z.number().nonnegative(),
  unit: REWARD_UNIT,
  spend_threshold_aed: z.number().nonnegative().nullable(),
  qualify_window_days: z.number().int().positive().nullable(),
  /** Editor-estimated AED equivalent value. Optional, but build-time
   * warning fires if absent on structured form (so sorting / comparison
   * work across cards). Editor backfills via the SOP at
   * .council/sops/features-typing.md when the cycle catches it. */
  headline_value_aed: z.number().nonnegative().optional(),
  /** Free-text qualifier kept for display, e.g. "first 3 billing statements". */
  notes: z.string().optional(),
});

/** Bifurcated welcome bonus — for cards that pay different bonuses
 * with vs without salary transfer. At least one branch must be set;
 * the matcher renders the relevant branch based on the reader's
 * salary-transfer filter. */
const WelcomeBonusBifurcated = z
  .object({
    with_salary_transfer: WelcomeBonus.optional(),
    without_salary_transfer: WelcomeBonus.optional(),
  })
  .refine(
    (v) => v.with_salary_transfer !== undefined || v.without_salary_transfer !== undefined,
    "Bifurcated welcomeBonus must set at least one of with_salary_transfer / without_salary_transfer",
  );

const AnnualFeeWaiver = z.object({
  year_one_waived: z.boolean(),
  ongoing_threshold_aed: z.number().nonnegative().nullable(),
  threshold_period: z.enum(["annual", "monthly"]).default("annual"),
  notes: z.string().optional(),
});

// ── Typed feature discriminated union (14 types) ─────────────────────────

const CinemaBogoFeature = z.object({
  type: z.literal("cinema_bogo"),
  operator: z.string(), // "VOX", "Reel", "Roxy"
  max_per_month: z.union([z.number().nonnegative(), z.literal("unlimited")]),
  fb_discount_pct: z.number().min(0).max(100).nullable().optional(),
  min_monthly_spend_aed: z.number().nonnegative().nullable().optional(),
  notes: z.string().optional(),
});

const EntertainerBogoFeature = z.object({
  type: z.literal("entertainer_bogo"),
  program: z.string().default("The Entertainer"),
  scope: z.enum(["unlimited", "limited"]).default("unlimited"),
  notes: z.string().optional(),
});

const LoungeAccessFeature = z.object({
  type: z.literal("lounge_access"),
  network: z.string(), // "DragonPass", "Visa Airport Companion", "Priority Pass", "Marhaba"
  scope: z.union([
    z.literal("unlimited"),
    z.object({ visits_per_year: z.number().int().positive() }),
  ]),
  geo: z.array(z.enum(["UAE", "ME", "global"])).default(["UAE"]),
  notes: z.string().optional(),
});

const HotelDiscountFeature = z.object({
  type: z.literal("hotel_discount"),
  operator: z.string(), // "Emaar", "MAF", "Marriott", "Atlantis", "Address"
  discount_pct: z.number().min(0).max(100),
  scope: z.string().optional(), // free-text qualifier ("F&B and spa", "stays only")
});

const HotelEarnBoostFeature = z.object({
  type: z.literal("hotel_earn_boost"),
  operator: z.string(),
  earn_pct: z.number().min(0).max(100),
  notes: z.string().optional(),
});

const GolfFeature = z.object({
  type: z.literal("golf"),
  discount_pct: z.number().min(0).max(100),
  courses_count: z.number().int().nonnegative().optional(),
  scope: z.enum(["UAE", "global"]).default("UAE"),
});

const StatusMatchFeature = z.object({
  type: z.literal("status_match"),
  program: z.string(), // "Skywards", "Etihad Guest", "U by Emaar"
  tier: z.string(), // "Silver", "Platinum"
  duration: z.enum(["year_one", "ongoing"]).default("year_one"),
});

const InsuranceLifeFeature = z.object({
  type: z.literal("insurance_life"),
  cover_aed: z.number().nonnegative(),
});

const InsuranceTravelFeature = z.object({
  type: z.literal("insurance_travel"),
  scope: z.string().optional(),
});

const ConciergeFeature = z.object({
  type: z.literal("concierge"),
  scope: z.enum(["24/7", "business_hours"]).default("24/7"),
});

const TransitCardFeature = z.object({
  type: z.literal("transit_card"),
  /** Networks the card is enrolled into for tap-to-pay. */
  networks: z.array(
    z.enum(["Nol", "Salik", "RTA bus", "Dubai Ferry", "RTA parking"]),
  ),
  notes: z.string().optional(),
});

const ValetFeature = z.object({
  type: z.literal("valet"),
  location: z.string(),
  scope: z.string().optional(),
});

const RoadsideAssistanceFeature = z.object({
  type: z.literal("roadside_assistance"),
  scope: z.enum(["uae", "gcc", "global"]).default("uae"),
});

const TravelDeskDiscountFeature = z.object({
  type: z.literal("travel_desk_discount"),
  flights_pct: z.number().min(0).max(100),
  holiday_pct: z.number().min(0).max(100),
  desk_name: z.string().optional(),
});

const Feature = z.discriminatedUnion("type", [
  CinemaBogoFeature,
  EntertainerBogoFeature,
  LoungeAccessFeature,
  HotelDiscountFeature,
  HotelEarnBoostFeature,
  GolfFeature,
  StatusMatchFeature,
  InsuranceLifeFeature,
  InsuranceTravelFeature,
  ConciergeFeature,
  TransitCardFeature,
  ValetFeature,
  RoadsideAssistanceFeature,
  TravelDeskDiscountFeature,
]);

// ── Earn caps ────────────────────────────────────────────────────────────

const EarnCaps = z.object({
  /** Total cashback/points cap per calendar month, in AED. */
  monthly_max_aed: z.number().nonnegative().nullable().optional(),
  /** Per-category monthly caps, AED-denominated. */
  per_category: z
    .record(
      z.string(),
      z.object({ monthly_aed: z.number().nonnegative() }),
    )
    .optional(),
  /** Some cards require min monthly spend to earn anything. */
  min_monthly_spend_to_qualify_aed: z.number().nonnegative().nullable().optional(),
});

// ── Card schema ──────────────────────────────────────────────────────────

const EarnRates = z
  .object({
    dining: z.number().optional(),
    groceries: z.number().optional(),
    shopping: z.number().optional(),
    travel: z.number().optional(),
    fuel: z.number().optional(),
    entertainment: z.number().optional(),
    online: z.number().optional(),
    international: z.number().optional(),
    everythingElse: z.number(),
  })
  .extend({ _caps: EarnCaps.optional() });

// Free-text fields that the scraper writes verbatim — kept around so the
// editor can read them when authoring typed _features. Once a field is
// typed, the freetext copy can be dropped on review.
const ScrapedFreetext = z
  .object({
    welcomeBonus: z.string().optional(),
    annualFeeWaiver: z.string().optional(),
    perks: z.array(z.string()).default([]),
    /** C1 — raw evidence trail for partner-brand mentions in the source
     *  markdown. Editor maps these onto PartnerBrand slugs per the C1.1
     *  SOP. Joined with "; " separator by the normaliser. */
    partnerBrands: z.string().optional(),
  })
  .partial();

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
  /**
   * Either the structured object (preferred), a legacy free-text string,
   * or null (no waiver path). Pages render the structured form when
   * present, fall through to the string for cards still on freetext.
   */
  annualFeeWaiver: z.union([AnnualFeeWaiver, z.string()]).nullable().optional(),
  fxFee: z.number().min(0).max(10),
  interestRate: z
    .object({ monthly: z.number(), annual: z.number().optional() })
    .optional(),
  minPayment: z.string().optional(),
  cashAdvanceFee: z.string().optional(),

  loyaltyProgram: z.string().optional(),
  earnRates: EarnRates,
  earnUnit: z.string().optional(),

  /** Either structured WelcomeBonus, the bifurcated form (different
   * bonus with vs without salary transfer), a legacy free-text string,
   * or null (no welcome bonus published). */
  welcomeBonus: z
    .union([WelcomeBonus, WelcomeBonusBifurcated, z.string()])
    .nullable()
    .optional(),
  /** Legacy: editor-estimated point/mile count. Kept for sort fallback. */
  welcomeBonusValue: z.number().optional(),

  /** Sharia compliance — first-class boolean. Distinct from the `Islamic`
   * tag in `categories` which is for filtering UI only; this field
   * captures whether the issuer represents the card as Sharia-compliant
   * under AAOIFI standards. Editor-confirmed, not scraped. */
  sharia: z.boolean().optional(),

  eligibility: z.object({
    minSalary: z.number().nonnegative(),
    salaryTransferRequired: z.boolean(),
    residencyRequired: z.boolean(),
    employmentTypes: z.array(EMPLOYMENT_TYPE).default(["salaried"]),
    minAge: z.number().optional(),
    nationalities: z.string().optional(),
    documents: z.array(z.string()).default([]),
  }),

  /** Free-text perks. Kept as fallback for benefits not yet in _features. */
  perks: z.array(z.string()).default([]),
  /** Typed feature array. The matcher reads ONLY this. */
  _features: z.array(Feature).default([]),

  /**
   * Brand-affinity taxonomy (C1, May 2026). When a card carries a co-brand
   * relationship or earns boosted points at a specific UAE retailer / airline
   * / hotel group, that brand slug goes here. Editor-typed only — the
   * scraper writes raw evidence to `_scraped_freetext.partnerBrands` for
   * the editor to map onto slugs per the C1.1 backfill SOP. Charter §6:
   * no LLM mapping from freetext to slugs.
   *
   * Optional with no default — absence is meaningful (the audit relies on
   * `_provenance.partnerBrands === "needs-review"` to detect unbackfilled
   * cards). Empty array vs undefined are NOT equivalent.
   */
  partnerBrands: z.array(PARTNER_BRAND).optional(),

  transferPartners: z.array(z.string()).default([]),

  applyUrl: z.string().url().optional(),
  kfsUrl: z.string().url().optional(),
  lastVerified: z.coerce.date(),
  sources: z.array(z.string().url()).min(1),

  /** Per-field provenance map. Keys mirror dotted paths into the data. */
  _provenance: z.record(z.string(), PROVENANCE).default({}),
  _lastScraped: z.string().nullable().default(null),
  /** ISO date string. Required as of Stage 1 schema hardening (2026-05-10):
   * every card must have an editorial review date. Future PRs that touch
   * a card's data without updating _lastReviewed will be flagged in the
   * council sign-off. */
  _lastReviewed: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "_lastReviewed must be an ISO date string"),
  /** Raw scraper output kept verbatim so the editor can author typed
   * fields from it. Optional. */
  _scraped_freetext: ScrapedFreetext.optional(),
});

export type CardData = z.infer<typeof CardDataSchema>;
export type CardFeature = z.infer<typeof Feature>;
export type StructuredWelcomeBonus = z.infer<typeof WelcomeBonus>;
export type StructuredAnnualFeeWaiver = z.infer<typeof AnnualFeeWaiver>;
export type RewardUnit = z.infer<typeof REWARD_UNIT>;

const AllCardsSchema = z.record(z.string(), CardDataSchema);

// Validate at module load — fail fast on any schema drift.
const validated = AllCardsSchema.parse(cardsJson);

// Build-time warnings — non-fatal, surface drift the editor should fix.
{
  const missingHeadlineValue: string[] = [];
  for (const [slug, card] of Object.entries(validated)) {
    const wb = card.welcomeBonus;
    if (
      wb &&
      typeof wb === "object" &&
      "amount" in wb &&
      "unit" in wb &&
      wb.headline_value_aed === undefined
    ) {
      missingHeadlineValue.push(slug);
    }
  }
  if (missingHeadlineValue.length > 0) {
    console.warn(
      `[cardsData] ${missingHeadlineValue.length} card(s) have a structured welcomeBonus without headline_value_aed: ${missingHeadlineValue.join(", ")}. Editor should backfill via the SOP at .council/sops/features-typing.md.`,
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function getCardData(slug: string): CardData | undefined {
  return validated[slug];
}

export function getAllCards(): Array<CardData & { slug: string }> {
  return Object.entries(validated)
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => a.eligibility.minSalary - b.eligibility.minSalary);
}

export function getEditorConfirmedCards(): Array<CardData & { slug: string }> {
  const matcherKeys = ["annualFee", "fxFee", "eligibility", "earnRates"];
  return getAllCards().filter((c) => {
    for (const k of matcherKeys) {
      const p = c._provenance[k];
      if (p === "scraped" || p === "needs-review") return false;
    }
    return true;
  });
}

export function getCardsByBank(
  bankSlug: string,
): Array<CardData & { slug: string }> {
  return getAllCards().filter((c) => c.bank === bankSlug);
}

/** Find all cards whose _features array includes the given type. */
export function getCardsWithFeature(
  featureType: CardFeature["type"],
): Array<CardData & { slug: string }> {
  return getAllCards().filter((c) =>
    c._features.some((f) => f.type === featureType),
  );
}

// Pure formatting helpers live in cardsDataFormat.ts so they're testable
// without astro:content. Re-export so existing imports keep working.
export {
  welcomeBonusDisplay,
  annualFeeWaiverDisplay,
  isStructuredWelcomeBonus,
  isBifurcatedWelcomeBonus,
  isStructuredAnnualFeeWaiver,
} from "./cardsDataFormat";

/**
 * Strip the _caps sub-object from earnRates, returning only the per-category
 * numeric multipliers. Useful for legacy code that expects a flat
 * Record<string, number | undefined>.
 */
export function earnRatesNumeric(
  rates: CardData["earnRates"],
): Record<string, number | undefined> {
  const { _caps: _ignored, ...rest } = rates;
  return rest;
}
