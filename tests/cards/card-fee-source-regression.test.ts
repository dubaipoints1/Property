import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";

const cards = JSON.parse(readFileSync("src/data/cards.json", "utf8"));
const plain = (value: string) => value.replace(/\s+/g, " ");

test("card reviews do not add VAT to the stored Citi and ADIB gross fees", () => {
  const citi = cards["citi-cashback"];
  const adib = cards["adib-cashback-visa"];
  assert.equal(citi.vatPolicy, "inclusive");
  assert.equal(adib.vatPolicy, "inclusive");
  assert.equal(plain(annualFeeLabel(citi).amount), "AED 315");
  assert.equal(annualFeeLabel(citi).qual, "year 2+");
  assert.equal(plain(annualFeeLabel(adib).amount), "AED 103.95");
  assert.equal(citi.annualFeeWaiver.ongoing_threshold_aed, 9000);
});
