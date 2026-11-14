import { createHash } from 'node:crypto';
import { SOURCE_NUMBER, parseSourceNumber } from './_lib.ts';

export const RAKBANK_CARD_DIRECTORY = 'https://www.rakbank.ae/en/landing-page/cards/cards-lp';
const site = 'https://www.rakbank.ae';
export const RAKBANK_CONSUMER_SCHEDULE = `${site}/globalassets/rakbank/all-pdfs/001---service-and-price-guides/bilingual/012-j00686-sp-consumercreditcard.pdf`;
const pdfRoot = `${site}/globalassets/rakbank/all-pdfs/001---key-fact-statements/bilingual`;
export const RAKBANK_EXPANSION_PRODUCTS = {
  'rakbank-red': { id:'red', name:'RED Credit Card', kfsName:'RED Mastercard Credit Card',
    url:`${site}/en/cards/credit-cards/red-credit-card`, kfs:`${pdfRoot}/kfs012-red-credit-card.pdf` },
  'rakbank-titanium': { id:'titanium', name:'Titanium Credit Card', kfsName:'Titanium Mastercard Credit Card',
    url:`${site}/en/cards/credit-cards/titanium-credit-card`, kfs:`${pdfRoot}/kfs011-titanium-credit-card.pdf` },
} as const;

const html = 'http-decoded-response-body', pdf = 'pdftotext-layout';
type Source = { id:string; url:string; capturedAt:string; sourceScope:string; sourceRepresentation:typeof html|typeof pdf;
  sourceBodySha256:string; sourceTextSha256:string; fixtureTextSha256:string; text:string; firstLine:number; sourceStartByte:number; };
const hash = (s:string) => createHash('sha256').update(s).digest('hex');
const sha = /^[a-f\d]{64}$/;
export const rakbankSourceIds = (id:'red'|'titanium') => [
  `catalogue-${id}-name`, `catalogue-${id}-income`, `catalogue-${id}-apply`,
  `product-${id}`, `product-${id}-apply`, `product-${id}-fee`,
  `kfs-${id}-name`, `kfs-${id}-income`, `kfs-${id}-fee`, 'fees-vat', 'fees-header', 'fees-primary',
] as const;
function select(sources:Source[], id:string, url:string, type:Source['sourceRepresentation']) {
  const rows = sources.filter(s => s.id === id);
  if (rows.length !== 1) return null;
  const s = rows[0];
  if (s.url !== url || s.sourceRepresentation !== type || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256)
    || (type === html && s.sourceBodySha256 !== s.sourceTextSha256) || !s.sourceScope
    || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1 || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte < 0
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))
    || hash(s.text) !== s.fixtureTextSha256) return null;
  return s;
}
function ordered(a:Source, b:Source) {
  return a.sourceStartByte + Buffer.byteLength(a.text) <= b.sourceStartByte && a.firstLine <= b.firstLine;
}
function sameSource(a:Source, b:Source) {
  return a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
}
function evidence(s:Source, productScope:string, unit:string, vatTreatment:'inclusive'|'not-applicable') {
  const { sourceStartByte, firstLine, text, sourceRepresentation } = s;
  return { parserId:'rakbank/catalogue-kfs-schedule/v2', productScope, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation, sourceScope:s.sourceScope, captureMethod:'public-http-reader' as const,
    sourceExtraction:sourceRepresentation === pdf ? 'pdftotext-layout' as const : 'http-decoded-html-excerpt' as const,
    firstLine, lastLine:firstLine + text.split('\n').length - 1,
    sourceStartByte, sourceEndByte:sourceStartByte + Buffer.byteLength(text), rawText:text, rawTextSha256:s.fixtureTextSha256 };
}

