import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bestCardPerCategory,
  SPEND_CATEGORIES,
  type CardForCalc,
  type SpendProfile,
} from "../../src/components/islands/RewardsCalculator.tsx";

/**
 * Wallet mode answers "which of my cards do I tap here" from the same earn
 * rates and published baselines the ranking uses. These tests pin the
 * routing on fixtures so a data update cannot move them.
 */

function card(slug: string, earnUnit: string, rates: Partial<Record<keyof SpendProfile, number>> & { everythingElse: number }, loyaltyProgram = "Cashback"): CardForCalc {
  return {
    slug, bank: "b", name: slug, network: "Visa", categories: [],
    annualFee: { amount: 0, currency: "AED" }, fxFee: 2, loyaltyProgram, earnUnit,
    earnRates: rates,
    eligibility: { minSalary: 5000, salaryTransferRequired: false, residencyRequired: true, employmentTypes: ["salaried"], documents: [] },
    perks: [], _features: [], transferPartners: [], lastVerified: new Date("2026-09-01"),
    sources: ["https://example.com"], _provenance: {}, _lastScraped: null, _lastReviewed: "2026-09-01",
  } as unknown as CardForCalc;
}

const SPEND: SpendProfile = { dining: 1000, groceries: 2000, fuel: 500, travel: 0, online: 800, utilities: 300, entertainment: 200 };

test("each category goes to the held card that earns most on it", () => {
  const dining = card("dining-card", "% cashback", { dining: 5, everythingElse: 0.5 });
  const grocery = card("grocery-card", "% cashback", { groceries: 4, everythingElse: 1 });
  const winners = bestCardPerCategory([dining, grocery], SPEND);
  const by = Object.fromEntries(winners.map((w) => [w.category, w]));
  assert.equal(by.dining!.card.slug, "dining-card");
  assert.equal(by.dining!.monthlyAED, 50);
  assert.equal(by.groceries!.card.slug, "grocery-card");
  assert.equal(by.groceries!.monthlyAED, 80);
  // Base rates decide the rest: 1% beats 0.5%.
  assert.equal(by.fuel!.card.slug, "grocery-card");
  assert.equal(by.online!.card.slug, "grocery-card");
});

test("the margin is the gap to the next-best held card", () => {
  const a = card("a", "% cashback", { dining: 5, everythingElse: 1 });
  const b = card("b", "% cashback", { dining: 3, everythingElse: 1 });
  const [dining] = bestCardPerCategory([a, b], { ...SPEND, dining: 1000 }).filter((w) => w.category === "dining");
  assert.equal(dining!.marginAED, 20);
});

test("zero-spend categories are skipped and an empty wallet returns nothing", () => {
  const a = card("a", "% cashback", { everythingElse: 1 });
  const winners = bestCardPerCategory([a], SPEND);
  assert.ok(!winners.some((w) => w.category === "travel"), "travel has zero spend");
  assert.equal(winners.length, SPEND_CATEGORIES.filter((k) => SPEND[k] > 0).length);
  assert.deepEqual(bestCardPerCategory([], SPEND), []);
});

test("a miles card is priced through the published baseline, not face value", () => {
  // 1.5 Skywards Miles per USD 1 on AED 3,672.50 of dining is 1,500 miles;
  // at the published 2.0 fils that is AED 30, which loses to 4% cashback.
  const miles = card("miles", "Skywards Miles per USD 1 spent", { everythingElse: 1.5 }, "Emirates Skywards");
  const cash = card("cash", "% cashback", { everythingElse: 4 });
  const [dining] = bestCardPerCategory([miles, cash], { ...SPEND, dining: 3672.5 }).filter((w) => w.category === "dining");
  assert.equal(dining!.card.slug, "cash");
});

test("a card with no earn denominator cannot win a category", () => {
  const vague = card("vague", "rewards", { everythingElse: 99 });
  const cash = card("cash", "% cashback", { everythingElse: 1 });
  for (const w of bestCardPerCategory([vague, cash], SPEND)) assert.equal(w.card.slug, "cash");
  assert.deepEqual(bestCardPerCategory([vague], SPEND), []);
});
