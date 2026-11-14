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
 *    "year-one annual fee waived". Neither label includes joining charges.
 *  - "paid" — annualFee.amount > 0, before any waiver.
 *  - Unknown and issuer-only FX figures are not exact comparable samples.
 *  - Salary tiers exclude cards whose minimum is unverified
 *    (`_provenance.eligibility: needs-review`) or invitation-only, on the
 *    same footing as /cards/salary/.
 */
import { annualFeeLabel, isStructuredAnnualFeeWaiver } from "./cardsDataFormat";
import { median } from "./interestPayoff";
import type { CardData } from "./cardsData";
import { hasUsableSalaryMinimum } from "./cardEligibility";
import { cardFxNeedsReview } from "./cardFeeFacts";
import { cardFeeNeedsReview, compareKnownAnnualFees } from "./cardFeeProvenance";

export interface CardForFeeIndex {
  slug: string;
  name: string;
  bank: string;
  annualFee: { amount: number; currency: string };
  annualFeeWaiver?: unknown;
  standardFeeConditions?: CardData["standardFeeConditions"];
  fxFee: number | null;
  fxFeeScope?: CardData["fxFeeScope"];
  fxFeeVatTreatment?: CardData["fxFeeVatTreatment"];
  fxFeeUpperBound?: CardData["fxFeeUpperBound"];
  eligibility: { minSalary: number | null; invitationOnly?: boolean };
  _provenance?: Record<string, string> | null;
}

export interface FeeIndexRow {
  slug: string;
  name: string;
  bank: string;
  annualFee: number | null;
  renewalOnlyFeeLabel?: string;
  firstYearAnnualFeeStatus: FirstYearAnnualFeeStatus;
  fxFee: number | null;
  fxFeeScope?: CardData["fxFeeScope"];
  fxFeeVatTreatment?: CardData["fxFeeVatTreatment"];
  fxFeeUpperBound?: CardData["fxFeeUpperBound"];
  _provenance?: Record<string, string> | null;
  minSalary: number | null;
}

