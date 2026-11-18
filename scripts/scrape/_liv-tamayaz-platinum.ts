import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const BASE = "https://www.liv.me";
export const LIV_TAMAYAZ_PLATINUM = {
  slug: "liv-tamayaz-platinum",
  name: "Liv Tamayaz Platinum Credit Card",
  productUrl: BASE + "/en/liv-tamayaz-credit-card",
  kfsUrl: BASE + "/-/media/liv/website/pdf/kfs/liv_tamayaz_credit_card_kfs.pdf",
  generalKfsUrl: BASE + "/-/media/liv/website/pdf/2024/kfs/apr/liv-credit-card-key-facts-statement-kfs-english.pdf",
  featuresUrl: BASE + "/en/important-information/features/liv-tamayaz-credit-card-feature",
  faqUrl: BASE + "/en/ways-of-banking/get-support",
  familyApplicationUrl: "https://apply.liv.me/en/credit-card/union-coop",
} as const;
const c = LIV_TAMAYAZ_PLATINUM;
const SHA = /^[0-9a-f]{64}$/;
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const trim = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const expectedColumns = ["Product Type", "Cashback Card", "Cashback+ Card",
  "Tamayaz Platinum", "Tamayaz World", "Tamayaz World Elite"];
type Source = {
  id: string; url: string; capturedAt: string; text: string; sourceRepresentation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string;
};
function select(input: Source[], key: string, url: string, pdf = false) {
  const matches = input.filter(s => s.id === c.slug + "-" + key);
  const s = matches[0];
  if (matches.length !== 1 || !s || s.url !== url || !SHA.test(s.sourceBodySha256)
      || !SHA.test(s.sourceTextSha256) || s.fixtureTextSha256 !== digest(s.text)
      || !Number.isFinite(Date.parse(s.capturedAt)) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  return pdf ? s.sourceRepresentation === "pdftotext-layout" && s.sourceScope === "PDF page 1; Poppler pdftotext -layout"
    && s.sourceStartByte === undefined ? s : null
    : s.sourceRepresentation === "http-decoded-response-body" && s.sourceTextSha256 === s.sourceBodySha256
      && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
const sameCapture = (a: Source, b: Source) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;

function readKfs(s: Source) {
  const rows = s.text.split("\n");
  const heading = rows.find(row => /^\s*Product Type\s{2,}/.test(row));
  if (!/^\s*January 2026\s*$/.test(rows[0]) || !heading) return null;
  const columns = heading.trim().split(/\s{2,}/);
  if (columns.join("|") !== expectedColumns.join("|")) return null;
  const row = (label: string) => {
    const hits = rows.map(line => line.trim().split(/\s{2,}/)).filter(cells => cells[0] === label);
    return hits.length === 1 && hits[0].length === expectedColumns.length ? hits[0] : null;
  };
  const salary = row("Eligibility Criteria – Min. Salary");
  const join = row("Joining Fee*");
  const renewal = row("Renewal Fee");
  const cell = expectedColumns.indexOf("Tamayaz Platinum");
  const amount = salary?.[cell].match(new RegExp("^AED (" + SOURCE_NUMBER + ")$"))?.[1];
  const income = amount ? parseSourceNumber(amount) : null;
  if (!income || join?.[cell] !== "Free for life" || renewal?.[cell] !== "Free for life"
      || !rows.some(r => /Age Requirement:/.test(r))
      || !rows.some(r => /Debt Burden Ratio:/.test(r)) || !rows.some(r => /A good credit score \(AECB score\)/.test(r))) return null;
  return { income, annualFee: 0, joiningFee: 0,
    salaryRow: "Eligibility Criteria – Min. Salary", joiningRow: "Joining Fee*", renewalRow: "Renewal Fee" };
}

export function parseLivTamayazPlatinum(input: Source[], slug: string) {
  if (slug !== c.slug) return null;
  const heading = select(input,"product-heading",c.productUrl), tier = select(input,"product-tier",c.productUrl);
  const cta = select(input,"product-apply",c.productUrl);
  const kfs = select(input,"named-kfs",c.kfsUrl,true), general = select(input,"general-kfs",c.generalKfsUrl,true);
  const mastercard = select(input,"features-network",c.featuresUrl), points = select(input,"features-points",c.featuresUrl);
  const redemption = select(input,"features-redemption",c.featuresUrl), route = select(input,"faq-route",c.faqUrl);
  const applicants = select(input,"faq-applicants",c.faqUrl), redeem = select(input,"faq-redemption",c.faqUrl);
  if (!heading || !tier || !cta || !kfs || !general || !mastercard || !points || !redemption || !route || !applicants || !redeem
      || ![cta,tier].every(s => sameCapture(heading,s)) || ![points,redemption].every(s => sameCapture(mastercard,s))
      || ![applicants,redeem].every(s=>sameCapture(route,s)) || trim(heading.text) !== "Your Everyday, Upgraded with Liv Tamayaz Credit Cards"
      || trim(tier.text) !== "Tamayaz Platinum Credit Card"
      || !cta.text.startsWith('<a href="javascript: utmRedirect(&#39;' + c.familyApplicationUrl + '&#39;) "')
      || trim(cta.text) !== "Apply Now"
      || trim(mastercard.text) !== "Liv Tamayaz Platinum Mastercard Credit Card"
      || !points.text.includes("<strong>Tamayaz Points</strong>") || !points.text.includes("means the loyalty currency")
      || !/only available at Union Cooperative stores and e-commerce purchases\./.test(trim(redemption.text))
      || !/Both salaried and self-employed customers can apply for the card\./.test(trim(applicants.text))
      || !/redeem these points.*at Union Coop store or online/.test(trim(redeem.text))
      || !route.text.includes('href="/en/liv-tamayaz-credit-card"')
      || !/via the Liv X mobile app or from the Liv website/.test(trim(route.text))) return null;
  const facts = readKfs(kfs), check = readKfs(general);
  if (!facts || !check || facts.income !== check.income || facts.annualFee !== check.annualFee || facts.joiningFee !== check.joiningFee
      || kfs.sourceBodySha256 === general.sourceBodySha256) return null;
  const pin = (s: Source, unit: string) => ({
    parserId: "liv/tamayaz-platinum/v1", productScope: c.name, unit, vatTreatment: "not-applicable" as const,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, ...(s.sourceStartByte === undefined
      ? { sourceExtraction: "pdftotext-layout", sourceScope: s.sourceScope }
      : { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    captureMethod: "public-http-reader", firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  const pinRow = (s: Source, field: string, unit: string) => {
    const rows = s.text.split("\n");
    const index = rows.findIndex(row=>row.trim().split(/\s{2,}/)[0]===field);
    return pin({ ...s, text:rows[index], firstLine:s.firstLine+index, fixtureTextSha256:digest(rows[index]) },unit);
  };
  return { income:facts.income, annualFee:facts.annualFee, joiningFee:facts.joiningFee, productUrl:c.productUrl,
    kfsUrl:c.kfsUrl, date:heading.capturedAt.slice(0,10), name:c.name,
    network:"Mastercard", loyaltyProgram:"Tamayaz Points",
    sources:[c.productUrl,c.kfsUrl,c.generalKfsUrl,c.featuresUrl,c.faqUrl],
    ids:[heading,tier,cta,kfs,general,mastercard,points,redemption,route,applicants,redeem].map(s=>s.id),
    evidence:{
      annualFee:[kfs,general].map(s=>pinRow(s,facts.renewalRow,"AED standard renewal fee from second year")),
      joiningFee:[kfs,general].map(s=>pinRow(s,facts.joiningRow,"AED standard first-year joining fee")),
      "eligibility.publishedMinMonthlyIncome":[kfs,general].map(s=>pinRow(s,facts.salaryRow,"AED published minimum salary, not qualification")),
      eligibility:[pin(applicants,"Card-family salaried or self-employed application routes")],
      loyaltyProgram:[pin(points,"Issuer programme currency"),pin(redeem,"Union Coop redemption scope only")],
      network:[pin(mastercard,"Exact tier and Mastercard identity")],
    },
  };
}
