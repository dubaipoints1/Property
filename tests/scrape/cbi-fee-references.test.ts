import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import fixture from "./fixtures/2026-11-cbi-fee-references.json";
import cards from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { cbiVariants, parseCbiAnnualFeeReferences } from "../../scripts/scrape/_cbi-annual-fee-references.ts";
import { getActiveCards, getCardData, getCardsByBank } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";

type Input = Parameters<typeof parseCbiAnnualFeeReferences>[0];
const evidence = fixture.sources as Input;

test("CBI exact standard primary annual fee, not the paid Platinum accelerator or Visa fees", () => {
  for (const slug of Object.keys(cbiVariants) as (keyof typeof cbiVariants)[]) {
    const parsed = parseCbiAnnualFeeReferences(evidence, slug);
    const card = getCardData(slug);
    assert.ok(parsed && card);
    assert.equal(parsed.annualFee, 0);
    assert.deepEqual(card.annualFee, { amount: 0, currency: "AED" });
    assert.equal(card.vatPolicy, "inclusive");
    assert.equal(card.network, "Mastercard");
    assert.equal(card.applicationAvailability, "unconfirmed");
    assert.equal(card.fxFee, null);
    assert.equal(card.earnRates.everythingElse, null);
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.deepEqual(cards[slug]._fieldEvidence, parsed.evidence);
    assert.deepEqual(card.sources, parsed.sources);
    assert.deepEqual(registry.cards.find(r => r.slug === slug)?.sourceFixtureIds, parsed.sourceFixtureIds);
    for (const field of ["applyUrl","joiningFee","welcomeBonus","annualFeeWaiver","interestRate","_features","loyaltyProgram","perks"])
      assert.ok(!Object.hasOwn(cards[slug], field), field);
  }
  assert.deepEqual(getCardsByBank("cbi"), []);
  assert.ok(!getActiveCards().some(c => c.bank === "cbi"));
  assert.equal(getCardData("dib-prime-classic"), undefined);
});

test("CBI parser holds drift in product identity, fee rows, source links, add-on and VAT", () => {
  const slug = "cbi-rewards-platinum-mastercard";
  const change = (id: string, from: string, to: string) => evidence.map(s => {
    if (s.id !== id) return s;
    const text = s.text.replace(from, to);
    assert.notEqual(text, s.text, id);
    return { ...s, text, fixtureTextSha256: createHash("sha256").update(text).digest("hex") };
  });
  for (const [id, from, to] of [
    [slug+"-heading", "Rewards Platinum", "Visa Platinum"],
    [slug+"-mastercard", "Mastercard", "Visa"],
    [slug+"-cta", "credit-card-form/", "credit-card-form/?card=Platinum"],
    [slug+"-tariff-link", "nov-2026", "apr-2026"],
    [slug+"-kfs-primary", "Primary Card", "Supplementary Card"],
    [slug+"-optional-accelerator", "Opt to pay", "You must pay"],
    ["cbi-tariff-primary", "Inclusive of VAT", "Exclusive of VAT"],
    ["cbi-tariff-primary", "Primary Card7", "Supplementary"],
    ["cbi-tariff-primary", "Free                         Free", "525                          Free"],
    ["cbi-tariff-revision", "November", "December"],
  ]) assert.equal(parseCbiAnnualFeeReferences(change(id, from, to), slug), null, id);
  assert.equal(parseCbiAnnualFeeReferences(evidence, "cbi-rewards-world-mastercard"), null);
});