export interface BankFeeRow {
  bank: string;
  cards: number;
  freeForLife: number;
  medianFee: number | null;
  medianFx: number | null;
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
  freeShare: number | null;
  firstYearFree: number;
  firstYearPending: number;
  annualFeePending: number;
  annualFeeSampleSize: number;
  paidCount: number;
  medianFee: number | null;
  meanFee: number | null;
  medianPaidFee: number | null;
  meanPaidFee: number | null;
  highest: (FeeIndexRow & { annualFee: number }) | null;
  lowestPaid: (FeeIndexRow & { annualFee: number }) | null;
  fxZero: number;
  medianFx: number | null;
  maxFx: number | null;
  fxSampleSize: number;
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

export type FirstYearAnnualFeeStatus = "waived" | "standard" | "pending";

/** Annual-fee status only, not the full first-year cost. Absence of a
 * joining-fee observation must never turn this into a free-first-year claim.
 * Unresolved annual-fee/waiver evidence is not a negative waiver decision. */
export function firstYearAnnualFeeStatus(card: CardForFeeIndex): FirstYearAnnualFeeStatus {
  if (card.standardFeeConditions === "renewal-only") return "pending";
  const relevant = ["annualFee", "annualFeeWaiver", "vatPolicy"];
  const pending = Object.entries(card._provenance ?? {}).some(([field, state]) => state === "needs-review"
    && relevant.some(group => field === group || field.startsWith(group + ".")));
  if (pending || cardFeeNeedsReview(card, "annualFee") || !Number.isFinite(card.annualFee.amount) || card.annualFee.amount < 0) return "pending";
  const w = card.annualFeeWaiver;
  if (w != null && !isStructuredAnnualFeeWaiver(w)) return "pending";
  return card.annualFee.amount > 0 && isStructuredAnnualFeeWaiver(w) && w.year_one_waived === true ? "waived" : "standard";
}

/** The page uses this formatter rather than inferring Charged from a
 * false boolean. A listed annual zero does not establish zero joining costs. */
export function firstYearAnnualFeeLabel(row: Pick<FeeIndexRow, "annualFee" | "firstYearAnnualFeeStatus">): string {
  if (row.firstYearAnnualFeeStatus === "pending") return "Pending";
  if (row.firstYearAnnualFeeStatus === "waived") return "Waived";
  return row.annualFee === null ? "Pending" : row.annualFee === 0 ? "No annual fee listed" : "Standard fee";
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function toRow(card: CardForFeeIndex): FeeIndexRow {
  const unverified = !hasUsableSalaryMinimum(card);
  const feeKnown = !cardFeeNeedsReview(card, "annualFee") && Number.isFinite(card.annualFee.amount) && card.annualFee.amount >= 0;
  const renewalOnly = card.standardFeeConditions === "renewal-only";
  return {
    slug: card.slug,
    name: card.name,
    bank: card.bank,
    annualFee: feeKnown && !renewalOnly ? card.annualFee.amount : null,
    ...(feeKnown && renewalOnly ? { renewalOnlyFeeLabel: annualFeeLabel(card).amount + " from year two" } : {}),
    firstYearAnnualFeeStatus: firstYearAnnualFeeStatus(card),
    fxFee: card.fxFee,
    fxFeeScope: card.fxFeeScope,
    fxFeeVatTreatment: card.fxFeeVatTreatment,
    fxFeeUpperBound: card.fxFeeUpperBound,
    _provenance: card._provenance,
    minSalary: unverified ? null : card.eligibility.minSalary,
  };
}

export function buildFeeIndex(cards: CardForFeeIndex[]): FeeIndex {
  const rows = cards
    .map(toRow)
    .sort((a, b) => compareKnownAnnualFees(a.annualFee, b.annualFee) || (exactFxForStatistics(a) !== null && exactFxForStatistics(b) !== null
      ? exactFxForStatistics(a)! - exactFxForStatistics(b)! : 0) || a.name.localeCompare(b.name));

  const known = rows.filter((r): r is FeeIndexRow & { annualFee: number } => r.annualFee !== null);
  const fees = known.map((r) => r.annualFee);
  const paid = known.filter((r) => r.annualFee > 0);
  const free = rows.filter((r) => r.annualFee === 0);
  const fx = rows.map(exactFxForStatistics).filter((value): value is number => value !== null);

  const banks = new Map<string, FeeIndexRow[]>();
  for (const r of rows) banks.set(r.bank, [...(banks.get(r.bank) ?? []), r]);
  const byBank: BankFeeRow[] = [...banks.entries()]
    .map(([bank, list]) => ({
      bank,
      cards: list.length,
      freeForLife: list.filter((r) => r.annualFee === 0).length,
      medianFee: median(list.map((r) => r.annualFee).filter((fee): fee is number => fee !== null)),
      medianFx: median(list.map(exactFxForStatistics).filter((value): value is number => value !== null)),
    }))
    .sort((a, b) => b.cards - a.cards || a.bank.localeCompare(b.bank));

  const bySalaryTier: SalaryTierRow[] = SALARY_TIERS.map((t) => {
    const inTier = rows.filter(
      (r) => r.minSalary != null && r.minSalary >= t.min && (t.max == null || r.minSalary < t.max),
    );
    return {
      ...t,
      cards: inTier.length,
      medianFee: median(inTier.map((r) => r.annualFee).filter((fee): fee is number => fee !== null)),
      freeForLife: inTier.filter((r) => r.annualFee === 0).length,
    };
  });

  return {
    total: rows.length,
    freeForLife: free.length,
    freeShare: known.length === 0 ? null : free.length / known.length,
    firstYearFree: rows.filter((r) => r.firstYearAnnualFeeStatus === "waived").length,
    firstYearPending: rows.filter((r) => r.firstYearAnnualFeeStatus === "pending").length,
    annualFeePending: rows.length - known.length,
    annualFeeSampleSize: known.length,
    paidCount: paid.length,
    medianFee: median(fees),
    meanFee: mean(fees),
    medianPaidFee: median(paid.map((r) => r.annualFee)),
    meanPaidFee: mean(paid.map((r) => r.annualFee)),
    highest: known.length ? known[known.length - 1]! : null,
    lowestPaid: paid.length ? paid[0]! : null,
    fxZero: fx.filter(value => value === 0).length,
    medianFx: median(fx),
    maxFx: fx.length ? Math.max(...fx) : null,
    fxSampleSize: fx.length,
    byBank,
    bySalaryTier,
    rows,
  };
}

/** No unknown/upper-bound fee can masquerade as a precise zero or median input. */
export function exactFxForStatistics(card: Pick<FeeIndexRow, "fxFee" | "fxFeeScope" | "fxFeeUpperBound" | "_provenance">): number | null {
  if (card.fxFee === null || card.fxFeeScope || card.fxFeeUpperBound || cardFxNeedsReview(card)) return null;
  return Number.isFinite(card.fxFee) ? card.fxFee : null;
}
