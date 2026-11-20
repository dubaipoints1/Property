import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const fab = "https://www.bankfab.com";
const islamic = fab + "/en-ae/islamic-banking/personal-islamic-banking/islamic-cards/";
const kfsHub = fab + "/en-ae/personal/key-facts-statements";
const acquisition = "https://bankfab.onelink.me/OhhR/"; // Proof only. Never an output CTA.
export const FAB_ETIHAD_ISLAMIC_KFS = fab + "/-/media/fab-uds/personal/key-facts-statements/fab-islamic/fab-credit-cards-islamic-key-facts-statement.pdf?view=1";
export const FAB_ETIHAD_ISLAMIC_TARIFF = fab + "/-/media/fab-uds/islamic-banking/overview/pdfs/fab-islamic-etihad-guest-credit-cards-schedule-of-charge.pdf?view=1";

export const FAB_ETIHAD_ISLAMIC = {
  "fab-etihad-guest-infinite-islamic": { key: "infinite", tier: "Infinite", cta: "jq0gyybl",
    art: "/etihad-infinite-islamic-credit-card.png?iar=0&hash=DCCB2C824973107299A388EA272FAA15",
    artSha: "9ea55ea24b640e6e9177046d164b8c82340c43d872e78e57f0dbf5fa418c9df4", artType: "image/webp", headingSpace: "" },
  "fab-etihad-guest-signature-islamic": { key: "signature", tier: "Signature", cta: "wjvimtt0",
    art: "/etihad-signature-islamic-card.png?h=491&iar=0&w=699&hash=66C7833D1A3C014C841CAB3AC342B127",
    artSha: "9fa892d2c02aaa534bfb24b3819d135465b8c42f99f5d84c2f94cb1acd3f2dfa", artType: "image/png", headingSpace: "  " },
  "fab-etihad-guest-platinum-islamic": { key: "platinum", tier: "Platinum", cta: "761m60xt",
    art: "/etihad-platinum-islamic-credit-card.png?h=327&iar=0&w=466&hash=B6813A7D615EA517BFAFE561D42CFC50",
    artSha: "277ae4445beeb49473e9a922ebf8c50c292bc4680c97d06063ebef51c787e06d", artType: "image/webp", headingSpace: "" },
} as const;
type ArtReceipt = { assetUrl: string; capturedAt: string; sha256: string; bytes: number; contentType: string };
type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
  visualReceipt?: ArtReceipt;
};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const stamp = (s: string) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) && Number.isFinite(Date.parse(s));
const same = (a: Source, b: Source) => a.url === b.url && a.sourceBodySha256 === b.sourceBodySha256
  && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
const endLine = (s: Source) => s.firstLine + s.text.split("\n").length - 1;
function follows(a: Source, b: Source, max: number) {
  const diff = b.sourceStartByte! - a.sourceStartByte!;
  return diff >= Buffer.byteLength(a.text) && diff <= max && a.firstLine <= b.firstLine;
}
function followsLine(a: Source, b: Source, max: number) {
  return b.firstLine > endLine(a) && b.firstLine - endLine(a) <= max;
}
const stripBidi = (s: string) => s.replace(/\p{Cf}/gu, "").trim();
const columns = (s: string) => s.split("\n").map(line => stripBidi(line).split(/[ \t]{3,}/));
const productNet = new RegExp('^<h2 class="infographic-heading">\ueadf (' + SOURCE_NUMBER
  + ')[\u00a0 ]+\\(Excluding VAT\\)</h2><div class="global-rich-text infographic-text"><p>Annual Fees?</p>$');
