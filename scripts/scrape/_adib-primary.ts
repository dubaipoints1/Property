// ADIB-only primary evidence. Pure deterministic parsers; no network or writes.
// A proposal is not publication authority and never overwrites protected fields.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber, parseSourceAED } from "./_lib.ts";

export interface AdibSource {
  id: string;
  url: string;
  capturedAt: string;
  text: string;
  sourceTextSha256: string;
  sourceBodySha256: string;
  firstLine: number;
  firstByte: number;
  representation: "pdftotext-layout" | "http-decoded-html-excerpt" | "http-decoded-readable-text";
  fixtureTextSha256: string;
}
export interface AdibSpan {
  sourceUrl: string;
  capturedAt: string;
  sourceTextSha256: string;
  sourceBodySha256: string;
  representation: AdibSource["representation"];
  firstLine: number;
  lastLine: number;
  startByte: number;
  endByte: number;
  rawText: string;
  rawTextSha256: string;
}
export interface AdibAmount {
  amount: number;
  unit: "AED" | "percent";
  vatTreatment: "exclusive" | "inclusive" | "not-applicable";
  parserId: string;
  evidence: AdibSpan[];
}
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const unique = (text: string, r: RegExp): RegExpMatchArray | null => {
  const hits = [...text.matchAll(new RegExp(r.source, r.flags.includes("g") ? r.flags : r.flags + "g"))];
  return hits.length === 1 ? hits[0] : null;
};
function valid(s: AdibSource, pathname: RegExp, representation: AdibSource["representation"]): boolean {
  try {
    const u = new URL(s.url);
    return u.protocol === "https:" && /^(?:www\.)?adib\.(?:ae|com)$/.test(u.hostname)
      && pathname.test(u.pathname) && s.representation === representation
      && /^[a-f0-9]{64}$/.test(s.sourceBodySha256) && /^[a-f0-9]{64}$/.test(s.sourceTextSha256)
      && Number.isInteger(s.firstLine) && s.firstLine > 0 && Number.isInteger(s.firstByte) && s.firstByte >= 0
      && sha(s.text) === s.fixtureTextSha256
      && (representation === "http-decoded-html-excerpt" || s.sourceTextSha256 === sha(s.text));
  } catch { return false; }
}
function span(s: AdibSource, start: number, text: string): AdibSpan {
  return { sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256,
    sourceBodySha256: s.sourceBodySha256, representation: s.representation,
    firstLine: s.firstLine + s.text.slice(0, start).split("\n").length - 1,
    lastLine: s.firstLine + s.text.slice(0, start + text.length - 1).split("\n").length - 1,
    startByte: s.firstByte + Buffer.byteLength(s.text.slice(0, start)),
    endByte: s.firstByte + Buffer.byteLength(s.text.slice(0, start + text.length)),
    rawText: text, rawTextSha256: sha(text) };
}
function matchSpan(s: AdibSource, m: RegExpMatchArray): AdibSpan { return span(s, m.index!, m[0]); }
function cells(s: AdibSource, m: RegExpMatchArray): { raw: string; evidence: AdibSpan }[] {
  return [...m[0].matchAll(/\S(?:.*?\S)?(?= {2,}|$)/g)].map(c => ({ raw: c[0], evidence: span(s, m.index! + c.index!, c[0]) }));
}

// Order independently checked against the rendered, named V46 table. The exact
// header fingerprint is a deliberate review gate: a new/reordered/duplicate
// column, changed label or layout must NOT keep using these positional indices.
const SOC_HEADER_SHA = "4df7829003f31583a9b67e4b2939a1a693da08eed0d205dc29c3cc9af03c7159";
export const ADIB_SOC_COLUMNS = [
  "ADIB Cashback Visa Card (23)", "ADIB Cashback Visa Platinum Card (23)", "ADIB Cashback Visa Card(18)",
  "ADIB Exceed Visa Card", "ADIB Exceed Visa Platinum Card (23)", "ADIB Etihad Guest Visa Classic Card (23)",
  "ADIB Etihad Guest Visa Gold Card", "ADIB Etihad Guest Visa Platinum Card", "ADIB Etihad Guest Visa Infinite Card",
  "ADIB Football Card (23)", "ADIB Fast Card (23)", "ADIB Smiles Classic card (8)", "ADIB Smiles Gold Card (23)",
  "ADIB Smiles Visa Platinum Card (23)", "ADIB Smiles Visa Signature Card", "ADIB SHARE Visa Infinite Card (21)",
  "ADIB SHARE Visa Platinum Card (22)", "ADIB Egde Card (23) (9)", "ADIB Value + Card (23)",
  "ADIB Value Card (23)", "ADIB Spice Card (23)", "ADIB Dana Master Card (23)",
  "ADIB Rotana Rewards Exclusive Visa Card (23)", "ADIB Booking.com Visa Signature Card",
  "ADIB Booking.com Visa Infinite Card (23)", "ADIB Emirates Skywards Signature Card", "ADIB Emirates Skywards Infinite Card",
  "Marriott Bonvoy (R) ADIB Visa Signature Card", "Marriott Bonvoy (R) ADIB Visa Infinite Card",
  "ADIB Aldar Visa Platinum Card", "ADIB Aldar Visa Infinite Card",
] as const;

