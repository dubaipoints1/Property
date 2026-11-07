import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("homepage featured cards use shared pending salary and limited source-record labels", () => {
  const page = readFileSync("src/pages/index.astro", "utf8");
  assert.match(page, /minSalary: cardSalaryLabel\(c, \{ perMonth: true \}\)/);
  assert.match(page, /limited: cardHasUnresolvedTerms\(c\)/);
  assert.match(page, /c\.limited \? "Source record" : "Verified"/);
  assert.match(page, /c\.limited \? " — terms pending" : ""/);
  assert.doesNotMatch(page, /desc: `Rank \$\{cards\.length\} cards/);
  assert.doesNotMatch(page, /against verified card data|verified card database/);
  assert.match(page, /const strategyCards = cards\.filter\(hasUsableGenericEarnRate\)/);
  for (const group of ["travelTop", "cashbackTop", "firstTop"]) {
    assert.match(page, new RegExp(`const ${group} = strategyCards`));
  }
  assert.doesNotMatch(page, /earnRates\.everythingElse \?\? 0/);
});
