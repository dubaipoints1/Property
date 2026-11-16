import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 16 Nov 2026 (owner: "yes to both"): the limited label is "Source checked
// <date>". It still never says "Verified" for a partial profile; each
// unconfirmed figure carries its own "Pending".
test("homepage featured cards use shared pending salary and limited source-record labels", () => {
  const page = readFileSync("src/pages/index.astro", "utf8");
  assert.match(page, /minSalary: cardSalaryLabel\(c, \{ perMonth: true \}\)/);
  assert.match(page, /limited: cardHasUnresolvedTerms\(c\)/);
  assert.match(page, /c\.limited \? "Source checked" : "Verified"/);
  assert.doesNotMatch(page, /terms pending/);
  assert.doesNotMatch(page, /desc: `Rank \$\{cards\.length\} cards/);
  assert.doesNotMatch(page, /against verified card data|verified card database/);
  assert.match(page, /const strategyCards = cards\.filter\(hasUsableGenericEarnRate\)/);
  for (const group of ["travelTop", "cashbackTop", "firstTop"]) {
    assert.match(page, new RegExp(`const ${group} = strategyCards`));
  }
  assert.doesNotMatch(page, /earnRates\.everythingElse \?\? 0/);
  assert.match(page, /compareKnownAnnualFees\(cardFeeNeedsReview\(a, "annualFee"\) \? null : a\.annualFee\.amount/);
  assert.doesNotMatch(page, /a\.annualFee\.amount - b\.annualFee\.amount/);
  const perks = readFileSync("src/pages/cards/perks/[perk].astro", "utf8");
  assert.match(perks, /compareKnownAnnualFees\(cardFeeNeedsReview\(a, "annualFee"\) \? null : a\.annualFee\.amount/);
});
