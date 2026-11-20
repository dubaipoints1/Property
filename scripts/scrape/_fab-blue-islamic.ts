import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const fab = "https://www.bankfab.com";
const route = "/en-ae/islamic-banking/personal-islamic-banking/islamic-cards/fab-blue-islamic-credit-card";
const kfsHub = fab + "/en-ae/personal/key-facts-statements";
const name = "Blue FAB Islamic Credit Card";
const artworkUrl = fab + "/-/media/fab-uds/islamic-banking/personal-islamic-banking/islamic-cards/fab-blue-islamic-credit-card/fab-blue-islamic-cc.png?h=491&iar=0&w=699&hash=90166C00B6B8C57D2D330493CBD8889B";
const artworkSha = "09a681a7c097d413e78658dcc2905ebccd13f1cd59b9f7bfa529a10319983744";
export const FAB_BLUE_ISLAMIC_PRODUCT = fab + route;
export const FAB_BLUE_ISLAMIC_TARIFF = fab + "/-/media/fab-uds/islamic-banking/overview/pdfs/credit-cards-fees-and-charges.pdf?view=1";
export const FAB_BLUE_ISLAMIC_KFS = fab + "/-/media/fab-uds/personal/key-facts-statements/fab-islamic/fab-credit-cards-islamic-key-facts-statement.pdf?view=1";
type Visual = { assetUrl: string; capturedAt: string; sha256: string; bytes: number; contentType: string };
type Source = {
  id: string; url: string; capturedAt: string; text: string; fixtureTextSha256: string;
  sourceBodySha256: string; sourceTextSha256: string; firstLine: number; sourceStartByte?: number;
  sourceScope?: string; sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
  visualReceipt?: Visual;
};
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const timestamp = (s: string) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) && Number.isFinite(Date.parse(s));
const stripBidi = (s: string) => s.replace(/\p{Cf}/gu, "").trim();
const cells = (s: string) => s.split("\n").map(line => stripBidi(line).split(/[ \t]{3,}/));
const endLine = (s: Source) => s.firstLine + s.text.split("\n").length - 1;
const sameCapture = (a: Source, b: Source) => a.url === b.url && a.sourceBodySha256 === b.sourceBodySha256
  && a.sourceTextSha256 === b.sourceTextSha256 && a.capturedAt === b.capturedAt;
function follows(a: Source, b: Source, max: number) {
  const d = b.sourceStartByte! - a.sourceStartByte!;
  return d >= Buffer.byteLength(a.text) && d <= max && a.firstLine <= b.firstLine;
}
const next = (a: Source, b: Source, max: number) => b.firstLine > endLine(a) && b.firstLine - endLine(a) <= max;
const productPattern = new RegExp('^<h2 class="infographic-heading">\ueadf (' + SOURCE_NUMBER + ')\\* Annual Fee</h2>$');
const netPattern = new RegExp("^Annual Fees: D (" + SOURCE_NUMBER + ")$"), grossPattern = new RegExp("^D (" + SOURCE_NUMBER + ")$");
function numeric(pattern: RegExp, source: string) {
  const token = pattern.exec(source)?.[1];
  return token === undefined ? null : parseSourceNumber(token);
}
function pin(s: Source, unit: string, vatTreatment: "inclusive" | "exclusive" | "not-applicable" = "not-applicable") {
  return {
    parserId: "fab/blue-islamic-primary-membership/v1", productScope: name, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceRepresentation === "pdftotext-layout" ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? { sourceScope: s.sourceScope } : {}),
    ...(s.sourceStartByte !== undefined ? { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) } : {}),
    firstLine: s.firstLine, lastLine: endLine(s), rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}

