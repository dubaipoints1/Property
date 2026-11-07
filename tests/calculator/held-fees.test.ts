import assert from "node:assert/strict";
import test from "node:test";
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import RewardsCalculator, { rankCards, type CardForCalc, type SpendProfile } from "../../src/components/islands/RewardsCalculator.tsx";
import { getCardData } from "../../src/lib/cardsData.ts";
import { publicCardFacts } from "../../src/lib/cardPublicFacts.ts";
import { cardFeeNeedsReview } from "../../src/lib/cardFeeProvenance.ts";
import { cardFeeAmountLabel } from "../../src/lib/cardFeeFacts.ts";
import { cardHasUnresolvedTerms } from "../../src/lib/cardEligibility.ts";
import { cardValueTerms, calculateCardValue } from "../../src/lib/cardValue.ts";

// Synthetic modelling inputs, not assertions about the source card's terms.
const fixture = (): CardForCalc => ({
  ...getCardData("citi-cashback")!, slug: "synthetic-fee-evidence", name: "Synthetic fee evidence",
  annualFee: { amount: 1200, currency: "AED" }, joiningFee: undefined, annualFeeWaiver: null,
  vatPolicy: "inclusive", earnRates: { everythingElse: 1 }, earnUnit: "% cashback", loyaltyProgram: "Cashback",
  scopedEarnRates: undefined, _dataIssues: {}, _provenance: {},
});
const spend: SpendProfile = { dining: 0, groceries: 10000, fuel: 0, travel: 0, online: 0, utilities: 0, entertainment: 0 };
const held = (field: string) => publicCardFacts({ ...fixture(), _provenance: { [field]: "needs-review" as const } });

test("all held annual-fee and VAT subtrees suppress public calculator cost, net ranking and break-even", () => {
  const knownFree = { ...fixture(), slug: "known-free", annualFee: { amount: 0, currency: "AED" as const } };
  for (const field of ["annualFee", "annualFee.amount", "annualFee.currency", "vatPolicy", "vatPolicy.treatment"]) {
    const card = held(field);
    assert.equal(cardFeeNeedsReview(card, "annualFee"), true, field);
    assert.equal(cardFeeAmountLabel(card), "Pending", field);
    const [gross] = rankCards([card], spend, { netOfFee: false });
    assert.equal(gross.monthlyRewardAED, 100, field);
    assert.equal(gross.annualFeeAED, null, field);
    assert.equal(gross.monthlyFeeAED, null, field);
    assert.equal(gross.netMonthlyAED, null, field);
    assert.equal(gross.breakEvenMonthlySpendAED, null, field);
    assert.equal(gross.feeNeverCovered, false, field);
    assert.deepEqual(rankCards([card, knownFree], spend, { netOfFee: true }).map(row => row.card.slug), ["known-free"], field);
    assert.equal(rankCards([knownFree], spend, { netOfFee: true })[0].monthlyFeeAED, 0);
  }
});

test("confirmed VAT-inclusive and exclusive fees retain exact gross-up and net/break-even maths", () => {
  const inclusive = rankCards([fixture()], spend, { netOfFee: true })[0];
  assert.equal(inclusive.annualFeeAED, 1200); assert.equal(inclusive.monthlyFeeAED, 100);
  assert.equal(inclusive.netMonthlyAED, 0); assert.equal(inclusive.breakEvenMonthlySpendAED, 10000);
  const exclusive = rankCards([{ ...fixture(), vatPolicy: "exclusive" }], spend, { netOfFee: true })[0];
  assert.equal(exclusive.annualFeeAED, 1260); assert.equal(exclusive.monthlyFeeAED, 105);
  assert.equal(exclusive.netMonthlyAED, -5); assert.equal(exclusive.breakEvenMonthlySpendAED, 10500);
  const terms = cardValueTerms({ ...fixture(), vatPolicy: "exclusive" }, "synthetic-fee-evidence");
  assert.equal(terms.firstFee, 1260); assert.equal(terms.laterFee, 1260);
  assert.equal(cardFeeNeedsReview({ ...fixture(), _provenance: { partnerBrands: "needs-review" } }, "annualFee"), false);
});

