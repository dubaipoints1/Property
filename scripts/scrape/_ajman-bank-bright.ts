import { createHash } from "node:crypto";

const home = "https://www.ajmanbank.ae/site/";
export const brightKfs = home + "files/KFS_CREDIT_CARD_MAY_2025.pdf";
export const brightTariff = home + "tariff-of-charges-retail.html";
export const brightTiers = {
  "ajman-bank-bright-titanium": { name: "Titanium", column: 1, feeLine: 29 },
  "ajman-bank-bright-platinum": { name: "Platinum", column: 2, feeLine: 32 },
  "ajman-bank-bright-world": { name: "World", column: 3, feeLine: 35 },
} as const;

type Evidence = {
  id: string;
  url: string;
  representation: "pdftotext-layout" | "http-decoded-response-body";
  capturedAt: string;
  sourceBodySha256: string;
  sourceTextSha256: string;
  text: string;
  fixtureTextSha256: string;
  firstLine: number;
  sourceScope?: string;
  sourceStartByte?: number;
};

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hash = /^[a-f0-9]{64}$/;
const sameBody = (a: Evidence, b: Evidence) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
const fee = (s: string) => s === "Free for Life" || s === "Free for life" ? 0
  : /^(?:[1-9]\d?|[1-9]\d{0,2},\d{3})$/.test(s) ? Number(s.replaceAll(",", "")) : null;

