import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {ISLAMIC_CARDS, parseFabRakIslamic} from "../../scripts/scrape/_fab-rak-islamic.ts";
import {getActiveCards, getCardData, getEditorConfirmedCards} from "../../src/lib/cardsData";
import {hasUsableSalaryMinimum} from "../../src/lib/cardEligibility";
import {finderEvidence} from "../../src/lib/finderEvidence";
import rows from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-fab-rak-islamic.json";

const sources=fixture.sources as Parameters<typeof parseFabRakIslamic>[0];
const fab="fab-cashback-islamic", rak="rakbank-islamic-world";
const replace=(slug:string, suffix:string, from:string, to:string, rehash=true) => sources.map(x=>{
  if (x.id!==slug+"-"+suffix) return x;
  const text=x.text.replace(from,to);
  assert.notEqual(text,x.text);
  return {...x,text,fixtureTextSha256:rehash?createHash("sha256").update(text).digest("hex"):x.fixtureTextSha256};
});

test("exact Islamic variants parse only verified primary annual fees and published income",()=>{
  const f=parseFabRakIslamic(sources,fab),r=parseFabRakIslamic(sources,rak);
  assert.ok(f&&r);
  assert.deepEqual([f.annualFee,f.vatPolicy,f.income,f.incomeBasis,f.network],[315,"inclusive",5000,"salary","Mastercard"]);
  assert.deepEqual([r.annualFee,r.vatPolicy,r.income,r.incomeBasis,r.network,r.loyaltyProgram],[0,undefined,20000,"salaried-applicants","Mastercard","RAKrewards"]);
  assert.ok(f.evidence.annualFee.some(p=>p.vatTreatment==="exclusive"));
  assert.ok(f.evidence.annualFee.some(p=>p.vatTreatment==="inclusive"));
  assert.equal(parseFabRakIslamic(sources,"fab-cashback"),null);
  assert.equal(parseFabRakIslamic(sources,"rakbank-world"),null);
});

test("FAB rejects wrong variant, annual fee, VAT or conflicting salary, and unpinned excerpts",()=>{
  for (const [s,old,next] of [["salary-repeat","5,000","7,000"],["kfs-fee","D 315","D 325"],["kfs-columns","Inclusive of VAT","Excluding VAT"],
      ["kfs-fee","Cashback Islamic","Cashback conventional"],["tariff-fee","D 300","D 400"],["guide-fee","D 315","D 320"],["network","Mastercard","Visa"]])
    assert.equal(parseFabRakIslamic(replace(fab,s,old,next),fab),null,s);
  assert.equal(parseFabRakIslamic(replace(fab,"salary","5,000","7,000",false),fab),null);
  assert.equal(parseFabRakIslamic(sources.filter(x=>x.id!==fab+"-kfs-fee"),fab),null);
});

test("RAKBANK rejects unrelated World variants, fee columns, roles or excluded source scopes",()=>{
  for (const [s,old,next] of [["kfs-title","Islamic World","World Cashback"],["kfs-eligibility","for salaried applicants","all applicants"],
      ["kfs-fee","primary card holder","supplementary holder"],["tariff-fee","World","Platinum"],["tariff-columns","Primary Card","Supplementary Card"],
      ["programme","RAKrewards","Cashback"],["kfs-link","kfs055","kfs0041"]])
    assert.equal(parseFabRakIslamic(replace(rak,s,old,next),rak),null,s);
  const wrongPage=sources.map(s=>s.id===rak+"-kfs-fee"?{...s,sourceScope:"PDF page 2"}:s);
  assert.equal(parseFabRakIslamic(wrongPage,rak),null);
});

test("active profiles keep exact source pins and are ineligible for verified Finder salary or ranked rewards",()=>{
  const active=new Set(getActiveCards().map(c=>c.slug));
  const matched=new Set(getEditorConfirmedCards().map(c=>c.slug));
  for(const slug of [fab,rak] as const){
    const e=parseFabRakIslamic(sources,slug),c=getCardData(slug),row=rows[slug];
    assert.ok(e&&c);
    assert.equal(row.name,e.name);assert.equal(row.network,e.network);assert.equal(row.annualFee.amount,e.annualFee);
    assert.equal(row.eligibility.publishedMinMonthlyIncome,e.income);
    assert.equal(row.eligibility.publishedIncomeBasis,e.incomeBasis);
    assert.equal(row.eligibility.minSalary,null);assert.equal(row.eligibility.salaryTransferRequired,null);
    assert.equal(row.applyUrl,ISLAMIC_CARDS[slug].product);assert.equal(row.kfsUrl,e.kfs);
    assert.equal(row.lastVerified,e.capturedDate);assert.equal(row.refreshMode,"manual-primary");
    assert.deepEqual(row._fieldEvidence,JSON.parse(JSON.stringify(e.evidence)));
    assert.deepEqual(row.sources,e.sources);
    assert.equal(row.fxFee,null);
    for(const key of ["joiningFee","annualFeeWaiver","welcomeBonus","scopedEarnRates","_features"])
      assert.equal(Object.hasOwn(row,key),false,key);
    assert.deepEqual(row.earnRates,{everythingElse:null});assert.ok(row.categories.includes("Islamic"));
    assert.ok(active.has(slug));assert.ok(!matched.has(slug));assert.equal(hasUsableSalaryMinimum(c),false);
    assert.deepEqual(finderEvidence(c).rankRates,{});assert.equal(finderEvidence(c).fallbackPending,true);
  }
});
