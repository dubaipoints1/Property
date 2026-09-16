// Parser tests for scripts/scrape/_lib.ts.
//
// Opened on 16 September 2026 for the markdown-emphasis defect in
// parseAED. We scrape in markdown mode, so a bank that styles the
// currency in its page copy hands us the emphasis marks verbatim — and
// the previous `/AED\s*([\d,]+)/i` returned null for every one of them,
// because the `_` in `_AED_ 1,200` sits between "AED" and the digits
// where `\s*` cannot match it.
//
// ADCB styles every amount this way, so no ADCB page has ever yielded a
// parseable figure to this function. That is the same failure class that
// let the Essential Cashback welcome bonus go un-typed while it was cut
// twice: the monitor captured `up to _AED_ 250` and nothing downstream
// could read a number out of it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseAED } from "../../scripts/scrape/_lib.ts";

test("parseAED reads the plain forms", () => {
  assert.equal(parseAED("AED 1,575"), 1575);
  assert.equal(parseAED("AED1,575/year"), 1575);
  assert.equal(parseAED("AED 1575"), 1575);
  assert.equal(parseAED("aed 250"), 250);
  assert.equal(parseAED("AED 1,234.50"), 1234.5);
});

test("parseAED reads through markdown emphasis on the currency", () => {
  // Every one of these returned null before 16 September 2026.
  assert.equal(parseAED("welcome bonus of _AED_ 1,200"), 1200);
  assert.equal(parseAED("minimum spend of **AED** 8,000 within 60 days"), 8000);
  assert.equal(parseAED("__AED__ 250"), 250);
  assert.equal(parseAED("*AED* 500"), 500);
  assert.equal(parseAED("_AED_1,000"), 1000);
  // The string the monitor actually captured from ADCB.
  assert.equal(parseAED("Enjoy a welcome bonus of up to _AED_ 250"), 250);
});

test("parseAED still refuses what is not an AED amount", () => {
  // The tolerance is deliberately narrow — emphasis hugging the token
  // only. Widening it to strip emphasis from the whole input would break
  // parseMinSalary's FAB bold layout, which reads `**` as its signal.
  assert.equal(parseAED("USD 300"), null);
  assert.equal(parseAED("SAUDI 500"), null);
  assert.equal(parseAED("no currency 1,200"), null);
  assert.equal(parseAED("AED"), null);
});
