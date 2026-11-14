// Offline, exact-scope DIB fee receipts. No general rewards/eligibility claims.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const ORIGIN = "https://www.dib.ae";
export const DIB_NEW_CARD_KFS = ORIGIN + "/docs/default-source/cpr/kfs/cards-kfs-dib-new-credit-cards-cm-sign-reqd-static.pdf?sfvrsn=799c3157_45";
export const DIB_CONSUMER_FEE_NOTICE = ORIGIN + "/consumer-cashback-card-update";
export const DIB_EXPANSION_PRODUCTS = {
  "dib-consumer-cashback-platinum": { id: "consumer", name: "Consumer Cashback Platinum Card", route: "consumer-platinum-card", column: 78 },
  "dib-shams-platinum": { id: "shams", name: "DIB SHAMS Platinum Covered Card", route: "shams-dib-platinum-covered-card", column: 233 },
} as const;

type Product = (typeof DIB_EXPANSION_PRODUCTS)[keyof typeof DIB_EXPANSION_PRODUCTS];
type RawSource = { id: string; url: string; capturedAt: string; representation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string; text: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string; sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout" };
type VatTreatment = "inclusive" | "exclusive" | "not-applicable";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const stripBidi = (s: string) => s.replace(/[\u202a-\u202e\u2066-\u2069]/g, "");
const feeToken = new RegExp("^\\*?(" + SOURCE_NUMBER + ")$");
function num(s?: string) { return s ? parseSourceNumber(s) : null; }
function only(text: string, pattern: RegExp) {
  const rows = [...text.matchAll(new RegExp(pattern.source, pattern.flags + (pattern.global ? "" : "g")))];
  return rows.length === 1 ? rows[0] : null;
}

function select(sources: RawSource[], id: string, url: string, rep: RawSource["sourceRepresentation"]) {
  const matches = sources.filter(s => s.id === id);
  if (matches.length !== 1) return null;
  const s = matches[0]!;
  if (s.url !== url || s.sourceRepresentation !== rep || !hex.test(s.sourceBodySha256)
      || !hex.test(s.sourceTextSha256) || hash(s.text) !== s.fixtureTextSha256
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1 || !Number.isFinite(Date.parse(s.capturedAt))) return null;
  if (rep === "pdftotext-layout") return s.representation === "contiguous issuer PDF layout excerpt"
    && s.sourceStartByte === undefined && s.sourceScope ? s : null;
  return s.representation === "contiguous issuer HTML excerpt" && s.sourceBodySha256 === s.sourceTextSha256
    && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}

function pin(s: RawSource, product: Product, unit: string, vatTreatment: VatTreatment) {
  return {
    parserId: "dib/named-product-and-covered-card-kfs/v1",
    productScope: product.name, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256,
    sourceBodySha256: s.sourceBodySha256, sourceRepresentation: s.sourceRepresentation,
    ...(s.sourceRepresentation === "pdftotext-layout" ? { sourceExtraction: "pdftotext-layout" as const, sourceScope: s.sourceScope } : {}),
    captureMethod: "public-http-reader" as const, firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    ...(s.sourceStartByte === undefined ? {} : { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    rawText: s.text, rawTextSha256: hash(s.text),
  };
}

function sameBody(a: RawSource, b: RawSource) {
  return a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256
    && a.capturedAt === b.capturedAt;
}
function at(line: string, column: number) { return [...line.matchAll(/\S+/g)].find(m => m.index === column)?.[0]; }
function readKfs(fee: RawSource, footnote: RawSource, vat: RawSource, product: Product) {
  if (!sameBody(fee, footnote) || !sameBody(fee, vat)) return null;
  const table = stripBidi(fee.text).split("\n");
  if (table.length !== 20 || at(table[1], 78) !== "Consumer" || at(table[3], 78) !== "Cashback"
    || at(table[5], 78) !== "Platinum" || at(table[1], 97) !== "Consumer"
    || at(table[3], 97) !== "Cashback" || at(table[5], 98) !== "Reward"
    || at(table[2], 206) !== "SHAMS" || at(table[0], 222) !== "SHAMS" || at(table[0], 234) !== "SHAMS"
    || at(table[5], 206) !== "Infinite" || at(table[5], 221) !== "Signature" || at(table[5], 233) !== "Platinum"
    || !/^Annual Fee\b/.test(table[15]) || !/^Renewal Fee\b/.test(table[19])) return null;
  const base = num(at(table[14], product.column)?.match(feeToken)?.[1]);
  const renewToken = at(table[18], product.column);
  const renew = num(renewToken?.match(feeToken)?.[1]);
  const n = "(" + SOURCE_NUMBER + ")";
  const vatMatch = only(stripBidi(vat.text),
    new RegExp("^• All charges are inclusive of " + n + "% VAT which may be amended from time\\s*$"));
  const rate = num(vatMatch?.[1]);
  if (base === null || renew === null || base <= 0 || base !== renew || rate === null || rate <= 0 || rate > 10) return null;
  const note = stripBidi(footnote.text).split("\n").map(line => line.split(/ {4,}/)[0]).join("\n");
  const foot = only(note, new RegExp("^\\* If the spend criteria is not met than an annual membership fee of AED\\n"
    + n + ", AED " + n + " and AED " + n + " will be levied respectively on\\nInfinite, Signature and Platinum cards, from the 2nd year onwards\\.$"));
  const renewalCohort = [206, 221, 233].map((col) => {
    const token = at(table[18], col);
    return token?.startsWith("*") ? num(token.match(feeToken)?.[1]) : null;
  });
  if (!foot || renewalCohort.some((amount, i) => amount === null || amount !== num(foot[i + 1]))
    || renewToken?.startsWith("*") !== (product.id === "shams")) return null;
  return { base, rate };
}

export function parseDibExpansion(sources: RawSource[], slug: string) {
  if (!Object.hasOwn(DIB_EXPANSION_PRODUCTS, slug)) return null;
  const product = DIB_EXPANSION_PRODUCTS[slug as keyof typeof DIB_EXPANSION_PRODUCTS];
  const productUrl = ORIGIN + "/personal/cards/" + product.route;
  const html = (id: string, url = productUrl) => select(sources, id, url, "http-decoded-response-body");
  const pdf = (id: string) => select(sources, id, DIB_NEW_CARD_KFS, "pdftotext-layout");
  const title = html(product.id + "-head");
  const apply = html(product.id + "-apply");
  const fees = pdf("dib-kfs-fee-columns");
  const foot = pdf("dib-kfs-shams-footnote");
  const vat = pdf("dib-kfs-vat");
  if (!title || !apply || !fees || !foot || !vat || !sameBody(title, apply)
    || title.sourceStartByte! >= apply.sourceStartByte! || apply.sourceStartByte! - title.sourceStartByte! > 1800
    || !/^<h1 class="col-side-heading-1" itemprop="name">\s*<text>[^<]+<\/text>\s*<\/h1>$/.test(title.text)
    || !title.text.includes("<text>" + product.name + "</text>")) return null;
  const link = only(apply.text, /^<a href="([^"]+)"[^>]+>\s*Apply Now\s*<\/a>$/);
  if (!link) return null;
  let target: URL;
  try { target = new URL(link[1].replaceAll("&amp;", "&"), ORIGIN); } catch { return null; }
  const params = [...target.searchParams.keys()];
  if (target.origin !== ORIGIN || target.pathname !== "/global/apply-now"
    || target.username || target.password || target.hash || params.length !== 3
    || target.searchParams.get("type") !== "card" || target.searchParams.get("view") !== "Default"
    || target.searchParams.get("product") !== product.route) return null;
  const kfs = readKfs(fees, foot, vat, product);
  if (!kfs) return null;
  const baseEvidence = [pin(fees, product, "AED annual membership fee", "inclusive"), pin(vat, product, "percent VAT included", "not-applicable")];
  const n = "(" + SOURCE_NUMBER + ")";
  if (product.id === "consumer") {
    const net = html("consumer-net-fee");
    const limited = html("consumer-limited-first-year");
    const termsTitle = html("consumer-notice-header", DIB_CONSUMER_FEE_NOTICE);
    const terms = html("consumer-notice-fee", DIB_CONSUMER_FEE_NOTICE);
    if (!net || !limited || !termsTitle || !terms || !sameBody(title, net) || !sameBody(title, limited)
      || !sameBody(termsTitle, terms)
      || terms.sourceStartByte! - termsTitle.sourceStartByte! < 1 || terms.sourceStartByte! - termsTitle.sourceStartByte! > 400
      || !/^<strong>Annual Fee Effective 10 May 2025\*<\/strong>$/.test(termsTitle.text)
      || !/^<h3>Limited Time Offer<\/h3>\s*<div[^>]+>\s*<p>\s*<p>First Year Free\s+DIB Consumer Cashback Platinum Covered Card\.<\/p>$/.test(limited.text)) return null;
    const netFee = only(net.text, new RegExp("^<li>Effective 10 May 2025, Annual fee AED " + n
      + " \\(excluding VAT\\) will be applied on the Consumer Cashback Platinum Card</li>$"));
    const termsFee = only(terms.text, new RegExp("^<tr><td>Consumer Cashback Platinum Card</td><td>AED " + SOURCE_NUMBER
      + "\\s*</td><td>AED " + n + "\\s*</td></tr></tbody></table><p>\\*Fee amounts are inclusive of VAT</p>$"));
    const preTax = num(netFee?.[1]);
    const gross = num(termsFee?.[1]);
    if (preTax === null || gross === null || gross !== kfs.base || Math.round(preTax * (100 + kfs.rate)) / 100 !== gross) return null;
    return { name: product.name, productUrl, namedPublishedApplyLink: target.href, annualFee: kfs.base,
      vatPolicy: "inclusive" as const, annualFeeWaiver: undefined, firstYearWaiverStatus: "limited offer, applicability unconfirmed" as const,
      evidence: { annualFee: [...baseEvidence, pin(net, product, "AED annual fee before VAT", "exclusive"),
        pin(termsTitle, product, "date and scope of issuer fee notice", "not-applicable"),
        pin(terms, product, "AED annual membership fee", "inclusive")] } };
  }
  const waiver = html("shams-waiver");
  if (!waiver || !sameBody(title, waiver)) return null;
  const waiverMatch = only(waiver.text, new RegExp("^<p>\\*No annual fee for the first year and fee waived for subsequent years on a minimum annual spend of AED "
    + n + "</p>$"));
  const threshold = num(waiverMatch?.[1]);
  if (threshold === null || threshold <= 0) return null;
  return { name: product.name, productUrl, namedPublishedApplyLink: target.href, annualFee: kfs.base,
    vatPolicy: "inclusive" as const,
    annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: threshold,
      threshold_period: "annual" as const, notes: "Check which purchases DIB counts towards the waiver." },
    firstYearWaiverStatus: "published for named product" as const,
    evidence: { annualFee: [...baseEvidence, pin(foot, product, "AED conditional renewal fee from year two", "inclusive")],
      annualFeeWaiver: [pin(waiver, product, "AED annual spend threshold for renewal waiver", "not-applicable"),
        pin(foot, product, "renewal-fee tier scope and year-two timing", "not-applicable")] } };
}
