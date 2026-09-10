// Unit tests for the spend-ROI calculator's ranking function (C3).
//
// Run: node --import tsx --test tests/calculator/ranking.test.ts
// (or via `npm test`)
//
// The ranker is a pure function exported from the island so we don't have
// to render Preact in tests. We synthesise tiny fixture cards instead of
// reading cards.json so the assertions don't drift as the data updates.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  rankCards,
  conversionForCard,
  PLACEHOLDER_AED_PER_UNIT,
  type CardForCalc,
  type SpendProfile,
} from "../../src/components/islands/RewardsCalculator.tsx";

// ── Fixtures ─────────────────────────────────────────────────────────────

const ZERO_SPEND: SpendProfile = {
  dining: 0,
  groceries: 0,
  fuel: 0,
  travel: 0,
  online: 0,
  utilities: 0,
  entertainment: 0,
};

/** Build a minimally-valid CardForCalc fixture. Only the fields the ranker
 * reads are populated; the rest are kept type-correct but inert. */
function makeCard(over: {
  slug: string;
  name: string;
  loyaltyProgram?: string;
  earnUnit?: string;
  annualFee?: number;
  dining?: number;
  groceries?: number;
  fuel?: number;
  travel?: number;
  online?: number;
  entertainment?: number;
  everythingElse?: number;
  lastVerified?: Date;
}): CardForCalc {
  return {
    slug: over.slug,
    bank: "test-bank",
    name: over.name,
    network: "Visa",
    categories: [],
    annualFee: { amount: over.annualFee ?? 0, currency: "AED" },
    fxFee: 2,
    loyaltyProgram: over.loyaltyProgram,
    earnUnit: over.earnUnit,
    earnRates: {
      dining: over.dining,
      groceries: over.groceries,
      fuel: over.fuel,
      travel: over.travel,
      online: over.online,
      entertainment: over.entertainment,
      everythingElse: over.everythingElse ?? 1,
    },
    eligibility: {
      minSalary: 5000,
      salaryTransferRequired: false,
      residencyRequired: true,
      employmentTypes: ["salaried"],
      documents: [],
    },
    perks: [],
    _features: [],
    transferPartners: [],
    lastVerified: over.lastVerified ?? new Date("2026-05-01"),
    sources: ["https://example.com/source"],
    _provenance: {},
    _lastScraped: null,
    _lastReviewed: "2026-05-01",
  } as unknown as CardForCalc;
}

const REF_NOW = new Date("2026-05-12");

// ── Test 1: dining-heavy profile ranks the dining-bonus card first ───────

test("Heavy-dining spend ranks the dining-bonus card first", () => {
  const diningHeavy = makeCard({
    slug: "dining-heavy",
    name: "Dining Heavy Card",
    loyaltyProgram: "FAB Rewards",
    earnUnit: "FAB Rewards per AED 1 spent",
    dining: 5,
    everythingElse: 1,
  });
  const balanced = makeCard({
    slug: "balanced",
    name: "Balanced Card",
    loyaltyProgram: "FAB Rewards",
    earnUnit: "FAB Rewards per AED 1 spent",
    everythingElse: 2,
  });
  const groceriesHeavy = makeCard({
    slug: "groceries-heavy",
    name: "Groceries Heavy Card",
    loyaltyProgram: "FAB Rewards",
    earnUnit: "FAB Rewards per AED 1 spent",
    groceries: 5,
    everythingElse: 1,
  });

  const spend: SpendProfile = {
    ...ZERO_SPEND,
    dining: 5000,
  };

  const ranked = rankCards([balanced, groceriesHeavy, diningHeavy], spend, {
    netOfFee: false,
    now: REF_NOW,
  });

  assert.equal(ranked[0].card.slug, "dining-heavy", "dining card should win");
  assert.equal(ranked[0].topCategory, "dining");
  // Native reward: 5000 * 5 = 25,000 FAB Rewards.
  assert.equal(ranked[0].monthlyRewardNative, 25000);
});

// ── Test 2: AED conversion respects earnUnit ─────────────────────────────

test("AED conversion respects earnUnit — a bigger rate number can be worth less", () => {
  // The whole point of the conversion: `5` and `2` are not comparable until
  // each has been through its own denominator and its own unit value.
  // 2 Miles per AED at the published 2 fils = 4% back.
  const milesCard = makeCard({
    slug: "miles-card",
    name: "Skywards 2x Card",
    loyaltyProgram: "Emirates Skywards",
    earnUnit: "Skywards Miles per AED 1 spent",
    dining: 2,
    everythingElse: 2,
  });
  // 5% cashback pays dirhams directly = 5% back, so it wins despite the
  // miles card quoting the larger-looking rate per dirham.
  const cashbackCard = makeCard({
    slug: "cashback-card",
    name: "Plain Cashback Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "% cashback",
    dining: 5,
    everythingElse: 5,
  });

  const spend: SpendProfile = { ...ZERO_SPEND, dining: 1000 };

  const ranked = rankCards([milesCard, cashbackCard], spend, {
    netOfFee: false,
    now: REF_NOW,
  });

  assert.equal(
    ranked[0].card.slug,
    "cashback-card",
    "cashback should beat miles in AED-equivalent terms",
  );
  // Both figures moved on 10 September 2026. The old fixture asserted that
  // a 1% cashback card returned AED 1,000 on AED 1,000 of spend — the 100x
  // bug written down as a test — and priced a mile at 4 fils against the 2.0
  // published on /valuations/.
  assert.equal(ranked[0].aedPerUnit, 1);
  assert.equal(ranked[1].aedPerUnit, 0.02);
  assert.equal(ranked[0].monthlyRewardAED, 50); // 1000 * 5% in dirhams
  assert.equal(ranked[1].monthlyRewardAED, 40); // 1000 * 2 miles * 0.02
});

