import { createHash } from "node:crypto";

const issuer = "https://www.emiratesislamic.ae";
const tariffUrl = issuer + "/en/soc/cards";
const kfs = issuer + "/en/key-information/kfs-credit-cards";
const productPrefix = issuer + "/en/Personal-Banking/Cards/credit-cards/";
const group = "Amazon World &amp; Amazon Platinum";

export const EI_AMAZON_FEE_CARDS = {
  "emirates-islamic-amazon-world": { tier: "World", path: "amazon-credit-card" },
  "emirates-islamic-amazon-platinum": { tier: "Platinum", path: "amazon-platinum-credit-card" },
} as const;

export type EiAmazonFeeSource = {
  id: string; url: string; capturedAt: string; text: string;
  fixtureTextSha256: string; sourceBodySha256: string; sourceTextSha256: string;
  firstLine: number; sourceStartByte: number; sourceRepresentation: "http-decoded-response-body";
};

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const words = (text: string) => text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function exactRow(text: string) {
  const container = /^<tr>\s*((?:<t[dh](?:\s[^>]*)?>[\s\S]*?<\/t[dh]>\s*)+)<\/tr>$/i.exec(text);
  if (!container) return null;
  const cells = [...container[1].matchAll(/<(t[dh])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  if (!cells.length || cells.length > 20 || cells.some(cell => /<\/?t[dh]\b/i.test(cell[2]))) return null;
  return cells.map(cell => words(cell[2]));
}

/** All parts must come from one receipt, in increasing order inside the expected bounded section. */
function sameDocument(parts: EiAmazonFeeSource[], maxSpan: number) {
  const first = parts[0];
  return parts.every((part, i) => part.url === first.url && part.capturedAt === first.capturedAt
    && part.sourceBodySha256 === first.sourceBodySha256 && part.sourceStartByte - first.sourceStartByte <= maxSpan
    && (!i || (part.firstLine >= parts[i - 1].firstLine &&
      part.sourceStartByte >= parts[i - 1].sourceStartByte + Buffer.byteLength(parts[i - 1].text))));
}

/** Replays only a zero standard primary membership fee; never converts KFS NA to zero on its own. */
export function parseEiAmazonFees(input: readonly EiAmazonFeeSource[], slug: string) {
  if (!Object.hasOwn(EI_AMAZON_FEE_CARDS, slug)) return null;
  const { tier, path } = EI_AMAZON_FEE_CARDS[slug as keyof typeof EI_AMAZON_FEE_CARDS];
  const canonicalHref = productPrefix + path;
  const canonical = tier === "World" ? canonicalHref.replace("/Personal-Banking/Cards/", "/personal-banking/cards/") : canonicalHref;
  const name = "Emirates Islamic Amazon Mastercard " + tier + " Credit Card";
  const used: EiAmazonFeeSource[] = [];
  const get = (id: string, url: string) => {
    const matches = input.filter(source => source.id === id);
    const source = matches[0];
    if (matches.length !== 1 || !source || source.url !== url || !source.text || Buffer.byteLength(source.text) > 6500
      || source.sourceRepresentation !== "http-decoded-response-body" || !/^[a-f0-9]{64}$/.test(source.sourceBodySha256)
      || source.sourceTextSha256 !== source.sourceBodySha256 || source.fixtureTextSha256 !== sha(source.text)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(source.capturedAt)
      || !Number.isFinite(Date.parse(source.capturedAt))
      || !Number.isSafeInteger(source.firstLine) || source.firstLine < 1
      || !Number.isSafeInteger(source.sourceStartByte) || source.sourceStartByte < 0) return null;
    used.push(source);
    return source;
  };

  const link = get(slug + "-canonical", canonical);
  const head = get(slug + "-heading", canonical);
  const fee = get(slug + "-annual-membership-label", canonical);
  const network = get(slug + "-network-name", canonical);
  const kVat = get("ei-kfs-vat", kfs);
  const kNames = get("ei-kfs-card-columns", kfs);
  const kFees = get("ei-kfs-annual-fee-row", kfs);
  const tVat = get("ei-tariff-vat", tariffUrl);
  const tScope = get("ei-tariff-profit-scope", tariffUrl);
  const tNames = get("ei-tariff-membership-columns", tariffUrl);
  const tFee = get("ei-tariff-amazon-membership-row", tariffUrl);
  const tEnd = get("ei-tariff-fee-based-boundary", tariffUrl);
  if (!link || !head || !fee || !network || !kVat || !kNames || !kFees || !tVat || !tScope || !tNames || !tFee || !tEnd
    || !sameDocument([link, head, fee, network], 140000)
    || !sameDocument([kVat, kNames, kFees], 5000)
    || !sameDocument([tVat, tScope, tNames, tFee, tEnd], 5000)
    || link.text !== '<link rel="canonical" href="' + canonicalHref + '" />'
    || head.text !== "<h1>Amazon " + tier + " Credit Card</h1>"
    || fee.text !== '<h5 class="card-title text-md-center">No Annual Membership Fee</h5>'
    || network.text !== "Amazon Mastercard " + tier + " Credit Card"
    || words(kVat.text) !== "All charges are inclusive of Value Added Tax (VAT) in AED currency."
    || words(tVat.text) !== "All charges, commissions and fees are inclusive of Value Added Tax or any other similar sales tax (VAT)."
    || words(tScope.text) !== "Profit based Cards" || words(tEnd.text) !== "Fee based Cards") return null;

  const kTitles = exactRow(kNames.text), kAmounts = exactRow(kFees.text);
  const tTitles = exactRow(tNames.text), tAmounts = exactRow(tFee.text);
  if (!kTitles || !kAmounts || !tTitles || !tAmounts || kTitles.length !== kAmounts.length
    || kTitles[0] !== "Product Name" || kAmounts[0] !== "Annual Fee"
    || kTitles.filter(title => title === group).length !== 1 || kAmounts[kTitles.indexOf(group)] !== "NA"
    || tTitles.join("|") !== "Credit Card Type|Monthly Profit Rate|Annual Membership Fee"
    || tAmounts.length !== 3 || tAmounts[0] !== "Amazon" || tAmounts[2] !== "No Annual Membership Fee") return null;

  const pin = (s: EiAmazonFeeSource, unit: string, vatTreatment: "inclusive" | "not-applicable" = "not-applicable") => ({
    parserId: "emirates-islamic/amazon-primary-membership/v1", productScope: name, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256,
    sourceTextSha256: s.sourceTextSha256, sourceRepresentation: s.sourceRepresentation,
    sourceExtraction: "http-decoded-html-excerpt" as const, captureMethod: "public-http-reader" as const,
    sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  return {
    name, canonical, kfs, sources: [canonical, kfs, tariffUrl],
    capturedDate: link.capturedAt.slice(0, 10), ids: used.map(source => source.id),
    fee: 0, network: "Mastercard" as const, vatPolicy: "inclusive" as const,
    evidence: {
      annualFee: [
        pin(tFee, "AED standard primary annual membership fee in the tariff's Amazon card family", "inclusive"),
        pin(kNames, "Named KFS columns include both precise Amazon tiers"),
        pin(kFees, "KFS annual fee row in the same column order; NA corroborates the affirmative tariff", "inclusive"),
        pin(fee, "Exact product page confirms no annual membership fee"),
        pin(tScope, "Profit-based pricing scope"), pin(tNames, "Primary annual membership column, not monthly profit"),
        pin(tEnd, "Following separate fee-based pricing scope"), pin(tVat, "Tariff VAT basis", "inclusive"),
        pin(kVat, "KFS AED and VAT basis", "inclusive"),
      ],
      network: [pin(network, "Exact tier-specific issuer naming identifies Mastercard"),
        pin(head, "Issuer product heading identifies the exact tier"), pin(link, "Issuer canonical identifies the exact product page")],
    },
  };
}
