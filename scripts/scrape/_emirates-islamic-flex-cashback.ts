import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const bank = "https://www.emiratesislamic.ae";
const cards = bank + "/en/cards/credit-cards/";
export const EI_FLEX_CASHBACK_KFS = bank + "/en/key-information/kfs-credit-cards";
export const EI_FLEX_CASHBACK_TARIFF = bank + "/en/soc/cards";
export const EI_FLEX_CASHBACK_NETWORK = bank + "/en/help-and-support/golf-privileges";

export const EI_FLEX_CASHBACK_CARDS = {
  "emirates-islamic-flex-elite": {
    key: "flex-elite", route: "flex-elite-card", label: "Flex Elite", heading: "Flex Elite Credit Card",
    acquisition: "/en/apply-now?product=flex%20elite%20credit%20card", scheme: "Visa Infinite Credit Card",
    exactProductNetwork: "Emirates Islamic Flex Elite (Infinite) Visa Credit Card",
  },
  "emirates-islamic-cashback-plus": {
    key: "cashback-plus", route: "cashback-plus-card", label: "Cashback Plus", heading: "Cashback Plus Card",
    acquisition: "/en/apply-now?product=cashback plus card", scheme: "Visa Signature Credit Card",
    exactProductNetwork: null,
  },
} as const;
type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte: number;
  sourceRepresentation: "http-decoded-response-body";
};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const timestamp = (s: string) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) && Number.isFinite(Date.parse(s));
const clean = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&ccedil;|&#231;/g, "ç")
  .replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
const same = (head: Source, ...parts: Source[]) => parts.every(s => s.url === head.url
  && s.sourceBodySha256 === head.sourceBodySha256 && s.capturedAt === head.capturedAt);
