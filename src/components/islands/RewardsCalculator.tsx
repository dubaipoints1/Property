/**
 * RewardsCalculator — spend-ROI calculator island (C3).
 *
 * Reads typed `earnRates` from L2 (`src/data/cards.json` via
 * `src/lib/cardsData.ts`) and ranks cards by AED-equivalent monthly reward
 * given a seven-category spend profile.
 *
 * Two things decide a card's AED figure and they are kept apart on purpose:
 *
 *   1. HOW MANY native units the spend earns — the denominator, parsed from
 *      `earnUnit` by {@link parseEarnBasis}. A rate of `1.5` can mean 1.5
 *      percent, 1.5 points per AED 1, 1.5 miles per AED 10 or 1.5 miles per
 *      USD 1, and this module used to multiply all four by spend alike.
 *   2. WHAT ONE UNIT IS WORTH — resolved from the published baselines in
 *      src/lib/valuations.ts where one exists, and otherwise an openly
 *      labelled placeholder in {@link PLACEHOLDER_AED_PER_UNIT}.
 *
 * Before 10 September 2026 neither was right: percent-denominated cards came
 * out 100x high (the page told readers the RAKBANK World card paid
 * "48,300 % cashback ≈ AED 48,300" a month on AED 7,800 of spend), Etihad
 * Guest 10x on the denominator, and every mile was priced at 4 fils against
 * the 2.0 published on /valuations/.
 *
 * Charter constraints:
 *   - Deterministic only. We read typed numerics; no LLM, no live scraping.
 *   - No new visual idioms. Reuses `.dp-*` classes and brand tokens.
 *   - Methodology surfaces conversion benchmarks openly (honesty discipline).
 */

import { useEffect, useMemo, useState } from "preact/hooks";
import type { CardData } from "../../lib/cardsData";
import { formatEarnRate } from "../../lib/cardsDataFormat";
import { NINETY_DAYS_MS } from "../../lib/verification";
import {
  type EarnBasis,
  earnsAED,
  nativeEarned,
  parseEarnBasis,
} from "../../lib/earnBasis";
import { publishedAEDPerUnit } from "../../lib/valuations";
import { SPEND_PRESETS } from "../../data/spendProfiles";

// ── Public types ─────────────────────────────────────────────────────────

export type SpendProfile = {
  dining: number;
  groceries: number;
  fuel: number;
  travel: number;
  online: number;
  utilities: number;
  entertainment: number;
};

export type CardForCalc = CardData & { slug: string };

export type RankResult = {
  card: CardForCalc;
  /** Monthly reward in the card's native earnUnit (points/miles/AED). */
  monthlyRewardNative: number;
  /**
   * Typed cap that bound this month's reward, in AED, or null when no cap
   * applied. Set only for cashback cards carrying `earnRates._caps`; a
   * points card's AED-denominated cap has no honest mapping to units.
   */
  cappedAtAED: number | null;
  /** True when the uncapped reward exceeded a typed cap and was clamped. */
  capHit: boolean;
  /** Minimum monthly spend the card requires before it earns, if typed. */
  qualifyingSpendAED: number | null;
  /** True when the profile's total spend is below `qualifyingSpendAED`. */
  belowQualifyingSpend: boolean;
  /**
   * Monthly spend at this profile's category mix at which the reward first
   * covers the annual fee's monthly accrual. Null for fee-free cards, for a
   * zero-spend profile, and when a typed cap sits below the fee accrual so
   * the fee is never covered (see `feeNeverCovered`).
   */
  breakEvenMonthlySpendAED: number | null;
  /** True when the typed monthly cap is below annualFee / 12. */
  feeNeverCovered: boolean;
  /** AED equivalent of the native reward. */
  monthlyRewardAED: number;
  /** AED rate used for the conversion (per native unit). */
  aedPerUnit: number;
  /** Monthly annual-fee accrual (annualFee.amount / 12). */
  monthlyFeeAED: number;
  /** Reward AED minus monthlyFeeAED. May be negative. */
  netMonthlyAED: number;
  /** Single biggest contributing spend category by AED reward. */
  topCategory: keyof SpendProfile | null;
  /** Where aedPerUnit came from — drives the disclosure chip on the tile. */
  rateBasis: RateBasis;
  /** True when lastVerified is older than 90 days. */
  staleData: boolean;
};

export type RankOptions = {
  /** If true, subtract monthly fee accrual before ranking. */
  netOfFee: boolean;
  /** Reference date for staleness — defaults to now. Injectable for tests. */
  now?: Date;
};

// ── Conversion ───────────────────────────────────────────────────────────

/**
 * Rate used when this publication has NOT published a baseline for the
 * card's currency — 36 of 58 cards, among them ENBD Plus Points, ADCB
 * TouchPoints, LuLu Points, Darna, U by Emaar, FAB Rewards, dnata, SHARE and
 * Voyager Miles.
 *
 * It is a placeholder, not a valuation, and the UI says so on every card it
 * touches. Chairman direction of 10 September 2026 was to keep these cards
 * in the ranking with the weaker basis disclosed rather than drop two-thirds
 * of the market out of the tool. Publishing a real baseline for a currency
 * means adding a row to src/lib/valuations.ts, after which that currency
 * stops using this number.
 */
export const PLACEHOLDER_AED_PER_UNIT = 0.01;

