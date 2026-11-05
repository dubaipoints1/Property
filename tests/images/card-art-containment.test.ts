import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("issuer art has a bounded image box even inside prose figures", () => {
  const source = readFileSync("src/components/CardImage.astro", "utf8");
  assert.match(source, /grid-template-rows: minmax\(0, 1fr\)/);
  assert.match(source, /\.dp-card-art img\[data-card-art\]/);
  assert.match(source, /min-height: 0/);
  assert.match(source, /max-height: 100%/);
  assert.match(source, /object-fit: contain/);
});

test("the Liv correction thumbnail uses complete credited issuer art, not a cropped portrait photo", () => {
  const source = readFileSync("src/components/NewsListingVisual.astro", "utf8");
  assert.match(source, /livCorrectionArt = id === "uae-card-change-log-liv-eligibility-vat-correction"/);
  assert.match(source, /\{livCorrectionArt \? \(/);
  assert.match(source, /data-news-issuer-art="liv"/);
  assert.match(source, /Card image: Liv/);
  assert.match(source, /\.dp-news-issuer-art img[\s\S]*?object-fit: contain/);
});
