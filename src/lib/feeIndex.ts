/**
 * Aggregate fee facts across the card set, for /cards/fees/.
 *
 * Every figure here is computed from L2 at build time. The page that renders
 * them types no number of its own — the same rule the trust pages adopted on
 * 10 September 2026, for the same reason: an aggregate that goes stale
 * quietly is worse than none. When a card's fee changes in cards.json the
 * index moves with it on the next build.
 *
 * Definitions, stated once so the page and the tests agree:
 *  - "free for life" — annualFee.amount is 0. A card that waives year one
 *    but charges from year two is NOT free for life; it is counted under
 *    "first year free".
 *  - "paid" — annualFee.amount > 0, before any waiver.
 *  - The FX column is the card's published foreign-currency margin; every
 *    card carries a numeric one.
 *  - Salary tiers exclude cards whose minimum is unverified
 *    (`_provenance.eligibility: needs-review`) or invitation-only, on the
 *    same footing as /cards/salary/.
 */
import { isStructuredAnnualFeeWaiver } from "./cardsDataFormat";
import { median } from "./interestPayoff";

export interface CardForFeeIndex {
  slug: string;
  name: string;
  bank: string;
  annualFee: { amount: number; currency: string };
  annualFeeWaiver?: unknown;
  fxFee: number;
  eligibility: { minSalary: number; invitationOnly?: boolean };
  _provenance?: Record<string, string> | null;
}

export interface FeeIndexRow {
  slug: string;
  name: string;
  bank: string;
  annualFee: number;
  firstYearWaived: boolean;
  fxFee: number;
  minSalary: number | null;
}

export interface BankFeeRow {
  bank: string;
  cards: number;
  freeForLife: number;
  medianFee: number;
  medianFx: number;
}

export interface SalaryTierRow {
  label: string;
  min: number;
  /** Exclusive upper bound; null for the open top tier. */
  max: number | null;
  cards: number;
  medianFee: number | null;
  freeForLife: number;
}

export interface FeeIndex {
  total: number;
  freeForLife: number;
  freeShare: number;
  firstYearFree: number;
  paidCount: number;
  medianFee: number;
  meanFee: number;
  medianPaidFee: number | null;
  meanPaidFee: number | null;
  highest: FeeIndexRow | null;
  lowestPaid: FeeIndexRow | null;
  fxZero: number;
  medianFx: number;
  maxFx: number;
  byBank: BankFeeRow[];
  bySalaryTier: SalaryTierRow[];
  /** Every card, cheapest annual fee first, ties by FX fee then name. */
  rows: FeeIndexRow[];
}

export const SALARY_TIERS: ReadonlyArray<{ label: string; min: number; max: number | null }> = [
  { label: "Under AED 5,000", min: 0, max: 5000 },
  { label: "AED 5,000 – 7,999", min: 5000, max: 8000 },
  { label: "AED 8,000 – 14,999", min: 8000, max: 15000 },
  { label: "AED 15,000 – 24,999", min: 15000, max: 25000 },
  { label: "AED 25,000 and above", min: 25000, max: null },
];

function firstYearWaived(card: CardForFeeIndex): boolean {
  const w = card.annualFeeWaiver;
  return card.annualFee.amount > 0 && isStructuredAnnualFeeWaiver(w) && w.year_one_waived === true;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function toRow(card: CardForFeeIndex): FeeIndexRow {
  const unverified =
    card._provenance?.eligibility === "needs-review" || card.eligibility.invitationOnly === true;
  return {
    slug: card.slug,
    name: card.name,
    bank: card.bank,
    annualFee: card.annualFee.amount,
    firstYearWaived: firstYearWaived(card),
    fxFee: card.fxFee,
    minSalary: unverified ? null : card.eligibility.minSalary,
  };
}

export function buildFeeIndex(cards: CardForFeeIndex[]): FeeIndex {
  const rows = cards
    .map(toRow)
    .sort((a, b) => a.annualFee - b.annualFee || a.fxFee - b.fxFee || a.name.localeCompare(b.name));

  const fees = rows.map((r) => r.annualFee);
  const paid = rows.filter((r) => r.annualFee > 0);
  const free = rows.filter((r) => r.annualFee === 0);
  const fx = rows.map((r) => r.fxFee);

  const banks = new Map<string, FeeIndexRow[]>();
  for (const r of rows) banks.set(r.bank, [...(banks.get(r.bank) ?? []), r]);
  const byBank: BankFeeRow[] = [...banks.entries()]
    .map(([bank, list]) => ({
      bank,
      cards: list.length,
      freeForLife: list.filter((r) => r.annualFee === 0).length,
      medianFee: median(list.map((r) => r.annualFee)) ?? 0,
      medianFx: median(list.map((r) => r.fxFee)) ?? 0,
    }))
    .sort((a, b) => b.cards - a.cards || a.bank.localeCompare(b.bank));

  const bySalaryTier: SalaryTierRow[] = SALARY_TIERS.map((t) => {
    const inTier = rows.filter(
      (r) => r.minSalary != null && r.minSalary >= t.min && (t.max == null || r.minSalary < t.max),
    );
    return {
      ...t,
      cards: inTier.length,
      medianFee: median(inTier.map((r) => r.annualFee)),
      freeForLife: inTier.filter((r) => r.annualFee === 0).length,
    };
  });

  return {
    total: rows.length,
    freeForLife: free.length,
    freeShare: rows.length === 0 ? 0 : free.length / rows.length,
    firstYearFree: rows.filter((r) => r.firstYearWaived).length,
    paidCount: paid.length,
    medianFee: median(fees) ?? 0,
    meanFee: mean(fees) ?? 0,
    medianPaidFee: median(paid.map((r) => r.annualFee)),
    meanPaidFee: mean(paid.map((r) => r.annualFee)),
    highest: rows.length ? rows[rows.length - 1]! : null,
    lowestPaid: paid.length ? paid[0]! : null,
    fxZero: rows.filter((r) => r.fxFee === 0).length,
    medianFx: median(fx) ?? 0,
    maxFx: fx.length ? Math.max(...fx) : 0,
    byBank,
    bySalaryTier,
    rows,
  };
}
