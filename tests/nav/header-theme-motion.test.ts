// Source guards complement the actual dark/scrolled browser check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/components/Header.astro", import.meta.url), "utf8");
const news = readFileSync(new URL("../../src/layouts/NewsIndexLayout.astro", import.meta.url), "utf8");

test("the header's scoped dark rule disables its light scroll-animation keyframe", () => {
  assert.match(source, /:global\(\[data-theme="dark"\]\) \.dp-header\s*\{\s*animation: none;/);
  assert.ok(source.indexOf(':global([data-theme="dark"]) .dp-header') > source.indexOf("@keyframes dp-header-scrolled"));
});

test("reduced-motion header stays in its readable base state", () => {
  const reduced = source.slice(source.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /\.dp-header\s*\{\s*animation: none;/);
});

test("the Latest reporting direct anchor clears the measured sticky header", () => {
  assert.match(news, /#news-latest-heading\s*\{\s*scroll-margin-block-start: calc\(var\(--dp-sticky-header-height, 102px\) \+ 16px\)/);
});
