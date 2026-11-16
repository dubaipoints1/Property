import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseAdcbTouchPointsDetail } from '../../scripts/scrape/_adcb-touchpoints-detail.ts';

const src = 'https://www.adcb.com/en/personal/cards/credit-cards/';
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const shared = 'Please note you will earn 0.4 TouchPoints for every 1 AED of domestic spends at supermarkets, auto dealers, insurance, quick service restaurants (i.e. fast food restaurants) and 0.2 TouchPoints for spends at fuel, education, government services, real estate, tele communication, charity and transport. For retail purchases made at merchants based in the United Kingdom and Europe (i.e. countries which are part of European Economic Area), you will earn 0.40 TouchPoints for every 1 AED equivalent of spends.';
const products = [
  ['adcb-touchpoints-infinite', 'touchpoint-ic', 'Infinite', 65, '1.5', '15,000', 'b17144a7f03113f27c539ff3778602ac80396108a36c3d18d153b63d37d2e017'],
  ['adcb-touchpoints-platinum', 'touchpoint-platinum-cc', 'Platinum', 61, '1', '10,000', '5bbd9aea6de7ab0d30ca6850c95e1eb47d3e6e47282a217f817ac641de81168c'],
  ['adcb-touchpoints-titanium-gold', 'touchpoint-tg-cc', 'Gold or Titanium', 61, '0.5', '5,000', 'c0248529a34fce4e0f327c65cebde09e48a577699840a9d53cde402ded18f47e'],
] as const;
function fixture([, path, variant, n, rate, spend]: (typeof products)[number]) {
  const lineText = [
    `L${n}: Learn more about the ADCB TouchPoints ${variant} Credit Card.`,
    `L${n + 2}:   * Earn up to ${rate} ${rate === '1.5' ? 'TouchPoints' : 'TouchPoint'} for every AED 1 spent with your card`,
    `L${n + 3}: * Receive ${spend} bonus TouchPoints when you spend AED ${spend} each month`,
    `L${n + 5}: Qualifying spends includes all retail transactions (net of reversals and refunds) and excludes any form of disputed purchases and cash withdrawals.`,
    `L${n + 6}: ${shared}`,
    `L${n + 7}: Classification of merchants in the above mentioned categories and European Economic Area will be as per prevailing ${variant === 'Infinite' ? 'Visa' : 'schemes (Visa/Mastercard)'} guidelines.`,
  ].join('\n');
  return { url: src + path, capturedAt: '2026-11-16T18:01:20.826Z', lineText, sourceTextSha256: sha(lineText) };
}

for (const p of products) {
  test(`${p[0]} issuer wording remains card-specific and detail-only`, () => {
    const observed = parseAdcbTouchPointsDetail(fixture(p), p[0]);
    assert.ok(observed);
    assert.equal(observed.classification, 'detail-only');
    assert.equal(observed.advertisedUpperBound, Number(p[4]));
    assert.equal(observed.monthlyBonusPoints, Number(p[5].replace(',', '')));
    assert.equal(observed.monthlySpendTriggerAed, Number(p[5].replace(',', '')));
    assert.equal(observed.domesticHigh, 0.4);
    assert.equal(observed.domesticLow, 0.2);
    assert.equal(observed.ukEuropeIssuerClassified, 0.4);
    assert.equal(observed.merchantClassification, p[2] === 'Infinite' ? 'Visa' : 'applicable Visa or Mastercard');
    assert.match(observed.qualifyingRetail, /net of reversals and refunds; excludes disputed purchases and cash withdrawals/i);
    assert.equal(observed.universalBase, null);
    assert.equal(observed.cap, null);
    assert.equal(observed.evidence[1].sha256, p[6]);
    const review = readFileSync(new URL(`../../src/content/cards/${p[0]}.mdx`, import.meta.url), 'utf8');
    assert.match(review, /omitFields=\{\["earnRates"\]\}/);
    assert.match(review, /No all-spend rate or cash value has been estimated/i);
    assert.match(review, /on eligible domestic purchases in fuel/);
    assert.doesNotMatch(review, /^- \*\*[^\n]*\b(?:charity|insurance|insurers)\b/m);
    assert.match(review, /deducts reversals and refunds and excludes disputed purchases and cash withdrawals/);
    assert.match(review, /qualifying retail spend in a calendar month/);
    assert.match(review, /exclude charitable donations and specified insurance payments/);
    assert.match(review, /up to your assigned credit limit/);
    assert.match(review, /cb-tnc-touchpoints-credit-card\.pdf/);
    assert.match(review, /cb-tnc-touchpoints-reward-program\.pdf/);
    assert.match(review, /Don’t assume every UK or European purchase qualifies/);
    assert.match(review, /id: "earn-rates"/);
    assert.doesNotMatch(review, /<EarnRateTable\b/);
  });
}

test('deterministic TouchPoints review fails closed on different region, card, scope, receipt or duplicated clauses', () => {
  const p = products[0];
  const source = fixture(p);
  assert.equal(parseAdcbTouchPointsDetail(source, products[1][0]), null);
  assert.equal(parseAdcbTouchPointsDetail({ ...source, sourceTextSha256: 'wrong' }, p[0]), null);
  assert.equal(parseAdcbTouchPointsDetail({ ...source, url: source.url.replace('www.adcb.com', 'www.adcb.ae') }, p[0]), null);
  for (const lineText of [
    source.lineText.replace('United Kingdom and Europe', 'international markets'),
    source.lineText.replace('supermarkets, auto dealers', 'supermarkets, travel, auto dealers'),
    source.lineText.replace('Earn up to', 'Earn'),
    source.lineText.replace('and excludes any form of disputed purchases and cash withdrawals', 'including disputed purchases and cash withdrawals'),
    source.lineText.replace('prevailing Visa guidelines', 'prevailing Mastercard guidelines'),
    source.lineText + '\n' + source.lineText.split('\n')[2],
  ]) {
    assert.equal(parseAdcbTouchPointsDetail({ ...source, lineText, sourceTextSha256: sha(lineText) }, p[0]), null);
  }
});
