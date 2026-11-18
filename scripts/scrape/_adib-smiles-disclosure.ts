// ADIB Smiles Classic and Visa Signature detail-page evidence only. No canonical writing,
// eligibility inference, combined FX rate, reward valuation or ranking.
import { createHash } from "node:crypto";
import { ADIB_PRODUCTS, ADIB_SOC_COLUMNS, parseAdibSchedule, type AdibSource } from "./_adib-primary.ts";
import { parseSourceNumber } from "./_lib.ts";

const tariffBody = "67bc99481e11344304641d95c5c01eb242a0eaf5feb31bd8081889b293b8e4c6";
const tariffText = "0bd302c18eaa2d1138881843fee1eda21bdf7a8059ae9cb7e09538a2acc7da5f";
const termsBody = "16d03fcba503b8bbffc450e385b7bddf5e3d02ffe488b017ec1bf1f2ae54aadb";
const termsText = "ad9e627e73e052a6d257f86c935c7634fd74557c37bb8d4fe2a94d95004a537e";
const termsUrl = "https://www.adib.ae/-/media/project/adib/adibsite/docs/personal/cards/adib-covered-cards-terms-and-conditions.pdf";
const products = {
  "adib-smiles-visa-classic": {
    tariffColumn: "ADIB Smiles Classic card (8)",
    standard: /^ +21\.2\.4\.7 Non Self-funded ADIB Smiles Classic Cardholders\n +(\d{1,3}(?:,\d{3})+) Smiles Points\.$/gm,
    selfFunded: /^ +21\.2\.4\.8 Self-funded ADIB Smiles Classic Cardholders (\d{1,3}(?:,\d{3})+)\n +Smiles points$/gm,
  },
  "adib-smiles-visa-signature": {
    tariffColumn: "ADIB Smiles Visa Signature Card",
    standard: /^ +21\.2\.4\.1 Non Self-funded ADIB Smiles Visa Signature\n +Cardholders (\d{1,3}(?:,\d{3})+) Smiles Points;$/gm,
    selfFunded: /^ +21\.2\.4\.2 Self-funded ADIB Smiles Visa Signature cardholders\n +(\d{1,3}(?:,\d{3})+) Smiles points$/gm,
  },
} as const;
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

function unique(text: string, regex: RegExp) {
  const matches = [...text.matchAll(regex)];
  return matches.length === 1 ? matches[0]! : null;
}

function exactPdf(s: AdibSource, bodySha256: string, textSha256: string) {
  return s.sourceBodySha256 === bodySha256 && s.representation === "pdftotext-layout"
    && s.firstLine === 1 && s.firstByte === 0 && sha(s.text) === textSha256
    && s.fixtureTextSha256 === textSha256 && s.sourceTextSha256 === textSha256;
}

function pin(source: AdibSource, match: RegExpMatchArray, text = match[0], relative = 0) {
  const start = match.index! + relative;
  return {
    sourceUrl: source.url, sourceBodySha256: source.sourceBodySha256,
    sourceTextSha256: source.sourceTextSha256,
    firstLine: source.text.slice(0, start).split("\n").length,
    lastLine: source.text.slice(0, start + text.length - 1).split("\n").length,
    firstByte: Buffer.byteLength(source.text.slice(0, start)),
    pastLastByte: Buffer.byteLength(source.text.slice(0, start + text.length)),
    rawTextSha256: sha(text),
  };
}

