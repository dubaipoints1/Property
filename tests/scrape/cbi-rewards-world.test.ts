import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import fixture from "./fixtures/2026-11-cbi-rewards-world.json";
import catalogue from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { CBI_WORLD, parseCbiRewardsWorld } from "../../scripts/scrape/_cbi-rewards-world.ts";
import { getActiveCards, getCardData, getCardsByBank } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";

const { slug } = CBI_WORLD;
const input = fixture.sources as Parameters<typeof parseCbiRewardsWorld>[0];

test("CBI World fee replays the exact VAT-inclusive standard primary row, without an application or a quote", () => {
  const parsed = parseCbiRewardsWorld(input, slug), card = getCardData(slug);
  assert.ok(parsed && card);
  assert.deepEqual([parsed.annualFee, parsed.vatPolicy, parsed.network],[840,"inclusive","Mastercard"]);
  assert.deepEqual(card.annualFee,{amount:parsed.annualFee,currency:"AED"});
  assert.equal(card.standardFeeConditions,"standard-only");
  assert.equal(card.applicationAvailability,"unconfirmed");
  assert.deepEqual(catalogue[slug]._fieldEvidence,parsed.evidence);
  assert.deepEqual(registry.cards.find(x=>x.slug===slug)?.sourceFixtureIds,parsed.sourceFixtureIds);
  assert.equal(hasUsableSalaryMinimum(card),false);
  assert.equal(card.fxFee,null);
  assert.equal(card.earnRates.everythingElse,null);
  assert.deepEqual(getCardsByBank("cbi"),[]);
  assert.ok(!getActiveCards().some(x=>x.slug===slug));
  assert.equal(finderEvidence(card).comparableAnnualFee,null);
  const terms=cardValueTerms(card,slug);
  assert.deepEqual([terms.firstFee,terms.laterFee],[null,null]);
  for (const field of ["applyUrl","joiningFee","annualFeeWaiver","welcomeBonus","interestRate","_features","perks","loyaltyProgram"])
    assert.ok(!Object.hasOwn(catalogue[slug],field),field);
  assert.equal(getCardData("dib-prime-classic"),undefined);
});

test("CBI World rejects ambiguous product, cross-tier row, VAT, schedule edition and intake drift", () => {
  for(const [id,from,to] of [
    ["world-heading","Rewards World","Rewards Platinum"],
    ["world-mastercard","Rewards World Mastercard","Rewards World Platinum Mastercard"],
    ["world-shared-enquiry","credit-card-form/","credit-card-form/?tier=World"],
    ["world-kfs-primary","Primary Card","Supplementary Card"],
    ["world-kfs-primary","D 840","D 525"],
    ["world-tariff-primary","AED 840","AED 525"],
    ["world-tariff-primary","Inclusive of VAT","Exclusive of VAT"],
    ["world-tariff-version","November 2026","October 2026"],
  ]){
    const args=input.map(x=>{
      if(x.id!==id)return x;
      const text=x.text.replace(from,to);assert.notEqual(text,x.text,id);
      return {...x,text,fixtureTextSha256:createHash("sha256").update(text).digest("hex")};
    });
    assert.equal(parseCbiRewardsWorld(args,slug),null,id);
  }
  assert.equal(parseCbiRewardsWorld(input,"cbi-rewards-platinum-mastercard"),null);
  assert.equal(parseCbiRewardsWorld(input.slice(1),slug),null);
});
