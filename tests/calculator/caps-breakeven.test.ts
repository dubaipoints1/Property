import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rankCards,
  breakEven,
  type CardForCalc,
  type SpendProfile,
} from "../../src/components/islands/RewardsCalculator.tsx";
import { getActiveCards } from "../../src/lib/cardsData.ts";

/**
 * The methodology page said, from May 2026, that the calculator applies
 * per-category caps "only when the card declares them in typed form". It
 * applied none. Thirteen cards carry `earnRates._caps`; this file holds the
 * claim to the code.
 */

const ZERO: SpendProfile = {
  dining: 0, groceries: 0, fuel: 0, travel: 0, online: 0, utilities: 0, entertainment: 0,
};

function cashback(over: {
  slug: string;
  annualFee?: number;
  rates: Partial<Record<keyof SpendProfile, number>> & { everythingElse: number };
  caps?: Record<string, unknown>;
}): CardForCalc {
  return {
    slug: over.slug,
    bank: "test-bank",
    name: over.slug,
    network: "Visa",
    categories: [],
    annualFee: { amount: over.annualFee ?? 0, currency: "AED" },
    fxFee: 2,
    loyaltyProgram: "Cashback",
    earnUnit: "% cashback",
    earnRates: { ...over.rates, ...(over.caps ? { _caps: over.caps } : {}) },
    eligibility: { minSalary: 5000, salaryTransferRequired: false, residencyRequired: true, employmentTypes: ["salaried"], documents: [] },
    perks: [],
    _features: [],
    transferPartners: [],
    lastVerified: new Date("2026-09-01"),
    sources: ["https://example.com"],
    _provenance: {},
    _lastScraped: null,
    _lastReviewed: "2026-09-01",
  } as unknown as CardForCalc;
}

const NOW = new Date("2026-09-10");

test("a per-category cap clamps that category and reports the binding cap", () => {
  // 5% on AED 10,000 of groceries is AED 500; the card caps groceries at 300.
  const card = cashback({
    slug: "grocery-capped",
    rates: { groceries: 5, everythingElse: 1 },
    caps: { per_category: { groceries: { monthly_aed: 300 } } },
  });
  const [r] = rankCards([card], { ...ZERO, groceries: 10000 }, { netOfFee: false, now: NOW });
  assert.equal(r!.monthlyRewardAED, 300);
  assert.equal(r!.capHit, true);
  assert.equal(r!.cappedAtAED, 300);
});

test("a monthly maximum clamps the month's total across categories", () => {
  // 4% flat on AED 50,000 is AED 2,000; the card caps the month at 1,000.
  const card = cashback({
    slug: "month-capped",
    rates: { everythingElse: 4 },
    caps: { monthly_max_aed: 1000 },
  });
  const [r] = rankCards([card], { ...ZERO, dining: 25000, online: 25000 }, { netOfFee: false, now: NOW });
  assert.equal(r!.monthlyRewardAED, 1000);
  assert.equal(r!.monthlyRewardNative, 1000, "cashback is AED, so the native figure is capped too");
  assert.equal(r!.cappedAtAED, 1000);
});

test("a cap that is not reached leaves the figure alone and reports no cap", () => {
  const card = cashback({
    slug: "under-cap",
    rates: { everythingElse: 1 },
    caps: { monthly_max_aed: 1000, per_category: { dining: { monthly_aed: 200 } } },
  });
  const [r] = rankCards([card], { ...ZERO, dining: 5000 }, { netOfFee: false, now: NOW });
  assert.equal(r!.monthlyRewardAED, 50);
  assert.equal(r!.capHit, false);
  assert.equal(r!.cappedAtAED, null);
});

test("a points card is never clamped by an AED-denominated cap", () => {
  const points = {
    ...cashback({ slug: "points", rates: { everythingElse: 2 }, caps: { monthly_max_aed: 10 } }),
    earnUnit: "Points per AED 1 spent",
    loyaltyProgram: "Some Points",
  } as CardForCalc;
  const [r] = rankCards([points], { ...ZERO, dining: 10000 }, { netOfFee: false, now: NOW });
  assert.equal(r!.monthlyRewardNative, 20000);
  assert.equal(r!.capHit, false);
});