export const ADIB_PRODUCTS: Record<string, { title: string; family: string; detailPath: string; socIndex: number; kfsIndex: number; programme: string }> = {
  "adib-cashback-visa": { title: "Cashback Visa Covered Card", family: "cashback-visa-card", detailPath: "/en/personal/cards/cashback-visa-card/adib-cashback-visa-covered-card", socIndex: 2, kfsIndex: 7, programme: "ADIB Cashback" },
  "adib-exceed-visa": { title: "Exceed Visa Covered Card", family: "exceed-cards", detailPath: "/en/pages/exceed-visa-covered-card.aspx", socIndex: 3, kfsIndex: 10, programme: "ADIB Exceed Rewards" },
  "adib-exceed-visa-platinum": { title: "Exceed Visa Platinum Covered Card", family: "exceed-cards", detailPath: "/en/Pages/exceed-Visa-Platinum-Covered-Card.aspx", socIndex: 4, kfsIndex: 11, programme: "ADIB Exceed Rewards" },
  "adib-etihad-guest-gold": { title: "Etihad Guest Visa Gold Card", family: "etihad-guest-cards", detailPath: "/en/personal/cards/etihad-guest-cards/adib-etihad-guest-visa-gold-card", socIndex: 6, kfsIndex: 2, programme: "Etihad Guest" },
  "adib-etihad-guest-platinum": { title: "Etihad Guest Visa Platinum Card", family: "etihad-guest-cards", detailPath: "/en/personal/cards/etihad-guest-cards/adib-etihad-guest-visa-platinum-card", socIndex: 7, kfsIndex: 1, programme: "Etihad Guest" },
  "adib-etihad-guest-infinite": { title: "Etihad Guest Visa Infinite Covered Card", family: "etihad-guest-cards", detailPath: "/en/personal/cards/etihad-guest-cards/adib-etihad-guest-visa-infinite-card", socIndex: 8, kfsIndex: 0, programme: "Etihad Guest" },
  "adib-smiles-visa-classic": { title: "ADIB Smiles Visa Classic Card", family: "smiles-covered-cards", detailPath: "/en/personal/cards/smiles-covered-cards/adib-smiles-visa-classic-card", socIndex: 11, kfsIndex: 5, programme: "Smiles" },
  "adib-smiles-visa-signature": { title: "ADIB Smiles Visa Signature Card", family: "smiles-covered-cards", detailPath: "/en/personal/cards/smiles-covered-cards/adib-smiles-visa-signature-card", socIndex: 14, kfsIndex: 4, programme: "Smiles" },
  "adib-share-visa-infinite": { title: "SHARE Visa Infinite Card", family: "share-visa-cards", detailPath: "/en/personal/cards/share-visa-cards/share-visa-infinite-card", socIndex: 15, kfsIndex: 14, programme: "SHARE" },
  "adib-share-visa-platinum": { title: "SHARE Visa Platinum Card", family: "share-visa-cards", detailPath: "/en/personal/cards/share-visa-cards/share-visa-platinum-card", socIndex: 16, kfsIndex: 15, programme: "SHARE" },
  "adib-booking-visa-signature": { title: "Booking.com Visa Signature Card", family: "booking-card", detailPath: "/en/Pages/booking-signature-card.aspx", socIndex: 23, kfsIndex: 6, programme: "ADIB Exceed Rewards" },
  "adib-skywards-visa-signature": { title: "Emirates Skywards Visa Signature Card", family: "emirates-skywards-cards", detailPath: "/en/personal/cards/emirates-skywards-cards/emirates-skywards-visa-signature-card", socIndex: 25, kfsIndex: 13, programme: "Emirates Skywards" },
  "adib-skywards-visa-infinite": { title: "Emirates Skywards Visa Infinite Card", family: "emirates-skywards-cards", detailPath: "/en/personal/cards/emirates-skywards-cards/emirates-skywards-visa-infinite-card", socIndex: 26, kfsIndex: 12, programme: "Emirates Skywards" },
  "adib-marriott-bonvoy-visa-signature": { title: "Marriott Bonvoy ADIB Visa Signature Card", family: "marriott-cards", detailPath: "/en/personal/cards/marriott-cards/marriott-bonvoy-visa-signature-card", socIndex: 27, kfsIndex: 8, programme: "Marriott Bonvoy" },
  "adib-marriott-bonvoy-visa-infinite": { title: "Marriott Bonvoy ADIB Visa Infinite Card", family: "marriott-cards", detailPath: "/en/personal/cards/marriott-cards/marriott-bonvoy-visa-infinite-card", socIndex: 28, kfsIndex: 9, programme: "Marriott Bonvoy" },
  "adib-aldar-visa-platinum": { title: "Aldar Visa Platinum Card", family: "aldar-cards", detailPath: "/en/personal/cards/aldar-cards/aldar-visa-platinum-card", socIndex: 29, kfsIndex: 17, programme: "Darna" },
  "adib-aldar-visa-infinite": { title: "Aldar Visa Infinite Card", family: "aldar-cards", detailPath: "/en/personal/cards/aldar-cards/aldar-visa-infinite-card", socIndex: 30, kfsIndex: 16, programme: "Darna" },
};

export function parseAdibSchedule(s: AdibSource) {
  if (!valid(s, /^\/-\/media\/Project\/ADIB\/ADIBSite\/docs\/Personal\/cards\/ADIB-Covered-Cards-Schedule-of-Charges-and-Fees\.pdf$/, "pdftotext-layout")) return null;
  const headers = unique(s.text, /^ +ADIB Cashback[^\n]*\n(?:[^\n]*\n){5}/gm);
  if (!headers || sha(headers[0].replace(/\n$/, "")) !== SOC_HEADER_SHA) return null;
  const version = unique(s.text, /^ *CC S&C combine \(BWB & ADIB\) V-46 October 2026 *$/gm);
  const feeRow = unique(s.text, /^ +Covered Card Annual Fee +[^\n]+$/gm);
  const vat = unique(s.text, /^ +(\d+(?:\.\d+)?)% Value Added Tax \(VAT\) will be additionally added to the amount of the Banking Services fees and charges mentioned below unless explicitly mentioned that VAT is not applicable or inclusive in such amount\.$/gm);
  const currency = unique(s.text, /^ +All of the above currencies are in ⃃ unless mentioned otherwise\.[^\n]+$/gm);
  const discontinued = unique(s.text, /^ +\(23\) Discontinued for new customers\.$/gm);
  if (!version || !feeRow || !vat || !currency || !discontinued) return null;
  const feeCells = cells(s, feeRow);
  if (feeCells.shift()?.raw !== "Covered Card Annual Fee" || feeCells.length !== ADIB_SOC_COLUMNS.length) return null;
  const vatRate = parseSourceNumber(vat[1]);
  if (vatRate === null || vatRate > 100) return null;
  // Fail the whole positional table if any cell stops having a known grammar.
  if (feeCells.some(c => !new RegExp(`^(?:${SOURCE_NUMBER}(?:\\((?:1|13|14)\\))?|Free(?:\\(8\\))?|${SOURCE_NUMBER}/${SOURCE_NUMBER}\\*)$`).test(c.raw))) return null;
  return { feeCells, vatRate, headerEvidence: matchSpan(s, headers), vatEvidence: matchSpan(s, vat),
    currencyEvidence: matchSpan(s, currency), discontinuedEvidence: matchSpan(s, discontinued), versionEvidence: matchSpan(s, version) };
}

const KFS_HEADERS = [
  { pattern: /\f Fees and cost\n Card type\n([\s\S]+?) +Annual Fee5\n/g, hash: "861149529003d39738a7360fd0d34f0d58e527c5a0c7b38145e9fd5831de379c", count: 10 },
  { pattern: /\n +ADIB Emirates +ADIB Emirates\n([\s\S]+?) +Annual Fee5\n/g, hash: "1d4af0359c9d6fb75207b9ec0ee181c16343bcce54378d2427ab1373d6361173", count: 8 },
];
export function parseAdibKfs(s: AdibSource) {
  if (!valid(s, /^\/-\/media\/project\/adib\/adibsite\/docs\/kfs\/cards\/adib-covered-cards-kfs\.pdf$/, "pdftotext-layout")
    || !s.text.startsWith("Covered Cards - Key Facts Statement")) return null;
  const vat = unique(s.text, /^ 5\. (\d+(?:\.\d+)?)% VAT applicable\.$/gm);
  const exclusive = unique(s.text, /^ Schedule of charges,[^\n]+VAT is exclusive on all above fees and charges unless specified\.$/gm);
  // The Arabic annual row spells out dirham, rather than asking the reader to
  // infer the PDF's currency glyph. Both relevant full bilingual pages are kept.
  const arabicDirham = unique(s.text, /^.*2,500[^\n]*دره[^\n]*499[^\n]*دره[^\n]*99[^\n]*دره[^\n]*299[^\n]*دره[^\n]*3,0004[^\n]*$/gm);
  if (!vat || !exclusive || !arabicDirham) return null;
  const all: { raw: string; value: number | null; evidence: AdibSpan; headerEvidence: AdibSpan }[] = [];
  for (const group of KFS_HEADERS) {
    const header = unique(s.text, group.pattern);
    if (!header || sha(header[0]) !== group.hash) return null;
    const start = header.index! + header[0].length;
    const raw = s.text.slice(start).split("\n")[0];
    const row = Object.assign([raw], { index: start }) as unknown as RegExpMatchArray;
    const parsed = cells(s, row);
    if (parsed.length !== group.count) return null;
    for (let i = 0; i < parsed.length; i++) {
      const c = parsed[i];
      const etihadFootnote = group.count === 10 && i < 4;
      const r = new RegExp(`^⃃ (${SOURCE_NUMBER})${etihadFootnote ? "4" : ""}$`).exec(c.raw);
      const range = new RegExp(`^⃃ (${SOURCE_NUMBER})/ (${SOURCE_NUMBER})\\*$`).exec(c.raw);
      if (!r && !range && c.raw !== "Free for Life") return null;
      all.push({ raw: c.raw, value: r ? parseSourceNumber(r[1]) : c.raw === "Free for Life" ? parseSourceNumber("0") : null,
        evidence: c.evidence, headerEvidence: matchSpan(s, header) });
    }
  }
  return { feeCells: all, vatRate: parseSourceNumber(vat[1]), vatEvidence: matchSpan(s, vat),
    exclusiveEvidence: matchSpan(s, exclusive), arabicDirhamEvidence: matchSpan(s, arabicDirham) };
}

