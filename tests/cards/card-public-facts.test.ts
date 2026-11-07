import { test } from "node:test";
import assert from "node:assert/strict";
import { cardFieldHeld, publicCardFacts } from "../../src/lib/cardPublicFacts.ts";
import { welcomeBonusRank, cardComparisonRows } from "../../src/lib/cardsDataFormat.ts";
import { cardHasUnresolvedTerms } from "../../src/lib/cardEligibility.ts";

const base = () => ({
  annualFee: { amount: 100 },
  fxFee: 1,
  earnRates: { everythingElse: 1 },
  eligibility: { minSalary: 5000, salaryTransferRequired: false, residencyRequired: true },
  welcomeBonus: { amount: 500, unit: "aed_cashback", headline: "A source-bound offer" } as unknown,
  welcomeBonusValue: 500,
  annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null, notes: "Example offer condition" },
  _features: [{ type: "lounge_access", network: "Example", scope: "limited" }],
  perks: ["Example benefit"],
  interestRate: { monthly: 1 },
  minPayment: "Example minimum",
  cashAdvanceFee: "Example fee",
  _provenance: {} as Record<string, string>,
});

test("held welcome subfields cannot leak a numeric headline or rank; canonical record is retained", () => {
  const raw = base(); raw._provenance["welcomeBonus.min_spend_aed"] = "needs-review";
  const before = JSON.stringify(raw), out = publicCardFacts(raw);
  assert.equal(out.welcomeBonus, "Welcome offer pending source review.");
  assert.equal(out.welcomeBonusValue, undefined);
  assert.deepEqual(welcomeBonusRank(out.welcomeBonus), { tier: "unpriced" });
  assert.equal(JSON.stringify(raw), before);
  assert.notEqual(out, raw);
  assert.equal(cardHasUnresolvedTerms(out), true);
});

test("held typed/index-based benefits cannot fall back to stale prose or be re-indexed", () => {
  for (const key of ["_features", "_features.0.scope", "_features.lounge_access", "_features.status_match"]) {
    const raw = base(); raw._provenance[key] = "needs-review";
    const out = publicCardFacts(raw);
    assert.deepEqual(out._features, []); assert.deepEqual(out.perks, []);
    assert.equal(out._provenance[key], "needs-review");
    assert.equal(out._provenance._features, "needs-review");
    assert.equal(raw._features.length, 1); assert.equal(raw.perks.length, 1);
    assert.equal(cardHasUnresolvedTerms(out), true);
    const row = cardComparisonRows(out, raw).find(row => row.key === "lounge");
    assert.equal(row?.leftValue, "Pending");
    assert.equal(row?.winner, "none");
    assert.equal(raw._provenance._features, key === "_features" ? "needs-review" : undefined);
  }
});

test("a held prose fallback does not erase a separately known lounge entitlement", () => {
  const raw = base(); raw._provenance["perks.0"] = "needs-review";
  const out = publicCardFacts(raw);
  assert.deepEqual(out.perks, []); assert.deepEqual(out._features, raw._features);
  const row = cardComparisonRows(out, raw).find(row => row.key === "lounge");
  assert.match(row?.leftValue ?? "", /Example/);
  assert.equal(row?.winner, "tie");
});

test("an unconfirmed empty typed list or a contradictory prose list is not proof of no benefits", () => {
  for (const provenance of [{}, { _features: "scraped" }, { _features: "editor-confirmed" }]) {
    const raw = { ...base(), _features: [], _provenance: provenance };
    const before = JSON.stringify(raw), out = publicCardFacts(raw);
    const lounge = cardComparisonRows(out, base()).find(row => row.key === "lounge");
    assert.equal(lounge?.leftValue, "Pending"); assert.equal(lounge?.winner, "none");
    assert.equal(JSON.stringify(raw), before);
  }
  const knownEmpty = { ...base(), _features: [], perks: [], _provenance: { _features: "editor-confirmed-null" } };
  assert.deepEqual(publicCardFacts(knownEmpty), knownEmpty, "explicit consistent absence remains distinct from unknown");
});

test("public raw-value consumers cannot republish held earn-rate or unit claims", () => {
  for (const field of ["earnRates", "earnRates.model", "earnRates.model.paymentChannels", "earnUnit", "earnRates._caps.monthly_max_aed"]) {
    const raw = { ...base(), earnRates: { everythingElse: 1, dining: 5, _caps: { monthly_max_aed: 100 } }, _provenance: { [field]: "needs-review" } };
    const before = JSON.stringify(raw), out = publicCardFacts(raw);
    assert.deepEqual(out.earnRates, { everythingElse: null }, field);
    assert.equal(JSON.stringify(raw), before, field);
  }
  const raw = { ...base(), earnRates: { everythingElse: 1, dining: 5, travel: 2 }, _provenance: { "earnRates.dining": "needs-review" } };
  assert.deepEqual(publicCardFacts(raw).earnRates, { everythingElse: 1, travel: 2 });
  assert.equal(raw.earnRates.dining, 5);
});

test("held finance fields are unknown rather than original unqualified figures", () => {
  const raw = base();
  for (const key of ["interestRate.monthly", "minPayment", "cashAdvanceFee"]) raw._provenance[key] = "needs-review";
  const out = publicCardFacts(raw);
  assert.equal(out.interestRate, undefined);
  assert.equal(out.minPayment, "Pending source review"); assert.equal(out.cashAdvanceFee, "Pending source review");
  assert.equal(raw.interestRate.monthly, 1);
});

test("uncertain qualification flags retain their canonical history but are not public true/false claims", () => {
  const raw = base(); raw._provenance["eligibility.salaryTransferRequired"] = "needs-review";
  const out = publicCardFacts(raw);
  assert.equal(raw.eligibility.salaryTransferRequired, false);
  assert.equal(out.eligibility.salaryTransferRequired, null);
  assert.equal(out.eligibility.residencyRequired, true);
  assert.equal(out.eligibility.minSalary, 5000);
  raw._provenance.eligibility = "needs-review";
  assert.equal(publicCardFacts(raw).eligibility.residencyRequired, null);
});

test("a held waiver subtree cannot escape through a legacy text or direct-value consumer", () => {
  const raw = base(); raw._provenance["annualFeeWaiver.notes"] = "needs-review";
  assert.equal(publicCardFacts(raw).annualFeeWaiver, null);
  assert.equal(raw.annualFeeWaiver.year_one_waived, true);
});

test("confirmed sibling facts and unrelated taxonomy holds remain unchanged", () => {
  const raw = base(); raw._provenance.partnerBrands = "needs-review";
  raw._provenance.welcomeBonus = "editor-corrected";
  assert.deepEqual(publicCardFacts(raw), raw);
  assert.equal(cardFieldHeld(raw, "welcomeBonus"), false);
  assert.equal(cardHasUnresolvedTerms(raw), false);
  for (const key of ["joiningFee", "annualFeeWaiver.notes", "earnUnit"]) {
    const card = base(); card._provenance[key] = "needs-review";
    assert.equal(cardHasUnresolvedTerms(card), true);
  }
});
