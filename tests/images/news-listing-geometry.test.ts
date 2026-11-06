// Source-contract guards, not rendered Safari certification. These fail
// loudly if photos/card art regain different compact sizing rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/components/NewsListingVisual.astro", import.meta.url), "utf8");
const css = source.slice(source.indexOf("<style>"));
const rule = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${selector} must exist`);
  return css.slice(start, css.indexOf("}", start) + 1);
};

test("all compact news visual kinds share one responsive outer width", () => {
  assert.match(rule(".dp-news-visual.is-compact"), /inline-size: clamp\(88px, 24vw, 128px\)/);
  assert.equal((css.match(/clamp\(88px, 24vw, 128px\)/g) ?? []).length, 1);
  assert.doesNotMatch(css, /clamp\(68px, 12vw|clamp\(88px, 14vw|block-size: 88px/);
  for (const viewport of [320, 390, 430, 440, 448, 844, 1024, 1440]) {
    const width = Math.min(128, Math.max(88, viewport * .24));
    assert.ok(width >= 88 && width <= 128);
    assert.ok(viewport - 48 - 18 - width >= 166, `headline space at ${viewport}px`);
  }
});

test("the shared media frame is 3:2 and the credit has a separate reserved track", () => {
  assert.match(rule(".dp-news-visual.is-compact > :first-child"), /aspect-ratio: 3 \/ 2/);
  assert.match(rule(".dp-news-visual.is-compact"), /grid-template-rows: auto minmax\(1\.2em, auto\)/);
  assert.match(source, /!compact && <span>Card image: Liv<\/span>/);
  const frameEnd = source.indexOf("\n)}\n{compact && <span class=\"dp-news-visual-credit\"");
  assert.ok(frameEnd > source.indexOf("data-news-issuer-art=\"liv\""), "compact credit follows all media branches");
  assert.match(source, /livCorrectionArt \? "Card image: Liv" : ""/);
});

test("photographs cover their frame but actual issuer artwork remains contained", () => {
  assert.match(rule(".dp-news-photo.is-compact :global(img)"), /block-size: 100%[\s\S]*object-fit: cover/);
  assert.match(rule(".dp-news-issuer-art img"), /object-fit: contain/);
  assert.match(rule(".dp-news-preview img"), /object-fit: contain/);
  assert.match(rule(".dp-news-issuer-art.is-compact"), /grid-template: minmax\(0, 1fr\) \/ minmax\(0, 1fr\)/);
  assert.doesNotMatch(rule(".dp-news-issuer-art.is-compact"), /inline-size:|block-size:/);
});

test("compact delivery sizes follow the same slot without changing feature geometry", () => {
  assert.match(source, /const compactSizes = "clamp\(88px, 24vw, 128px\)"/);
  assert.match(source, /compact \? compactSizes : LISTING_SIZES\.tile/);
  assert.match(source, /sizes=\{compact \? compactSizes : "144px"\}/);
  assert.match(rule(".dp-news-issuer-art"), /block-size: clamp\(140px, 26vw, 240px\)/);
  assert.match(rule(".dp-news-visual"), /display: contents/);
});

test("disclosures remain attached and unsupported IDs do not gain an empty frame", () => {
  assert.match(source, /const hasVisual = Boolean\(livCorrectionArt \|\| photo \|\| kind\)/);
  assert.match(source, /\{hasVisual && <span class:list=/);
  assert.match(source, /dp-news-photo\.is-compact :global\(\.dp-ai-label\)/);
  assert.match(source, /dp-news-photo\.is-compact :global\(\.dp-ai-figure\)/);
});
