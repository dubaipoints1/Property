import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  AED_PER_USD,
  earnsAED,
  nativeEarned,
  parseEarnBasis,
} from "../../src/lib/earnBasis.ts";
import { getAllCards } from "../../src/lib/cardsData.ts";

/**
 * `earnRates` is a bare number and `earnUnit` is prose, so nothing in L2
 * states whether `1.5` means 1.5 percent, 1.5 points per AED 1, 1.5 miles
 * per AED 10, or 1.5 miles per USD 1. The rewards calculator multiplied
 * spend by the rate for all four alike until 10 September 2026, which is
 * how /calculator/ came to tell readers the RAKBANK World card paid
 * "48,300 % cashback ≈ AED 48,300" a month on AED 7,800 of spend.
 */

test("reads the denominator out of the published earn-unit wording", () => {
  assert.deepEqual(parseEarnBasis("% cashback"), { kind: "percent" });
  assert.deepEqual(parseEarnBasis("% as ENBD Plus Points (subject to per-statement cap)"), {
    kind: "percent",
  });
  assert.deepEqual(parseEarnBasis("% value back as Darna Points (10 pts = AED 1)"), {
    kind: "percent",
  });
  assert.deepEqual(parseEarnBasis("FAB Rewards per AED 1 spent"), {
    kind: "perAED",
    perAED: 1,
  });
  assert.deepEqual(parseEarnBasis("Etihad Guest Miles per AED 10 spent"), {
    kind: "perAED",
    perAED: 10,
  });
  assert.deepEqual(parseEarnBasis("Emirates NBD Plus Points per AED 200 spent"), {
    kind: "perAED",
    perAED: 200,
  });
  assert.deepEqual(
    parseEarnBasis("Skywards Miles per USD 1 spent (EU/UK at 50%)"),
    { kind: "perUSD" },
  );
});

test("returns null rather than defaulting when no denominator is stated", () => {
  assert.equal(parseEarnBasis(undefined), null);
  assert.equal(parseEarnBasis(""), null);
  assert.equal(parseEarnBasis("   "), null);
  // A multiplier on some other rate is not a rate per unit of spend.
  assert.equal(parseEarnBasis("RED Points (multiplier on base earn rate)"), null);
  // Merchant-specific cashback with no per-spend rate to apply.
  assert.equal(parseEarnBasis("AED cashback at selected merchants"), null);
});

test("per USD is matched before the AED forms", () => {
  // A string carrying both must resolve as USD, not silently as per-AED.
  assert.deepEqual(
    parseEarnBasis("Miles per USD 1 spent, min AED 100 per transaction"),
    { kind: "perUSD" },
  );
});

test("converts spend through each denominator", () => {
  const spend = 10_000;
  assert.equal(nativeEarned(spend, 1.5, { kind: "percent" }), 150);
  assert.equal(nativeEarned(spend, 2, { kind: "perAED", perAED: 1 }), 20_000);
  assert.equal(nativeEarned(spend, 10, { kind: "perAED", perAED: 10 }), 10_000);
  assert.equal(
    Math.round(nativeEarned(spend, 2, { kind: "perUSD" })),
    Math.round((spend / AED_PER_USD) * 2),
  );
});

test("the dirham peg is the published one", () => {
  assert.equal(AED_PER_USD, 3.6725);
});

test("only percentage cards that pay dirhams count as cashback", () => {
  assert.equal(earnsAED("% cashback", { kind: "percent" }), true);
  assert.equal(earnsAED("% back as noon credits (cap AED 2,000/month)", { kind: "percent" }), true);
  assert.equal(earnsAED("% as ENBD Plus Points", { kind: "percent" }), false);
  assert.equal(earnsAED("% value back as Darna Points (10 pts = AED 1)", { kind: "percent" }), false);
  // A per-unit card never pays dirhams directly, whatever the wording.
  assert.equal(earnsAED("AED cashback per AED 1 spent", { kind: "perAED", perAED: 1 }), false);
});

test("every card in cards.json either parses or is a known exclusion", () => {
  // The point of this assertion: a new card whose earn-unit wording is
  // unfamiliar fails here rather than quietly earning a wrong AED figure.
  const KNOWN_UNRANKABLE = new Set([
    // Cashback is merchant-specific and earnRates.everythingElse is 0, so
    // there is no per-spend rate to apply.
    "cbd-one",
    // RED Points multiply another card's earn rate; not a rate on spend.
    "emirates-nbd-manchester-united",
  ]);

  const unparsed: string[] = [];
  for (const card of getAllCards()) {
    if (parseEarnBasis(card.earnUnit) === null) unparsed.push(card.slug);
  }
  assert.deepEqual(
    unparsed.sort(),
    [...KNOWN_UNRANKABLE].sort(),
    "a card's earnUnit no longer states a denominator the parser recognises",
  );
});
