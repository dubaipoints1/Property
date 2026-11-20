import { createHash } from "node:crypto";

const fab = "https://www.bankfab.com";
const selectorHost = "https://apply.bankfab.com";
const selector = selectorHost + "/en-ae/blue-cards"; // Document relationship proof only; never an application CTA.
const family = fab + "/en-ae/personal/promotions/blue-fab-credit-cards";
const tariffPath = "/-/media/fab-uds/personal/credit-cards/fees-and-charges/credit-card.pdf";
const kfsPath = "/-/media/fab-uds/personal/key-facts-statements/credit-cards/Conventional-Cards-Key-Facts-Statement-BilingualSept2026.pdf";
export const FAB_BLUE_TARIFF = fab + tariffPath + "?view=1";
export const FAB_BLUE_KFS = selectorHost + kfsPath;

/** Visual network review is tied to the exact issuer hero PNG hash, not inferred from the product tier. */
export const FAB_BLUE_CARDS = {
  "fab-blue-al-futtaim-infinite": {
    key: "infinite", tier: "Infinite", artParameter: "5AD8C3C01B055084253F94AD3BC7404B",
    reviewedArtSha256: "8972397ed2b3779837d40fa7a80da6ad8d7ec4171c024cfa472fa2803061fdf4",
  },
  "fab-blue-al-futtaim-signature": {
    key: "signature", tier: "Signature", artParameter: "52EB104ECB4034AD553E1D7BBDBE2CA8",
    reviewedArtSha256: "fb3761d73eba9bd6fd883f95b43f2a071cd2289020cfd83f0bf41f32e6e8f320",
  },
  "fab-blue-al-futtaim-platinum": {
    key: "platinum", tier: "Platinum", artParameter: "2B630EAA9375333F74F451891D5721BE",
    reviewedArtSha256: "d71dcbb7295732969530a51aa9e44ac9015dfa245ddb3e811cb163e9dfce98f5",
  },
} as const;

type VisualReceipt = { assetUrl: string; capturedAt: string; sha256: string; bytes: number; contentType: string };
type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
  visualReceipt?: VisualReceipt;
};
const hex = /^[0-9a-f]{64}$/;
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const clean = (text: string) => text.trim().replace(/\s+/g, " ");
const timestamp = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && Number.isFinite(Date.parse(value));
const same = (a: Source, b: Source) => a.url === b.url && a.sourceBodySha256 === b.sourceBodySha256
  && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
function follows(a: Source, b: Source, max: number) {
  const distance = b.sourceStartByte! - a.sourceStartByte!;
  return distance >= Buffer.byteLength(a.text) && distance <= max && a.firstLine <= b.firstLine;
}
function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable" = "not-applicable") {
  return {
    parserId: "fab/blue-primary-membership/v1", productScope, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256,
    sourceTextSha256: s.sourceTextSha256, sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1, rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}

