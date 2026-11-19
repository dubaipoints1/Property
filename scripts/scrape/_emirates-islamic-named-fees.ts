import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const ISSUER = "https://www.emiratesislamic.ae";
const PRODUCT = ISSUER + "/en/cards/credit-cards/";
const KFS = ISSUER + "/en/key-information/kfs-credit-cards";
const TARIFF = ISSUER + "/en/soc/cards";
export const EI_NAMED_FEE_CARDS = {
  "emirates-islamic-skywards-signature": {
    name: "Emirates Islamic Skywards Signature Credit Card", route: "skywards-signature-credit-card",
    heading: "Skywards Signature Card", apply: "/en/apply-now?product=Skywards%20Signature%20Credit%20Card",
    kfsColumn: "Skywards Signature", tariffName: "Skywards Signature",
    art: 'src="/-/media/ei/images/cards/mobile-image/ei_skywards_signature_600x500.jpg"',
  },
  "emirates-islamic-barca-cashback": {
    name: "Emirates Islamic Barça Cashback Credit Card", route: "fc-barcelona-credit-card",
    heading: "Barça Cashback Card", apply: "/en/apply-now?product=Barca Cashback Card",
    kfsColumn: "Barça Cashback", tariffName: "Barça Cashback",
    art: 'srcset="/-/media/webx/ei/images/cards/credit-cards/banners/FCB_Campaign_2880x1000_en.jpg"',
  },
  "emirates-islamic-rta": {
    name: "Emirates Islamic RTA Platinum Credit Card (Profit-Based)", route: "rta-credit-card",
    heading: "RTA Credit Card", apply: "https://apply.emiratesislamic.ae/en/credit-cards/rta-card",
    kfsColumn: "RTA", tariffName: "RTA Platinum",
    art: 'src="/-/media/ei/images/cards/banners/credit-card-banners/ei_rta_credit_card_600x500.jpg"',
  },
} as const;

