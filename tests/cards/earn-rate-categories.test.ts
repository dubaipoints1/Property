import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { getAllCards, CardDataSchema } from "../../src/lib/cardsData.ts";
import { cardFieldHeld } from "../../src/lib/cardPublicFacts.ts";

/**
 * Zod's `.object()` strips keys it does not declare, so an earn-rate
 * category present in cards.json but absent from the EarnRates schema is
 * deleted at module load and reaches no page at all.
 *
 * That is not hypothetical. `partnerBrands` sat on 22 cards and was dropped
 * this way for sixteen weeks, including on every co-brand review, whose
 * EarnRateTable had a comment from 20 May 2026 explaining that the row
 * existed so the headline partner rate "doesn't silently drop from the
 * table". `utilities` (12 cards) and `insurance` (9) went the same way.
 *
 * This test compares the raw JSON against what survives validation.
 */

const raw = JSON.parse(readFileSync("src/data/cards.json", "utf8")) as Record<
  string,
  { earnRates: Record<string, unknown> }
>;

test("the schema declares every earn-rate category the data carries", () => {
  const dropped = new Map<string, string[]>();
  for (const card of getAllCards()) {
    const before = raw[card.slug].earnRates;
    // Schema stripping is different from an intentional public source hold.
    const after = CardDataSchema.parse(raw[card.slug]).earnRates as unknown as Record<string, unknown>;
    for (const key of Object.keys(before)) {
      if (key === "_caps") continue;
      if (after[key] === undefined) {
        dropped.set(key, [...(dropped.get(key) ?? []), card.slug]);
      }
    }
  }
  assert.deepEqual(
    Object.fromEntries(dropped),
    {},
    "these categories are in cards.json but the EarnRates schema drops them",
  );
});

test("the review table can label every category that survives", () => {
  // A rate the reader never sees is the same defect one layer along.
  const labels = readFileSync("src/components/cards/EarnRateTable.astro", "utf8");
  const seen = new Set<string>();
  for (const card of getAllCards()) {
    for (const key of Object.keys(card.earnRates)) {
      if (key !== "_caps") seen.add(key);
    }
  }
  const unlabelled = [...seen].filter((k) => !new RegExp(`^\\s*${k}:\\s*"`, "m").test(labels));
  assert.deepEqual(unlabelled.sort(), [], "no CATEGORY_LABELS entry for these");
});

test("every canonical partner rate survives schema validation and only a source hold can withhold it publicly", () => {
  const withPartner = Object.entries(raw).filter(([, card]) => card.earnRates.partnerBrands !== undefined);
  assert.ok(withPartner.length > 0);
  const visible = new Map(getAllCards().map(card => [card.slug, card]));
  for (const [slug, source] of withPartner) {
    assert.equal(CardDataSchema.parse(source).earnRates.partnerBrands, source.earnRates.partnerBrands, slug);
    const card = visible.get(slug)!;
    const held = card._provenance.earnRates === "needs-review" || cardFieldHeld(card, "earnUnit")
      || cardFieldHeld(card, "earnRates._caps") || cardFieldHeld(card, "earnRates.partnerBrands");
    assert.equal(card.earnRates.partnerBrands, held ? undefined : source.earnRates.partnerBrands, slug);
  }
});
