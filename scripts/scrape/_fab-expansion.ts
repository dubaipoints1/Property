import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const BASE = "https://www.bankfab.com";
const MATERIAL = BASE + "/-/media/fab-uds/personal/";
export const FAB_SOC = MATERIAL + "credit-cards/fees-and-charges/credit-card.pdf?view=1";
export const FAB_KFS = MATERIAL + "key-facts-statements/credit-cards/fab-consolidated-credit-cards-en.pdf?view=1";
const ADNOC_TERMS = MATERIAL + "terms-and-conditions-consolidated/fab-reward-programmes/adnoc-rewards-terms-and-conditions-en.pdf?view=1";
const GEMS_FAQ = MATERIAL + "terms-and-conditions-consolidated/card-specific/fab-gems-world-credit-card-faqs_en.pdf?view=1";
export const FAB_EXPANSION_PRODUCTS = {
  "fab-adnoc-rewards": ["adnoc", "fab-adnoc-rewards-credit-card", "FAB ADNOC Rewards", "FAB ADNOC Rewards Credit Card", "Annual Fee", "DF6FCFE8-3C42-4A2E-953B-6D57E609522D"],
  "fab-gems-world": ["gems", "gems-world", "FAB GEMS World", "FAB GEMS World Credit Card", "Annual Fees\\*\\*", "B9B7BEBC-6FAF-40CA-8892-43D8935379DE"],
  "fab-travel": ["travel", "fab-travel-credit-card", "FAB Travel", "FAB Travel Card", "Annual Fees", "38A79F47-0BA2-422C-94DC-9057C5372921"],
} as const;
type Source = { id: string; url: string; capturedAt: string; representation: string; sourceBodySha256: string;
  sourceTextSha256?: string; fixtureTextSha256: string; text: string; firstLine?: number; sourceStartByte?: number; page?: number };
