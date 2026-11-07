import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseAdcbRefreshProduct, parseAdcbRefreshSof, parseAdcbRefreshSupplement, type AdcbRefreshSource } from '../../scripts/scrape/_adcb-refresh.ts';
const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const sof: AdcbRefreshSource = fixture('2026-11-adcb-refresh-sof').sources[0];
const products: Array<AdcbRefreshSource & { id: string }> = fixture('2026-11-adcb-rendered-products').sources;
const expanded: Array<AdcbRefreshSource & { id: string }> = fixture('2026-11-adcb-refresh-expanded').sources;
const supplements: Array<AdcbRefreshSource & { id: string }> = fixture('2026-11-adcb-refresh-supplements').sources;
const hash = (v: string) => createHash('sha256').update(v).digest('hex');
const parsed = (slug: string) => parseAdcbRefreshProduct(products.find(s => s.id === slug)!, slug);
const values = (slug: string) => Object.fromEntries(parsed(slug).map(e => [e.field, e.value]));

test('ADCB current SoF substantiates all eleven annual fees, not missing→zero', () => {
  const fees: Record<string, number> = {
    'adcb-365-cashback': 383.25, 'adcb-betaqti': 2100, 'adcb-essential-cashback': 0,
    'adcb-lulu-platinum': 0, 'adcb-lulu-titanium-gold': 0, 'adcb-shukran': 262.5,
    'adcb-talabat': 0, 'adcb-touchpoints-infinite': 1050, 'adcb-touchpoints-platinum': 630,
    'adcb-touchpoints-titanium-gold': 0, 'adcb-traveller': 1575,
  };
  for (const [slug, amount] of Object.entries(fees)) {
    const events = parseAdcbRefreshSof(sof, slug);
    assert.equal(events.find(e => e.field === 'annualFee.aspire')?.value, amount, slug);
    assert.ok(events.filter(e => e.field.startsWith('annualFee.')).every(e => e.vatTreatment === 'inclusive'));
    assert.equal(events.filter(e => e.field.startsWith('annualFee.')).length, 3);
    assert.equal(events.find(e => e.field === 'fxFee.issuer-non-aed-margin')?.value, slug === 'adcb-traveller' ? 0 : 2.99);
    assert.equal(events.find(e => e.field === 'fxFee.issuer-aed-overseas')?.value, slug === 'adcb-traveller' ? 0 : 2.99);
    assert.ok(!events.some(e => /joiningFee/.test(e.field)));
  }
});

test('ADCB relationship fee columns stay separate from the Aspire scalar', () => {
  const v = (slug: string, field: string) => parseAdcbRefreshSof(sof, slug).find(e => e.field === field)?.value;
  assert.equal(v('adcb-touchpoints-infinite', 'annualFee.excellency-emirati-excellency'), 525);
  assert.equal(v('adcb-traveller', 'annualFee.privilege-emirati'), 787.5);
  assert.equal(v('adcb-touchpoints-platinum', 'annualFee.privilege-emirati'), 315);
  assert.equal(v('adcb-touchpoints-platinum', 'annualFee.excellency-emirati-excellency'), 0);
});

test('ADCB fee parser refuses source/version/VAT/scope/incomplete-table drift', () => {
  const mutate = (text: string) => ({ ...sof, text, fixtureTextSha256: hash(text) });
  const mutateContext = (before: string, after: string) => ({ ...sof, contextFragments: sof.contextFragments!.map(f => {
    const text = f.text.replace(before, after); return { ...f, text, fixtureTextSha256: hash(text) };
  }) });
  for (const source of [
    { ...sof, url: 'https://untrusted.example/fees.pdf' },
    { ...sof, sourceBodySha256: null },
    { ...sof, fixtureTextSha256: '0'.repeat(64) },
    mutateContext('Ver.49/September2026', 'Ver.50/December2026'),
    mutateContext('All fees are inclusive of 5% VAT, where applicable.', 'Fees may exclude VAT.'),
    { ...sof, contextFragments: undefined },
    { ...sof, contextFragments: sof.contextFragments!.map(f => ({ ...f, fixtureTextSha256: 'b'.repeat(64) })) },
    mutate(sof.text.replace(/• Essential Cashback Platinum Card[^\n]*/, '• Unnamed product Free Free Free')),
  ]) assert.deepEqual(parseAdcbRefreshSof(source, 'adcb-essential-cashback'), []);
});

