import { test } from "node:test";
import assert from "node:assert/strict";
import { getCardData } from "../../src/lib/cardsData";
import { cardDifference, identicalKnownSections } from "../../src/lib/cardDifference";

function fixture() {
  const card = structuredClone(getCardData("citi-cashback")!);
  card._provenance = { annualFee: "editor-confirmed", fxFee: "editor-confirmed", joiningFee: "editor-confirmed-null", annualFeeWaiver: "editor-confirmed-null", eligibility: "editor-confirmed", earnRates: "editor-confirmed", earnUnit: "editor-confirmed", loyaltyProgram: "editor-confirmed", welcomeBonus: "editor-confirmed" };
  delete card.joiningFee; card.annualFeeWaiver = null;
  card.earnRates = { everythingElse: 1, dining: 2, _caps: { monthly_max_aed: null, per_category: {}, min_monthly_spend_to_qualify_aed: null } };
  card.scopedEarnRates = undefined;
  card.welcomeBonus = { amount: 100, unit: "aed_cashback", spend_threshold_aed: 1000, qualify_window_days: 30 };
  return card;
}
test("only known typed equality can hide a shared whole section", () => {
  const one = fixture(), two = structuredClone(one);
  const result = identicalKnownSections([cardDifference(one, "cashback"), cardDifference(two, "cashback")]);
  assert.deepEqual(result, ["fees", "eligibility", "top", "rates", "welcome", "programme"]);
  assert.deepEqual(identicalKnownSections([cardDifference(one)]), []);
  assert.deepEqual(identicalKnownSections([]), []);
});
test("unlike VAT, joining/waiver conditions and FX scope do not disappear behind equal amounts", () => {
  const one = fixture(), two = structuredClone(one);
  two.vatPolicy = one.vatPolicy === "inclusive" ? "exclusive" : "inclusive";
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("fees"), false);
  two.vatPolicy = one.vatPolicy; two.fxFeeScope = "issuer-processing-only";
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("fees"), false);
  delete two.fxFeeScope; two.annualFeeWaiver = "First year only";
  assert.equal(cardDifference(two).fees.known, false);
  two.annualFeeWaiver = null; delete two._provenance.joiningFee;
  assert.equal(cardDifference(two).fees.known, false);
});
test("scraped zero, pending eligibility and absent programme are unknown rather than equal", () => {
  const one = fixture(), two = structuredClone(one);
  one.annualFee.amount = two.annualFee.amount = 0;
  two._provenance.annualFee = "scraped";
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("fees"), false);
  two._provenance.eligibility = "needs-review";
  assert.equal(cardDifference(two).eligibility.known, false);
  assert.equal(cardDifference(one).programme.known, false);
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("programme"), false);
  const unknownMinimum = { ...one, eligibility: { ...one.eligibility, minSalary: null } };
  assert.equal(cardDifference(unknownMinimum).eligibility.known, false, "Even two null minima do not establish eligibility equality");
  const zeroMinimum = { ...one, eligibility: { ...one.eligibility, minSalary: 0 } };
  assert.equal(cardDifference(zeroMinimum).eligibility.known, true, "A recorded reviewed zero is not null");
  two._provenance.fxFeeScope = "needs-review";
  assert.equal(cardDifference(two).fees.known, false, "Unknown fee scope cannot be hidden by matching amounts");
});
test("native reward units, programme, caps, qualification and unmodelled plan/tier conditions matter", () => {
  const one = fixture(), two = structuredClone(one);
  two.earnUnit = "points per USD 1";
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("rates"), false);
  two.earnUnit = one.earnUnit; two.earnRates._caps!.monthly_max_aed = 300;
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("top"), false);
  two.earnRates._caps = one.earnRates._caps; delete two.earnUnit;
  assert.equal(cardDifference(two).rates.known, false);
  assert.equal(cardDifference({ ...one, slug: "wio-credit" }).rates.known, false);
});
test("welcome conditions and verified set requirements are compared without altering visible order", () => {
  const one = fixture(), two = structuredClone(one);
  if (two.welcomeBonus && typeof two.welcomeBonus === "object" && "amount" in two.welcomeBonus) two.welcomeBonus.qualify_window_days = 60;
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("welcome"), false);
  two.eligibility.documents = [...one.eligibility.documents].reverse();
  assert.equal(identicalKnownSections([cardDifference(one), cardDifference(two)]).includes("eligibility"), true);
  two.welcomeBonus = null;
  assert.equal(cardDifference(two).welcome.known, false);
});

test("unknown FX and matching variable upper bounds remain visible instead of equal exact fees", () => {
  const exact = fixture(); exact.fxFee = 0;
  assert.equal(cardDifference(exact).fees.known, true, "A reviewed exact zero remains distinct from null");
  const unknown = { ...exact, fxFee: null };
  assert.equal(cardDifference(unknown).fees.known, false);
  assert.equal(identicalKnownSections([cardDifference(unknown), cardDifference(unknown)]).includes("fees"), false);
  const bound = { amount: 3, unit: "percent" as const, vatTreatment: "inclusive" as const, scope: "issuer-processing-only" as const, schemeCharges: "additional" as const };
  const bounded = { ...unknown, fxFeeUpperBound: bound };
  assert.equal(cardDifference(bounded).fees.known, false);
  assert.equal(identicalKnownSections([cardDifference(bounded), cardDifference(structuredClone(bounded))]).includes("fees"), false);
  assert.equal(cardDifference({ ...exact, fxFeeUpperBound: bound }).fees.known, false, "Even an invalid dual shape must fail closed in this pure helper");
  assert.equal(cardDifference({ ...exact, fxFee: NaN }).fees.known, false);
  assert.equal(cardDifference({ ...exact, fxFee: Infinity }).fees.known, false);
  exact._provenance.fxFeeUpperBound = "needs-review";
  assert.equal(cardDifference(exact).fees.known, false);
});
