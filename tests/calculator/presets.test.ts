import { test } from "node:test";
import assert from "node:assert/strict";
import { SPEND_PRESETS, presetTotal } from "../../src/data/spendProfiles.ts";
import {
  rankCards,
  SPEND_CATEGORIES,
  type CardForCalc,
} from "../../src/components/islands/RewardsCalculator.tsx";
import { getActiveCards } from "../../src/lib/cardsData.ts";

test("every preset states all seven categories as non-negative round dirhams", () => {
  const ids = new Set<string>();
  for (const p of SPEND_PRESETS) {
    assert.ok(!ids.has(p.id), `duplicate preset id ${p.id}`);
    ids.add(p.id);
    for (const k of SPEND_CATEGORIES) {
      const v = p.spend[k];
      assert.ok(Number.isInteger(v) && v >= 0 && v % 50 === 0, `${p.id}.${k} = ${v}`);
    }
    assert.ok(presetTotal(p) > 0, `${p.id} has no spend`);
  }
});

test("the presets spread the top card, so they model different readers rather than one", () => {
  // If every profile put the same card first the presets would be
  // decoration. Ask the real card set.
  const cards = getActiveCards() as CardForCalc[];
  const tops = new Set(
    SPEND_PRESETS.map((p) => rankCards(cards, p.spend, { netOfFee: true })[0]?.card.slug),
  );
  assert.ok(tops.size >= 3, `only ${tops.size} distinct winners across ${SPEND_PRESETS.length} presets: ${[...tops].join(", ")}`);
});