export type EiFeeSource = {
  id: string; url: string; capturedAt: string; text: string;
  fixtureTextSha256: string; sourceBodySha256: string; sourceTextSha256: string;
  firstLine: number; sourceStartByte: number; sourceRepresentation: "http-decoded-response-body";
};
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const fresh = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const clean = (text: string) => text.replace(/<[^>]*>/g, " ")
  .replace(/&ccedil;|&#231;/g, "ç").replace(/&nbsp;|&#160;/g, " ")
  .replace(/[\s\u00a0]+/g, " ").trim();
const same = (parts: EiFeeSource[]) => parts.every(s => s.url === parts[0].url
  && s.sourceBodySha256 === parts[0].sourceBodySha256 && s.capturedAt === parts[0].capturedAt);
const precedes = (start: EiFeeSource, end: EiFeeSource, limit: number) =>
  end.sourceStartByte >= start.sourceStartByte + Buffer.byteLength(start.text)
  && end.sourceStartByte - start.sourceStartByte <= limit && end.firstLine >= start.firstLine;

/** Strict bounded replay of complete captured table rows, not an HTML reader. */
function row(source: string) {
  const shape = /^<tr>\s*((?:<t[dh](?:\s[^>]*)?>[\s\S]*?<\/t[dh]>\s*)+)<\/tr>$/i.exec(source);
  if (!shape) return null;
  const cells = [...shape[1].matchAll(/<(t[dh])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  if (!cells.length || cells.length > 20 || cells.some(c => /<\/?t[dh]\b/i.test(c[2]))) return null;
  return cells.map(c => clean(c[2]));
}

const tariffAmount = new RegExp("^AED (" + SOURCE_NUMBER + ")$");
const kfsAmount = new RegExp("^(" + SOURCE_NUMBER + ")$");

/** Types only the standard primary annual membership with an exact, agreeing KFS column and tariff row. */
export function parseEiNamedFees(input: readonly EiFeeSource[], slug: string) {
  if (!Object.hasOwn(EI_NAMED_FEE_CARDS, slug)) return null;
  const spec = EI_NAMED_FEE_CARDS[slug as keyof typeof EI_NAMED_FEE_CARDS];
  const canonical = PRODUCT + spec.route;
  const used: EiFeeSource[] = [];
  const get = (id: string, url: string) => {
    const matches = input.filter(x => x.id === id);
    const s = matches[0];
    if (matches.length !== 1 || !s || s.url !== url || !s.text || s.text.length > 6500
      || s.sourceRepresentation !== "http-decoded-response-body" || !hex.test(s.sourceBodySha256)
      || s.sourceTextSha256 !== s.sourceBodySha256 || s.fixtureTextSha256 !== sha(s.text)
      || !fresh.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1
      || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte < 0) return null;
    used.push(s);
    return s;
  };
  const title = get(slug + "-heading", canonical), apply = get(slug + "-apply-identity", canonical);
  const network = get(slug + "-issuer-network", canonical), art = get(slug + "-artwork-identity", canonical);
  const kVat = get("ei-kfs-vat", KFS), kHeader = get("ei-kfs-card-columns", KFS), kAmounts = get("ei-kfs-annual-fee-row", KFS);
  const tVat = get("ei-tariff-vat", TARIFF), scope = get("ei-tariff-profit-scope", TARIFF);
  const header = get("ei-tariff-membership-columns", TARIFF), tCard = get(slug + "-tariff-row", TARIFF);
  const feeBased = get("ei-tariff-fee-based-boundary", TARIFF);
  if (!title || !apply || !network || !art || !kVat || !kHeader || !kAmounts || !tVat || !scope || !header || !tCard || !feeBased
    || !same([title, apply, network, art]) || !same([kVat, kHeader, kAmounts]) || !same([tVat, scope, header, tCard, feeBased])
    || art.text !== spec.art || !precedes(art, title, 1500)
    || !precedes(title, apply, 2600) || !precedes(apply, network, 170000)
    || !precedes(kVat, kHeader, 2200) || !precedes(kHeader, kAmounts, 6500)
    || !precedes(tVat, scope, 2600) || !precedes(scope, header, 1300)
    || !precedes(header, tCard, 6500) || !precedes(tCard, feeBased, 8000)
    || !/^<h[12]\s[^>]*\bclass="title [^"]+"[^>]*>[\s\S]*<\/h[12]>$/.test(title.text)
    || clean(title.text) !== spec.heading || apply.text !== 'href="' + spec.apply + '"'
    || clean(kVat.text) !== "All charges are inclusive of Value Added Tax (VAT) in AED currency."
    || clean(tVat.text) !== "All charges, commissions and fees are inclusive of Value Added Tax or any other similar sales tax (VAT)."
    || clean(scope.text) !== "Profit based Cards" || clean(feeBased.text) !== "Fee based Cards"
    || !/\b(?:displaying|displays) the VISA logo\b/.test(clean(network.text))) return null;
  const names = row(kHeader.text), amounts = row(kAmounts.text), columns = row(header.text), tariff = row(tCard.text);
  if (!names || !amounts || !columns || !tariff || names.length !== amounts.length
    || names[0] !== "Product Name" || amounts[0] !== "Annual Fee"
    || names.filter(n => n === spec.kfsColumn).length !== 1
    || columns.join("|") !== "Credit Card Type|Monthly Profit Rate|Annual Membership Fee"
    || tariff.length !== 3 || tariff[0] !== spec.tariffName) return null;
  const kValue = amounts[names.indexOf(spec.kfsColumn)], tValue = tariff[2];
  const t = tariffAmount.exec(tValue)?.[1], k = kfsAmount.exec(kValue)?.[1];
  const gross = t === undefined ? null : parseSourceNumber(t), published = k === undefined ? null : parseSourceNumber(k);
  const fee = tValue === "No Annual Membership Fee" && kValue === "NA" ? 0
    : gross !== null && gross > 0 && gross === published ? gross : null;
  if (fee === null) return null;
  const pin = (s: EiFeeSource, unit: string, vatTreatment: "inclusive" | "not-applicable" = "not-applicable") => ({
    parserId: "emirates-islamic/named-primary-membership/v1", productScope: spec.name, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256,
    sourceTextSha256: s.sourceTextSha256, sourceRepresentation: s.sourceRepresentation,
    sourceExtraction: "http-decoded-html-excerpt" as const, captureMethod: "public-http-reader" as const,
    sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  return {
    name: spec.name, canonical, kfs: KFS, sources: [canonical, KFS, TARIFF],
    capturedDate: title.capturedAt.slice(0, 10), ids: used.map(s => s.id),
    fee, network: "Visa" as const, vatPolicy: "inclusive" as const,
    evidence: {
      annualFee: [pin(tCard, "AED standard annual membership fee for exact card in Profit based Cards", "inclusive"),
        pin(kHeader, "Named KFS columns in source order"), pin(kAmounts, "AED annual fee row aligned with named KFS columns", "inclusive"),
        pin(scope, "Profit-based pricing scope only"), pin(header, "Annual membership versus monthly profit columns"),
        pin(feeBased, "Following separate fee-based pricing scope"), pin(tVat, "Tariff VAT basis", "inclusive"),
        pin(kVat, "KFS AED and VAT basis", "inclusive")],
      network: [pin(network, "Issuer names Visa network in exact product FAQ; not a benefit or cash advance assertion"),
        pin(art, "Exact issuer product hero media identity; not a public image asset")],
    },
  };
}
