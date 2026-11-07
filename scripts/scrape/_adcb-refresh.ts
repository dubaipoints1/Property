// Offline, product-scoped ADCB refresh observations. No writes or network.
// Candidate observations do not authorise protected-field changes or date bumps.
import { createHash } from 'node:crypto';
import { parseSourceNumber } from './_lib.ts';
import { parseAdcbRenderedProduct, type PrimaryCardSource } from './_bank-parsers.ts';

export interface AdcbRefreshSource extends PrimaryCardSource {
  /** UTF-8 position of an excerpt in the full, hashed text representation. */
  firstByte?: number;
  /** Separately located full-source assertions. These are never stitched
   * into the excerpt or attributed to its contiguous line/byte range. */
  contextFragments?: Array<{ text: string; firstLine: number; firstByte: number; fixtureTextSha256: string }>;
}
export interface AdcbRefreshObservation {
  slug: string; field: string; value: number; unit: string;
  vatTreatment: 'inclusive' | 'exclusive' | 'not-applicable';
  parserId: string; productScope: string; sourceUrl: string; capturedAt: string;
  sourceTextSha256: string; sourceBodySha256: string | null;
  sourceRepresentation: 'http-decoded-response-body' | 'visible-main-dom-and-accessibility-snapshot';
  captureMethod: 'public-http-reader' | 'normal-public-browser-ui';
  sourceSnapshotSha256?: string; sourceScope?: string;
  firstLine: number; lastLine: number; sourceStartByte: number; sourceEndByte: number;
  rawText: string; rawTextSha256: string; derivation?: string;
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const PRODUCTS: Record<string, [string, string]> = {
  'adcb-365-cashback': ['365-cashback-card', '365 Cashback Credit Card'],
  'adcb-betaqti': ['betaqti-credit-card', 'Betaqti Credit Card'],
  'adcb-essential-cashback': ['essential-cashback-credit-card', 'Essential Cashback Credit Card'],
  'adcb-lulu-platinum': ['adcb-lulu-credit-card', 'ADCB LuLu Platinum Credit Card'],
  'adcb-lulu-titanium-gold': ['adcb-lulu-titanium-gold-credit-card', 'ADCB LuLu Titanium Credit Card'],
  'adcb-shukran': ['shukran-credit-card', 'Shukran ADCB Credit Card'],
  'adcb-talabat': ['talabat-credit-card', 'talabat ADCB Credit Card'],
  'adcb-touchpoints-infinite': ['touchpoint-ic', 'ADCB TouchPoints Infinite Credit Card'],
  'adcb-touchpoints-platinum': ['touchpoint-platinum-cc', 'ADCB TouchPoints Platinum Credit Card'],
  'adcb-touchpoints-titanium-gold': ['touchpoint-tg-cc', 'ADCB TouchPoints Titanium and Gold Credit Card'],
  'adcb-traveller': ['traveller-credit-card', 'Traveller Credit Card'],
};
function valid(s: AdcbRefreshSource): boolean {
  try {
    const u = new URL(s.url), dom = s.sourceRepresentation === 'visible-main-dom-and-accessibility-snapshot';
    return u.protocol === 'https:' && u.hostname === 'www.adcb.com'
      && /^[a-f0-9]{64}$/.test(s.sourceTextSha256) && hash(s.text) === s.fixtureTextSha256
      && Number.isInteger(s.firstLine) && s.firstLine > 0
      && (s.firstByte === undefined ? s.firstLine === 1 : Number.isInteger(s.firstByte) && s.firstByte >= 0)
      && (s.firstLine !== 1 || (s.firstByte ?? 0) !== 0 || s.fixtureTextSha256 === s.sourceTextSha256)
      && (s.contextFragments ?? []).every(f => Number.isInteger(f.firstLine) && f.firstLine > 0
        && Number.isInteger(f.firstByte) && f.firstByte >= 0 && hash(f.text) === f.fixtureTextSha256)
      && (dom ? s.sourceBodySha256 === null && s.captureMethod === 'normal-public-browser-ui'
        && /^[a-f0-9]{64}$/.test(s.sourceSnapshotSha256 ?? '') && !!s.sourceScope
        : /^[a-f0-9]{64}$/.test(s.sourceBodySha256 ?? ''));
  } catch { return false; }
}
function one(text: string, re: RegExp): RegExpMatchArray | null {
  const found = [...text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))];
  return found.length === 1 ? found[0] : null;
}
function location(s: AdcbRefreshSource, m: RegExpMatchArray) {
  const start = m.index!, end = start + m[0].length;
  return {
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256,
    sourceBodySha256: s.sourceBodySha256,
    sourceRepresentation: s.sourceRepresentation ?? 'http-decoded-response-body' as const,
    captureMethod: s.captureMethod ?? 'public-http-reader' as const,
    ...(s.sourceSnapshotSha256 ? { sourceSnapshotSha256: s.sourceSnapshotSha256 } : {}),
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    firstLine: s.firstLine + s.text.slice(0, start).split('\n').length - 1,
    lastLine: s.firstLine + s.text.slice(0, end - 1).split('\n').length - 1,
    sourceStartByte: (s.firstByte ?? 0) + Buffer.byteLength(s.text.slice(0, start)),
    sourceEndByte: (s.firstByte ?? 0) + Buffer.byteLength(s.text.slice(0, end)),
    rawText: m[0], rawTextSha256: hash(m[0]),
  };
}
function contextAssert(s: AdcbRefreshSource, re: RegExp): boolean {
  return [s.text, ...(s.contextFragments ?? []).map(f => f.text)].filter(text => re.test(text)).length === 1;
}
/** All three source fee columns are read independently. Never infer Free
 * from an absent fee. The common all-Titanium row is kept explicitly scoped. */