export function parseAdibSmilesDisclosure(tariff: AdibSource, terms: AdibSource, slug: keyof typeof products = "adib-smiles-visa-signature") {
  if (!exactPdf(tariff, tariffBody, tariffText) || !exactPdf(terms, termsBody, termsText) || terms.url !== termsUrl) return null;
  const schedule = parseAdibSchedule(tariff);
  const product = products[slug];
  if (!product) return null;
  const index = ADIB_PRODUCTS[slug].socIndex;
  if (!schedule || ADIB_SOC_COLUMNS[index] !== product.tariffColumn) return null;

  const nonAed = unique(tariff.text, /^ +Non-⃃ Transaction Service Fee \(5\) +[^\n]+$/gm);
  const intlAed = unique(tariff.text, /^ +⃃ International Transaction Service Fee \(6\) +[^\n]+$/gm);
  const foot5 = unique(tariff.text, /^ +\(5\) Added to the Non-⃃ transactions’ wholesale foreign exchange market spot rate[^\n]+$/gm);
  const foot6 = unique(tariff.text, /^ +\(6\) International transactions that take place outside the UAE[^\n]+\n[^\n]+\n +charge applied by Visa, and \(ii\) the applicable foreign exchange \(FX\) rate[^\n]+$/gm);
  if (!nonAed || !intlAed || !foot5 || !foot6
    || !foot5[0].includes("in addition to the fee of Visa/MasterCard")
    || !foot6[0].includes("pays for goods and services in foreign currencies")
    || !foot6[0].includes("a service fee as per the table above, which includes")) return null;

  const feeCell = (row: RegExpMatchArray) => {
    const cells = [...row[0].matchAll(/\S(?:.*?\S)?(?= {2,}|$)/g)].slice(1);
    if (cells.length !== ADIB_SOC_COLUMNS.length || cells.some(c => !/^\d+(?:\.\d+)?%$/.test(c[0]))) return null;
    const cell = cells[index]!;
    const rate = parseSourceNumber(cell[0].slice(0, -1));
    return rate === null ? null : { rate, evidence: pin(tariff, row, cell[0], cell.index!) };
  };
  const nonAedFee = feeCell(nonAed), intlAedFee = feeCell(intlAed);
  if (!nonAedFee || !intlAedFee || schedule.vatRate === null) return null;

  const qualifyingTiming = unique(terms.text, /^21\.2\.4 Within thirty \((\d+)\) days from receiving the Card, the Cardholder\n +must perform a successful Qualifying Expenditure, after which/gm);
  const standard = unique(terms.text, product.standard);
  const selfFunded = unique(terms.text, product.selfFunded);
  const oneTime = unique(terms.text, /^21\.2\.5 Subject to Condition 21\.2\.4,[\s\S]+?(?=^21\.2\.6 ADIB Smiles Visa Cardholders)/gm);
  const exclusions = unique(terms.text, /^21\.2\.7 Smiles Points shall not be earned[\s\S]+?(?=^21\.2\.8 +The Bank)/gm);
  if (!qualifyingTiming || !standard || !selfFunded || !oneTime || !exclusions) return null;
  const normalise = (s: string) => s.replace(/\s+/g, " ");
  const limits = normalise(oneTime[0]), excluded = normalise(exclusions[0]);
  if (!["on one-time basis only", "reapplies for any ADIB Smiles Card", "upgrade from Classic to Gold, Platinum or Signature or from Gold to Platinum or Signature"].every(t => limits.includes(t))
    || !["Cash withdrawals", "Finance and other fees or charges", "Card payments", "Any balance transferred to the Card Account", "Any Transaction above the Card Limit"].every(t => excluded.includes(t))) return null;
  const days = parseSourceNumber(qualifyingTiming[1]!);
  const nonSelfFundedPoints = parseSourceNumber(standard[1]!);
  const selfFundedPoints = parseSourceNumber(selfFunded[1]!);
  if (days !== 30 || nonSelfFundedPoints === null || selfFundedPoints === null || nonSelfFundedPoints <= selfFundedPoints) return null;

  return {
    scope: "detail-page-only",
    comparableFxRate: null,
    nonAedFee, intlAedFee, vatDefault: schedule.vatRate,
    tariffNotes: [pin(tariff, foot5), pin(tariff, foot6)],
    welcome: { daysFromReceipt: days, nonSelfFundedPoints, selfFundedPoints,
      evidence: [qualifyingTiming, standard, selfFunded, oneTime, exclusions].map(match => pin(terms, match)) },
  } as const;
}
