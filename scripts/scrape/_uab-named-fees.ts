import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const ORIGIN = "https://www.uab.ae";
const FORMS = `${ORIGIN}/help-center/forms-and-policies`;
const PDF = `${ORIGIN}/help-center/-/media/`;
const PRICING = `${ORIGIN}/-/media/pdf/forms/`;
const DOC = {
  conventional: {
    form: `${PDF}8FD36D29728140C38587A5117296E66C.ashx`,
    kfs: `${PDF}6BBE37E44A2F443593B56CC85E593FDC.ashx`,
    tariff: `${PRICING}retail-personal-banking-soc_en.pdf`,
  },
  islamic: {
    form: `${PDF}A33288E4D55743DDBE1472F11E4447DA.ashx`,
    kfs: `${PDF}9dde5a44893247d3a9d971c5e8d9b293.ashx`,
    tariff: `${PRICING}islamic-personal-banking-soc_en.pdf`,
  },
} as const;
const CONVENTIONAL = `${ORIGIN}/en/personal/cards/credit-cards/`;
export const UAB_NAMED_CARDS = {
  "united-arab-bank-mastercard-titanium": {
    set: "conventional", tier: "Titanium", key: "titanium", product: `${CONVENTIONAL}titanium-card`,
    heading: "UAB Titanium Mastercard", name: "United Arab Bank Titanium Mastercard Credit Card",
  },
  "united-arab-bank-mastercard-platinum": {
    set: "conventional", tier: "Platinum", key: "platinum", product: `${CONVENTIONAL}platinum-card`,
    heading: "UAB Platinum Mastercard Credit Card", name: "United Arab Bank Platinum Mastercard Credit Card",
  },
  "united-arab-bank-mastercard-world": {
    set: "conventional", tier: "World", key: "world", product: `${CONVENTIONAL}world-card`,
    heading: "UAB World Mastercard Credit Card", name: "United Arab Bank World Mastercard Credit Card",
  },
  "united-arab-bank-islamic-mastercard-titanium": {
    set: "islamic", tier: "Titanium", key: "islamic-titanium",
    product: `${ORIGIN}/en/islamic/personal-banking/islamic-credit-card/islamic-titanium-card`,
    heading: "UAB Islamic Titanium Mastercard Credit Card", name: "United Arab Bank Islamic Titanium Mastercard Credit Card",
  },
} as const;

export type UabFeeSource = {
  id: string; url: string; capturedAt: string; text: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
  firstLine: number; lastLine: number; sourceScope?: string; sourceStartByte?: number;
};

