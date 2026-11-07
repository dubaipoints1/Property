import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const files = ["best-entry-level-cards-2026", "expat-starter", "best-no-annual-fee-cards-uae-2026", "best-cashback-cards-uae-2026", "dubai-brunch-on-credit-card-discounts"];
const guide = (slug: string) => readFileSync(`src/content/guides/${slug}.mdx`, "utf8");
test("the five bounded guide corrections retain the assigned-limit and everyday-rate holds, not a full refresh claim", () => {
  for (const file of files) {
    const text = guide(file);
    assert.match(text, /assigned credit-card limit/, file);
    assert.match(text, /everyday local rate remains Pending/, file);
    assert.match(text, /not a whole-guide financial-data refresh/, file);
    assert.doesNotMatch(text, /5% on all dining, uncapped|5% on all dining \(no cap\)|5% on dining and delivery, uncapped|dining bucket — like the Mashreq Cashback|Mashreq Cashback and pays nothing, ever/, file);
  }
});
test("Mashreq and unmodelled 365 totals are not quietly retained as numeric annual rankings", () => {
  for (const file of ["best-no-annual-fee-cards-uae-2026", "best-cashback-cards-uae-2026"]) {
    const text = guide(file);
    const rows = text.split("\n").filter(line => line.startsWith("| [Mashreq Cashback]") && /Not estimated/.test(line));
    assert.equal(rows.length, 1, file);
    assert.doesNotMatch(rows[0], /AED \d/, file);
    assert.doesNotMatch(text, /AED 115\.75|AED 1,389|AED 3,138|AED 590 a year more than Mashreq/, file);
    assert.match(text, /Citi['’]s cap\s+wording/, file);
  }
  assert.match(guide("best-cashback-cards-uae-2026"), /ADCB 365 Cashback.*Not estimated/);
});
test("confirmed qualification and issuer-only FX conflicts no longer masquerade as universal entry eligibility", () => {
  const entry = guide("best-entry-level-cards-2026");
  for (const name of ["HSBC Live+", "ADCB 365 Cashback", "ADCB Essential Cashback"]) {
    const row = entry.split("\n").find(line => line.startsWith(`| [${name}]`));
    assert.ok(row); assert.match(row, /Pending full qualification/);
  }
  assert.doesNotMatch(entry, /a 2% FX fee|All issue at AED|Every figure comes.*verified/);
  // Deliberately retained historical Citi wording, not silently re-certified.
  assert.match(entry, /3% non-AED — uncapped/);
  assert.match(guide("best-cashback-cards-uae-2026"), /else, uncapped/);
  const talabat = guide("best-no-annual-fee-cards-uae-2026").split("\n").find(line => line.startsWith("| [ADCB Talabat]") && line.includes("CardSalaryMinimum"));
  assert.ok(talabat); assert.match(talabat, /CardSalaryMinimum card="adcb-talabat"/);
  const skywardsPair = guide("expat-starter").split("\n").find(line => line.startsWith("| **Free everyday + Skywards flagship**"));
  assert.ok(skywardsPair); assert.doesNotMatch(skywardsPair, /DragonPass|DXB\/AUH lounge/);
  assert.match(skywardsPair, /current card profile for lounge network/);
});
