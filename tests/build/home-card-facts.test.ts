import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCardData } from "../../src/lib/cardsData.ts";
import { cardFxFeeLabel } from "../../src/lib/cardFeeFacts.ts";

test("homepage facts contain real long FX qualifications without forcing a wide intrinsic grid", () => {
  const source = readFileSync("src/pages/index.astro", "utf8");
  assert.match(source, /\.hp-cards > li, \.hp-card \{ min-inline-size: 0;/);
  assert.match(source, /\.hp-facts \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(source, /\.hp-facts div \{ min-inline-size: 0;/);
  assert.match(source, /\.hp-facts div:nth-child\(n \+ 3\) \{ grid-column: 1 \/ -1;/);
  const rule = source.match(/\.hp-facts dd \{([^}]+)\}/)?.[1];
  assert.ok(rule); assert.match(rule, /white-space: normal/); assert.match(rule, /overflow-wrap: anywhere/);
  assert.doesNotMatch(rule, /white-space: nowrap/);
  assert.ok(cardFxFeeLabel(getCardData("fab-etihad-guest-infinite")!).length > 60, "exercise a real qualified label, not only a short percentage");
  assert.match(source, /<dt>FX fee<\/dt><dd>\{c\.fx\}<\/dd>/, "the disclosure remains complete, not truncated to fix layout");
});
