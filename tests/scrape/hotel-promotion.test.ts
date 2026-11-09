import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseAccorHotelResearch, type HotelResearchSource } from '../../scripts/scrape/_hotel-promotion.ts';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const fixture = () => JSON.parse(readFileSync('tests/scrape/fixtures/2026-11-accor-hotel-terms.json', 'utf8')).sources as { promotion: HotelResearchSource; membership: HotelResearchSource };
const change = (source: HotelResearchSource, find: string | RegExp, replacement: string) => {
  source.text = source.text.replace(find, replacement); source.textSha256 = sha(source.text);
};
const run = () => { const { promotion, membership } = fixture(); return parseAccorHotelResearch(promotion, membership); };

test('real curated STAY/table/redemption excerpts produce source-specific review candidates, never a rate comparison', () => {
  const result = run();
  assert.equal(result.state, 'review-only'); assert.deepEqual(result.errors, []);
  assert.equal(result.automaticAcceptanceAllowed, false);
  assert.equal(result.matchedRateComparisonAvailable, false);
  assert.equal(result.sourceCompletenessCertified, false);
  const terms = result.terms!;
  assert.deepEqual(terms.registration.value, { from: '2026-10-27', through: '2026-12-13', deadlineText: '11:59 p.m. Central European Time (CET)' });
  assert.deepEqual(terms.booking.value, terms.registration.value);
  assert.deepEqual(terms.stay.value, { from: '2026-10-27', through: '2027-03-31' });
  assert.equal(terms.minimumNights.value, 2);
  assert.equal(terms.classicBasedMultiplier.value, 2);
  assert.equal(terms.postingDays.value, 10);
  assert.deepEqual(terms.classicDefaultBrandEarn.value, { points: 25, eligibleEUR: 10 });
  assert.deepEqual(terms.onlineRedemption.value, { minimumPoints: 1000, minimumDiscountEUR: 20, secondBlockPoints: 2000, secondDiscountEUR: 40, incrementAfterSecondBlock: 2000 });
  assert.equal(Object.hasOwn(result, 'fxRate'), false);
  assert.equal(Object.hasOwn(result, 'aedSaving'), false);
});

test('every observation retains exact supplied-text spans, source hashes and pending acceptance', () => {
  const sources = fixture(), result = parseAccorHotelResearch(sources.promotion, sources.membership);
  assert.equal(result.state, 'review-only');
  for (const term of Object.values(result.terms!)) {
    assert.equal(term.approval, 'pending');
    for (const evidence of [term.evidence, ...(term.supportingEvidence ?? [])]) {
      const source = evidence.url === sources.promotion.url ? sources.promotion : sources.membership;
      assert.equal(source.text.slice(evidence.start, evidence.end), evidence.quote);
      assert.equal(evidence.inputTextSha256, sha(source.text));
      assert.equal(evidence.sourceMarkdownSha256, source.sourceMarkdownSha256);
      assert.notEqual(evidence.inputTextSha256, evidence.sourceMarkdownSha256);
      assert.equal(evidence.representation, 'sanitised-source-excerpt');
      assert.equal(evidence.lineStart, source.text.slice(0, evidence.start).split('\n').length);
    }
  }
  const support = result.terms!.classicDefaultBrandEarn.supportingEvidence!;
  assert.ok(support.some(item => item.quote.includes('€10')));
  assert.ok(support.some(item => item.quote.includes('PARTICIPATING')));
  assert.ok(support.some(item => item.quote.includes('Novotel Living')));
});

test('changed hashes, unsupported URLs and falsely complete excerpts fail closed', () => {
  for (const mutate of [
    (p: HotelResearchSource) => { p.text += '\nchanged'; },
    (p: HotelResearchSource) => { p.url = p.url.replace('all.accor.com', 'all.accor.com.attacker.example'); },
    (p: HotelResearchSource) => { p.representation = 'returned-markdown'; },
    (p: HotelResearchSource) => { p.sourceMarkdownSha256 = p.textSha256; },
    (p: HotelResearchSource) => { p.scrapeId = ''; },
  ]) {
    const { promotion, membership } = fixture(); mutate(promotion);
    const result = parseAccorHotelResearch(promotion, membership);
    assert.equal(result.state, 'hold'); assert.equal(result.terms, null);
  }
});