/** A single unmodified covered-wrapper HTML block from an observed family URL.
 * A family page's listing is NOT enough to overrule a discontinued SoC column. */
export function parseAdibListing(s: AdibSource, slug: string) {
  const p = ADIB_PRODUCTS[slug];
  if (!p || !valid(s, new RegExp(`^/en/personal/cards/${escape(p.family)}$`), "http-decoded-html-excerpt")) return null;
  const title = unique(s.text, /<h4 class="new-covered-card__title" title="([^"]+)">([^<]+)<\/h4>/g);
  if (!title || title[1] !== p.title || title[2] !== p.title || !/\bVisa\b/.test(p.title)) return null;
  const detail = unique(s.text, /href="([^"]+)"[\s\S]{0,150}?<div class="content">Learn More<\/div>/g);
  const apply = unique(s.text, /href="([^"]+)"[\s\S]{0,150}?<div class="content">Apply Now<\/div>/g);
  if (!detail || !apply) return null;
  let detailUrl: URL, applyUrl: URL;
  try {
    detailUrl = new URL(detail[1], s.url); applyUrl = new URL(apply[1], s.url);
    if (detailUrl.pathname !== p.detailPath || detailUrl.protocol !== "https:"
      || !/^https?:$/.test(applyUrl.protocol) || [detailUrl, applyUrl].some(u => !/^(?:www\.)?adib\.(ae|com)$/.test(u.hostname))) return null;
  } catch { return null; }
  const rawFee = unique(s.text, /<li class="subTitle-head secondary">Annual Fee: +<strong>([\s\S]+?)<\/strong><\/li>/g);
  let fee: number | null = null;
  if (rawFee) {
    const value = unique(rawFee[1], new RegExp(`^&nbsp;<img (?:width="15" )?alt="Dirham Symbol" src="/-/media/project/adib/adibsite/icons/dirham-black\\.svg(?:\\?[^\"]*)?" class="d-inline(?: dirhamIcon)?"(?: style="margin-top: -4px; ")? />(${SOURCE_NUMBER})(?:\\*)?$`, "g"));
    if (!value) {
      if (!/^Free$/.test(rawFee[1])) return null;
      fee = parseSourceNumber("0");
    } else fee = parseSourceAED(`AED ${value[1]}`);
  } else if (slug !== "adib-cashback-visa") return null;
  return { name: p.title, network: "Visa" as const, programme: p.programme, detailUrl: detailUrl.href,
    applyUrl: applyUrl.href, applyUrlHttps: applyUrl.protocol === "https:", advertisedFee: fee,
    identityEvidence: [matchSpan(s, title), matchSpan(s, detail), matchSpan(s, apply)],
    ...(rawFee ? { feeEvidence: matchSpan(s, rawFee) } : {}) };
}

/** Category-specific/value-back observations are not universal earn rates. In
 * particular a marketing “up to” rate keeps its bound and AED/USD denominator. */
export function parseAdibListingEconomics(s: AdibSource, slug: string) {
  if (!parseAdibListing(s, slug)) return [];
  const block = unique(s.text, /<div class="new-covered-card__description-list">([\s\S]*?)<\/div>/g);
  if (!block) return [];
  const observations: { field: string; value: number; unit: string; bound: "exact" | "upper"; denominator?: number; denominatorCurrency?: string; evidence: AdibSpan; parserId: string }[] = [];
  const rows = [...block[0].matchAll(/<span class="content line-clamp-3">([^<]+)<\/span>/g)];
  const add = (m: RegExpMatchArray, value: string, field: string, unit: string, bound: "exact" | "upper" = "exact", denominator?: string, denominatorCurrency?: string) => {
    const n = parseSourceNumber(value), d = denominator === undefined ? undefined : parseSourceNumber(denominator);
    if (n === null || d === null) return;
    observations.push({ field, value: n, unit, bound, ...(d !== undefined ? { denominator: d, denominatorCurrency } : {}),
      evidence: span(s, block.index! + m.index!, m[0]), parserId: "adib/listing-scoped-economics/v1" });
  };
  for (const row of rows) {
    const t = row[1].replace(/[\u200b-\u200d\ufeff]/g, "").trim();
    let m: RegExpExecArray | null;
    if (slug === "adib-cashback-visa" && (m = new RegExp(`^(${SOURCE_NUMBER})% on (grocery and supermarket spends|fuel and automobile spends|school and education payments|dining and restaurants spends|utility payments)$`).exec(t))) {
      const label = { "grocery and supermarket spends": "groceries", "fuel and automobile spends": "fuel", "school and education payments": "education", "dining and restaurants spends": "dining", "utility payments": "utilities" }[m[2]];
      add(row, m[1], `rewards.${label}`, "percent cashback");
    }
    if (slug.startsWith("adib-share-") && (m = new RegExp(`^Earn (${SOURCE_NUMBER})% (?:back )?in SHARE Points on local spends$`).exec(t))) add(row, m[1], "rewards.local", "percent value back in SHARE Points");
    if (slug.startsWith("adib-share-") && (m = new RegExp(`^Earn (${SOURCE_NUMBER})% back in SHARE Points \\((${SOURCE_NUMBER})% in EEA region\\) on the equivalent amount in AED for international spends *\\*+$`).exec(t))) {
      add(row, m[1], "rewards.international-excluding-eea", "percent value back in SHARE Points");
      add(row, m[2], "rewards.eea", "percent value back in SHARE Points");
    }
    if (slug.startsWith("adib-share-") && (m = new RegExp(`^Earn (${SOURCE_NUMBER})% in SHARE Points on Specific Merchants spends\\*+$`).exec(t))) add(row, m[1], "rewards.specific-merchants", "percent value back in SHARE Points");
    if (slug.startsWith("adib-aldar-") && (m = new RegExp(`^Earn up to (${SOURCE_NUMBER})% value back in Darna Points on spends$`).exec(t))) add(row, m[1], "rewards.marketing-upper-bound", "percent value back in Darna Points", "upper");
    if (slug.startsWith("adib-marriott-") && (m = new RegExp(`^Earn up to (${SOURCE_NUMBER}) Marriott Bonvoy points per US\\$(${SOURCE_NUMBER}) on spends\\.$`).exec(t))) add(row, m[1], "rewards.marketing-upper-bound", "Marriott Bonvoy points", "upper", m[2], "USD");
    if (slug === "adib-etihad-guest-infinite" && (m = new RegExp(`^Up to (${SOURCE_NUMBER}) Etihad Guest Miles per (${SOURCE_NUMBER}) AED$`).exec(t))) add(row, m[1], "rewards.marketing-upper-bound", "Etihad Guest Miles", "upper", m[2], "AED");
  }
  // Repeated marketing rows would be ambiguous, not a reason to pick the first.
  return new Set(observations.map(o => o.field)).size === observations.length ? observations : [];
}

