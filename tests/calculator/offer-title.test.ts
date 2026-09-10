import { strict as assert } from "node:assert";
import { test } from "node:test";
import { offerTitle } from "../../src/lib/salaryTransfer.ts";

test("strips the bank prefix the offer names all carry", () => {
  assert.equal(
    offerTitle("First Abu Dhabi Bank", "First Abu Dhabi Bank — 20% Salary Transfer Campaign 2026"),
    "20% Salary Transfer Campaign 2026",
  );
  assert.equal(
    offerTitle("Emirates Islamic", "Emirates Islamic — Salary Transfer Cashback (June–September 2026)"),
    "Salary Transfer Cashback (June–September 2026)",
  );
});

test("accepts en dash and hyphen, not just the em dash", () => {
  assert.equal(offerTitle("HSBC", "HSBC – Welcome Cashback"), "Welcome Cashback");
  assert.equal(offerTitle("HSBC", "HSBC - Welcome Cashback"), "Welcome Cashback");
});

test("matches the prefix case-insensitively", () => {
  assert.equal(offerTitle("Mashreq", "MASHREQ — Joining Bonus"), "Joining Bonus");
});

test("leaves a name that does not use the convention alone", () => {
  assert.equal(offerTitle("RAKBANK", "Cash Reward for new salary transfers"),
    "Cash Reward for new salary transfers");
  assert.equal(offerTitle("Citi", "Citibank — Ready Credit"), "Citibank — Ready Credit");
});

test("does not strip a name down to nothing", () => {
  assert.equal(offerTitle("Wio", "Wio"), "Wio");
  assert.equal(offerTitle("Wio", "Wio — "), "Wio — ");
});
