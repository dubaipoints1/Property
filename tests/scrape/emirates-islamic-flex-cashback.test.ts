import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EI_FLEX_CASHBACK_CARDS, EI_FLEX_CASHBACK_KFS, EI_FLEX_CASHBACK_NETWORK, EI_FLEX_CASHBACK_TARIFF, parseEiFlexCashback } from "../../scripts/scrape/_emirates-islamic-flex-cashback.ts";
import fixture from "./fixtures/2026-11-emirates-islamic-flex-cashback.json";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { getActiveCards, getCardData } from "../../src/lib/cardsData";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { cardValueTerms } from "../../src/lib/cardValue";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";

const sources = fixture.sources as Parameters<typeof parseEiFlexCashback>[0];
const elite = "emirates-islamic-flex-elite", cashback = "emirates-islamic-cashback-plus";
const proof = (key: string) => sources.find(s => s.id === "ei-flex-cashback-" + key)!;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
function replace(key: string, before: string, after: string) {
  const item = proof(key);
  assert.ok(item, key);
  const text = item.text.replaceAll(before, after);
  assert.notEqual(text, item.text, key);
  return sources.map(s => s === item ? { ...s, text, fixtureTextSha256: sha(text) } : s);
}

test("exact Flex Elite and Cashback Plus replay agreeing VAT-inclusive standard primary membership and Visa", () => {
  assert.equal(sources.length, 17);
  for (const [slug, expected] of [[elite, 735], [cashback, 313.95]] as const) {
    const spec = EI_FLEX_CASHBACK_CARDS[slug], r = parseEiFlexCashback(sources, slug);
    assert.ok(r);
    assert.deepEqual([r.name, r.annualFee, r.network, r.vatPolicy, r.capturedDate],
      ["Emirates Islamic " + spec.label + " Credit Card", expected, "Visa", "inclusive", "2026-11-20"]);
    assert.equal(r.kfsUrl, EI_FLEX_CASHBACK_KFS);
    assert.deepEqual(r.sources, [r.productUrl, EI_FLEX_CASHBACK_KFS, EI_FLEX_CASHBACK_TARIFF, EI_FLEX_CASHBACK_NETWORK]);
    assert.equal(r.sourceFixtureIds.length, slug === elite ? 13 : 12);
    assert.ok(r.productUrl.endsWith("/" + spec.route));
    assert.ok(!r.sources.some(s => s.includes("apply-now")));
    assert.deepEqual(Object.keys(r.evidence), ["network", "annualFee"]);
    assert.equal(r.evidence.network.length, slug === elite ? 3 : 2);
    assert.ok(r.evidence.network.some(p => p.unit.includes(spec.scheme)));
    assert.ok(r.evidence.annualFee.some(p => p.rawText.includes("Profit based Cards")));
    for (const ignored of ["salary", "eligibility", "fxFee", "rewardRates", "welcomeBonus", "annualFeeWaiver", "firstYearFee", "loyaltyProgram"]) {
      assert.equal(Object.hasOwn(r, ignored), false, ignored);
    }
  }
  assert.equal(parseEiFlexCashback(sources, "emirates-islamic-flex"), null);
  assert.equal(parseEiFlexCashback(sources, "emirates-islamic-cashback"), null);
  assert.equal(parseEiFlexCashback(sources, "emirates-islamic-switch-cashback"), null);
});

test("hold on wrong tier, missing source, membership column confusion, waiver wording or KFS/tariff contradiction", () => {
  for (const [slug, role, before, after] of [
    [elite, "flex-elite-heading", "Flex Elite", "Flex"],
    [elite, "flex-elite-acquisition", "flex%20elite", "flex"],
    [elite, "flex-elite-tariff-row", "AED 735", "AED 735 (first year waived)"],
    [elite, "flex-elite-tariff-row", "Flex Elite", "Flex Platinum"],
    [elite, "kfs-fees", "735", "745"],
    [cashback, "cashback-plus-acquisition", "cashback plus card", "cashback card"],
    [cashback, "cashback-plus-tariff-row", "AED 313.95", "Fee waived"],
    [cashback, "kfs-fees", "313.95", "299"],
    [cashback, "kfs-columns", "Cashback Plus", "Switch Cashback"],
    [cashback, "soc-columns", "Annual Membership Fee", "Supplementary Fee"],
    [cashback, "soc-profit", "Profit based Cards", "Fee based Cards"],
    [cashback, "soc-vat", "inclusive", "exclusive"],
    [cashback, "kfs-vat", "inclusive", "exclusive"],
  ] as const) assert.equal(parseEiFlexCashback(replace(role, before, after), slug), null, role);
  const row = proof("flex-elite-tariff-row");
  assert.equal(parseEiFlexCashback([...sources, row], elite), null);
  assert.equal(parseEiFlexCashback(sources.filter(s => s !== row), elite), null);
  assert.equal(parseEiFlexCashback(sources.map(s => s === row ? { ...s, sourceStartByte: 0 } : s), elite), null);
  assert.equal(parseEiFlexCashback(sources.map(s => s === row ? { ...s, fixtureTextSha256: "0".repeat(64) } : s), elite), null);
});

test("network requires exact product in the issuer card-type table, not a generic benefit or sibling tier", () => {
  for (const [slug, role, before, after] of [
    [cashback, "cashback-plus-golf-row", "Cashback Plus", "Standard Cashback"],
    [cashback, "cashback-plus-golf-row", "Visa Signature", "Visa Infinite"],
    [cashback, "golf-columns", "Cards", "Examples only"],
    [elite, "flex-elite-golf-row", "Flex Elite", "Flex Platinum"],
    [elite, "flex-elite-issuer-network", "(Infinite)", "(Signature)"],
  ] as const) assert.equal(parseEiFlexCashback(replace(role, before, after), slug), null, role);
  const row = proof("cashback-plus-golf-row");
  assert.equal(parseEiFlexCashback(sources.map(s => s === row ? { ...s, url: EI_FLEX_CASHBACK_TARIFF } : s), cashback), null);
});

test("catalogue uses exact replay without turning a standard fee into a first-year price or reward estimate", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  for (const slug of [elite, cashback] as const) {
    const r = parseEiFlexCashback(sources, slug), c = getCardData(slug), raw = l2[slug];
    assert.ok(r && c && active.has(slug) && c.sharia);
    assert.deepEqual([c.name, c.network, c.annualFee.amount, c.vatPolicy], [r.name, r.network, r.annualFee, r.vatPolicy]);
    assert.deepEqual(raw._fieldEvidence, r.evidence);
    assert.deepEqual(registry.cards.find(c => c.slug === slug)?.sourceFixtureIds, r.sourceFixtureIds);
    assert.deepEqual([c.applyUrl, c.kfsUrl, c.lastVerified?.toISOString().slice(0, 10)], [r.productUrl, r.kfsUrl, r.capturedDate]);
    assert.match(annualFeeLabel(c).qual ?? "", /first-year offer pending/);
    assert.equal(hasUsableSalaryMinimum(c), false);
    const value = cardValueTerms(c, slug);
    assert.deepEqual([value.firstFee, value.laterFee, value.rate, value.hasWelcomeOffer], [null, r.annualFee, null, false]);
    assert.equal(c.fxFee, null);
    assert.ok(Object.values(c.earnRates).every(v => v == null));
    for (const field of ["joiningFee", "annualFeeWaiver", "welcomeBonus", "loyaltyProgram", "interestRate"])
      assert.equal(Object.hasOwn(raw, field), false, field);
  }
  assert.equal(active.has("emirates-islamic-switch-cashback"), true);
  assert.equal(active.has("emirates-islamic-flex"), false);
});
