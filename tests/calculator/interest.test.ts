import { test } from "node:test";
import assert from "node:assert/strict";
import {
  payoff,
  paymentFor,
  parseMinPaymentRule,
  defaultMinPayment,
  defaultMonthlyRate,
  effectiveAnnualPct,
  nominalAnnualPct,
  median,
} from "../../src/lib/interestPayoff.ts";
import { getActiveCards } from "../../src/lib/cardsData.ts";

test("a fixed payment clears a balance in the closed-form number of months", () => {
  // n = -ln(1 - rB/P) / ln(1 + r) = 12.07 for B 10,000, r 3%, P 1,000 → 13 months.
  const r = payoff({ balanceAED: 10000, monthlyRatePct: 3, rule: { kind: "fixed", amountAED: 1000 } });
  assert.equal(r.clears, true);
  assert.equal(r.months, 13);
  assert.equal(r.firstPayment, 1000);
  assert.ok(Math.abs(r.totalPaid - (10000 + r.totalInterest)) < 0.01, "paid = principal + interest");
  assert.ok(r.schedule[12]!.payment < 1000, "the last payment is the clamped remainder");
  assert.ok(Math.abs(r.schedule[12]!.closing) < 0.005);
});

test("a payment that does not beat the interest never clears, and says so", () => {
  const r = payoff({ balanceAED: 10000, monthlyRatePct: 3, rule: { kind: "fixed", amountAED: 300 } });
  assert.equal(r.clears, false);
  assert.equal(r.months, 1, "stops as soon as the balance would not fall");
});

test("the minimum rule pays the greater of the percentage and the floor", () => {
  assert.equal(paymentFor({ kind: "minimum", percent: 5, floorAED: 100 }, 1000), 100);
  assert.equal(paymentFor({ kind: "minimum", percent: 5, floorAED: 100 }, 10000), 500);
});

test("minimum-only repayment takes far longer than a fixed payment of the first minimum", () => {
  const min = payoff({ balanceAED: 20000, monthlyRatePct: 3.49, rule: { kind: "minimum", percent: 5, floorAED: 100 } });
  const fixed = payoff({ balanceAED: 20000, monthlyRatePct: 3.49, rule: { kind: "fixed", amountAED: min.firstPayment } });
  assert.equal(min.clears, true);
  assert.equal(fixed.clears, true);
  assert.ok(min.months > fixed.months * 2, `${min.months} vs ${fixed.months}`);
  assert.ok(min.totalInterest > fixed.totalInterest);
});

test("annual figures: nominal is ×12, effective compounds", () => {
  assert.equal(nominalAnnualPct(3.25), 39);
  assert.ok(Math.abs(effectiveAnnualPct(3.25) - 46.78) < 0.05);
});

test("the minimum-payment regex reads every rule L2 publishes", () => {
  assert.deepEqual(parseMinPaymentRule("5% of the outstanding balance or AED 100, whichever is higher"), { percent: 5, floorAED: 100 });
  assert.deepEqual(parseMinPaymentRule("Higher of AED 100 or 2.74% of the statement balance"), { percent: 2.74, floorAED: 100 });
  assert.deepEqual(parseMinPaymentRule("5% of the statement balance"), { percent: 5, floorAED: null });
  assert.deepEqual(parseMinPaymentRule("1% of the principal balance plus fees, or AED 110, whichever is higher"), { percent: 1, floorAED: 110 });
  assert.equal(parseMinPaymentRule("see KFS"), null);
  assert.equal(parseMinPaymentRule(undefined), null);
  for (const c of getActiveCards()) {
    if (c.minPayment) assert.ok(parseMinPaymentRule(c.minPayment), `${c.slug}: "${c.minPayment}" did not parse`);
  }
});

test("defaults are the median rate and the modal rule, with the counts the page prints", () => {
  const cards = [
    { slug: "a", name: "a", bank: "x", interestRate: { monthly: 3.25 }, minPayment: "5% or AED 100" },
    { slug: "b", name: "b", bank: "x", interestRate: { monthly: 3.85 }, minPayment: "5% of the balance" },
    { slug: "c", name: "c", bank: "x", interestRate: { monthly: 3.49 }, minPayment: "4% or AED 100, whichever is higher" },
    { slug: "d", name: "d", bank: "x", interestRate: { monthly: 9.99 }, _provenance: { interestRate: "needs-review" } },
    { slug: "e", name: "e", bank: "x", minPayment: "nothing parseable" },
  ];
  assert.deepEqual(defaultMonthlyRate(cards), { monthlyRatePct: 3.49, sampleSize: 3 });
  assert.deepEqual(defaultMinPayment(cards), {
    percent: 5, percentMatches: 2, percentTotal: 3,
    floorAED: 100, floorMatches: 2, floorTotal: 2,
  });
  assert.equal(median([]), null);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("the live defaults exist and are plausible UAE card rates", () => {
  const rate = defaultMonthlyRate(getActiveCards());
  assert.ok(rate && rate.sampleSize >= 10, "at least ten cards publish a monthly rate");
  assert.ok(rate!.monthlyRatePct > 2 && rate!.monthlyRatePct < 5, `median ${rate!.monthlyRatePct}`);
  const min = defaultMinPayment(getActiveCards());
  assert.ok(min && min.percentTotal >= 5);
});
