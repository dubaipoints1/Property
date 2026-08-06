// Unit tests for the Council sign-off CI gate — Charter §7.
//
// Run: node --import tsx --test tests/ci/signoff.test.ts
//
// This gate is the thing standing between an unreviewed change and main,
// so it gets tested rather than trusted. The cases that matter most are
// the near-misses: a body that MENTIONS the Chairman without approving,
// and a Notes cell containing the word "approved" while the status cell
// does not. Both would sail through a naive `grep -q approved`, which is
// exactly what CLAUDE.md proposed and what this replaces.

import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error — plain .mjs module, no type declarations by design.
import { checkSignoff } from "../../scripts/ci/check-signoff.mjs";

const VALID = `
Some description of the change.

## Council sign-off

**Tier**: T2
**Brief**: \`ad-hoc\`

| Role | Status | Notes |
|---|---|---|
| Section editor | pass | one line |
| Head of UX (Stage 5.5) | n/a | one line |
| Fact-Checker (Stage 6) | pass | one line |
| Standards Editor (Stage 6.5) | pass | one line |
| Technical Lead | pass | one line |
| Chairman (Stage 7) | **approved** | required on every tier |
`;

test("accepts a well-formed sign-off block", () => {
  const r = checkSignoff(VALID);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
  assert.equal(r.tier, "T2");
});

test("rejects a missing section", () => {
  const r = checkSignoff("Just a description, no block.");
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /No `## Council sign-off` section/);
});

test("rejects an empty or absent body", () => {
  for (const body of ["", "   \n  ", null, undefined]) {
    const r = checkSignoff(body);
    assert.equal(r.ok, false, `expected failure for ${JSON.stringify(body)}`);
    assert.match(r.errors[0], /body is empty/);
  }
});

test("rejects a block with no tier declared", () => {
  const r = checkSignoff(VALID.replace("**Tier**: T2", "Tier: unspecified"));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e: string) => /No tier declared/.test(e)));
});

test("accepts each of T1, T2, T3, and reports which", () => {
  for (const tier of ["T1", "T2", "T3"]) {
    const r = checkSignoff(VALID.replace("**Tier**: T2", `**Tier**: ${tier}`));
    assert.equal(r.ok, true, `${tier} should pass`);
    assert.equal(r.tier, tier);
  }
});

test("rejects a Chairman status that is not approved", () => {
  const r = checkSignoff(
    VALID.replace("| Chairman (Stage 7) | **approved** |", "| Chairman (Stage 7) | **pending** |"),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e: string) => /not "approved"/.test(e)));
});

test("rejects a missing Chairman row even when other roles pass", () => {
  const r = checkSignoff(VALID.replace(/\| Chairman \(Stage 7\).*\n/, ""));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e: string) => /No Chairman row/.test(e)));
});

// The near-miss a naive grep would wave through: "approved" appears in the
// row, but in the Notes cell, while the actual status is still pending.
test("does not accept the word 'approved' from the Notes cell", () => {
  const r = checkSignoff(
    VALID.replace(
      "| Chairman (Stage 7) | **approved** | required on every tier |",
      "| Chairman (Stage 7) | pending | brief was approved on 5 August |",
    ),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e: string) => /not "approved"/.test(e)));
});

// Equally: the section header must be a real header, not a passing mention.
test("does not accept a prose mention of the section name", () => {
  const r = checkSignoff("I will add the ## Council sign-off block later, promise.");
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /No `## Council sign-off` section/);
});

test("tolerates loose formatting — unbolded tier, extra spacing", () => {
  const body = VALID.replace("**Tier**: T2", "Tier:  T3");
  const r = checkSignoff(body);
  assert.equal(r.ok, true);
  assert.equal(r.tier, "T3");
});

test("tolerates a Chairman status without bold markers", () => {
  const r = checkSignoff(
    VALID.replace("| **approved** |", "| approved |"),
  );
  assert.equal(r.ok, true);
});

test("reports every structural problem at once, not just the first", () => {
  const body = `
## Council sign-off

| Role | Status | Notes |
|---|---|---|
| Technical Lead | pass | one line |
`;
  const r = checkSignoff(body);
  assert.equal(r.ok, false);
  // Missing tier AND missing Chairman row — a contributor should see both
  // in one CI run rather than fixing one and failing again on the other.
  assert.equal(r.errors.length, 2);
});