/** Reproduce the exact standard primary annual fee. No other product terms enter L2. */
export function parseAjmanBankBright(input: readonly Evidence[], slug: string) {
  if (!Object.hasOwn(brightTiers, slug)) return null;
  const tier = brightTiers[slug as keyof typeof brightTiers];
  const name = "Ajman Bank BRight " + tier.name + " Credit Card";
  const productUrl = home + "bright-" + tier.name.toLowerCase() + ".html";
  const pick = (id: string, url: string, representation: Evidence["representation"]) => {
    const items = input.filter(s => s.id === id);
    const s = items[0];
    if (items.length !== 1 || !s || s.url !== url || s.representation !== representation
      || !s.text || sha(s.text) !== s.fixtureTextSha256 || !hash.test(s.sourceBodySha256)
      || !hash.test(s.sourceTextSha256) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt)
      || !Number.isFinite(Date.parse(s.capturedAt))) return null;
    if (representation === "http-decoded-response-body") {
      if (s.sourceBodySha256 !== s.sourceTextSha256 || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    } else if (s.sourceStartByte !== undefined || !s.sourceScope) return null;
    return s;
  };
  const html = "http-decoded-response-body", pdf = "pdftotext-layout";
  const heading = pick(slug+"-heading", productUrl, html);
  const offer = pick(slug+"-shared-cta", productUrl, html);
  const kfsLink = pick(slug+"-kfs-link", productUrl, html);
  const tariffLink = pick(slug+"-tariff-link", productUrl, html);
  const family = pick("bright-kfs-family", brightKfs, pdf);
  const feeTable = pick("bright-kfs-fee-heading", brightKfs, pdf);
  const feeLine = pick(slug+"-kfs-primary-fee", brightKfs, pdf);
  const tax = pick("bright-kfs-vat-and-period", brightKfs, pdf);
  const tariffHead = pick("bright-tariff-heading", brightTariff, html);
  const tariff = pick("bright-tariff-primary-fee", brightTariff, html);
  if (!heading || !offer || !kfsLink || !tariffLink || !family || !feeTable || !feeLine || !tax || !tariffHead || !tariff
    || ![offer, kfsLink, tariffLink].every(s => sameBody(s, heading))
    || ![feeTable, feeLine, tax].every(s => sameBody(s, family))
    || !sameBody(tariffHead, tariff) || !(tariff.sourceStartByte! > tariffHead.sourceStartByte!
      && tariff.sourceStartByte! - tariffHead.sourceStartByte! < 2000)
    || ![family, tariff].every(s => s.capturedAt.slice(0,10) === heading.capturedAt.slice(0,10))
    || !heading.text.includes(">BRight "+tier.name+"</h2>")
    || !/class="applyNowNew"[^>]* href="\.\.\/site\/Mastercard\/en">Apply now<\/a>/.test(offer.text)
    || !kfsLink.text.includes('href="'+brightKfs+'"')
    || !tariffLink.text.includes('href="tariff-of-charges-retail.html"')
    || family.firstLine !== 7
    || !/Roadmiles Visa Credit Card\s{3,}Bright Mastercard Credit Card\s{3,}LIFE Credit Card/.test(family.text)
    || !/“BRIGHT” Credit Card is structured as per the\s+.*?Islamic principles of Murabaha\./s.test(family.text)
    || tax.firstLine !== 198
    || !/are exclusive of Value Added[\s\S]*?Tax \(VAT\)\. A VAT of 5%/.test(tax.text)
    || !/Annual Fees are applicable after Card activation for new Cards and subsequently\s*?\n[\s\S]*?each anniversary except free Cards/.test(tax.text)
    || feeTable.firstLine !== 22 || feeLine.firstLine !== tier.feeLine
    || !/Primary Credit Card\s+Supplementary Credit Card\s+Card Type/.test(feeTable.text.split("\n")[0])) return null;
  const row = feeLine.text.trim();
  const match = row?.match(new RegExp("^(Free for Life|AED [\\d,]+) {3,}BRight " + tier.name + "$"));
  if (!match) return null;
  const kfsFee = fee(match[1].replace(/^AED /, ""));
  const cells = (s: Evidence) => [...s.text.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => c[1]);
  const canonical = (v: string) => v.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").trim().replace(/\s+/g, " ");
  const rawFeeCells = cells(tariff);
  const namedHeader = cells(tariffHead).map(canonical).join("|");
  if (namedHeader !== "Card Types|ULTRACASH Platinum|BRight Titanium|BRight Platinum|BRight World"
    || rawFeeCells.length !== 5 || canonical(rawFeeCells[0]) !== "Primary Card Annual Fee"
    || (tier.column !== 1 && !rawFeeCells[tier.column+1].includes('src="images/dirham.png"'))
    || kfsFee === null || fee(canonical(rawFeeCells[tier.column+1])) !== kfsFee) return null;

  const pin = (s: Evidence, unit: string, vatTreatment: "exclusive"|"not-applicable") => ({
    parserId:"ajman-bank/bright-primary-annual/v1", productScope:name, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.representation, captureMethod:"public-http-reader",
    ...(s.sourceStartByte === undefined ? { sourceExtraction:pdf, sourceScope:s.sourceScope }
      : { sourceExtraction:"http-decoded-html-excerpt", sourceStartByte:s.sourceStartByte, sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text) }),
    firstLine:s.firstLine, lastLine:s.firstLine+s.text.split("\n").length-1, rawText:s.text, rawTextSha256:s.fixtureTextSha256,
  });
  return {
    name, productUrl, kfsUrl:brightKfs, annualFee:kfsFee, vatPolicy:"exclusive" as const, network:"Mastercard" as const, sharia:true as const,
    capturedDate:heading.capturedAt.slice(0,10), sources:[productUrl,brightKfs,brightTariff],
    sourceFixtureIds:[heading, offer, kfsLink, tariffLink, family, feeTable, feeLine, tax, tariffHead, tariff].map(s => s.id),
    evidence:{
      name:[pin(heading,"Named card tier", "not-applicable"),
        pin(offer,"Common Mastercard entry only; does not confirm exact-tier intake", "not-applicable"),
        pin(kfsLink,"Current product navigation references the credit-card KFS", "not-applicable"),
        pin(tariffLink,"Current product body links this fee schedule", "not-applicable")],
      network:[pin(family,"BRight Mastercard product family; tier matched in the KFS fee table", "not-applicable")],
      sharia:[pin(family,"Issuer describes the BRight product family as Murabaha", "not-applicable")],
      annualFee:[pin(feeTable,"Primary and supplementary headings in the KFS annual fee table", "not-applicable"),
        pin(feeLine,"Named tier's standard primary annual fee; does not use supplementary columns", "exclusive"),
        pin(tax,"KFS VAT policy and primary annual fee timing; separate joining fee not established", "exclusive"),
        pin(tariffHead,"Linked tariff tier columns in their original order", "not-applicable"),
        pin(tariff,"Exact primary fee in the linked retail tariff, corroborated against the KFS", "exclusive")],
      vatPolicy:[pin(tax,"Credit-card KFS says VAT is excluded", "exclusive")],
    },
  };
}