/** Exact offline replay. Returns only name, verified scheme and standard primary annual membership with VAT basis. */
export function parseFabBlue(input: readonly Source[], slug: string) {
  if (!Object.hasOwn(FAB_BLUE_CARDS, slug)) return null;
  const { key, tier, artParameter, reviewedArtSha256 } = FAB_BLUE_CARDS[slug as keyof typeof FAB_BLUE_CARDS];
  const productUrl = fab + "/en-ae/personal/credit-cards/blue-fab-" + key + "-credit-card";
  const name = "Blue FAB " + tier + " Credit Card by Al-Futtaim";
  const artUrl = fab + "/-/media/fab-uds/personal/credit-cards/blue-fab-" + key + "-credit-card/fab-blue-" + key
    + "-cc-double.png?h=654&iar=0&w=932&hash=" + artParameter;
  const ids: string[] = [];
  const get = (role: string, url: string, pdf = false) => {
    const matches = input.filter(s => s.id === "fab-blue-" + role);
    const s = matches[0];
    if (matches.length !== 1 || !s || s.url !== url || typeof s.text !== "string" || !s.text || s.text.length > 1024
      || s.fixtureTextSha256 !== sha(s.text) || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256)
      || !timestamp(s.capturedAt) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
    if (pdf ? s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== "PDF page 1" || s.sourceStartByte !== undefined
      : s.sourceRepresentation !== "http-decoded-response-body" || s.sourceTextSha256 !== s.sourceBodySha256
        || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    ids.push(s.id);
    return s;
  };
  const productHeading = get(key + "-heading", productUrl);
  const artwork = get(key + "-artwork", productUrl);
  const productTariff = get(key + "-product-tariff", productUrl);
  const selectorHeading = get(key + "-selector-heading", selector);
  const selectorKfs = get(key + "-selector-kfs", selector);
  const selectorTariff = get(key + "-selector-tariff", selector);
  const columns = get("tariff-columns", FAB_BLUE_TARIFF, true);
  const feeRow = get(key + "-tariff-row", FAB_BLUE_TARIFF, true);
  const kfs = get("kfs-delegation", FAB_BLUE_KFS, true);
  const corroboration = get("family-fee", family);
  if (!productHeading || !artwork || !productTariff || !selectorHeading || !selectorKfs || !selectorTariff
    || !columns || !feeRow || !kfs || !corroboration) return null;
  const visual = artwork.visualReceipt;
  if (!same(productHeading, artwork) || !same(productHeading, productTariff)
    || !same(selectorHeading, selectorKfs) || !same(selectorHeading, selectorTariff) || !same(columns, feeRow)
    || productHeading.text !== '<h1 class="hbcc-desc-title">' + name + "</h1>"
    || artwork.text !== 'src="' + artUrl.replaceAll("&", "&amp;") + '"'
    || !visual || visual.assetUrl !== artUrl || visual.sha256 !== reviewedArtSha256 || visual.contentType !== "image/png"
    || !Number.isSafeInteger(visual.bytes) || visual.bytes < 1 || visual.bytes > 2 * 1024 * 1024
    || !timestamp(visual.capturedAt) || visual.capturedAt.slice(0, 10) !== artwork.capturedAt.slice(0, 10)
    || !follows(artwork, productHeading, 1800) || !follows(productHeading, productTariff, 180000)
    || productTariff.text !== 'href="' + FAB_BLUE_TARIFF + '"'
    || selectorHeading.text !== '<h4 class="text-primary-blue mb-1 md:pe-24 md:pt-0 pt-6">BLUE FAB ' + tier + " Credit Card by Al-Futtaim</h4>"
    || selectorKfs.text !== '<a href="' + kfsPath + '" class="body-1 text-primary-blue underline caption-light" target="_blank" rel="noreferrer">Key facts</a>'
    || selectorTariff.text !== '<a href="' + tariffPath + '" target="_blank" rel="noreferrer" class="body-1 text-primary-blue underline caption-light">Schedule of charges</a>'
    || !follows(selectorHeading, selectorKfs, 1800) || !follows(selectorKfs, selectorTariff, 750)
    || clean(columns.text) !== "Annual Membership Fee (AMF) Inclusive of VAT Primary Card Supplementary Card Card Type (D ) (D )"
    || feeRow.firstLine <= columns.firstLine + columns.text.split("\n").length - 1 || feeRow.firstLine - columns.firstLine > 30
    || clean(kfs.text) !== "The Annual Membership Fee/Renewal Fee is payable as prescribed by FAB in the SoF (Schedule of Fees), for the Customer’s Credit Card and each Supplementary Credit Card upon issuance or renewal"
    || corroboration.text !== "These cards are free, there are no annual fees with the Blue FAB Credit Cards.") return null;
  // The first fee token is the primary column. No missing, qualified, inferred or substituted zeroes.
  const row = new RegExp("^[ \\t]*BLUE FAB " + tier + "[ \\t]{2,}(Free)[ \\t]{2,}Free[ \\t]*$").exec(feeRow.text);
  if (!row || row[1] !== "Free") return null;
  return {
    name, productUrl, network: "Visa" as const, annualFee: 0, vatPolicy: "inclusive" as const,
    kfsUrl: FAB_BLUE_KFS, sources: [productUrl, FAB_BLUE_TARIFF, FAB_BLUE_KFS, family],
    capturedDate: productHeading.capturedAt.slice(0, 10), sourceFixtureIds: ids,
    evidence: {
      network: [pin(artwork, name, "Visa " + tier + " mark on the exact issuer-linked Blue product artwork; no network benefits asserted")],
      annualFee: [
        pin(feeRow, name, "AED standard primary annual membership fee (first fee column)", "inclusive"),
        pin(columns, name, "Tariff heading defines VAT-inclusive amounts and separates primary and supplementary cards", "inclusive"),
        pin(kfs, name, "Conventional key-facts statement delegates the annual fee to the tariff"),
        pin(corroboration, name, "Issuer confirms no annual fees for the Blue FAB family; not a statement about other charges"),
      ],
    },
  };
}