function before(a: Source, b: Source, max: number) {
  const delta = b.sourceStartByte - a.sourceStartByte;
  return delta >= Buffer.byteLength(a.text) && delta <= max && a.firstLine <= b.firstLine;
}
/** Parse complete, bounded non-nested table rows whose identities are independently captured from the DOM. */
function tableRow(text: string) {
  const blocks = /^<tr>\s*((?:<t[dh](?:\s[^>]*)?>[\s\S]*?<\/t[dh]>\s*)+)<\/tr>$/i.exec(text);
  if (!blocks) return null;
  const nodes = Array.from(blocks[1].matchAll(/<(t[dh])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi));
  if (!nodes.length || nodes.length > 20 || nodes.some(m => /<\/?t[dh]\b/i.test(m[2]))) return null;
  return nodes.map(m => clean(m[2]));
}
function pin(s: Source, name: string, unit: string, vatTreatment: "inclusive" | "not-applicable" = "not-applicable") {
  return {
    parserId: "emirates-islamic/flex-cashback-standard/v1", productScope: name, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: "http-decoded-html-excerpt" as const,
    sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1, rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
const kfsAmount = new RegExp("^(" + SOURCE_NUMBER + ")$"), tariffAmount = new RegExp("^AED (" + SOURCE_NUMBER + ")$");

/** Return only the exact standard annual membership fee and verified scheme. No offers or benefit claims. */
export function parseEiFlexCashback(input: readonly Source[], slug: string) {
  if (!Object.hasOwn(EI_FLEX_CASHBACK_CARDS, slug)) return null;
  const spec = EI_FLEX_CASHBACK_CARDS[slug as keyof typeof EI_FLEX_CASHBACK_CARDS];
  const productUrl = cards + spec.route, name = "Emirates Islamic " + spec.label + " Credit Card";
  const ids: string[] = [];
  function get(role: string, url: string) {
    const matched = input.filter(s => s.id === "ei-flex-cashback-" + role), s = matched[0];
    if (matched.length !== 1 || !s || s.url !== url || typeof s.text !== "string" || !s.text || s.text.length > 2500
      || s.fixtureTextSha256 !== sha(s.text) || !hex.test(s.sourceBodySha256) || s.sourceTextSha256 !== s.sourceBodySha256
      || s.sourceRepresentation !== "http-decoded-response-body" || !timestamp(s.capturedAt)
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1
      || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte < 0) return null;
    ids.push(s.id);
    return s;
  }
  const kfs = EI_FLEX_CASHBACK_KFS, tariff = EI_FLEX_CASHBACK_TARIFF, network = EI_FLEX_CASHBACK_NETWORK;
  const heading = get(spec.key + "-heading", productUrl), acquisition = get(spec.key + "-acquisition", productUrl);
  const namedProductScheme = spec.exactProductNetwork ? get(spec.key + "-issuer-network", productUrl) : null;
  const kVat = get("kfs-vat", kfs), kColumns = get("kfs-columns", kfs), kFee = get("kfs-fees", kfs);
  const tVat = get("soc-vat", tariff), tProfit = get("soc-profit", tariff), tColumns = get("soc-columns", tariff);
  const tFee = get(spec.key + "-tariff-row", tariff), tBoundary = get("soc-fee-based", tariff);
  const nColumns = get("golf-columns", network), nCard = get(spec.key + "-golf-row", network);
  if (!heading || !acquisition || !kVat || !kColumns || !kFee || !tVat || !tProfit || !tColumns || !tFee || !tBoundary || !nColumns || !nCard) return null;
  if (!same(heading, acquisition) || (spec.exactProductNetwork && (!namedProductScheme
    || !same(heading, namedProductScheme) || !before(acquisition, namedProductScheme, 15000) || namedProductScheme.text !== spec.exactProductNetwork))
    || !same(kVat, kColumns, kFee) || !same(tVat, tProfit, tColumns, tFee, tBoundary) || !same(nColumns, nCard)
    || !before(heading, acquisition, 105000) || !before(kVat, kColumns, 1000) || !before(kColumns, kFee, 4000)
    || !before(tVat, tProfit, 1200) || !before(tProfit, tColumns, 600) || !before(tColumns, tFee, 3000)
    || !before(tFee, tBoundary, 3000) || !before(nColumns, nCard, 1500)
    || !/^<h[12]\s[^>]*\bclass="title [^"]+"[^>]*>[\s\S]*<\/h[12]>$/.test(heading.text) || clean(heading.text) !== spec.heading
    || acquisition.text !== 'href="' + spec.acquisition + '"'
    || clean(kVat.text) !== "All charges are inclusive of Value Added Tax (VAT) in AED currency."
    || clean(tVat.text) !== "All charges, commissions and fees are inclusive of Value Added Tax or any other similar sales tax (VAT)."
    || clean(tProfit.text) !== "Profit based Cards" || clean(tBoundary.text) !== "Fee based Cards") return null;
  const names = tableRow(kColumns.text), fees = tableRow(kFee.text), rates = tableRow(tColumns.text), named = tableRow(tFee.text);
  const networkColumns = tableRow(nColumns.text), networkRow = tableRow(nCard.text);
  if (!names || !fees || names.length !== fees.length || names[0] !== "Product Name" || fees[0] !== "Annual Fee"
    || names.filter(x => x === spec.label).length !== 1
    || rates?.join("|") !== "Credit Card Type|Monthly Profit Rate|Annual Membership Fee"
    || named?.length !== 3 || named[0] !== spec.label
    || networkColumns?.join("|") !== "Card Type|Number of free golf rounds per month|Minimum Retail Spend* (per calendar month)|Cards"
    || networkRow?.length !== 4 || networkRow[0] !== spec.scheme
    || networkRow[3].split(",").map(x => x.trim()).filter(x => x === spec.label).length !== 1) return null;
  const kToken = kfsAmount.exec(fees[names.indexOf(spec.label)])?.[1], tToken = tariffAmount.exec(named[2])?.[1];
  const gross = kToken === undefined ? null : parseSourceNumber(kToken);
  const listed = tToken === undefined ? null : parseSourceNumber(tToken);
  if (gross === null || gross <= 0 || gross !== listed) return null;
  return {
    name, productUrl, network: "Visa" as const, annualFee: gross, vatPolicy: "inclusive" as const,
    kfsUrl: kfs, sources: [productUrl, kfs, tariff, network],
    capturedDate: heading.capturedAt.slice(0, 10), sourceFixtureIds: ids,
    evidence: {
      network: [pin(nColumns, name, "Issuer scheme and named card columns"),
        pin(nCard, name, "Exact named card in the issuer's " + spec.scheme + " row; no golf or other benefit asserted"),
        ...(namedProductScheme ? [pin(namedProductScheme, name, "Same product explicitly names Visa Infinite; no benefit asserted")] : [])],
      annualFee: [pin(tFee, name, "VAT-inclusive standard annual membership for the exact profit-based card", "inclusive"),
        pin(tColumns, name, "Annual membership versus profit rate columns"), pin(tProfit, name, "Profit-based schedule only"),
        pin(tBoundary, name, "Following fee-based plans excluded"), pin(tVat, name, "Tariff VAT basis", "inclusive"),
        pin(kColumns, name, "Named KFS columns"), pin(kFee, name, "KFS standard annual fee in AED for the named column", "inclusive"),
        pin(kVat, name, "KFS VAT basis", "inclusive")],
    },
  };
}