/** Where a card's AED-per-unit came from — shown to the reader. */
export type RateBasis =
  /** The card pays dirhams; no currency valuation is involved. */
  | "cashback"
  /** Taken from the published baseline on /valuations/. */
  | "published"
  /** No published baseline for this currency; placeholder rate. */
  | "placeholder"
  /** `earnUnit` does not state a denominator — no AED figure is possible. */
  | "unrankable";

export type CardConversion = {
  basis: RateBasis;
  /** null only when basis is "unrankable". */
  earnBasis: EarnBasis | null;
  aedPerUnit: number;
};

/**
 * Resolve how to price one card. Deterministic and total: a card whose
 * `earnUnit` states no denominator is returned as "unrankable" and kept out
 * of the AED ranking, rather than defaulted into it.
 */
export function conversionForCard(card: CardForCalc): CardConversion {
  const earnBasis = parseEarnBasis(card.earnUnit);
  if (!earnBasis) {
    return { basis: "unrankable", earnBasis: null, aedPerUnit: 0 };
  }
  if (earnsAED(card.earnUnit, earnBasis)) {
    return { basis: "cashback", earnBasis, aedPerUnit: 1 };
  }
  const published = publishedAEDPerUnit(card.loyaltyProgram);
  if (published != null) {
    return { basis: "published", earnBasis, aedPerUnit: published };
  }
  return {
    basis: "placeholder",
    earnBasis,
    aedPerUnit: PLACEHOLDER_AED_PER_UNIT,
  };
}

// ── Ranking — exported as a pure function for testability ────────────────

/** The category keys the calculator models, in display order. */
export const SPEND_CATEGORIES: readonly (keyof SpendProfile)[] = [
  "dining",
  "groceries",
  "fuel",
  "travel",
  "online",
  "utilities",
  "entertainment",
] as const;

/** Native reward one category earns on one card, through the card's own denominator. */
function categoryNative(
  card: CardForCalc,
  category: keyof SpendProfile,
  spendAED: number,
  earnBasis: EarnBasis,
): number {
  const r = card.earnRates as unknown as Record<string, number | undefined>;
  const rate = r[category] ?? card.earnRates.everythingElse;
  return nativeEarned(spendAED, rate, earnBasis);
}

/**
 * Apply a cashback card's typed caps to its per-category AED contributions.
 *
 * The methodology page has said since May 2026 that caps are applied "only
 * when the card declares them in typed form" — and until 10 September 2026
 * nothing applied them at all. Thirteen cards carry `_caps`; ADCB 365 caps
 * cashback at AED 1,000 a month and ADIB Cashback at AED 300 on groceries,
 * and the ranking credited both without limit. Found while comparing the
 * kredit.ae compare-page method to ours.
 *
 * Only cashback cards are capped here: their caps are stated in AED and
 * their reward is AED, so the clamp is exact. A points card's AED cap would
 * need a units conversion the issuer does not publish, so it is left
 * uncapped and the tile says nothing about a cap.
 */
function applyCashbackCaps(
  card: CardForCalc,
  contributionsAED: Record<keyof SpendProfile, number>,
): { totalAED: number; cappedAtAED: number | null; capHit: boolean } {
  const caps = card.earnRates._caps;
  const uncapped = Object.values(contributionsAED).reduce((a, b) => a + b, 0);
  if (!caps) return { totalAED: uncapped, cappedAtAED: null, capHit: false };

  let capHit = false;
  let total = 0;
  for (const k of SPEND_CATEGORIES) {
    const perCat = caps.per_category?.[k]?.monthly_aed;
    const v = contributionsAED[k];
    if (perCat != null && v > perCat) {
      capHit = true;
      total += perCat;
    } else {
      total += v;
    }
  }

  const monthlyMax = caps.monthly_max_aed;
  if (monthlyMax != null && total > monthlyMax) {
    return { totalAED: monthlyMax, cappedAtAED: monthlyMax, capHit: true };
  }
  // Report the binding cap when a per-category one fired: the smallest
  // per-category cap that clamped, so the tile can name a figure.
  let binding: number | null = null;
  if (capHit) {
    for (const k of SPEND_CATEGORIES) {
      const perCat = caps.per_category?.[k]?.monthly_aed;
      if (perCat != null && contributionsAED[k] > perCat) {
        binding = binding == null ? perCat : Math.min(binding, perCat);
      }
    }
  }
  return { totalAED: total, cappedAtAED: binding, capHit };
}

