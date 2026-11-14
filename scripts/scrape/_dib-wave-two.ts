import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const ORIGIN = "https://www.dib.ae";
export const KFS = ORIGIN + "/docs/default-source/cpr/kfs/cards-kfs-dib-new-credit-cards-cm-sign-reqd-static.pdf?sfvrsn=799c3157_45";
export const SOC = ORIGIN + "/docs/default-source/cpr/soc/cpr-soc-cards.pdf";
export const TERMS = ORIGIN + "/docs/default-source/cpr/tc/dib-shams-cc-lto-saf-en1.pdf";
export const DIB_WAVE_TWO = {
  "dib-prime-platinum": { id: "prime", name: "Prime Platinum Card", route: "prime-platinum-card", col: 151 },
  "dib-shams-signature": { id: "signature", name: "DIB SHAMS Signature Covered Card", route: "shams-dib-signature-covered-card", col: 221 },
  "dib-shams-infinite": { id: "infinite", name: "DIB SHAMS Infinite Covered Card", route: "shams-dib-infinite-covered-card", col: 206 },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; sourceRepresentation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string;
};
type Product = (typeof DIB_WAVE_TWO)[keyof typeof DIB_WAVE_TWO];
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const bidi = (s: string) => s.replace(/[\u202a-\u202e\u2066-\u2069]/g, "");
const N = "(" + SOURCE_NUMBER + ")";
const at = (s: string, col: number) => [...s.matchAll(/\S+/g)].find(m => m.index === col)?.[0];
function read(s: string | undefined) { return s ? parseSourceNumber(s) : null; }
function select(input: Source[], id: string, url: string, pdf: boolean) {
  const rows = input.filter(x => x.id === id);
  if (rows.length !== 1) return null;
  const s = rows[0]!;
  if (s.url !== url || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256)
      || s.fixtureTextSha256 !== digest(s.text) || !Number.isFinite(Date.parse(s.capturedAt))
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  return pdf ? s.sourceRepresentation === "pdftotext-layout" && s.sourceScope && s.sourceStartByte === undefined ? s : null
    : s.sourceRepresentation === "http-decoded-response-body" && s.sourceTextSha256 === s.sourceBodySha256
      && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
function same(a: Source, b: Source) {
  return a.sourceTextSha256 === b.sourceTextSha256 && a.sourceBodySha256 === b.sourceBodySha256 && a.capturedAt === b.capturedAt;
}
function pin(s: Source, product: Product, unit: string, vatTreatment: "inclusive" | "exclusive" | "not-applicable") {
  return { parserId: "dib/named-prime-and-shams-tiers/v1", productScope: product.name, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceStartByte === undefined ? "pdftotext-layout" : "http-decoded-response-body",
    ...(s.sourceStartByte === undefined ? { sourceExtraction: "pdftotext-layout", sourceScope: s.sourceScope } :
      { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    captureMethod: "public-http-reader", firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256 };
}

export function parseDibWaveTwo(input: Source[], slug: string) {
  if (!Object.hasOwn(DIB_WAVE_TWO, slug)) return null;
  const p = DIB_WAVE_TWO[slug as keyof typeof DIB_WAVE_TWO];
  const productUrl = ORIGIN + "/personal/cards/" + p.route;
  const application = ORIGIN + "/global/apply-now?type=card&view=Default&product=" + p.route;
  const h = (key: string, url = productUrl) => select(input, p.id + "-" + key, url, false);
  const head = h("head"), apply = h("apply"), land = h("landing", application);
  const fees = select(input, "kfs-fees", KFS, true), foot = select(input, "kfs-foot", KFS, true);
  const vat = select(input, "kfs-vat", KFS, true), soc = select(input, "soc-fees", SOC, true);
  if (!head || !apply || !land || !fees || !foot || !vat || !soc || !same(head, apply) || !same(fees, foot) || !same(fees, vat)
      || !/^<h1 class="col-side-heading-1" itemprop="name">\s*<text>[^<]+<\/text>\s*<\/h1>$/.test(head.text)
      || !head.text.includes("<text>" + p.name + "</text>")
      || land.text.replace(/<[^>]+>/g, "").trim() !== p.name
      || !apply.text.startsWith(`<a href="/global/apply-now?type=card&amp;view=Default&amp;product=${p.route}" `)
      || !/>\s*Apply Now\s*<\/a>$/.test(apply.text) || apply.sourceStartByte! - head.sourceStartByte! < 1
      || apply.sourceStartByte! - head.sourceStartByte! > 1800) return null;
  const table = bidi(fees.text).split("\n");
  const tariff = bidi(soc.text).split("\n");
  const rate = read(bidi(vat.text).match(new RegExp("^• All charges are inclusive of " + N + "% VAT which may be amended from time$"))?.[1]);
  if (table.length !== 20 || !/^Annual Fee\b/.test(table[15]) || !/^Renewal Fee\b/.test(table[19])
      || at(table[0], 150) !== "Prime" || at(table[4], 149) !== "Platinum"
      || at(table[0], 222) !== "SHAMS" || at(table[0], 234) !== "SHAMS" || at(table[2], 206) !== "SHAMS"
      || at(table[5], 206) !== "Infinite" || at(table[5], 221) !== "Signature" || at(table[5], 233) !== "Platinum"
      || rate === null || rate <= 0 || rate > 10 || tariff.length !== 18
      || !/Annual Fee/.test(tariff[0]) || !/Signature.*Infinite/.test(tariff[2]) || !/Classic.*Reward\/Gold.*Platinum/.test(tariff[3])) return null;
  const annualEvidence = [pin(fees, p, "AED annual membership and renewal fee", "inclusive"),
    pin(vat, p, "percent VAT included", "not-applicable"), pin(soc, p, "matching issuer charge schedule", "inclusive")];
  const ids = [head.id, apply.id, land.id, fees.id, vat.id, soc.id];
  const base = { name: p.name, productUrl, application, kfsUrl: KFS, capturedDate: head.capturedAt.slice(0,10), ids };
  if (p.id === "prime") {
    const row = tariff[5].trim().match(/^Prime Covered Card(?: +مجانًا Free){4} +بطاقة برايم المغطاة$/);
    const salary = h("salary");
    const floor = salary && read(salary.text.match(new RegExp('^<div class="cc-title">AED ' + N +
      '</div>\\s*<div class="cc-description">Minimum Salary</div>$'))?.[1]);
    if (!row || at(table[15], p.col) !== "Nil" || at(table[19], p.col) !== "Nil" ||
        !salary || !same(head, salary) || !floor || floor <= 0 || salary.sourceStartByte! <= head.sourceStartByte!
        || salary.sourceStartByte! >= apply.sourceStartByte!) return null;
    return { ...base, annualFee: 0, income: floor, waiver: undefined, ids: [...ids, salary.id], sources: [productUrl, application, KFS, SOC],
      evidence: { annualFee: annualEvidence, "eligibility.publishedMinMonthlyIncome": [pin(salary, p, "AED published salary floor only", "not-applicable")] } };
  }
  const offer = select(input, "offer-fees", TERMS, true), offerVat = select(input, "offer-vat", TERMS, true), waiver = h("waiver");
  const scope = select(input, "offer-scope", TERMS, true);
  if (!offer || !offerVat || !scope || !waiver || !same(offer, offerVat) || !same(offer, scope) || !same(head, waiver)
      || !/^General Terms and Conditions\n1\. +Cards approved and issued by 31 December 2026 shall qualify for the above Offer\.\n2\. +Limited time period, offer subject to change\.\n3\. +This offer can be availed only once per customer during the lifetime of the card\.\n4\. +DIB SHAMS Card holders who canceled their card in last \(6\) months are not eligible for the offer\./.test(scope.text)
      || !scope.text.includes("6. Annual Membership Fee:") || !scope.text.includes("The first-year annual fee shall not be applied to Applicant’s Card")
      || offerVat.text.trim() !== "• VAT will be applied on the Annual Membership Fee") return null;
  const o = offer.text.split("\n").map(line => line.trim());
  const columns = (line: string) => line.split(/ {2,}/);
  const oHead = columns(o[0]), oOpen = columns(o[4]), oSpend = columns(o[10]), oFee = columns(o[14]);
  if (o.length !== 16 || oHead.join("|") !== "DIB SHAMS Covered Card|Infinite|Signature|Platinum"
      || oOpen.join("|") !== "Annual Membership Fee Year 1|Free|Free|Free"
      || oSpend[0] !== "Annual Membership Fee" || oFee[0] !== "the absence of not meeting the") return null;
  const tiers = [206, 221, 233];
  const footRows = bidi(foot.text).split("\n").map(line => line.split(/ {4,}/)[0]).join("\n");
  const m = footRows.match(new RegExp("^\\* If the spend criteria is not met than an annual membership fee of AED\\n"
    + N + ", AED " + N + " and AED " + N + " will be levied respectively on\\nInfinite, Signature and Platinum cards, from the 2nd year onwards\\.$"));
  const tariffRow = tariff[17].trim().match(new RegExp("^SHAMS Covered Card +ال يوجد N/A +ال يوجد N/A +"
    + N + " +" + N + " +" + N + " +بطاقة شمس المغطاة$"));
  if (!m || !tariffRow || tiers.some((col, i) => {
    const exact = read(at(table[14], col));
    const net = read(oFee[i + 1]?.match(new RegExp("^AED " + N + "$"))?.[1]);
    return exact === null || net === null || exact !== read(at(table[18], col)?.match(new RegExp("^\\*" + N + "$"))?.[1])
      || exact !== read(m[i + 1]) || exact !== read(tariffRow[3 - i]) || Math.round(net * (100 + rate)) / 100 !== exact;
  })) return null;
  const i = tiers.indexOf(p.col);
  const threshold = read(waiver.text.match(new RegExp("^<p>\\*No annual fee for the first year and fee waived for subsequent years on a minimum annual spend of AED " + N + "</p>$"))?.[1]);
  if (!threshold || threshold !== read(oSpend[i + 1]?.match(new RegExp("^AED " + N + " per annum$"))?.[1])) return null;
  // The issuer’s bounded offer is not a universal first-year or ongoing fee.
  return { ...base, annualFee: read(at(table[14], p.col))!, income: null, ids: [...ids, foot.id, waiver.id, offer.id, scope.id, offerVat.id],
    waiver: undefined,
    sources: [productUrl, application, KFS, SOC, TERMS],
    evidence: { annualFee: [...annualEvidence, pin(foot, p, "AED conditional renewal from year two", "inclusive"),
      pin(offer, p, "AED fees in terms before VAT", "exclusive"), pin(offerVat, p, "VAT applies", "not-applicable")],
      "annualFeeWaiver.conditionalOffer": [pin(waiver, p, "headline annual renewal spend", "not-applicable"),
        pin(offer, p, "limited first-year waiver and tier-specific renewal spend", "not-applicable"),
        pin(scope, p, "application expiry and offer eligibility", "not-applicable")] } };
}