test('ADCB source evidence spans reproduce exact UTF-8 bytes and source lines', () => {
  for (const source of products) {
    for (const e of [...parseAdcbRefreshProduct(source, source.id), ...parseAdcbRefreshSof(sof, source.id)]) {
      const original = e.sourceTextSha256 === sof.sourceTextSha256 ? sof : source;
      const relativeStart = e.sourceStartByte - (original.firstByte ?? 0), relativeEnd = e.sourceEndByte - (original.firstByte ?? 0);
      assert.equal(Buffer.from(original.text).subarray(relativeStart, relativeEnd).toString('utf8'), e.rawText);
      assert.equal(hash(e.rawText), e.rawTextSha256);
      const before = Buffer.from(original.text).subarray(0, relativeStart).toString('utf8');
      assert.equal(original.firstLine - 1 + before.split('\n').length, e.firstLine);
      assert.equal(e.firstLine + e.rawText.slice(0, -1).split('\n').length - 1, e.lastLine);
    }
  }
});

test('ADCB Essential current rates are tiered, not a universal one-percent model', () => {
  const v = values('adcb-essential-cashback');
  assert.equal(v['scopedEarnRates.general-high'], 1.25);
  assert.equal(v.spendTierThreshold, 5000);
  assert.equal(v['scopedEarnRates.general-low'], 1);
  assert.equal(v['scopedEarnRates.select-categories'], 0.75);
  assert.equal(v['earnRates._caps.monthly_max_aed'], 1000);
  assert.equal(v['earnRates._caps.min_monthly_spend_to_qualify_aed'], 1000);
  assert.equal(v['welcomeBonus.amount-upper'], 250);
  assert.equal(v['benefits.loungeVisits'], 4);
  assert.ok(!parsed('adcb-essential-cashback').some(e => e.field === 'earnRates.everythingElse'));
});

test('ADCB Shukran preserves percent-as-Shukrans and geographical exclusions', () => {
  const v = values('adcb-shukran');
  assert.equal(v['scopedEarnRates.shukran-brands'], 10);
  assert.equal(v['scopedEarnRates.other-retail'], 1.5);
  assert.equal(v['scopedEarnRates.reduced-uae'], 0.5);
  assert.equal(v['scopedEarnRates.eea'], 0.5);
  assert.equal(v['welcomeBonus.national-new'], 1200);
  assert.equal(v['welcomeBonus.resident-new'], 1000);
  assert.equal(v['welcomeBonus.existing'], 200);
  assert.ok(!parsed('adcb-shukran').some(e => /everythingElse/.test(e.field)));
});

test('ADCB Traveller does not manufacture an overseas non-travel base', () => {
  const v = values('adcb-traveller');
  assert.equal(v['scopedEarnRates.airfare'], 10);
  assert.equal(v['scopedEarnRates.hotels'], 10);
  assert.equal(v['scopedEarnRates.cinema'], 50);
  assert.equal(v['scopedEarnRates.domestic-other'], 1.5);
  assert.equal(v['earnRates._caps.monthly_max_aed'], 1500);
  assert.equal(v['earnRates._caps.min_monthly_spend_to_qualify_aed'], 5000);
  assert.equal(v['welcomeBonus.voucher'], 2000);
  assert.equal(v['welcomeBonus.spend'], 15000);
  assert.equal(v['welcomeBonus.window'], 60);
  assert.ok(!parsed('adcb-traveller').some(e => /everythingElse|international/.test(e.field)));
});

