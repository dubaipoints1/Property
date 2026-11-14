import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { FAB_EXPANSION_PRODUCTS, parseFabExpansion } from "../../scripts/scrape/_fab-expansion.ts";
import { annualFeeLabel, cardComparisonRows } from "../../src/lib/cardsDataFormat";

const fixture = () => JSON.parse(readFileSync(new URL("./fixtures/2026-11-fab-new-cards.json", import.meta.url), "utf8")).sources;
const profiles = () => JSON.parse(readFileSync(new URL("../../src/data/cards.json", import.meta.url), "utf8"));
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

test("named FAB public-product receipts reproduce just the three scoped records", () => {
  const applied = new Set();
  for (const slug of Object.keys(FAB_EXPANSION_PRODUCTS)) {
    const data = parseFabExpansion(fixture(), slug);
    assert.ok(data, slug);
    const card = profiles()[slug];
    assert.equal(card.annualFee.amount, data.annualFee);
    assert.equal(card.eligibility.publishedMinMonthlyIncome, data.publishedIncome);
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.vatPolicy, "inclusive");
    assert.equal(card.applyUrl, data.productUrl);
    assert.equal(card.fxFee, null);
    assert.equal(card.earnRates.everythingElse, null);
    assert.ok(!applied.has(data.productUrl));
    applied.add(data.productUrl);
    if (data.waiver) {
      assert.equal(typeof card.annualFeeWaiver, "string");
      assert.match(card.annualFeeWaiver, new RegExp(data.waiver.threshold.toLocaleString("en-GB")));
    }
  }
  assert.match(profiles()["fab-gems-world"].annualFeeWaiver, /eligible new-to-bank customers, not all applicants/);
  assert.match(profiles()["fab-gems-world"].annualFeeWaiver, /School fees do not count/);
  assert.equal(parseFabExpansion(fixture(), "fab-travel")?.travelFxNote, true);
  assert.ok(!profiles()["fab-travel"].categories.includes("cashback"), "FAB Rewards are not cash cashback");
});

test("conditional FAB standard prices are explicitly labelled and never an unconditional fee winner", () => {
  const data = profiles();
  for (const name of ["fab-adnoc-rewards", "fab-gems-world"]) {
    assert.equal(annualFeeLabel(data[name]).qual, "waiver terms apply");
    const row = cardComparisonRows(data[name], data["fab-travel"]).find(r => r.key === "annualFee");
    assert.match(row?.leftValue ?? "", /waiver terms apply/);
    assert.equal(row?.winner, "none");
  }
  const finder = readFileSync(new URL("../../src/pages/cards/finder/index.astro", import.meta.url), "utf8");
  assert.equal([...finder.matchAll(/evidence\.annualFeePending \|\| card\.standardFeeConditions \? null/g)].length, 2);
});

test("drift, conflicting sources, repeated rows and absent scoped receipts fail closed", () => {
  const altered = (id: string, edit: (s: string) => string) => { const rows = fixture();
    const source = rows.find((row: { id: string }) => row.id === id);
    source.text = edit(source.text); source.fixtureTextSha256 = hash(source.text); return rows; };
  assert.equal(parseFabExpansion(fixture(), "fab-world-elite"), null);
  assert.equal(parseFabExpansion(altered("fab-fee-schedule", s => s.replace("FAB GEMS World |  | 418.95", "FAB GEMS World |  | 420")), "fab-gems-world"), null);
  assert.equal(parseFabExpansion(altered("fab-fee-schedule", s => s + "\nFAB GEMS World |  | 418.95 | Free |"), "fab-gems-world"), null);
  assert.equal(parseFabExpansion(altered("fab-gems-waiver-product", s => s.replace("24,000", "24,001")), "fab-gems-world"), null);
  assert.equal(parseFabExpansion(altered("fab-travel-fx", s => s.replace("charges not applicable", "charges applicable")), "fab-travel"), null);
  assert.equal(parseFabExpansion(altered("fab-adnoc-apply", s => s.replace("apply.bankfab.com", "not-the-issuer.invalid")), "fab-adnoc-rewards"), null);
  const rows = fixture(); rows.find((s: { id: string }) => s.id === "fab-adnoc-salary").sourceBodySha256 = "0".repeat(64);
  assert.equal(parseFabExpansion(rows, "fab-adnoc-rewards"), null);
  assert.equal(parseFabExpansion(fixture().filter((s: { id: string }) => s.id !== "fab-adnoc-waiver"), "fab-adnoc-rewards"), null);
});