test("the qualifying-spend flag fires only below the typed threshold", () => {
  const card = cashback({
    slug: "needs-5k",
    rates: { everythingElse: 1 },
    caps: { min_monthly_spend_to_qualify_aed: 5000 },
  });
  const [below] = rankCards([card], { ...ZERO, dining: 4999 }, { netOfFee: false, now: NOW });
  const [at] = rankCards([card], { ...ZERO, dining: 5000 }, { netOfFee: false, now: NOW });
  assert.equal(below!.belowQualifyingSpend, true);
  assert.equal(below!.qualifyingSpendAED, 5000);
  assert.equal(at!.belowQualifyingSpend, false);
});

test("break-even: fee accrual divided by reward per dirham at this mix", () => {
  // AED 600 a year is AED 50 a month; 1% flat covers it at AED 5,000 of spend.
  const be = breakEven(600, 20, 2000, null, null);
  assert.equal(be.breakEvenMonthlySpendAED, 5000);
  assert.equal(be.feeNeverCovered, false);
});

test("break-even is null for a fee-free card, zero spend, or zero reward", () => {
  assert.equal(breakEven(0, 20, 2000, null, null).breakEvenMonthlySpendAED, null);
  assert.equal(breakEven(600, 20, 0, null, null).breakEvenMonthlySpendAED, null);
  assert.equal(breakEven(600, 0, 2000, null, null).breakEvenMonthlySpendAED, null);
});

test("break-even reports 'never covered' when the monthly cap sits below the fee accrual", () => {
  // AED 1,200 a year is AED 100 a month; the card caps the month at AED 40.
  const be = breakEven(1200, 30, 3000, 40, 40);
  assert.equal(be.breakEvenMonthlySpendAED, null);
  assert.equal(be.feeNeverCovered, true);
});

test("break-even uses the uncapped rate, so a capped card still gets a figure when the cap clears the fee", () => {
  const card = cashback({
    slug: "capped-paid",
    annualFee: 600, // AED 50 a month
    rates: { everythingElse: 2 },
    caps: { monthly_max_aed: 1000 },
  });
  const [r] = rankCards([card], { ...ZERO, dining: 60000 }, { netOfFee: false, now: NOW });
  assert.equal(r!.capHit, true, "AED 1,200 uncapped is clamped to 1,000");
  assert.equal(r!.breakEvenMonthlySpendAED, 2500, "AED 50 / 2% = AED 2,500 of spend");
  assert.equal(r!.feeNeverCovered, false);
});

test("every typed cap in L2 is on a card the calculator treats as cashback, or is an untyped points cap", () => {
  // The clamp only runs for cashback cards. This guards against a future
  // AED-denominated cap landing on a points card and silently doing nothing.
  const capped = getActiveCards().filter((c) => c.earnRates._caps);
  assert.ok(capped.length >= 10, `expected the thirteen known capped cards, found ${capped.length}`);
  // AED 200,000 a category: enough that even a 1% flat card with a
  // AED 2,500 monthly cap (Wio) is clamped. Online is included because
  // one capped card (SC Platinum X) earns only on online, foreign-currency
  // and wallet spend and would otherwise never reach its cap.
  const heavy = { ...ZERO, dining: 200000, groceries: 200000, fuel: 200000, travel: 200000, online: 200000 };
  const ranked = rankCards(capped as CardForCalc[], heavy, { netOfFee: false, now: NOW });
  for (const r of ranked) {
    const caps = r.card.earnRates._caps!;
    const hasAedCap = caps.monthly_max_aed != null || (caps.per_category && Object.keys(caps.per_category).length > 0);
    if (hasAedCap && r.rateBasis === "cashback") {
      assert.equal(r.capHit, true, `${r.card.slug} carries an AED cap but AED 800,000 of spend did not reach it`);
    }
  }
});