const DETAIL_HEADINGS: Record<string, string> = {
  "adib-cashback-visa": "# ADIB Cashback Visa Covered Card",
  "adib-share-visa-infinite": "# ADIB SHARE Visa Infinite Card", "adib-share-visa-platinum": "# ADIB SHARE Visa Platinum Card",
  "adib-aldar-visa-infinite": "# Aldar Visa Infinite Card", "adib-aldar-visa-platinum": "# Aldar Visa Platinum Card",
  "adib-marriott-bonvoy-visa-signature": "# Marriott Bonvoy® ADIB Visa Signature Card", "adib-marriott-bonvoy-visa-infinite": "# Marriott Bonvoy® ADIB Visa Infinite Card",
  "adib-skywards-visa-infinite": "# Emirates Skywards Visa Infinite Card", "adib-skywards-visa-signature": "# Emirates Skywards Visa Signature Card",
  "adib-etihad-guest-infinite": "# ADIB Etihad Guest Visa Infinite Card", "adib-etihad-guest-platinum": "# ADIB Etihad Guest Visa Platinum Card", "adib-etihad-guest-gold": "# ADIB Etihad Guest Gold Card",
  "adib-exceed-visa": "# ADIB Exceed Visa Covered Card", "adib-booking-visa-signature": "# ADIB Booking Signature Card",
  "adib-smiles-visa-signature": "# ADIB Smiles Visa Signature Card", "adib-smiles-visa-classic": "# ADIB Smiles Visa Classic Card",
};
export function parseAdibDetail(s: AdibSource, slug: string) {
  const p = ADIB_PRODUCTS[slug], heading = DETAIL_HEADINGS[slug];
  if (!p || !heading || !valid(s, new RegExp(`^${escape(p.detailPath)}$`), "http-decoded-readable-text") || s.firstLine !== 1 || s.firstByte !== 0 || s.sourceTextSha256 !== sha(s.text)) return null;
  const legacy = slug === "adib-exceed-visa" || slug === "adib-booking-visa-signature";
  const title = legacy ? unique(s.text, new RegExp(`^${escape(heading)}$`, "gm")) : s.text.startsWith(heading + "\n") ? Object.assign([heading], { index: 0 }) as unknown as RegExpMatchArray : null;
  if (!title) return null;
  const observations: { field: string; value: number; unit: string; bound: "exact" | "upper"; denominator?: number; denominatorCurrency?: string; evidence: AdibSpan[]; parserId: string }[] = [];
  const add = (m: RegExpMatchArray | null, field: string, unit: string, bound: "exact" | "upper" = "exact", denominator?: { token: string; currency: string; evidence: RegExpMatchArray }) => {
    if (!m) return;
    const n = parseSourceNumber(m[1]), d = denominator ? parseSourceNumber(denominator.token) : undefined;
    if (n === null || d === null) return;
    observations.push({ field, value: n, unit, bound, ...(d !== undefined ? { denominator: d, denominatorCurrency: denominator!.currency } : {}),
      evidence: [matchSpan(s, m), ...(denominator ? [matchSpan(s, denominator.evidence)] : [])], parserId: "adib/product-scoped-standing-economics/v1" });
  };
  const salary = unique(s.text, new RegExp(`^- Minimum salary - AED (${SOURCE_NUMBER})$`, "gm"));
  add(salary, "eligibility.minSalary", "AED monthly salary");
  const placeholder = unique(s.text, /^- Minimum monthly salary: AED \[X\]$/gm);
  if (slug.startsWith("adib-skywards-visa-") || slug === "adib-etihad-guest-infinite") {
    const skywards = slug.startsWith("adib-skywards-");
    const denomination = unique(s.text, skywards ? /^Earn Skywards Miles for every AED (\d+(?:\.\d+)?) equivalent spend:?$/gm : /^Earn Etihad Guest Bonus Miles for every AED (\d+(?:\.\d+)?) equivalent spend$/gm);
    if (!denomination) return null;
    const unit = skywards ? "Skywards Miles" : "Etihad Guest Miles";
    for (const [field, label] of [["rewards.local", "Local currency spends"], ["rewards.foreign", "Foreign currency spends"], ["rewards.specific-category", "Specific category spends"], ["rewards.carrier", skywards ? "Emirates and Flydubai spends" : "Etihad Airways spends"]]) {
      const m = unique(s.text, new RegExp(`^- ${escape(label)}:?[ ]+(${SOURCE_NUMBER}) Miles?\\*{0,2}[\u200b]*$`, "gm"));
      add(m, field, unit, "exact", { token: denomination[1], currency: "AED", evidence: denomination });
    }
  }
  if (slug.startsWith("adib-aldar-")) {
    add(unique(s.text, new RegExp(`^- Earn (${SOURCE_NUMBER})% value back\\(2\\) in Darna Points at Aldar Malls & Aldar Hospitality\\.$`, "gm")), "rewards.aldar-malls-hospitality", "percent value back in Darna Points");
    add(unique(s.text, new RegExp(`^- Earn (${SOURCE_NUMBER})% value back\\(2\\) in Darna Points at Aldar Education, Aldar Properties and domestic spend\\.$`, "gm")), "rewards.local", "percent value back in Darna Points");
    const international = unique(s.text, new RegExp(`^- Earn (${SOURCE_NUMBER})% value back in Darna Points on International Spend; Earn (${SOURCE_NUMBER})% value back\\(3\\) in Darna Points on spend within the EEA region\\.$`, "gm"));
    add(international, "rewards.international-excluding-eea", "percent value back in Darna Points");
    if (international) { const eea = [...international] as unknown as RegExpMatchArray; eea[1] = international[2]; eea.index = international.index; add(eea, "rewards.eea", "percent value back in Darna Points"); }
    add(unique(s.text, new RegExp(`^- Earn (${SOURCE_NUMBER})% value back\\(2\\) in Darna Points at specific merchants\\(4\\)\\.$`, "gm")), "rewards.specific-merchants", "percent value back in Darna Points");
  }
  if (slug.startsWith("adib-marriott-")) {
    const denom = unique(s.text, new RegExp(`^- Earn ${SOURCE_NUMBER} points for every US\\$(${SOURCE_NUMBER}) spent at hotels participating in Marriott Bonvoy[®.]$`, "gm"));
    if (!denom) return null;
    const denominator = { token: denom[1], currency: "USD", evidence: denom };
    add(unique(s.text, new RegExp(`^- Earn (${SOURCE_NUMBER}) points for every US\\$${SOURCE_NUMBER} spent at hotels participating in Marriott Bonvoy[®.]$`, "gm")), "rewards.marriott-hotels", "Marriott Bonvoy points", "exact", denominator);
    for (const [field, label] of [["rewards.international-upper-bound", "international"], ["rewards.domestic-upper-bound", "domestic"]]) add(unique(s.text, new RegExp(`^- Earn up to (${SOURCE_NUMBER}) Marriott Bonvoy points per US\\$${SOURCE_NUMBER} on ${label} spends\\.$`, "gm")), field, "Marriott Bonvoy points", "upper", denominator);
  }
  if (slug === "adib-exceed-visa" || slug === "adib-booking-visa-signature") {
    for (const [field, r] of [
      ["rewards.local", new RegExp(`^(${SOURCE_NUMBER}) Exceed Rewards for every AED (${SOURCE_NUMBER}) spent within UAE[.\u200b]*$`, "gm")],
      ["rewards.international-excluding-eea", new RegExp(`^(${SOURCE_NUMBER}) Exceed Rewards(?:\\(1\\))? for every AED (${SOURCE_NUMBER}) \\(or equivalent[\u200b]?\\) spent internationally(?:\\(1\\))?[.\u200b]*$`, "gm")],
      ["rewards.specific-merchants", new RegExp(`^(${SOURCE_NUMBER}) Exceed Reward for every AED (${SOURCE_NUMBER}) spent on Specific Merchants\\(2\\)[.\u200b]*$`, "gm")],
      ["rewards.eea", new RegExp(`^\\(1\\) (${SOURCE_NUMBER}) Exceed Reward for every AED (${SOURCE_NUMBER}) spent in Countries which are a part of the European Economic Area\\.[^\n]*$`, "gm")],
    ] as const) { const m = unique(s.text, r); if (m) add(m, field, "Exceed Reward points", "exact", { token: m[2], currency: "AED", evidence: m }); }
  }
  const specificMerchantText = unique(s.text, /^(?:\(4\)|\*\*\*\*|[\u200b]?\(2\)) Specific Merchants are:[^\n]+$/gm);
  return { slug, identityEvidence: matchSpan(s, title), observations,
    minSalary: salary ? parseSourceAED(`AED ${salary[1]}`) : null,
    salaryState: salary ? "source-stated" : placeholder ? "issuer-placeholder-pending" : "not-stated-in-readable-product-detail",
    ...(placeholder ? { salaryPlaceholderEvidence: matchSpan(s, placeholder) } : {}),
    ...(specificMerchantText ? { specificMerchantEvidence: matchSpan(s, specificMerchantText) } : {}),
    calculatorEligible: false, canonicalWriteEligible: false,
    limitations: ["Scopes, exceptions and denominators must remain visible; observations are not a universal all-spend rate.",
      ...(slug.startsWith("adib-marriott-") ? ["Domestic and international earn figures are issuer-labelled upper bounds, not guaranteed base rates."] : []),
      ...(slug.startsWith("adib-skywards-") || slug === "adib-etihad-guest-infinite" ? ["Read more popup qualifications are not included in the captured readable page; scheme/category/EEA exclusions remain to be reconciled to the card terms."] : []),
      ...(slug === "adib-booking-visa-signature" ? ["Current linked product page is used; do not borrow the historical discontinued cohort's reward table."] : [])] };
}

