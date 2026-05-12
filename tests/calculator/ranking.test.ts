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
  AED_PER_UNIT,
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

test("AED conversion respects earnUnit — 1x cashback beats 5x miles", () => {
  // 5x Miles at 0.04 AED/mile = 0.20 AED per AED spent.
  const milesCard = makeCard({
    slug: "miles-card",
    name: "Skywards 5x Card",
    loyaltyProgram: "Emirates Skywards",
    earnUnit: "Skywards Miles per AED 1 spent",
    dining: 5,
    everythingElse: 5,
  });
  // 1x AED cashback at 1.00 AED/AED cashback = 1.00 AED per AED spent.
  const cashbackCard = makeCard({
    slug: "cashback-card",
    name: "Plain Cashback Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "AED cashback per AED 1 spent",
    dining: 1,
    everythingElse: 1,
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
  // Sanity: confirm the underlying numbers match the published rates.
  assert.equal(ranked[0].aedPerUnit, AED_PER_UNIT.aed_cashback);
  assert.equal(ranked[1].aedPerUnit, AED_PER_UNIT.miles);
  assert.equal(ranked[0].monthlyRewardAED, 1000); // 1000 * 1 * 1.00
  assert.equal(ranked[1].monthlyRewardAED, 200);  // 1000 * 5 * 0.04
});

// ── Test 3: net-of-fee toggle re-ranks ───────────────────────────────────

test("Net-of-annual-fee toggle flips ranking when fee dominates", () => {
  // High earn, AED 3,000 annual fee → AED 250/month fee accrual.
  const premium = makeCard({
    slug: "premium-fee",
    name: "Premium Fee Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "AED cashback per AED 1 spent",
    annualFee: 3000,
    everythingElse: 0.03, // 3% on everything
  });
  // Lower earn, no fee.
  const freebie = makeCard({
    slug: "freebie",
    name: "No Fee Card",
    loyaltyProgram: "AED Cashback",
    earnUnit: "AED cashback per AED 1 spent",
    annualFee: 0,
    everythingElse: 0.02, // 2% on everything
  });

  // AED 5,000 of "utilities" spend flows through everythingElse.
  // Premium reward: 5000 * 0.03 = 150 AED. Net: 150 - 250 = -100 AED/mo.
  // Freebie reward: 5000 * 0.02 = 100 AED. Net: 100 - 0   =  100 AED/mo.
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
    earnUnit: "AED cashback per AED 1 spent",
  });
  assert.equal(conversionForCard(cashback).bucket, "aed_cashback");

  const skywards = makeCard({
    slug: "s",
    name: "S",
    loyaltyProgram: "Emirates Skywards",
    earnUnit: "Skywards Miles per AED 1 spent",
  });
  assert.equal(conversionForCard(skywards).bucket, "miles");

  const fabRewards = makeCard({
    slug: "f",
    name: "F",
    loyaltyProgram: "FAB Rewards",
    earnUnit: "FAB Rewards per AED 1 spent",
  });
  assert.equal(conversionForCard(fabRewards).bucket, "bank_points");

  const marriott = makeCard({
    slug: "m",
    name: "M",
    loyaltyProgram: "Marriott Bonvoy Points",
    earnUnit: "Marriott Bonvoy Points per AED 1 spent",
  });
  assert.equal(conversionForCard(marriott).bucket, "hotel_points");

  const unknown = makeCard({ slug: "u", name: "U" });
  assert.equal(conversionForCard(unknown).bucket, "unknown");
  assert.equal(conversionForCard(unknown).fallback, true);
});
