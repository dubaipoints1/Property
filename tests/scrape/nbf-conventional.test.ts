import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NBF_CONVENTIONAL, parseNbfConventional } from "../../scripts/scrape/_nbf-conventional.ts";
import { MANUAL_CARD_STYLE_ROUTES } from "../../scripts/build/manual-card-style-routes.mjs";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { annualFeeLabel, cardComparisonRows, loyaltyTag } from "../../src/lib/cardsDataFormat.ts";
import { cardSearchMetadata } from "../../src/lib/cardSearchMetadata.ts";
import { buildFeeIndex, feeIndexAnnualFeeLabel } from "../../src/lib/feeIndex.ts";
import { cardFeeNeedsReview } from "../../src/lib/cardFeeFacts.ts";
import data from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-nbf-conventional.json";

const infinite="nbf-visa-infinite", platinum="nbf-platinum-exclusive";
const sources=fixture.sources;
type Source=typeof sources[number];
function change(id: string, mutate: (s: Source)=>Source) {
  return sources.map(s=>{
    if (s.id!=="nbf-conventional-"+id) return s;
    const changed=mutate(s);
    return {...changed,fixtureTextSha256:createHash("sha256").update(changed.text).digest("hex")};
  });
}
const replace=(before: string,after: string)=>(s: Source)=>({...s,text:s.text.replace(before,after)});

test("NBF conventional: exact brand, application, named disclosures and verified standard fee only",()=>{
  for (const slug of [infinite,platinum] as const) {
    const p=parseNbfConventional(sources,slug);
    assert.ok(p,slug);
    const row=data[slug];
    assert.equal(row.name,p.name);
    assert.equal(row.network,"Visa");
    assert.equal(row.network,p.network);
    assert.equal(row.loyaltyProgram,p.loyaltyProgram);
    assert.equal(row.annualFee.amount,p.standardAnnualFee);
    assert.equal(p.standardAnnualFee,0);
    assert.equal(row.applyUrl,p.productUrl);
    assert.equal(row.kfsUrl,p.kfsUrl);
    assert.equal(row.lastVerified,p.capturedDate);
    assert.deepEqual(row.sources,p.sources);
    assert.equal(row.refreshMode,"manual-primary");
    assert.deepEqual(row._fieldEvidence,JSON.parse(JSON.stringify(p.evidence)));
    assert.match(row._dataIssues.annualFee,/no standard annual fee.*levy fees or replace a card.*Priority conditions/);
    assert.ok(row.sources.every(url=>new URL(url).hostname==="nbf.ae"));
    assert.equal(MANUAL_CARD_STYLE_ROUTES["/cards/"+slug+"/"],p.name);
    if (slug===infinite) {
      assert.ok(p.priority);
      assert.equal(p.income,40000);
      assert.equal(Object.hasOwn(row.eligibility,"publishedMinMonthlyIncome"),false);
      assert.match(row._dataIssues.eligibility,/AED 40,000 monthly salary or NBF Priority status.*deposit-backed issuance/);
    } else {
      assert.equal(p.priority,false);
      assert.equal(p.income,9000);
      assert.equal(data[platinum].eligibility.publishedMinMonthlyIncome,p.income);
      assert.equal(data[platinum].eligibility.publishedIncomeBasis,"salaried-applicants");
    }
  }
});

test("NBF conventional: fails closed on cross-tier forms, Islamic files or missing fee terms",()=>{
  assert.equal(parseNbfConventional(sources,"nbf-islamic-visa-infinite"),null);
  assert.equal(parseNbfConventional(change("infinite-enquiry",replace("Apply For Infinite","Apply For Platinum")),infinite),null);
  assert.equal(parseNbfConventional(change("infinite-apply",replace("infinite-credit-card","platinum-exclusive-credit-card")),infinite),null);
  assert.equal(parseNbfConventional(change("platinum-kfs-salary",replace("AED 9000","AED 9000 or Priority Segment status with NBF.")),platinum),null);
  assert.equal(parseNbfConventional(change("infinite-kfs-salary",replace(" or Priority Segment status with NBF.","")),infinite),null);
  assert.equal(parseNbfConventional(change("platinum-kfs-name",replace("NBF PLATINUM","NBF ISLAMIC PLATINUM")),platinum),null);
  assert.equal(parseNbfConventional(change("infinite-kfs-network",replace("Visa","Mastercard")),infinite),null);
  assert.equal(parseNbfConventional(change("infinite-kfs-fee",replace("Lifetime free","AED 750")),infinite),null);
  assert.equal(parseNbfConventional(change("tariff-fee",s=>({...s,reviewedRenderSha256:"0".repeat(64)})),infinite),null);
  assert.equal(parseNbfConventional(change("tariff-priority",replace("not maintained","maintained")),infinite),null);
});

test("NBF conventional: no unconditional consumer fee, qualification, return or Product price",()=>{
  const primary=[infinite,platinum].map(slug=>({slug,...getCardData(slug)!}));
  const active=new Set(getActiveCards().map(card=>card.slug));
  const confirmed=new Set(getEditorConfirmedCards().map(card=>card.slug));
  const stats=buildFeeIndex(primary);
  assert.equal(stats.freeForLife,0);
  assert.equal(stats.annualFeeSampleSize,0);
  assert.equal(stats.annualFeePending,2);
  for(const row of stats.rows) assert.equal(feeIndexAnnualFeeLabel(row),"Pending");
  for (const card of primary) {
    assert.ok(active.has(card.slug));
    assert.ok(!confirmed.has(card.slug));
    assert.ok(cardFeeNeedsReview(card,"annualFee"));
    assert.deepEqual(annualFeeLabel(card),{amount:"Pending",qual:null});
    assert.equal(hasUsableSalaryMinimum(card),false);
    assert.equal(card.eligibility.minSalary,null);
    assert.equal(card.eligibility.salaryTransferRequired,null);
    assert.equal(card.eligibility.residencyRequired,null);
    assert.equal(loyaltyTag(card.loyaltyProgram),"points");
    assert.equal(card.fxFee,null);
    assert.equal(card.joiningFee,undefined);
    assert.ok(!Object.hasOwn(data[card.slug as keyof typeof NBF_CONVENTIONAL],"welcomeBonus"));
    const finder=finderEvidence(card);
    assert.equal(finder.comparableAnnualFee,null);
    assert.equal(finder.salaryPending,true);
    assert.deepEqual(finder.rankRates,{});
    assert.match(cardSearchMetadata(card).description,/Standard annual fee: Pending/);
    assert.doesNotMatch(cardSearchMetadata(card).description,/Free|guaranteed approval/i);
  }
  const compare=cardComparisonRows(primary[0],primary[1]);
  assert.equal(compare.find(row=>row.key==="annualFee")?.winner,"none");
  assert.equal(compare.find(row=>row.key==="minSalary")?.winner,"none");
});

test("NBF hub routes resolve all four labelled cards with no new image dependency",()=>{
  const hub=readFileSync("src/content/banks/nbf.mdx","utf8");
  for(const slug of [infinite,platinum,"nbf-islamic-visa-infinite","nbf-islamic-platinum-exclusive"]){
    assert.match(hub,new RegExp("/cards/"+slug+"/"));
    assert.ok(readFileSync("src/content/cards/"+slug+".mdx","utf8").includes("slug: "+slug));
  }
  assert.match(hub,/can levy fees or replace the card if a customer stops meeting Priority conditions/);
});