/** Compute per-category AED reward and pick the top contributing category. */
function perCategoryBreakdown(
  card: CardForCalc,
  spend: SpendProfile,
  aedPerUnit: number,
  earnBasis: EarnBasis,
  isCashback: boolean,
): {
  totalNative: number;
  totalAED: number;
  uncappedAED: number;
  cappedAtAED: number | null;
  capHit: boolean;
  topCategory: keyof SpendProfile | null;
} {
  const r = card.earnRates;
  const base = r.everythingElse;

  // Per-category native earn, through the card's own denominator — a
  // percentage of spend, units per AED n, or units per USD 1. Multiplying
  // spend by the rate directly is what produced the 100x figures.
  //
  // Utilities reads `r.utilities` like every other category. It used to be
  // pinned to the base rate on the grounds that no card had a utilities key;
  // twelve do, and ten of them publish a rate BELOW their base precisely
  // because utility spend earns less — so the calculator was over-crediting
  // them. Bonvoy World Elite pays 0.3 there against a base of 3.
  const earn = (spendAED: number, rate: number) =>
    nativeEarned(spendAED, rate, earnBasis);
  const contributions: Record<keyof SpendProfile, number> = {
    dining: earn(spend.dining, r.dining ?? base),
    groceries: earn(spend.groceries, r.groceries ?? base),
    fuel: earn(spend.fuel, r.fuel ?? base),
    travel: earn(spend.travel, r.travel ?? base),
    online: earn(spend.online, r.online ?? base),
    utilities: earn(spend.utilities, r.utilities ?? base),
    entertainment: earn(spend.entertainment, r.entertainment ?? base),
  };

  let totalNative = 0;
  let topCategory: keyof SpendProfile | null = null;
  let topAED = 0;
  const contributionsAED = {} as Record<keyof SpendProfile, number>;

  for (const k of Object.keys(contributions) as (keyof SpendProfile)[]) {
    const native = contributions[k];
    totalNative += native;
    const aed = native * aedPerUnit;
    contributionsAED[k] = aed;
    if (aed > topAED) {
      topAED = aed;
      topCategory = k;
    }
  }

  const uncappedAED = totalNative * aedPerUnit;
  if (!isCashback) {
    return { totalNative, totalAED: uncappedAED, uncappedAED, cappedAtAED: null, capHit: false, topCategory };
  }
  const capped = applyCashbackCaps(card, contributionsAED);
  return {
    // Cashback is AED, so the native figure is the capped AED figure too.
    totalNative: capped.totalAED,
    totalAED: capped.totalAED,
    uncappedAED,
    cappedAtAED: capped.cappedAtAED,
    capHit: capped.capHit,
    topCategory,
  };
}

/**
 * Monthly spend, at the profile's own category mix, at which a card's
 * reward first covers its fee accrual. Uses the UNCAPPED reward rate, then
 * checks the cap separately: if the cap sits below annualFee / 12 the fee
 * is never covered at any spend, and that is reported as such rather than
 * as a large number.
 */
export function breakEven(
  annualFee: number,
  uncappedAED: number,
  totalSpend: number,
  cappedAtAED: number | null,
  monthlyMaxAED: number | null | undefined,
): { breakEvenMonthlySpendAED: number | null; feeNeverCovered: boolean } {
  if (annualFee <= 0 || totalSpend <= 0 || uncappedAED <= 0) {
    return { breakEvenMonthlySpendAED: null, feeNeverCovered: false };
  }
  const feeAccrual = annualFee / 12;
  const hardCap = monthlyMaxAED ?? null;
  if (hardCap != null && hardCap < feeAccrual) {
    return { breakEvenMonthlySpendAED: null, feeNeverCovered: true };
  }
  // A per-category cap that already binds can also sit below the accrual.
  if (cappedAtAED != null && hardCap == null && cappedAtAED < feeAccrual && uncappedAED <= cappedAtAED) {
    return { breakEvenMonthlySpendAED: null, feeNeverCovered: true };
  }
  const rewardPerAED = uncappedAED / totalSpend;
  return { breakEvenMonthlySpendAED: feeAccrual / rewardPerAED, feeNeverCovered: false };
}

/**
 * Rank cards by AED-equivalent monthly reward for a given spend profile.
 *
 * Pure function — no DOM, no localStorage, no Astro globals. Tests import
 * this directly.
 */
export function rankCards(
  cards: CardForCalc[],
  spend: SpendProfile,
  opts: RankOptions,
): RankResult[] {
  const refTime = (opts.now ?? new Date()).getTime();
  const totalSpend = SPEND_CATEGORIES.reduce((sum, k) => sum + spend[k], 0);

  const results: RankResult[] = cards.map((card) => {
    const { aedPerUnit, basis, earnBasis } = conversionForCard(card);
    const breakdown = earnBasis
      ? perCategoryBreakdown(card, spend, aedPerUnit, earnBasis, basis === "cashback")
      : {
          totalNative: 0,
          totalAED: 0,
          uncappedAED: 0,
          cappedAtAED: null,
          capHit: false,
          topCategory: null,
        };
    const { totalNative, totalAED, topCategory } = breakdown;
    const monthlyFeeAED = card.annualFee.amount / 12;
    const verifiedAt =
      card.lastVerified instanceof Date
        ? card.lastVerified
        : new Date(card.lastVerified);
    const staleData = refTime - verifiedAt.getTime() > NINETY_DAYS_MS;

    const qualifying = card.earnRates._caps?.min_monthly_spend_to_qualify_aed ?? null;
    const be = breakEven(
      card.annualFee.amount,
      breakdown.uncappedAED,
      totalSpend,
      breakdown.cappedAtAED,
      basis === "cashback" ? card.earnRates._caps?.monthly_max_aed : null,
    );

    return {
      card,
      monthlyRewardNative: totalNative,
      cappedAtAED: breakdown.cappedAtAED,
      capHit: breakdown.capHit,
      qualifyingSpendAED: qualifying,
      belowQualifyingSpend: qualifying != null && totalSpend < qualifying,
      breakEvenMonthlySpendAED: be.breakEvenMonthlySpendAED,
      feeNeverCovered: be.feeNeverCovered,
      monthlyRewardAED: totalAED,
      aedPerUnit,
      monthlyFeeAED,
      netMonthlyAED: totalAED - monthlyFeeAED,
      topCategory,
      rateBasis: basis,
      staleData,
    };
  });

  const keyFn = opts.netOfFee
    ? (r: RankResult) => r.netMonthlyAED
    : (r: RankResult) => r.monthlyRewardAED;

  // A card whose earnUnit states no denominator has no honest AED figure, so
  // it is not ranked at all rather than ranked at zero.
  return results
    .filter((r) => r.rateBasis !== "unrankable")
    .sort((a, b) => keyFn(b) - keyFn(a));
}

