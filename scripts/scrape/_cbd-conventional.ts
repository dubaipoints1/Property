import { createHash } from "node:crypto";
import { parseSourceNumber } from "./_lib.ts";

const docs = "https://www.cbd.ae/docs/default-source/document/cards/";
const product = "https://www.cbd.ae/personal/cards/credit-cards/";
export const CBD_SOC = docs + "credit-card-schedule-of-charges.pdf";
export const CBD_CONVENTIONAL = {
  "cbd-visa-infinite": { variant: "Visa Infinite", suffix: "visa-infinite", kfs: "visa-infinite-cc.pdf?sfvrsn=eeab066b_7", column: 1, app: "visainfinite", heading: "Visa Infinite" },
  "cbd-super-saver": { variant: "Super Saver Visa Signature", suffix: "super-saver", kfs: "super-saver-cc.pdf?sfvrsn=dfaa066b_4", column: 2, app: "supersaver", heading: "Super Saver" },
  "cbd-smiles-signature": { variant: "Smiles Visa Signature", suffix: "smiles-signature", kfs: "cbd-smiles-signature-cc.pdf?sfvrsn=11a9066b_4", column: 3, app: "cbdsmilesvisasignature", heading: "Smiles Visa Signature" },
} as const;

type Evidence = {
  id: string;
  url: string;
  capturedAt: string;
  sourceBodySha256: string | null;
  sourceTextSha256: string;
  sourceRepresentation?: string;
  sourceSnapshotSha256?: string;
  sourceScope?: string;
  captureMethod?: string;
  page: number;
  firstLine: number;
  text: string;
  fixtureTextSha256: string;
};

const digest = (text: string) => createHash("sha256").update(text).digest("hex");
const sha = /^[a-f0-9]{64}$/;
const compact = (s: string) => s.trim().replace(/\s+/g, " ");
const cols = (s: string) => s.trim().split(/ {2,}/u);

