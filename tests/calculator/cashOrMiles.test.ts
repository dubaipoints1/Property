import test from "node:test";
import assert from "node:assert/strict";
import { calculateCashOrMiles, type CashOrMilesInput } from "../../src/lib/cashOrMiles";

const example: CashOrMilesInput = { cashFare: "5,200", miles: "105,000", awardFees: "2,400", target: "2" };

function calculate(input: Partial<CashOrMilesInput> = {}) {
  const answer = calculateCashOrMiles({ ...example, ...input });
  assert.ok(answer.ok);
  return answer.result;
}

test("hypothetical high-value redemption computes cash saved and the target break-even", () => {
  const result = calculate();
  assert.equal(result.cashSavedFils, 280_000);
  assert.ok(Math.abs(result.filsPerMile - 2.66666667) < 0.00001);
  assert.equal(result.breakEvenFareFils, 450_000);
  assert.equal(result.verdict, "above-target");
});

test("low-value redemption can save cash while falling below the reader's target", () => {
  assert.deepEqual(calculate({ cashFare: "380", miles: "15000", awardFees: "180" }), {
    cashSavedFils: 20_000, filsPerMile: 4 / 3, breakEvenFareFils: 48_000, verdict: "below-target",
  });
});

test("zero and negative savings are separate outcomes even if no target is entered", () => {
  assert.equal(calculate({ cashFare: "2400", target: "" }).verdict, "no-saving");
  const result = calculate({ cashFare: "1200", target: "" });
  assert.equal(result.verdict, "negative-saving");
  assert.equal(result.cashSavedFils, -120_000);
  assert.equal(result.breakEvenFareFils, null);
});

test("blank target keeps the value calculation but does not assume a target or a break-even", () => {
  const result = calculate({ target: " ", awardFees: "0" });
  assert.equal(result.verdict, "no-target");
  assert.equal(result.breakEvenFareFils, null);
  assert.equal(result.cashSavedFils, 520_000);
});

test("tie, below and above use exact decimal comparison before display rounding", () => {
  assert.equal(calculate({ cashFare: "4500" }).verdict, "at-target");
  assert.equal(calculate({ cashFare: "4499.99" }).verdict, "below-target");
  assert.equal(calculate({ cashFare: "4500.01" }).verdict, "above-target");
});

test("a break-even fare is rounded up to the smallest AED quote that meets the target", () => {
  const partial = { miles: "3", awardFees: "10.00", target: ".50" };
  assert.equal(calculate({ ...partial, cashFare: "10.01" }).verdict, "below-target");
  const result = calculate({ ...partial, cashFare: "10.02" });
  assert.equal(result.verdict, "above-target");
  assert.equal(result.breakEvenFareFils, 1002);
});

test("Arabic-Indic digits and separators, Persian digits and English grouping are parsed", () => {
  assert.deepEqual(calculate({ cashFare: "٥٬٢٠٠٫٠٠", miles: "۱۰۵٬۰۰۰", awardFees: "2,400.00", target: "٢" }), calculate());
});

test("malformed and out-of-range inputs fail by field instead of coercing to zero", () => {
  for (const fields of [
    { cashFare: "0", miles: "0", awardFees: "", target: "0" },
    { cashFare: "1e4", miles: "10.5", awardFees: "-0.01", target: "2,5" },
    { cashFare: "1,000,000.01", miles: "10,000,001", awardFees: "1,000,000.01", target: "1000.01" },
    { cashFare: "1.000", miles: "1,00", awardFees: "AED 300", target: "NaN" },
  ]) {
    const answer = calculateCashOrMiles(fields);
    assert.equal(answer.ok, false);
    if (!answer.ok) assert.deepEqual(Object.keys(answer.errors), ["cashFare", "miles", "awardFees", "target"]);
  }
});
