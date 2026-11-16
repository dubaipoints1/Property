// Detail-only issuer observations. Never lift an earn hold or feed a model.
import { createHash } from 'node:crypto';
import { parseSourceNumber } from './_lib.ts';

const products = {
  'adcb-touchpoints-infinite': ['touchpoint-ic', 'ADCB TouchPoints Infinite Credit Card'],
  'adcb-touchpoints-platinum': ['touchpoint-platinum-cc', 'ADCB TouchPoints Platinum Credit Card'],
  'adcb-touchpoints-titanium-gold': ['touchpoint-tg-cc', 'ADCB TouchPoints Gold or Titanium Credit Card'],
} as const;
export type AdcbTouchPointsDetailSlug = keyof typeof products;
type Source = { url: string; capturedAt: string; lineText: string; sourceTextSha256: string };
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const points = '([\\d,]+(?:\\.\\d+)?)';

export function parseAdcbTouchPointsDetail(source: Source, slug: AdcbTouchPointsDetailSlug) {
  let url: URL;
  try { url = new URL(source.url); } catch { return null; }
  const product = products[slug];
  if (!product || url.origin !== 'https://www.adcb.com' || url.username || url.password || url.search || url.hash
    || url.pathname !== `/en/personal/cards/credit-cards/${product[0]}`
    || !Number.isFinite(Date.parse(source.capturedAt)) || sha(source.lineText) !== source.sourceTextSha256) return null;

  const lines = source.lineText.split('\n').flatMap(line => {
    const m = /^L(\d+):\s*(.*?)\s*$/.exec(line);
    return m ? [{ n: Number(m[1]), body: m[2]!, sha256: sha(line) }] : [];
  });
  const exact = (r: RegExp) => {
    const hits = lines.flatMap(l => { const m = r.exec(l.body); return m ? [{ line: l, match: m }] : []; });
    return hits.length === 1 ? hits[0]! : null;
  };
  const name = product[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = exact(new RegExp(`${name}\\.$`));
  const maximum = exact(new RegExp(`^\\*?\\s*Earn up to ${points} TouchPoints? for every AED 1 spent with your card$`));
  const bonus = exact(new RegExp(`^\\*?\\s*Receive ${points} bonus TouchPoints when you spend AED ${points} each month$`));
  const qualifying = exact(/^Qualifying spends includes all retail transactions \(net of reversals and refunds\) and excludes any form of disputed purchases and cash withdrawals\.$/);
  const buckets = exact(new RegExp(`^Please note you will earn ${points} TouchPoints for every 1 AED of domestic spends at (.+?) and ${points} TouchPoints for spends at (.+?)\\. For retail purchases made at merchants based in the United Kingdom and Europe \\(i\\.e\\. countries which are part of European Economic Area\\), you will earn ${points} TouchPoints for every 1 AED equivalent of spends\\.$`));
  const visaOnly = slug === 'adcb-touchpoints-infinite';
  const scheme = exact(visaOnly
    ? /^Classification of merchants in the above mentioned categories and European Economic Area will be as per prevailing Visa guidelines\.$/
    : /^Classification of merchants in the above mentioned categories and European Economic Area will be as per prevailing schemes \(Visa\/Mastercard\) guidelines\.$/);
  if (!title || !maximum || !bonus || !qualifying || !buckets || !scheme
    || !(title.line.n < maximum.line.n && maximum.line.n < bonus.line.n && bonus.line.n < qualifying.line.n
      && qualifying.line.n + 1 === buckets.line.n && buckets.line.n + 1 === scheme.line.n
      && scheme.line.n - title.line.n <= 9)) return null;
  if (buckets.match[2] !== 'supermarkets, auto dealers, insurance, quick service restaurants (i.e. fast food restaurants)'
    || buckets.match[4] !== 'fuel, education, government services, real estate, tele communication, charity and transport') return null;
  const [ceiling, monthlyPoints, monthlySpendAed, domesticHigh, domesticLow, ukEurope] = [
    maximum.match[1], bonus.match[1], bonus.match[2], buckets.match[1], buckets.match[3], buckets.match[5],
  ].map(v => parseSourceNumber(v!));
  if ([ceiling,monthlyPoints,monthlySpendAed,domesticHigh,domesticLow,ukEurope].some(v => v === null || v <= 0)
    || domesticHigh! > ceiling! || domesticLow! > domesticHigh! || ukEurope! > ceiling!) return null;
  return {
    slug, classification: 'detail-only', unit: 'TouchPoints per AED 1',
    advertisedUpperBound: ceiling!, monthlyBonusPoints: monthlyPoints!, monthlySpendTriggerAed: monthlySpendAed!,
    domesticHigh: domesticHigh!, domesticHighScope: buckets.match[2]!,
    domesticLow: domesticLow!, domesticLowScope: buckets.match[4]!,
    ukEuropeIssuerClassified: ukEurope!, merchantClassification: visaOnly ? 'Visa' : 'applicable Visa or Mastercard',
    qualifyingRetail: 'Net of reversals and refunds; excludes disputed purchases and cash withdrawals.',
    cap: null, universalBase: null,
    evidence: [title.line, maximum.line, bonus.line, qualifying.line, buckets.line, scheme.line].map(({ n, sha256 }) => ({ line: n, sha256 })),
    sourceUrl: source.url, capturedAt: source.capturedAt, sourceTextSha256: source.sourceTextSha256,
  } as const;
}
