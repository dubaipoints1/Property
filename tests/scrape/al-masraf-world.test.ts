import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { AL_MASRAF_WORLD, parseAlMasrafWorld, type AlMasrafWorldSource } from "../../scripts/scrape/_al-masraf-world.ts";

import cards from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { getActiveCards, getCardData, getCardsByBank } from "../../src/lib/cardsData.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";

const { slug, kfsUrl, tariffUrl, productUrl, campaignUrl } = AL_MASRAF_WORLD;
const { sources } = JSON.parse(readFileSync(new URL("./fixtures/2026-11-al-masraf-world.json", import.meta.url), "utf8")) as { sources: AlMasrafWorldSource[] };
const sha = (data: string) => createHash("sha256").update(data).digest("hex");

test("the exact conventional World evidence replays a tariff-listed annual fee only", () => {
  const parsed = parseAlMasrafWorld(sources, slug);
  assert.ok(parsed);
  assert.deepEqual([parsed.name, parsed.annualFee, parsed.vatPolicy, parsed.network, parsed.sharia],
    ["Al Masraf Mastercard World Credit Card", 500, "exclusive", "Mastercard", false]);
  assert.deepEqual([parsed.expiredCampaignDate, parsed.capturedDate, parsed.standardFeeConditions, parsed.applicationAvailability],
    ["2026-06-14", "2026-11-26", "standard-only", "unconfirmed"]);
  assert.equal(parsed.tariffPrintedEffectiveDate, "09/01/2023");
  assert.deepEqual(parsed.sources, [productUrl, kfsUrl, tariffUrl, campaignUrl]);
  assert.deepEqual(parsed.sourceFixtureIds, sources.map(s => s.id));
  assert.match(parsed.evidence.annualFee[0].rawText, /Schedule of Charges/);
  assert.doesNotMatch(parsed.evidence.annualFee[0].rawText, /\b500\b/);
  assert.equal(parsed.evidence.annualFee[0].sourceUrl, kfsUrl);
  assert.equal(parsed.evidence.annualFee[2].sourceUrl, tariffUrl);
  assert.match(parsed.evidence.annualFee[2].rawText, /World Credit Card/);
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
    ["world-product-title", "World Credit Card", "World Covered Card"],
    ["world-shared-cta", "/en/apply-now", "/en/apply-world"],
    ["platinum-shared-cta-witness", "/en/apply-now", "/en/apply-platinum"],
    ["conventional-kfs-index-link", "kfs-credit-card", "kfs-covered-cards"],
    ["conventional-tariff-index-link", "retail-banking", "personal-banking"],
    ["conventional-kfs-product-row", "Mastercard World", "Visa World"],
    ["conventional-kfs-fee-referral", "once a year", "once"],
    ["retail-tariff-edition-tax", "Additional 5% VAT", "VAT included"],
    ["retail-tariff-edition-tax", "09/01/2023", "09/01/2026"],
    ["retail-tariff-annual-table", "500", "550"],
    ["expired-campaign-date", "14th June 2026", "30th December 2026"],
  ]) assert.equal(parseAlMasrafWorld(change(id, from, to), slug), null, id);
  for (const wrong of ["al-masraf-mastercard-platinum", "al-masraf-mastercard-world-elite", "al-masraf-mastercard-world-covered"]) {
    assert.equal(parseAlMasrafWorld(sources, wrong), null);
  }
  assert.equal(parseAlMasrafWorld(sources.slice(1), slug), null);
  assert.equal(parseAlMasrafWorld([...sources.slice(1), sources[1]], slug), null);
  for (const field of ["sourceBodySha256", "sourceTextSha256"] as const) {
    assert.equal(parseAlMasrafWorld(sources.map(s => s.id === "retail-tariff-annual-table" ? { ...s, [field]: "0".repeat(64) } : s), slug), null);
  }
});

test("copy attributes the standard to the older still-linked tariff and excludes the expired waiver", () => {
  const card = readFileSync(new URL("../../src/content/cards/al-masraf-mastercard-world.mdx", import.meta.url), "utf8");
  assert.match(card, /2023 effective date/);
  assert.match(card, /14 June 2026 as the last day/);
  assert.match(card, /Do not rely on it as a current waiver/);
  assert.match(card, /not included in the active catalogue, comparisons or fee tables/);
  assert.ok(card.includes("/banks/al-masraf/"));
  assert.doesNotMatch(card, /\bAED\s*(?:500|550|15,?000)\b|href=["'][^"']*apply-now|free for life|apply now/iu);
});

test("canonical Al Masraf World fee replays exact pins and is not a recommendation", () => {
  const parsed=parseAlMasrafWorld(sources,slug),card=getCardData(slug);
  assert.ok(parsed&&card);
  assert.deepEqual([card.annualFee.amount,card.vatPolicy,card.network],[parsed.annualFee,"exclusive","Mastercard"]);
  assert.equal(card.standardFeeConditions,"standard-only");
  assert.equal(card.sharia,false);
  assert.equal(card.applicationAvailability,"unconfirmed");
  assert.equal(card._provenance.applicationAvailability,"needs-review");
  assert.deepEqual(cards[slug]._fieldEvidence,parsed.evidence);
  assert.deepEqual(registry.cards.find(r=>r.slug===slug)?.sourceFixtureIds,parsed.sourceFixtureIds);
  assert.equal(hasUsableSalaryMinimum(card),false);
  assert.equal(finderEvidence(card).comparableAnnualFee,null);
  const quote=cardValueTerms(card,slug);
  assert.deepEqual([quote.firstFee,quote.laterFee],[null,null]);
  assert.ok(!getActiveCards().some(x=>x.slug===slug));
  assert.deepEqual(getCardsByBank("al-masraf"),[]);
  assert.equal(getCardData("dib-prime-classic"),undefined);
});
