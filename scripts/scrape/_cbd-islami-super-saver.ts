import { createHash } from "node:crypto";

export const CBD_ISLAMI_SUPER_SAVER = {
  slug: "cbd-al-islami-super-saver",
  name: "CBD Al Islami Super Saver Visa Signature Credit Card",
  productUrl: "https://www.cbd.ae/islami/personal/cards/credit-cards/super-saver",
  kfsUrl: "https://www.cbd.ae/docs/revcbdislamilibraries/default-document-library/kfs-sa_islamic_credit-card_en-ar311032ff458f66deb8c5ff0b00b6b24a.pdf",
  tariffUrl: "https://www.cbd.ae/islami/general/fees-and-charges",
  kfsBodySha256: "c312b03aed4817d9168f8170d270b457bd356c32e1ef7c5acf5120534e65b6d3",
  kfsTextSha256: "c64f1989c97fab101cc9bfab6884804d8baa00ae7bff155af8da92bf74bedccf",
  kfsBodyBytes: 378574,
  kfsTextBytes: 57458,
} as const;

const card = CBD_ISLAMI_SUPER_SAVER;
const layout = "pdftotext-layout";
const reader = "public-readable-issuer-page-excerpt";
const scope = {
  "cbd-islami-product": { url: card.productUrl, firstLine: 1092, representation: reader,
    sha256: "a18ad28d4a169c29cc065173d3907dc5c15b263d87b03974ae95eb67aa64dc29" },
  "cbd-islami-kfs-primary-fee": { url: card.kfsUrl, firstLine: 45, lastLine: 57, page: 1, representation: layout,
    sha256: "e4a3f53c0016a327f9caa345ef8ed4bbb62959a43786e7518265f4b4696cf6d8" },
  "cbd-islami-kfs-version": { url: card.kfsUrl, firstLine: 81, lastLine: 81, page: 1, representation: layout,
    sha256: "5d48b9ccdedaffebe20688e4fc54bf3d93e4565fd0a8476b8fbbe9059efbc9b5" },
  "cbd-islami-kfs-vat": { url: card.kfsUrl, firstLine: 41, lastLine: 43, page: 2, representation: layout,
    sha256: "8c071916c757607675d1691c7d7c38b5ee2a1bf84edec026a551ba8a10d516ff" },
  "cbd-islami-tariff-cohorts": { url: card.tariffUrl, firstLine: 1102, representation: reader,
    sha256: "b09fa666973e197bde9a366452be38997626f5ca0fb2e85130e54fedf7426a24" },
} as const;

type SourceId = keyof typeof scope;
type Source = {
  id: string; url: string; firstLine: number; lastLine?: number; capturedAt: string;
  text: string; fixtureTextSha256: string; representation: string; fixtureIsCompleteSource: boolean;
  page?: number; pageCount?: number; sourceBodySha256?: string; sourceTextSha256?: string;
  sourceBodyBytes?: number; sourceTextBytes?: number; observedKfsLink?: string;
};
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const normal = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ");
const columns = (value: string) => value.trim().split(/ {3,}/).map(normal);

function scoped(sources: readonly Source[], id: SourceId): Source | null {
  const matches = sources.filter(s => s.id === id);
  const s = matches[0];
  const pin = scope[id];
  if (matches.length !== 1 || !s || s.url !== pin.url || s.representation !== pin.representation
      || s.firstLine !== pin.firstLine || s.fixtureIsCompleteSource !== false || s.fixtureTextSha256 !== pin.sha256
      || typeof s.text !== "string" || sha(s.text) !== pin.sha256
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))) return null;
  if (pin.representation === reader) return s.sourceBodySha256 === undefined && s.sourceTextSha256 === undefined ? s : null;
  return s.page === pin.page && s.lastLine === pin.lastLine && s.pageCount === 6
    && s.sourceBodySha256 === card.kfsBodySha256 && s.sourceTextSha256 === card.kfsTextSha256
    && s.sourceBodyBytes === card.kfsBodyBytes && s.sourceTextBytes === card.kfsTextBytes
    && s.text.split("\n").length === pin.lastLine - pin.firstLine + 1 ? s : null;
}

/** For an independently retrieved original PDF and its Poppler -layout bytes.
 * Refuse a replacement edition, partial capture or different extraction. */
