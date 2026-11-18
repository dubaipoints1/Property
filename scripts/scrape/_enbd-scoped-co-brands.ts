import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const host = "https://www.emiratesnbd.com";
const app = "https://apply.emiratesnbd.com";
const productBase = host + "/en/cards/credit-cards/";
export const ENBD_CO_BRAND_KFS = "https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf";
export const ENBD_CO_BRANDS = {
  "emirates-nbd-share-visa-platinum": {
    key: "share", name: "Emirates NBD SHARE Visa Platinum Credit Card",
    route: "share-visa-platinum-credit-card", heading: "SHARE Visa Platinum Credit Card",
    programme: "SHARE", programmeText: '<p class="fw-light fs-lg-32 fs-24 text-center">How you earn SHARE Points</p>',
    applicationPath: "/en/credit-card/maf/share-visa-platinum",
    applicationLabel: "get your card instantly",
    guideHref: host + "/-/media/enbd/files/others/fees-and-charges/cards/emiratesnbd_credit_card_fees_charges.pdf",
    kfsPosition: 11,
  },
  "emirates-nbd-u-by-emaar-signature": {
    key: "emaar", name: "Emirates NBD U by Emaar Visa Signature Credit Card",
    route: "u-by-emaar-signature-credit-card", heading: "U By Emaar Signature Credit Card",
    programme: "U by Emaar", programmeText: "<li>Earn<strong>&nbsp;Upoints&nbsp;</strong>on<strong>&nbsp;spends</strong>",
    applicationPath: "/en/credit-cards/ubyemaar/ube-signature",
    applicationLabel: "apply now",
    guideHref: "/-/media/enbd/files/credit-cards/emiratesnbd_credit_card_fees_charges.pdf",
    kfsPosition: 0,
  },
} as const;

type Source = {
  id: string;
  url: string;
  capturedAt: string;
  text: string;
  fixtureTextSha256: string;
  sourceBodySha256: string;
  sourceTextSha256: string;
  firstLine: number;
  sourceStartByte?: number;
  sourceScope?: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
};
const hex = /^[a-f0-9]{64}$/;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const trimSpaces = (s: string) => s.trim().replace(/\s+/g, " ");
const valueFrom = (s: string | undefined) => s === "Free" ? 0 : parseSourceNumber(s ?? "");
const kfsColumns = "UBE Signature Visa Flexi Lulu 247 Platinum Darna Select Lulu 247 Titanium noon One Duo dnata Platinum Platinum Go4it Platinum Go4it Gold SHARE Platinum";
const pLabel = '<p class="rates__box-desc fs-12 fw-400 text-gray mb-0">';
const networkTitle = "<title>U By Emaar Visa Signature Credit Cards | ubyemaar Credit Card | Emirates NBD</title>";
const same = (a: Source, b: Source) => a.capturedAt === b.capturedAt &&
  a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;

function sourceFrom(sources: readonly Source[], id: string, url: string, page?: number) {
  const rows = sources.filter(r => r.id === id);
  if (rows.length !== 1) return null;
  const s = rows[0];
  if (s.url !== url || typeof s.text !== "string" || !s.text
    || !Number.isFinite(Date.parse(s.capturedAt))
    || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256)
    || hash(s.text) !== s.fixtureTextSha256 || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  if (page !== undefined)
    return s.sourceRepresentation === "pdftotext-layout" && s.sourceScope === "PDF page " + page
      && s.sourceStartByte === undefined ? s : null;
  return s.sourceRepresentation === "http-decoded-response-body" && s.sourceTextSha256 === s.sourceBodySha256
    && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}

function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: "enbd/scoped-co-brands/v1", productScope, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}

function kfsFee(s: Source, section: "Joining" | "Renewal", column: number) {
  const lines = s.text.split("\n").map(trimSpaces);
  if (lines.length !== 5 || !lines[0].startsWith(section + " Priority Banking Infinite ")
      || !lines[1].startsWith("Fee (AED) ") || lines[2] || lines[3] !== kfsColumns) return null;
  const values = lines[4].split(" ");
  return values.length === 12 && values.every(v => valueFrom(v) !== null) ? valueFrom(values[column]) : null;
}

