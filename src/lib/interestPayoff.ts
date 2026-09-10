/**
 * Interest-and-payoff arithmetic for /calculator/interest/.
 *
 * WHY THIS EXISTS. Every tool on the site so far models what a card pays
 * back. None modelled what a card costs when a balance is carried, which
 * is the single largest number in most cardholders' relationship with the
 * product — UAE issuers quote 3–4% a month, and a minimum-payment rule that
 * shrinks as the balance shrinks stretches a modest balance over a decade.
 * The 10 September 2026 kredit.ae teardown found the competitor shipping
 * this as one of five calculators; the maths is arithmetic on the reader's
 * own inputs and needs nothing from anyone else's site.
 *
 * WHAT COMES FROM DATA. The two defaults the page opens with — the monthly
 * rate and the minimum-payment rule — are derived at build time from the
 * cards in L2 that publish them (`interestRate.monthly`, `minPayment`), and
 * the page states how many cards the default matches. Nothing here is a
 * typed-in "typical" figure. Per Charter §6 the minimum-payment rule is read
 * with a deterministic regex, never an LLM, and a string the regex cannot
 * read yields null rather than a guess.
 *
 * Pure module: no DOM, no Astro globals. tests/calculator/interest.test.ts
 * imports it directly.
 */

export type PaymentRule =
  | { kind: "minimum"; percent: number; floorAED: number }
  | { kind: "fixed"; amountAED: number };

export interface PayoffInput {
  balanceAED: number;
  /** Monthly rate as a percentage, e.g. 3.49 for 3.49% a month. */
  monthlyRatePct: number;
  rule: PaymentRule;
  /** Safety cap on the schedule length. Default 600 months (50 years). */
  maxMonths?: number;
}

export interface PayoffRow {
  month: number;
  opening: number;
  interest: number;
  payment: number;
  closing: number;
}

export interface PayoffResult {
  /** False when the payment never exceeds the interest, or maxMonths is hit. */
  clears: boolean;
  months: number;
  totalInterest: number;
  totalPaid: number;
  firstPayment: number;
  schedule: PayoffRow[];
}

/** The payment a rule produces against a given balance, before the last-month clamp. */
export function paymentFor(rule: PaymentRule, balanceAED: number): number {
  if (rule.kind === "fixed") return Math.max(0, rule.amountAED);
  return Math.max(rule.floorAED, (rule.percent / 100) * balanceAED);
}

/** Monthly rate ×12, the figure issuers quote as the annual rate. */
export function nominalAnnualPct(monthlyRatePct: number): number {
  return monthlyRatePct * 12;
}

/** (1 + r)^12 − 1: what the monthly rate compounds to over a year. */
export function effectiveAnnualPct(monthlyRatePct: number): number {
  return (Math.pow(1 + monthlyRatePct / 100, 12) - 1) * 100;
}

/**
 * Run the balance forward month by month. Interest accrues on the opening
 * balance, the payment lands, and the closing balance carries. The final
 * payment is clamped to what is owed so the schedule ends at exactly zero.
 */
export function payoff(input: PayoffInput): PayoffResult {
  const maxMonths = input.maxMonths ?? 600;
  const r = input.monthlyRatePct / 100;
  let balance = Math.max(0, input.balanceAED);
  const schedule: PayoffRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let firstPayment = 0;

  if (balance === 0) {
    return { clears: true, months: 0, totalInterest: 0, totalPaid: 0, firstPayment: 0, schedule };
  }

  for (let month = 1; month <= maxMonths; month++) {
    const opening = balance;
    const interest = opening * r;
    const owed = opening + interest;
    let payment = paymentFor(input.rule, opening);
    if (payment > owed) payment = owed;
    if (month === 1) firstPayment = payment;

    // A payment that does not beat the interest never reduces the balance.
    // Stop here and say so rather than run 600 months of a flat line.
    if (payment <= interest && owed > 0) {
      schedule.push({ month, opening, interest, payment, closing: owed - payment });
      return {
        clears: false,
        months: month,
        totalInterest: totalInterest + interest,
        totalPaid: totalPaid + payment,
        firstPayment,
        schedule,
      };
    }

    const closing = owed - payment;
    totalInterest += interest;
    totalPaid += payment;
    schedule.push({ month, opening, interest, payment, closing });
    balance = closing;

    if (balance <= 0.005) {
      return { clears: true, months: month, totalInterest, totalPaid, firstPayment, schedule };
    }
  }

  return { clears: false, months: maxMonths, totalInterest, totalPaid, firstPayment, schedule };
}

