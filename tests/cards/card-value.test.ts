import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getCardData } from "../../src/lib/cardsData.ts";
import {
  calculateCardValue,
  cardValueTerms,
  DEFAULT_CARD_VALUE_MONTHLY_SPEND,
  formatCardValue,
  MAX_CARD_VALUE_MONTHLY_SPEND,
} from "../../src/lib/cardValue.ts";

const base = DEFAULT_CARD_VALUE_MONTHLY_SPEND;
const citi = getCardData("citi-cashback")!;
const citiSlug = "citi-cashback";
const termsFor = (slug: string) => cardValueTerms(getCardData(slug)!, slug);
// Explicit synthetic known terms preserve arithmetic positives independently
// of source products that now correctly withhold generic earning estimates.
const cashFixture = { ...citi, annualFee: { amount: 315, currency: "AED" as const }, joiningFee: undefined,
  annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: 9000, threshold_period: "annual" as const },
  earnRates: { everythingElse: 1 }, earnUnit: "% cashback", loyaltyProgram: "Cashback",
  scopedEarnRates: undefined, _provenance: {}, _dataIssues: {}, vatPolicy: "inclusive" as const };

test("first-year and renewal show comparable spend rewards without assuming a welcome offer or renewal waiver", () => {
  const terms = cardValueTerms(cashFixture, "synthetic-cash");
  const estimate = calculateCardValue(terms, base);
  assert.equal(terms.hasWelcomeOffer, true);
  assert.equal(terms.assumesYearOneWaiver, true);
  assert.equal(terms.hasConditionalRenewalWaiver, true);
  assert.equal(estimate.rewards, base * 12 * 0.01);
  assert.equal(estimate.first, 936);
  assert.equal(estimate.later, 621);
});

test("monthly cash caps apply before annualising, and a zero-spend estimate remains genuinely zero", () => {
  // Synthetic pure-model fixture, not a claim that a real product's channel
  // and merchant conditions have become an unlimited all-spend rate.
  const terms = cardValueTerms({ ...cashFixture, earnRates: { everythingElse: 1, _caps: { monthly_max_aed: 1000 } } }, "synthetic-cash-cap-fixture");
  assert.equal(terms.cap, 1000);
  assert.equal(calculateCardValue(terms, 200_000).rewards, 12_000);
  assert.equal(calculateCardValue(terms, 200_000).capBinds, true);
  assert.equal(calculateCardValue(cardValueTerms(cashFixture, "synthetic-cash"), 0).first, 0);
});
test("365 merchant and payment-channel exceptions block a generic all-spend estimate", () => {
  const terms = termsFor("adcb-365-cashback");
  assert.equal(terms.rate, null); assert.equal(terms.cap, null);
  assert.equal(calculateCardValue(terms, base).first, null);
  assert.equal(calculateCardValue(terms, 200_000).rewards, null);
  assert.match(terms.rewardIssue, /direct-payment channels and reduced-category exclusions/);
});

test("below the published monthly minimum no reward or net amount is inferred", () => {
  const terms = cardValueTerms({ ...cashFixture, annualFee: { amount: 0, currency: "AED" }, annualFeeWaiver: null,
    earnRates: { everythingElse: 1, _caps: { min_monthly_spend_to_qualify_aed: 10000 } } }, "synthetic-spend-floor");
  assert.equal(terms.minimum, 10_000);
  assert.equal(calculateCardValue(terms, 9_999).first, null);
  assert.match(calculateCardValue(terms, 9_999).rewardIssue, /monthly qualifying minimum/);
  assert.equal(calculateCardValue(terms, 10_000).first, 1200);
});

test("published miles use the actual per-AED denomination and conservative value", () => {
  const terms = cardValueTerms({ ...cashFixture, annualFee: { amount: 2625, currency: "AED" }, annualFeeWaiver: null,
    earnRates: { everythingElse: 3.5 }, earnUnit: "Etihad Guest Miles per AED 10 spent", loyaltyProgram: "Etihad Guest" }, "synthetic-miles");
  assert.equal(terms.pointsBaseline, true);
  const estimate = calculateCardValue(terms, base);
  assert.equal(estimate.rewards, 655.20);
  assert.equal(estimate.first, -1969.80);
  assert.match(formatCardValue(estimate.first), /-AED/);
});

