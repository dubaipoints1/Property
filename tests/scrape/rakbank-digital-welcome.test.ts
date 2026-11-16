import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseRakbankDigitalWelcome } from '../../scripts/scrape/_rakbank-digital-welcome.ts';

const get = (path:string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const fixture = JSON.parse(get('./fixtures/2026-11-16-rakbank-digital-welcome.json'));
const cases = [['rakbank-titanium',500,5000], ['rakbank-world',750,10000]] as const;
const aed = new Intl.NumberFormat('en-AE');

test('named source rows replay the approved dated review copy without feeding the canonical welcome fields',()=>{
  const cards=JSON.parse(get('../../src/data/cards.json'));
  for (const [slug,cashback,spend] of cases) {
    const parsed=parseRakbankDigitalWelcome(fixture,slug);
    assert.ok(parsed,slug);
    assert.deepEqual([parsed.cashbackAed,parsed.spendAed,parsed.daysAfterIssuance,parsed.closes],[cashback,spend,60,'31 December 2026']);
    const doc=get(`../../src/content/cards/${slug}.mdx`);
    assert.ok(doc.includes(`**AED ${aed.format(parsed.cashbackAed)} cashback** after **AED ${aed.format(parsed.spendAed)} in qualifying spend within ${parsed.daysAfterIssuance} days of card issuance**`));
    for (const exact of [parsed.closes,parsed.termsUrl,parsed.productUrl,'issued through that channel','not counted in our comparisons','first eligible card','at least six months','self-employed customers do not qualify','90 business days','first 12 months']) assert.ok(doc.includes(exact),exact);
    assert.equal(cards[slug].welcomeBonus??null,null);
    assert.equal(cards[slug]._provenance.welcomeBonus,'needs-review');
  }
});

test('rejects an unknown/withheld card, bad digest, edition drift, changed coupon or shuffled columns',()=>{
  assert.equal(parseRakbankDigitalWelcome(fixture,'rakbank-red'),null);
  const expired=structuredClone(fixture);
  expired.asOfDubai='2027-01-01';
  assert.equal(parseRakbankDigitalWelcome(expired,'rakbank-titanium'),null);
  const badHash=structuredClone(fixture);
  badHash.terms.exclusions.rawSha256='0'.repeat(64);
  assert.equal(parseRakbankDigitalWelcome(badHash,'rakbank-world'),null);
  const blocked=structuredClone(fixture);
  const row=blocked.rows['rakbank-world'];
  row.raw=row.raw.replace(/10,000( +)60( +)750/,'10,000$1750$260');
  row.rawSha256=createHash('sha256').update(row.raw).digest('hex');
  assert.notEqual(row.raw,fixture.rows['rakbank-world'].raw);
  assert.equal(parseRakbankDigitalWelcome(blocked,'rakbank-world'),null);
  const swapped=structuredClone(fixture);
  [swapped.rows['rakbank-titanium'],swapped.rows['rakbank-world']]=[swapped.rows['rakbank-world'],swapped.rows['rakbank-titanium']];
  assert.equal(parseRakbankDigitalWelcome(swapped,'rakbank-titanium'),null);
});
