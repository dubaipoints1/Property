import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CardDataSchema } from "../../src/lib/cardsData.ts";
import { loadAdibMappingSources, proposeAdibCanonicalMappings } from "../../scripts/scrape/propose-adib-primary.ts";
import { hasUsableGenericEarnRate } from "../../src/lib/cardEarnModel.ts";
import { hasUsableSalaryMinimum, cardHasUnresolvedTerms } from "../../src/lib/cardEligibility.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";

const packet = proposeAdibCanonicalMappings(loadAdibMappingSources(), "2026-11-07");
test("accepted ADIB local records exactly reproduce the reviewed deterministic mapping", () => {
  const cards = JSON.parse(readFileSync("src/data/cards.json", "utf8"));
  for (const p of packet.proposals) {
    // Approved reader-facing clarifications do not alter typed facts,
    // parser evidence, source hashes or any other mapping field.
    const expected = structuredClone(p.record);
    expected._dataIssues!.earnRates = expected._dataIssues!.earnRates.replace(
      "FX cost remains untyped in this packet; issuer service fees, VAT and scheme/international components are not silently flattened into one fee.",
      "The full foreign-currency cost has not been confirmed. Check issuer charges, VAT and any scheme charges separately.")
      .replace("Do not silently promote that named-merchant row into an all-domestic base rate.",
        "The named-merchant row does not establish a rate for all domestic spending.");
    expected._dataIssues!._features = "This source review covers identity, standard annual fee and scoped rewards. Perks and welcome incentives have not been verified in this review or assigned a cash value.";
    assert.deepEqual(cards[p.slug], expected, p.slug);
  }
  for (const p of packet.holds.filter(p => p.slug !== "adib-cashback-visa")) assert.equal(cards[p.slug], undefined, p.slug);
});
test("ADIB reviewed mapping yields fourteen valid partial profiles, not three held identities", () => {
  assert.equal(packet.proposals.length, 14);
  assert.equal(packet.holds.length, 3);
  assert.equal(new Set(packet.proposals.map(p => p.slug)).size, 14);
  for (const p of packet.proposals) {
    const card = CardDataSchema.parse(p.record);
    assert.equal(card.earnRates.everythingElse, null, p.slug);
    assert.equal(card.fxFee, null, p.slug);
    assert.equal(card.eligibility.salaryTransferRequired, null, p.slug);
    assert.equal(card.eligibility.residencyRequired, null, p.slug);
    assert.deepEqual(card.eligibility.employmentTypes, [], p.slug);
    assert.equal(hasUsableGenericEarnRate(card), false, p.slug);
    assert.equal(hasUsableSalaryMinimum(card), false, p.slug);
    assert.equal(cardHasUnresolvedTerms(card), true, p.slug);
    assert.equal(cardValueTerms(card, p.slug).rate, null, p.slug);
    for (const field of ["joiningFee", "annualFeeWaiver", "interestRate", "welcomeBonus", "_features", "partnerBrands"])
      assert.equal(card._provenance?.[field], "needs-review", `${p.slug} ${field}`);
    assert.equal(card.joiningFee, undefined);
    assert.equal(card.annualFeeWaiver, undefined);
    assert.equal(card.interestRate, undefined);
    assert.match(card._dataIssues?.annualFee ?? "", /no first-year or total annual cost is estimated/);
    for (const row of card.scopedEarnRates ?? []) {
      assert.ok(card._fieldEvidence?.[`scopedEarnRates.${row.key}`]?.length);
      assert.ok(row.scope.length);
    }
  }
});
test("ADIB contractual geography and Marriott outlet restrictions survive canonical mapping", () => {
  for (const p of packet.proposals) {
    const card = CardDataSchema.parse(p.record);
    for (const row of card.scopedEarnRates ?? []) {
      if (["international-excluding-eea", "eea"].includes(row.key) && !/adib-(?:marriott|share)-/.test(p.slug)) {
        assert.match(row.label, /Non-AED qualifying spend outside the UAE/);
        assert.match(row.scope, /Only non-AED Qualifying Expenditure outside the UAE/);
      }
      if (row.key === "marriott-direct") {
        assert.match(row.scope, /Participating Hotels/);
        assert.match(row.scope, /wholly owned or managed by Marriott International/);
        assert.match(row.scope, /online stores \(including Marriott-branded gift cards\)/);
      }
      if (row.key === "aldar-education-properties") assert.match(row.scope, /not all UAE spending/);
    }
    if (/adib-aldar-/.test(p.slug)) assert.match(card._dataIssues?.earnRates ?? "", /Participating Aldar Ecosystem/);
    assert.match(card._dataIssues?.earnRates ?? "", /not a universal earn rate or guaranteed total return/);
  }
});
