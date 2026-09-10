import { strict as assert } from "node:assert";
import { test } from "node:test";
import { PERK_PAGES, PERK_PAGE_MIN_CARDS } from "../../src/data/perkPages.ts";
import { getCardsWithFeature, getActiveCards } from "../../src/lib/cardsData.ts";
import { FEATURE_CHIP_LABELS } from "../../src/lib/cardsDataFormat.ts";

/**
 * getCardsWithFeature() shipped with the typed perk union and had zero call
 * sites, so fourteen queryable perk types were queried by nothing. These
 * pages use three of them. The other eleven cover one to five cards each,
 * and a comparison page listing one card is a link with a table around it —
 * the thin-content shape the 2026-07-27 honest-nav rule forbids.
 */

test("every perk page has enough cards to be worth a page", () => {
  for (const perk of PERK_PAGES) {
    const count = getCardsWithFeature(perk.feature).length;
    assert.ok(
      count >= PERK_PAGE_MIN_CARDS,
      `/cards/perks/${perk.slug}/ lists ${count} cards, below the ${PERK_PAGE_MIN_CARDS} threshold`,
    );
  }
});

test("no perk type has grown past the threshold without getting a page", () => {
  // The other direction: this fails when the card set grows and a perk now
  // deserves a page nobody has added.
  const listed = new Set(PERK_PAGES.map((p) => p.feature));
  const missing: string[] = [];
  for (const type of Object.keys(FEATURE_CHIP_LABELS)) {
    if (listed.has(type as never)) continue;
    if (getCardsWithFeature(type as never).length >= PERK_PAGE_MIN_CARDS) {
      missing.push(type);
    }
  }
  assert.deepEqual(
    missing,
    [],
    "these perk types now clear the threshold and should get a page",
  );
});

test("perk pages are distinct, named, and describe themselves", () => {
  const slugs = PERK_PAGES.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate perk slug");
  for (const perk of PERK_PAGES) {
    assert.match(perk.slug, /^[a-z0-9-]+$/);
    assert.ok(FEATURE_CHIP_LABELS[perk.feature], `${perk.feature} is not a known perk type`);
    assert.ok(perk.heading.length > 15);
    assert.ok(perk.description.length > 60, `${perk.slug} needs a real meta description`);
  }
});

test("every card on a perk page really carries that feature", () => {
  const active = new Set(getActiveCards().map((c) => c.slug));
  for (const perk of PERK_PAGES) {
    for (const card of getCardsWithFeature(perk.feature)) {
      assert.ok(active.has(card.slug), `${card.slug} is not active`);
      assert.ok(
        card._features.some((f) => f.type === perk.feature),
        `${card.slug} does not carry ${perk.feature}`,
      );
    }
  }
});
