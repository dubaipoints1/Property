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

/** Compute per-category AED reward and pick the top contributing category. */
function perCategoryBreakdown(
  card: CardForCalc,
  spend: SpendProfile,
  aedPerUnit: number,
  earnBasis: EarnBasis,
): {
  totalNative: number;
  totalAED: number;
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

  for (const k of Object.keys(contributions) as (keyof SpendProfile)[]) {
    const native = contributions[k];
    totalNative += native;
    const aed = native * aedPerUnit;
    if (aed > topAED) {
      topAED = aed;
      topCategory = k;
    }
  }

  return { totalNative, totalAED: totalNative * aedPerUnit, topCategory };
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

  const results: RankResult[] = cards.map((card) => {
    const { aedPerUnit, basis, earnBasis } = conversionForCard(card);
    const { totalNative, totalAED, topCategory } = earnBasis
      ? perCategoryBreakdown(card, spend, aedPerUnit, earnBasis)
      : { totalNative: 0, totalAED: 0, topCategory: null };
    const monthlyFeeAED = card.annualFee.amount / 12;
    const verifiedAt =
      card.lastVerified instanceof Date
        ? card.lastVerified
        : new Date(card.lastVerified);
    const staleData = refTime - verifiedAt.getTime() > NINETY_DAYS_MS;

    return {
      card,
      monthlyRewardNative: totalNative,
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

  const ranked = useMemo(
    () => rankCards(cards, spend, { netOfFee }),
    [cards, spend, netOfFee],
  );

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
