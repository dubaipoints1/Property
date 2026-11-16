import { createHash } from 'node:crypto';
import { parseSourceNumber, SOURCE_NUMBER } from './_lib.ts';

export const RAKBANK_DIGITAL_WELCOME_TERMS = 'https://www.rakbank.ae/globalassets/rakbank/all-pdfs/001---campaign/tc---new-customer-dob-feb-2025.pdf';
const base = 'https://www.rakbank.ae/en/cards/credit-cards/';
const products = {
  'rakbank-titanium': {name:'Titanium', url:`${base}titanium-credit-card`},
  'rakbank-world': {name:'World', url:`${base}world-credit-card`},
} as const;
type Slug = keyof typeof products;
type Pin = {kind:string; url:string; capturedAt:string; sourceBodySha256:string; sourceTextSha256:string; firstLine:number; lastLine:number;
  page?:number; startByte?:number; endByte?:number; raw:string; rawSha256:string };
type Fixture = {format:number; asOfDubai:string; terms:Record<string,Pin>; rows:Record<string,Pin>; product:Record<string,Pin>};
const sha = (s:string) => createHash('sha256').update(s).digest('hex');
const hex = /^[a-f\d]{64}$/;
const N = `(${SOURCE_NUMBER})`;

const check = (s:Pin | undefined, kind:'issuer-pdf-layout'|'issuer-html-headline', url:string) =>
  s && s.kind === kind && s.url === url && hex.test(s.sourceBodySha256) && hex.test(s.sourceTextSha256)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s.capturedAt) && Number.isFinite(Date.parse(s.capturedAt))
    && Number.isInteger(s.firstLine) && s.firstLine > 0 && s.raw.split('\n').length === s.lastLine - s.firstLine + 1 && sha(s.raw) === s.rawSha256
    && (kind==='issuer-pdf-layout' ? s.page === 1 || s.page === 2 : s.sourceBodySha256 === s.sourceTextSha256
      && Number.isSafeInteger(s.startByte) && s.startByte! >= 0 && s.startByte! + Buffer.byteLength(s.raw) === s.endByte);
const english = (pin:Pin) => pin.raw.split('\n').map(line => line.replace(/[\u0590-\u08ff\u202a-\u202e].*$/,'').trim()
  .replace(/\s{2,}[().:/'"]+$/,'')).join(' ').replace(/\s+/g,' ');

/** Replays evidence for a review disclosure only. Never run this as a canonical scraper or bonus-ranking input. */
export function parseRakbankDigitalWelcome(fixture:Fixture, slug:string) {
  if (fixture.format !== 1 || !Object.hasOwn(products,slug)) return null;
  const {name,url}=products[slug as Slug];
  const {period,eligible,table,channel,fulfilment,exclusions} = fixture.terms;
  const row = fixture.rows[slug], banner = fixture.product[slug];
  const pdfPins = [period,eligible,table,row,channel,fulfilment,exclusions];
  if (!pdfPins.every(x => check(x,'issuer-pdf-layout',RAKBANK_DIGITAL_WELCOME_TERMS)) || !check(banner,'issuer-html-headline',url)
    || !pdfPins.every(x=>x.sourceTextSha256===period.sourceTextSha256 && x.sourceBodySha256===period.sourceBodySha256 && x.capturedAt===period.capturedAt)
    || !pdfPins.every(x=>x.page===(x===exclusions?2:1))
    || !pdfPins.slice(1).every((x,index)=>x.firstLine>pdfPins[index].lastLine)) return null;
  const dates = english(period).match(/effective from (\d{1,2} [A-Z][a-z]+ \d{4}) to (\d{1,2} [A-Z][a-z]+ \d{4}) \(both dates inclusive\)/);
  if (!dates || !/Eligible Card Type/.test(table.raw) || !/Minimum Spend Requirements/.test(table.raw)
    || !/Days since Eligible Card issuance/.test(table.raw) || !/RAKrewards \(D\)/.test(table.raw)) return null;
  const scope = english(eligible), via = english(channel), credit = english(fulfilment), omit = english(exclusions);
  if (!/Be a new Rakbank customer or an existing Rakbank customer who does not have a Rakbank credit card/.test(scope)
    || !/apply for and be issued an Eligible Card through the Rakbank digital banking application during the Promotion Period/.test(scope)
    || !/not be eligible for this Promotion/.test(via) || !/experience team \(DXT\) solely for the purpose of completing the application, you shall remain eligible/.test(via)
    || !/credited to the Eligible Card within ninety \(90\) Business Days from the end of the Promotion Period/.test(credit)
    || !/the first twelve \(12\) months from the date of issuance/.test(omit)
    || !/should have been closed at least six \(6\) months prior to the current application/.test(omit)
    || !/Rakbank staff are not eligible/.test(omit) || !/Self-employed customers .* will not be eligible/.test(omit)
    || !/RAKMoney Transfer\/Funds Transfer/.test(omit) || !/fees, charges, repayments and instalment-related/i.test(omit)
    || !/the first Eligible Card only/.test(omit) || !/any other spend based promotion\/offers in respect of the same Eligible Card during the Promotion Period, unless expressly permitted by Rakbank/.test(omit)
    || !/delinquent, blocked, over limit and inactive Eligible Cards during the Promotion or Cashback\/RAKrewards fulfillment period will not be eligible/.test(omit)) return null;
  const tokens = row.raw.split('\n');
  const columns = tokens[1]?.match(new RegExp(String.raw`^\s+${N} {2,}${N} {2,}${N}\s*$`));
  if (tokens.length!==3 || tokens[2].trim()!==`${name} Credit Card` || !columns) return null;
  const [spendAed,daysAfterIssuance,cashbackAed] = columns.slice(1).map(parseSourceNumber);
  const displayed = banner.raw.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  const [opens,closes]=dates.slice(1);
  const shortStart=opens.replace(/ \d{4}$/,'');
  const displayedPrefix=`Apply digitally for a Rakbank ${name} Cashback Credit Card from ${shortStart} to ${closes} and receive `;
  if (!displayed.startsWith(displayedPrefix) || !/welcome bonus\.$/.test(displayed)
    || parseSourceNumber(displayed.slice(displayedPrefix.length).replace(/\*? welcome bonus\.$/,''))!==cashbackAed
    || !spendAed || !daysAfterIssuance || !Number.isInteger(daysAfterIssuance) || !cashbackAed) return null;
  const asOf=Date.parse(fixture.asOfDubai), start=Date.parse(opens), end=Date.parse(closes);
  if (!Number.isFinite(asOf) || !Number.isFinite(start) || !Number.isFinite(end) || asOf<start || asOf>end
    || ![...pdfPins,banner].every(x=>new Date(Date.parse(x.capturedAt)+4*60*60*1000).toISOString().slice(0,10)===fixture.asOfDubai)) return null;
  return {name,opens,closes,spendAed,daysAfterIssuance,cashbackAed,termsUrl:RAKBANK_DIGITAL_WELCOME_TERMS,productUrl:url};
}