/** Whole-family proposal: economics are candidates pending independent review.
 * Missing rates/salary remain null; no invented zero, valuation or base earn. */
export function proposeAdibProfile(listingSource: AdibSource, socSource: AdibSource, kfsSource: AdibSource, slug: string) {
  const p = ADIB_PRODUCTS[slug];
  const listing = parseAdibListing(listingSource, slug), soc = parseAdibSchedule(socSource), kfs = parseAdibKfs(kfsSource);
  if (!p || !listing || !soc || !kfs || soc.vatRate !== kfs.vatRate) return null;
  const namedColumn = ADIB_SOC_COLUMNS[p.socIndex];
  if (/\(23\)/.test(namedColumn)) return { slug, state: "held-discontinued-for-new-customers", namedColumn,
    reason: "Family Apply Now conflicts with the current named Schedule of Charges column and its discontinued footnote.",
    evidence: [...listing.identityEvidence, soc.headerEvidence, soc.discontinuedEvidence] };
  const cell = soc.feeCells[p.socIndex], kfsCell = kfs.feeCells[p.kfsIndex];
  const r = new RegExp(`^(${SOURCE_NUMBER})(?:\\(13\\))?$`).exec(cell.raw);
  const rawAmount = r ? parseSourceAED(`AED ${r[1]}`) : /^Free$/.test(cell.raw) ? parseSourceNumber("0") : null;
  if (rawAmount === null || kfsCell.value === null) {
    const choices = new RegExp(`^(${SOURCE_NUMBER})/(${SOURCE_NUMBER})\\*$`).exec(cell.raw);
    const terms = unique(socSource.text, new RegExp(`\\* ⃃ (${SOURCE_NUMBER}) with fast track to Gold tier / ⃃ (${SOURCE_NUMBER}) without fast track to Gold tier`, "g"));
    const kfsTerms = unique(kfsSource.text, new RegExp(`\\* ⃃ (${SOURCE_NUMBER}) - without fast track to Gold tier / ⃃ (${SOURCE_NUMBER}) - with fast track to Gold tier`, "g"));
    const without = choices ? parseSourceNumber(choices[1]) : null, withGold = choices ? parseSourceNumber(choices[2]) : null;
    if (!choices || !terms || !kfsTerms || without === null || withGold === null
      || without !== parseSourceNumber(terms[2]) || withGold !== parseSourceNumber(terms[1])
      || without !== parseSourceNumber(kfsTerms[1]) || withGold !== parseSourceNumber(kfsTerms[2])
      || listing.advertisedFee !== withGold) return null;
    return { slug, state: "held-conditional-fee", canonicalWriteEligible: false, namedColumn,
      reason: "A fee range/choice is not a single unconditional annual fee; do not default silently to either option.",
      feeOptions: [
        { condition: "without fast track to Gold tier", exclusiveAmount: without, inclusiveAmount: Math.round(without * (1 + soc.vatRate / 100) * 100) / 100, currency: "AED" },
        { condition: "with fast track to Gold tier", exclusiveAmount: withGold, inclusiveAmount: Math.round(withGold * (1 + soc.vatRate / 100) * 100) / 100, currency: "AED" },
      ], evidence: [cell.evidence, kfsCell.evidence, matchSpan(socSource, terms), matchSpan(kfsSource, kfsTerms), soc.vatEvidence, kfs.vatEvidence, kfs.arabicDirhamEvidence, ...listing.identityEvidence] };
  }
  if (rawAmount !== kfsCell.value || (listing.advertisedFee !== null && listing.advertisedFee !== rawAmount)) return null;
  const inclusive = Math.round(rawAmount * (1 + soc.vatRate / 100) * 100) / 100;
  const evidence = [cell.evidence, soc.headerEvidence, soc.versionEvidence, soc.vatEvidence, soc.currencyEvidence,
    kfsCell.evidence, kfsCell.headerEvidence, kfs.vatEvidence, kfs.exclusiveEvidence, kfs.arabicDirhamEvidence,
    ...listing.identityEvidence, ...(listing.feeEvidence ? [listing.feeEvidence] : [])];
  return { slug, state: slug === "adib-cashback-visa" ? "protected-existing-field-review" : "held-fee-only-pending-economics",
    canonicalWriteEligible: false, bank: "adib", name: `ADIB ${listing.name.replace(/^ADIB /, "")}`, network: listing.network,
    programme: listing.programme, namedColumn, annualFee: { amount: inclusive, currency: "AED", vatPolicy: "inclusive" },
    sourceFeeExclusive: rawAmount, sourceVatPercent: soc.vatRate,
    parserId: "adib/v46-named-column-bilingual-fee/v1", evidence,
    rewardObservations: parseAdibListingEconomics(listingSource, slug),
    minSalary: null, fxFee: null, baseEarnRate: null, calculatorEligible: false,
    detailUrl: listing.detailUrl, applyUrl: listing.applyUrl,
    limitations: ["Salary eligibility is not yet confirmed; null does not mean no minimum salary.",
      "No universal base earn rate is typed; this profile must not enter spend-return calculations.",
      "FX fees are not flattened: issuer Non-dirham fee and scheme/international-transaction components need separate treatment.",
      ...(p.programme === "Etihad Guest" ? ["This is the regular-funded fee; the separately priced self-funded cohort is not the same proposition."] : []),
      ...(p.programme === "SHARE" ? ["Annual-fee reversal is conditional; the standard annual charge is not zero."] : [])] };
}

/** Only the combined packet can qualify a profile beyond identity/fee evidence.
 * Unknown-base products remain explicitly outside the spend-return calculator. */
