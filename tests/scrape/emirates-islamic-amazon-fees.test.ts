import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EI_AMAZON_FEE_CARDS, parseEiAmazonFees, type EiAmazonFeeSource } from "../../scripts/scrape/_emirates-islamic-amazon-fees.ts";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { getCardArt } from "../../src/lib/cardArt";
import { cardDifference, identicalKnownSections } from "../../src/lib/cardDifference";
import { calculateCardValue, cardValueTerms } from "../../src/lib/cardValue";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import cards from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import common from "./fixtures/2026-11-emirates-islamic-named-fees.json";
import amazon from "./fixtures/2026-11-emirates-islamic-amazon-fees.json";

const world = "emirates-islamic-amazon-world";
const platinum = "emirates-islamic-amazon-platinum";
const slugs = [world, platinum] as const;
const sources = [...common.sources, ...amazon.sources] as EiAmazonFeeSource[];
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
function edited(id: string, before: string, after: string, redigest = true) {
  const originals = sources.filter(s => s.id === id);
  assert.equal(originals.length, 1, id);
  return sources.map(source => {
    if (source.id !== id) return source;
    const text = source.text.replace(before, after);
    assert.notEqual(text, source.text, id);
    return { ...source, text, fixtureTextSha256: redigest ? digest(text) : source.fixtureTextSha256 };
  });
}

test("replays exact named Mastercard tiers with dual affirmative zero primary annual fee evidence", () => {
  for (const slug of slugs) {
    const result = parseEiAmazonFees(sources, slug);
    assert.ok(result);
    assert.equal(result.name, "Emirates Islamic Amazon Mastercard " + EI_AMAZON_FEE_CARDS[slug].tier + " Credit Card");
    assert.deepEqual([result.fee, result.network, result.vatPolicy, result.capturedDate], [0, "Mastercard", "inclusive", "2026-11-18"]);
    assert.equal(result.ids.length, 12);
    assert.deepEqual(Object.keys(result.evidence), ["annualFee", "network"]);
    assert.ok(result.evidence.annualFee.some(p => p.rawText.includes("No Annual Membership Fee") && p.sourceUrl.endsWith("/soc/cards")));
    assert.ok(result.evidence.annualFee.some(p => p.rawText.includes("No Annual Membership Fee") && p.sourceUrl === result.canonical));
    assert.ok(result.evidence.annualFee.some(p => p.rawText.includes("Amazon World &amp; Amazon Platinum")));
    for (const pin of Object.values(result.evidence).flat()) {
      assert.equal(pin.sourceEndByte - pin.sourceStartByte, Buffer.byteLength(pin.rawText));
      assert.equal(pin.lastLine - pin.firstLine, pin.rawText.split("\n").length - 1);
      assert.equal(pin.rawTextSha256, digest(pin.rawText));
    }
  }
  assert.equal(parseEiAmazonFees(sources, "emirates-islamic-amazon-visa-world"), null);
});

test("rejects tier substitutions, unsigned changes, standalone KFS NA and alternate charging scopes", () => {
  for (const [slug, id, before, after] of [
    [world, world + "-canonical", "amazon-credit-card", "another-credit-card"],
    [world, world + "-heading", "World", "Platinum"],
    [world, world + "-annual-membership-label", "Annual", "First-Year"],
    [platinum, platinum + "-network-name", "Mastercard", "Visa"],
    [platinum, platinum + "-network-name", "Platinum", "World"],
    [world, "ei-kfs-vat", "inclusive", "exclusive"],
    [world, "ei-kfs-card-columns", "Amazon Platinum", "Amazon Gold"],
    [world, "ei-kfs-card-columns", "Switch Cashback Card", "Amazon World &amp; Amazon Platinum"],
    [world, "ei-kfs-annual-fee-row", "<p>NA</p>\n            </td>\n        </tr>", "<p>735</p>\n            </td>\n        </tr>"],
    [world, "ei-tariff-vat", "inclusive", "exclusive"],
    [world, "ei-tariff-membership-columns", "Annual Membership Fee", "Monthly Fee"],
    [world, "ei-tariff-profit-scope", "Profit based Cards", "Fee based Cards"],
    [world, "ei-tariff-fee-based-boundary", "Fee based Cards", "Profit based Cards"],
    [world, "ei-tariff-amazon-membership-row", "<td>Amazon</td>", "<td>Cashback</td>"],
    [world, "ei-tariff-amazon-membership-row", "No Annual Membership Fee", "AED 500"],
  ] as const) assert.equal(parseEiAmazonFees(edited(id, before, after), slug), null, id);
  assert.equal(parseEiAmazonFees(edited(world + "-network-name", "Mastercard", "Visa", false), world), null);
  const first = sources.find(s => s.id === world + "-heading")!;
  assert.equal(parseEiAmazonFees([...sources, first], world), null);
  for (const id of [world + "-heading", "ei-tariff-amazon-membership-row", "ei-kfs-card-columns"]) {
    assert.equal(parseEiAmazonFees(sources.filter(s => s.id !== id), world), null, id);
  }
  for (const patch of [{ sourceStartByte: 0 }, { sourceBodySha256: "0".repeat(64) }, { capturedAt: "2026-01-01T00:00:00.000Z" }, { url: "https://example.com/" }]) {
    assert.equal(parseEiAmazonFees(sources.map(s => s.id === first.id ? { ...s, ...patch } : s), world), null);
  }
});

test("scoped profiles are discoverable without eligibility, reward ranking, a value calculation or fabricated art", () => {
  const active = new Set(getActiveCards().map(card => card.slug));
  const matched = new Set(getEditorConfirmedCards().map(card => card.slug));
  const differences = [];
  for (const slug of slugs) {
    const verified = parseEiAmazonFees(sources, slug);
    const record = cards[slug], card = getCardData(slug), route = registry.cards.find(entry => entry.slug === slug);
    assert.ok(verified && record && card && route);
    assert.deepEqual([record.name, record.network, record.annualFee, record.vatPolicy],
      [verified.name, verified.network, { amount: verified.fee, currency: "AED" }, verified.vatPolicy]);
    assert.deepEqual(record._fieldEvidence, verified.evidence);
    assert.deepEqual(record.sources, verified.sources);
    assert.deepEqual(route.sourceFixtureIds, verified.ids);
    assert.deepEqual([record.applyUrl, record.kfsUrl, record.lastVerified, record.refreshMode],
      [verified.canonical, verified.kfs, verified.capturedDate, "manual-primary"]);
    assert.ok(!record.applyUrl.includes("apply"));
    assert.equal(record.fxFee, null);
    assert.deepEqual(record.eligibility, { minSalary: null, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] });
    assert.deepEqual(record.earnRates, { everythingElse: null });
    for (const key of ["joiningFee", "annualFeeWaiver", "welcomeBonus", "welcomeBonusValue", "scopedEarnRates", "loyaltyProgram", "_features", "publishedMinMonthlyIncome", "publishedIncomeBasis", "interestRate", "fxFeeVatTreatment"]) {
      assert.equal(Object.hasOwn(record, key), false, key);
    }
    assert.ok(active.has(slug) && !matched.has(slug));
    assert.equal(getCardArt(slug), undefined);
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
    const values = calculateCardValue(cardValueTerms(card, slug), 10_000);
    assert.deepEqual([values.rewards, values.first, values.later], [null, null, null]);
    const comparison = cardDifference(card);
    assert.ok(Object.values(comparison).every(section => !section.known));
    differences.push(comparison);
  }
  assert.deepEqual(identicalKnownSections(differences), []);
});
