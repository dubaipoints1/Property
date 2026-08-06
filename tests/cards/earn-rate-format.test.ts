import { test } from "node:test";
import assert from "node:assert/strict";

import {
  earnRateComparisonKey,
  earnRateBasis,
  formatEarnRate,
} from "../../src/lib/cardsDataFormat";

test("earn-rate formatter preserves AED 1, AED 10 and AED 200 denominators", () => {
  assert.equal(formatEarnRate(2, "Miles per AED 1 spent"), "2× per AED 1");
  assert.equal(formatEarnRate(10, "Etihad Guest Miles per AED 10 spent"), "10× per AED 10");
  assert.equal(formatEarnRate(1, "ENBD Plus Points per AED 200 spent"), "1× per AED 200");
});

test("comparison keys require the same reward currency and denominator", () => {
  assert.equal(
    earnRateComparisonKey("Etihad Guest Miles per AED 10 spent"),
    "etihad guest miles|AED|10",
  );
  assert.equal(
    earnRateComparisonKey("Skywards Miles per USD 1 spent"),
    "skywards miles|USD|1",
  );
  assert.equal(earnRateComparisonKey("% cashback"), "percentage");
  assert.equal(earnRateComparisonKey("Unspecified points"), null);
});

test("earn-rate formatter preserves USD denominators rather than relabelling them AED", () => {
  assert.equal(formatEarnRate(2, "Skywards Miles per USD 1 spent"), "2× per USD 1");
});

test("earn-rate formatter keeps percentage cards denominator-free", () => {
  assert.equal(formatEarnRate(5, "% cashback"), "5%");
  assert.equal(formatEarnRate(8, "% as points"), "8%");
});

test("earn-rate formatter labels explicit base-rate multipliers and leaves unknown units unguessed", () => {
  assert.equal(formatEarnRate(10, "RED Points (multiplier on base earn rate)"), "10× base earn");
  assert.equal(formatEarnRate(3, "Unspecified points unit"), "3×");
});

test("earn-rate basis extraction is case-insensitive and rejects absent bases", () => {
  assert.equal(earnRateBasis("points PER aed 10 spent"), "per AED 10");
  assert.equal(earnRateBasis("points per usd 1 spent"), "per USD 1");
  assert.equal(earnRateBasis("% cashback"), null);
});
