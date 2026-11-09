// Manual, source-specific research parser. No fetch, model extraction, data write,
// valuation-model update or automatic acceptance. Full captures stay private.
import { createHash } from 'node:crypto';
import { parseSourceNumber, SOURCE_NUMBER } from './_lib.ts';

export const ACCOR_PROMOTION_URL = 'https://all.accor.com/a/en/loyalty-program/promotions-offers/meapac-bonus-points-offer.html';
export const ACCOR_MEMBERSHIP_URL = 'https://all.accor.com/a/en/loyalty-program/legal/terms-and-conditions.html';

export interface HotelResearchSource {
  url: string;
  scrapeId: string;
  accessDate: string;
  // A returned markdown hash is NOT a raw HTML/body hash or proof of completeness.
  sourceMarkdownSha256: string;
  textSha256: string;
  representation: 'returned-markdown' | 'sanitised-source-excerpt';
  text: string;
}
export interface HotelTermEvidence {
  url: string;
  scrapeId: string;
  accessDate: string;
  representation: HotelResearchSource['representation'];
  sourceMarkdownSha256: string;
  inputTextSha256: string;
  // Offsets index the supplied text (possibly an excerpt), NOT another
  // representation identified only by sourceMarkdownSha256.
  start: number;
  end: number;
  lineStart: number;
  lineEnd: number;
  quote: string;
}
interface Observation<T> { value: T; evidence: HotelTermEvidence; supportingEvidence?: HotelTermEvidence[]; approval: 'pending' }
export interface AccorResearchTerms {
  registration: Observation<{ from: string; through: string; deadlineText: string }>;
  booking: Observation<{ from: string; through: string; deadlineText: string }>;
  stay: Observation<{ from: string; through: string }>;
  minimumNights: Observation<number>;
  classicBasedMultiplier: Observation<number>;
  postingDays: Observation<number>;
  classicDefaultBrandEarn: Observation<{ points: number; eligibleEUR: number }>;
  onlineRedemption: Observation<{ minimumPoints: number; minimumDiscountEUR: number; secondBlockPoints: number; secondDiscountEUR: number; incrementAfterSecondBlock: number }>;
}
type Scope = { source: HotelResearchSource; text: string; offset: number };
const sha = (text: string) => createHash('sha256').update(text).digest('hex');