export function matchCbdIslamiSuperSaverKfs(pdf: Uint8Array, text: string, sources: readonly Source[]): boolean {
  if (pdf.byteLength !== card.kfsBodyBytes || Buffer.from(pdf.subarray(0, 5)).toString() !== "%PDF-"
      || Buffer.byteLength(text) !== card.kfsTextBytes || sha(pdf) !== card.kfsBodySha256 || sha(text) !== card.kfsTextSha256) return false;
  const pages = text.split("\f");
  return pages.filter(p => p.trim()).length === 6
    && (["cbd-islami-kfs-primary-fee", "cbd-islami-kfs-version", "cbd-islami-kfs-vat"] as const).every(id => {
      const s = scoped(sources, id);
      const pin = scope[id];
      return !!s && pages[pin.page - 1]?.split("\n").slice(pin.firstLine - 1, pin.lastLine).join("\n") === s.text;
    });
}

/** Replay only the exact prospective KFS's named primary fee and first-year
 * annual-fee waiver. An older cohort's tariff is not the price source. */
export function parseCbdIslamiSuperSaver(sources: readonly Source[], slug: string) {
  if (slug !== card.slug || sources.length !== Object.keys(scope).length) return null;
  const product = scoped(sources, "cbd-islami-product");
  const pricing = scoped(sources, "cbd-islami-kfs-primary-fee");
  const version = scoped(sources, "cbd-islami-kfs-version");
  const vat = scoped(sources, "cbd-islami-kfs-vat");
  const tariff = scoped(sources, "cbd-islami-tariff-cohorts");
  if (!product || !pricing || !version || !vat || !tariff || product.observedKfsLink !== card.kfsUrl
      || version.capturedAt !== pricing.capturedAt || vat.capturedAt !== pricing.capturedAt
      || ![product, tariff].every(s => s.capturedAt.slice(0, 10) === pricing.capturedAt.slice(0, 10))
      || version.text !== "Version: 1 November 2026"
      || product.text !== "CBD Super Saver is a Visa Signature Credit Card"
      || !/^Visa Signature - Islamic Super Saver .+\(for existing Al Islami cardholders\).+\(for cardholders applied before /u.test(tariff.text)) return null;
  const lines = pricing.text.split("\n");
  if (normal(lines[1]) !== "Fees – Islamic Credt Cards"
      || columns(lines[2]).join("|") !== "FEES|Primary CARD|Supplementary CARD|Islamic CARD Variants"
      || normal(lines.slice(10, 13).join(" ")) !== "DISCLAIMER: * Offered FREE for FIRST YEAR only, applicable fee will apply from the beginning of second year and thereon for each year (i.e. upon completion of each anniversary). Waiver of Annual Fee in each year is subject to achieving the minimum annual spends assigned for each CARD Variant and as published on Bank’s website."
      || !/^1\. All Fees mentioned above & on Bank’s website are inclusive of Value Added Tax \(VAT\)\./.test(normal(vat.text))) return null;
  const named = lines.map(columns).filter(c => c.length === 3 && c[2] === "Super Saver Visa Signature");
  if (named.length !== 1 || named[0][1] !== "Free For Life") return null;
  const amountString = named[0][0].match(/^AED (\d+(?:,\d{3})*\.\d{2})\*$/)?.[1];
  const amount = amountString ? Number(amountString.replaceAll(",", "")) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const pin = (s: Source, unit: string, vatTreatment: "not-applicable" | "inclusive") => ({
    parserId: "cbd/islami-super-saver-kfs-cohort/v1", productScope: card.name, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: card.kfsBodySha256, sourceTextSha256: card.kfsTextSha256,
    sourceRepresentation: layout, captureMethod: "public-http-reader", sourceExtraction: layout,
    sourceScope: "PDF page " + s.page + " (page-local pdftotext -layout line numbers)",
    firstLine: s.firstLine, lastLine: s.lastLine!, rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  const scopePin = pin(pricing, "Named Islamic Super Saver Visa Signature KFS row and its first-year footnote; primary fee only", "inclusive");
  return {
    name: card.name, network: "Visa" as const, annualFee: amount, vatPolicy: "inclusive" as const,
    annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual",
      notes: "Primary annual fee as stated in the current Key Facts Statement; confirm what applies to your card." } as const,
    capturedDate: pricing.capturedAt.slice(0, 10), sourceFixtureIds: Object.keys(scope),
    sources: [card.productUrl, card.kfsUrl, card.tariffUrl], evidence: {
      name: [pin(pricing, "Named Islamic Card Variants table; Super Saver Visa Signature", "not-applicable")],
      network: [pin(pricing, "The named Islamic card variant is Visa Signature", "not-applicable")],
      annualFee: [pin(version, "Current linked Islamic KFS version", "not-applicable"), scopePin,
        pin(vat, "Issuer's VAT basis for fees in the KFS", "inclusive")],
      annualFeeWaiver: [pin(pricing, "Primary annual-fee waiver in year one only; no separate joining fee or numeric ongoing threshold confirmed", "not-applicable")],
    },
  };
}