test("placeholder points, merchant credits and conditional earn rates without an everyday denominator are never priced as cash", () => {
  for (const slug of ["adcb-talabat", "emirates-nbd-voyager-world", "fab-cashback", "cbd-one"]) {
    const estimate = calculateCardValue(termsFor(slug), base);
    assert.equal(estimate.first, null, slug);
    assert.equal(estimate.later, null, slug);
    assert.notEqual(estimate.rewardIssue, "", slug);
  }
});

test("a promotional zero does not establish a zero renewal", () => {
  const terms = termsFor("emirates-nbd-marriott-bonvoy-world");
  assert.equal(terms.firstFee, 0);
  assert.equal(terms.laterFee, null);
  assert.equal(calculateCardValue(terms, base).later, null);
});

test("unclear joining-fee timing suppresses first-year value without hiding a known renewal", () => {
  const card = { ...cashFixture, joiningFee: { amount: 120, currency: "AED" as const }, annualFeeWaiver: null };
  const terms = cardValueTerms(card, "synthetic-joining-timing");
  assert.equal(terms.firstFee, null);
  assert.equal(terms.laterFee, 315);
  assert.match(terms.firstFeeIssue, /whether both joining and annual fees/);
  assert.equal(calculateCardValue(terms, base).later, 621);
});

test("a documented first-year annual-fee waiver does not waive an independent joining fee", () => {
  const terms = cardValueTerms({ ...cashFixture, annualFee: { amount: 1575, currency: "AED" }, joiningFee: { amount: 3148.95, currency: "AED" } }, "synthetic-joining-waiver");
  assert.equal(terms.firstFee, 3148.95);
  assert.equal(terms.laterFee, 1575);
});

test("live held or source-qualified profiles do not retain former generic return estimates", () => {
  for (const slug of ["citi-cashback", "rakbank-world", "emirates-nbd-skywards-infinite", "emirates-nbd-marriott-bonvoy-world-elite"]) {
    const terms = termsFor(slug);
    const value = calculateCardValue(terms, base);
    assert.equal(value.rewards, null, slug); assert.equal(value.first, null, slug); assert.equal(value.later, null, slug);
    assert.notEqual(value.rewardIssue, "", slug);
  }
  assert.equal(termsFor("emirates-nbd-skywards-infinite").firstFee, null, "held waiver is not an assumed first-year cost");
});

test("uncertain caps, gross fee and invalid input are handled without inventing values", () => {
  const uncertain = cardValueTerms({
    ...citi,
    _provenance: { ...citi._provenance, "earnRates._caps.monthly_max_aed": "needs-review" },
  }, citiSlug);
  assert.equal(uncertain.cap, null);
  assert.equal(calculateCardValue(uncertain, base).later, null);
  const exclusive = cardValueTerms({
    ...citi, annualFee: { amount: 299, currency: "AED" }, vatPolicy: "exclusive",
  }, citiSlug);
  assert.equal(exclusive.laterFee, 313.95);
  for (const spend of [-1, NaN, Infinity, 1.5, MAX_CARD_VALUE_MONTHLY_SPEND + 1]) {
    const estimate = calculateCardValue(exclusive, spend);
    assert.equal(estimate.first, null);
    assert.equal(estimate.later, null);
  }
});

test("plan and tier rates are not promoted to standard AED estimates", () => {
  for (const [slug, reason] of [
    ["wio-credit", /Standard plan earns none/],
    ["liv-cashback", /monthly spend tier and credit-limit cap/],
    ["liv-cashback-plus", /monthly spend tier and credit-limit cap/],
  ] as const) {
    const terms = termsFor(slug);
    const atHigherSpend = calculateCardValue(terms, 15_000);
    assert.equal(atHigherSpend.first, null, slug);
    assert.equal(atHigherSpend.later, null, slug);
    assert.match(atHigherSpend.rewardIssue, reason);
  }
});
