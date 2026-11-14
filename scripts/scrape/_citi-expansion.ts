// Offline, named Citi product facts. No fetch, site write, or inferred rates.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

export const CITI_PUBLIC_INDEX = "https://www.citibank.ae/credit-cards/multiplecards";
export const CITI_CARD_KFS = "https://www.citibank.ae/content/dam/cgcpc/ae/prelogin/www-citibank-ae/doc/pdf/kfs-cards.pdf";
export const CITI_EXPANSION_PRODUCTS = {
  "citi-simplicity": "Citi Simplicity",
  "citi-rewards": "Citi Rewards",
  "citi-premier": "Citi Premier",
  "citi-prestige": "Citi Prestige",
  "citi-ultima": "Citi Ultima",
} as const;
type CitiSlug = keyof typeof CITI_EXPANSION_PRODUCTS;
type Source = { id: string; url: string; capturedAt: string; representation: string; sourceBodySha256: string;
  sourceTextSha256?: string; fixtureTextSha256: string; text: string; firstLine?: number; sourceStartByte?: number };
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = /^[0-9a-f]{64}$/;
function matching(text: string, pattern: RegExp) {
  const rows = [...text.matchAll(new RegExp(pattern.source, pattern.flags + (pattern.global ? "" : "g")))];
  return rows.length === 1 ? rows[0] : null;
}
function select(sources: Source[], id: string, url: string) {
  const items = sources.filter(s => s.id === id);
  if (items.length !== 1) return null;
  const s = items[0]!;
  return s.url === url && hex.test(s.sourceBodySha256) && hash(s.text) === s.fixtureTextSha256 ? s : null;
}
function htmlEvidence(source: Source, match: RegExpMatchArray, productScope: string, unit: string, vatTreatment: "inclusive" | "exclusive" | "not-applicable") {
  const firstLine = source.firstLine! + source.text.slice(0, match.index!).split("\n").length - 1;
  const sourceStartByte = source.sourceStartByte! + Buffer.byteLength(source.text.slice(0, match.index!));
  return { parserId: "citi/application-index-and-kfs/v1", productScope, unit, vatTreatment,
    sourceUrl: source.url, capturedAt: source.capturedAt, sourceTextSha256: source.sourceTextSha256!,
    sourceBodySha256: source.sourceBodySha256, sourceRepresentation: "http-decoded-response-body" as const,
    captureMethod: "public-http-reader" as const, firstLine, lastLine: firstLine + match[0].split("\n").length - 1,
    sourceStartByte, sourceEndByte: sourceStartByte + Buffer.byteLength(match[0]), rawText: match[0], rawTextSha256: hash(match[0]) };
}
function validHtml(s: Source) {
  return s.representation === "contiguous issuer HTML excerpt" && s.sourceBodySha256 === s.sourceTextSha256
    && Number.isInteger(s.firstLine) && s.firstLine! > 0
    && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 && Number.isFinite(Date.parse(s.capturedAt));
}
export function parseCitiActiveProduct(sources: Source[], slug: string) {
  if (!Object.hasOwn(CITI_EXPANSION_PRODUCTS, slug)) return null;
  const name = CITI_EXPANSION_PRODUCTS[slug as CitiSlug];
  const product = select(sources, "product-" + slug.slice("citi-".length), CITI_PUBLIC_INDEX);
  const kfs = select(sources, "citi-kfs-fees-salary", CITI_CARD_KFS);
  const vat = select(sources, "citi-vat", CITI_PUBLIC_INDEX);
  if (!product || !kfs || !vat || !validHtml(product) || !validHtml(vat)
      || product.sourceBodySha256 !== vat.sourceBodySha256
      || !kfs.text.startsWith("Card Type | Min Monthly Salary (AED) | Annual Membership Fee (AMF)*\n")) return null;
  if (!new RegExp(`^<h3[^>]*>${name.toUpperCase()}</h3>`).test(product.text)
      || (product.text.match(/<h3\b/g) ?? []).length !== 1) return null;
  const fee = matching(product.text, new RegExp(`<small>Annual fee</small>[ \\t]*(?:</p>\\s*<p>|<br\\s*/>\\s*)<b>AED[ \\u00a0]+(${SOURCE_NUMBER})\\*?</b>`, "i"));
  const income = matching(product.text, new RegExp(`<small>Minimum Monthly Income</small><br\\s*/>\\s*<b>AED[ \\u00a0]+(${SOURCE_NUMBER})</b>`, "i"));
  const rate = matching(vat.text, new RegExp(`^<p>(${SOURCE_NUMBER})% Value Added Tax \\(VAT\\) applicable over and above the annual fee\\.</p>$`));
  const doc = matching(kfs.text, new RegExp(`^${name} \\| (${SOURCE_NUMBER}) \\| (?:AED (${SOURCE_NUMBER})|(-))$`, "m"));
  const apply = matching(product.text, /<a\b[^>]*data-ctaname="Apply Now"[^>]* href="([^"]+)"/i);
  if (!fee || !income || !rate || !doc || !apply) return null;
  const preVat = parseSourceNumber(fee[1]), minSalary = parseSourceNumber(income[1]), taxRate = parseSourceNumber(rate[1]);
  if (preVat === null || minSalary === null || taxRate === null || taxRate <= 0 || taxRate > 10
      || minSalary !== parseSourceNumber(doc[1])
      || (doc[3] === "-" ? slug !== "citi-simplicity" || preVat !== 0 : preVat !== parseSourceNumber(doc[2]))) return null;
  let link: URL;
  try { link = new URL(apply[1].replace(/&amp;/g,"&")); } catch { return null; }
  if (link.origin !== "https://online.citibank.ae" || link.username || link.password
    || link.pathname !== "/roca/services/api/product/apply" || link.searchParams.get("LV") !== "AE"
    || !/^MC\d+$/.test(link.searchParams.get("prd") ?? "")) return null;
  const waiverSource = slug === "citi-rewards" ? select(sources, "citi-rewards-waiver", CITI_PUBLIC_INDEX) : null;
  const waiver = waiverSource ? matching(waiverSource.text, new RegExp(
    `^<p>\\*No annual fee in year 1\\. From year 2 onwards annual fee is waived unless a minimum annual spend of AED (${SOURCE_NUMBER}) is not met, in which case an annual fee of AED (${SOURCE_NUMBER}) applies \\(applicable for Citi Cash Back and Citi Rewards Credit Card\\)\\.</p>$`)) : null;
  const spend = waiver ? parseSourceNumber(waiver[1]) : null;
  if (slug === "citi-rewards" && (!waiverSource || !validHtml(waiverSource) || waiverSource.sourceBodySha256 !== product.sourceBodySha256
    || !waiver || spend === null || parseSourceNumber(waiver[2]) !== preVat)) return null;
  return {
    name, minSalary, applyUrl: link.href, annualFee: Math.round(preVat * (100 + taxRate)) / 100,
    annualFeeWaiver: spend === null ? undefined : {
      year_one_waived: true, ongoing_threshold_aed: spend, threshold_period: "annual" as const,
    },
    evidence: {
      annualFee: [htmlEvidence(product, fee, name, "AED before VAT", "exclusive"),
        htmlEvidence(vat, rate, name, "percent VAT on published fee", "not-applicable")],
      "eligibility.publishedMinMonthlyIncome": [htmlEvidence(product, income, name, "AED monthly", "not-applicable")],
      ...(waiver && waiverSource ? { annualFeeWaiver: [htmlEvidence(waiverSource, waiver, name, "AED annual card spend", "not-applicable")] } : {}),
    },
  };
}