// ── Test 3: net-of-fee toggle re-ranks ───────────────────────────────────

test("Net-of-annual-fee toggle flips ranking when fee dominates", () => {
  // High earn, AED 3,000 annual fee → AED 250/month fee accrual.
  const premium = makeCard({
    slug: "premium-fee",
    name: "Premium Fee Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "% cashback",
    annualFee: 3000,
    everythingElse: 3, // 3% on everything
  });
  // Lower earn, no fee.
  const freebie = makeCard({
    slug: "freebie",
    name: "No Fee Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "% cashback",
    annualFee: 0,
    everythingElse: 2, // 2% on everything
  });

  // AED 5,000 of "utilities" spend flows through everythingElse — neither
  // fixture publishes a utilities rate.
  // Premium reward: 5000 * 3% = 150 AED. Net: 150 - 250 = -100 AED/mo.
  // Freebie reward: 5000 * 2% = 100 AED. Net: 100 - 0   =  100 AED/mo.
  const spend: SpendProfile = { ...ZERO_SPEND, utilities: 5000 };

  const grossRanked = rankCards([premium, freebie], spend, {
    netOfFee: false,
    now: REF_NOW,
  });
  assert.equal(
    grossRanked[0].card.slug,
    "premium-fee",
    "gross ranking should favour the higher earn rate",
  );

  const netRanked = rankCards([premium, freebie], spend, {
    netOfFee: true,
    now: REF_NOW,
  });
  assert.equal(
    netRanked[0].card.slug,
    "freebie",
    "net-of-fee ranking should favour the no-fee card",
  );
  assert.equal(netRanked[0].netMonthlyAED, 100);
  assert.equal(netRanked[1].netMonthlyAED, -100);
});

// ── Test 4: stale data flag ──────────────────────────────────────────────

test("Cards verified more than 90 days ago carry the stale flag", () => {
  const fresh = makeCard({
    slug: "fresh",
    name: "Fresh Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "AED cashback per AED 1 spent",
    lastVerified: new Date("2026-05-01"), // 11 days before REF_NOW
  });
  const stale = makeCard({
    slug: "stale",
    name: "Stale Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "AED cashback per AED 1 spent",
    lastVerified: new Date("2025-12-01"), // ~5 months before REF_NOW
  });

  const ranked = rankCards([fresh, stale], { ...ZERO_SPEND, dining: 1000 }, {
    netOfFee: false,
    now: REF_NOW,
  });

  const freshResult = ranked.find((r) => r.card.slug === "fresh");
  const staleResult = ranked.find((r) => r.card.slug === "stale");
  assert.ok(freshResult);
  assert.ok(staleResult);
  assert.equal(freshResult.staleData, false);
  assert.equal(staleResult.staleData, true);
});

// ── Test 5: conversion bucket resolution ─────────────────────────────────

test("conversionForCard maps loyalty programmes to AED rates correctly", () => {
  const cashback = makeCard({
    slug: "c",
    name: "C",
    loyaltyProgram: "AED Cashback",
    earnUnit: "% cashback",
  });
  assert.equal(conversionForCard(cashback).basis, "cashback");
  assert.equal(conversionForCard(cashback).aedPerUnit, 1);

  const skywards = makeCard({
    slug: "s",
    name: "S",
    loyaltyProgram: "Emirates Skywards",
    earnUnit: "Skywards Miles per AED 1 spent",
  });
  assert.equal(conversionForCard(skywards).basis, "published");
  assert.equal(conversionForCard(skywards).aedPerUnit, 0.02);

  // No published baseline for FAB Rewards, so a labelled placeholder — not
  // a rate presented as though it came from /valuations/.
  const fabRewards = makeCard({
    slug: "f",
    name: "F",
    loyaltyProgram: "FAB Rewards",
    earnUnit: "FAB Rewards per AED 1 spent",
  });
  assert.equal(conversionForCard(fabRewards).basis, "placeholder");
  assert.equal(conversionForCard(fabRewards).aedPerUnit, PLACEHOLDER_AED_PER_UNIT);

  // The programme name must match the valuations map exactly. "Marriott
  // Bonvoy Points" is not the string cards.json uses, so it does not
  // silently pick up Bonvoy's published rate.
  const marriott = makeCard({
    slug: "m",
    name: "M",
    loyaltyProgram: "Marriott Bonvoy",
    earnUnit: "Marriott Bonvoy points per AED 1 spent",
  });
  assert.equal(conversionForCard(marriott).basis, "published");
  assert.equal(conversionForCard(marriott).aedPerUnit, 0.025);

  // No earnUnit at all: no denominator, so no AED figure is possible.
  const unknown = makeCard({ slug: "u", name: "U" });
  assert.equal(conversionForCard(unknown).basis, "unrankable");
});