function validate(source: HotelResearchSource, url: string) {
  if (source.url !== url) throw new Error('Unexpected exact official source URL');
  if (!source.scrapeId || !/^\d{4}-\d{2}-\d{2}$/.test(source.accessDate)) throw new Error('Missing source identity/access date');
  if (!/^[a-f0-9]{64}$/.test(source.sourceMarkdownSha256) || sha(source.text) !== source.textSha256) throw new Error('Source text hash mismatch');
  if (!['returned-markdown', 'sanitised-source-excerpt'].includes(source.representation)) throw new Error('Unknown source representation');
  if (source.representation === 'returned-markdown' && source.textSha256 !== source.sourceMarkdownSha256) throw new Error('Returned markdown identity mismatch');
  if (source.representation === 'sanitised-source-excerpt' && source.textSha256 === source.sourceMarkdownSha256) throw new Error('Excerpt cannot assert whole-source identity');
}
function exact(scope: Scope, pattern: RegExp, label: string): RegExpExecArray {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...scope.text.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`${label}: expected exactly one source match, found ${matches.length}`);
  return matches[0];
}
function section(source: HotelResearchSource, first: RegExp, last: RegExp, label: string): Scope {
  const full = { source, text: source.text, offset: 0 };
  const start = exact(full, first, `${label} start`), end = exact(full, last, `${label} end`);
  if (end.index! <= start.index!) throw new Error(`${label}: reversed section`);
  return { source, text: source.text.slice(start.index, end.index), offset: start.index! };
}
function observation<T>(scope: Scope, match: RegExpExecArray, value: T): Observation<T> {
  const start = scope.offset + match.index!, end = start + match[0].length;
  return { value, approval: 'pending', evidence: { url: scope.source.url, scrapeId: scope.source.scrapeId,
    accessDate: scope.source.accessDate, representation: scope.source.representation,
    sourceMarkdownSha256: scope.source.sourceMarkdownSha256, inputTextSha256: scope.source.textSha256,
    start, end, lineStart: scope.source.text.slice(0, start).split('\n').length,
    lineEnd: scope.source.text.slice(0, end).split('\n').length, quote: match[0] } };
}
function number(token: string): number {
  const value = parseSourceNumber(token);
  if (value === null) throw new Error('Invalid source numeric token');
  return value;
}
const DATE = String.raw`(\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})`;
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function sourceDate(token: string): string {
  const m = new RegExp(`^${DATE}$`).exec(token);
  if (!m) throw new Error('Invalid source date');
  const [day, month, year] = token.split(' '), d = number(day), y = number(year), mo = months.indexOf(month) + 1;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() + 1 !== mo || date.getUTCDate() !== d) throw new Error('Invalid calendar date');
  return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseAccorHotelResearch(promotion: HotelResearchSource, membership: HotelResearchSource): {
  state: 'review-only' | 'hold'; errors: string[]; terms: AccorResearchTerms | null;
  automaticAcceptanceAllowed: false; matchedRateComparisonAvailable: false; sourceCompletenessCertified: false;
} {
  const held = { automaticAcceptanceAllowed: false as const, matchedRateComparisonAvailable: false as const, sourceCompletenessCertified: false as const };
  try {
    validate(promotion, ACCOR_PROMOTION_URL); validate(membership, ACCOR_MEMBERSHIP_URL);
    const stay = section(promotion, /^2X STAY ALL ACCOR FESTIVE OFFER 2026$/m, /^2X DINE ALL ACCOR FESTIVE OFFER 2026$/m, 'STAY campaign');
    const earning = section(membership, /^\*\*7\.2\.3 Scale for earning Reward points as part of an Eligible Stay\*\*$/m, /^\*\*7\.2\.4\*\* Scale for earning Status points as part of an Eligible Stay$/m, 'Reward points table');
    const redemption = section(membership, /^## 10\\\. USING REWARD POINTS$/m, /^## 11\\\. MEMBER ACCOUNT ISSUES$/m, 'Redemption');
    const registration = exact(stay, new RegExp(String.raw`must register for the offer \(between \\\[${DATE}\\\], through (11:59 p\.m\. Central European Time \(CET\)), \\\[${DATE}\\\]\) prior to their stay`), 'Registration dates');
    exact(stay, /Only bookings made after successful registration via the login button are eligible for this bonus offer\./, 'Registration before booking');
    const windows = exact(stay, new RegExp(String.raw`This offer is valid for a member’s stay from \\\[${DATE}\\\] to \\\[${DATE}\\\][^\n]*and booked between \\\[${DATE}\\\], through (11:59 p\.m\. Central European Time \(CET\)), \\\[${DATE}\\\]\.`), 'Stay and booking dates');
    const minimum = exact(stay, /Stays of two \((\d+)\) nights or more/, 'Minimum consecutive nights');
    exact(stay, /A stay must be consecutive nights at the same hotel/, 'Consecutive same-hotel restriction');
    if (number(minimum[1]) !== 2) throw new Error('Written/digit minimum stay disagreement');
    const multiplier = exact(stay, /multiply the Reward points they earn by \\\[(\d+)X\\\] when staying/, 'STAY multiplier');
    exact(stay, /in accordance with the ALL Accor general conditions of use and based on Classic status\./, 'Classic-based promotion');
    const posting = exact(stay, /Reward points will be credited to the member’s account within (\d+) days of the member checking out\./, 'Posting window');
    const base = exact(earning, /\*\*FOR €(\d+) IN ELIGIBLE EXPENSES \(excluding Thalassa sea & spa properties\)\*\*/, 'Eligible EUR table unit');
    const header = exact(earning, /^\| STATUT \|[^\n]+$/m, 'Reward table header');
    const headerCells = header[0].replace(/\\\*/g, '*').split('|').map(cell => cell.replace(/\s+/g, ' ').trim());
    if (headerCells.length !== 7 || headerCells[2] !== 'NUMBER OF REWARD POINTS EARNED AT PARTICIPATING BRANDS*' || !headerCells[4].includes('LONG STAY BRANDS')) throw new Error('Changed earning table columns');
    const classic = exact(earning, new RegExp(String.raw`^\| CLASSIC \| (${SOURCE_NUMBER}) \| (${SOURCE_NUMBER}) \| (${SOURCE_NUMBER}) \| (${SOURCE_NUMBER}) \|$`, 'm'), 'Classic default-brand row');
    const longStay = exact(earning, /^\\\*\\\*Fairmont Serviced Residences,[^\n]*Novotel Living, Mercure Living\./m, 'Long-stay brand exclusion');
    const online = exact(redemption, new RegExp(String.raw`On the website and in the ALL Accor app, Reward Points can only be used for a minimum of (${SOURCE_NUMBER}) Reward Points\. This entitles you to a discount of (${SOURCE_NUMBER}) euros[^\n]*?(${SOURCE_NUMBER}) Reward Points will lead to a discount of (${SOURCE_NUMBER}) euros on the booking, and Reward Points \(after (${SOURCE_NUMBER}) Reward Points\) can only be used in multiples of (${SOURCE_NUMBER}) Reward Points\.`), 'Online redemption blocks');
    if (number(online[3]) !== number(online[5])) throw new Error('Redemption block threshold disagreement');
    const terms: AccorResearchTerms = {
      registration: observation(stay, registration, { from: sourceDate(registration[1]), through: sourceDate(registration[3]), deadlineText: registration[2] }),
      stay: observation(stay, windows, { from: sourceDate(windows[1]), through: sourceDate(windows[2]) }),
      booking: observation(stay, windows, { from: sourceDate(windows[3]), through: sourceDate(windows[5]), deadlineText: windows[4] }),
      minimumNights: observation(stay, minimum, number(minimum[1])),
      classicBasedMultiplier: observation(stay, multiplier, number(multiplier[1])),
      postingDays: observation(stay, posting, number(posting[1])),
      classicDefaultBrandEarn: { ...observation(earning, classic, { points: number(classic[1]), eligibleEUR: number(base[1]) }),
        supportingEvidence: [observation(earning, base, base[0]).evidence, observation(earning, header, header[0]).evidence, observation(earning, longStay, longStay[0]).evidence] },
      onlineRedemption: observation(redemption, online, { minimumPoints: number(online[1]), minimumDiscountEUR: number(online[2]), secondBlockPoints: number(online[3]), secondDiscountEUR: number(online[4]), incrementAfterSecondBlock: number(online[6]) }),
    };
    if (terms.stay.value.from > terms.stay.value.through || terms.booking.value.from > terms.booking.value.through || terms.registration.value.from > terms.registration.value.through) throw new Error('Reversed campaign date window');
    return { ...held, state: 'review-only', errors: [], terms };
  } catch (error) {
    return { ...held, state: 'hold', errors: [error instanceof Error ? error.message : String(error)], terms: null };
  }
}