test('ADCB upper-bound adverts never become universal earn rates', () => {
  assert.equal(values('adcb-lulu-platinum')['scopedEarnRates.lulu'], 8);
  assert.equal(values('adcb-lulu-platinum')['scopedEarnRates.other-upper'], 1.25);
  assert.equal(values('adcb-lulu-titanium-gold')['scopedEarnRates.advertised-upper'], 3.5);
  assert.equal(values('adcb-betaqti')['welcomeBonus.amount'], 300000);
  assert.equal(values('adcb-betaqti')['anniversaryBonus.upper'], 750000);
  assert.equal(values('adcb-touchpoints-infinite')['welcomeBonus.voucher'], 1200);
  for (const slug of ['adcb-touchpoints-infinite', 'adcb-touchpoints-platinum', 'adcb-touchpoints-titanium-gold']) {
    assert.ok(!parsed(slug).some(e => /earnRates|eligibility/.test(e.field)), 'closed panels are not asserted');
  }
});

test('ADCB product parser rejects mismatched card scope and corrupt source identities', () => {
  const p = products.find(s => s.id === 'adcb-essential-cashback')!;
  assert.deepEqual(parseAdcbRefreshProduct(p, 'adcb-shukran'), []);
  assert.deepEqual(parseAdcbRefreshProduct({ ...p, sourceSnapshotSha256: undefined }, p.id), []);
  assert.deepEqual(parseAdcbRefreshProduct({ ...p, text: p.text + '\nUncaptured copy' }, p.id), []);
  assert.deepEqual(parseAdcbRefreshProduct({ ...p, sourceTextSha256: 'a'.repeat(64) }, p.id), []);
  assert.deepEqual(parseAdcbRefreshProduct({ ...p, url: p.url.replace('www.adcb.com', 'www.adcb.com.evil.test') }, p.id), []);
});

test('ADCB welcome and talabat gates remain attached to the source wording', () => {
  const c = values('adcb-365-cashback');
  assert.equal(c['welcomeBonus.amount'], 365);
  assert.equal(c['welcomeBonus.spend'], 5000);
  assert.equal(c['welcomeBonus.window'], 45);
  assert.equal(c['welcomeBonus.creditTimeline'], 90);
  const s = values('adcb-shukran');
  assert.equal(s['welcomeBonus.spend'], 8000);
  assert.equal(s['welcomeBonus.window'], 60);
  assert.equal(s['welcomeBonus.creditTimeline'], 120);
  const t = values('adcb-talabat');
  assert.equal(t['talabatCredit.per-order-cap'], 35);
  assert.equal(t['talabatCredit.monthly-cap'], 350);
  assert.equal(t['talabatCredit.monthly-spend-gate'], 2500);
  assert.equal(t['talabatCredit.below-spend-fallback'], 1.25);
  assert.equal(t['welcomeBonus.amount-upper'], 750);
  assert.equal(t['welcomeBonus.spend'], 5000);
  assert.equal(t['welcomeBonus.window'], 45);
  assert.ok(parsed('adcb-talabat').find(e => e.field === 'welcomeBonus.amount-upper')!.rawText.includes('digital channels only'));
  assert.equal(values('adcb-essential-cashback')['benefits.reelBogo.monthlyFreeTickets'], 2);
});

test('ADCB expanded LuLu rewards do not reuse the old fuel/base-only schedule', () => {
  for (const [slug, lulu, upper] of [['adcb-lulu-platinum', 8, 1.25], ['adcb-lulu-titanium-gold', 3.5, 1]] as const) {
    const events = expanded.filter(s => s.id === slug).flatMap(s => parseAdcbRefreshProduct(s, slug));
    const v = Object.fromEntries(events.map(e => [e.field, e.value]));
    assert.equal(v['scopedEarnRates.lulu-table'], lulu);
    assert.equal(v['scopedEarnRates.other-upper'], upper);
    assert.equal(v['scopedEarnRates.reduced-low'], 0.2);
    assert.equal(v['scopedEarnRates.reduced-high'], 0.4);
    assert.equal(v['scopedEarnRates.eea'], 0.4);
  }
});

