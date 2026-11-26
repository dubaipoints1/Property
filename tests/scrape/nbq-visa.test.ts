import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import fixture from "./fixtures/2026-11-nbq-visa.json";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { parseNbqVisa } from "../../scripts/scrape/_nbq-visa";
import { getActiveCards, getCardData } from "../../src/lib/cardsData";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { cardValueTerms } from "../../src/lib/cardValue";
import { bankHasTextOnlyMark } from "../../src/lib/logos";
import { SALARY_OFFER_REVIEW_PENDING_BANKS } from "../../src/lib/salaryTransferCoverage";

const gold = "nbq-visa-gold", platinum = "nbq-visa-platinum";
const sources = (slug:string) => fixture.sources.filter(s => !s.id.startsWith(slug === gold ? platinum : gold));

test("NBQ Gold and Platinum use matching official tariff/KFS values without becoming eligibility or total-cost quotes", () => {
  for (const [slug, fee] of [[gold,0],[platinum,500]] as const) {
    const parsed = parseNbqVisa(sources(slug),slug), card = getCardData(slug);
    assert.ok(parsed && card && getActiveCards().some(c => c.slug === slug));
    assert.deepEqual([card.bank,card.network,card.annualFee,card.vatPolicy,card.standardFeeConditions],
      ["nbq","Visa",{amount:fee,currency:"AED"},"exclusive","standard-only"]);
    assert.deepEqual(l2[slug]._fieldEvidence,parsed.evidence);
    assert.deepEqual(registry.cards.find(x=>x.slug===slug)?.sourceFixtureIds,parsed.sourceFixtureIds);
    assert.equal(card.applyUrl,parsed.productUrl);
    assert.ok(!card.applyUrl?.includes("application-form"));
    const finder = finderEvidence(card);
    assert.equal(finder.comparableAnnualFee,null);
    assert.equal(finder.salaryPending,true);
    assert.deepEqual(finder.rankRates,{});
    assert.equal(cardValueTerms(card,slug).hasWelcomeOffer,false);
    assert.deepEqual([card.eligibility.minSalary,card.eligibility.salaryTransferRequired,card.fxFee],[null,null,null]);
  }
  assert.equal(getCardData("nbq-visa-infinite"),undefined);
  assert.equal(getCardData("dib-prime-classic"),undefined);
  assert.notEqual(getCardData("cbd-al-islami-super-saver")?.bank,"nbq");
});

test("NBQ source parser rejects cross-tier paths, different VAT/effective date, changed tariff or a mismatched KFS fee", () => {
  for (const [key,from,to] of [
    [platinum+"-cta","NBQPlatinum","NBQGold"],
    [platinum+"-visa","platinum.html","gold.html"],
    ["nbq-tariff-vat","exclusive","inclusive"],
    ["nbq-tariff-effective","2026","2027"],
    ["nbq-tariff-annual","Platinum","Infinite"],
    [platinum+"-kfs-row","500","650"],
  ]) {
    const modified = sources(platinum).map(s=>{
      if (s.id!==key) return s;
      assert.ok(s.text.includes(from), key);
      const text=s.text.replace(from,to);
      return {...s,text,fixtureTextSha256:createHash("sha256").update(text).digest("hex")};
    });
    assert.equal(parseNbqVisa(modified,platinum),null,key);
  }
  assert.equal(parseNbqVisa(sources(gold),platinum),null);
  assert.equal(parseNbqVisa(sources(gold),"nbq-visa-infinite"),null);
});

test("the new issuer uses a text-only name and an explicit salary-offer review hold", () => {
  assert.ok(bankHasTextOnlyMark("nbq"));
  assert.ok(SALARY_OFFER_REVIEW_PENDING_BANKS.includes("nbq"));
  const bank = readFileSync("src/content/banks/nbq.mdx","utf8");
  assert.doesNotMatch(bank,/^logo:/m);
  assert.match(bank,/does not cover the Visa Infinite tier or salary-transfer offers/);
});
