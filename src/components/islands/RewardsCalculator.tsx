/**
 * RewardsCalculator — spend-ROI calculator island (C3).
 *
 * Reads typed `earnRates` from L2 (`src/data/cards.json` via
 * `src/lib/cardsData.ts`) and ranks cards by AED-equivalent monthly reward
 * given a seven-category spend profile.
 *
 * The conversion table from a card's native earn unit (Miles / points / AED
 * cashback) into an AED-comparable number is intentionally exported as
 * {@link AED_PER_UNIT} so the page methodology section can show the same
 * numbers it ranks on. Updating those rates is a single edit.
 *
 * Charter constraints:
 *   - Deterministic only. We read typed numerics; no LLM, no live scraping.
 *   - No new visual idioms. Reuses `.dp-*` classes and brand tokens.
 *   - Methodology surfaces conversion benchmarks openly (honesty discipline).
 */

import { useEffect, useMemo, useState } from "preact/hooks";
import type { CardData } from "../../lib/cardsData";

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
  /** True when the conversion is a fallback (no known loyaltyProgram). */
  fallbackConversion: boolean;
  /** True when lastVerified is older than 90 days. */
  staleData: boolean;
};

export type RankOptions = {
  /** If true, subtract monthly fee accrual before ranking. */
  netOfFee: boolean;
  /** Reference date for staleness — defaults to now. Injectable for tests. */
  now?: Date;
};

// ── Conversion table ─────────────────────────────────────────────────────

/** Conservative AED-per-native-unit benchmarks. Updating these here updates
 * both the ranker and the methodology section, which re-imports the table. */
export const AED_PER_UNIT = {
  /** 1 AED of cashback = 1 AED. */
  aed_cashback: 1.0,
  /** Skywards / Etihad Guest / Qatar Avios / Saudia Alfursan / any Miles. */
  miles: 0.04,
  /** Bank-proprietary transferable points (FAB Rewards, ENBD Plus Points,
   * ADCB TouchPoints, Darna, U Points, etc.). */
  bank_points: 0.01,
  /** Hotel points (Marriott Bonvoy etc.). */
  hotel_points: 0.008,
  /** Fallback when no loyaltyProgram is known. Treated as 1:1 cashback
   * with a UI warning chip. */
  unknown: 1.0,
} as const;

export type ConversionBucket = keyof typeof AED_PER_UNIT;

const PROGRAM_TO_BUCKET: Array<{
  test: (program: string, unit: string) => boolean;
  bucket: ConversionBucket;
}> = [
  // Cashback first — exact-match unit string.
  {
    test: (_, unit) => /cashback|aed back/i.test(unit),
    bucket: "aed_cashback",
  },
  // Miles programmes — Emirates Skywards, Etihad Guest, Qatar, Saudia.
  {
    test: (program, unit) =>
      /miles|skywards|etihad|qatar|saudia|alfursan|avios/i.test(
        `${program} ${unit}`,
      ),
    bucket: "miles",
  },
  // Hotel points.
  {
    test: (program) => /marriott|bonvoy|hilton|ihg|accor/i.test(program),
    bucket: "hotel_points",
  },
];

/** Resolve a card's native unit to its AED conversion rate. Default is the
 * conservative `bank_points` rate (0.01 AED/point), which fits FAB Rewards,
 * ENBD Plus Points, ADCB TouchPoints, U Points, Darna, etc. */
export function conversionForCard(card: CardForCalc): {
  bucket: ConversionBucket;
  aedPerUnit: number;
  fallback: boolean;
} {
  const program = card.loyaltyProgram ?? "";
  const unit = card.earnUnit ?? "";

  if (!program && !unit) {
    return {
      bucket: "unknown",
      aedPerUnit: AED_PER_UNIT.unknown,
      fallback: true,
    };
  }

  for (const rule of PROGRAM_TO_BUCKET) {
    if (rule.test(program, unit)) {
      return {
        bucket: rule.bucket,
        aedPerUnit: AED_PER_UNIT[rule.bucket],
        fallback: false,
      };
    }
  }
  return {
    bucket: "bank_points",
    aedPerUnit: AED_PER_UNIT.bank_points,
    fallback: false,
  };
}

// ── Ranking — exported as a pure function for testability ────────────────

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** Compute per-category AED reward and pick the top contributing category. */
function perCategoryBreakdown(
  card: CardForCalc,
  spend: SpendProfile,
  aedPerUnit: number,
): {
  totalNative: number;
  totalAED: number;
  topCategory: keyof SpendProfile | null;
} {
  const r = card.earnRates;
  const base = r.everythingElse;

  // Per-category native earn = spend * rate. Utilities has no dedicated
  // earnRates key — falls back to base by design.
  const contributions: Record<keyof SpendProfile, number> = {
    dining: spend.dining * (r.dining ?? base),
    groceries: spend.groceries * (r.groceries ?? base),
    fuel: spend.fuel * (r.fuel ?? base),
    travel: spend.travel * (r.travel ?? base),
    online: spend.online * (r.online ?? base),
    utilities: spend.utilities * base,
    entertainment: spend.entertainment * (r.entertainment ?? base),
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
    const { aedPerUnit, fallback } = conversionForCard(card);
    const { totalNative, totalAED, topCategory } = perCategoryBreakdown(
      card,
      spend,
      aedPerUnit,
    );
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
      fallbackConversion: fallback,
      staleData,
    };
  });

  const keyFn = opts.netOfFee
    ? (r: RankResult) => r.netMonthlyAED
    : (r: RankResult) => r.monthlyRewardAED;

  return results.sort((a, b) => keyFn(b) - keyFn(a));
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

const fmtNative = (n: number, unit: string | undefined): string => {
  const rounded = Math.round(n);
  if (!unit) return `${rounded.toLocaleString("en-AE")}`;
  return `${rounded.toLocaleString("en-AE")} ${unit}`;
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
          <h3>Your monthly spend</h3>
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
          <h3>
            {netOfFee ? "Top cards — net of fee" : "Top cards — gross reward"}
          </h3>
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
                    {fmtNative(r.monthlyRewardNative, r.card.earnUnit)}
                  </strong>
                  <span class="num-sub">
                    ≈ {fmtAED(r.monthlyRewardAED)} at {r.aedPerUnit} AED/unit
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
                  is your single biggest contributor at this card's earn rate.
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
                {r.fallbackConversion && (
                  <span class="chip is-fallback" title="No known loyalty programme — treated as 1:1 cashback">
                    Unknown unit — 1:1 fallback
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
        .dp-calc-form-head h3 {
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

        .dp-calc-results-head h3 {
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
