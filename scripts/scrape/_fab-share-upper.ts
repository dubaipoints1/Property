import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const issuer = "https://www.bankfab.com";
const productBase = issuer + "/en-ae/personal/credit-cards/fab-share-cards/";
const applicationBase = "https://apply.bankfab.com/en-ae/";
export const FAB_SHARE_UPPER_TARIFF = issuer + "/-/media/fab-uds/personal/credit-cards/fees-and-charges/credit-card.pdf?view=1";
export const FAB_SHARE_UPPER_KFS = "https://apply.bankfab.com/-/media/fab-uds/personal/key-facts-statements/credit-cards/Conventional-Cards-Key-Facts-Statement-BilingualSept2026.pdf";
export const FAB_SHARE_UPPER = {
  "fab-share-infinite": { key: "infinite", tier: "Infinite", titleSuffix: "Lounge Access", applicationId: "6DDB09E0-F9E2-4C60-9705-6B6DAFD058BD" },
  "fab-share-signature": { key: "signature", tier: "Signature", titleSuffix: "Cinema Deals", applicationId: "D4528897-B336-47C8-8E50-C58669994266" },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
};
const hex = /^[0-9a-f]{64}$/;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const sameCapture = (a: Source, b: Source) => a.sourceBodySha256 === b.sourceBodySha256
  && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;

function sourceFrom(input: readonly Source[], id: string, url: string, pdf = false) {
  const found = input.filter(r => r.id === id);
  const s = found[0];
  if (found.length !== 1 || !s || s.url !== url || typeof s.text !== "string" || !s.text
    || s.fixtureTextSha256 !== sha(s.text) || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256)
    || !Number.isFinite(Date.parse(s.capturedAt)) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  if (pdf) return s.sourceRepresentation === "pdftotext-layout" && s.sourceScope === "PDF page 1"
    && s.sourceStartByte === undefined ? s : null;
  return s.sourceRepresentation === "http-decoded-response-body" && s.sourceBodySha256 === s.sourceTextSha256
    && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}

function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: "fab/share-upper-primary/v1", productScope, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1, rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}

const incomeHeading = new RegExp('^<h2 class="infographic-heading">\ueadf (' + SOURCE_NUMBER
  + ')</h2><div class="global-rich-text infographic-text"><p>Minimum Monthly Salary</p>$');
const cols = "Annual Membership Fee (AMF) Inclusive of VAT Primary Card Supplementary Card Card Type (D ) (D )";
const kfsTerms = "The Annual Membership Fee/Renewal Fee is payable as prescribed by FAB in the SoF (Schedule of Fees), for the Customer’s Credit Card and each Supplementary Credit Card upon issuance or renewal";

export function parseFabShareUpper(input: readonly Source[], slug: string) {
  if (!Object.hasOwn(FAB_SHARE_UPPER, slug)) return null;
  const t = FAB_SHARE_UPPER[slug as keyof typeof FAB_SHARE_UPPER];
  const name = "FAB SHARE " + t.tier + " Credit Card";
  const productUrl = productBase + t.key + "-credit-card";
  const application = applicationBase + "?card=" + t.applicationId + "&tst_id=null#get-your-card";
  const get = (role: string) => sourceFrom(input, "fab-share-upper-" + t.key + "-" + role, productUrl);
  const heading = get("title"), salary = get("salary"), mobileSalary = get("salary-repeat");
  const network = get("network"), cta = get("application"), loyalty = get("programme"), linkedTariff = get("tariff-link");
  const columns = sourceFrom(input, "fab-share-upper-tariff-columns", FAB_SHARE_UPPER_TARIFF, true);
  const fee = sourceFrom(input, "fab-share-upper-" + t.key + "-tariff-fee", FAB_SHARE_UPPER_TARIFF, true);
  const kfs = sourceFrom(input, "fab-share-upper-kfs-delegation", FAB_SHARE_UPPER_KFS, true);
  if (!heading || !salary || !mobileSalary || !network || !cta || !loyalty || !linkedTariff || !columns || !fee || !kfs ||
    ![salary, mobileSalary, network, cta, loyalty, linkedTariff].every(row => sameCapture(heading, row)) ||
    !sameCapture(columns, fee) || columns.firstLine >= fee.firstLine ||
    heading.text !== '<title data-react-helmet="true">' + name + " - " + t.titleSuffix + " | FAB UAE</title>" ||
    salary.text !== mobileSalary.text || salary.sourceStartByte! >= mobileSalary.sourceStartByte! ||
    cta.text !== 'href="' + application.replace("&", "&amp;") + '"' ||
    network.text !== '<span class="lwiat-item-desc">Special Visa offers</span>' ||
    loyalty.text !== "<th>Earning on the " + name + " per \ueadf 1 spent</th>" ||
    linkedTariff.text !== 'href="' + FAB_SHARE_UPPER_TARIFF + '"' || clean(columns.text) !== cols ||
    clean(kfs.text) !== kfsTerms) return null;

  const incomeText = incomeHeading.exec(salary.text)?.[1];
  const feeRow = new RegExp("^[ \\t]*FAB SHARE " + t.tier + "[ \\t]{2,}(" + SOURCE_NUMBER + ")[ \\t]{2,}Free[ \\t]*$");
  const feeText = feeRow.exec(fee.text)?.[1];
  const publishedIncome = incomeText === undefined ? null : parseSourceNumber(incomeText);
  const annualFee = feeText === undefined ? null : parseSourceNumber(feeText);
  if (publishedIncome === null || publishedIncome <= 0 || annualFee === null || annualFee <= 0) return null;

  const selected = [heading, salary, mobileSalary, network, cta, loyalty, linkedTariff, columns, fee, kfs];
  return {
    name, productUrl, application, network: "Visa" as const, programme: "SHARE points", annualFee, publishedIncome,
    kfsUrl: FAB_SHARE_UPPER_KFS, sources: [productUrl, FAB_SHARE_UPPER_TARIFF, FAB_SHARE_UPPER_KFS],
    capturedDate: heading.capturedAt.slice(0, 10), sourceFixtureIds: selected.map(row => row.id),
    evidence: {
      network: [pin(network, name, "Visa network identity only; no entitlement assertion", "not-applicable")],
      loyaltyProgram: [pin(loyalty, name, "SHARE points programme identity only", "not-applicable")],
      annualFee: [
        pin(fee, name, "AED published standard primary annual membership fee", "inclusive"),
        pin(columns, name, "Primary and supplementary columns; fee guide inclusive of VAT", "inclusive"),
      ],
      "eligibility.publishedMinMonthlyIncome": [pin(salary, name, "AED minimum monthly salary published by FAB; not a qualification decision", "not-applicable")],
    },
  };
}