export function proposeAdibEnrichedProfile(listingSource: AdibSource, socSource: AdibSource, kfsSource: AdibSource, detailSource: AdibSource | undefined, slug: string) {
  const profile = proposeAdibProfile(listingSource, socSource, kfsSource, slug);
  if (!profile || profile.state === "held-discontinued-for-new-customers") return profile;
  if (!detailSource) return null;
  const detail = parseAdibDetail(detailSource, slug);
  if (!detail) return null;
  if (profile.state === "held-conditional-fee") return { ...profile, detail, calculatorEligible: false };
  const listingRewards = parseAdibListingEconomics(listingSource, slug);
  const meaningful = detail.observations.some(o => o.field.startsWith("rewards.") && o.bound === "exact")
    || listingRewards.some(o => o.field.startsWith("rewards.") && o.bound === "exact");
  return { ...profile, state: slug === "adib-cashback-visa" ? "protected-existing-field-review"
    : meaningful ? "qualified-partial-candidate" : "held-standing-rewards-unconfirmed",
    minSalary: detail.minSalary, salaryState: detail.salaryState, detail,
    limitations: [...profile.limitations.filter(l => !l.startsWith("Salary eligibility")),
      ...(detail.minSalary === null ? ["Salary eligibility remains Pending, not zero; the current readable product source does not provide a usable salary amount."] : []),
      ...detail.limitations, ...(!meaningful ? ["Do not create a fee-only profile or count this card as newly covered until standing reward economics are confirmed."] : [])] };
}

const TERMS_BLOCKS: Record<string, { heading: string; next: string; unit: string; rows: number }> = {
  "adib-etihad-guest-infinite": { heading: "17.2.1.1 Non self-funded ADIB Etihad Guest Visa Infinite Card is:", next: "17.2.1.2", unit: "Etihad Guest Miles", rows: 5 },
  "adib-etihad-guest-platinum": { heading: "17.2.1.2 Non self-funded ADIB Etihad Guest Visa Platinum Card is:", next: "17.2.1.3", unit: "Etihad Guest Miles", rows: 4 },
  "adib-etihad-guest-gold": { heading: "17.2.1.4 Non self-funded ADIB Etihad Guest Gold Card is:", next: "17.2.1.5", unit: "Etihad Guest Miles", rows: 4 },
  "adib-skywards-visa-infinite": { heading: "18.2.1.1 ADIB Emirates Skywards World Elite / Infinite Card is:", next: "18.2.1.2", unit: "Skywards Miles", rows: 5 },
  "adib-skywards-visa-signature": { heading: "18.2.1.2 ADIB Emirates Skywards World / Signature Card is:", next: "18.2.2", unit: "Skywards Miles", rows: 5 },
  "adib-smiles-visa-signature": { heading: "21.2.1.1 ADIB Smiles Visa Signature Card is", next: "21.2.1.2", unit: "Smiles Points", rows: 5 },
  "adib-smiles-visa-classic": { heading: "21.2.1.4 ADIB Smiles Classic Card is:", next: "21.2.2", unit: "Smiles Points", rows: 5 },
  "adib-exceed-visa": { heading: "29.2.3 ADIB Exceed Visa Covered Card", next: "29.3", unit: "Exceed Reward points", rows: 4 },
  "adib-booking-visa-signature": { heading: "25.2.2 ADIB Booking.com Visa Signature Covered Card:", next: "25.3", unit: "Exceed Reward points", rows: 5 },
  "adib-share-visa-infinite": { heading: "30.2.1.1 ADIB SHARE Visa Infinite Card:", next: "30.2.1.2", unit: "percent value back in SHARE Points", rows: 5 },
  "adib-share-visa-platinum": { heading: "30.2.1.2 SHARE Points Platinum Card:", next: "30.2.2", unit: "percent value back in SHARE Points", rows: 5 },
  "adib-aldar-visa-infinite": { heading: "33.2.1.1 ADIB Aldar Visa Infinite Covered Card:", next: "33.2.1.2", unit: "Darna Points", rows: 5 },
  "adib-aldar-visa-platinum": { heading: "33.2.1.2 ADIB Aldar Visa Platinum Covered Card:", next: "33.2.2", unit: "Darna Points", rows: 5 },
};
function termsReady(s: AdibSource) {
  return valid(s, /^\/-\/media\/project\/adib\/adibsite\/docs\/personal\/cards\/adib-covered-cards-terms-and-conditions\.pdf$/, "pdftotext-layout")
    && s.text.startsWith("Covered Cards\nTerms and Conditions\n")
    && !!unique(s.text, /^ +ADIB CC T&Cs \(BWB\)_V-31 October 2026$/gm);
}
function namedTermBlock(s: AdibSource, heading: string, next: string) {
  const header = unique(s.text, new RegExp(`^[ \\t\\f]*${heading.split(" ").map(escape).join("[ \\t\\r\\n]+")}`, "gm"));
  const end = unique(s.text, new RegExp(`^[ \\t\\f]*${escape(next)}(?=[ \\t\\r\\n]|$)`, "gm"));
  if (!header || !end || end.index! <= header.index!) return null;
  return { header, start: header.index! + header[0].length, text: s.text.slice(header.index! + header[0].length, end.index) };
}
const normalisePdfRow = (s: string) => s.replace(/\n[ \t]+\d+\n(?:\f|$)/g, "\n").replace(/\s+/g, " ").trim();

/** V31 clauses are explicit issuer contractual terms, not a statutory standard.
 * Cohort and category labels survive parsing; a rate is never made universal. */