export function parseEnbdScopedCoBrands(sources: readonly Source[], slug: string) {
  if (!Object.hasOwn(ENBD_CO_BRANDS, slug)) return null;
  const t = ENBD_CO_BRANDS[slug as keyof typeof ENBD_CO_BRANDS];
  const productUrl = productBase + t.route;
  const guideUrl = new URL(t.guideHref, host).href;
  const application = app + t.applicationPath;
  const product = (role: string) => sourceFrom(sources, "enbd-" + t.key + "-" + role, productUrl);
  const heading = product("heading"), salary = product("salary"), headline = product("headline-fee");
  const cta = product("application"), programme = product("programme"), kfsLink = product("kfs-link"), guideLink = product("guide-link");
  const network = t.key === "share" ? heading : product("network");
  const joining = sourceFrom(sources, "enbd-kfs-joining", ENBD_CO_BRAND_KFS, 1);
  const renewal = sourceFrom(sources, "enbd-kfs-renewal", ENBD_CO_BRAND_KFS, 1);
  const guide = sourceFrom(sources, "enbd-" + t.key + "-guide", guideUrl, 1);
  if (!heading || !salary || !headline || !cta || !programme || !kfsLink || !guideLink || !network || !joining || !renewal || !guide ||
      ![salary, headline, cta, programme, kfsLink, guideLink, network].every(s => same(heading, s)) ||
      !same(joining, renewal) || joining.firstLine >= renewal.firstLine ||
      heading.text !== '<h1 class="card-banner__short-title">' + t.heading + "</h1>" ||
      (t.key === "emaar" && network.text !== networkTitle) ||
      !cta.text.startsWith('<a href="' + application + '" ') || !cta.text.includes('data-ctatext="' + t.applicationLabel + '" data-ctaregion="Main Banner"') ||
      programme.text !== t.programmeText ||
      !kfsLink.text.startsWith('<a href="' + ENBD_CO_BRAND_KFS + '" ') || !kfsLink.text.includes('data-ctatext="key facts statement kfs"') ||
      !guideLink.text.startsWith('<a href="' + t.guideHref + '" ') || !guideLink.text.includes('data-ctatext="fees and charges"')) return null;
  const salaryMatch = salary.text.match(new RegExp("^" + pLabel + "Minimum salary: AED (" + SOURCE_NUMBER + ")</p>$"));
  const publishedIncome = salaryMatch ? parseSourceNumber(salaryMatch[1]) : null;
  const joiningFee = kfsFee(joining, "Joining", t.kfsPosition);
  const annualFee = kfsFee(renewal, "Renewal", t.kfsPosition);
  if (publishedIncome === null || publishedIncome <= 0 || joiningFee === null || annualFee === null) return null;

  const tariff = guide.text.split("\n").map(trimSpaces);
  if (tariff.length !== (t.key === "share" ? 5 : 6)
      || tariff[0] !== "Credit Card Services and Price Guide (Inclusive of VAT)1"
      || tariff[1] !== "Primary Card Annual Fee3 (AED) Finance Charges2 (per month)") return null;
  if (t.key === "share") {
    if (joiningFee !== 0 || annualFee !== 0 ||
        headline.text !== pLabel + "Joining fee: Free for life / No Annual fee</p>" ||
        !/^SHARE Private\/Infinite\/Signature\/ [\d,.]+\/[\d,.]+\/Free\/$/.test(tariff[2]) ||
        !tariff[3].includes("/") || tariff[4] !== "Platinum Free") return null;
  } else {
    const exactFee = headline.text.match(new RegExp("^Joining fees: AED (" + SOURCE_NUMBER + ")</br>Annual fees: AED (" + SOURCE_NUMBER + ")$"));
    const feeRow = tariff[5].match(new RegExp("^U by Emaar Infinite/Signature/Family " + SOURCE_NUMBER + "/(" + SOURCE_NUMBER + ")/Free "));
    if (!exactFee || !feeRow || joiningFee <= annualFee || annualFee <= 0 ||
        parseSourceNumber(exactFee[1]) !== joiningFee || parseSourceNumber(exactFee[2]) !== annualFee ||
        parseSourceNumber(feeRow[1]) !== annualFee) return null;
  }
  const selected = [...new Set([heading, network, salary, headline, cta, programme, kfsLink, guideLink, joining, renewal, guide])];
  return {
    name: t.name, productUrl, application, kfsUrl: ENBD_CO_BRAND_KFS, guideUrl, network: "Visa" as const,
    programme: t.programme, publishedIncome, joiningFee, annualFee,
    sourceFixtureIds: selected.map(s => s.id), sources: [productUrl, ENBD_CO_BRAND_KFS, guideUrl],
    capturedDate: heading.capturedAt.slice(0, 10),
    evidence: {
      network: [pin(network, t.name, "Card network identity only", "not-applicable")],
      loyaltyProgram: [pin(programme, t.name, "Issuer rewards programme name only", "not-applicable")],
      joiningFee: [pin(joining, t.name, "AED named-card joining fee, separate from renewal", "not-applicable"),
        pin(headline, t.name, "Issuer product joining fee corroboration", "not-applicable")],
      annualFee: [pin(renewal, t.name, "AED named-card standard renewal fee", "not-applicable"),
        pin(guide, t.name, "AED standard primary annual fee inclusive of VAT", "inclusive")],
      "eligibility.publishedMinMonthlyIncome": [pin(salary, t.name, "AED published minimum salary, not a qualification decision", "not-applicable")],
    },
  };
}
