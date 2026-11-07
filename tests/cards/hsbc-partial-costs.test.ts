import { test } from "node:test";
import assert from "node:assert/strict";
import { getCardData } from "../../src/lib/cardsData.ts";
import { cardValueTerms, calculateCardValue } from "../../src/lib/cardValue.ts";
import { applyHsbcOmittedCostHolds } from "../../scripts/scrape/propose-primary-cards.ts";
test("new HSBC partial profiles do not turn omitted joining/waiver terms into first-year totals", () => {
  for (const slug of ["hsbc-cash-plus", "hsbc-skywards-infinite", "hsbc-skywards-signature"]) {
    const card = getCardData(slug)!;
    assert.equal(card.joiningFee, undefined);
    assert.equal(card._provenance.joiningFee, "needs-review");
    assert.equal(card._provenance.partnerBrands, "needs-review");
    assert.equal(card.partnerBrands, undefined);
    const terms = cardValueTerms(card, slug);
    assert.equal(terms.firstFee, null, slug);
    assert.equal(calculateCardValue(terms, 100).first, null, slug);
    assert.match(card._dataIssues?.annualFee ?? "", /no first-year total is estimated/i);
    const proposed = applyHsbcOmittedCostHolds(slug, card);
    assert.deepEqual(proposed._features, card._features);
    assert.deepEqual(proposed.annualFeeWaiver, card.annualFeeWaiver);
    assert.equal(proposed.lastVerified.getTime(), card.lastVerified.getTime());
  }
  const cash = getCardData("hsbc-cash-plus")!;
  assert.equal(cash._provenance.annualFeeWaiver, "editor-confirmed");
  assert.equal(typeof cash.annualFeeWaiver === "object" && cash.annualFeeWaiver !== null && "year_one_waived" in cash.annualFeeWaiver && cash.annualFeeWaiver.year_one_waived, true);
  for (const slug of ["hsbc-skywards-infinite", "hsbc-skywards-signature"])
    assert.equal(getCardData(slug)!._provenance.annualFeeWaiver, "needs-review");
});
test("a pending waiver alone also suppresses a first-year fee estimate without erasing known standard renewal", () => {
  const base = getCardData("citi-cashback")!;
  const terms = cardValueTerms({ ...base, joiningFee: { amount: 0, currency: "AED" }, _provenance: { ...base._provenance, annualFeeWaiver: "needs-review" } }, "synthetic-waiver-hold");
  assert.equal(terms.firstFee, null); assert.notEqual(terms.laterFee, null);
});