const SHA = /^[a-f0-9]{64}$/;
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
const escapeRE = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const plain = (text: string) => text.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
  .split("\n").map(line => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
const exactSame = (a: UabFeeSource, b: UabFeeSource) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceTextSha256 === b.sourceTextSha256 && a.sourceBodySha256 === b.sourceBodySha256;
const after = (a: UabFeeSource, b: UabFeeSource, limit: number) => a.lastLine < b.firstLine && b.firstLine - a.lastLine <= limit;
const VAT = /^Credit Card Service and Price Guide \(inclusive of VAT\)(?: .+)?$/i;
const matrix = new RegExp("^Primary Card Titanium Platinum World\\nAnnual Fee\\nFree Free Free\\n\\(\\^\\) 1st Year\\nAnnual Fee\\nFree for life \\^ (" + SOURCE_NUMBER + ")\\* \\^ (" + SOURCE_NUMBER + ")\\*\\n\\(\\^\\) 2nd Year onwards \\*\\*$", "i");
const spend = new RegExp("^\\* Annual Fee waiver, subject to \\^ (" + SOURCE_NUMBER + ") annual spend\\.$", "i");
const dateForm = /^UAB CREDIT CARD APPLICATION FORM V\. 2\.0 Jan 2026$/;

/** Offline manual-primary evidence replay; this parser does not fetch or write. */
export function parseUabNamedFees(input: readonly UabFeeSource[], slug: string) {
  if (!Object.hasOwn(UAB_NAMED_CARDS, slug)) return null;
  const spec = UAB_NAMED_CARDS[slug as keyof typeof UAB_NAMED_CARDS];
  const docs = DOC[spec.set];
  const islamic = spec.set === "islamic";
  const selected: UabFeeSource[] = [];
  function read(id: string, url: string, page?: number) {
    const matches = input.filter(s => s.id === id);
    const s = matches[0];
    if (matches.length !== 1 || !s || s.url !== url || !s.text || s.text.length > 5_000
      || !SHA.test(s.sourceBodySha256) || !SHA.test(s.sourceTextSha256) || digest(s.text) !== s.fixtureTextSha256
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1 || s.lastLine !== s.firstLine + s.text.split("\n").length - 1
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))) return null;
    if (page === undefined ? (s.sourceRepresentation !== "http-decoded-response-body" || s.sourceTextSha256 !== s.sourceBodySha256
      || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0)
      : (s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== `PDF page ${page}` || s.sourceStartByte !== undefined)) return null;
    selected.push(s);
    return s;
  }
  const identity = read(`${spec.key}-identity-and-availability`, spec.product);
  const selector = read(islamic ? "islamic-selectable-pair" : "conv-selectable-three", docs.form, 1);
  const edition = read(`${spec.set}-dated-edition`, docs.form, 1);
  const formVat = read(islamic ? "islamic-application-vat" : "conv-application-vat", docs.form, 2);
  const tariffVat = read(islamic ? "islamic-tariff-vat" : "conv-tariff-vat", docs.tariff, 4);
  const titleEvidence = (pattern: RegExp) => identity && pattern.test(identity.text);
  if (!identity || !selector || !edition || !formVat || !tariffVat || !exactSame(selector, edition) || !exactSame(selector, formVat)
    || !titleEvidence(new RegExp(`^${escapeRE(spec.heading)}(?:[\\s.<]|$)`)) || !titleEvidence(/Apply Now$/) || !/Primary Card Type/.test(plain(selector.text))
    || !plain(selector.text).includes(`${islamic ? "Islamic " : ""}Mastercard ${spec.tier}`) || !dateForm.test(plain(edition.text))
    || !VAT.test(plain(formVat.text)) || !VAT.test(plain(tariffVat.text))) return null;

  const documentLinks = ([["type", docs.form], ["kfs", docs.kfs], ["tariff", docs.tariff]] as const).map(([id, expected]) => {
    const src = read(`portal-${spec.set}-${id}.pdf`, FORMS);
    const a = src && /^<a href="([^"<>]+)">([^<>]+)<\/a>$/.exec(src.text);
    if (!a || !/^Credit card application form|^Key Facts Statement|Schedule of Charges$/i.test(a[2])) return null;
    try { return new URL(a[1], FORMS).href === expected ? src : null; }
    catch { return null; }
  });
  const [linkedForm, linkedKfs, linkedTariff] = documentLinks;
  if (!linkedForm || !linkedKfs || !linkedTariff || !exactSame(linkedForm, linkedKfs) || !exactSame(linkedForm, linkedTariff)) return null;

  let firstYearAnnualFee: number, renewalAnnualFee: number, waiverThreshold: number | null = null;
  const feeFields: UabFeeSource[] = [];
  let waiverPin: UabFeeSource | null = null;
  if (!islamic) {
    const order = read("conv-tariff-order", docs.tariff, 4);
    const tariff = read(`standard-${spec.key}`, docs.tariff, 4);
    const feeMatrix = read("conv-annual-fee-matrix", docs.kfs, 1);
    if (!order || !tariff || !feeMatrix || !exactSame(tariff, tariffVat) || !exactSame(order, tariffVat)
      || !after(tariffVat, order, 12) || !after(order, tariff, 22) || !/^Annual Fee Annual Fee Finance/m.test(plain(order.text))
      || !/PRIMARY CARD \(\^\)First \(\^\) Second Charges per/.test(plain(order.text)) || !/^year year onwards month/m.test(plain(order.text))) return null;
    const k = matrix.exec(plain(feeMatrix.text));
    const feeRow = new RegExp("^" + spec.tier + " Master Card (Free) (Free for Life|\\^ " + SOURCE_NUMBER + ") [^\\n]+$", "i").exec(plain(tariff.text));
    if (!k || !feeRow) return null;
    const kfsFee = spec.tier === "Titanium" ? 0 : parseSourceNumber(k[spec.tier === "Platinum" ? 1 : 2]);
    const tariffFee = /^Free for Life$/i.test(feeRow[2]) ? 0 : parseSourceNumber(feeRow[2].slice(2));
    if (kfsFee === null || tariffFee === null || kfsFee !== tariffFee || (spec.tier !== "Titanium" && tariffFee <= 0)) return null;
    firstYearAnnualFee = 0;
    renewalAnnualFee = tariffFee;
    feeFields.push(order, tariff, feeMatrix);
    if (renewalAnnualFee > 0) {
      waiverPin = read("conv-spend-waiver", docs.kfs, 1);
      const w = waiverPin && spend.exec(plain(waiverPin.text));
      waiverThreshold = w ? parseSourceNumber(w[1]) : null;
      if (!waiverPin || !exactSame(waiverPin, feeMatrix) || !after(feeMatrix, waiverPin, 12) || waiverThreshold === null || waiverThreshold <= 0) return null;
    }
  } else {
    const term = read("islamic-titanium-application", docs.form, 2);
    const tariff = read("islamic-titanium-annual-fee", docs.tariff, 4);
    const column = read("islamic-kfs-titanium-column", docs.kfs, 1);
    const fee = read("islamic-kfs-titanium-fee", docs.kfs, 1);
    if (!term || !tariff || !column || !fee || !exactSame(term, selector) || !exactSame(tariff, tariffVat) || !after(formVat, term, 14)
      || !exactSame(column, fee) || fee.firstLine - column.lastLine !== 2
      || !/^Credit Card World Islamic Titanium Islamic$/.test(plain(column.text)) || !/^Annual Fees Free for life$/i.test(plain(fee.text))
      || Math.abs(column.text.indexOf("Titanium Islamic") - fee.text.indexOf("Free for life")) > 8
      || !after(tariffVat, tariff, 30) || !/^Free for Life .+\nIslamic Mastercard Titanium$/i.test(plain(term.text))
      || !/^Islamic\nAfter 6 months After 6 months\nTitanium Free for [^\n]+\nFree 3\.79% [^\n]+\nMaster Life [^\n]+\n[^\n]+\nCard$/i.test(plain(tariff.text))) return null;
    firstYearAnnualFee = 0;
    renewalAnnualFee = 0;
    feeFields.push(tariff, term, column, fee);
  }

  const pin = (s: UabFeeSource, unit: string, vatTreatment: "inclusive" | "not-applicable" = "not-applicable") => ({
    parserId: "uab/named-primary-annual-membership/v1", productScope: spec.name, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256,
    sourceTextSha256: s.sourceTextSha256, sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    ...(s.sourceStartByte === undefined ? { sourceScope: s.sourceScope, sourceExtraction: "pdftotext-layout" as const }
      : { sourceExtraction: "http-decoded-html-excerpt" as const, sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    firstLine: s.firstLine, lastLine: s.lastLine, rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  return {
    name: spec.name, islamic, productUrl: spec.product, kfsUrl: docs.kfs,
    sources: [spec.product, FORMS, docs.form, docs.kfs, docs.tariff], capturedDate: identity.capturedAt.slice(0, 10),
    network: "Mastercard" as const, vatPolicy: "inclusive" as const, firstYearAnnualFee, renewalAnnualFee, waiverThreshold,
    ids: selected.map(s => s.id),
    evidence: {
      network: [pin(identity, "Named Mastercard issuer product; a generic Apply Now CTA is not a confirmed online tier selector"),
        pin(selector, "Issuer application lists exact selectable Primary Card Type; no applicant approval is inferred"),
        pin(linkedForm, "Issuer forms index points to the reviewed blank application")],
      annualFee: [pin(tariffVat, "Issuer tariff annual-fee VAT basis", "inclusive"), pin(formVat, "Issuer application annual-fee VAT basis", "inclusive"),
        ...feeFields.map(s => pin(s, "AED standard annual membership fee, exact primary card and year-on-year renewal scope", "inclusive"))],
      ...(waiverPin ? { annualFeeWaiver: [pin(waiverPin, "AED annual spend condition for waiver on the starred named conventional fee", "inclusive"),
        pin(feeFields[feeFields.length - 1], "Named conventional KFS columns and year-one versus renewal annual fees", "inclusive")] } : {}),
    },
  };
}