test('ADCB nested/excerpt sources keep product, date and source-location boundaries', () => {
  const events = supplements.flatMap(s => [...parseAdcbRefreshProduct(s, s.id), ...parseAdcbRefreshSupplement(s, s.id)]);
  const v = (slug: string, key: string) => events.find(e => e.slug === slug && e.field === key)?.value;
  assert.equal(v('adcb-essential-cashback', 'welcomeBonus.offer-end-day'), 31);
  assert.equal(v('adcb-essential-cashback', 'welcomeBonus.offer-end-year'), 2026);
  assert.equal(v('adcb-essential-cashback', 'scopedEarnRates.select-categories-guide'), 0.75);
  assert.equal(v('adcb-betaqti', 'scopedEarnRates.advertised-upper'), 3);
  assert.equal(v('adcb-betaqti', 'scopedEarnRates.reduced-high'), 0.7);
  assert.equal(v('adcb-betaqti', 'scopedEarnRates.reduced-low'), 0.35);
  assert.equal(v('adcb-betaqti', 'scopedEarnRates.eea'), 0.4);
  assert.equal(v('adcb-betaqti', 'anniversaryBonus.tier-1.spend'), 250000);
  assert.equal(v('adcb-betaqti', 'anniversaryBonus.tier-3.reward'), 750000);
  assert.equal(v('adcb-betaqti', 'benefits.loungeVisits'), 14);
  assert.equal(v('adcb-talabat', 'welcomeBonus.new-cardholder'), 750);
  assert.equal(v('adcb-talabat', 'welcomeBonus.existing-cardholder'), 200);
  assert.equal(v('adcb-talabat', 'scopedEarnRates.reduced-domestic'), 0.35);
  assert.equal(v('adcb-talabat', 'scopedEarnRates.eea'), 0.35);
  assert.equal(v('adcb-talabat', 'scopedEarnRates.other-retail'), 1.25);
  assert.equal(v('adcb-talabat', 'talabatCredit.first-orders'), 10);
  assert.equal(v('adcb-talabat', 'talabatCredit.expiry-years'), 2);
  assert.equal(v('adcb-lulu-platinum', 'luluPoints.expiry-years'), 3);
  assert.equal(v('adcb-traveller', 'welcomeBonus.voucher-validity-months'), 6);
  const oldLuLu = supplements.find(s => s.id === 'adcb-lulu-platinum')!;
  assert.deepEqual(parseAdcbRefreshSupplement(oldLuLu, 'adcb-lulu-titanium-gold'), []);
  for (const e of events) {
    const s = supplements.find(s => s.sourceTextSha256 === e.sourceTextSha256 && e.sourceStartByte >= (s.firstByte ?? 0) && e.sourceEndByte <= (s.firstByte ?? 0) + Buffer.byteLength(s.text))!;
    assert.ok(s);
    assert.equal(Buffer.from(s.text).subarray(e.sourceStartByte - (s.firstByte ?? 0), e.sourceEndByte - (s.firstByte ?? 0)).toString('utf8'), e.rawText);
    assert.equal(hash(e.rawText), e.rawTextSha256);
  }
});

test('ADCB partial-review pages surface one source-note block and no unsupported valuation stack', () => {
  for (const { id: slug } of products) {
    const text = readFileSync(new URL(`../../src/content/cards/${slug}.mdx`, import.meta.url), 'utf8');
    assert.equal((text.match(/<CardDataIssues\s/g) ?? []).length, 1, slug);
    assert.ok(text.indexOf('<CardDataIssues ') > text.indexOf('<AtAGlance '), slug);
    assert.ok(text.includes('bounded primary-source review; existing whole-card date retained'), slug);
    assert.ok(!/Value to me:|Total package:|typically reversed/i.test(text), slug);
    assert.ok(text.includes('## Earn rates') && text.includes('## Fee summary') && text.includes('## Key conditions to know'), slug);
  }
});
