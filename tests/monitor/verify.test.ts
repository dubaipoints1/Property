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
import { readFileSync } from "node:fs";

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

test("alternative product namings are recognised", () => {
  // Regression from verify run 30988856840: ADIB's
  // salary-bonus-program-tcs-en.pdf came back NO SALARY-TRANSFER CONTENT
  // because the detector only knew the phrase "salary transfer". UAE banks
  // brand this several ways, and missing one reports "no offer" — the
  // wrong answer, and one that would have quietly dropped a real bank.
  for (const phrase of [
    "Salary Bonus Program terms and conditions",
    "credit your salary to the account",
    "WPS salary processing",
    "salary credit bonus",
  ]) {
    assert.ok(
      signalsFor(phrase).mentionsSalaryTransfer,
      `not recognised as salary-transfer content: "${phrase}"`,
    );
  }
});

test("ADIB's real document shape now reads as offer content", () => {
  // Fixture mirrors what the run reported: a salary-bonus T&C with an AED
  // figure but no band table. Should no longer be NO SALARY-TRANSFER
  // CONTENT.
  const adib = "Salary Bonus Program Terms and Conditions. Bonus of AED 3,000 payable.";
  assert.notEqual(verdictFor("ok", signalsFor(adib)), "NO SALARY-TRANSFER CONTENT");
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

test("the shipped registry's pending block is readable by the verify script", () => {
  // Regression: _pending entries were bare arrays, then gained recorded
  // verdicts and became {urls, verdict} objects. A reader that only knew
  // the array form silently reported zero candidates — a dry run showing
  // "~0 credits" rather than an error, which is the kind of failure that
  // looks like success.
  const reg = JSON.parse(readFileSync("scripts/monitor/salary-transfer.registry.json", "utf8"));
  let found = 0;
  for (const [bank, entry] of Object.entries<any>(reg._pending ?? {})) {
    if (bank.startsWith("_")) continue;
    const urls = Array.isArray(entry) ? entry : entry?.urls;
    assert.ok(Array.isArray(urls), `_pending.${bank} has no readable urls array`);
    found += urls.length;
  }
  assert.ok(found > 0, "no pending candidates readable");
});

test("every admitted URL carries recorded evidence", () => {
  // The admission standard is only real if each entry says why it qualified.
  const reg = JSON.parse(readFileSync("scripts/monitor/salary-transfer.registry.json", "utf8"));
  for (const b of reg.banks ?? []) {
    assert.ok(b.urls?.length, `${b.bank} has no urls`);
    assert.ok(b._evidence?.length > 40, `${b.bank} has no substantive _evidence`);
  }
});
