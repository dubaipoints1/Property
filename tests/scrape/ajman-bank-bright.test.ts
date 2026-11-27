import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import fixture from "./fixtures/2026-11-ajman-bank-bright.json";
import cards from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { brightTiers, parseAjmanBankBright } from "../../scripts/scrape/_ajman-bank-bright.ts";
import { getActiveCards, getCardData, getCardsByBank } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH, SALARY_OFFER_REVIEW_PENDING_BANKS } from "../../src/lib/salaryTransferCoverage.ts";

type Input = Parameters<typeof parseAjmanBankBright>[0];
const sources = fixture.sources as Input;
const fees = [0, 1000, 1500];
const slugs = Object.keys(brightTiers) as (keyof typeof brightTiers)[];

test("BRight exact primary annual fees replay without opening or ranking the tiers", () => {
  for (const [i, slug] of slugs.entries()) {
    const parsed = parseAjmanBankBright(sources, slug);
    const card = getCardData(slug);
    assert.ok(parsed && card);
    assert.equal(parsed.annualFee, fees[i]);
    assert.deepEqual(card.annualFee, { amount: parsed.annualFee, currency: "AED" });
    assert.equal(card.vatPolicy, parsed.vatPolicy);
    assert.equal(card.network, parsed.network);
    assert.equal(card.sharia, parsed.sharia);
    assert.equal(card.applicationAvailability, "unconfirmed");
    assert.equal(card.applyUrl, undefined);
    assert.equal(card.fxFee, null);
    assert.equal(card.earnRates.everythingElse, null);
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.equal(card.lastVerified.toISOString().slice(0, 10), parsed.capturedDate);
    assert.deepEqual(cards[slug]._fieldEvidence, parsed.evidence);
    assert.deepEqual(card.sources, parsed.sources);
    assert.deepEqual(registry.cards.find(r => r.slug === slug)?.sourceFixtureIds, parsed.sourceFixtureIds);
    for (const field of ["joiningFee", "welcomeBonus", "annualFeeWaiver", "interestRate", "_features", "loyaltyProgram", "perks"])
      assert.ok(!Object.hasOwn(cards[slug], field), field);
  }
  assert.deepEqual(getCardsByBank("ajman-bank"), []);
  assert.ok(!getActiveCards().some(c => c.bank === "ajman-bank"));
  assert.ok(SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH.includes("ajman-bank"));
  assert.ok(!SALARY_OFFER_REVIEW_PENDING_BANKS.includes("ajman-bank"));
  assert.equal(getCardData("dib-prime-classic"), undefined);
});

test("BRight parser holds source drift, other variants, fee scope or basis ambiguity", () => {
  const p = "ajman-bank-bright-platinum";
  const change = (id: string, from: string, to: string) => sources.map(s => {
    if (s.id !== id) return s;
    const text = s.text.replace(from, to);
    assert.notEqual(s.text, text, id);
    return { ...s, text, fixtureTextSha256: createHash("sha256").update(text).digest("hex") };
  });
  for (const [id, from, to] of [
    [p+"-heading", "Platinum", "Titanium"],
    [p+"-kfs-primary-fee", "1,000", "1,500"],
    [p+"-shared-cta", "Mastercard/en", "Mastercard/en?card=Bright"],
    ["bright-kfs-family", "Bright Mastercard", "Bright Visa"],
    ["bright-kfs-vat-and-period", "exclusive", "inclusive"],
    ["bright-kfs-vat-and-period", "after Card activation", "one year after Card activation"],
    ["bright-tariff-heading", "BRight Platinum", "BRight World"],
    ["bright-tariff-primary-fee", "Primary", "Supplementary"],
    ["bright-tariff-primary-fee", "1,000", "1,500"],
    ["bright-tariff-primary-fee", "images/dirham.png", "images/pound.png"],
  ] as const) {
    // The primary fee row contains other product symbols; replace the one for
    // this tier directly rather than a different product's symbol.
    const testFrom = from === "images/dirham.png" ? 'images/dirham.png" width="14" />1,000' : from;
    const testTo = from === "images/dirham.png" ? 'images/pound.png" width="14" />1,000' : to;
    assert.equal(parseAjmanBankBright(change(id, testFrom, testTo), p), null, id);
  }
  assert.equal(parseAjmanBankBright(sources.filter(s => s.id !== "bright-tariff-primary-fee"), p), null);
  assert.equal(parseAjmanBankBright(sources, "ajman-bank-life-cashback-platinum"), null);
});
