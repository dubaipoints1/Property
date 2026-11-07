import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const legacyScopedGuides = ["expat-starter", "dubai-brunch-on-credit-card-discounts"];
const rewrittenGuides = ["best-entry-level-cards-2026", "best-no-annual-fee-cards-uae-2026", "best-cashback-cards-uae-2026"];
const guide = (slug: string) => readFileSync(`src/content/guides/${slug}.mdx`, "utf8");
test("the retained narrow guide corrections preserve their original assigned-limit and everyday-rate holds", () => {
  for (const file of legacyScopedGuides) {
    const text = guide(file);
    assert.match(text, /assigned credit-card limit/, file);
    assert.match(text, /everyday local rate remains Pending/, file);
    assert.match(text, /not a whole-guide financial-data refresh/, file);
    assert.doesNotMatch(text, /5% on all dining, uncapped|5% on all dining \(no cap\)|5% on dining and delivery, uncapped|dining bucket — like the Mashreq Cashback|Mashreq Cashback and pays nothing, ever/, file);
  }
});
test("rewritten guides consume canonical comparisons rather than preserve unrestricted Mashreq or 365 rankings", () => {
  for (const file of rewrittenGuides) {
    const text = guide(file);
    assert.match(text, /import CardComparison from "~\/components\/cards\/CardComparison\.astro"/, file);
    assert.match(text, /<CardComparison cards=\{\[/, file);
    assert.match(text, /pending|unresolved/i, file);
    assert.doesNotMatch(text, /AED 115\.75|AED 1,389|AED 3,138|AED 590 a year more than Mashreq/, file);
    assert.doesNotMatch(text, /5% on all dining, uncapped|5% on all dining \(no cap\)|5% on dining and delivery, uncapped|else, uncapped|<AEDValueBreakdown/, file);
  }
});
test("the starter guide separates qualification, salary transfer and bank approval without hard-coded thresholds", () => {
  const entry = guide("best-entry-level-cards-2026");
  assert.match(entry, /not an approval shortlist/i);
  assert.match(entry, /salary.*credit-limit routes/i);
  assert.match(entry, /salary transfer|salary-transfer/i);
  assert.doesNotMatch(entry, /a 2% FX fee|All issue at AED|Every figure comes.*verified/);
  assert.doesNotMatch(entry, /3% non-AED — uncapped|\|[^\n]*Pending full qualification[^\n]*AED/);
  const skywardsPair = guide("expat-starter").split("\n").find(line => line.startsWith("| **Free everyday + Skywards flagship**"));
  assert.ok(skywardsPair); assert.doesNotMatch(skywardsPair, /DragonPass|DXB\/AUH lounge/);
  assert.match(skywardsPair, /current card profile for lounge network/);
});
