// Bounded public-source replay. No promotions, inferred eligibility or FX.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const HOST = "https://www.bankfab.com";
const MATERIAL = HOST + "/-/media/fab-uds/personal/";
export const FAB_WAVE2_SOC = MATERIAL + "credit-cards/fees-and-charges/credit-card.pdf?view=1";
export const FAB_WAVE2_KFS = MATERIAL + "key-facts-statements/credit-cards/fab-consolidated-credit-cards-en.pdf?view=1";
const DU_TERMS = MATERIAL + "terms-and-conditions-consolidated/card-specific/ducreditcard_tnc.pdf?view=1";
const INDULGE_TERMS = MATERIAL + "credit-cards/fab-rewards-indulge/pdf/card-benefits-terms-and-conditions.pdf?view=1";
const ACTIVE_TERMS = MATERIAL + "credit-cards/fab-rewards-active-credit-card/documents/card-benefits-terms-and-conditions-en.pdf?view=1";
export const FAB_REWARDS_WAVE2_PRODUCTS = {
  "fab-du-titanium": { key: "du", name: "FAB du Titanium Credit Card", row: "du Titanium", title: "du Credit Card - ", path: "du-credit-card", target: "65DA62FC-4FEB-4923-A00F-3E17B3B7C057" },
  "fab-rewards-indulge": { key: "indulge", name: "FAB Rewards Indulge Credit Card", row: "FAB Rewards Indulge", title: "FAB Rewards Indulge Card - ", path: "fab-rewards-indulge-card", target: "DDFD691E-C1A5-45A4-89E8-D58E3D7E6A2C" },
  "fab-rewards-active": { key: "active", name: "FAB Rewards Active Credit Card", row: "FAB Rewards Active", title: "Apply for the FAB Rewards Active Credit Card | ", path: "fab-rewards-active-credit-card", target: "5265CE79-3AC7-4E2B-80E0-00DB700B85F7" },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; page?: number; representation: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
};
const hex = /^[a-f0-9]{64}$/;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function select(sources: Source[], id: string, url: string, page?: number) {
  const rows = sources.filter(s => s.id === id);
  if (rows.length !== 1) return null;
  const s = rows[0];
  if (s.url !== url || typeof s.text !== "string" || !s.text ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt)) ||
      !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256) || s.fixtureTextSha256 !== hash(s.text) ||
      !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  if (page !== undefined) return s.page === page && s.sourceRepresentation === "pdftotext-layout" &&
    s.representation === "contiguous issuer PDF layout excerpt" && s.sourceStartByte === undefined && s.sourceScope ? s : null;
  return s.sourceRepresentation === "http-decoded-response-body" && s.representation === "contiguous issuer HTML excerpt" &&
    s.sourceBodySha256 === s.sourceTextSha256 && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
