import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  PLACEHOLDER_AED_PER_UNIT,
  conversionForCard,
  rankCards,
  type CardForCalc,
  type SpendProfile,
} from "../../src/components/islands/RewardsCalculator.tsx";
import { getActiveCards } from "../../src/lib/cardsData.ts";
import {
  VALUATION_SLUG_BY_LOYALTY_PROGRAM,
  dpValueFils,
  publishedAEDPerUnit,
} from "../../src/lib/valuations.ts";
import { AED_PER_USD } from "../../src/lib/earnBasis.ts";

/**
 * /calculator/ used to price a mile at 4 fils against the 2.0 published on
 * /valuations/, and hotel points at 0.8 against Bonvoy's 2.5, while linking
 * the methodology page as though the numbers came from it. Chairman ruling 2
 * of 12 June 2026 says card arithmetic uses the published baselines. These
 * tests hold the two surfaces to the same figure.
 */

const cards = (): CardForCalc[] =>
  getActiveCards().map((c) => ({ ...c, slug: c.slug })) as CardForCalc[];

const SPEND: SpendProfile = {
  dining: 1500,
  groceries: 2000,
  fuel: 800,
  travel: 1000,
  online: 1500,
  utilities: 600,
  entertainment: 400,
};

test("a published currency is priced at exactly the /valuations/ figure", () => {
  for (const [programme, slug] of Object.entries(VALUATION_SLUG_BY_LOYALTY_PROGRAM)) {
    const fils = dpValueFils(slug);
    assert.notEqual(fils, null, `${programme} maps to ${slug}, which publishes no dpValue`);
    assert.equal(publishedAEDPerUnit(programme), (fils as number) / 100);
  }
});

test("Skywards and Etihad Guest are 2 fils, Bonvoy 2.5 — not the old 4 and 0.8", () => {
  assert.equal(publishedAEDPerUnit("Emirates Skywards"), 0.02);
  assert.equal(publishedAEDPerUnit("Etihad Guest"), 0.02);
  assert.equal(publishedAEDPerUnit("Marriott Bonvoy"), 0.025);
});

test("Voyager Miles is not valued as if it were Skywards", () => {
  // The old regex matched the word "miles" and priced Voyager at the miles
  // rate. Voyager has no published baseline, so it must fall to the
  // placeholder and be labelled.
  assert.equal(publishedAEDPerUnit("Voyager Miles"), null);
  const voyager = cards().find((c) => c.loyaltyProgram === "Voyager Miles");
  assert.ok(voyager, "expected a Voyager Miles card in the active set");
  const conv = conversionForCard(voyager);
  assert.equal(conv.basis, "placeholder");
  assert.equal(conv.aedPerUnit, PLACEHOLDER_AED_PER_UNIT);
});

test("every mapped programme still matches a card, and every card resolves", () => {
  const programmes = new Set(cards().map((c) => c.loyaltyProgram).filter(Boolean));
  for (const programme of Object.keys(VALUATION_SLUG_BY_LOYALTY_PROGRAM)) {
    assert.ok(
      programmes.has(programme),
      `${programme} is mapped to a valuation but no active card carries it`,
    );
  }
  for (const card of cards()) {
    const basis = conversionForCard(card).basis;
    assert.ok(
      ["cashback", "published", "placeholder", "unrankable"].includes(basis),
      `${card.slug} resolved to an unexpected basis`,
    );
  }
});

test("no card returns more than its total spend — the 100x class of bug", () => {
  const total = Object.values(SPEND).reduce((a, b) => a + b, 0);
  const ranked = rankCards(cards(), SPEND, { netOfFee: false, now: new Date("2026-09-10") });
  for (const r of ranked) {
    assert.ok(
      r.monthlyRewardAED >= 0 && r.monthlyRewardAED < total,
      `${r.card.slug} returns AED ${Math.round(r.monthlyRewardAED)} on AED ${total} of spend`,
    );
  }
  // A cashback card's return should read as a sane percentage, not hundreds.
  const best = ranked[0];
  assert.ok(
    best.monthlyRewardAED / total < 0.15,
    `top card returns ${((best.monthlyRewardAED / total) * 100).toFixed(0)}% of spend`,
  );
});

test("a Skywards card's AED figure is its miles times the published 2 fils", () => {
  const card = cards().find((c) => c.slug === "emirates-nbd-skywards-infinite");
  assert.ok(card, "expected emirates-nbd-skywards-infinite in the active set");
  const ranked = rankCards([card], SPEND, { netOfFee: false, now: new Date("2026-09-10") });
  const r = ranked[0];

  // Recomputed here from the card's own rates, per USD, independently of the
  // module under test.
  const rates = card.earnRates as unknown as Record<string, number | undefined>;
  const base = card.earnRates.everythingElse;
  const usd = (aed: number) => aed / AED_PER_USD;
  const expectedMiles =
    usd(SPEND.dining) * (rates.dining ?? base) +
    usd(SPEND.groceries) * (rates.groceries ?? base) +
    usd(SPEND.fuel) * (rates.fuel ?? base) +
    usd(SPEND.travel) * (rates.travel ?? base) +
    usd(SPEND.online) * (rates.online ?? base) +
    usd(SPEND.utilities) * (rates.utilities ?? base) +
    usd(SPEND.entertainment) * (rates.entertainment ?? base);

  assert.equal(r.rateBasis, "published");
  assert.equal(r.aedPerUnit, 0.02);
  assert.ok(Math.abs(r.monthlyRewardNative - expectedMiles) < 0.5);
  assert.ok(Math.abs(r.monthlyRewardAED - expectedMiles * 0.02) < 0.01);
});

test("a card's own utilities rate is used, not its base rate", () => {
  // Twelve cards publish a utilities rate and ten of them set it below base
  // precisely because utility spend earns less. The calculator pinned that
  // category to base and over-credited them.
  const card = cards().find((c) => c.slug === "emirates-nbd-marriott-bonvoy-world-elite");
  assert.ok(card, "expected the Bonvoy World Elite card in the active set");
  const utilities = (card.earnRates as unknown as Record<string, number>).utilities;
  assert.ok(utilities != null && utilities < card.earnRates.everythingElse);

  const onlyUtilities: SpendProfile = {
    dining: 0, groceries: 0, fuel: 0, travel: 0, online: 0, utilities: 1000, entertainment: 0,
  };
  const r = rankCards([card], onlyUtilities, { netOfFee: false, now: new Date("2026-09-10") })[0];
  const expected = (1000 / AED_PER_USD) * utilities;
  assert.ok(
    Math.abs(r.monthlyRewardNative - expected) < 0.5,
    `expected ${expected.toFixed(1)} points at the utilities rate, got ${r.monthlyRewardNative.toFixed(1)}`,
  );
});

test("a card with no stated denominator is left out of the ranking", () => {
  const ranked = rankCards(cards(), SPEND, { netOfFee: false, now: new Date("2026-09-10") });
  const ranking = new Set(ranked.map((r) => r.card.slug));
  assert.ok(!ranking.has("cbd-one"), "cbd-one has no per-spend rate and must not be ranked");
  assert.ok(ranked.every((r) => r.rateBasis !== "unrankable"));
});
