import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const issuer = "https://www.bankfab.com";
const applicationHost = "https://apply.bankfab.com";
const productBase = issuer + "/en-ae/personal/credit-cards/etihad-guest-";
const privateSelector = applicationHost + "/en-ae/etihad-cards"; // Proof only; never a public CTA.
const tariffPath = "/-/media/fab-uds/personal/credit-cards/fees-and-charges/credit-card.pdf";
const kfsPath = "/-/media/fab-uds/personal/key-facts-statements/credit-cards/Conventional-Cards-Key-Facts-Statement-BilingualSept2026.pdf";
export const FAB_ETIHAD_TARIFF = issuer + tariffPath + "?view=1";
export const FAB_ETIHAD_KFS = applicationHost + kfsPath;
export const FAB_ETIHAD_CONVENTIONAL = {
  "fab-etihad-guest-signature": { key: "signature", tier: "Signature", title: "FAB Etihad Guest Signature Credit Card - Earn Miles" },
  "fab-etihad-guest-platinum": { key: "platinum", tier: "Platinum", title: "Etihad Guest Platinum Credit Card - Miles &amp; Benefits" },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
};
const prefix = "fab-etihad-conventional-";
const hex = /^[0-9a-f]{64}$/;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const sameCapture = (a: Source, b: Source) => a.sourceBodySha256 === b.sourceBodySha256
  && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;

function sourceFrom(input: readonly Source[], role: string, url: string, pdf = false) {
  const ids = input.filter(s => s.id === prefix + role), row = ids[0];
  if (ids.length !== 1 || !row || row.url !== url || typeof row.text !== "string" || !row.text
    || row.fixtureTextSha256 !== sha(row.text) || !hex.test(row.sourceBodySha256) || !hex.test(row.sourceTextSha256)
    || !Number.isFinite(Date.parse(row.capturedAt)) || !Number.isSafeInteger(row.firstLine) || row.firstLine < 1) return null;
  if (pdf) return row.sourceRepresentation === "pdftotext-layout" && row.sourceScope === "PDF page 1"
    && row.sourceStartByte === undefined ? row : null;
  return row.sourceRepresentation === "http-decoded-response-body" && row.sourceBodySha256 === row.sourceTextSha256
    && Number.isSafeInteger(row.sourceStartByte) && row.sourceStartByte! >= 0 ? row : null;
}

function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: "fab/etihad-conventional/v1", productScope, unit, vatTreatment, sourceUrl: s.url, capturedAt: s.capturedAt,
    sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}

const salaryPattern = new RegExp('^<h2 class="infographic-heading">\ueadf (' + SOURCE_NUMBER
  + ')</h2><div class="global-rich-text infographic-text"><p>Minimum Monthly Salary</p>$');
const columnsHeading = "Annual Membership Fee (AMF) Inclusive of VAT Primary Card Supplementary Card Card Type (D ) (D )";
const kfsFeeDelegation = "The Annual Membership Fee/Renewal Fee is payable as prescribed by FAB in the SoF (Schedule of Fees), for the Customer’s Credit Card and each Supplementary Credit Card upon issuance or renewal";