test('DINE values outside the STAY boundary cannot satisfy missing STAY terms', () => {
  const { promotion, membership } = fixture();
  change(promotion, 'Stays of two (2) nights or more', 'Missing stay condition');
  promotion.text += '\nStays of two (2) nights or more\n';
  promotion.textSha256 = sha(promotion.text);
  assert.equal(parseAccorHotelResearch(promotion, membership).state, 'hold');
});

test('missing or duplicate campaign sections and duplicate scoped values fail closed', () => {
  for (const [find, replacement] of [
    ['2X DINE ALL ACCOR FESTIVE OFFER 2026', 'Missing boundary'],
    ['2X STAY ALL ACCOR FESTIVE OFFER 2026', '2X STAY ALL ACCOR FESTIVE OFFER 2026\n2X STAY ALL ACCOR FESTIVE OFFER 2026'],
    ['within 10 days of the member checking out.', 'within 10 days of the member checking out.\nReward points will be credited to the member’s account within 11 days of the member checking out.'],
    ['Only bookings made after successful registration via the login button are eligible for this bonus offer.', 'No registration ordering evidence.'],
  ]) {
    const { promotion, membership } = fixture(); change(promotion, find, replacement);
    assert.equal(parseAccorHotelResearch(promotion, membership).state, 'hold');
  }
});

test('ambiguous minimum stay, invalid dates and reversed source windows fail closed', () => {
  for (const [find, replacement] of [
    ['Stays of two (2)', 'Stays of two (3)'],
    ['31 March 2027', '32 March 2027'],
    ['31 March 2027', '26 October 2026'],
  ]) {
    const { promotion, membership } = fixture(); change(promotion, find, replacement);
    assert.equal(parseAccorHotelResearch(promotion, membership).state, 'hold');
  }
});

test('column reorder, duplicate CLASSIC rows and missing unit/long-stay footnote never guess a brand scale', () => {
  for (const [find, replacement] of [
    ['PARTICIPATING\u00a0BRANDS', 'OTHER\u00a0BRANDS'],
    ['| CLASSIC | 25 | 12.5 | 10 | 5 |', '| CLASSIC | 25 | 12.5 | 10 | 5 |\n| CLASSIC | 50 | 25 | 20 | 10 |'],
    ['FOR €10 IN ELIGIBLE EXPENSES', 'Missing unit'],
    ['Novotel Living, Mercure Living.', 'Missing long-stay brand distinction.'],
  ]) {
    const { promotion, membership } = fixture(); change(membership, find, replacement);
    assert.equal(parseAccorHotelResearch(promotion, membership).state, 'hold', String(find));
  }
});

test('online redemption requires its own complete scoped clause, not on-site or partner numbers', () => {
  for (const [find, replacement] of [
    ['On the website and in the ALL Accor app', 'At a partner website'],
    ['(after 2,000 Reward Points)', '(after 3,000 Reward Points)'],
    ['## 11\\. MEMBER ACCOUNT ISSUES', 'Missing redemption end'],
  ]) {
    const { promotion, membership } = fixture(); change(membership, find, replacement);
    assert.equal(parseAccorHotelResearch(promotion, membership).state, 'hold');
  }
});

test('curated fixture has no login fragment, incident/network identifiers or full-source claim', () => {
  for (const source of Object.values(fixture())) {
    assert.equal(source.representation, 'sanitised-source-excerpt');
    assert.notEqual(source.sourceMarkdownSha256, source.textSha256);
    assert.equal(sha(source.text), source.textSha256);
    assert.doesNotMatch(source.text, /Access denied|Incident ID|login\.accor|Client IP|key=/i);
  }
});