/** Exact named primary rows only. An unresolved launch/renewal fee does not qualify. */
export function parseRakbankActiveProduct(sources:Source[], slug:string) {
  if (!Object.hasOwn(RAKBANK_EXPANSION_PRODUCTS, slug)) return null;
  const card = RAKBANK_EXPANSION_PRODUCTS[slug as keyof typeof RAKBANK_EXPANSION_PRODUCTS];
  const ids = rakbankSourceIds(card.id);
  const args = [
    ...Array.from({length:3},()=>[RAKBANK_CARD_DIRECTORY,html] as const),
    ...Array.from({length:3},()=>[card.url,html] as const),
    ...Array.from({length:3},()=>[card.kfs,pdf] as const),
    ...Array.from({length:3},()=>[RAKBANK_CONSUMER_SCHEDULE,pdf] as const),
  ];
  const [catalogueName,catalogueIncome,catalogueApply,product,apply,productFee,kfsName,kfsIncome,kfsFee,vat,feeHeader,feeRow] = ids.map((id,index)=>select(sources,id,...args[index]!));
  if (!catalogueName || !catalogueIncome || !catalogueApply || !product || !apply || !productFee || !kfsName || !kfsIncome || !kfsFee || !vat || !feeHeader || !feeRow) return null;
  if (!sameSource(catalogueName,catalogueIncome) || !sameSource(catalogueName,catalogueApply)
    || !ordered(catalogueName,catalogueIncome) || !ordered(catalogueIncome,catalogueApply)
    || catalogueApply.sourceStartByte - catalogueName.sourceStartByte > 15_000
    || catalogueApply.firstLine - catalogueName.firstLine > 35
    || !sameSource(product,apply) || !sameSource(product,productFee)
    || !sameSource(kfsName,kfsIncome) || !sameSource(kfsName,kfsFee) || !ordered(kfsName,kfsFee) || !ordered(kfsFee,kfsIncome)
    || !sameSource(vat,feeHeader) || !sameSource(vat,feeRow) || !ordered(vat,feeHeader) || !ordered(feeHeader,feeRow)) return null;
  const heading = new RegExp(`^<h3\\b[^>]*>${card.name}</h3>$`);
  const kfsHeading = card.id === 'red' ? card.kfsName : `\u202b\u202a${card.kfsName}\u202c\u202c`;
  const productNoFee = card.id === 'red' ? /^<h4\b[^>]*>Free for life<\/h4><div>No annual fee – ever\s*<\/div>$/ : /^"featureTitle":"Free for life"$/;
  const kfsNoFee = card.id === 'red' ? '• A Free for life credit card' : /^\u202b•\u202c[ \t]+\u202b\u202aA free for life credit card\u202c\u202c$/;
  if (!heading.test(catalogueName.text) || kfsName.text !== kfsHeading
    || !/^<a\b[^>]*href="https:\/\/apps\.rakbank\.ae\/[^"\s]+"[^>]*aria-label="Apply Instantly"[^>]*>$/.test(catalogueApply.text)
    || product.text !== `<link rel="canonical" href="${card.url}"/>`
    || !/^<a\b[^>]*href="\/en\/everyday-banking\/rakbank-for-you\/mobile-app\/"[^>]*aria-label="Apply now"[^>]*>$/.test(apply.text)
    || !productNoFee.test(productFee.text) || !(typeof kfsNoFee === 'string' ? kfsFee.text === kfsNoFee : kfsNoFee.test(kfsFee.text))
    || !/^ +Consumer Credit Card Service and Price Guide \(Including VAT\)$/.test(vat.text) || feeHeader.text !== 'Annual/Joining Fee (D)'
    || !/^ +Titanium, Red & Business Titanium[ \t]+Free$/.test(feeRow.text)) return null;
  const listingIncome = catalogueIncome.text.match(new RegExp(`^<\\/svg>\\s*<\\/span>(${SOURCE_NUMBER})<\\/p>$`));
  const salary = kfsIncome.text.match(new RegExp(card.id === 'red'
    ? `^3\\.[ \\t]+is employed with a minimum monthly salary of D (${SOURCE_NUMBER}) or$`
    : `^\\u202b\\u202ac\\.\\u202c\\u202c[ \\t]+\\u202b\\u202aIs an employed individual with a minimum salary of D (${SOURCE_NUMBER})\\u202c\\u202c[^\\n]*\\n[ \\t]+\\u202b\\u202aper month\\u202c\\u202c$`));
  const publishedMinMonthlyIncome = parseSourceNumber(salary?.[1] ?? '');
  if (publishedMinMonthlyIncome === null || publishedMinMonthlyIncome <= 0 || publishedMinMonthlyIncome !== parseSourceNumber(listingIncome?.[1] ?? '')) return null;
  const feeScope = 'AED primary annual and joining membership fees';
  const genuineFeeEvidence = [evidence(feeHeader,card.name,feeScope,'inclusive'), evidence(feeRow,card.name,feeScope,'inclusive')];
  return { name:card.name, network:'Mastercard' as const, applyUrl:card.url, kfsUrl:card.kfs,
    publishedMinMonthlyIncome, annualFee:0, joiningFee:0,
    evidence: { annualFee:[...genuineFeeEvidence,evidence(kfsFee,card.name,'AED recurring membership fee','not-applicable'),evidence(productFee,card.name,'AED recurring membership fee','not-applicable')],
      joiningFee:genuineFeeEvidence, 'eligibility.publishedMinMonthlyIncome':[evidence(kfsIncome,card.name,'AED monthly for salaried applicants','not-applicable')] } };
}
