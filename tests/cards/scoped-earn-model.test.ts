import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCardData, ScopedEarnRateSchema, earnRatesNumeric } from "../../src/lib/cardsData.ts";
import { formatScopedEarnRate, hasUsableGenericEarnRate } from "../../src/lib/cardEarnModel.ts";
import { cardValueTerms, calculateCardValue } from "../../src/lib/cardValue.ts";
import { topEarnEntry, earnRateFieldPending } from "../../src/lib/cardsDataFormat.ts";
import { cardDifference, identicalKnownSections } from "../../src/lib/cardDifference.ts";
import { cardHasUnresolvedTerms } from "../../src/lib/cardEligibility.ts";
import { rankCards, bestCardPerCategory } from "../../src/components/islands/RewardsCalculator.tsx";
const base = getCardData("citi-cashback")!;
const row = { key: "named-merchant", label: "Named merchant only", value: 2,
  unit: "Example Points", denominator: { amount: 100, currency: "AED" as const }, scope: "Synthetic test row; not a universal base rate", bound: "exact" as const };
const partial = { ...base, slug: "synthetic-scoped-profile", earnRates: { everythingElse: null }, scopedEarnRates: [row] };
const spend = { dining: 100, groceries: 0, fuel: 0, travel: 0, online: 0, utilities: 0, entertainment: 0 };
test("scoped reward rows require explicit native denominator, unit, scope and bound", () => {
  assert.equal(ScopedEarnRateSchema.safeParse(row).success, true);
  for (const changed of [{ ...row, value: null }, { ...row, value: NaN }, { ...row, denominator: null }, { ...row, scope: "" }, { ...row, bound: "guaranteed" }])
    assert.equal(ScopedEarnRateSchema.safeParse(changed).success, false);
  assert.equal(formatScopedEarnRate(row), "2 Example Points per AED 100");
  assert.equal(formatScopedEarnRate({ ...row, bound: "upper" }), "Up to 2 Example Points per AED 100");
  const percent = { ...row, unit: "percent value back in Example Points", denominator: null };
  assert.equal(ScopedEarnRateSchema.safeParse(percent).success, true);
  assert.equal(formatScopedEarnRate(percent), "2% value back in Example Points");
});
test("null base and scoped rows are never auto-ranked, top-rated, totalled or treated as equal known rates", () => {
  assert.equal(hasUsableGenericEarnRate(partial), false);
  assert.equal(cardHasUnresolvedTerms(partial), true);
  assert.deepEqual(earnRatesNumeric(partial.earnRates), {});
  assert.equal(topEarnEntry(partial.earnRates), null);
  const terms = cardValueTerms(partial, partial.slug);
  assert.equal(terms.rate, null); assert.equal(calculateCardValue(terms, 100).rewards, null);
  assert.deepEqual(rankCards([partial], spend, { netOfFee: false }), []);
  assert.deepEqual(bestCardPerCategory([partial], spend), []);
  const diff = cardDifference(partial);
  assert.equal(diff.rates.known, false); assert.equal(identicalKnownSections([diff, diff]).includes("rates"), false);
  // Even a real published zero remains usable in a synthetic fully-modelled
  // test card; null is not substituted by that genuine zero.
  assert.equal(hasUsableGenericEarnRate({ ...base, slug: "synthetic-zero", earnRates: { everythingElse: 0 } }), true);
});
test("legacy broad calculators also exclude 365 until merchant/channel exceptions are modelled", () => {
  const card = { ...getCardData("adcb-365-cashback")!, slug: "adcb-365-cashback" };
  assert.deepEqual(rankCards([card], spend, { netOfFee: false }), []);
  assert.deepEqual(bestCardPerCategory([card], spend), []);
});
test("shared rate renderers retain display-only row scope and never convert an EEA row to Europe/UK", () => {
  const source = readFileSync("src/components/cards/EarnRateTable.astro", "utf8");
  for (const marker of ["formatScopedEarnRate(row)", "row.scope", "row.bound", "display-only"])
    assert.ok((source + readFileSync("src/lib/cardsData.ts", "utf8")).includes(marker), marker);
  for (const file of ["src/components/cards/SpecCard.astro", "src/components/cards/FinderCard.astro", "src/pages/cards/compare.astro"])
    assert.match(readFileSync(file, "utf8"), /scopedEarnRates=\{card\.scopedEarnRates\}/, file);
});
test("held earn-rate fields never become numeric headlines, including inline table consumers", () => {
  const rates = { dining: 5, travel: 3, everythingElse: 1 };
  assert.equal(topEarnEntry(rates, { "earnRates.dining": "needs-review" })?.key, "travel");
  for (const field of ["earnRates", "earnUnit"]) assert.equal(topEarnEntry(rates, { [field]: "needs-review" }), null);
  assert.equal(earnRateFieldPending({ "earnRates.everythingElse": "needs-review" }, "everythingElse"), true);
  assert.equal(earnRateFieldPending({ "earnRates.everythingElse": "needs-review" }, "dining"), false);
  const source = readFileSync("src/components/cards/EarnRateTable.astro", "utf8");
  assert.match(source, /earnRateFieldPending\(provenance, key\) \? null : v/);
  assert.match(source, /value === null \? "Pending"/);
  for (const file of ["src/components/cards/SpecCard.astro", "src/components/cards/FinderCard.astro", "src/pages/cards/compare.astro"])
    assert.match(readFileSync(file, "utf8"), /provenance=\{card\._provenance\}/, file);
  for (const file of ["src/components/cards/AtAGlance.astro", "src/components/cards/SpecCard.astro", "src/pages/cards/compare.astro"])
    assert.match(readFileSync(file, "utf8"), /topEarnEntry\(card\.earnRates as Record<string, unknown>, card\._provenance\)/, file);
});
