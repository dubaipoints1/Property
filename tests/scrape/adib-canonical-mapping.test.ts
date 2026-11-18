import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CardDataSchema } from "../../src/lib/cardsData.ts";
import { loadAdibMappingSources, proposeAdibCanonicalMappings } from "../../scripts/scrape/propose-adib-primary.ts";
import { ADIB_PRODUCTS, parseAdibDetail, parseAdibKfs, parseAdibSchedule } from "../../scripts/scrape/_adib-primary.ts";
import { hasUsableGenericEarnRate } from "../../src/lib/cardEarnModel.ts";
import { hasUsableSalaryMinimum, cardHasUnresolvedTerms } from "../../src/lib/cardEligibility.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";

const sources = loadAdibMappingSources();
const packet = proposeAdibCanonicalMappings(sources, "2026-11-07");
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
    // 18 November source repair: replay only the named Smiles edits over
    // the historical candidate. Keep the parser's output unapproved and
    // assert exact equality of every other bit of the canonical record.
    if (p.slug === "adib-smiles-visa-classic" || p.slug === "adib-smiles-visa-signature") {
      const detailSource = sources.find(s => s.url === expected.applyUrl && s.representation === "http-decoded-readable-text");
      assert.ok(detailSource, p.slug);
      const detail = parseAdibDetail(detailSource, p.slug);
      assert.ok(detail && detail.minSalary !== null && detail.salaryState === "source-stated", p.slug);
      assert.equal(detail.minSalary, expected.eligibility.minSalary, p.slug);
      const salaryEvidence = expected._fieldEvidence.eligibility;
      assert.ok(Array.isArray(salaryEvidence) && salaryEvidence.length === 1, p.slug);
      expected.eligibility.minSalary = null;
      expected.eligibility.publishedMinMonthlyIncome = detail.minSalary;
      expected.eligibility.publishedIncomeBasis = "salary";
      expected._fieldEvidence["eligibility.publishedMinMonthlyIncome"] = salaryEvidence;
      delete expected._fieldEvidence.eligibility;
      expected._provenance["eligibility.publishedMinMonthlyIncome"] = "editor-confirmed";
    }
    if (p.slug === "adib-smiles-visa-classic") {
      const tariffSource = sources.find(s => s.id === "adib-soc");
      const kfsSource = sources.find(s => s.id === "adib-kfs");
      assert.ok(tariffSource && kfsSource);
      const { socIndex, kfsIndex } = ADIB_PRODUCTS[p.slug];
      const tariff = parseAdibSchedule(tariffSource), kfs = parseAdibKfs(kfsSource);
      assert.equal(tariff?.feeCells[socIndex]?.raw, "Free");
      assert.equal(kfs?.feeCells[kfsIndex]?.value, 0);
      assert.deepEqual(expected.annualFee, { amount: 0, currency: "AED" });
      expected._provenance.annualFee = "editor-confirmed";
      delete expected._dataIssues.eligibility;
      expected._dataIssues["eligibility.publishedMinMonthlyIncome"] = "The issuer publishes a salary threshold. Full salary-transfer, residency and employment conditions are not confirmed.";
      expected._dataIssues.fxFee = "See the two issuer service-fee rows below. They do not establish a single comparable FX cost.";
      expected._dataIssues.annualFee = "The issuer confirms no standard primary-card annual fee. That is not a total-cost figure; check joining charges and profit charges separately.";
      expected._dataIssues._features = "The card review separates the two funding-specific sign-up awards. No universal welcome amount or cash value is assigned, and other perks are not confirmed here.";
    }
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