function threeAED(line: string) {
  const m = new RegExp("^D (" + SOURCE_NUMBER + ")\\s*/\\s*D (" + SOURCE_NUMBER + ")\\s*/\\s*D (" + SOURCE_NUMBER + ")$").exec(line);
  if (!m) return null;
  const amounts = m.slice(1).map(parseSourceNumber);
  if (amounts.some(n => n === null || n <= 0 || n > 99999 || !Number.isSafeInteger(n * 100))) return null;
  return amounts as [number, number, number];
}
function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "exclusive" | "not-applicable" = "not-applicable") {
  return {
    parserId: "fab/etihad-islamic-primary-membership/v1", productScope, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: endLine(s), rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
const grossOrder = ["Infinite", "Signature", "Platinum"] as const;
const netOrder = ["Platinum", "Signature", "Infinite"] as const;

/** Publish the explicit KFS gross amount only; product and tariff net validate the exact named tier. */
export function parseFabEtihadIslamic(input: readonly Source[], slug: string) {
  if (!Object.hasOwn(FAB_ETIHAD_ISLAMIC, slug)) return null;
  const spec = FAB_ETIHAD_ISLAMIC[slug as keyof typeof FAB_ETIHAD_ISLAMIC];
  const productUrl = islamic + "etihad-guest-" + spec.key + "-islamic";
  const productName = "Etihad Guest " + spec.tier + " Islamic Credit Card", name = "FAB " + productName;
  const artUrl = fab + "/-/media/fab-uds/islamic-banking/personal-islamic-banking/islamic-cards/fab-etihad-guest-"
    + spec.key + "-islamic-credit-card/images" + spec.art;
  const ids: string[] = [];
  function get(role: string, url: string, pdf = false) {
    const matches = input.filter(s => s.id === "fab-etihad-islamic-" + role);
    const s = matches[0];
    if (matches.length !== 1 || !s || s.url !== url || typeof s.text !== "string" || !s.text || s.text.length > 1400
      || s.fixtureTextSha256 !== sha(s.text) || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256)
      || !stamp(s.capturedAt) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
    if (pdf ? s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== "PDF page 1" || s.sourceStartByte !== undefined
      : s.sourceRepresentation !== "http-decoded-response-body" || s.sourceTextSha256 !== s.sourceBodySha256
        || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    ids.push(s.id);
    return s;
  }
  const prod = (role: string) => get(spec.key + "-" + role, productUrl);
  const heading = prod("heading"), art = prod("artwork"), cta = prod("acquisition"), repeatedCta = prod("acquisition-repeat");
  const productFee = prod("product-fee"), repeatedFee = prod("product-fee-repeat"), tariffLink = prod("tariff-link");
  const tariffHeader = get("tariff-heading", FAB_ETIHAD_ISLAMIC_TARIFF, true);
  const netRow = get("tariff-tier-fees", FAB_ETIHAD_ISLAMIC_TARIFF, true);
  const kfsHeader = get("kfs-heading", FAB_ETIHAD_ISLAMIC_KFS, true);
  const kfsColumns = get("kfs-columns", FAB_ETIHAD_ISLAMIC_KFS, true);
  const grossRow = get("kfs-tier-fees", FAB_ETIHAD_ISLAMIC_KFS, true);
  const kfsVat = get("kfs-vat", FAB_ETIHAD_ISLAMIC_KFS, true);
  const lookup = get("kfs-hub-link", kfsHub);
  if (!heading || !art || !cta || !repeatedCta || !productFee || !repeatedFee || !tariffLink
    || !tariffHeader || !netRow || !kfsHeader || !kfsColumns || !grossRow || !kfsVat || !lookup) return null;
  const image = art.visualReceipt;
  if (![art, cta, repeatedCta, productFee, repeatedFee, tariffLink].every(s => same(heading, s))
    || !same(tariffHeader, netRow) || ![kfsColumns, grossRow, kfsVat].every(s => same(kfsHeader, s))
    || heading.text !== '<h1 class="hbcc-desc-title">' + productName + spec.headingSpace + "</h1>"
    || !art.text.startsWith('<img class="hbcc-image"') || !art.text.endsWith("/>")
    || !art.text.includes('src="' + artUrl.replaceAll("&", "&amp;") + '"')
    || !image || image.assetUrl !== artUrl || image.sha256 !== spec.artSha || image.contentType !== spec.artType
    || !stamp(image.capturedAt) || image.capturedAt.slice(0, 10) !== art.capturedAt.slice(0, 10)
    || !Number.isSafeInteger(image.bytes) || image.bytes < 1 || image.bytes > 2 * 1024 * 1024
    || cta.text !== 'href="' + acquisition + spec.cta + '"' || repeatedCta.text !== cta.text
    || productFee.text !== repeatedFee.text || tariffLink.text !== 'href="' + FAB_ETIHAD_ISLAMIC_TARIFF + '"'
    || lookup.text !== 'href="' + FAB_ETIHAD_ISLAMIC_KFS + '"'
    || !follows(art, heading, 750) || !follows(heading, cta, 1200) || !follows(cta, repeatedCta, 1200)
    || !follows(repeatedCta, productFee, 8200) || !follows(productFee, repeatedFee, 1400) || !follows(repeatedFee, tariffLink, 85000)
    || !followsLine(tariffHeader, netRow, 15) || !followsLine(kfsHeader, kfsColumns, 18)
    || !followsLine(kfsColumns, grossRow, 17) || !followsLine(grossRow, kfsVat, 2)) return null;
  const th = columns(tariffHeader.text), tr = columns(netRow.text), kh = columns(kfsColumns.text), kr = columns(grossRow.text);
  if (th[0]?.[0] !== "FAB ISLAMIC CREDIT CARDS" || th[2]?.[0] !== "Schedule of Fees and Charges"
    || stripBidi(kfsHeader.text) !== "FAB Islamic Credit Cards: Key Facts Statement"
    || kh[0]?.[0] !== "Annual Fee (Inclusive of VAT)" || kh[2]?.[1] !== "Primary Card" || kh[2]?.[2] !== "Supplementary Card"
    || stripBidi(kfsVat.text) !== "Note: All annual membership fee details are inclusive of VAT."
    || tr.length !== 3 || tr[0]?.[0] !== "FAB Etihad Guest" || tr[1]?.[0] !== "Platinum/ Signature/"
    || tr[2]?.[0] !== "Infinite Islamic" || !/^Supplementary Annual Fee: D \d+(?:\.\d+)?$/.test(tr[1]?.[1] ?? "")
    || tr[2]?.[1] !== ")(Excluding VAT" || kr.length !== 3 || kr[0]?.[0] !== "Etihad Guest Infinite / Signature / Platinum"
    || kr[1]?.length !== 2 || !/^D \d+(?:\.\d+)?$/.test(kr[1][1])) return null;
  const netLine = /^Annual Fees: (.*)$/.exec(tr[0]?.[1] ?? "")?.[1];
  const net = netLine ? threeAED(netLine) : null, gross = threeAED(kr[1][0]);
  const productToken = productNet.exec(productFee.text)?.[1];
  const netValue = productToken === undefined ? null : parseSourceNumber(productToken);
  if (!net || !gross || netValue === null || net[netOrder.indexOf(spec.tier)] !== netValue) return null;
  // Independently printed gross values must move uniformly from net across all three named tiers.
  // This reconciles source columns, not a modelled tax amount: publish the KFS value directly.
  const netInGrossOrder = grossOrder.map(t => net[netOrder.indexOf(t)]);
  const cents = (n: number) => BigInt(Math.round(n * 100));
  if (gross.some((n, i) => n <= netInGrossOrder[i] ||
    cents(n) * cents(netInGrossOrder[0]) !== cents(gross[0]) * cents(netInGrossOrder[i]))) return null;

  return {
    name, productUrl, network: "Visa" as const, annualFee: gross[grossOrder.indexOf(spec.tier)], vatPolicy: "inclusive" as const,
    kfsUrl: FAB_ETIHAD_ISLAMIC_KFS, sources: [productUrl, FAB_ETIHAD_ISLAMIC_KFS, FAB_ETIHAD_ISLAMIC_TARIFF, kfsHub],
    capturedDate: heading.capturedAt.slice(0, 10), sourceFixtureIds: ids,
    evidence: {
      network: [pin(art, name, "Exact issuer-linked FAB Islamic and Visa " + spec.tier + " artwork checked; no benefits asserted")],
      annualFee: [pin(kfsColumns, name, "KFS VAT-inclusive primary and supplementary columns", "inclusive"),
        pin(grossRow, name, "Printed KFS primary annual fee in AED for the exact named tier", "inclusive"),
        pin(kfsVat, name, "KFS express VAT-inclusive annual-fee basis", "inclusive"),
        pin(productFee, name, "Exact product annual fee before VAT", "exclusive"),
        pin(netRow, name, "Dedicated tariff annual fees before VAT, matched by named tier, not by KFS column order", "exclusive")],
    },
  };
}
