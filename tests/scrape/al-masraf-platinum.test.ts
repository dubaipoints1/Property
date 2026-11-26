import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { AL_MASRAF_PLATINUM, parseAlMasrafPlatinum, type AlMasrafPlatinumSource } from "../../scripts/scrape/_al-masraf-platinum.ts";

import cards from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { getCardData, getActiveCards, getCardsByBank } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";

const { slug, kfsUrl, tariffUrl, productUrl, campaignUrl } = AL_MASRAF_PLATINUM;
const { sources } = JSON.parse(readFileSync(new URL("./fixtures/2026-11-al-masraf-platinum.json", import.meta.url), "utf8")) as { sources: AlMasrafPlatinumSource[] };
const sha = (data: string) => createHash("sha256").update(data).digest("hex");

test("the exact conventional Platinum evidence replays a tariff-listed annual fee only", () => {
  const parsed = parseAlMasrafPlatinum(sources, slug);
  assert.ok(parsed);
  assert.deepEqual([parsed.name, parsed.annualFee, parsed.vatPolicy, parsed.network, parsed.sharia],
    ["Al Masraf Mastercard Platinum Credit Card", 150, "exclusive", "Mastercard", false]);
  assert.deepEqual([parsed.expiredCampaignDate, parsed.capturedDate, parsed.standardFeeConditions, parsed.applicationAvailability],
    ["2026-06-14", "2026-11-26", "standard-only", "unconfirmed"]);
  assert.deepEqual(parsed.sources, [productUrl, kfsUrl, tariffUrl, campaignUrl]);
  assert.deepEqual(parsed.sourceFixtureIds, sources.map(s => s.id));
  assert.match(parsed.evidence.annualFee[0].rawText, /Schedule of Charges/);
  assert.doesNotMatch(parsed.evidence.annualFee[0].rawText, /\b150\b/);
  assert.equal(parsed.evidence.annualFee[0].sourceUrl, kfsUrl);
  assert.equal(parsed.evidence.annualFee[2].sourceUrl, tariffUrl);
  assert.match(parsed.evidence.annualFee[2].rawText, /Platinum Credit Card/);
  assert.match(parsed.evidence.annualFee[3].rawText, /Additional 5% VAT/);
  assert.equal(parsed.evidence.network[0].sourceUrl, kfsUrl);
  assert.ok(parsed.evidence.applicationAvailability.every(s => s.rawText.includes("/en/apply-now")));
  for (const field of ["applyUrl", "joiningFee", "annualFeeWaiver", "firstYearFee", "renewalFee", "eligibility",
    "minSalary", "publishedMinMonthlyIncome", "welcomeBonus", "earnRates", "fxFee", "perks", "interestRate"]) {
    assert.ok(!Object.hasOwn(parsed, field), field);
  }
});

test("rejects wrong tier, footer, price, VAT, registry role, body or first-party date drift", () => {
  function change(id: string, from: string, to: string) {
    return sources.map(s => {
      if (s.id !== id) return s;
      const text = s.text.replace(from, to);
      assert.notEqual(text, s.text, id);
      return { ...s, text, fixtureTextSha256: sha(text),
        ...(s.sourceStartByte === undefined ? {} : { sourceEndByte: s.sourceStartByte + Buffer.byteLength(text) }) };
    });
  }
  for (const [id, from, to] of [
    ["platinum-product-title", "Platinum Credit Card", "Platinum Covered Card"],
    ["platinum-shared-cta", "/en/apply-now", "/en/apply-platinum"],
    ["world-shared-cta-witness", "/en/apply-now", "/en/apply-world"],
    ["conventional-kfs-index-link", "kfs-credit-card", "kfs-covered-cards"],
    ["conventional-tariff-index-link", "retail-banking", "personal-banking"],
    ["conventional-kfs-product-row", "Mastercard Platinum", "Visa Platinum"],
    ["conventional-kfs-fee-referral", "once a year", "once"],
    ["retail-tariff-tax", "Additional 5% VAT", "VAT included"],
    ["retail-tariff-annual-table", "150", "120"],
    ["expired-campaign-date", "14th June 2026", "30th December 2026"],
  ]) assert.equal(parseAlMasrafPlatinum(change(id, from, to), slug), null, id);
  for (const wrong of ["al-masraf-mastercard-world", "al-masraf-mastercard-platinum-covered"]) {
    assert.equal(parseAlMasrafPlatinum(sources, wrong), null);
  }
  assert.equal(parseAlMasrafPlatinum(sources.slice(1), slug), null);
  assert.equal(parseAlMasrafPlatinum([...sources.slice(1), sources[1]], slug), null);
  for (const field of ["sourceBodySha256", "sourceTextSha256"] as const) {
    assert.equal(parseAlMasrafPlatinum(sources.map(s => s.id === "retail-tariff-annual-table" ? { ...s, [field]: "0".repeat(64) } : s), slug), null);
  }
});

test("copy keeps the conventional card source-only and does not advertise an expired price or waiver", () => {
  const mdx = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
  const card = mdx("../../src/content/cards/al-masraf-mastercard-platinum.mdx");
  const hub = mdx("../../src/content/banks/al-masraf.mdx");
  assert.match(card, /14 June 2026 as the last day/);
  assert.match(card, /historical, not a current waiver/);
  assert.match(card, /not included in the active catalogue, comparisons or fee tables/);
  assert.match(hub, /id="bank-fee-sources"/);
  assert.match(hub, /does not cover the separate Islamic card/);
  assert.ok(hub.includes("/cards/" + slug + "/"));
  for (const publicCopy of [card, hub]) {
    assert.doesNotMatch(publicCopy, /\bAED\s*(?:120|150|5,?000|7,?000|15,?000)\b|href=["'][^"']*apply-now|free for life|apply now/iu);
  }
});

test("canonical Al Masraf profile replays exact pins and stays outside active tools", () => {
  const parsed = parseAlMasrafPlatinum(sources, slug), card = getCardData(slug);
  assert.ok(parsed && card);
  assert.equal(card.annualFee.amount, parsed.annualFee);
  assert.equal(card.standardFeeConditions, parsed.standardFeeConditions);
  assert.equal(card.vatPolicy, parsed.vatPolicy);
  assert.equal(card.sharia, false);
  assert.equal(card.network, parsed.network);
  assert.equal(card.applicationAvailability, "unconfirmed");
  assert.equal(card._provenance.applicationAvailability, "needs-review");
  assert.equal(hasUsableSalaryMinimum(card), false);
  assert.deepEqual(cards[slug]._fieldEvidence, parsed.evidence);
  assert.deepEqual(registry.cards.find(r => r.slug === slug)?.sourceFixtureIds, parsed.sourceFixtureIds);
  for (const field of ["applyUrl","joiningFee","annualFeeWaiver","welcomeBonus","_features","perks","loyaltyProgram","interestRate"])
    assert.ok(!Object.hasOwn(cards[slug], field), field);
  assert.equal(card.fxFee, null);
  assert.equal(card.earnRates.everythingElse, null);
  assert.ok(!getActiveCards().some(x => x.slug === slug));
  assert.deepEqual(getCardsByBank("al-masraf"), []);
  assert.equal(getCardData("dib-prime-classic"), undefined);
});
