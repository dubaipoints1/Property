import { test } from "node:test";
import assert from "node:assert/strict";
import { SPEND_PRESETS, presetTotal } from "../../src/data/spendProfiles.ts";
import {
  rankCards,
  SPEND_CATEGORIES,
  type CardForCalc,
} from "../../src/components/islands/RewardsCalculator.tsx";
import { getActiveCards } from "../../src/lib/cardsData.ts";
import { hasUsableGenericEarnRate } from "../../src/lib/cardEarnModel.ts";

test("every preset states all seven categories as non-negative round dirhams", () => {
  const ids = new Set<string>();
  for (const p of SPEND_PRESETS) {
    assert.ok(!ids.has(p.id), `duplicate preset id ${p.id}`);
    ids.add(p.id);
    for (const k of SPEND_CATEGORIES) {
      const v = p.spend[k];
      assert.ok(Number.isInteger(v) && v >= 0 && v % 50 === 0, `${p.id}.${k} = ${v}`);
    }
    assert.ok(presetTotal(p) > 0, `${p.id} has no spend`);
  }
});

test("different preset mixes distinguish confirmed synthetic category-specialist cards", () => {
  // Source holds must not be relaxed to manufacture different real winners.
  const base = getActiveCards()[0];
  const cards = ["dining", "groceries", "travel", "online"].map(category => ({
    ...base, slug: `synthetic-${category}`, annualFee: { amount: 0, currency: "AED" as const }, vatPolicy: "inclusive" as const,
    earnRates: { everythingElse: 0, [category]: 10 }, earnUnit: "% cashback", loyaltyProgram: "Cashback",
    scopedEarnRates: undefined, _provenance: {}, _dataIssues: {},
  })) as CardForCalc[];
  const tops = new Set(
    SPEND_PRESETS.map((p) => rankCards(cards, p.spend, { netOfFee: true })[0]?.card.slug),
  );
  assert.ok(tops.size >= 3, `only ${tops.size} distinct winners across ${SPEND_PRESETS.length} presets: ${[...tops].join(", ")}`);
});

test("every live preset excludes source-held or unmodelled generic earn rates", () => {
  for (const preset of SPEND_PRESETS) {
    for (const row of rankCards(getActiveCards(), preset.spend, { netOfFee: true })) {
      assert.equal(hasUsableGenericEarnRate(row.card), true, row.card.slug);
      assert.notEqual(row.netMonthlyAED, null, row.card.slug);
    }
  }
});
