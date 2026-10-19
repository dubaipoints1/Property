// Nav-chrome integrity — the header and footer nav arrays are data no
// schema validates, and they render on every page. Two defects survived
// months there before the 29 Aug 2026 audit: the mega-menu served the
// retracted Skywards 3.5-fils / Etihad 2.8-fils valuations (Fact-Checker
// redline, 11 June 2026) because it carried its own copies of the
// figures, and a renamed calculator row was only half-applied.
//
// These tests make the fils half mechanical: no fils figure may be
// hard-coded in nav source — every one must come from
// src/lib/valuations.ts (dpValueSub), the same module /valuations/
// renders from. Link existence is covered post-build by
// scripts/ci/check-links.mjs, which sweeps the header on every page.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { programmeValuations, dpValueFils, dpValueSub } from "../../src/lib/valuations";

const headerSrc = readFileSync(
  fileURLToPath(new URL("../../src/components/Header.astro", import.meta.url)),
  "utf8",
);
const footerSrc = readFileSync(
  fileURLToPath(new URL("../../src/components/Footer.astro", import.meta.url)),
  "utf8",
);

test("no hard-coded fils figure in header nav source", () => {
  // A literal like `sub: "3.5 fils · DP value"` is the forked-figure
  // pattern; valuations must flow through dpValueSub().
  const literals = headerSrc.match(/["'`][^"'`\n]*fils[^"'`\n]*["'`]/g) ?? [];
  const offending = literals.filter((s) => /\d/.test(s));
  assert.deepEqual(
    offending,
    [],
    `header carries hard-coded fils figures — import dpValueSub from ~/lib/valuations instead: ${offending.join(", ")}`,
  );
});

test("no hard-coded fils figure in footer nav source", () => {
  const literals = footerSrc.match(/["'`][^"'`\n]*fils[^"'`\n]*["'`]/g) ?? [];
  const offending = literals.filter((s) => /\d/.test(s));
  assert.deepEqual(offending, []);
});

test("header uses the valuations module", () => {
  assert.match(headerSrc, /from ["']~\/lib\/valuations["']/);
});

test("dpValueSub renders the published baseline", () => {
  assert.equal(dpValueSub("skywards"), "2.0 fils · DP value");
  assert.equal(dpValueSub("etihad-guest"), "2.0 fils · DP value");
  assert.equal(dpValueSub("no-such-programme"), undefined);
});

test("published baselines match the Fact-Checker ruling (2-fil cost basis)", () => {
  // The 12 June 2026 Chairman ruling: card-review arithmetic uses the
  // conservative cost-basis fils values. Skywards and Etihad Guest are
  // both published at 2.0; the retracted illustrative figures (3.5 /
  // 2.8) must not return.
  assert.equal(dpValueFils("skywards"), 2.0);
  assert.equal(dpValueFils("etihad-guest"), 2.0);
});

test("every nav href in header/footer is root-relative and well-formed", () => {
  for (const src of [headerSrc, footerSrc]) {
    const hrefs = [...src.matchAll(/href: ["']([^"']+)["']/g)].map((m) => m[1]);
    for (const href of hrefs) {
      assert.ok(href.startsWith("/"), `nav href not root-relative: ${href}`);
      assert.ok(!href.includes(" "), `nav href contains whitespace: ${href}`);
      assert.notEqual(href, "/#", `placeholder href in nav: ${href}`);
      assert.ok(href.endsWith("/"), `nav href missing trailing slash: ${href}`);
    }
  }
});

test("every programme slug in valuations is unique", () => {
  const slugs = programmeValuations.map((p) => p.slug).filter(Boolean);
  assert.equal(new Set(slugs).size, slugs.length);
});

// 19 Oct 2026 UX review (Chairman direction: "can we do something to the
// menu maybe?"): desktop bar and mobile drawer carry ONE information
// architecture — same six entries, same labels, same order. Before this the
// two surfaces used different vocabularies ("Credit cards"/"Cards", "Earn
// miles"/"Points + Miles", a mobile-only "Travel") and the salary-transfer
// tracker was missing from the desktop bar.
const PRIMARY = ["Cards", "Salary tracker", "Points &amp; miles", "Deals", "News", "Guides"];

function primaryLabels(block: string): string[] {
  // Top-level entries only: direct <a> children of the desktop nav and
  // the mega-wrap trigger links, or .dp-nav-row rows in the drawer.
  const labels: string[] = [];
  const re = /<(?:a|label)[^>]*class=(?:\{`?)?["`]?(?:dp-nav-row[^"`]*|[^"`]*)["`]?[^>]*>\s*(?:<span>)?([A-Z][A-Za-z &;]+?)\s*(?:<\/span>|<span class="dp-mega-caret"|<span class="dp-nav-expand-arrow"|\{liveDealCount|<\/a>)/g;
  for (const m of block.matchAll(re)) labels.push(m[1].trim());
  return labels;
}

test("desktop primary nav: Cards · Salary tracker · Points & miles · Deals · News · Guides", () => {
  const start = headerSrc.indexOf('<nav class="dp-header-nav"');
  const end = headerSrc.indexOf("</nav>", start);
  const block = headerSrc.slice(start, end)
    // drop the mega panels' rows so only top-level triggers remain
    .replace(/<div class="dp-megapanel"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, "");
  assert.deepEqual(primaryLabels(block), PRIMARY);
});

test("mobile drawer carries the same six primary entries in the same order", () => {
  const start = headerSrc.indexOf('<nav class="dp-nav-overlay-body"');
  const end = headerSrc.indexOf('<div class="dp-nav-tools-block"', start);
  const block = headerSrc.slice(start, end)
    .replace(/<div class="dp-nav-panel"[\s\S]*?\n    <\/div>\n/g, "");
  assert.deepEqual(primaryLabels(block), PRIMARY);
});

test("salary-transfer tracker is a primary entry on both surfaces", () => {
  const desktop = headerSrc.slice(headerSrc.indexOf('<nav class="dp-header-nav"'));
  assert.match(desktop.slice(0, desktop.indexOf("</nav>")), /href="\/salary-transfer\/"[^>]*>Salary tracker</);
  const drawer = headerSrc.slice(headerSrc.indexOf('<nav class="dp-nav-overlay-body"'));
  assert.match(drawer, /href="\/salary-transfer\/">\s*<span>Salary tracker<\/span>/);
});

test("deals count is a badge, not running text, and banks stay reachable", () => {
  assert.doesNotMatch(headerSrc, /live`/, "the old `Deals · N live` label string is back");
  assert.match(headerSrc, /class="dp-nav-count"/);
  assert.match(headerSrc, /href: "\/banks\/"/, "Banks must stay reachable inside the Cards menu");
  assert.match(footerSrc, /href: "\/banks\/"/, "Banks must stay reachable in the footer");
});

test("drawer carets use brand tokens, not the legacy link blue", () => {
  const rule = headerSrc.match(/\.dp-nav-expand-arrow \{[^}]*\}/)?.[0] ?? "";
  assert.match(rule, /color: var\(--green\)/);
  assert.doesNotMatch(rule, /var\(--link\)/);
});
