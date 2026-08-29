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