export function parseAdibStandingTerms(s: AdibSource, slug: string) {
  if (!termsReady(s) || !(slug in ADIB_PRODUCTS)) return null;
  const definitions = unique(s.text, /^Qualifying Expenditure means[\s\S]+?(?=^Selling Price means)/gm);
  if (!definitions) return null;
  const observations: { field: string; value: number; unit: string; denominator?: number; denominatorCurrency?: "AED" | "USD"; bound: "exact"; evidence: AdibSpan[]; parserId: string }[] = [];
  const conditions: AdibSpan[] = [matchSpan(s, definitions)];
  const add = (field: string, n: string, denominator: string | undefined, currency: "AED" | "USD" | undefined, unit: string, evidence: AdibSpan[]) => {
    const value = parseSourceNumber(n), d = denominator === undefined ? undefined : parseSourceNumber(denominator);
    if (value === null || d === null || (d !== undefined && d <= 0)) return false;
    observations.push({ field, value, unit, ...(d !== undefined ? { denominator: d, denominatorCurrency: currency } : {}), bound: "exact", evidence, parserId: "adib/v31-named-standing-rewards/v1" });
    return true;
  };
  if (slug.startsWith("adib-marriott-")) {
    const family = slug.endsWith("signature") ? "31.5" : "31.6";
    const tier = slug.endsWith("signature") ? "Signature" : "Infinite";
    const named = namedTermBlock(s, `${family} ${family === "31.5" ? "Terms and Conditions Specific To:" : "Terms & Conditions Specific To:"} Marriott Bonvoy® ADIB Visa ${tier} Card`, `${family}.2`);
    if (!named) return null;
    conditions.push(matchSpan(s, named.header));
    // Clause numbers locate candidates; they do not establish economic scope.
    // V31's complete semantic tail must agree before a row receives its field.
    const scopeTails: Record<string, string> = {
      "rewards.marriott-direct": "charged on the Cardholder’s Card when charged directly with Participating Hotels, standalone Marriott branded retail establishments, and Marriott branded online stores (including online purchases of Marriott branded gift cards) that, in each case, are wholly owned or managed by Marriott International, Inc. and/or its affiliates. Additional Marriott Bonvoy Points received under the Marriott Bonvoy Program for stays at Participating Hotels will be earned in accordance with the Marriott Bonvoy Program Rules. The use of Marriott Bonvoy Points and participation in the Marriott Bonvoy Program is subject to the Marriott Bonvoy Program Rules.",
      "rewards.international-excluding-eea": "on International (outside of UAE but not in EEA) Spend.",
      "rewards.local": "on Domestic (UAE) Spend.",
      "rewards.eea": "on European Economic Area (EEA) Spend.",
      "rewards.specific-merchants": "charged on the Cardholder’s Card for Specific Merchants Spend.",
    };
    for (const [index, field] of [["2", "rewards.marriott-direct"], ["3", "rewards.international-excluding-eea"], ["4", "rewards.local"], ["5", "rewards.eea"], ["6", "rewards.specific-merchants"]]) {
      const clause = namedTermBlock(s, `${family}.1.${index}`, `${family}.1.${Number(index) + 1}`);
      if (!clause) return null;
      const raw = clause.header[0] + clause.text;
      const t = normalisePdfRow(raw);
      const m = new RegExp(`^${escape(family)}\\.1\\.${index} The Cardholder will earn (${SOURCE_NUMBER}) Marriott Bonvoy Points? per USD (${SOURCE_NUMBER}) (?:or equivalent )?(?:spent )?on Qualifying Expenditures?`).exec(t);
      if (!m || t.slice(m[0].length).trim() !== scopeTails[field]
        || !add(field, m[1], m[2], "USD", "Marriott Bonvoy points", [span(s, clause.header.index!, raw), matchSpan(s, named.header)])) return null;
    }
    return { slug, observations, conditions, cohort: `Marriott Bonvoy ADIB Visa ${tier} contractual earning clauses`, scopeConflicts: [], canonicalWriteEligible: false };
  }
  const config = TERMS_BLOCKS[slug];
  if (!config) return null;
  const block = namedTermBlock(s, config.heading, config.next);
  if (!block) return null;
  conditions.push(matchSpan(s, block.header));
  if (slug.startsWith("adib-share-")) {
    const ecosystem = unique(s.text, /^30\.1\.1 SHARE Points may be earned by ADIB SHARE co-branded\n[\s\S]+?Participating Ecosystem\./gm);
    if (!ecosystem) return null;
    conditions.push(matchSpan(s, ecosystem));
  }
  if (slug.startsWith("adib-aldar-")) {
    const ecosystem = unique(s.text, /^33\.1 Eligibility\nDarna Points may be earned by ADIB Aldar Visa Covered Card\nholders only on approved Qualifying Expenditure in the Participating\nAldar Ecosystem\./gm);
    if (!ecosystem) return null;
    conditions.push(matchSpan(s, ecosystem));
  }
  const bullets = [...block.text.matchAll(/^[ \t\f]*[-•][ \t]*/gm)];
  if (!bullets.length) return null;
  for (let i = 0; i < bullets.length; i++) {
    const start = bullets[i].index!, end = bullets[i + 1]?.index ?? block.text.length;
    const raw = block.text.slice(start, end), t = normalisePdfRow(raw), evidence = [span(s, block.start + start, raw), matchSpan(s, block.header)];
    if (/^- (?:Maximum Smiles points|In each statement cycle, the maximum ADIB Exceed Rewards)/.test(t)) {
      conditions.push(evidence[0]);
      const cap = new RegExp(`up to a maximum of (${SOURCE_NUMBER}) Smiles points\\.`).exec(t);
      if (cap && !add("rewards.monthly-points-cap", cap[1], undefined, undefined, "Smiles Points per month", evidence)) return null;
      continue;
    }
    if (slug.startsWith("adib-share-")) {
      const m = new RegExp(`^[-•] ?(${SOURCE_NUMBER})% in (?:SHARE|Share) Points (.+)$`).exec(t);
      if (!m) return null;
      let field: string;
      if (m[2] === "on spends on Qualifying Expenditure within the Participating Ecosystem") field = "rewards.participating-ecosystem";
      else if (m[2] === "on local spends on Qualifying Expenditure") field = "rewards.local";
      else if (m[2] === "on Specific Merchants spends on Qualifying Expenditure") field = "rewards.specific-merchants";
      else {
        const eea = new RegExp(`^\\((${SOURCE_NUMBER})% in EEA region\\) on the equivalent amount in AED for (?:on )?international spends on Qualifying Expenditure$`).exec(m[2]);
        if (!eea || !add("rewards.eea", eea[1], undefined, undefined, config.unit, evidence)) return null;
        field = "rewards.international-excluding-eea";
      }
      if (!add(field, m[1], undefined, undefined, config.unit, evidence)) return null;
      continue;
    }
    const m = new RegExp(`^[-•] ?(${SOURCE_NUMBER}) (?:Etihad Guest Miles?|Emirates Skywards Miles?|Smiles Points?|Exceed Rewards?|EXCEED Rewards?|Darna Points) for every AED (${SOURCE_NUMBER})(?: \\(equivalent\\)| \\(or equivalent\\))? (.+)$`, "i").exec(t);
    if (!m) return null;
    const tail = m[3];
    let field: string;
    if (/Specific Merchants?[.;]?$/.test(tail)) field = "rewards.specific-merchants";
    else if (/countries other than the ones in the EEA[.;]?$/.test(tail)) field = "rewards.international-excluding-eea";
    else if (/countries that are in the EEA[.;]?$/.test(tail)) field = "rewards.eea";
    else if (/(?:within|inside) UAE[.;]?$/.test(tail)) field = "rewards.local";
    else if (/at Etihad Airways[.;]?$/.test(tail) || /at Emirates and flydubai direct sales channels[.;]?$/.test(tail)) field = "rewards.carrier";
    else if (/on Smiles APP[.;]?$/.test(tail)) field = "rewards.smiles-app";
    else if (/^of Qualifying Expenditure$/.test(tail)) field = "rewards.general-qualifying";
    else if (/at Aldar Malls and Aldar Hospitality$/.test(tail)) field = "rewards.aldar-malls-hospitality";
    else if (/within UAE, at Aldar Education and Aldar Properties$/.test(tail)) field = "rewards.aldar-education-properties";
    else if (/^of Qualifying Airline Expenditure capped at /.test(tail)) {
      field = "rewards.airlines";
      const caps = new RegExp(`capped at (${SOURCE_NUMBER}) Exceed Rewards per transaction and capped at a maximum of (${SOURCE_NUMBER}) Exceed Rewards each statement cycle\\.`).exec(tail);
      if (!caps || !add("rewards.airlines.per-transaction-points-cap", caps[1], undefined, undefined, "Exceed Reward points per transaction", evidence)
        || !add("rewards.airlines.statement-cycle-points-cap", caps[2], undefined, undefined, "Exceed Reward points per statement cycle", evidence)) return null;
    } else return null;
    if (!add(field, m[1], m[2], "AED", config.unit, evidence)) return null;
  }
  if ((slug.startsWith("adib-share-") ? observations.length : observations.filter(o => o.denominator !== undefined).length) !== config.rows || new Set(observations.map(o => o.field)).size !== observations.length) return null;
  const cohort = slug.startsWith("adib-etihad-") ? "Non self-funded regular card; excludes self-funded and Infinite Private cohorts"
    : slug.startsWith("adib-smiles-") ? "Smiles section 21.2.1; not legacy Etisalat section 21.2.2"
      : slug.startsWith("adib-skywards-") ? "Issuer explicitly groups the named Visa tier with a legacy World tier for earning only; card identities/networks remain distinct"
        : slug === "adib-booking-visa-signature" ? "New Signature cards issued from 18 December 2023, section 25" : "Named current card tier only";
  if (slug === "adib-booking-visa-signature") {
    const current = unique(s.text, /25\. New ADIB Booking\.com Visa Signature Covered\n[ \t]+Card\n[ \t]+\(Applicable on cards issued from 18 December 2023\)/g);
    if (!current) return null;
    conditions.push(matchSpan(s, current));
  }
  return { slug, observations, conditions, cohort,
    scopeConflicts: slug.startsWith("adib-aldar-") ? ["Product marketing says domestic spend; V31 labels the UAE row 'within UAE, at Aldar Education and Aldar Properties'. Do not silently promote that named-merchant row into an all-domestic base rate.",
      "V31 eligibility clause 33.1 limits approved Qualifying Expenditure to the Participating Aldar Ecosystem, while 33.2 also lists non-AED international and EEA award rows. The ecosystem-versus-award-row scope remains unresolved; a null base rate or named local-merchant row does not resolve it. Do not present the eligibility and award-row wording as reconciled."]
      : slug.startsWith("adib-share-") ? ["V31 eligibility clause 30.1.1 refers to qualifying expenditure in the Participating Ecosystem, while its award clauses also state local/international/specific-merchant rates. Preserve the clause distinction; do not present ecosystem eligibility language as a resolved universal-spend promise."] : [], canonicalWriteEligible: false };
}

