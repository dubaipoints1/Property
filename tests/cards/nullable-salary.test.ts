import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cardSalaryPending, hasUsableSalaryMinimum, cardHasUnresolvedTerms, cardSalaryLabel, eligibilityQualifiers } from "../../src/lib/cardEligibility.ts";
import { cardComparisonRows } from "../../src/lib/cardsDataFormat.ts";
import { toRow } from "../../src/lib/feeIndex.ts";
import { getCardData } from "../../src/lib/cardsData.ts";
import { cardDifference, identicalKnownSections } from "../../src/lib/cardDifference.ts";

const card = (salary: number | null, invitationOnly = false) => ({
  slug: "fixture", name: "Source fixture", bank: "fixture", annualFee: { amount: 0, currency: "AED" },
  fxFee: 0, eligibility: { minSalary: salary, invitationOnly }, earnRates: { everythingElse: 0 },
  _provenance: { eligibility: "editor-confirmed" },
});
test("null salary remains unknown, not a published zero or a salary-qualified recommendation", () => {
  const unknown = card(null), zero = card(0);
  assert.equal(cardSalaryPending(unknown), true);
  assert.equal(hasUsableSalaryMinimum(unknown), false);
  assert.equal(toRow(unknown).minSalary, null);
  const heldEmployment = { ...card(0), _provenance: { eligibility: "editor-confirmed", "eligibility.employmentTypes": "needs-review" } };
  assert.equal(toRow(heldEmployment).minSalary, null);
  assert.equal(cardHasUnresolvedTerms(unknown), true);
  assert.equal(cardSalaryPending(zero), false);
  assert.equal(hasUsableSalaryMinimum(zero), true);
  assert.equal(toRow(unknown).minSalary, null);
  assert.equal(toRow(zero).minSalary, 0);
  const row = cardComparisonRows(unknown, zero).find(r => r.key === "minSalary")!;
  assert.equal(row.leftValue, "Pending");
  assert.equal(row.rightValue, "No minimum");
  assert.equal(row.winner, "none");
});
test("invitation and provenance conditions cannot be flattened into a numeric gate", () => {
  assert.equal(hasUsableSalaryMinimum(card(0, true)), false);
  assert.equal(hasUsableSalaryMinimum({ ...card(0), _provenance: { eligibility: "needs-review" } }), false);
  assert.equal(hasUsableSalaryMinimum({ ...card(0), _provenance: { "eligibility.minSalary": "needs-review" } }), false);
});
test("rendered card surfaces retain explicit uncertainty and never blanket-verify a partial profile", () => {
  assert.match(readFileSync("src/components/cards/VerifiedStamp.astro", "utf8"), /Source record.*terms pending/);
  assert.match(readFileSync("src/components/cards/SpecCard.astro", "utf8"), /limited=\{cardHasUnresolvedTerms\(card\)\}/);
  for (const file of ["src/components/cards/FinderCard.astro", "src/pages/cards/compare.astro"])
    assert.match(readFileSync(file, "utf8"), /limited=\{cardHasUnresolvedTerms\(card\)\}/, file);
  assert.match(readFileSync("src/layouts/CardReviewLayout.astro", "utf8"), /not whole-card verification/);
  for (const file of ["src/pages/cards/salary/index.astro", "src/pages/cards/salary/[point].astro", "src/pages/index.astro"])
    assert.match(readFileSync(file, "utf8"), /filter\(hasUsableSalaryMinimum\)/, file);
});
test("parent eligibility uncertainty withholds all sibling qualifiers and cannot be overridden by invitation", () => {
  const eligibility = { minSalary: 0, invitationOnly: true, salaryTransferRequired: true, residencyRequired: true, employmentTypes: ["salaried"], minAge: 21 };
  const pending = { eligibility: "needs-review" };
  assert.deepEqual(eligibilityQualifiers(eligibility, pending), []);
  assert.equal(cardSalaryLabel({ eligibility, _provenance: pending }), "Pending");
  assert.equal(cardSalaryLabel({ eligibility, _provenance: { eligibility: "editor-confirmed" } }), "Invitation only");
  const partial = { "eligibility.employmentTypes": "needs-review", "eligibility.invitationOnly": "needs-review" };
  assert.deepEqual(eligibilityQualifiers(eligibility, partial), ["Salary transfer required", "UAE residents", "Employment conditions pending"]);
  const row = cardComparisonRows({ ...card(0, true), _provenance: pending }, card(0)).find(r => r.key === "minSalary")!;
  assert.equal(row.leftValue, "Pending"); assert.equal(row.winner, "none");
});
test("unknown eligibility booleans and empty employment are not false, any-employment or qualification", () => {
  const unknown = { ...card(0), eligibility: { minSalary: 0, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] },
    _provenance: { "eligibility.salaryTransferRequired": "needs-review", "eligibility.residencyRequired": "needs-review", "eligibility.employmentTypes": "needs-review" } };
  assert.equal(hasUsableSalaryMinimum(unknown), false);
  const qualifiers = eligibilityQualifiers(unknown.eligibility, unknown._provenance);
  assert.deepEqual(qualifiers, ["Salary-transfer conditions pending", "Residency conditions pending", "Employment conditions pending"]);
  assert.doesNotMatch(qualifiers.join(" "), /not required|any employment|non-resident/i);
  const source = readFileSync("src/pages/cards/salary/[point].astro", "utf8");
  assert.match(source, /salaryTransferRequired === null[\s\S]*?\? "Pending"/);
  const base = getCardData("citi-cashback")!;
  const pending = { ...base, _provenance: { ...base._provenance, eligibility: "editor-confirmed" },
    eligibility: { ...base.eligibility, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] } };
  const descriptor = cardDifference(pending);
  assert.equal(descriptor.eligibility.known, false);
  assert.equal(identicalKnownSections([descriptor, descriptor]).includes("eligibility"), false);
});
