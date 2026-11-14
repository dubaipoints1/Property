import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

export const MASHREQ_SOC = "https://www.mashreq.com/-/jssmedia/pdfs/neo/cards/mashreq-cards-soc-latest.ashx";
export const MASHREQ_KFS = "https://www.mashreq.com/-/jssmedia/pdfs/neo/cards/KFS-TnC/Mashreq-Cards-KFS-new-en-ar.ashx/";
export const MASHREQ_PRODUCTS = {
  "mashreq-noon": ["/uae/neo/cards/credit-cards/noon-credit-card/", "noon", "Mashreq noon Credit Card"],
  "mashreq-platinum-plus": ["/en/uae/neo/cards/credit-cards/platinum-plus-credit-card/", "Platinum Plus Card", "Mashreq Platinum Plus Credit Card"],
  "mashreq-solitaire": ["/en/uae/neo/cards/credit-cards/solitaire-credit-card", "Solitaire Card", "Mashreq Solitaire Credit Card"],
} as const;
type Input = { id: string; url: string; capturedAt: string; representation: string; sourceBodySha256: string;
  fixtureTextSha256: string; firstLine?: number; sourceStartByte?: number; text: string };
type Product = keyof typeof MASHREQ_PRODUCTS;
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
function source(inputs: Input[], id: string, url: string) {
  const row = inputs.filter(s => s.id === id);
  const s = row.length === 1 ? row[0] : undefined;
  return s?.url === url && /^\d{4}-\d{2}-\d{2}T/.test(s.capturedAt) && Number.isFinite(Date.parse(s.capturedAt))
    && /^[a-f0-9]{64}$/.test(s.sourceBodySha256) && digest(s.text) === s.fixtureTextSha256 ? s : null;
}
function evidence(s: Input, label: string, unit: string, vatTreatment: "exclusive" | "not-applicable") {
  if (s.representation !== "contiguous issuer HTML excerpt" || !Number.isSafeInteger(s.firstLine) ||
      s.firstLine! < 1 || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
  return {
    parserId: "mashreq/product-and-schedule/v1", productScope: label, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceBodySha256,
    sourceRepresentation: "http-decoded-response-body" as const, captureMethod: "public-http-reader" as const,
    firstLine: s.firstLine!, lastLine: s.firstLine! + s.text.split("\n").length - 1,
    sourceStartByte: s.sourceStartByte!, sourceEndByte: s.sourceStartByte! + Buffer.byteLength(s.text),
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
export function parseMashreqExpansion(inputs: Input[], slug: string) {
  if (!Object.hasOwn(MASHREQ_PRODUCTS, slug)) return null;
  const [path, column, name] = MASHREQ_PRODUCTS[slug as Product];
  const url = "https://www.mashreq.com" + path;
  const fee = source(inputs, slug + "-fee", url);
  const soc = source(inputs, "mashreq-fee-schedule", MASHREQ_SOC);
  const kfs = source(inputs, "mashreq-kfs", MASHREQ_KFS);
  if (!fee || !soc || !kfs || soc.representation !== "named issuer PDF table cells via pdfplumber"
    || kfs.representation !== soc.representation) return null;
  const [disclaimer, header, principal, ...rest] = soc.text.split("\n");
  if (rest.length || !disclaimer?.startsWith("Disclaimer:") || !header?.startsWith("Charges (in D) | ") ||
    !principal?.startsWith("Principal Annual Fee | ")) return null;
  const headings = header.split(" | "), values = principal.split(" | ");
  if (headings.length !== values.length || new Set(headings).size !== headings.length || !headings.includes(column)) return null;
  const vat = disclaimer.match(new RegExp(`inclusive of (${SOURCE_NUMBER})% Value Added Tax`));
  const vatRate = parseSourceNumber(vat?.[1] ?? "");
  if (vatRate === null || vatRate <= 0 || vatRate > 10) return null;
  const paid = values[headings.indexOf(column)]?.match(new RegExp(`^D (${SOURCE_NUMBER})$`));
  const scheduled = values[headings.indexOf(column)] === "Free for life" ? 0 : parseSourceNumber(paid?.[1] ?? "");
  const scope = slug === "mashreq-noon" ? "p2 | noon" : slug === "mashreq-solitaire" ? "p1 | eriatiloS" : "p1 | munitalP";
  const [kfsHeading, ...kfsRows] = kfs.text.split("\n");
  const kfsMatches = kfsRows.filter(row => row.startsWith(`${column} | ${scope} | `));
  if (!kfsHeading?.startsWith("KFS_Cards_09 2026 | Annual fee (primary) | recurring (VAT inclusive)") ||
    kfsMatches.length !== 1) return null;
  const kfsAmount = kfsMatches[0]!.split(" | ").at(-1);
  const disclosed = kfsAmount === "Free for life" ? 0 : parseSourceNumber(kfsAmount ?? "");
  if (disclosed === null || disclosed !== scheduled) return null;
  const markup = /^>Annual [Ff]ee<\/h6><div class="ui-text ui-text-body4 pt-2 is-richtext">/.exec(fee.text);
  if (!markup || scheduled === null) return null;
  const text = fee.text.slice(markup[0].length);
  const pay = text.match(new RegExp(slug === "mashreq-solitaire"
    ? `^<p>Primary: AED (${SOURCE_NUMBER}) \\+(${SOURCE_NUMBER})% VAT Supplementary: AED ${SOURCE_NUMBER} \\+${SOURCE_NUMBER}% VAT</p>$`
    : `^Primary (${SOURCE_NUMBER})\\+ (${SOURCE_NUMBER})% VAT$`));
  const preVat = slug === "mashreq-noon" && text === "Free for life" ? 0 : parseSourceNumber(pay?.[1] ?? "");
  if (preVat === null || (preVat > 0 && parseSourceNumber(pay?.[2] ?? "") !== vatRate)
    || Math.round(preVat * (100 + vatRate)) / 100 !== scheduled) return null;
  const feeEvidence = evidence(fee, name, preVat ? "AED before VAT, plus stated statutory VAT" : "AED annual primary membership fee", preVat ? "exclusive" : "not-applicable");
  if (!feeEvidence) return null;
  if (slug === "mashreq-noon") return { name, productUrl: url, annualFee: scheduled, publishedIncome: undefined, evidence: { annualFee: [feeEvidence] } };
  const income = source(inputs, slug + "-income", url);
  if (!income || income.sourceBodySha256 !== fee.sourceBodySha256) return null;
  const match = income.text.match(new RegExp(`^>Your monthly income should be a minimum of AED (${SOURCE_NUMBER})\\.</div>$`));
  const publishedIncome = parseSourceNumber(match?.[1] ?? "");
  const incomeEvidence = evidence(income, name, "AED monthly published income", "not-applicable");
  if (publishedIncome === null || publishedIncome <= 0 || !incomeEvidence) return null;
  return { name, productUrl: url, annualFee: scheduled, publishedIncome, evidence: {
    annualFee: [feeEvidence], "eligibility.publishedMinMonthlyIncome": [incomeEvidence],
  } };
}