/** Replay only standard primary annual membership from the explicit gross KFS, never a computed tax amount. */
export function parseFabBlueIslamic(input: readonly Source[], slug: string) {
  if (slug !== "fab-blue-islamic") return null;
  const ids: string[] = [];
  function get(role: string, url: string, pdf = false) {
    const matches = input.filter(s => s.id === "fab-blue-islamic-" + role), s = matches[0];
    if (matches.length !== 1 || !s || s.url !== url || typeof s.text !== "string" || !s.text || s.text.length > 1200
      || s.fixtureTextSha256 !== hash(s.text) || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256)
      || !timestamp(s.capturedAt) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
    if (pdf ? s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== "PDF page 1" || s.sourceStartByte !== undefined
      : s.sourceRepresentation !== "http-decoded-response-body" || s.sourceTextSha256 !== s.sourceBodySha256
        || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    ids.push(s.id);
    return s;
  }
  const product = (role: string) => get(role, FAB_BLUE_ISLAMIC_PRODUCT);
  const heading = product("heading"), art = product("artwork"), cta = product("cta"), ctaRepeat = product("cta-repeat");
  const line = product("product-fee"), repeat = product("product-fee-repeat"), tariffLink = product("tariff-link");
  const hub = get("kfs-hub-link", kfsHub);
  const tariffHeading = get("tariff-heading", FAB_BLUE_ISLAMIC_TARIFF, true), tariffRow = get("tariff-row", FAB_BLUE_ISLAMIC_TARIFF, true);
  const kfsHeading = get("kfs-heading", FAB_BLUE_ISLAMIC_KFS, true), kfsColumns = get("kfs-columns", FAB_BLUE_ISLAMIC_KFS, true);
  const kfsRow = get("kfs-row", FAB_BLUE_ISLAMIC_KFS, true), kfsVat = get("kfs-vat", FAB_BLUE_ISLAMIC_KFS, true);
  if (!heading || !art || !cta || !ctaRepeat || !line || !repeat || !tariffLink || !hub ||
    !tariffHeading || !tariffRow || !kfsHeading || !kfsColumns || !kfsRow || !kfsVat) return null;
  const image = art.visualReceipt;
  if (![art, cta, ctaRepeat, line, repeat, tariffLink].every(s => sameCapture(heading, s))
    || !sameCapture(tariffHeading, tariffRow) || ![kfsColumns, kfsRow, kfsVat].every(s => sameCapture(kfsHeading, s))
    || heading.text !== '<h1 class="hbcc-desc-title">' + name + "</h1>"
    || !art.text.startsWith('<img class="hbcc-image"') || !art.text.endsWith("/>") || !art.text.includes('src="' + artworkUrl.replaceAll("&", "&amp;") + '"')
    || !image || image.assetUrl !== artworkUrl || image.sha256 !== artworkSha || image.contentType !== "image/webp" || image.bytes !== 30782
    || !timestamp(image.capturedAt) || image.capturedAt.slice(0, 10) !== art.capturedAt.slice(0, 10)
    || cta.text !== 'href="' + route + '#form"' || cta.text !== ctaRepeat.text
    || line.text !== repeat.text || tariffLink.text !== 'href="' + FAB_BLUE_ISLAMIC_TARIFF + '"'
    || hub.text !== 'href="' + FAB_BLUE_ISLAMIC_KFS + '"'
    || !follows(art, heading, 750) || !follows(heading, cta, 1200) || !follows(cta, ctaRepeat, 1400)
    || !follows(ctaRepeat, line, 26000) || !follows(line, repeat, 1800) || !follows(repeat, tariffLink, 85000)
    || !next(tariffHeading, tariffRow, 20) || !next(kfsHeading, kfsColumns, 18)
    || !next(kfsColumns, kfsRow, 10) || !next(kfsRow, kfsVat, 12)) return null;
  const th = cells(tariffHeading.text), tr = cells(tariffRow.text), kc = cells(kfsColumns.text), kr = cells(kfsRow.text);
  if (th[0]?.[0] !== "FAB ISLAMIC CREDIT CARDS" || th[2]?.[0] !== "Schedule of Fees and Charges"
    || tr.length !== 5 || tr[1]?.[0] !== "Blue Islamic Credit" || tr[3]?.[0] !== "Card"
    || tr[2]?.[0] !== "Supplementary Annual Fee: Free" || tr[4]?.[0] !== ")(Excluding VAT"
    || stripBidi(kfsHeading.text) !== "FAB Islamic Credit Cards: Key Facts Statement"
    || kc[0]?.[0] !== "Annual Fee (Inclusive of VAT)" || kc[2]?.[1] !== "Primary Card" || kc[2]?.[2] !== "Supplementary Card"
    || kr.length !== 3 || kr[0]?.[0] !== "Blue Islamic Credit Card" || kr[0]?.[1] !== "NIL" || kr[1]?.length !== 1
    || stripBidi(kfsVat.text) !== "Note: All annual membership fee details are inclusive of VAT.") return null;
  const productAmount = numeric(productPattern, line.text);
  const tariffBase = numeric(netPattern, tr[0][0]), kfsGross = numeric(grossPattern, kr[1][0]);
  // The headline has an asterisk but no VAT label. It corroborates the exact tariff base, not a payable quote.
  if (productAmount === null || tariffBase === null || kfsGross === null || tariffBase <= 0
    || productAmount !== tariffBase || kfsGross <= tariffBase) return null;
  return {
    name, productUrl: FAB_BLUE_ISLAMIC_PRODUCT, network: "Visa" as const, annualFee: kfsGross, vatPolicy: "inclusive" as const,
    kfsUrl: FAB_BLUE_ISLAMIC_KFS, sources: [FAB_BLUE_ISLAMIC_PRODUCT, FAB_BLUE_ISLAMIC_KFS, FAB_BLUE_ISLAMIC_TARIFF, kfsHub],
    capturedDate: heading.capturedAt.slice(0, 10), sourceFixtureIds: ids,
    evidence: {
      network: [pin(art, "Exact same-product issuer artwork identifies FAB Islamic and Visa Signature; no network benefits asserted")],
      annualFee: [pin(kfsColumns, "KFS primary and supplementary annual fee columns including VAT", "inclusive"),
        pin(kfsRow, "Printed KFS standard primary annual fee in AED for Blue Islamic", "inclusive"),
        pin(kfsVat, "KFS explicit annual-fee VAT basis", "inclusive"),
        pin(tariffRow, "Blue Islamic linked tariff's named standard primary fee before VAT", "exclusive"),
        pin(line, "Matching product headline annual fee; no VAT label or waiver terms used")],
    },
  };
}
