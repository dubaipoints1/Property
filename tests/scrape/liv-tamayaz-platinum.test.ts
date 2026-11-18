import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { LIV_TAMAYAZ_PLATINUM as profile, parseLivTamayazPlatinum } from "../../scripts/scrape/_liv-tamayaz-platinum";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { annualFeeLabel, loyaltyTag } from "../../src/lib/cardsDataFormat";
import catalogue from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-liv-tamayaz-platinum.json";

const { slug } = profile;
const inputs = fixture.sources;
type Source = typeof inputs[number];
function alter(id: string, fn: (s: Source) => Source) {
  return inputs.map(s => {
    if (s.id !== slug + "-" + id) return s;
    const changed = fn(s);
    return { ...changed, fixtureTextSha256: createHash("sha256").update(changed.text).digest("hex") };
  });
}
const replace = (from: string | RegExp, to: string) => (source: Source) => ({ ...source, text: source.text.replace(from,to) });

test("Liv Tamayaz Platinum: reproduce exact bank card and two independent PDF columns", () => {
  const parsed = parseLivTamayazPlatinum(inputs,slug);
  assert.ok(parsed);
  assert.equal(parsed.name,"Liv Tamayaz Platinum Credit Card");
  assert.equal(parsed.network,"Mastercard");
  assert.equal(parsed.loyaltyProgram,"Tamayaz Points");
  assert.equal(parsed.income,5000);
  assert.equal(parsed.annualFee,0);
  assert.equal(parsed.joiningFee,0);
  assert.ok(!parsed.sources.some(url=>url===profile.familyApplicationUrl));
  assert.deepEqual(parsed.evidence.annualFee.map(s=>s.firstLine),[23,23]);
  assert.deepEqual(parsed.evidence.joiningFee.map(s=>s.firstLine),[21,21]);
  assert.deepEqual(parsed.evidence["eligibility.publishedMinMonthlyIncome"].map(s=>s.firstLine),[13,13]);
  assert.ok(parsed.evidence.annualFee.every(s=>s.sourceScope==="PDF page 1; Poppler pdftotext -layout"));
  const unrelatedWorldChange = alter("named-kfs",replace(/^(.*Eligibility Criteria – Min\. Salary.*\s+)AED 15,000(\s+N\/A\s*)$/m,"$1AED 99,000$2"));
  assert.equal(parseLivTamayazPlatinum(unrelatedWorldChange,slug)?.income,5000);
});

test("Liv Tamayaz Platinum: reject altered Platinum column, dates, brand and public routes", () => {
  assert.equal(parseLivTamayazPlatinum(inputs,"liv-tamayaz-world"),null);
  assert.equal(parseLivTamayazPlatinum(alter("product-tier",replace("Platinum","World")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("product-apply",replace("/union-coop","/cashback")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("features-network",replace("Mastercard","Visa")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("faq-redemption",replace("at Union Coop store or online","as statement credit")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("faq-route",replace("Liv X mobile app","phone app")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("named-kfs",replace("January 2026","January 2025")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("general-kfs",replace("Tamayaz Platinum   Tamayaz World","Tamayaz World      Tamayaz Platinum")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("general-kfs",replace(/(Eligibility Criteria – Min\. Salary\s+AED 5,000\s+AED 15,000\s+)AED 5,000/,"$1AED 25,000")),slug),null);
  assert.equal(parseLivTamayazPlatinum(alter("named-kfs",replace(/(Joining Fee\*\s+Free for life\s+AED 735\s+)Free for life/,"$1AED 735")),slug),null);
  assert.equal(parseLivTamayazPlatinum(inputs.filter(s=>s.id!==slug+"-general-kfs"),slug),null);
});

test("Liv Tamayaz Platinum: active scoped catalogue profile without generated recommendations", () => {
  const parsed = parseLivTamayazPlatinum(inputs,slug);
  const card = getCardData(slug);
  assert.ok(parsed);
  assert.ok(card);
  const raw = (catalogue as Record<string,unknown>)[slug] as Record<string,unknown>;
  assert.deepEqual(raw._fieldEvidence,JSON.parse(JSON.stringify(parsed.evidence)));
  assert.equal(card.lastVerified.toISOString().slice(0,10),parsed.date);
  assert.equal(card.applyUrl,parsed.productUrl);
  assert.equal(card.kfsUrl,parsed.kfsUrl);
  assert.deepEqual(card.sources,parsed.sources);
  assert.equal(card.joiningFee?.amount,0);
  assert.deepEqual(annualFeeLabel(card),{amount:"Free",qual:null});
  assert.equal(card.eligibility.publishedMinMonthlyIncome,parsed.income);
  assert.equal(card.eligibility.publishedIncomeBasis,"salaried-applicants");
  assert.equal(card.eligibility.minSalary,null);
  assert.equal(hasUsableSalaryMinimum(card),false);
  assert.equal(loyaltyTag(card.loyaltyProgram),"points");
  assert.equal(card.fxFee,null);
  assert.equal(Object.hasOwn(raw,"welcomeBonus"),false);
  assert.deepEqual(finderEvidence(card).rankRates,{});
  assert.equal(finderEvidence(card).salaryPending,true);
  assert.ok(getActiveCards().some(c=>c.slug===slug));
  assert.ok(!getEditorConfirmedCards().some(c=>c.slug===slug));
});