function sameBody(a: Source, b: Source) {
  return a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
}
const infographic = '<h2 class="infographic-heading">';
const infographicLabel = '</h2><div class="global-rich-text infographic-text"><p>';
function visibleAmount(text: string, label: string) {
  const match = text.match(new RegExp("^" + infographic + "\\ueadf (" + SOURCE_NUMBER + ")" + infographicLabel + label + "</p>$"));
  return match ? parseSourceNumber(match[1]) : null;
}
function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: "fab/rewards-wave2-issuer-fees/v1", productScope, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256, sourceBodySha256: s.sourceBodySha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
export function parseFabRewardsWave2(sources: Source[], slug: string) {
  if (!Object.hasOwn(FAB_REWARDS_WAVE2_PRODUCTS, slug)) return null;
  const t = FAB_REWARDS_WAVE2_PRODUCTS[slug as keyof typeof FAB_REWARDS_WAVE2_PRODUCTS];
  const productUrl = HOST + "/en-ae/personal/credit-cards/" + t.path;
  const onPage = (role: string) => select(sources, t.key + "-" + role, productUrl);
  const identity = onPage("identity"), salary = onPage("salary"), headlineFee = onPage("headline-fee"), apply = onPage("apply");
  const columns = select(sources, "fab-fee-columns", FAB_WAVE2_SOC, 1);
  const feeRow = select(sources, t.key + "-fee-row", FAB_WAVE2_SOC, 1);
  const kfs = select(sources, "fab-kfs-fee-delegation", FAB_WAVE2_KFS, 1);
  if (!identity || !salary || !headlineFee || !apply || !columns || !feeRow || !kfs
    || ![salary, headlineFee, apply].every(s => sameBody(s, identity))
    || !identity.text.startsWith('<title data-react-helmet="true">' + t.title) || !identity.text.endsWith("</title>")
    || apply.text !== "https://apply.bankfab.com/en-ae/?card=" + t.target + "&amp;tst_id=null#apply-now"
    || !sameBody(columns, feeRow) || columns.firstLine >= feeRow.firstLine
    || !/^Annual Membership Fee \(AMF\) Inclusive of VAT Primary Card Supplementary Card Card Type \(D \) \(D \)$/.test(columns.text.trim().replace(/\s+/g, " "))
    || !/^Annual Membership Fee\/Renewal Fee The Annual Membership Fee\/Renewal Fee is payable as prescribed by FAB in the SoF \(Schedule of Fees\), for the Customer’s Credit Card and each Supplementary Credit Card upon issuance or renewal$/.test(kfs.text.trim().replace(/\s+/g, " "))) return null;
  const [rowName, primary, supplementary, extra] = feeRow.text.trim().split(/ {2,}/);
  const annualFee = primary === "Free" ? 0 : parseSourceNumber(primary ?? "");
  const publishedIncome = visibleAmount(salary.text, "Minimum Monthly Salary");
  if (rowName !== t.row || supplementary !== "Free" || extra || annualFee === null || publishedIncome === null || publishedIncome <= 0) return null;
  if (t.key === "active") {
    const preTaxHeadline = visibleAmount(headlineFee.text, "Annual Fee");
    // Reconcile the headline, but publish the issuer's actual gross tariff.
    if (preTaxHeadline === null || preTaxHeadline <= 0 || Math.round(preTaxHeadline * 105) / 100 !== annualFee) return null;
  } else if (annualFee !== 0 || headlineFee.text !== infographic + "No Annual Fees" + infographicLabel + "Annual Fees</p>") return null;
  const selected = [identity, salary, headlineFee, apply, columns, feeRow, kfs];
  if (t.key === "du") {
    const network = onPage("network"), hold = onPage("reward-hold"), subscriber = select(sources, "du-subscriber-limit", DU_TERMS, 1);
    if (!network || !hold || !subscriber || !sameBody(network, identity) || !sameBody(hold, identity)
      || !network.text.includes("/titanium-mastercard-lounge-program-dp/")
      || !hold.text.startsWith("Reimbursement is awarded in the form of FAB Rewards and capped at ")
      || !hold.text.endsWith("in the previous month to benefit.")
      || subscriber.text.trim().replace(/\s+/g, " ") !== "card. An applicant for a Card does not need to be an existing customer of du to apply for a Card.") return null;
    selected.push(network, hold, subscriber);
  } else if (t.key === "indulge") {
    const network = onPage("network"), art = onPage("card-art-source");
    const terms = select(sources, "indulge-terms-name", INDULGE_TERMS, 1);
    // The issuer HTML ties its card artwork and Mastercard link to this exact
    // named product. The artwork is not rendered or republished by us.
    if (!network || !art || !terms || !sameBody(network, identity) || !sameBody(art, identity)
      || !network.text.includes('href="http://fulfillsolutions.com/mastercard"')
      || !art.text.includes("/fab-rewards-indulge/fab-rewards-indulge-cc-double.png?")
      || terms.text.trim().replace(/\s+/g, " ") !== "FAB REWARDS INDULGE CARD BENEFITS TERMS & CONDITIONS") return null;
    selected.push(network, art, terms);
  } else {
    const network = select(sources, "active-network", ACTIVE_TERMS, 2);
    const gym = select(sources, "active-gym-terms", ACTIVE_TERMS, 2);
    if (!network || !gym || !sameBody(network, gym) || !/FAB Mastercard Credit Cards terms and conditions apply\.$/.test(network.text)
      || !gym.text.includes("minimum spend requirement") || !gym.text.includes("visit will become chargeable")) return null;
    selected.push(network, gym);
  }
  return {
    name: t.name, annualFee, publishedIncome, productUrl, kfsUrl: FAB_WAVE2_KFS,
    sourceFixtureIds: selected.map(s => s.id), sources: [...new Set(selected.map(s => s.url))],
    capturedDate: identity.capturedAt.slice(0, 10),
    evidence: {
      annualFee: [pin(feeRow, t.name, "AED standard primary annual membership fee", "inclusive"), pin(columns, t.name, "VAT-inclusive primary and supplementary membership columns", "inclusive")],
      "eligibility.publishedMinMonthlyIncome": [pin(salary, t.name, "AED monthly salary published by issuer; not full eligibility", "not-applicable")],
    },
  };
}
