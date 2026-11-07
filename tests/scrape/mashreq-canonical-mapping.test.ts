import { test } from "node:test";
import assert from "node:assert/strict";
import { CardDataSchema } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum, cardHasUnresolvedTerms } from "../../src/lib/cardEligibility.ts";
import { hasUsableGenericEarnRate } from "../../src/lib/cardEarnModel.ts";
import { cardValueTerms, calculateCardValue } from "../../src/lib/cardValue.ts";
import { exactFxForStatistics } from "../../src/lib/feeIndex.ts";
import { cardFxFeeLabel } from "../../src/lib/cardFeeFacts.ts";
import { parseMashreqCanonicalCandidates, loadMashreqMappingSources } from "../../scripts/scrape/propose-mashreq-primary.ts";
const packet = parseMashreqCanonicalCandidates(loadMashreqMappingSources(), "2026-11-07");
test("Mashreq five candidate mappings preserve exact source observations, unlike units and pending qualifiers", () => {
  assert.equal(packet.proposals.length, 5);
  for (const p of packet.proposals) {
    const card = CardDataSchema.parse(p.record);
    assert.equal(card.earnRates.everythingElse, null, p.slug);
    assert.equal(card.eligibility.salaryTransferRequired, null, p.slug);
    assert.equal(card.eligibility.residencyRequired, null, p.slug);
    assert.deepEqual(card.eligibility.employmentTypes, [], p.slug);
    assert.equal(hasUsableSalaryMinimum(card), false, p.slug);
    assert.equal(hasUsableGenericEarnRate(card), false, p.slug);
    assert.equal(cardHasUnresolvedTerms(card), true, p.slug);
    const terms = cardValueTerms(card, p.slug);
    assert.equal(terms.rate, null); assert.equal(calculateCardValue(terms, 100).rewards, null);
    assert.equal(exactFxForStatistics(card), null, p.slug);
    assert.match(cardFxFeeLabel(card), /issuer FX charges/);
    assert.match(cardFxFeeLabel(card), /scheme charges may also apply/);
    assert.match(cardFxFeeLabel(card), /VAT not applicable/);
    for (const row of card.scopedEarnRates ?? []) {
      const key = row.key === "everythingelse" ? "everythingElse" : row.key === "realestate" ? "realEstate" : row.key;
      const observed = p.sourceCore.observations.find(o => o.field === `earnRates.${key}`);
      assert.ok(observed); assert.equal(row.value, observed.value, `${p.slug}.${row.key}`);
      if (p.slug.startsWith("mashreq-aura")) {
        assert.equal(row.denominator, null); assert.match(row.unit, /value back paid as Aura Points/);
        assert.match(row.scope, /assigned credit-card limit/); assert.match(row.scope, /not earned on bill payments/);
      } else {
        assert.deepEqual(row.denominator, p.sourceCore.spendDenominator);
        assert.equal(row.unit, "Mashreq Vantage points");
      }
    }
    assert.equal(card._provenance.network, "editor-confirmed");
    for (const f of ["joiningFee", "annualFeeWaiver", "interestRate", "welcomeBonus", "_features"])
      assert.equal(card._provenance[f], "needs-review");
  }
});
