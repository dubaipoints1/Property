import { test } from "node:test";
import assert from "node:assert/strict";
import { rankOffers, scoreOffer, type CalculatorInput, type SalaryTransferOffer } from "../../src/lib/salaryTransfer";
import { compareSalaryOffersByReward, salaryOfferComparisonNote, salaryOfferSourceNote } from "../../src/lib/salaryTransferRules";

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

const postAugust = "https://www.mashreq.com/-/jssmedia/pdfs/neo/accounts-deposits/TnCs/2026/neo-salary-bonus-tnc-en-ar.ashx";

test("restricted relationships and unpinned Mashreq terms require confirmation before pricing", () => {
  for (const [id, bankSlug, sourceUrl, reason] of [
    ["standard-chartered-priority-2026-nov-2027-jan", "standard-chartered",
      "https://av.sc.com/ae/content/docs/sc-ae-wsdepositscampaign.pdf", /relationship/],
    ["mashreq-2026", "mashreq",
      "https://www.mashreq.com/en/uae/neo/accounts/current-accounts/salary-transfer/", /source has changed/],
    ["hsbc-premier-existing-2026", "hsbc",
      "https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/premier-existing-to-bank-customers-salary-transfer-offer-tscs.pdf", /Existing HSBC UAE Premier/],
  ] as const) {
    const result = scoreOffer({ ...offer, id, bankSlug, sourceUrl }, input);
    assert.equal(result.status, "conditional");
    assert.equal(result.cashEquivalentAED, 0);
    assert.ok(result.reasons.some((text) => reason.test(text)));
  }
});

test("only the pinned Mashreq joining bonus is ranked; the early-bird headline is labelled", () => {
  const balloted = { ...offer.salaryBands[0], rewardAmount: 1800, components: [
    { amount: 1000, label: "Joining bonus" },
    { amount: 800, label: "Early-bird cashback", requires: "First salary within 90 days" },
  ] };
  const mashreq = { ...offer, id: "mashreq-2026", bankSlug: "mashreq", sourceUrl: postAugust, salaryBands: [balloted] };
  assert.equal(salaryOfferSourceNote(mashreq), undefined);
  assert.equal(scoreOffer(mashreq, input).cashEquivalentAED, 1000);
  const shortStay = scoreOffer(mashreq, { ...input, willStay12Months: false });
  assert.equal(shortStay.status, "conditional");
  assert.equal(shortStay.cashEquivalentAED, 0);
  assert.match(shortStay.reasons.join(" "), /12 instalments/);
  assert.match(salaryOfferComparisonNote(mashreq, balloted) ?? "", /early-bird/);
  assert.deepEqual([{ offer: mashreq, reward: balloted }, { offer, reward: { rewardAmount: 1300 } }]
    .sort(compareSalaryOffersByReward).map((x) => x.offer.id), [offer.id, mashreq.id]);
});

test("RAKBANK's restricted payroll tier shows its condition and cannot get a calculator estimate", () => {
  const band = { minSalary: 5000, maxSalary: 9999, rewardAmount: 500, rewardType: "cash" as const, monthsToPayout: null, components: [
    { amount: 500, label: "Restricted payroll tier", requires: "RAKempower Payroll or RAKmore enrolment" },
  ] };
  const rak = { ...offer, id: "rakbank-nov-2026", bankSlug: "rakbank", salaryBands: [band],
    sourceUrl: "https://www.rakbank.ae/globalassets/rakbank/all-pdfs/001---campaign/salary-transfer-cash-reward-promotion-terms-and-conditions-nov-2026.pdf" };
  const result = scoreOffer(rak, { ...input, monthlySalary: 7500 });
  assert.equal(result.status, "conditional");
  assert.equal(result.cashEquivalentAED, 0);
  assert.match(salaryOfferComparisonNote(rak, band) ?? "", /RAKempower Payroll or RAKmore/);
  assert.deepEqual([{ offer: rak, reward: band }, { offer, reward: { rewardAmount: 350 } }]
    .sort(compareSalaryOffersByReward).map((x) => x.offer.id), [offer.id, rak.id]);
});

test("value sort does not promote ads with source conflicts or a changed source identity", () => {
  const confirmed = { offer, reward: { rewardAmount: 100 } };
  const larger = { offer: { ...offer, id: "generic-two" }, reward: { rewardAmount: 500 } };
  const mashreq = { offer: { ...offer, id: "mashreq-2026", bankSlug: "mashreq",
    sourceUrl: "https://www.mashreq.com/en/uae/neo/accounts/current-accounts/salary-transfer/" },
    reward: { rewardAmount: 20_000 } };
  assert.match(salaryOfferSourceNote(mashreq.offer) ?? "", /source changed/);
  const changed = { ...mashreq, offer: { ...mashreq.offer, sourceUrl: "https://example.com/changed" }, reward: { rewardAmount: 40_000 } };
  assert.match(salaryOfferSourceNote(changed.offer) ?? "", /source changed/i);
  assert.deepEqual([mashreq, changed, confirmed, larger].sort(compareSalaryOffersByReward),
    [larger, confirmed, mashreq, changed]);
});

test("FAB campaign examples neither rank above cash terms nor imply retrospective clawback", () => {
  const fab = { ...offer, id: "fab-20-percent-2026", bankSlug: "fab", tenureMonths: 12,
    sourceUrl: "https://www.bankfab.com/-/media/fab-uds/personal/promotions/2026/20-percent-cashback-on-salary-transfers/terms-and-conditions-en.pdf" };
  const result = scoreOffer(fab, { ...input, willStay12Months: false });
  assert.equal(result.status, "conditional");
  assert.equal(result.cashEquivalentAED, 0);
  assert.ok(result.reasons.some(reason => /forfeits unpaid cashback/.test(reason)));
  assert.ok(result.reasons.every(reason => !/Clawback risk/.test(reason)));
  assert.deepEqual([
    { offer: fab, reward: { rewardAmount: 9_000 } },
    { offer, reward: { rewardAmount: 500 } },
  ].sort(compareSalaryOffersByReward).map(row => row.offer.id), ["generic", fab.id]);
});
