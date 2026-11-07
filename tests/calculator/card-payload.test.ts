import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import RewardsCalculator, { rankCards } from "../../src/components/islands/RewardsCalculator.tsx";
import { getActiveCards } from "../../src/lib/cardsData.ts";
import { calculatorCardPayload } from "../../src/lib/calculatorCardPayload.ts";
import { cardValueTerms, calculateCardValue } from "../../src/lib/cardValue.ts";
import { SPEND_PRESETS } from "../../src/data/spendProfiles.ts";

const cards = getActiveCards();
const payload = calculatorCardPayload(cards);

test("calculator payload removes only the two unused audit archives, without mutating source records", () => {
  const before = JSON.stringify(cards);
  for (const [i, card] of cards.entries()) {
    const { _fieldEvidence: archive, _scraped_freetext: draft, ...consumer } = card;
    assert.deepEqual(payload[i], consumer, card.slug);
    assert.equal("_fieldEvidence" in payload[i], false, card.slug);
    assert.equal("_scraped_freetext" in payload[i], false, card.slug);
    assert.equal(payload[i]._provenance, card._provenance, card.slug);
    assert.equal(payload[i]._dataIssues, card._dataIssues, card.slug);
    assert.equal(payload[i].scopedEarnRates, card.scopedEarnRates, card.slug);
    assert.deepEqual(payload[i].fxFeeUpperBound, card.fxFeeUpperBound, card.slug);
  }
  assert.equal(JSON.stringify(cards), before);
  assert.doesNotMatch(JSON.stringify(payload), /"(?:_fieldEvidence|_scraped_freetext)":/);
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) < Buffer.byteLength(before));
});

test("all current preset calculations and ranking outcomes remain identical after projection", () => {
  const totals = (rows: ReturnType<typeof rankCards>) => rows.map(({ card, ...value }) => ({ slug: card.slug, ...value }));
  for (const preset of SPEND_PRESETS) for (const netOfFee of [false, true]) {
    const options = { netOfFee, now: new Date("2026-11-07") };
    assert.deepEqual(totals(rankCards(payload, preset.spend, options)), totals(rankCards(cards, preset.spend, options)), preset.id);
  }
  for (const [i, card] of cards.entries()) {
    const before = cardValueTerms(card, card.slug), after = cardValueTerms(payload[i], card.slug);
    assert.deepEqual(after, before, card.slug);
    assert.deepEqual(calculateCardValue(after, 10000), calculateCardValue(before, 10000), card.slug);
  }
});

test("actual calculator SSR stays identical and the hydrating Astro binding uses the archive-free payload", () => {
  assert.equal(renderToString(h(RewardsCalculator, { cards: payload })), renderToString(h(RewardsCalculator, { cards })));
  const page = readFileSync("src/pages/calculator.astro", "utf8");
  assert.match(page, /const calculatorCards = calculatorCardPayload\(cards\)/);
  assert.match(page, /<RewardsCalculator client:load cards=\{calculatorCards\} \/>/);
  assert.doesNotMatch(page, /<RewardsCalculator[^>]*cards=\{cards\}/);
});