export function parseAdcbRefreshSof(s: AdcbRefreshSource, slug: string): AdcbRefreshObservation[] {
  if (!PRODUCTS[slug] || !valid(s) || s.sourceRepresentation === 'visible-main-dom-and-accessibility-snapshot'
    || new URL(s.url).pathname !== '/en/multimedia/sof/cb-sof-current-charges-fees.pdf'
    || !contextAssert(s, /^Ver\.49\/September2026$/m)
    || !contextAssert(s, /^\s*All fees are inclusive of 5% VAT, where applicable\.$/m)
    || !/^\f?Credit Cards$/m.test(s.text)) return [];
  const paid: Record<string, RegExp> = {
    'adcb-touchpoints-infinite': /^• TouchPoints Infinite Card[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)$/m,
    'adcb-betaqti': /^• Betaqti World Elite Card[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)$/m,
    'adcb-traveller': /^• Traveller World Elite Card[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)$/m,
    'adcb-touchpoints-platinum': /^• TouchPoints Platinum Card[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)[ \t]+(Free)\n[ \t]+\(First year free\)$/m,
    'adcb-365-cashback': /^• 365 Cashback Platinum Card[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)\n[ \t]+\(First year free\)$/m,
    'adcb-shukran': /^• Shukran ADCB Platinum Card[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)[ \t]+AED ([\d,.]+)\n[ \t]+\(First year free\)[\s\S]*?(?=^• Essential Cashback)/m,
  };
  const free: Record<string, RegExp> = {
    'adcb-lulu-platinum': /^• LuLu Platinum Card[ \t]+(Free)[ \t]+(Free)[ \t]+(Free)$/m,
    'adcb-lulu-titanium-gold': /^• Titanium\/Gold\/Classic\/Standard[ \t]+(Free)[ \t]+(Free)[ \t]+(Free)\n[ \t]+Card \(all\)$/m,
    'adcb-touchpoints-titanium-gold': /^• Titanium\/Gold\/Classic\/Standard[ \t]+(Free)[ \t]+(Free)[ \t]+(Free)\n[ \t]+Card \(all\)$/m,
    'adcb-talabat': /^• talabat ADCB Platinum Card[ \t]+(Free)[ \t]+(Free)[ \t]+(Free)$/m,
    'adcb-essential-cashback': /^• Essential Cashback Platinum Card[ \t]+(Free)[ \t]+(Free)[ \t]+(Free)$/m,
  };
  const row = one(s.text, paid[slug] ?? free[slug]); if (!row) return [];
  const out: AdcbRefreshObservation[] = [];
  const add = (m: RegExpMatchArray | null, field: string, token: string | undefined, unit: string, vatTreatment: AdcbRefreshObservation['vatTreatment'] = 'not-applicable') => {
    if (!m || token === undefined) return;
    const value = token === 'Free' ? 0 : parseSourceNumber(token);
    if (value === null || !Number.isFinite(value)) return;
    out.push({ slug, field, value, unit, vatTreatment, parserId: 'adcb/refresh-sof-ver49/v1',
      productScope: PRODUCTS[slug][1] + (free[slug]?.source.includes('Titanium') ? '; all Titanium/Gold/Classic/Standard fee row' : ''),
      ...location(s, m), ...(token === 'Free' ? { derivation: 'Explicit issuer Free token → 0; not absence → 0.' } : {}) });
  };
  for (const [i, name] of ['aspire', 'privilege-emirati', 'excellency-emirati-excellency'].entries()) {
    add(row, `annualFee.${name}`, row[i + 1], 'AED/year', 'inclusive');
  }
  const fx = one(s.text, /^Foreign Currency transaction[ \t]+(0)% \(Traveller card\)\nmargin \(non-AED currency\)[ \t]+([\d.]+)% \(other cards\)$/m);
  add(fx, 'fxFee.issuer-non-aed-margin', fx?.[slug === 'adcb-traveller' ? 1 : 2], 'percent issuer FX margin', 'inclusive');
  const aed = one(s.text, /^Foreign transaction fee[ \t]+(0)% \(Traveller card\)\n\(AED currency\)[ \t]+([\d.]+)% \(other cards\)$/m);
  add(aed, 'fxFee.issuer-aed-overseas', aed?.[slug === 'adcb-traveller' ? 1 : 2], 'percent issuer foreign-transaction fee', 'inclusive');
  return out;
}
/** Only visible, product-matched copy is evidence. Closed panels are unknown. */
export function parseAdcbRefreshProduct(s: AdcbRefreshSource, slug: string): AdcbRefreshObservation[] {
  const product = PRODUCTS[slug];
  if (!product || !valid(s)
    || s.sourceRepresentation !== 'visible-main-dom-and-accessibility-snapshot'
    || !new RegExp(`^/en/personal/cards/credit-cards/${product[0]}(?:\\.aspx)?/?$`).test(new URL(s.url).pathname)
    || !(s.text.split('\n').slice(0, 3).includes(product[1])
      || (s.contextFragments ?? []).some(f => f.text.trim() === product[1]))) return [];
  const out: AdcbRefreshObservation[] = [];
  for (const e of parseAdcbRenderedProduct(s, slug)) {
    const hits = [...s.text.matchAll(new RegExp(e.rawText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))];
    const m = hits.find(m => s.text.slice(0, m.index).split('\n').length === e.firstLine);
    if (m) out.push({ ...e, slug, ...location(s, m) });
  }
  const add = (field: string, re: RegExp, group = 1, unit = 'percent reward', vatTreatment: AdcbRefreshObservation['vatTreatment'] = 'not-applicable') => {
    const m = one(s.text, re); if (!m) return;
    const value = parseSourceNumber(m[group]); if (value === null || !Number.isFinite(value)) return;
    out.push({ slug, field, value, unit, vatTreatment, parserId: 'adcb/refresh-visible-product/v1', productScope: product[1], ...location(s, m) });
  };
  // The Infinite source currently omits the leading Y in "You". This
  // narrow product-scoped pattern preserves the exact raw source typo.
  if (slug === 'adcb-touchpoints-infinite') {
    const q = /^ou need to have a minimum salary of \nAED\n([\d,]+) or be eligible for a credit limit of at least \nAED\n([\d,]+)$/m;
    add('eligibility.salaryRoute', q, 1, 'AED');
    add('eligibility.creditLimitAlternative', q, 2, 'AED');
  }
  add('eligibility.minAge', /^You should be at least ([\d]+) years old$/m, 1, 'years');
  if (slug === 'adcb-365-cashback') {
    const welcome = /^Welcome bonus of \nAED\n([\d,]+) is subject to a minimum spend of \nAED\n([\d,]+) within ([\d]+) days of card issuance\. Welcome bonus will be credited as cashback within ([\d]+) days of card issuance, upon meeting the spend eligibility criteria\.$/m;
    add('welcomeBonus.amount', welcome, 1, 'AED cashback');
    add('welcomeBonus.spend', welcome, 2, 'AED');
    add('welcomeBonus.window', welcome, 3, 'days');
    add('welcomeBonus.creditTimeline', welcome, 4, 'days');
  }
  if (slug === 'adcb-essential-cashback') {
    add('scopedEarnRates.general-high', /^([\d.]+)% cashback on monthly spends of \nAED\n([\d,]+) or more\.$/m);
    add('spendTierThreshold', /^([\d.]+)% cashback on monthly spends of \nAED\n([\d,]+) or more\.$/m, 2, 'AED');
    add('scopedEarnRates.general-low', /^([\d.]+)% cashback on monthly spends of up to \nAED\n([\d,]+)$/m);
    add('scopedEarnRates.select-categories', /^([\d.]+)% cashback on select spend categories$/m);
    add('earnRates._caps.monthly_max_aed', /^You can earn a maximum cashback of \nAED\n([\d,]+) every month\.$/m, 1, 'AED');
    add('earnRates._caps.min_monthly_spend_to_qualify_aed', /^A minimum spend of \nAED\n([\d,]+) per month on your card is required to be eligible for the cashback\.$/m, 1, 'AED');
    add('welcomeBonus.amount-upper', /^Enjoy a welcome bonus of up to \nAED\n([\d,]+) when you apply for the ADCB Essential Cashback Credit Card on select digital channels\./m, 1, 'AED cashback upper bound');
    add('benefits.loungeVisits', /^Enjoy ([\d]+) complimentary visits to [\d]+\+ airport lounges worldwide for you and your supplementary cardholders\.$/m, 1, 'visits; period not stated in visible capture');
    add('benefits.reelBogo.monthlyFreeTickets', /^Buy one ticket, get one free \(up to ([\d]+) free tickets can be availed in a month\) until .+$/m, 1, 'free tickets per month');
  }
  if (slug === 'adcb-shukran') {
    add('scopedEarnRates.shukran-brands', /^Enjoy ([\d.]+)% back as Shukrans on purchases made at Shukran brands : .+$/m);
    add('scopedEarnRates.other-retail', /^([\d.]+)% back as Shukrans on retail purchases made within or outside the UAE\.$/m);
    add('scopedEarnRates.reduced-uae', /^([\d.]+)% back as Shukrans on retail purchases made at UAE based merchants belonging to .+$/m);
    add('scopedEarnRates.eea', /^([\d.]+)% back as Shukrans on all retail purchases made at merchants based in Europe .+$/m);
    add('welcomeBonus.national-new', /^UAE National customers not having an existing ADCB Credit or Covered Card will be eligible for \nAED\n([\d,]+) welcome bonus\./m, 1, 'AED-equivalent Shukrans');
    add('welcomeBonus.resident-new', /All UAE Residents who do not have an existing ADCB Credit or Covered Card will be eligible for \nAED\n([\d,]+) welcome bonus\./m, 1, 'AED-equivalent Shukrans');
    add('welcomeBonus.existing', /^Customers having an existing ADCB Credit or Covered Card will be eligible for \nAED\n([\d,]+) welcome bonus\.$/m, 1, 'AED-equivalent Shukrans');
    add('welcomeBonus.spend', /^Welcome Bonus will be rewarded as Shukrans and is subject to a minimum spend of \nAED\n([\d,]+) within ([\d]+) days of card issuance\.$/m, 1, 'AED');
    add('welcomeBonus.window', /^Welcome Bonus will be rewarded as Shukrans and is subject to a minimum spend of \nAED\n([\d,]+) within ([\d]+) days of card issuance\.$/m, 2, 'days');
    add('welcomeBonus.creditTimeline', /^Welcome bonus is a one-time reward and will be credited to the Shukran membership account of the primary cardholder within ([\d]+) days from the date of card issuance\.$/m, 1, 'days');
  }
  if (slug === 'adcb-traveller') {
    for (const [key, label] of [['airfare', 'airline tickets in AED and non-AED spends'], ['hotels', 'hotel stays in AED and non-AED spends'], ['cinema', 'movies tickets purchased online in AED']]) {
      add(`scopedEarnRates.${key}`, new RegExp('^([\\d.]+)% cashback on ' + label + '$', 'm'));
    }
    add('scopedEarnRates.domestic-other', /^([\d.]+)% on all other domestic AED spends$/m);
    add('earnRates._caps.monthly_max_aed', /^Maximum cashback earned per month: \nAED\n([\d,]+)$/m, 1, 'AED');
    add('earnRates._caps.min_monthly_spend_to_qualify_aed', /^A minimum retail spend of \nAED\n([\d,]+) on your card, per calendar month, is required to be eligible to earn cashback$/m, 1, 'AED');
    add('welcomeBonus.voucher', /^Enjoy an \nAED\n([\d,]+) Expedia\.ae welcome voucher when you pay your annual membership fee and spend \nAED\n([\d,]+) within ([\d]+) days of card issuance\./m, 1, 'AED hotel voucher');
    add('welcomeBonus.spend', /^Enjoy an \nAED\n([\d,]+) Expedia\.ae welcome voucher when you pay your annual membership fee and spend \nAED\n([\d,]+) within ([\d]+) days of card issuance\./m, 2, 'AED');
    add('welcomeBonus.window', /^Enjoy an \nAED\n([\d,]+) Expedia\.ae welcome voucher when you pay your annual membership fee and spend \nAED\n([\d,]+) within ([\d]+) days of card issuance\./m, 3, 'days');
  }
  if (slug === 'adcb-touchpoints-infinite') {
    add('welcomeBonus.voucher', /^Enjoy an \nAED\n([\d,]+) Expedia\.ae stay voucher when you pay your annual membership fee in the first year\./m, 1, 'AED hotel voucher');
  }
  if (slug === 'adcb-betaqti') {
    add('welcomeBonus.amount', /^([\d,]+) TouchPoints\nAs a welcome bonus$/m, 1, 'ADCB TouchPoints');
    add('anniversaryBonus.upper', /^Earn up to ([\d,]+) Anniversary TouchPoints according to the spends on your card$/m, 1, 'ADCB TouchPoints upper bound');
    add('scopedEarnRates.advertised-upper', /^Earn up to ([\d.]+) TouchPoints for every \nAED\n1 spent with your card$/m, 1, 'ADCB TouchPoints per AED 1 upper bound');
    const reduced = /^Please note you will earn ([\d.]+) TouchPoints for every 1 \nAED\n of domestic spends at supermarkets, auto dealers, insurance, quick service restaurants \(i\.e\. fast food restaurants\) and ([\d.]+) TouchPoints for spends at fuel, education, government services, real estate, tele communication, charity and transport\. For retail purchases made at merchants based in Europe \(i\.e\. countries which are part of European Economic Area\) you will earn ([\d.]+) TouchPoints for every 1 \nAED\n equivalent of spends\.$/m;
    add('scopedEarnRates.reduced-high', reduced, 1, 'ADCB TouchPoints per AED 1');
    add('scopedEarnRates.reduced-low', reduced, 2, 'ADCB TouchPoints per AED 1');
    add('scopedEarnRates.eea', reduced, 3, 'ADCB TouchPoints per AED 1');
    add('welcomeBonus.gift', /^You will receive ([\d,]+) TouchPoints as a welcome gift when you get a Betaqti Credit Card\.$/m, 1, 'ADCB TouchPoints');
    add('benefits.loungeVisits', /^Enjoy ([\d]+) complimentary visits to over [\d,]+ airport lounges worldwide for you and your supplementary cardholders, plus [\d]+ free guest per visit\.$/m, 1, 'visits; period not stated in visible capture');
    const tiers = [...s.text.matchAll(/^AED\n([\d,]+)\t([\d,]+) TouchPoints$/gm)];
    if (tiers.length === 3 && /Annual Spend Amount\tBonus Reward/.test(s.text)) for (const [i, m] of tiers.entries()) {
      for (const [group, name, unit] of [[1, 'spend', 'AED annual spend'], [2, 'reward', 'ADCB TouchPoints']] as const) {
        const value = parseSourceNumber(m[group]); if (value === null) continue;
        out.push({ slug, field: `anniversaryBonus.tier-${i + 1}.${name}`, value, unit, vatTreatment: 'not-applicable',
          parserId: 'adcb/refresh-visible-product/v1', productScope: product[1], ...location(s, m) });
      }
    }
  }
  if (slug === 'adcb-lulu-platinum') {
    add('scopedEarnRates.lulu', /^([\d.]+) LuLu Points\nper \nAED\n1 spent at LuLu stores$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.other-upper', /^Up to ([\d.]+) LuLu Points\nper \nAED\n1 spent on all other spends$/m, 1, 'LuLu Points per AED 1 upper bound');
    add('scopedEarnRates.lulu-table', /^Purchases at LuLu\t([\d.]+) LuLu Points$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.reduced-low', /^Earn ([\d.]+) points for every \nAED\n1 spent on fuel, education, government services, real estate, telecommunications, charity, and transport\.$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.reduced-high', /^Earn ([\d.]+) points for every \nAED\n1 spent at supermarkets, auto dealers, insurance companies, and quick service restaurants\.$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.eea', /^Purchases in the United Kingdom & Europe\n\(Classification of merchants based in European Economic Area will be as per prevailing MasterCard guidelines\.\)\t([\d.]+) LuLu Points$/m, 1, 'LuLu Points per AED 1');
  }
  if (slug === 'adcb-lulu-titanium-gold') {
    add('scopedEarnRates.advertised-upper', /^([\d.]+)\nUp\u00a0to\nLuLu points\nper \nAED\n1 purchase$/m, 1, 'LuLu Points per AED 1 upper bound');
    add('scopedEarnRates.lulu-table', /^Purchases at LuLu\t([\d.]+) LuLu Points$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.other-upper', /^Purchases elsewhere\tUp to ([\d.]+) LuLu Points$/m, 1, 'LuLu Points per AED 1 upper bound');
    add('scopedEarnRates.reduced-low', /^([\d.]+) points for every AED of spends at fuel, education, government services, real estate, tele communication, charity and transport$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.reduced-high', /^([\d.]+) points for every AED of spends at supermarkets, auto dealers, insurance, quick service restaurants \(i\.e\. fast food restaurants\)$/m, 1, 'LuLu Points per AED 1');
    add('scopedEarnRates.eea', /^Purchases in the United Kingdom & Europe\n\(Classification of merchants based in European Economic Area will be as per prevailing MasterCard guidelines\.\)\t([\d.]+) LuLu Points$/m, 1, 'LuLu Points per AED 1');
  }
  if (slug === 'adcb-talabat') {
    add('scopedEarnRates.talabat', /^([\d.]+)% back on talabat orders$/m, 1, 'percent talabat credit');
    const cap = /^([\d.]+)% back on talabat orders will be rewarded as talabat credit and will be applicable only on the first ten orders every month\. Each order is capped at[\s\u00a0]*AED\n([\d,]+) and cumulative of[\s\u00a0]*AED\n([\d,]+) per month\. A minimum monthly retail spend of[\s\u00a0]*AED\n([\d,]+) is required to be eligible to earn [\d.]+% back as talabat credit on talabat orders\. If the minimum spend criteria is not met in any given month, ([\d.]+)% back as talabat credit will be applicable to all talabat orders for that particular month\.$/m;
    add('talabatCredit.per-order-cap', cap, 2, 'AED talabat credit');
    add('talabatCredit.monthly-cap', cap, 3, 'AED talabat credit per month');
    add('talabatCredit.monthly-spend-gate', cap, 4, 'AED');
    add('talabatCredit.below-spend-fallback', cap, 5, 'percent talabat credit');
    const welcome = /^Welcome bonus of up to[\s\u00a0]*AED\n([\d,]+) will be applicable for cards applied via the digital channels only such as .+ subject to a minimum spend condition of[\s\u00a0]*AED\n([\d,]+) in first ([\d]+) days\.$/m;
    add('welcomeBonus.amount-upper', welcome, 1, 'AED talabat credit upper bound');
    add('welcomeBonus.spend', welcome, 2, 'AED');
    add('welcomeBonus.window', welcome, 3, 'days');
    add('welcomeBonus.new-cardholder', /^Primary Cardholders not having an existing ADCB Credit Card or ADCB Islamic Credit Card will be eligible for \nAED\n([\d,]+) welcome bonus as talabat credit\.$/m, 1, 'AED talabat credit');
    add('welcomeBonus.existing-cardholder', /^Primary Cardholders having an existing ADCB Credit Card or ADCB Islamic Credit Card will be eligible for \nAED\n([\d,]+) welcome bonus as talabat credit\.$/m, 1, 'AED talabat credit');
    add('scopedEarnRates.reduced-domestic', /^([\d.]+)% back as talabat credit on domestic retail purchases from categories such as .+$/m, 1, 'percent talabat credit');
    add('scopedEarnRates.eea', /^([\d.]+)% back as talabat credit on all domestic and international retail purchases made at merchants in the United Kingdom and Europe .+$/m, 1, 'percent talabat credit');
    add('scopedEarnRates.other-retail', /^([\d.]+)% back as talabat credit on other domestic and international retail purchases, whether made within the UAE or outside the UAE\.$/m, 1, 'percent talabat credit');
  }
  return out;
}

/** Named linked PDFs can narrow rewards or close an offer. A readable
 * document does not make an old campaign live or expand its product scope. */
export function parseAdcbRefreshSupplement(s: AdcbRefreshSource, slug: string): AdcbRefreshObservation[] {
  if (!PRODUCTS[slug] || !valid(s) || s.sourceRepresentation === 'visible-main-dom-and-accessibility-snapshot') return [];
  const path = new URL(s.url).pathname;
  const out: AdcbRefreshObservation[] = [];
  const add = (field: string, re: RegExp, group = 1, unit = 'AED') => {
    const m = one(s.text, re); if (!m) return;
    const value = parseSourceNumber(m[group]); if (value === null || !Number.isFinite(value)) return;
    out.push({ slug, field, value, unit, vatTreatment: 'not-applicable', parserId: 'adcb/refresh-linked-pdf/v1', productScope: PRODUCTS[slug][1], ...location(s, m) });
  };
  if (slug === 'adcb-essential-cashback' && path === '/en/multimedia/pdfs/2026/june/essential-merchant-guide.pdf'
    && /ADCB Essential Cashback Credit Card -\s*\n\s*Cashback Eligibility Guide/.test(s.text) && /Ver\.01\/Jun2026/.test(s.text)) {
    add('scopedEarnRates.select-categories-guide', /^[ \t]*([\d.]+)% Cashback on select spend categories listed below\n\n[\s\S]*?(?=\n[ \t]*Important Notes)/m, 1, 'percent cashback');
  }
  if (slug === 'adcb-essential-cashback' && path === '/en/multimedia/pdfs/2025/may/essential-acquisition-tnc-en.pdf'
    && /^ADCB Essential Acquisition Offer – Cashback up to AED [\d,]+/m.test(s.text)) {
    const period = /^[ \t]*([\d]+)st October ([\d]+) to ([\d]+)st October ([\d]+)$/m;
    add('welcomeBonus.offer-start-day', period, 1, 'day of October');
    add('welcomeBonus.offer-start-year', period, 2, 'year');
    add('welcomeBonus.offer-end-day', period, 3, 'day of October');
    add('welcomeBonus.offer-end-year', period, 4, 'year');
    add('welcomeBonus.offer-amount', /bank Customers not holding any Credit[ \t]+AED ([\d,]+) Cashback/m, 1, 'AED cashback in dated campaign');
  }
  if (slug === 'adcb-talabat' && path === '/en/multimedia/tnc/adcb-talabat-tnc-en.pdf'
    && contextAssert(s, /Talabat ADCB Credit Card/) && contextAssert(s, /Ver\.03\/May2025/)) {
    add('talabatCredit.first-orders', /eligible for [\d.]+% back as talabat credit on first ([\d]+)\n[ \t]*talabat orders every month/m, 1, 'orders per month');
    add('talabatCredit.expiry-years', /of not more than two \(([\d]+)\) years from the date of credit,/m, 1, 'years');
  }
  if (slug === 'adcb-lulu-platinum' && path === '/en/multimedia/pdfs/2022/december/adcb-tp-lulu-tnc-en.pdf'
    && contextAssert(s, /ADCB Lulu Platinum Card/) && contextAssert(s, /Ver\.02\/December2022/)) {
    add('luluPoints.expiry-years', /three \(([\d]+)\) years from such date\./m, 1, 'years from calendar-month credit date');
  }
  // This older T&C names Classic/Gold/Platinum, not current Titanium.
  // Deliberately no Titanium branch, even though its product links LuLu material.
  if (['adcb-traveller', 'adcb-touchpoints-infinite'].includes(slug)
    && path === '/en/multimedia/pdfs/2025/july/expedia-faq-en.pdf' && /Guidelines and FAQs on Expedia Vouchers/.test(s.text)
    && /Ver\.01\/February2026/.test(s.text)) {
    add('welcomeBonus.voucher-validity-months', /The voucher cannot be extended\. The voucher is valid for ([\d]+) months,/m, 1, 'months');
  }
  return out;
}