export function parseFabEtihadConventional(input: readonly Source[], slug: string) {
  if (!Object.hasOwn(FAB_ETIHAD_CONVENTIONAL, slug)) return null;
  const tier = FAB_ETIHAD_CONVENTIONAL[slug as keyof typeof FAB_ETIHAD_CONVENTIONAL];
  const selectorName = "Etihad Guest " + tier.tier + " Credit Card", name = "FAB " + selectorName;
  const productUrl = productBase + tier.key;
  const product = (role: string) => sourceFrom(input, tier.key + "-" + role, productUrl);
  const selected = (role: string) => sourceFrom(input, tier.key + "-" + role, privateSelector);
  const title = product("title"), salary = product("salary"), salaryRepeat = product("salary-repeat");
  const visa = product("network"), programme = product("programme"), tariffLink = product("tariff-link");
  const selectorHeading = selected("selector-heading"), selectorKfs = selected("selector-kfs"), selectorTariff = selected("selector-tariff");
  const columns = sourceFrom(input, "tariff-columns", FAB_ETIHAD_TARIFF, true);
  const fee = sourceFrom(input, tier.key + "-tariff-fee", FAB_ETIHAD_TARIFF, true);
  const kfs = sourceFrom(input, "kfs-fee-delegation", FAB_ETIHAD_KFS, true);
  if (!title || !salary || !salaryRepeat || !visa || !programme || !tariffLink || !selectorHeading
    || !selectorKfs || !selectorTariff || !columns || !fee || !kfs
    || ![salary, salaryRepeat, visa, programme, tariffLink].every(row => sameCapture(title, row))
    || ![selectorKfs, selectorTariff].every(row => sameCapture(selectorHeading, row))
    || !sameCapture(columns, fee) || columns.firstLine >= fee.firstLine
    || title.text !== '<title data-react-helmet="true">' + tier.title + " | FAB UAE</title>"
    || salary.text !== salaryRepeat.text || salary.sourceStartByte! >= salaryRepeat.sourceStartByte!
    || visa.text !== '<div class="bpl-item-content-title">Special Visa offers</div>'
    || programme.text !== '<span class="lwiat-item-desc">Earn more Etihad Guest Miles on spending</span>'
    || tariffLink.text !== 'href="' + FAB_ETIHAD_TARIFF + '"'
    || selectorHeading.text !== '<h4 class="text-primary-blue mb-1 md:pe-24 md:pt-0 pt-6">' + selectorName + "</h4>"
    || selectorKfs.text !== '<a href="' + kfsPath + '" class="body-1 text-primary-blue underline caption-light" target="_blank" rel="noreferrer">Key facts</a>'
    || selectorTariff.text !== '<a href="' + tariffPath + '" target="_blank" rel="noreferrer" class="body-1 text-primary-blue underline caption-light">Schedule of charges</a>'
    || !(selectorHeading.sourceStartByte! < selectorKfs.sourceStartByte! && selectorKfs.sourceStartByte! < selectorTariff.sourceStartByte!
      && selectorTariff.sourceStartByte! - selectorHeading.sourceStartByte! < 2000)
    || clean(columns.text) !== columnsHeading || clean(kfs.text) !== kfsFeeDelegation) return null;

  const salaryText = salaryPattern.exec(salary.text)?.[1];
  const feePattern = new RegExp("^[ \\t]*Etihad Guest " + tier.tier + "[ \\t]{2,}(" + SOURCE_NUMBER + ")[ \\t]{2,}" + SOURCE_NUMBER + "[ \\t]*$");
  const amountText = feePattern.exec(fee.text)?.[1];
  const publishedIncome = salaryText === undefined ? null : parseSourceNumber(salaryText);
  const annualFee = amountText === undefined ? null : parseSourceNumber(amountText);
  if (publishedIncome === null || publishedIncome <= 0 || annualFee === null || annualFee <= 0) return null;

  return {
    name, productUrl, network: "Visa" as const, programme: "Etihad Guest",
    publishedIncome, annualFee, kfsUrl: FAB_ETIHAD_KFS, sources: [productUrl, FAB_ETIHAD_TARIFF, FAB_ETIHAD_KFS],
    capturedDate: title.capturedAt.slice(0, 10),
    sourceFixtureIds: [title, salary, salaryRepeat, visa, programme, tariffLink, selectorHeading, selectorKfs, selectorTariff,
      columns, fee, kfs].map(row => row.id),
    evidence: {
      network: [pin(visa, name, "Visa network identity only", "not-applicable")],
      loyaltyProgram: [pin(programme, name, "Etihad Guest programme identity only", "not-applicable")],
      annualFee: [
        pin(fee, name, "AED standard primary annual membership fee", "inclusive"),
        pin(columns, name, "VAT-inclusive tariff; primary and supplementary columns", "inclusive"),
      ],
      "eligibility.publishedMinMonthlyIncome": [pin(salary, name, "AED published minimum monthly salary; not an approval decision", "not-applicable")],
    },
  };
}
