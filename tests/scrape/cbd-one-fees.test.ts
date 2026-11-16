import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseCbdOneFees } from "../../scripts/scrape/_cbd-one-fees.ts";
import { cardFxFeeLabel } from "../../src/lib/cardFeeFacts.ts";

const source = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-16-cbd-one-kfs.json", "utf8"));
const card = JSON.parse(readFileSync("src/data/cards.json", "utf8"))["cbd-one"];

test("CBD One exact KFS verifies only named issuer FX and cash-withdrawal charges", () => {
  const parsed = parseCbdOneFees(source);
  assert.ok(parsed);
  const { evidence, ...facts } = parsed;
  for (const [field, value] of Object.entries(facts)) assert.equal(card[field], value);
  for (const field of ["fxFee", "cashAdvanceFee"] as const) {
    assert.equal(card._provenance[field], "editor-confirmed");
    assert.deepEqual(card._fieldEvidence[field], evidence[field]);
  }
  assert.equal(cardFxFeeLabel(card), "3.50% issuer FX charges including VAT; scheme charges may also apply");
  assert.equal(card.lastVerified, "2026-10-02");
  assert.equal(card._lastScraped, "2026-09-17");
  for (const field of ["earnRates", "interestRate", "minPayment"]) assert.equal(card._provenance[field], "needs-review");
  assert.equal(card.welcomeBonus, null);
});

test("CBD One parser fails closed on a substitute document, VAT row, variant or broken byte pin", () => {
  assert.equal(parseCbdOneFees({ ...source, bodySha256: "0".repeat(64) }), null);
  for (const key of ["vat", "product", "network", "foreign"]) {
    const bad = structuredClone(source);
    const row = bad.rows[key];
    row.text = row.text.replace(/[a-z]/i, "X");
    row.sha256 = createHash("sha256").update(row.text).digest("hex");
    assert.equal(parseCbdOneFees(bad), null, key);
  }
  const wrongByte = structuredClone(source);
  wrongByte.rows.cash.sourceStartByte += 1;
  assert.equal(parseCbdOneFees(wrongByte), null);
});