// ── Wallet mode: which of the cards you already hold to use where ────────

export type CategoryWinner = {
  category: keyof SpendProfile;
  spendAED: number;
  card: CardForCalc;
  /** AED-equivalent reward this category alone earns on the winning card. */
  monthlyAED: number;
  rateBasis: RateBasis;
  /** How far the winner is ahead of the next-best held card, in AED. */
  marginAED: number;
};

/**
 * For each spend category, the held card that earns the most on it.
 *
 * This is the routing question a reader with two or three cards actually
 * has — "which one do I tap at Carrefour" — and it is answered from the
 * same earn rates and the same published baselines the ranking uses. One
 * category at a time, so typed caps are not applied here: a per-category
 * cap binds on the month's total in that category, which a single tap does
 * not know. The ranking above still applies them to the monthly figure.
 *
 * Categories with zero spend and cards with no honest denominator are
 * skipped. Returns an empty list for an empty wallet.
 */
export function bestCardPerCategory(
  held: CardForCalc[],
  spend: SpendProfile,
): CategoryWinner[] {
  const rankable = held
    .map((card) => ({ card, conv: conversionForCard(card) }))
    .filter((x) => x.conv.earnBasis != null);
  if (rankable.length === 0) return [];

  const winners: CategoryWinner[] = [];
  for (const category of SPEND_CATEGORIES) {
    const spendAED = spend[category];
    if (spendAED <= 0) continue;
    const scored = rankable
      .map(({ card, conv }) => ({
        card,
        rateBasis: conv.basis,
        monthlyAED:
          categoryNative(card, category, spendAED, conv.earnBasis!) * conv.aedPerUnit,
      }))
      .sort((a, b) => b.monthlyAED - a.monthlyAED);
    const top = scored[0]!;
    const next = scored[1];
    winners.push({
      category,
      spendAED,
      card: top.card,
      monthlyAED: top.monthlyAED,
      rateBasis: top.rateBasis,
      marginAED: next ? top.monthlyAED - next.monthlyAED : top.monthlyAED,
    });
  }
  return winners;
}

// ── UI ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "dp-calc-spend-v1";

const DEFAULT_SPEND: SpendProfile = {
  dining: 1500,
  groceries: 2000,
  fuel: 800,
  travel: 1000,
  online: 1500,
  utilities: 600,
  entertainment: 400,
};

const CATEGORY_LABELS: Record<keyof SpendProfile, string> = {
  dining: "Food & Dining",
  groceries: "Groceries & Supermarkets",
  fuel: "Fuel & Transport",
  travel: "Travel (flights & hotels)",
  online: "Online Shopping",
  utilities: "Utilities & Telecom bills",
  entertainment: "Entertainment & Cinema",
};

const SLIDER_MIN = 0;
const SLIDER_MAX = 20000;
const SLIDER_STEP = 100;

function loadSpend(): SpendProfile {
  if (typeof window === "undefined") return DEFAULT_SPEND;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SPEND;
    const parsed = JSON.parse(raw) as Partial<SpendProfile>;
    return { ...DEFAULT_SPEND, ...parsed };
  } catch {
    return DEFAULT_SPEND;
  }
}

function saveSpend(spend: SpendProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spend));
  } catch {
    /* localStorage may be disabled; calculator still works in-session. */
  }
}

// The reader's wallet — card slugs they say they hold. Same per-viewer
// convenience as the spend profile: it never leaves the browser and the
// tool works without it. Unknown slugs (a card retired since the visit) are
// dropped on load rather than shown as a phantom row.
const HELD_KEY = "dp-calc-held-v1";

function loadHeld(known: ReadonlySet<string>): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HELD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string" && known.has(s))
      : [];
  } catch {
    return [];
  }
}

function saveHeld(held: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HELD_KEY, JSON.stringify(held));
  } catch {
    /* see saveSpend */
  }
}

function sameSpend(a: SpendProfile, b: SpendProfile): boolean {
  return SPEND_CATEGORIES.every((k) => a[k] === b[k]);
}

const fmtAED = (n: number): string =>
  `AED ${Math.round(n).toLocaleString("en-AE")}`;

/**
 * The headline number on a tile.
 *
 * A percentage card's "native" earning is already dirhams, so it renders as
 * currency; printing the count beside the raw unit string produced
 * "483 % cashback", which reads as 483 percent. A per-unit card renders the
 * count beside a short currency noun — the full earn-unit wording carries
 * caps and exclusions that belong on the card's own page, not in a headline.
 */