const money = "(\\d{1,3}(?:,\\d{3})*\\.\\d{2})";
const exactVat = "Disclaimer: All fees and charges mentioned in the table below are inclusive of 5% (five percent) Value Added Tax (VAT) unless stated not applicable in the Bank’s SOC as per taxation regulation.";
const exactKfsFootnote = "1 Offered FREE for FIRST YEAR only, applicable fee will apply from the beginning of second year and thereon for each year (i.e., upon completion of each anniversary). Waiver of Annual Fee in each year is subject to achieving the minimum annual spends assigned for some CARD Variant and as published on CBD’s website. For any promotion related details, please refer to the respective promotion Terms & Conditions.";
const exactKfsVat = "• All Fees mentioned herein and on CBD’s website are inclusive of Value Added Tax (VAT). A VAT of 5% shall be applicable on all Fees levied by CBD and will be billed along with the Fee and charged in the monthly SOA.";
const sourcePrefix = "cbd-kfs-conventional_";
const captured = (t: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(t) && Number.isFinite(Date.parse(t));

function field(s: Evidence, name: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: "cbd/three-exact-conventional-renewal/v1", productScope: name, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: "pdftotext-layout" as const, captureMethod: "public-http-reader" as const,
    sourceExtraction: "pdftotext-layout" as const, sourceScope: "PDF page " + s.page,
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
export function parseCbdConventional(input: readonly Evidence[], slug: string) {
  if (!Object.hasOwn(CBD_CONVENTIONAL, slug)) return null;
  const spec = CBD_CONVENTIONAL[slug as keyof typeof CBD_CONVENTIONAL], kfsUrl = docs + sourcePrefix + spec.kfs;
  const productName = "CBD " + spec.variant + " Credit Card", productUrl = product + spec.suffix;
  const rendered = input.filter(s => s.id === slug + "-product"), proof = rendered[0];
  if (rendered.length !== 1 || !proof || proof.url !== productUrl || proof.page !== 0 || proof.firstLine !== 1
      || proof.sourceBodySha256 !== null || proof.sourceRepresentation !== "visible-main-dom-and-accessibility-snapshot"
      || proof.captureMethod !== "normal-public-browser-ui" || !proof.sourceScope
      || !sha.test(proof.sourceSnapshotSha256 ?? "") || !sha.test(proof.sourceTextSha256) || !captured(proof.capturedAt)
      || typeof proof.text !== "string" || proof.text.length > 2500 || digest(proof.text) !== proof.fixtureTextSha256) return null;
  const [heading, acquisition, applyUrl, observedKfs, ...extraProof] = proof.text.split("\n");
  if (extraProof.length || heading !== spec.heading || acquisition !== "Apply in minutes through the CBD Mobile App"
      || observedKfs !== kfsUrl || !applyUrl) return null;
  let app: URL;
  try { app = new URL(applyUrl); } catch { return null; }
  if (app.origin !== "https://cbd.go.link" || app.username || app.password || app.pathname !== "/digi/cards/" + spec.app) return null;
  const receipts: string[] = [proof.id];
  function get(id: string, url: string, page: number, line: number) {
    const matches = input.filter(s => s.id === id), s = matches[0];
    if (!s || matches.length !== 1 || s.url !== url || s.page !== page || s.firstLine !== line ||
        typeof s.sourceBodySha256 !== "string" || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256) ||
        typeof s.text !== "string" || s.text.length === 0 || s.text.length > 2500 || s.fixtureTextSha256 !== digest(s.text) ||
        !captured(s.capturedAt)) return null;
    receipts.push(id);
    return s;
  }
  const kHead = get(slug+"-kfs-head", kfsUrl, 1, 24), kFee = get(slug+"-kfs-fee", kfsUrl, 1, 27);
  const kPeriod = get(slug+"-kfs-period", kfsUrl, 1, 31), kVat = get(slug+"-kfs-vat", kfsUrl, 3, 14);
  const sVat = get("cbd-soc-vat", CBD_SOC, 1, 3), sRow = get("cbd-soc-primary", CBD_SOC, 1, 7);
  if (!kHead || !kFee || !kPeriod || !kVat || !sVat || !sRow) return null;
  if (![kFee, kPeriod, kVat].every(s => s.sourceBodySha256 === kHead.sourceBodySha256 && s.capturedAt === kHead.capturedAt) ||
      ![kFee, kPeriod].every(s => s.sourceTextSha256 === kHead.sourceTextSha256) ||
      sVat.sourceBodySha256 !== sRow.sourceBodySha256 || sVat.sourceTextSha256 !== sRow.sourceTextSha256 ||
      sVat.capturedAt !== sRow.capturedAt) return null;

  const lines = kHead.text.split("\n"), [feeKind, primary, supplementary, name] = cols(kFee.text);
  if (lines.length !== 2 || compact(lines[0]) !== "Fees and interest charges – conventional CARDS" ||
      cols(lines[1]).join("|") !== "FEES|PRIMARY CARD|SUPPLEMENTARY CARD|Card Type" ||
      cols(kFee.text).length !== 4 || !/^Annual Fees?$/.test(feeKind) || supplementary !== "Free For Life" || name !== spec.variant ||
      compact(kPeriod.text) !== exactKfsFootnote || compact(kVat.text) !== exactKfsVat ||
      compact(sVat.text).replace(/Bank's/g, "Bank’s") !== exactVat) return null;
  const [feeTypes, superName, labels, period, prices, ...extra] = sRow.text.split("\n");
  if (extra.length || !prices || cols(feeTypes).join("|") !== "Fee Types|Credit Card Types**" ||
      compact(superName) !== "Super Saver Visa" ||
      cols(labels).join("|") !== "CBD One Visa Signature|Visa Infinite ❶|Smiles Visa Signature|Yes Rewards ❶" ||
      cols(period).join("|") !== "Annual Fee (Primary Card)|Signature ❶") return null;
  const priceCols = cols(prices);
  if (priceCols.length !== 5 || priceCols[0] !== "Free" || !priceCols.slice(1).every(x => new RegExp("^AED " + money + "$").test(x))) return null;
  const kToken = new RegExp("^AED "+money+"1$").exec(primary)?.[1]; // 1 is the printed superscript footnote, not a third decimal digit.
  const sToken = new RegExp("^AED "+money+"$").exec(priceCols[spec.column])?.[1];
  const fee = kToken == null ? null : parseSourceNumber(kToken);
  if (fee === null || fee <= 0 || sToken === undefined || fee !== parseSourceNumber(sToken)) return null;

  const evidence = {
    name: [{
      parserId: "cbd/three-exact-conventional-renewal/v1", productScope: productName,
      unit: "Visible exact name and named mobile app link; no form entered or approval implied", vatTreatment: "not-applicable" as const,
      sourceUrl: proof.url, capturedAt: proof.capturedAt, sourceBodySha256: null,
      sourceRepresentation: "visible-main-dom-and-accessibility-snapshot" as const, captureMethod: "normal-public-browser-ui" as const,
      sourceTextSha256: proof.sourceTextSha256, sourceSnapshotSha256: proof.sourceSnapshotSha256!, sourceScope: proof.sourceScope,
      firstLine: 1, lastLine: 4, rawText: proof.text, rawTextSha256: proof.fixtureTextSha256,
    }],
    network: [field(kFee, productName, "Exact conventional Visa tier in the named KFS card-type column", "not-applicable")],
    annualFee: [
      field(kHead, productName, "Conventional primary and supplementary columns kept separate", "not-applicable"),
      field(kFee, productName, "Exact named primary standard annual membership fee", "inclusive"),
      field(kVat, productName, "KFS VAT basis", "inclusive"),
      field(sRow, productName, "Same named primary tariff column and gross renewal amount", "inclusive"),
      field(sVat, productName, "Schedule VAT basis", "inclusive"),
    ],
    annualFeeWaiver: [
      field(kFee, productName, "Superscript 1 attached to named primary annual fee", "not-applicable"),
      field(kPeriod, productName, "First year annual membership fee only, then standard fee; no universal ongoing waiver or joining charge", "not-applicable"),
    ],
  };
  return {
    name: productName, productUrl, network: "Visa" as const, annualFee: fee, vatPolicy: "inclusive" as const,
    annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual" as const },
    kfsUrl, sources: [productUrl, kfsUrl, CBD_SOC], capturedDate: kHead.capturedAt.slice(0, 10), sourceFixtureIds: receipts, evidence,
  };
}
