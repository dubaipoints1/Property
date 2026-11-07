import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const refreshedGuides = [
  "best-cashback-cards-uae-2026", "best-dining-cards-uae-2026",
  "best-entry-level-cards-2026", "best-fuel-cards-uae-2026",
  "best-lounge-access-cards-uae-2026", "best-no-annual-fee-cards-uae-2026",
  "best-skywards-cards-uae-2026", "uae-credit-card-eligibility-2026",
];

test("the eight refreshed guides use valid canonical comparisons instead of parallel financial rankings", () => {
  for (const slug of refreshedGuides) {
    const guide = readFileSync(`src/content/guides/${slug}.mdx`, "utf8");
    assert.match(guide, /import CardComparison from "~\/components\/cards\/CardComparison\.astro"/, slug);
    const comparisons = [...guide.matchAll(/<CardComparison cards=\{\[([^\]]+)\]\}/g)];
    assert.equal(comparisons.length, 2, `${slug}: retain two explicit pair comparisons`);
    for (const comparison of comparisons) {
      assert.equal([...comparison[1].matchAll(/"([^"]+)"/g)].length, 2, `${slug}: the component requires exactly two cards`);
    }
    assert.match(guide, /pending|unresolved|unconfirmed/i, slug);
    assert.doesNotMatch(guide, /<AEDValueBreakdown|None in our data|uncapped 5%|no cap and no floor|no monthly cap|no fee and no fine print/, slug);
    assert.doesNotMatch(guide, /\|\s*(?:AED\s+[\d,]+|[\d.]+%|Uncapped)\s*\|/i, `${slug}: no hard-coded financial ranking cells`);
  }
});

test("fuel guide keeps current provider restrictions, different LuLu currencies and bounded review scope", () => {
  const guide = readFileSync("src/content/guides/best-fuel-cards-uae-2026.mdx", "utf8");
  assert.match(guide, /direct-provider or Dubai Now/);
  assert.match(guide, /not all digital spending or app-store payments/);
  assert.match(guide, /not a new whole-card verification/);
  assert.match(guide, /Do not reuse one issuer's points-to-dirham conversion for the other/);
  assert.match(guide, /disputed fuel or utility rate remains pending/);
  assert.doesNotMatch(guide, /LuLu Points are valued at.*AED 0\.01|None in our data|2 LuLu Points per AED 1 \(2%\)/);
});