// ── Defaults derived from L2 ─────────────────────────────────────────────

export interface ParsedMinPayment {
  percent: number;
  floorAED: number | null;
}

/**
 * Read a card's published minimum-payment rule. Deterministic on purpose:
 * one percentage and, if present, one AED floor. Anything the pattern cannot
 * read returns null so the caller falls back to the modal rule rather than
 * a guess.
 */
export function parseMinPaymentRule(text: string | null | undefined): ParsedMinPayment | null {
  if (!text) return null;
  const pct = /(\d+(?:\.\d+)?)\s*%/.exec(text);
  if (!pct) return null;
  const percent = Number(pct[1]);
  if (!Number.isFinite(percent) || percent <= 0) return null;
  const floor = /AED\s*(\d[\d,]*)/i.exec(text);
  const floorAED = floor ? Number(floor[1].replace(/,/g, "")) : null;
  return { percent, floorAED: floorAED != null && Number.isFinite(floorAED) ? floorAED : null };
}

export interface CardForInterest {
  slug: string;
  name: string;
  bank: string;
  interestRate?: { monthly: number; annual?: number } | null;
  minPayment?: string | null;
  _provenance?: Record<string, string> | null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function mode(values: number[]): { value: number; count: number } | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: { value: number; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count || (count === best.count && value < best.value)) {
      best = { value, count };
    }
  }
  return best;
}

/** Cards whose monthly rate is published and not flagged for review. */
export function cardsWithRate<T extends CardForInterest>(cards: T[]): T[] {
  return cards.filter(
    (c) =>
      c.interestRate != null &&
      Number.isFinite(c.interestRate.monthly) &&
      c.interestRate.monthly > 0 &&
      c._provenance?.interestRate !== "needs-review",
  );
}

export interface RateDefault {
  monthlyRatePct: number;
  /** How many cards the median was taken over. */
  sampleSize: number;
}

export function defaultMonthlyRate(cards: CardForInterest[]): RateDefault | null {
  const withRate = cardsWithRate(cards);
  const m = median(withRate.map((c) => c.interestRate!.monthly));
  return m == null ? null : { monthlyRatePct: Math.round(m * 100) / 100, sampleSize: withRate.length };
}

export interface MinPaymentDefault {
  percent: number;
  /** Cards stating exactly this percentage, over cards whose rule parsed. */
  percentMatches: number;
  percentTotal: number;
  floorAED: number;
  /** Cards stating exactly this floor, over cards whose rule includes a floor. */
  floorMatches: number;
  floorTotal: number;
}

/**
 * The most common minimum-payment rule among the cards that publish one,
 * with the counts the page prints beside it. Returns null when no card's
 * rule parses, so the page can say so instead of inventing a convention.
 */
export function defaultMinPayment(cards: CardForInterest[]): MinPaymentDefault | null {
  const parsed = cards
    .map((c) => parseMinPaymentRule(c.minPayment))
    .filter((p): p is ParsedMinPayment => p != null);
  const pct = mode(parsed.map((p) => p.percent));
  if (!pct) return null;
  const floors = parsed.map((p) => p.floorAED).filter((f): f is number => f != null);
  const floor = mode(floors);
  return {
    percent: pct.value,
    percentMatches: pct.count,
    percentTotal: parsed.length,
    floorAED: floor?.value ?? 0,
    floorMatches: floor?.count ?? 0,
    floorTotal: floors.length,
  };
}
