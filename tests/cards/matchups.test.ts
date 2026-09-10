import { strict as assert } from "node:assert";
import { test } from "node:test";
import { cardMatchups, matchupSlug, matchupsForCard } from "../../src/data/cardMatchups.ts";
import { getCardData, getActiveCards } from "../../src/lib/cardsData.ts";

/**
 * Head-to-head pages exist because /cards/compare/ had no indexable pair URL
 * and its ?cards= state could not render in a static build. They stay useful
 * only while every pair carries a written verdict — a templated sentence per
 * pair is the thin-content shape the 2026-07-27 honest-nav rule forbids.
 */

test("every matchup names two distinct cards that exist and are live", () => {
  const live = new Set(getActiveCards().map((c) => c.slug));
  for (const m of cardMatchups) {
    assert.notEqual(m.left, m.right, `${matchupSlug(m)} compares a card with itself`);
    assert.ok(getCardData(m.left), `${m.left} is not in cards.json`);
    assert.ok(getCardData(m.right), `${m.right} is not in cards.json`);
    assert.ok(live.has(m.left), `${m.left} is not an active card`);
    assert.ok(live.has(m.right), `${m.right} is not an active card`);
  }
});

test("every matchup carries a real verdict, not a placeholder", () => {
  for (const m of cardMatchups) {
    assert.ok(m.deck.length > 30, `${matchupSlug(m)} has no usable deck`);
    assert.ok(
      m.verdict.length >= 2,
      `${matchupSlug(m)} needs at least two paragraphs of verdict`,
    );
    for (const para of m.verdict) {
      assert.ok(
        para.trim().length > 80,
        `${matchupSlug(m)} has a verdict paragraph too short to say anything`,
      );
    }
  }
});

test("verdicts do not restate figures the spec table already carries", () => {
  // A number in prose is a number that goes stale silently when cards.json
  // moves. The table below the verdict is the single place figures appear.
  for (const m of cardMatchups) {
    for (const para of m.verdict) {
      assert.ok(
        !/AED\s*[\d,]/.test(para),
        `${matchupSlug(m)} states a dirham figure in prose: "${para.slice(0, 60)}…"`,
      );
      assert.ok(
        !/\d+(\.\d+)?\s*%/.test(para),
        `${matchupSlug(m)} states a percentage in prose: "${para.slice(0, 60)}…"`,
      );
    }
  }
});

test("slugs are unique and each card's matchups are findable", () => {
  const slugs = cardMatchups.map(matchupSlug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate matchup slug");
  for (const m of cardMatchups) {
    assert.ok(matchupsForCard(m.left).includes(m));
    assert.ok(matchupsForCard(m.right).includes(m));
  }
  assert.equal(matchupsForCard("a-card-that-does-not-exist").length, 0);
});
