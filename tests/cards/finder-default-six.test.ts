import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { getActiveCards } from "../../src/lib/cardsData.ts";

/**
 * /cards/finder/ renders every card and lets an inline script hide all but
 * the best six. Painting 58 tiles and collapsing to 6 about 160 ms later
 * cost CLS 0.248 at 1280px (2026-09-06 audit, F-027), so the page now
 * server-renders the six the script will choose on a bare URL and starts
 * the rest hidden.
 *
 * That only works while the two agree. These tests pin the agreement: the
 * page's own frontmatter expression, and the inline script's score() and
 * filter, must keep picking the same six.
 */
const SOURCE = readFileSync("src/pages/cards/finder/index.astro", "utf8");

/** The default ranking, written out once here as the reference. */
function defaultSix(): string[] {
  return getActiveCards()
    .filter((card) => card.discontinuedForNewApplicants === undefined)
    .map((card) => ({
      slug: card.slug,
      score: card.earnRates.everythingElse ?? 0,
      annualFee: card.annualFee.amount,
    }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.annualFee - b.annualFee))
    .slice(0, 6)
    .map((c) => c.slug);
}

test("the default six are six real, distinct, non-discontinued cards", () => {
  const six = defaultSix();
  assert.equal(six.length, 6);
  assert.equal(new Set(six).size, 6);
  const active = new Set(
    getActiveCards()
      .filter((c) => c.discontinuedForNewApplicants === undefined)
      .map((c) => c.slug),
  );
  for (const slug of six) assert.ok(active.has(slug), `${slug} is not an active card`);
});

test("the page still derives its pre-rendered set the documented way", () => {
  // If any of these move, the SSR set and the client scorer can disagree
  // silently and the layout shift comes back.
  assert.match(SOURCE, /const defaultTopSlugs = cardsWithBanks/);
  assert.match(SOURCE, /const defaultRank = new Map\(defaultTopSlugs\.map\(/);
  assert.match(SOURCE, /card\.discontinuedForNewApplicants === undefined/);
  assert.match(SOURCE, /card\.earnRates\.everythingElse \?\? 0/);
  assert.match(SOURCE, /b\.score !== a\.score \? b\.score - a\.score : a\.annualFee - b\.annualFee/);
  assert.match(SOURCE, /\.slice\(0, 6\)/);
});

test("the inline script's default score and filter are the ones mirrored", () => {
  // score() with spend "general" and prefer "none" reduces to the
  // everything-else rate; the default filter only drops discontinued cards.
  assert.match(SOURCE, /if \(key === "general"\) return rates\.everythingElse \|\| 0;/);
  assert.match(SOURCE, /if \(!p\.includeLegacy && c\.discontinued\) return false;/);
  assert.match(SOURCE, /includeLegacy: oneOf\? .*|includeLegacy: \(p\.get\("include_legacy"\) \|\| "false"\) === "true",/);
  assert.match(SOURCE, /return a\.annualFee - b\.annualFee;/);
  assert.match(SOURCE, /ranked\.slice\(0, 6\)/);
});
