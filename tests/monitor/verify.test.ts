// Unit tests for candidate verification signals.
//
// Run: node --import tsx --test tests/monitor/verify.test.ts
//
// The point of verify-candidates.ts is that a URL's spelling does not
// tell you whether it is right. salaryTransferOfferHistory records two
// perfectly ordinary-looking URLs that returned 404 on re-verification.
// These tests pin the discrimination: a real offer page reads as
// SUPPORTED, a dead fetch as UNREACHABLE, and an unrelated product page
// as NO SALARY-TRANSFER CONTENT.

import { test } from "node:test";
import assert from "node:assert/strict";

import { signalsFor, verdictFor } from "../../scripts/monitor/verify-candidates.ts";

// Representative of a real UAE salary-transfer page — phrasing drawn from
// the requirements/clawback prose already in src/content/salaryTransferOffers/.
const REAL_OFFER = `
# Transfer your salary and earn more

Open a Current Account and transfer a net salary above AED 5,000 per month.

| Monthly salary | Bonus |
| AED 5,000 - 9,999 | AED 1,500 |
| AED 25,000 and above | AED 5,000 |

Minimum salary: AED 5,000

Bonus is clawed back in full if the salary transfer ceases within 6 months,
and pro-rata thereafter.
`;

// Emirates Islamic's payroll-card page — a WPS card for employers'
// staff, which discovery proposed but which is not a transfer offer.
const PAYROLL_CARD = `
# Payroll Card

A prepaid card for employees without a bank account. Employers can pay
staff wages directly onto the card in line with the Wage Protection System.
Cards are issued in AED 100 denominations.
`;

const UNRELATED = `
# Business Banking

Corporate accounts, trade finance and treasury services for UAE companies.
`;

test("a real salary-transfer page reads as SUPPORTED", () => {
  const s = signalsFor(REAL_OFFER);
  assert.ok(s.mentionsSalaryTransfer);
  assert.ok(s.hasBands, "expected band language");
  assert.ok(s.hasClawback, "expected clawback language");
  assert.equal(s.minSalary, 5000);
  assert.equal(verdictFor("ok", s), "SUPPORTED");
});

test("a dead fetch is UNREACHABLE regardless of signals", () => {
  // This is the ADCB / RAKBANK 404 case — the one that eye-confirmation
  // cannot catch and that this whole script exists for.
  assert.equal(verdictFor("fail", signalsFor("")), "UNREACHABLE");
  // Even if markdown somehow survived, a failed status wins.
  assert.equal(verdictFor("fail", signalsFor(REAL_OFFER)), "UNREACHABLE");
});

test("an unrelated product page has NO SALARY-TRANSFER CONTENT", () => {
  assert.equal(verdictFor("ok", signalsFor(UNRELATED)), "NO SALARY-TRANSFER CONTENT");
});

test("a payroll card is not mistaken for a salary-transfer offer", () => {
  // It mentions neither salary transfer nor bands/clawback, so it must
  // not read as SUPPORTED — this is the emirates-islamic candidate.
  const verdict = verdictFor("ok", signalsFor(PAYROLL_CARD));
  assert.notEqual(verdict, "SUPPORTED");
});

test("a page that merely names salary transfer is WEAK, not SUPPORTED", () => {
  // Guards against admitting a nav page or a stub that happens to carry
  // the phrase but none of the offer detail.
  const stub = "Salary transfer accounts are available. Visit a branch to learn more.";
  const v = verdictFor("ok", signalsFor(stub));
  assert.ok(v.startsWith("WEAK"), `expected WEAK, got: ${v}`);
});

test("two strong signals are required to reach SUPPORTED", () => {
  // One signal alone is not enough — the threshold is deliberate.
  const oneSignal = "Salary transfer offer. Minimum salary: AED 8,000.";
  const s = signalsFor(oneSignal);
  const strong = [s.aedAmount !== null, s.minSalary !== null, s.hasBands, s.hasClawback].filter(
    Boolean,
  ).length;
  assert.equal(verdictFor("ok", s), strong >= 2 ? "SUPPORTED" : "WEAK — mentions salary transfer but carries little offer detail");
});
