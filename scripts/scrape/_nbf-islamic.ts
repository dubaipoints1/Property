import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const ORIGIN = "https://nbfislamic.ae";
export const NBF_ISLAMIC = {
  "nbf-islamic-visa-infinite": {
    tier: "infinite", route: "infinite-credit-card", name: "NBF Islamic Visa Infinite Credit Card",
    heading: "NBF Islamic Infinite Credit Card", kfsTier: "Infinite", feePage: 2,
    programmeHeading: "Experience a World of Exclusive Benefits with NBF Rewards", priority: true,
  },
  "nbf-islamic-platinum-exclusive": {
    tier: "platinum", route: "platinum-exclusive-credit-card", name: "NBF Islamic Platinum Exclusive Credit Card",
    heading: "Islamic Platinum <br>Exclusive Credit Card", kfsTier: "Platinum", feePage: 3,
    programmeHeading: "Earn Rewards Effortlessly with NBF Rewards", priority: false,
  },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; sourceRepresentation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string;
};
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const sha = /^[a-f0-9]{64}$/;
const salaryPattern = new RegExp("^[ \\t]*Minimum salary[ \\t]+AED[ \\t]+(" + SOURCE_NUMBER + ")( or priority status with NBF)?[ \\t]*$");

export function parseNbfIslamic(input: Source[], slug: string) {
  if (!Object.hasOwn(NBF_ISLAMIC, slug)) return null;
  const p = NBF_ISLAMIC[slug as keyof typeof NBF_ISLAMIC];
  const productUrl = ORIGIN + "/personal/cards/" + p.route + "/";
  const application = productUrl + "apply/";
  const kfsUrl = ORIGIN + "/wp-content/uploads/2025/11/KFS_NBF-Islamic-" + p.kfsTier + "-Credit-Card-27102025.pdf";
  const found: Source[] = [];
  function source(key: string, page?: number) {
    const candidates = input.filter(s => s.id === "nbf-islamic-" + p.tier + "-" + key);
    const s = candidates[0];
    if (candidates.length !== 1 || !s || s.url !== (page ? kfsUrl : productUrl)
        || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256) || s.fixtureTextSha256 !== digest(s.text)
        || !Number.isFinite(Date.parse(s.capturedAt)) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
    if (page ? s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== "PDF page " + page || s.sourceStartByte !== undefined
      : s.sourceRepresentation !== "http-decoded-response-body" || s.sourceTextSha256 !== s.sourceBodySha256
        || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    found.push(s);
    return s;
  }
  const heading = source("heading"), apply = source("apply"), programme = source("programme");
  const title = source("kfs-title", 1), network = source("kfs-network", 1);
  const salary = source("kfs-salary", 1), fees = source("kfs-fee", p.feePage);
  if (!heading || !apply || !programme || !title || !network || !salary || !fees) return null;
  const sameCapture = (a: Source, b: Source) => a.capturedAt === b.capturedAt
    && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
  if (![apply, programme].every(s => sameCapture(heading, s)) || ![network, salary, fees].every(s => sameCapture(title, s))
      || heading.text !== '<h1 class="elementor-heading-title elementor-size-default">' + p.heading + '</h1>'
      || !apply.text.startsWith('<a class="elementor-button elementor-button-link elementor-size-sm" href="/personal/cards/' + p.route + '/apply/">')
      || !/^\s*<span class="elementor-button-content-wrapper">\s*<span class="elementor-button-text">Apply Now<\/span>\s*<\/span>\s*<\/a>$/.test(apply.text.slice(apply.text.indexOf(">") + 1))
      || apply.sourceStartByte! - heading.sourceStartByte! <= 0 || apply.sourceStartByte! - heading.sourceStartByte! > 2500
      || programme.sourceStartByte! <= apply.sourceStartByte!
      || programme.text !== '<div class="e-n-accordion-item-title-text"> ' + p.programmeHeading + ' </div>'
      || title.text.trim() !== "NBF ISLAMIC " + p.kfsTier.toUpperCase() + " CREDIT CARD"
      || network.text.trim() !== "•   " + p.kfsTier + " Cards qualify for offers, discounts and benefits from Visa"
      || !/^[ \t]*Annual fee[ \t]+Lifetime free[ \t]*$/.test(fees.text)) return null;
  const match = salary.text.match(salaryPattern);
  const income = match ? parseSourceNumber(match[1]) : null;
  if (income === null || income <= 0 || Boolean(match?.[2]) !== p.priority) return null;
  const pin = (s: Source, unit: string, vatTreatment: "not-applicable") => ({
    parserId: "nbf-islamic/named-tiers/v1", productScope: p.name, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, ...(s.sourceStartByte === undefined
      ? { sourceExtraction: "pdftotext-layout", sourceScope: s.sourceScope }
      : { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    captureMethod: "public-http-reader", firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  return { name: p.name, productUrl, application, kfsUrl, capturedDate: heading.capturedAt.slice(0, 10),
    annualFee: 0, income, priority: p.priority, loyaltyProgram: "NBF Rewards", network: "Visa",
    ids: found.map(s => s.id), sources: [productUrl, application, kfsUrl],
    evidence: {
      annualFee: [pin(fees, "AED standard annual membership fee", "not-applicable")],
      [p.priority ? "eligibility" : "eligibility.publishedMinMonthlyIncome"]:
        [pin(salary, p.priority ? "AED monthly salary route or NBF Priority status" : "AED published minimum salary for salaried applicants", "not-applicable")],
      loyaltyProgram: [pin(programme, "Issuer programme name only", "not-applicable")],
      network: [pin(network, "Network identity, not benefits acceptance", "not-applicable")],
    },
  };
}
