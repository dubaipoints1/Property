import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { RAKBANK_EXPANSION_PRODUCTS, parseRakbankActiveProduct, rakbankSourceIds } from '../../scripts/scrape/_rakbank-expansion.ts';
import { annualFeeLabel } from '../../src/lib/cardsDataFormat.ts';
import { hasUsableSalaryMinimum } from '../../src/lib/cardEligibility.ts';
import { eligibleForSalaryFilter } from '../../src/lib/cardSelection.ts';
import { getCardData } from '../../src/lib/cardsData';
import { cardSearchMetadata } from '../../src/lib/cardSearchMetadata';

const read = (f:string) => JSON.parse(readFileSync(new URL(f,import.meta.url),'utf8'));
const sources = ():Parameters<typeof parseRakbankActiveProduct>[0] => read('./fixtures/2026-11-rakbank-expansion.json').sources;
const sha = (s:string) => createHash('sha256').update(s).digest('hex');

test('RED and Titanium expose their named RAKBANK profiles but neither is salary-matched or promoted',()=>{
  const cards = read('../../src/data/cards.json');
  const registry = read('../../scripts/scrape/manual-primary.registry.json').cards;
  const routes = new Set();
  for (const [slug, product] of Object.entries(RAKBANK_EXPANSION_PRODUCTS)) {
    const facts = parseRakbankActiveProduct(sources(),slug);
    assert.ok(facts,slug);
    const card = cards[slug];
    assert.equal(card.name,`RAKBANK ${facts.name}`);
    assert.equal(card.network,facts.network);
    assert.equal(card.joiningFee.amount,facts.joiningFee);
    assert.equal(card.annualFee.amount,facts.annualFee);
    assert.equal(card.vatPolicy,'inclusive');
    assert.deepEqual(annualFeeLabel(card),{amount:'Free',qual:null});
    assert.equal(card.eligibility.publishedMinMonthlyIncome,facts.publishedMinMonthlyIncome);
    assert.equal(getCardData(slug)?.eligibility.publishedIncomeBasis,'salaried-applicants');
    assert.match(cardSearchMetadata(getCardData(slug)!).description, /Standard annual fee: none; no listed joining fee/);
    assert.equal(card.eligibility.minSalary,null);
    assert.equal(card.eligibility.salaryTransferRequired,null);
    assert.equal(hasUsableSalaryMinimum(card),false);
    assert.equal(eligibleForSalaryFilter(card._provenance,card.eligibility.minSalary),false);
    assert.equal(card.applyUrl,facts.applyUrl);
    assert.ok(!routes.has(card.applyUrl));
    routes.add(card.applyUrl);
    assert.equal(card.kfsUrl,facts.kfsUrl);
    assert.deepEqual(card._fieldEvidence,facts.evidence);
    assert.equal(card.refreshMode,'manual-primary');
    assert.equal(card.fxFee,null);
    assert.deepEqual(card.earnRates,{everythingElse:null});
    assert.equal(card.welcomeBonus,undefined);
    assert.equal(card.annualFeeWaiver,undefined);
    const entry = registry.filter((s:{slug:string})=>s.slug===slug);
    assert.equal(entry.length,1);
    assert.equal(entry[0].productUrl,card.applyUrl);
    assert.equal(entry[0].kfsUrl,card.kfsUrl);
    assert.deepEqual(entry[0].sourceFixtureIds,rakbankSourceIds(product.id));
    assert.match(readFileSync(new URL(`../../src/content/cards/${slug}.mdx`,import.meta.url),'utf8'),new RegExp(`^slug: ${slug}$`,'m'));
  }
  const layout = readFileSync(new URL('../../src/layouts/CardReviewLayout.astro',import.meta.url),'utf8');
  assert.match(layout, /slug === "rakbank-red" \|\| slug === "rakbank-titanium"/);
});

test('collects neither disputed Air Arabia year-one fees nor extra card variants',()=>{
  assert.equal(parseRakbankActiveProduct(sources(),'rakbank-air-arabia-platinum'),null);
  assert.equal(parseRakbankActiveProduct(sources(),'rakbank-world'),null);
  assert.equal(parseRakbankActiveProduct(sources(),'rakbank-business-titanium'),null);
});

test('rejects a changed fee, renamed group, KFS or catalogue mix-up, income drift and nonissuer application',()=>{
  const edit = (id:string, fn:(x:string)=>string)=>sources().map(s=>s.id===id?{...s,text:fn(s.text),fixtureTextSha256:sha(fn(s.text))}:s);
  assert.equal(parseRakbankActiveProduct(edit('fees-primary',s=>s.replace('Free','420')),'rakbank-red'),null);
  assert.equal(parseRakbankActiveProduct(edit('fees-primary',s=>s.replace('Titanium, Red','Titanium, Blue')),'rakbank-red'),null);
  assert.equal(parseRakbankActiveProduct(edit('catalogue-titanium-income',s=>s.replace('8,000','7,000')),'rakbank-titanium'),null);
  assert.equal(parseRakbankActiveProduct(edit('catalogue-red-apply',s=>s.replace('apps.rakbank.ae','other.invalid')),'rakbank-red'),null);
  assert.equal(parseRakbankActiveProduct(sources().map(s=>s.id==='kfs-titanium-income'?{...s,url:RAKBANK_EXPANSION_PRODUCTS['rakbank-red'].kfs}:s),'rakbank-titanium'),null);
  assert.equal(parseRakbankActiveProduct(sources().map(s=>s.id==='catalogue-red-income'?{...s,sourceStartByte:0}:s),'rakbank-red'),null);
  assert.equal(parseRakbankActiveProduct(sources().concat(sources().slice(0,1)),'rakbank-red'),null);
});
