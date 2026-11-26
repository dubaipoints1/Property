import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import fixtures from "./fixtures/2026-11-mashreq-islami-cashback.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import l2 from "../../src/data/cards.json";
import { MASHREQ_AL_ISLAMI_CASHBACK as slug, parseMashreqAlIslamiCashback } from "../../scripts/scrape/_mashreq-alislami-cashback.ts";
import { loadCoverageInputs, auditCardSourceCoverage } from "../../scripts/ci/check-card-source-coverage.mjs";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";

const sources = fixtures.sources;
type Source = (typeof sources)[number];
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function alter(role: string, replace: (s: Source) => void) {
  const copy = structuredClone(sources), row = copy.find(s=>s.id === "mashreq-islami-cashback-" + role);
  assert.ok(row);
  replace(row);
  row.fixtureTextSha256 = hash(row.text);
  return copy;
}

test("exact base Al Islami replays standard primary annual fee and nothing about joining, 24X7, or reward maths", () => {
  const r = parseMashreqAlIslamiCashback(sources,slug);
  assert.ok(r);
  assert.equal(r.annualFee,0);
  assert.equal(r.vatPolicy,"inclusive");
  assert.equal(r.capturedDate,"2026-11-26");
  assert.deepEqual(r.sourceFixtureIds,sources.map(s=>s.id));
  assert.deepEqual(Object.keys(r.evidence),["name","annualFee"]);
  assert.ok(r.sources.every(s=>!s.includes("otp-send")));
  for (const x of ["mashreq-cashback","mashreq-24x7-cashback","mashreq-alislami-24x7-cashback"])
    assert.equal(parseMashreqAlIslamiCashback(sources,x),null,x);
  for (const x of ["joiningFee","annualFeeWaiver","welcomeBonus","fxFee","eligibility","earnRates","loyaltyProgram"])
    assert.ok(!Object.hasOwn(r,x),x);
});

test("hold on swapped base/24X7 identity, acquisition, physical column, supplementary or contrary price", () => {
  const cases: readonly [string,(s: Source)=>void][] = [
    ["heading",s=>{s.text=s.text.replace("Cashback Credit Card","24X7 Cashback Credit Card");}],
    ["acquisition",s=>{s.text=s.text.replace("maicashback","cashback");}],
    ["acquisition",s=>{s.sourceStartByte=0;}],
    ["headline",s=>{s.text=s.text.replace("No annual fees","No annual fees in year one");}],
    ["kfs-pricing",s=>{s.text=s.text.replace("Free for Life","AED 682.50");}],
    ["kfs-pricing",s=>{s.text=s.text.replace("Annual fee (primary)","Annual fee (supplementary)");}],
    ["tariff-vat",s=>{s.text=s.text.replace("inclusive","exclusive");}],
    ["tariff-principal",s=>{s.text=s.text.replace("Mashreq Al Islami Cashback Card","Mashreq Al Islami 24X7 Cashback Card");}],
    ["tariff-principal",s=>{s.text=s.text.replace("Principal Annual Fee","Supplementary Annual Fee");}],
    ["tariff-principal",s=>{
      const t=s.text.split("\n"); t[2] = t[2].slice(0,150) + "First year free".padStart(35).padEnd(48) + t[2].slice(198);
      s.text=t.join("\n");
    }],
  ];
  for (const [role,fn] of cases) assert.equal(parseMashreqAlIslamiCashback(alter(role,fn),slug),null,role);
  assert.equal(parseMashreqAlIslamiCashback([...sources,sources[0]],slug),null);
  assert.equal(parseMashreqAlIslamiCashback(sources.slice(1),slug),null);
  assert.equal(parseMashreqAlIslamiCashback(sources.map(s=>s.id.endsWith("headline") ? {...s,fixtureTextSha256:"0".repeat(64)} : s),slug),null);
});

test("one separate partial listing, product-page CTA only, no shared Finder ranking or unverified terms", () => {
  const r=parseMashreqAlIslamiCashback(sources,slug), raw=l2[slug], c=getCardData(slug);
  assert.ok(r && raw && c && getActiveCards().some(card=>card.slug===slug));
  assert.equal(c.network,"Visa");
  assert.ok(c.sharia);
  assert.deepEqual([c.name,c.annualFee.amount,c.vatPolicy],[r.name,r.annualFee,r.vatPolicy]);
  assert.deepEqual([c.applyUrl,c.kfsUrl,c.sources],[r.productUrl,r.kfsUrl,r.sources]);
  assert.deepEqual(raw._fieldEvidence,r.evidence);
  assert.deepEqual(registry.cards.find(x=>x.slug===slug)?.sourceFixtureIds,r.sourceFixtureIds);
  assert.equal(hasUsableSalaryMinimum(c),false);
  assert.deepEqual([finderEvidence(c).salaryPending,finderEvidence(c).rankRates],[true,{}]);
  const terms=cardValueTerms(c,slug);
  assert.equal(terms.rate,null);
  assert.equal(terms.hasWelcomeOffer,false);
  assert.equal(c.fxFee,null);
  for (const k of ["joiningFee","annualFeeWaiver","welcomeBonus","loyaltyProgram","interestRate"])
    assert.ok(!Object.hasOwn(raw,k),k);
});

test("offline auditor permits exact Islamic window issuer host only for Mashreq", () => {
  const root=fileURLToPath(new URL("../../",import.meta.url)), options={asOf:"2026-11-26"};
  const valid=loadCoverageInputs(root);
  assert.equal(auditCardSourceCoverage(valid,options).summary.errors,0);
  for (const href of [
    "https://mashreqalislami.com/en/uae/neo/cards/",
    "https://bogus.mashreqalislami.com/en/uae/neo/cards/",
    "https://www.mashreqalislami.com.attacker.com/en/uae/neo/cards/",
    "https://user@www.mashreqalislami.com/en/uae/neo/cards/",
  ]) {
    const input=loadCoverageInputs(root);
    input.cards[slug].sources=[href,...input.cards[slug].sources.slice(1)];
    assert.ok(auditCardSourceCoverage(input,options).errors.some(e=>e.slug===slug && e.code==="source-url"),href);
  }
  const wrongBank=loadCoverageInputs(root);
  wrongBank.cards["dib-prime-gold"].sources[0]=valid.cards[slug].sources[0];
  assert.ok(auditCardSourceCoverage(wrongBank,options).errors.some(e=>e.slug==="dib-prime-gold" && e.code==="source-url"));
});
