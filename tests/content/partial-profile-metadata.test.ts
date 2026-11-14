import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getAllCards, getCardData } from "../../src/lib/cardsData";
import { cardSearchMetadata } from "../../src/lib/cardSearchMetadata";
import { cardHasUnresolvedTerms } from "../../src/lib/cardEligibility";

test("partial card search/Product copy retains scope and standard-fee VAT qualifications", () => {
  const cards = getAllCards().filter(card => card.refreshMode === "manual-primary");
  assert.equal(cards.length, 22);
  for (const card of cards) {
    const meta = cardSearchMetadata(card);
    assert.equal(meta.kind, "source profile", card.slug);
    assert.match(meta.description, /partial source profile/);
    assert.match(meta.description, /Standard annual fee:/);
    assert.match(meta.description, /Terms pending/);
    assert.doesNotMatch(meta.description, /AED-first verdict|min salary|no min salary/);
    if (card.annualFee.amount > 0) assert.match(meta.description, /including VAT|\+ 5% VAT/);
  }
  assert.match(cardSearchMetadata(getCardData("citi-cashback")!).description, /including VAT/);
  assert.match(cardSearchMetadata(getCardData("citi-rewards")!).description, /including VAT from year two/);
  const route = readFileSync("src/pages/cards/[slug].astro", "utf8");
  assert.match(route, /const cardDescription = searchMetadata\.description;/);
  assert.match(route, /description=\{cardDescription\}/);
  const base = getCardData("citi-cashback")!;
  const zero = { ...base, annualFee: { amount: 0, currency: "AED" as const }, _provenance: { annualFee: "scraped" as const } };
  assert.equal(cardHasUnresolvedTerms(zero), true, "A held fee must also limit the visible source-record status");
  assert.match(cardSearchMetadata(zero).description, /Standard annual fee: Pending.*Terms pending/);
  const vatHeld = { ...base, _provenance: { ...base._provenance, vatPolicy: "needs-review" as const } };
  assert.equal(cardHasUnresolvedTerms(vatHeld), true);
});

test("public trust copy distinguishes source-record currency from full verification and field corrections", () => {
  for (const file of ["src/pages/about.astro", "src/pages/editorial-policy/how-we-score.astro"]) {
    const page = readFileSync(file, "utf8");
    assert.match(page, /Latest source record/);
    assert.doesNotMatch(page, /Verified through/);
  }
  const policy = readFileSync("src/pages/editorial-policy.astro", "utf8");
  assert.match(policy, /partial card profile/);
  assert.match(policy, /limited correction does not reset untouched verification dates/);
  assert.doesNotMatch(policy, /refresh the "Last verified" date/);
});