const nativeUnitNoun = (unit: string | undefined): string => {
  if (!unit) return "";
  // Drop the denominator clause and any parenthetical, leaving the currency.
  const noun = unit
    .replace(/\s*\(.*$/, "")
    .replace(/\s*per\s+(AED|USD)\s*[\d,]*\s*spent.*$/i, "")
    .replace(/^%\s*(as|back as|value back as|back)?\s*/i, "")
    .trim();
  return noun;
};

const fmtNative = (
  n: number,
  unit: string | undefined,
  basis: RateBasis,
): string => {
  if (basis === "cashback") return fmtAED(n);
  const rounded = Math.round(n);
  const noun = nativeUnitNoun(unit);
  return noun
    ? `${rounded.toLocaleString("en-AE")} ${noun}`
    : rounded.toLocaleString("en-AE");
};

const fmtVerified = (d: Date | string): string => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface Props {
  cards: CardForCalc[];
}

export default function RewardsCalculator({ cards }: Props) {
  const [spend, setSpend] = useState<SpendProfile>(DEFAULT_SPEND);
  const [netOfFee, setNetOfFee] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setSpend(loadSpend());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSpend(spend);
  }, [spend, hydrated]);

  // Wallet mode. When the reader has ticked at least one card, the ranking
  // narrows to those cards and a per-category routing table appears.
  const [held, setHeld] = useState<string[]>([]);
  const [walletFilter, setWalletFilter] = useState("");
  const knownSlugs = useMemo(() => new Set(cards.map((c) => c.slug)), [cards]);
  useEffect(() => {
    setHeld(loadHeld(knownSlugs));
  }, [knownSlugs]);
  useEffect(() => {
    if (hydrated) saveHeld(held);
  }, [held, hydrated]);
  const heldSet = useMemo(() => new Set(held), [held]);
  const walletActive = held.length > 0;
  const heldCards = useMemo(
    () => cards.filter((c) => heldSet.has(c.slug)),
    [cards, heldSet],
  );
  const toggleHeld = (slug: string) =>
    setHeld((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  const ranked = useMemo(
    () => rankCards(walletActive ? heldCards : cards, spend, { netOfFee }),
    [cards, heldCards, walletActive, spend, netOfFee],
  );

  const winners = useMemo(
    () => (walletActive ? bestCardPerCategory(heldCards, spend) : []),
    [walletActive, heldCards, spend],
  );

  const activePreset = SPEND_PRESETS.find((p) => sameSpend(p.spend, spend))?.id ?? null;

  const walletChoices = useMemo(() => {
    const q = walletFilter.trim().toLowerCase();
    return [...cards]
      .sort((a, b) => a.bank.localeCompare(b.bank) || a.name.localeCompare(b.name))
      .filter(
        (c) =>
          q.length === 0 ||
          c.name.toLowerCase().includes(q) ||
          c.bank.toLowerCase().includes(q),
      );
  }, [cards, walletFilter]);

  const totalSpend = useMemo(
    () => Object.values(spend).reduce((a, b) => a + b, 0),
    [spend],
  );

  const updateCategory =
    (key: keyof SpendProfile) =>
    (raw: number): void => {
      const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX * 5, raw || 0));
      setSpend((prev) => ({ ...prev, [key]: clamped }));
    };

  if (cards.length === 0) {
    return (
      <div class="dp-calc-empty" role="status">
        <p>No card data available right now. Try refreshing the page.</p>
      </div>
    );
  }

  const visible = showAll ? ranked : ranked.slice(0, 3);

  return (
    <div class="dp-calc">
      <form
        class="dp-calc-form"
        onSubmit={(e) => {
          e.preventDefault();
        }}
        aria-label="Monthly spend by category"
      >
        <div class="dp-calc-form-head">
          <h2>Your monthly spend</h2>
          <p class="dp-calc-total">
            Total: <strong>{fmtAED(totalSpend)}</strong>
          </p>
        </div>

        <fieldset class="dp-calc-presets">
          <legend>Start from a profile</legend>
          <div class="dp-calc-preset-row" role="group" aria-label="Spend profiles">
            {SPEND_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                class={`dp-calc-preset${activePreset === p.id ? " is-active" : ""}`}
                aria-pressed={activePreset === p.id}
                title={p.note}
                onClick={() => setSpend({ ...p.spend })}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p class="dp-calc-preset-note">
            Round-number modelling profiles, not anyone's real household.
            Pick the nearest one, then edit the lines below.
          </p>
        </fieldset>

        <ul class="dp-calc-sliders">
          {(Object.keys(CATEGORY_LABELS) as (keyof SpendProfile)[]).map(
            (key) => {
              const id = `dp-calc-${key}`;
              const value = spend[key];
              return (
                <li key={key} class="dp-calc-slider-row">
                  <label htmlFor={id}>{CATEGORY_LABELS[key]}</label>
                  <div class="dp-calc-slider-controls">
                    <input
                      id={id}
                      type="range"
                      min={SLIDER_MIN}
                      max={SLIDER_MAX}
                      step={SLIDER_STEP}
                      value={Math.min(value, SLIDER_MAX)}
                      onInput={(e) =>
                        updateCategory(key)(
                          Number((e.target as HTMLInputElement).value),
                        )
                      }
                      aria-label={`${CATEGORY_LABELS[key]} monthly spend in AED`}
                    />
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={value}
                      onInput={(e) =>
                        updateCategory(key)(
                          Number((e.target as HTMLInputElement).value),
                        )
                      }
                      class="dp-calc-num"
                      aria-label={`${CATEGORY_LABELS[key]} exact AED value`}
                    />
                  </div>
                </li>
              );
            },
          )}
        </ul>

        <label class="dp-calc-toggle">
          <input
            type="checkbox"
            checked={netOfFee}
            onChange={(e) =>
              setNetOfFee((e.target as HTMLInputElement).checked)
            }
          />
          Show net of annual fee (subtract monthly fee accrual)
        </label>

        <details class="dp-calc-wallet" open={walletActive}>
          <summary>
            Only rank cards I already hold
            {walletActive && (
              <span class="dp-calc-wallet-count">{held.length} selected</span>
            )}
          </summary>
          <p class="dp-calc-wallet-help">
            Tick the cards in your wallet and the ranking narrows to them,
            with a table of which one to use for each category. Nothing you
            tick leaves this browser.
          </p>
          <input
            type="search"
            class="dp-calc-num dp-calc-wallet-filter"
            placeholder="Filter by card or bank"
            value={walletFilter}
            onInput={(e) => setWalletFilter((e.target as HTMLInputElement).value)}
            aria-label="Filter the card list"
          />
          <ul class="dp-calc-wallet-list">
            {walletChoices.map((c) => (
              <li key={c.slug}>
                <label>
                  <input
                    type="checkbox"
                    checked={heldSet.has(c.slug)}
                    onChange={() => toggleHeld(c.slug)}
                  />
                  <span class="name">{c.name}</span>
                  <span class="bank">{c.bank}</span>
                </label>
              </li>
            ))}
          </ul>
          {walletActive && (
            <button
              type="button"
              class="dp-calc-wallet-clear"
              onClick={() => setHeld([])}
            >
              Clear wallet
            </button>
          )}
        </details>
      </form>

      <section class="dp-calc-results" aria-live="polite">
        <header class="dp-calc-results-head">
          <h2>
            {netOfFee ? "Top cards — net of fee" : "Top cards — gross reward"}
          </h2>
          <p class="dp-calc-results-sub">
            Ranked by AED-equivalent monthly reward at our conservative
            conversion benchmarks. We do not promise these rewards — we show
            what each card's published earn rate works out to on your stated
            spend.
          </p>
        </header>

        {walletActive && winners.length > 0 && (
          <div class="dp-calc-routing">
            <h3>Which of your cards to use where</h3>
            <table class="dp-data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Use this card</th>
                  <th class="num">Earns / month</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w) => (
                  <tr key={w.category}>
                    <td>{CATEGORY_LABELS[w.category]}</td>
                    <td>
                      <a href={`/cards/${w.card.slug}/`}>{w.card.name}</a>
                      {w.marginAED > 0 && heldCards.length > 1 && (
                        <span class="dp-calc-routing-margin">
                          {" "}+{fmtAED(w.marginAED)} over your next best
                        </span>
                      )}
                    </td>
                    <td class="num">
                      {w.rateBasis === "cashback"
                        ? fmtAED(w.monthlyAED)
                        : `≈ ${fmtAED(w.monthlyAED)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class="dp-calc-routing-note">
              One category at a time, before monthly caps. The ranking below
              applies the caps to each card's month.
            </p>
          </div>
        )}

        {walletActive && ranked.length === 0 && (
          <p class="dp-calc-empty" role="status">
            None of the cards you ticked states an earn denominator we can
            price, so nothing can be ranked. Clear the wallet to see every card.
          </p>
        )}

        <ul class="dp-calc-tile-list">
          {visible.map((r, idx) => (
            <li key={r.card.slug} class="dp-calc-tile">
              <div class="dp-calc-tile-head">
                <span class="rank">#{idx + 1}</span>
                <a class="title" href={`/cards/${r.card.slug}/`}>
                  {r.card.name}
                </a>
                <span class="bank">{r.card.bank}</span>
              </div>

              <div class="dp-calc-tile-numbers">
                <div class="num-block">
                  <span class="num-label">Monthly reward</span>
                  <strong class="num-value">
                    {fmtNative(r.monthlyRewardNative, r.card.earnUnit, r.rateBasis)}
                  </strong>
                  <span class="num-sub">
                    {r.rateBasis === "cashback"
                      ? "paid in dirhams"
                      : `≈ ${fmtAED(r.monthlyRewardAED)} at ${(r.aedPerUnit * 100).toFixed(1)} fils each, ${
                          r.rateBasis === "published" ? "published" : "placeholder"
                        }`}
                  </span>
                </div>
                <div class="num-block">
                  <span class="num-label">Annual fee</span>
                  <strong class="num-value">
                    {fmtAED(r.card.annualFee.amount)}
                  </strong>
                  {netOfFee && (
                    <span class="num-sub">
                      Net: {fmtAED(r.netMonthlyAED)}/mo
                    </span>
                  )}
                </div>
              </div>

              {(r.capHit || r.belowQualifyingSpend || r.breakEvenMonthlySpendAED != null || r.feeNeverCovered) && (
                <ul class="dp-calc-tile-facts">
                  {r.capHit && r.cappedAtAED != null && (
                    <li>
                      Capped at <strong>{fmtAED(r.cappedAtAED)}</strong>/month
                      by the card's published limit; the figure above is the
                      capped one.
                    </li>
                  )}
                  {r.belowQualifyingSpend && r.qualifyingSpendAED != null && (
                    <li>
                      Needs <strong>{fmtAED(r.qualifyingSpendAED)}</strong> of
                      total monthly spend to earn at all — your profile is
                      below it.
                    </li>
                  )}
                  {r.breakEvenMonthlySpendAED != null && (
                    <li>
                      Covers its fee at about{" "}
                      <strong>{fmtAED(Math.ceil(r.breakEvenMonthlySpendAED / 50) * 50)}</strong>
                      /month of this mix, before caps and waivers.
                    </li>
                  )}
                  {r.feeNeverCovered && (
                    <li>
                      Its monthly cap sits below the fee accrual, so the fee
                      is never covered by earn alone at any spend.
                    </li>
                  )}
                </ul>
              )}

              {r.topCategory && spend[r.topCategory] > 0 && (
                <p class="dp-calc-tile-why">
                  Ranks here because{" "}
                  <strong>{CATEGORY_LABELS[r.topCategory].toLowerCase()}</strong>{" "}
                  is your single biggest contributor — this card pays{" "}
                  {formatEarnRate(
                    (r.card.earnRates as unknown as Record<string, number | undefined>)[
                      r.topCategory
                    ] ?? r.card.earnRates.everythingElse,
                    r.card.earnUnit,
                    r.card.categories,
                  )}{" "}
                  on it.
                </p>
              )}

              <div class="dp-calc-tile-meta">
                <span class="verified">
                  Last verified: {fmtVerified(r.card.lastVerified)}
                </span>
                {r.staleData && (
                  <span class="chip is-stale" title="Verified more than 90 days ago">
                    Data drift risk
                  </span>
                )}
                {r.rateBasis === "placeholder" && (
                  <span
                    class="chip is-fallback"
                    title="We have not published a baseline for this currency. The AED figure uses a placeholder rate and is not comparable with a card priced on a published one."
                  >
                    Placeholder rate — no published baseline
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {ranked.length > 3 && (
          <button
            type="button"
            class="dp-calc-toggle-all"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
          >
            {showAll
              ? "Show top 3 only"
              : `Show all ${ranked.length} ranked cards`}
          </button>
        )}
      </section>

      <style>{`
        .dp-calc {
          display: grid;
          gap: 32px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 880px) {
          .dp-calc { grid-template-columns: 360px 1fr; }
        }
        .dp-calc-form {
          border: 1px solid var(--line);
          background: var(--paper);
          padding: 20px 22px;
          border-radius: 4px;
        }
        .dp-calc-form-head {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 14px;
        }
        .dp-calc-form-head h2 {
          font-family: 'Fraunces', serif; font-weight: 500;
          font-size: 17px; color: var(--ink); margin: 0;
        }
        .dp-calc-total {
          font-size: 12px; color: var(--muted); margin: 0;
          font-feature-settings: 'tnum';
        }
        .dp-calc-total strong { color: var(--ink); }
        .dp-calc-sliders {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 14px;
        }
        .dp-calc-slider-row label {
          display: block;
          font-size: 12px; font-weight: 600;
          color: var(--ink); margin-bottom: 4px;
        }
        .dp-calc-slider-controls {
          display: flex; gap: 10px; align-items: center;
        }
        .dp-calc-slider-controls input[type="range"] {
          flex: 1; accent-color: var(--green);
        }
        .dp-calc-num {
          width: 88px;
          font-family: 'DM Sans', sans-serif;
          font-feature-settings: 'tnum';
          font-size: 13px; padding: 4px 6px;
          border: 1px solid var(--line); border-radius: 3px;
          background: var(--bg); color: var(--ink);
        }
        .dp-calc-toggle {
          display: flex; gap: 8px; align-items: center;
          margin-top: 18px; padding-top: 14px;
          border-top: 1px solid var(--line);
          font-size: 13px; color: var(--ink-soft);
        }
        .dp-calc-toggle input { accent-color: var(--green); }

        .dp-calc-presets {
          border: 0; padding: 0; margin: 0 0 16px;
        }
        .dp-calc-presets legend {
          font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--muted);
          padding: 0; margin-bottom: 8px;
        }
        .dp-calc-preset-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .dp-calc-preset {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--ink);
          padding: 5px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          border-radius: 2px;
          cursor: pointer;
          min-height: 32px;
        }
        .dp-calc-preset:hover { border-color: var(--ink); }
        .dp-calc-preset.is-active {
          background: var(--green); border-color: var(--green);
          color: var(--paper);
        }
        .dp-calc-preset-note {
          font-size: 11px; color: var(--muted); margin: 8px 0 0;
          line-height: 1.5;
        }

        .dp-calc-wallet {
          margin-top: 14px; padding-top: 14px;
          border-top: 1px solid var(--line);
          font-size: 13px; color: var(--ink-soft);
        }
        .dp-calc-wallet summary {
          cursor: pointer; font-weight: 600; color: var(--ink);
          display: flex; gap: 10px; align-items: baseline;
          min-height: 32px;
        }
        .dp-calc-wallet-count {
          font-size: 11px; font-weight: 700; color: var(--green);
          letter-spacing: 0.4px; text-transform: uppercase;
        }
        .dp-calc-wallet-help { margin: 8px 0 10px; line-height: 1.5; }
        .dp-calc-wallet-filter { width: 100%; margin-bottom: 8px; }
        .dp-calc-wallet-list {
          list-style: none; padding: 0; margin: 0;
          max-height: 260px; overflow-y: auto;
          border: 1px solid var(--line); border-radius: 3px;
          background: var(--bg);
        }
        .dp-calc-wallet-list li + li { border-top: 1px solid var(--line); }
        .dp-calc-wallet-list label {
          display: grid; grid-template-columns: auto 1fr auto;
          gap: 8px; align-items: center;
          padding: 7px 10px; cursor: pointer;
          min-height: 36px;
        }
        .dp-calc-wallet-list input { accent-color: var(--green); }
        .dp-calc-wallet-list .name { color: var(--ink); font-size: 13px; }
        .dp-calc-wallet-list .bank {
          font-size: 10px; color: var(--muted);
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .dp-calc-wallet-clear {
          margin-top: 8px; background: transparent;
          border: 1px solid var(--line); color: var(--ink-soft);
          padding: 5px 10px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.4px; text-transform: uppercase;
          border-radius: 2px; cursor: pointer;
        }
        .dp-calc-wallet-clear:hover { border-color: var(--ink); color: var(--ink); }

        .dp-calc-routing {
          border: 1px solid var(--line);
          background: var(--paper);
          border-radius: 4px;
          padding: 16px 18px;
          margin-bottom: 18px;
        }
        .dp-calc-routing h3 {
          font-family: 'Fraunces', serif; font-weight: 500;
          font-size: 17px; color: var(--ink); margin: 0 0 10px;
        }
        .dp-calc-routing .dp-data-table { margin: 0; }
        .dp-calc-routing .num { text-align: right; font-feature-settings: 'tnum'; }
        .dp-calc-routing-margin { font-size: 11px; color: var(--muted); }
        .dp-calc-routing-note {
          font-size: 11px; color: var(--muted); margin: 10px 0 0;
        }

        .dp-calc-tile-facts {
          list-style: none; padding: 0; margin: 10px 0 0;
          display: flex; flex-direction: column; gap: 4px;
          font-size: 12px; color: var(--ink-soft);
          font-feature-settings: 'tnum';
        }
        .dp-calc-tile-facts strong { color: var(--ink); font-weight: 600; }

        .dp-calc-results-head h2 {
          font-family: 'Fraunces', serif; font-weight: 500;
          font-size: 20px; color: var(--ink); margin: 0 0 6px;
        }
        .dp-calc-results-sub {
          font-size: 13px; color: var(--ink-soft); margin: 0 0 18px;
          max-width: 60ch; line-height: 1.55;
        }

        .dp-calc-tile-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 14px;
        }
        .dp-calc-tile {
          border: 1px solid var(--line);
          background: var(--paper);
          border-radius: 4px;
          padding: 16px 18px;
        }
        .dp-calc-tile-head {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline;
          margin-bottom: 10px;
        }
        .dp-calc-tile-head .rank {
          font-feature-settings: 'tnum'; font-weight: 700;
          color: var(--muted); font-size: 13px;
        }
        .dp-calc-tile-head .title {
          font-family: 'Fraunces', serif; font-weight: 500;
          font-size: 17px; color: var(--ink); text-decoration: none;
        }
        .dp-calc-tile-head .title:hover { color: var(--green); }
        .dp-calc-tile-head .bank {
          font-size: 11px; color: var(--muted);
          letter-spacing: 0.5px; text-transform: uppercase;
        }

        .dp-calc-tile-numbers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 10px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .num-block { display: flex; flex-direction: column; gap: 2px; }
        .num-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: var(--muted);
        }
        .num-value {
          font-family: 'DM Sans', sans-serif;
          font-feature-settings: 'tnum';
          font-size: 17px; font-weight: 600; color: var(--ink);
        }
        .num-sub {
          font-size: 11px; color: var(--ink-soft);
          font-feature-settings: 'tnum';
        }
        .dp-calc-tile-why {
          font-size: 13px; color: var(--ink-soft);
          margin: 10px 0 0;
        }
        .dp-calc-tile-why strong { color: var(--ink); font-weight: 600; }

        .dp-calc-tile-meta {
          margin-top: 12px;
          display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
          font-size: 11px; color: var(--muted);
        }
        .dp-calc-tile-meta .chip {
          padding: 2px 8px;
          border: 1px solid currentColor;
          border-radius: 2px;
          font-size: 10px; letter-spacing: 0.4px;
          text-transform: uppercase; font-weight: 700;
        }
        .dp-calc-tile-meta .chip.is-stale { color: var(--red); }
        .dp-calc-tile-meta .chip.is-fallback { color: var(--gold); }

        .dp-calc-toggle-all {
          margin-top: 16px;
          background: transparent;
          border: 1px solid var(--ink);
          color: var(--ink);
          padding: 8px 16px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.5px; text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
        }
        .dp-calc-toggle-all:hover {
          background: var(--ink); color: var(--paper);
        }

        .dp-calc-empty {
          padding: 20px; border: 1px dashed var(--line);
          color: var(--ink-soft); font-size: 14px;
        }
      `}</style>
    </div>
  );
}