/** Strictly named programme table; closed products in this table are NOT made
 * active. The point value is value towards rewards, not cash cashback. */
export function parseAdibExceedProgramme(s: AdibSource, slug: string) {
  if (!["adib-exceed-visa", "adib-booking-visa-signature"].includes(slug)
    || !valid(s, /^\/en\/personal\/exceed-rewards-loyalty-programme$/, "http-decoded-readable-text")
    || !s.text.startsWith("# Exceed Rewards Loyalty Programme | Reward Points | ADIB\n")) return null;
  const value = unique(s.text, new RegExp(`^Every Exceed reward you earn is equivalent to (AED ${SOURCE_NUMBER})$`, "gm"));
  const table = unique(s.text, /^Product\nLocal Spends\nInternational Spends1\nSpecific Merchants2\nEuropean Economic Area \(EEA\)3 Spends\n\n([\s\S]+?)(?=^\*For ADIB Booking)/gm);
  const denom = unique(s.text, /^Customers can earn Exceed Reward points each time they spend using their Cards and redeem their points instantly using ADIB Mobile App to make utility payments, for retail or online shopping vouchers, flight purchases and much more\. The below table shows the Exceed Rewards earned for every AED (\d+(?:\.\d+)?) \(or equivalent\) spend\.$/gm);
  if (!value || !table || !denom) return null;
  const products = ["ADIB Exceed Visa Card", "ADIB Exceed Visa Platinum Card", "ADIB Booking.Com* Visa Signature Card", "ADIB Booking.com Visa Infinite Card**", "ADIB Value Card", "ADIB Value+ Card", "ADIB Edge*** Card", "ADIB Diamond***Visa Infinite", "ADIB Spice**** Card"];
  const lines = table[1].trim().split(/\n\n/);
  if (lines.length !== products.length) return null;
  const values: { product: string; numbers: number[]; raw: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split("\n");
    if (cells.length !== 5 || cells[0] !== products[i]) return null;
    const numbers = cells.slice(1).map(parseSourceNumber);
    if (numbers.some(n => n === null)) return null;
    values.push({ product: cells[0], numbers: numbers as number[], raw: lines[i] });
  }
  const selected = values[slug === "adib-exceed-visa" ? 0 : 2];
  const pointValue = parseSourceAED(value[1]), denominator = parseSourceNumber(denom[1]);
  if (pointValue === null || denominator === null || denominator === 0) return null;
  const footnotes = [
    unique(s.text, /^\(1\) International Spends mean purchases made in any foreign currency \(non-AED\) excluding spends in EEA\.$/gm),
    unique(s.text, /^\(2\) Specific Merchants means[^\n]+$/gm),
    unique(s.text, /^\(3\) European Economic Area \(EEA\) means[^\n]+$/gm),
    unique(s.text, /^\(4\)Exceed Rewards can be earned in each statement cycle for transactions up to the approved covered card limit\.$/gm),
    ...(slug === "adib-booking-visa-signature" ? [unique(s.text, /^\*For ADIB Booking\.com Visa Signature Card,[^\n]+$/gm), unique(s.text, /^For Cards issued before 23\/12\/2023 earning for EEA is [^\n]+$/gm)] : []),
  ];
  if (footnotes.some(f => f === null)) return null;
  const rowStart = s.text.indexOf(selected.raw, table.index);
  const rateEvidence = [span(s, rowStart, selected.raw), matchSpan(s, denom), matchSpan(s, value)];
  return { slug, pointValueAED: pointValue, denominatorAED: denominator,
    observations: ["rewards.local", "rewards.international-excluding-eea", "rewards.specific-merchants", "rewards.eea"].map((field, i) => ({ field, value: selected.numbers[i], unit: "Exceed Reward points", denominator, denominatorCurrency: "AED", bound: "exact", evidence: rateEvidence, parserId: "adib/exceed-named-programme-table/v1" })),
    valueBackLocalPercent: selected.numbers[0] * pointValue / denominator * 100,
    conditions: footnotes.map(f => matchSpan(s, f!)),
    valueBackMeaning: "Issuer-stated equivalent value towards Exceed rewards; not cash cashback", canonicalWriteEligible: false };
}

export function proposeAdibReconciledProfile(listing: AdibSource, soc: AdibSource, kfs: AdibSource, detail: AdibSource | undefined, terms: AdibSource, programme: AdibSource, slug: string) {
  const enriched = proposeAdibEnrichedProfile(listing, soc, kfs, detail, slug);
  if (!enriched || enriched.state === "held-discontinued-for-new-customers" || slug === "adib-cashback-visa") return enriched;
  const standing = parseAdibStandingTerms(terms, slug);
  if (!standing) return null;
  const exceed = ["adib-exceed-visa", "adib-booking-visa-signature"].includes(slug) ? parseAdibExceedProgramme(programme, slug) : undefined;
  if (exceed === null) return null;
  if (exceed && exceed.observations.some(o => standing.observations.find(t => t.field === o.field)?.value !== o.value)) return null;
  const constraints = ["All figures apply only to qualifying expenditure; specific merchants, EEA, card-limit, payment-status and other issuer conditions remain applicable.",
    ...("minSalary" in enriched && enriched.minSalary === null ? ["Minimum salary is Pending, not zero or 'no minimum'; SHARE's current detail explicitly contains an unfilled AED [X] placeholder."] : []),
    "FX cost remains untyped in this packet; issuer service fees, VAT and scheme/international components are not silently flattened into one fee.",
    ...(standing.scopeConflicts ?? []), ...(exceed ? [exceed.valueBackMeaning] : [])];
  return { ...enriched, state: enriched.state === "held-conditional-fee" ? enriched.state : "qualified-partial-candidate",
    standingRewardsConfirmed: true, standingTerms: standing, ...(exceed ? { exceedProgramme: exceed } : {}),
    sourceBasis: "Named V31 October 2026 contractual clauses; marketing bounds remain separately labelled",
    mandatoryVisibleLimits: constraints, calculatorEligible: false, canonicalWriteEligible: false,
    limitations: ["Proposal only: independent root/B review required before canonical insertion.",
      "No universal base rate is inferred from category-specific figures; no USD/AED or loyalty-currency valuation is silently invented.",
      "Calculator remains off until the site's full category, cap, denomination and programme-value mapping is independently reviewed.",
      ...constraints] };
}
