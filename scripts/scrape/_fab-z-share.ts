// Exact named issuer fields only: no inferred financial terms or eligibility.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const HOST = "https://www.bankfab.com";
const APP = "https://apply.bankfab.com/en-ae/";
const BASE = "https://apply.bankfab.com/-/media/fab-uds/personal/";
export const FAB_Z_SHARE_SOC = BASE + "credit-cards/fees-and-charges/credit-card.pdf";
export const FAB_Z_SHARE_KFS = BASE + "key-facts-statements/credit-cards/Conventional-Cards-Key-Facts-Statement-BilingualSept2026.pdf";
const infographic = '<h2 class="infographic-heading">';
const valueLabel = '</h2><div class="global-rich-text infographic-text"><p>';
export const FAB_Z_SHARE_PRODUCTS = {
  "fab-z-credit-card": {
    key: "z", name: "FAB Z Credit Card", programme: "FAB Rewards",
    path: "fab-z-card", title: "FAB Z Card for Lifestyle Rewards | FAB UAE",
    row: "FAB Z (First year free)", target: "5DDC132D-87C0-45AE-9AC1-E6CFD1472424", anchor: "apply-now",
    fee: "Annual Fee" + valueLabel + "No annual fees for the first year</p>",
    rewards: '<span class="lwiat-item-desc">Earn FAB Rewards when you spend</span>',
    artPath: "/fab-z-card/fab-z-cards.png",
  },
  "fab-share-platinum": {
    key: "share", name: "FAB SHARE Platinum Credit Card", programme: "SHARE points",
    path: "fab-share-cards/platinum-credit-card", title: "FAB SHARE Platinum Credit Card - Earn Points | FAB UAE",
    row: "FAB SHARE Platinum", target: "2FF9A945-71BF-419A-A940-648083B214C6", anchor: "get-your-card",
    fee: "No Annual Fees" + valueLabel + "Annual Fees</p>",
    rewards: "<th>Earning on the FAB SHARE Platinum Credit Card per \ueadf 1 spent</th>",
    artPath: "/fab-share-platinum-credit-card/2-fab-share-platinum-cc-double.png",
  },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; page?: number; representation: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
};
const hex = /^[a-f0-9]{64}$/;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function one(sources: Source[], id: string, url: string, page?: number) {
  const found = sources.filter(s => s.id === id);
  if (found.length !== 1) return null;
  const s = found[0];
  if (s.url !== url || typeof s.text !== "string" || !s.text
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))
    || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256) || hash(s.text) !== s.fixtureTextSha256
    || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  if (page !== undefined) return s.page === page && s.sourceRepresentation === "pdftotext-layout" &&
    s.representation === "contiguous issuer PDF layout excerpt" && s.sourceStartByte === undefined && s.sourceScope ? s : null;
  return s.sourceRepresentation === "http-decoded-response-body" && s.representation === "contiguous issuer HTML excerpt" &&
    s.sourceBodySha256 === s.sourceTextSha256 && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
const sameBody = (a: Source, b: Source) => a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
const normalise = (t: string) => t.trim().replace(/\s+/g, " ");
function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: "fab/z-share-primary/v1", productScope, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256, sourceBodySha256: s.sourceBodySha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}

export function parseFabZShare(sources: Source[], slug: string) {
  if (!Object.hasOwn(FAB_Z_SHARE_PRODUCTS, slug)) return null;
  const t = FAB_Z_SHARE_PRODUCTS[slug as keyof typeof FAB_Z_SHARE_PRODUCTS];
  const productUrl = HOST + "/en-ae/personal/credit-cards/" + t.path;
  const product = (role: string) => one(sources, t.key + "-" + role, productUrl);
  const title = product("title"), salary = product("salary"), headline = product("headline-fee"),
    apply = product("apply"), loyalty = product("programme"), art = product("card-art-source");
  const columns = one(sources, "fab-z-share-fee-columns", FAB_Z_SHARE_SOC, 1);
  const fee = one(sources, t.key + "-fee-row", FAB_Z_SHARE_SOC, 1);
  const kfs = one(sources, "fab-z-share-kfs-fee-delegation", FAB_Z_SHARE_KFS, 1);
  if (!title || !salary || !headline || !apply || !loyalty || !art || !columns || !fee || !kfs ||
    ![salary, headline, apply, loyalty, art].every(p => sameBody(title, p)) ||
    title.text !== '<title data-react-helmet="true">' + t.title + "</title>" ||
    headline.text !== infographic + t.fee ||
    apply.text !== APP + "?card=" + t.target + "&amp;tst_id=null#" + t.anchor ||
    loyalty.text !== t.rewards || !art.text.includes(t.artPath + "?") ||
    !sameBody(columns, fee) || columns.firstLine >= fee.firstLine ||
    !/^Annual Membership Fee \(AMF\) Inclusive of VAT Primary Card Supplementary Card Card Type \(D \) \(D \)$/.test(normalise(columns.text)) ||
    !/^Annual Membership Fee\/Renewal Fee The Annual Membership Fee\/Renewal Fee is payable as prescribed by FAB in the SoF \(Schedule of Fees\), for the Customer’s Credit Card and each Supplementary Credit Card upon issuance or renewal\.?$/.test(normalise(kfs.text))) return null;
  const match = salary.text.match(new RegExp("^" + infographic + "\\ueadf (" + SOURCE_NUMBER + ")" + valueLabel + "Minimum Monthly Salary</p>$"));
  const publishedIncome = match ? parseSourceNumber(match[1]) : null;
  const [rowName, primary, supplementary, ...extra] = fee.text.trim().split(/ {2,}/);
  const annualFee = primary === "Free" ? 0 : parseSourceNumber(primary ?? "");
  const yearOneWaived = t.key === "z";
  if (rowName !== t.row || supplementary !== "Free" || extra.length || annualFee === null ||
    (yearOneWaived ? annualFee <= 0 : annualFee !== 0) || publishedIncome === null || publishedIncome <= 0) return null;
  const selected = [title, salary, headline, apply, loyalty, art, columns, fee, kfs];
  return {
    name: t.name, programme: t.programme, annualFee, yearOneWaived, publishedIncome, productUrl, kfsUrl: FAB_Z_SHARE_KFS,
    sourceFixtureIds: selected.map(s => s.id), sources: [...new Set(selected.map(s => s.url))], capturedDate: title.capturedAt.slice(0, 10),
    evidence: {
      annualFee: [pin(fee, t.name, "AED standard primary annual membership fee", "inclusive"), pin(columns, t.name, "VAT-inclusive membership fee columns", "inclusive")],
      ...(yearOneWaived ? { annualFeeWaiver: [pin(headline, t.name, "First-year primary annual membership fee waiver", "not-applicable"), pin(fee, t.name, "First-year waiver separately labelled from standard renewal", "inclusive")] } : {}),
      "eligibility.publishedMinMonthlyIncome": [pin(salary, t.name, "AED monthly salary published by issuer; not full eligibility", "not-applicable")],
      loyaltyProgram: [pin(loyalty, t.name, "Rewards programme name only; no earn rate", "not-applicable")],
    },
  };
}
