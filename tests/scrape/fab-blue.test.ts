import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { FAB_BLUE_CARDS, FAB_BLUE_KFS, FAB_BLUE_TARIFF, parseFabBlue } from "../../scripts/scrape/_fab-blue.ts";
import { getActiveCards, getCardData } from "../../src/lib/cardsData";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { cardValueTerms } from "../../src/lib/cardValue";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import fixture from "./fixtures/2026-11-fab-blue.json";

const sources = fixture.sources as Parameters<typeof parseFabBlue>[0];
const slug = (key: string) => "fab-blue-al-futtaim-" + key;
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
function replace(id: string, from: string, to: string, rehash = true) {
  let matched = false;
  const out = sources.map(s => {
    if (s.id !== "fab-blue-" + id) return s;
    const text = s.text.replace(from, to);
    assert.notEqual(text, s.text, id);
    matched = true;
    return { ...s, text, fixtureTextSha256: rehash ? digest(text) : s.fixtureTextSha256 };
  });
  assert.ok(matched, id);
  return out;
}

test("exact Blue FAB tiers replay VAT-inclusive primary annual membership and issuer-verified Visa", () => {
  assert.equal(sources.length, 24);
  for (const [name, spec] of Object.entries(FAB_BLUE_CARDS)) {
    const result = parseFabBlue(sources, name);
    assert.ok(result);
    assert.deepEqual([result.annualFee, result.vatPolicy, result.network], [0, "inclusive", "Visa"]);
    assert.equal(result.name, "Blue FAB " + spec.tier + " Credit Card by Al-Futtaim");
    assert.equal(result.productUrl, "https://www.bankfab.com/en-ae/personal/credit-cards/blue-fab-" + spec.key + "-credit-card");
    assert.equal(result.capturedDate, "2026-11-20");
    assert.equal(result.kfsUrl, FAB_BLUE_KFS);
    assert.ok(result.sources.includes(FAB_BLUE_TARIFF));
    assert.equal(result.sourceFixtureIds.length, 10);
    assert.deepEqual(Object.keys(result.evidence), ["network", "annualFee"]);
    assert.match(result.evidence.network[0].unit, new RegExp("Visa " + spec.tier));
    for (const field of ["salary", "publishedIncome", "joiningFee", "fxFee", "welcomeBonus", "rewardRates", "loyaltyProgram", "annualFeeWaiver"]) {
      assert.equal(Object.hasOwn(result, field), false, field);
    }
  }
  assert.equal(parseFabBlue(sources, "fab-share-platinum"), null);
  assert.equal(parseFabBlue(sources, "fab-blue-al-futtaim-world"), null);
});

test("rehashed contradictory or widened tariff, key facts and product identities fail closed", () => {
  for (const [id, old, changed] of [
    ["infinite-tariff-row", "Free", "AED 735"],
    ["infinite-tariff-row", "Free", "Free first year"],
    ["infinite-tariff-row", "BLUE FAB Infinite", "FAB SHARE Infinite"],
    ["tariff-columns", "Inclusive of VAT", "Exclusive of VAT"],
    ["tariff-columns", "Primary Card", "Supplementary Card"],
    ["infinite-heading", "Infinite", "Platinum"],
    ["infinite-selector-heading", "Infinite", "Signature"],
    ["infinite-selector-kfs", "Conventional-Cards", "Islamic-Cards"],
    ["infinite-selector-tariff", "/credit-card.pdf", "/blue-card.pdf"],
    ["infinite-product-tariff", "?view=1", "?view=2"],
    ["kfs-delegation", "Schedule of Fees", "Tiers of Fees"],
    ["family-fee", "no annual fees", "one annual fee"],
  ] as const) assert.equal(parseFabBlue(replace(id, old, changed), slug("infinite")), null, id);
  assert.equal(parseFabBlue(replace("signature-tariff-row", "Free", "999", false), slug("signature")), null);
  const row = sources.find(s => s.id === "fab-blue-platinum-tariff-row")!;
  assert.equal(parseFabBlue([...sources, row], slug("platinum")), null);
  assert.equal(parseFabBlue(sources.filter(s => s !== row), slug("platinum")), null);
  for (const change of [{ sourceScope: "PDF page 2" }, { sourceTextSha256: "0".repeat(64) }, { firstLine: 1 }]) {
    assert.equal(parseFabBlue(sources.map(s => s === row ? { ...s, ...change } : s), slug("platinum")), null);
  }
});

test("network cannot replay from unreviewed, reused or unrelated issuer artwork", () => {
  const art = sources.find(s => s.id === "fab-blue-signature-artwork")!;
  assert.ok(art.visualReceipt);
  for (const change of [{ sha256: "0".repeat(64) }, { contentType: "text/html" }, { assetUrl: art.url }, { capturedAt: "2026-11-17T04:00:00.000Z" }]) {
    assert.equal(parseFabBlue(sources.map(s => s === art ? { ...s, visualReceipt: { ...art.visualReceipt!, ...change } } : s), slug("signature")), null);
  }
  assert.equal(parseFabBlue(replace("signature-artwork", "fab-blue-signature-cc-double", "unrelated"), slug("signature")), null);
  assert.equal(parseFabBlue(sources.map(s => s === art ? { ...s, sourceStartByte: 0 } : s), slug("signature")), null);
});

test("the public catalogue uses the exact replay and withholds other terms", () => {
  const active = new Set(getActiveCards().map(item => item.slug));
  for (const key of Object.keys(FAB_BLUE_CARDS) as (keyof typeof FAB_BLUE_CARDS)[]) {
    const card = getCardData(key), raw = l2[key], replay = parseFabBlue(sources, key);
    assert.ok(replay && card && active.has(key));
    assert.deepEqual([card.name, card.network, card.annualFee.amount, card.vatPolicy],
      [replay.name, replay.network, replay.annualFee, replay.vatPolicy]);
    assert.deepEqual(raw._fieldEvidence, replay.evidence);
    assert.equal(annualFeeLabel(card).amount, "Free");
    assert.equal(card.applyUrl, replay.productUrl);
    assert.equal(card.kfsUrl, replay.kfsUrl);
    assert.deepEqual(registry.cards.find(entry => entry.slug === key)?.sourceFixtureIds, replay.sourceFixtureIds);
    assert.equal(hasUsableSalaryMinimum(card), false);
    const value = cardValueTerms(card, key);
    assert.deepEqual([value.firstFee, value.laterFee, value.rate, value.hasWelcomeOffer], [null, 0, null, false]);
    assert.match(value.firstFeeIssue, /joining fee/i);
    assert.equal(value.laterFeeIssue, "");
    assert.equal(card.eligibility.publishedMinMonthlyIncome, undefined);
    assert.equal(card.fxFee, null);
    assert.ok(Object.values(card.earnRates).every(v => v == null));
    for (const field of ["joiningFee", "welcomeBonus", "loyaltyProgram", "annualFeeWaiver", "interestRate", "fxFeeUpperBound"])
      assert.ok(!Object.hasOwn(raw, field), field);
  }
  assert.equal(parseFabBlue(sources, "fab-blue-islamic"), null);
  const islamic = getCardData("fab-blue-islamic");
  assert.ok(islamic && active.has("fab-blue-islamic") && islamic.sharia);
  assert.notEqual(annualFeeLabel(islamic).amount, "Free");
  assert.notEqual(islamic.kfsUrl, FAB_BLUE_KFS);
});
