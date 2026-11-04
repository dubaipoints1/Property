import { test } from "node:test";
import assert from "node:assert/strict";
import { rankOffers, scoreOffer, type CalculatorInput, type SalaryTransferOffer } from "../../src/lib/salaryTransfer";

const input: CalculatorInput = { monthlySalary: 20_000, willingProducts: [], willStay12Months: true, shariaOnly: false, cashOnly: false };
const offer: SalaryTransferOffer = {
  id: "generic", bankSlug: "test", bankName: "Test", name: "Test offer",
  validFrom: "", validUntil: "", lastVerified: "", tenureMonths: 3, sharia: true,
  creditCardRequired: false, additionalProductsRequired: [], requirements: [], clawbackTerms: "",
  sourceUrl: "https://example.com/terms",
  salaryBands: [{ minSalary: 5_000, maxSalary: null, rewardAmount: 1_500, rewardType: "cash", monthsToPayout: 3 }],
};

test("DIB requires card, personal finance or auto finance and remains unranked until confirmed", () => {
  const dib = { ...offer, id: "dib-xtra-2026", bankSlug: "dib", creditCardRequired: true, sourceUrl: "https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf" };
  assert.equal(scoreOffer(dib, input).status, "disqualified");
  for (const product of ["credit_card", "loan", "auto_finance", "mortgage"] as const) {
    const result = scoreOffer(dib, { ...input, willingProducts: [product] });
    assert.equal(result.status, "conditional");
    assert.equal(result.cashEquivalentAED, 0);
  }
  assert.equal(scoreOffer({ ...dib, sourceUrl: "https://example.com/other" }, { ...input, willingProducts: ["loan"] }).status, "disqualified");
});

test("Emirates Islamic uses the account-only component, even when willing to take a card", () => {
  const ei = { ...offer, id: "emirates-islamic-2026-oct-2027-mar", bankSlug: "emirates-islamic",
    sourceUrl: "https://www.emiratesislamic.ae/en/terms-and-conditions/salary-transfer-offer-terms-and-conditions-oct-2026",
    salaryBands: [{ ...offer.salaryBands[0], components: [
      { label: "CASA salary cashback (non-UAE nationals)", amount: 1_000 },
      { label: "Covered Card spend reward", amount: 500, requires: "Verified qualifying spend within campaign window" },
    ] }],
  };
  for (const profile of [input, { ...input, willingProducts: ["credit_card" as const] }]) {
    const result = scoreOffer(ei, profile);
    assert.equal(result.status, "eligible");
    assert.equal(result.cashEquivalentAED, 1_000);
    assert.equal(result.breakdown.length, 1);
  }
  assert.equal(scoreOffer({ ...ei, salaryBands: offer.salaryBands }, input).status, "conditional");
});

test("card-required and unidentified points offers cannot become top estimates", () => {
  const card = { ...offer, id: "card", creditCardRequired: true };
  const points = { ...offer, id: "points", salaryBands: [{ ...offer.salaryBands[0], rewardType: "points" as const, rewardAmount: 100_000 }] };
  assert.equal(scoreOffer(card, input).status, "disqualified");
  assert.equal(scoreOffer(card, { ...input, willingProducts: ["credit_card"] }).status, "conditional");
  assert.equal(scoreOffer(points, input).status, "conditional");
  assert.equal(rankOffers([points, card, offer], input)[0].offer.id, "generic");
});