const sha = (t: string) => createHash("sha256").update(t).digest("hex");
const hex = /^[0-9a-f]{64}$/;
function source(inputs: Source[], id: string, url: string) {
  const found = inputs.filter(s => s.id === id);
  const s = found.length === 1 ? found[0] : undefined;
  return s?.url === url && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s.capturedAt)
    && Number.isFinite(Date.parse(s.capturedAt)) && hex.test(s.sourceBodySha256)
    && typeof s.text === "string" && s.text.length > 0 && sha(s.text) === s.fixtureTextSha256 ? s : null;
}
function html(s: Source | null, body?: string): s is Source {
  return !!s && s.representation === "contiguous issuer HTML excerpt" && (!body || s.sourceBodySha256 === body)
    && Number.isSafeInteger(s.firstLine) && s.firstLine! > 0 && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0;
}
function pdf(s: Source | null, page: number): s is Source {
  return !!s && s.representation === "issuer PDF page text via pdfplumber" && s.page === page
    && hex.test(s.sourceTextSha256 ?? "") && Number.isSafeInteger(s.firstLine) && s.firstLine! > 0;
}
function evidence(s: Source, productScope: string, unit: string) {
  return {
    parserId: "fab/product-schedule-and-supplements/v1", productScope, unit, vatTreatment: "not-applicable" as const,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceBodySha256,
    sourceRepresentation: "http-decoded-response-body" as const, sourceExtraction: "http-decoded-html-excerpt" as const,
    captureMethod: "public-http-reader" as const, firstLine: s.firstLine!, lastLine: s.firstLine! + s.text.split("\n").length - 1,
    sourceStartByte: s.sourceStartByte!, sourceEndByte: s.sourceStartByte! + Buffer.byteLength(s.text), rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
function amount(s: string, label: string) {
  const m = s.match(new RegExp(`^<h2 class="infographic-heading">\\ueadf (${SOURCE_NUMBER})</h2><div class="global-rich-text infographic-text"><p>${label}</p>$`));
  return parseSourceNumber(m?.[1] ?? "");
}

export function parseFabExpansion(inputs: Source[], slug: string) {
  if (!Object.hasOwn(FAB_EXPANSION_PRODUCTS, slug)) return null;
  const [key, path, rowName, name, feeLabel, id] = FAB_EXPANSION_PRODUCTS[slug as keyof typeof FAB_EXPANSION_PRODUCTS];
  const productUrl = `${BASE}/en-ae/personal/credit-cards/${path}`;
  const item = (role: string) => source(inputs, `fab-${key}-${role}`, productUrl);
  const identity = item("identity"), minimum = item("salary"), productFee = item("fee"), apply = item("apply"), network = item("network");
  if (!html(identity) || !html(minimum, identity.sourceBodySha256) || !html(productFee, identity.sourceBodySha256)
      || !html(apply, identity.sourceBodySha256) || !html(network, identity.sourceBodySha256)
      || !new RegExp(`^<title data-react-helmet="true">${name} - [^<]+</title>$`).test(identity.text)
      || apply.text !== `https://apply.bankfab.com/en-ae/?card=${id}&amp;tst_id=null#apply-now`
      || !(key === "adnoc" ? network.text.includes("FAB ADNOC Rewards World Mastercard")
        : (key === "gems" ? /\/world-mastercard-lounge-program-dp\// : /\/world-elite-mastercard-lounge-program-dp\//).test(network.text))) return null;
  const soc = source(inputs, "fab-fee-schedule", FAB_SOC);
  const kfs = source(inputs, "fab-kfs-disclosure", FAB_KFS);
  if (!soc || soc.representation !== "named issuer PDF table cells via pdfplumber" || soc.page !== 1 || !pdf(kfs, 1)
      || !soc.text.startsWith("| Annual Membership Fee (AMF) Inclusive of VAT |  |  |\nCard Type |  | Primary Card (D) | Supplementary Card (D) |\n")) return null;
  const row = [...soc.text.matchAll(new RegExp(`^${rowName} \\|  \\| (${SOURCE_NUMBER}) \\| Free \\|$`, "gm"))];
  const annualFee = row.length === 1 ? parseSourceNumber(row[0][1]) : null;
  const headlineFee = amount(productFee.text, feeLabel), publishedIncome = amount(minimum.text, "Minimum Monthly Salary");
  // Independently confirm the stated gross fee fits the product headline.
  // Publish the Schedule amount, not an inferred tax calculation.
  if (headlineFee === null || annualFee === null || headlineFee <= 0 || publishedIncome === null || publishedIncome <= 0
      || Math.round(headlineFee * 105) / 100 !== annualFee) return null;

  const selected = [identity, minimum, productFee, apply, network, soc, kfs];
  let waiver: { threshold: number; kind: "adnoc" | "gems" } | undefined;
  let gemsWaiverEvidence: ReturnType<typeof evidence> | undefined;
  if (key === "adnoc") {
    const s = source(inputs, "fab-adnoc-waiver", ADNOC_TERMS);
    if (!pdf(s, 5)) return null;
    const terms = s.text.replace(/\s+/g, " ");
    const spend = terms.match(new RegExp(`^7\\.3\\. The Annual Membership fee in \\(section 7\\.2\\) is charged in the first year and waived from the second year if the Cardholder spends a total of AED (${SOURCE_NUMBER}) or more on retail purchases in the previous twelve months from the Card issuance anniversary date\\. 7\\.4\\. FAB and ADNOC employees are exempted from paying Annual Membership fees\\. Should a Cardholder no longer be employed by FAB or ADNOC, the standard Annual Membership fees will then apply with effect from the following Card issuance anniversary date\\.$`));
    const threshold = parseSourceNumber(spend?.[1] ?? "");
    if (threshold === null || threshold <= 0) return null;
    selected.push(s); waiver = { threshold, kind: "adnoc" };
  }
  if (key === "gems") {
    const faq = source(inputs, "fab-gems-waiver", GEMS_FAQ), publicWaiver = item("waiver-product");
    if (!pdf(faq, 1) || !html(publicWaiver, identity.sourceBodySha256)) return null;
    const clause = publicWaiver.text.match(new RegExp(`^<p><small>\\*\\*Enjoy no annual fee if you spend \\ueadf (${SOURCE_NUMBER}) or more on non-educational spending in the previous year\\.</small></p>$`));
    const example = faq.text.replace(/\s+/g, " ").match(new RegExp(`^For new to bank customers onboarded on or after 21st December 2023, the card is free for the first year\\. AMF will be the assessed only after their first anniversary onwards\\. For example, .+? if spends of AED(${SOURCE_NUMBER}) are not made during the year \\(i\\.e\\. .+?\\) on non-educational spends\\.$`));
    const threshold = parseSourceNumber(clause?.[1] ?? "");
    if (threshold === null || threshold <= 0 || threshold !== parseSourceNumber(example?.[1] ?? "")) return null;
    selected.push(faq, publicWaiver); waiver = { threshold, kind: "gems" };
    gemsWaiverEvidence = evidence(publicWaiver, name, "AED prior-year non-educational spending only; FAQ covers new-to-bank first-year offer separately");
  }
  let travelFxNote = false;
  let scopedTravelFxEvidence: ReturnType<typeof evidence> | undefined;
  if (key === "travel") {
    const document = source(inputs, "fab-travel-fx", FAB_KFS), listing = item("fx-product");
    if (!pdf(document, 1) || document.sourceBodySha256 !== kfs.sourceBodySha256 || document.sourceTextSha256 !== kfs.sourceTextSha256
        || !html(listing, identity.sourceBodySha256)
        || document.text !== "*Travel card: Bank charges and scheme charges not applicable | Z card: Bank charges waived but Scheme charges applicable"
        || listing.text !== "<p>Pay no international transaction fees and no hidden scheme or bank charges when using your FAB Travel Card abroad or online in foreign currency spends.</p>") return null;
    selected.push(document, listing); travelFxNote = true;
    scopedTravelFxEvidence = evidence(listing, name, "Issuer and scheme international-transaction charges, not merchant conversion or the total transaction cost");
  }
  return { name, productUrl, kfsUrl: FAB_KFS, annualFee, publishedIncome, waiver, travelFxNote,
    capturedDate: identity.capturedAt.slice(0, 10), sourceFixtureIds: selected.map(s => s.id),
    sources: [...new Set(selected.map(s => s.url))],
    evidence: { annualFee: [evidence(productFee, name, "AED product-page headline; gross amount cross-checked against Schedule")],
      "eligibility.publishedMinMonthlyIncome": [evidence(minimum, name, "AED monthly published salary floor; does not establish full eligibility")],
      ...(gemsWaiverEvidence ? { annualFeeWaiver: [gemsWaiverEvidence] } : {}),
      ...(scopedTravelFxEvidence ? { fxFee: [scopedTravelFxEvidence] } : {}),
    },
  };
}
