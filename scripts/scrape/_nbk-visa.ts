import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

export const NBK_KFS = "https://www.nbk.com/dam/jcr%3A33c61d37-55de-411a-a69a-33bc95a257ae/KFS_Credit%20Card%20%28RJ%29%20Form.pdf";
const BASE = "https://www.nbk.com/uae/personal/cards/credit-cards/";
export const NBK_VARIANTS = { "nbk-visa-classic": "Classic", "nbk-visa-gold": "Gold", "nbk-visa-platinum": "Platinum" } as const;
type Source = {
  id: string; url: string; capturedAt: string; text: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string;
};
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
const sha = /^[a-f0-9]{64}$/;
const same = (a: Source, b: Source) => a.sourceBodySha256 === b.sourceBodySha256
  && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
const separators = "[ \\t\\u202a\\u202b\\u202c]";
function isKfsLink(text: string) {
  if (!/^href="https:\/\/www\.nbk\.com\/dam\/[^"\s]+"$/.test(text)) return false;
  try { return decodeURIComponent(text.slice(6, -1)) === decodeURIComponent(NBK_KFS); }
  catch { return false; }
}

export function parseNbkVisa(input: Source[], slug: string) {
  if (!Object.hasOwn(NBK_VARIANTS, slug)) return null;
  const tier = NBK_VARIANTS[slug as keyof typeof NBK_VARIANTS];
  const display = "Visa " + tier + " Credit Card";
  const name = "NBK UAE " + display;
  const productUrl = BASE + "visa-" + tier.toLowerCase() + "-credit-card.html";
  const used: Source[] = [];
  function exact(key: string, pdf = false) {
    const id = pdf ? (key === "vat" ? "nbk-kfs-vat" : slug + "-" + key) : slug + "-" + key;
    const matches = input.filter(s => s.id === id);
    const s = matches[0];
    if (matches.length !== 1 || s.url !== (pdf ? NBK_KFS : productUrl)
      || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256) || digest(s.text) !== s.fixtureTextSha256
      || !Number.isFinite(Date.parse(s.capturedAt)) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
    if (pdf ? s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== "PDF page 2" || s.sourceStartByte !== undefined
      : s.sourceRepresentation !== "http-decoded-response-body" || s.sourceTextSha256 !== s.sourceBodySha256
      || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    used.push(s);
    return s;
  }
  const heading = exact("heading"), apply = exact("application"), link = exact("kfs-link"),
    waiver = exact("waiver"), account = exact("account"), productFee = exact("product-fee"),
    renewal = exact("renewal", true), vat = exact("vat", true);
  if (!heading || !apply || !link || !waiver || !account || !productFee || !renewal || !vat) return null;
  if (![apply, link, waiver, account, productFee].every(s => same(heading, s)) || !same(renewal, vat)
    || heading.text !== "<h1>" + display + "</h1>"
    || heading.sourceStartByte! >= waiver.sourceStartByte! || waiver.sourceStartByte! >= productFee.sourceStartByte!
    || productFee.sourceStartByte! >= apply.sourceStartByte! || vat.firstLine >= renewal.firstLine
    || apply.text.split(/\r?\n[ \t]+/).join(" ") !== '<input type="hidden" name="productName" value="' + display + '"> <input type="hidden" name="countryName" value="uae">'
    || !isKfsLink(link.text)
    || waiver.text !== "<strong>Free card for the first year</strong>"
    || account.text !== "To request the card, simply open an account with the National Bank of Kuwait."
    || vat.text !== "Other fees & charges (Excluding VAT") return null;
  const amountOnProduct = new RegExp("^<li>Card annual fee is AED (" + SOURCE_NUMBER + ")</li>$").exec(productFee.text);
  const amountOnKfs = new RegExp("^" + separators + "*" + tier + " [Cc]ard" + separators + "+AED (" + SOURCE_NUMBER
    + ")" + separators + "+Annual renewal fee for " + tier + "$").exec(renewal.text);
  const amount = amountOnKfs ? parseSourceNumber(amountOnKfs[1]) : null;
  if (amount === null || amount <= 0 || !amountOnProduct || parseSourceNumber(amountOnProduct[1]) !== amount) return null;

  function pin(s: Source, unit: string, vatTreatment: "exclusive" | "not-applicable") {
    return {
      parserId: "nbk-uae/visa-tiers/v1", productScope: name, unit, vatTreatment, sourceUrl: s.url,
      capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
      sourceRepresentation: s.sourceRepresentation, ...(s.sourceStartByte === undefined
        ? { sourceExtraction: "pdftotext-layout", sourceScope: s.sourceScope }
        : { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
      captureMethod: "public-http-reader", firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
      rawText: s.text, rawTextSha256: s.fixtureTextSha256,
    };
  }
  return {
    name, network: "Visa" as const, productUrl, kfsUrl: NBK_KFS, ids: used.map(s => s.id),
    captureDate: heading.capturedAt.slice(0, 10), annualFee: amount, vatPolicy: "exclusive" as const,
    annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual" as const },
    evidence: {
      annualFee: [pin(productFee, "AED issuer product amount only; tax basis separately sourced", "not-applicable"), pin(renewal, "AED standard annual renewal fee", "exclusive")],
      vatPolicy: [pin(vat, "Renewal table tax basis", "exclusive")],
      annualFeeWaiver: [pin(waiver, "First-year annual card fee only", "not-applicable")],
      network: [pin(heading, "Network and exact UAE product", "not-applicable")],
      applicationAvailability: [pin(apply, "Named UAE product enquiry fields; no submission", "not-applicable")],
      eligibility: [pin(account, "NBK account needed to request card; other eligibility not determined", "not-applicable")],
    },
  };
}