test("rendered calculator does not quote a held annual fee or label the record fully verified", () => {
  const html = renderToString(h(RewardsCalculator, { cards: [held("annualFee.amount")] }));
  assert.match(html, /Annual fee<\/span><strong class="num-value">Pending<\/strong>/);
  assert.match(html, /no net return or fee break-even estimated/);
  assert.match(html, /Source record: .*terms pending/);
  assert.doesNotMatch(html, /Covers its fee at about|Last verified:/);
});

test("annual and VAT holds cannot become zero first-year costs through a known waiver", () => {
  for (const field of ["annualFee", "annualFee.currency", "vatPolicy", "vatPolicy.treatment"]) {
    const card = publicCardFacts({ ...held(field), annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: 0, threshold_period: "annual" as const } });
    const terms = cardValueTerms(card, "synthetic-fee-evidence");
    assert.equal(terms.firstFee, null, field); assert.equal(terms.laterFee, null, field);
    assert.equal(calculateCardValue(terms, 10000).first, null, field);
    assert.equal(calculateCardValue(terms, 10000).later, null, field);
  }
});

test("every held waiver subtree withholds waiver-dependent first-year estimates without erasing known renewal fees", () => {
  for (const field of ["annualFeeWaiver", "annualFeeWaiver.year_one_waived", "annualFeeWaiver.ongoing_threshold_aed", "annualFeeWaiver.threshold_period", "annualFeeWaiver.notes"]) {
    const raw = { ...held(field), annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: 0, threshold_period: "annual" as const } };
    const card = publicCardFacts(raw);
    const terms = cardValueTerms(card, "synthetic-fee-evidence");
    assert.equal(card.annualFeeWaiver, null, field);
    assert.equal(terms.firstFee, null, field); assert.equal(terms.laterFee, 1200, field);
    assert.equal(terms.assumesYearOneWaiver, false, field);
    assert.equal(terms.hasConditionalRenewalWaiver, false, field); assert.equal(terms.annualWaiver, "", field);
    assert.equal(raw.annualFeeWaiver.year_one_waived, true, field);
  }
  for (const field of ["joiningFee", "joiningFee.amount", "joiningFee.currency"]) {
    const terms = cardValueTerms({ ...held(field), joiningFee: { amount: 100, currency: "AED" } }, "synthetic-fee-evidence");
    assert.equal(terms.firstFee, null, field); assert.equal(terms.laterFee, 1200, field);
  }
});

test("held FX rate, scope, VAT and upper-bound metadata all limit freshness claims", () => {
  assert.equal(cardHasUnresolvedTerms(fixture()), false);
  for (const field of ["fxFee", "fxFee.amount", "fxFeeScope", "fxFeeVatTreatment", "fxFeeUpperBound", "fxFeeUpperBound.amount", "fxFeeUpperBound.scope", "fxFeeUpperBound.vatTreatment", "fxFeeUpperBound.schemeCharges", "fxFeeSchemeCharges"]) {
    assert.equal(cardHasUnresolvedTerms(held(field)), true, field);
  }
  assert.equal(cardHasUnresolvedTerms(held("partnerBrands")), false);
});

test("unknown qualification and unconfirmed applications limit freshness even without an explicit hold", () => {
  const card = fixture();
  for (const eligibility of [
    { ...card.eligibility, salaryTransferRequired: null },
    { ...card.eligibility, residencyRequired: null },
    { ...card.eligibility, employmentTypes: [] },
  ]) assert.equal(cardHasUnresolvedTerms({ ...card, eligibility }), true);
  assert.equal(cardHasUnresolvedTerms({ ...card, applicationAvailability: "unconfirmed" }), true);
  assert.equal(cardHasUnresolvedTerms(card), false);
});
