import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCardData, getCardsWithFeature } from "../../src/lib/cardsData.ts";
import { cardComparisonRows, cardFeatureNeedsReview, cardHasKnownFeature, loungeFeatureOf } from "../../src/lib/cardsDataFormat.ts";
const base = getCardData("citi-cashback")!;
const known = { ...base, _features: [{ type: "lounge_access", network: "Example access", scope: "unlimited" }], _provenance: { _features: "editor-confirmed" } };
test("pending parent, semantic lounge and indexed lounge evidence cannot become None or a comparison winner", () => {
  for (const field of ["_features", "_features.lounge_access", "_features.lounge_access.scope", "_features.0.scope"]) {
    const held = { ...known, _provenance: { ...known._provenance, [field]: "needs-review" } };
    assert.equal(cardFeatureNeedsReview(held, "lounge_access"), true, field);
    assert.equal(cardHasKnownFeature(held, "lounge_access"), false, field);
    assert.equal(loungeFeatureOf(held), null, field);
    const row = cardComparisonRows(held, known).find(r => r.key === "lounge")!;
    assert.equal(row.leftValue, "Pending"); assert.equal(row.winner, "none");
  }
  const partial = { ...known, _features: [], _provenance: { _features: "needs-review" } };
  assert.equal(cardComparisonRows(partial, known).find(r => r.key === "lounge")?.leftValue, "Pending");
});
test("known legacy absence remains None and an unrelated status hold does not erase a known lounge", () => {
  const empty = { ...known, _features: [] };
  assert.equal(cardComparisonRows(empty, known).find(r => r.key === "lounge")?.leftValue, "None");
  assert.equal(cardHasKnownFeature({ ...known, _provenance: { "_features.status_match": "needs-review" } }, "lounge_access"), true);
  assert.equal(cardFeatureNeedsReview({ ...empty, _provenance: { "_features.99.scope": "needs-review" } }, "lounge_access"), true);
});
test("actual feature catalogue, Finder flags and directory chips use the same pending guard", () => {
  for (const card of getCardsWithFeature("lounge_access")) assert.equal(cardHasKnownFeature(card, "lounge_access"), true);
  const finder = readFileSync("src/pages/cards/finder/index.astro", "utf8");
  assert.match(finder, /hasLounge: cardHasKnownFeature\(card, "lounge_access"\)/);
  assert.match(finder, /hasStatus: cardHasKnownFeature\(card, "status_match"\)/);
  assert.match(readFileSync("src/pages/cards/index.astro", "utf8"), /cardFeatureNeedsReview\(card\)\) return \["Benefits pending"\]/);
});
