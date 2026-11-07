import { test } from "node:test";
import assert from "node:assert/strict";
import { getCardData } from "../../src/lib/cardsData.ts";
import { cardFxFeeLabel } from "../../src/lib/cardFeeFacts.ts";
import { buildFeeIndex, exactFxForStatistics } from "../../src/lib/feeIndex.ts";
const base = getCardData("hsbc-live-plus")!;
const bound = { amount: base.fxFee!, unit: "percent" as const, vatTreatment: "inclusive" as const,
  scope: "issuer-fx-charges" as const, schemeCharges: "additional" as const };
const unknown = { ...base, slug: "unknown-fixture", fxFee: null, fxFeeScope: undefined };
const bounded = { ...unknown, slug: "bounded-fixture", fxFeeUpperBound: bound };

test("null exact FX fee and an advertised upper bound are not a confirmed zero", () => {
  assert.equal(cardFxFeeLabel(unknown), "Pending");
  assert.match(cardFxFeeLabel(bounded), /^Up to .* issuer FX charges including VAT; scheme charges may also apply$/);
  assert.equal(cardFxFeeLabel({ ...bounded, fxFeeUpperBound: { ...bound, vatTreatment: "exclusive" } }).includes("plus VAT"), true);
  assert.equal(exactFxForStatistics(unknown), null);
  assert.equal(exactFxForStatistics(bounded), null);
  assert.equal(exactFxForStatistics({ fxFee: 0, _provenance: { fxFee: "editor-confirmed" } }), 0);
});
test("empty exact-FX samples retain null bank/total medians and maxima, never zero", () => {
  const index = buildFeeIndex([unknown, bounded]);
  assert.equal(index.fxSampleSize, 0);
  assert.equal(index.fxZero, 0);
  assert.equal(index.medianFx, null);
  assert.equal(index.maxFx, null);
  assert.equal(index.byBank[0].medianFx, null);
  const mixed = buildFeeIndex([unknown, bounded, { ...base, slug: "exact-fixture", fxFeeScope: undefined }]);
  assert.equal(mixed.fxSampleSize, 1);
  assert.equal(mixed.medianFx, base.fxFee);
});
test("issuer-only exact fees are not comparable all-in FX samples or fee-free claims", () => {
  for (const fxFeeScope of ["issuer-processing-only", "issuer-fx-charges-only"] as const) {
    const issuerOnly = { ...base, slug: "issuer-only-fixture", fxFee: 0, fxFeeScope };
    assert.equal(exactFxForStatistics(issuerOnly), null);
    const index = buildFeeIndex([issuerOnly]);
    assert.equal(index.fxZero, 0); assert.equal(index.medianFx, null); assert.equal(index.maxFx, null);
  }
  assert.match(cardFxFeeLabel({ ...base, fxFeeScope: "issuer-fx-charges-only", fxFeeVatTreatment: "not-applicable" }), /issuer FX charges \(VAT not applicable\); scheme charges may also apply/);
  assert.match(cardFxFeeLabel({ ...base, fxFeeScope: "issuer-fx-charges-only", fxFeeVatTreatment: "exclusive" }), /issuer FX charges plus VAT/);
});
test("all held FX bounds, rate, VAT, scope and scheme metadata fail closed, including exact zero", () => {
  for (const key of ["fxFee", "fxFee.amount", "fxFeeScope", "fxFeeVatTreatment", "fxFeeUpperBound", "fxFeeUpperBound.amount", "fxFeeUpperBound.vatTreatment", "fxFeeUpperBound.scope", "fxFeeUpperBound.schemeCharges", "fxFeeSchemeCharges"]) {
    const _provenance = { [key]: "needs-review" };
    assert.equal(cardFxFeeLabel({ ...bounded, _provenance }), "Pending", key);
    assert.equal(cardFxFeeLabel({ fxFee: 0, _provenance }), "Pending", key);
    assert.equal(exactFxForStatistics({ fxFee: 0, _provenance }), null, key);
  }
});
