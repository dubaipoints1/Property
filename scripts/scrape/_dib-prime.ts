import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const ORIGIN = "https://www.dib.ae";
export const KFS = ORIGIN + "/docs/default-source/cpr/kfs/cards-kfs-dib-new-credit-cards-cm-sign-reqd-static.pdf?sfvrsn=799c3157_45";
export const SOC = ORIGIN + "/docs/default-source/cpr/soc/cpr-soc-cards.pdf";
export const DIB_PRIME = {
  "dib-prime-gold": { tier: "gold", name: "Prime Gold Card", kfsColumn: null },
  "dib-prime-signature": { tier: "signature", name: "Prime Signature Card", kfsColumn: 137 },
  "dib-prime-infinite": { tier: "infinite", name: "Prime Infinite Card", kfsColumn: 117 },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; sourceRepresentation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string;
};
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const sha = /^[a-f0-9]{64}$/;
const stripBidi = (s: string) => s.replace(/[\u202a-\u202e\u2066-\u2069]/g, "");
const tokenAt = (s: string, col: number) => [...s.matchAll(/\S+/g)].find(m => m.index === col)?.[0];
const incomePattern = new RegExp('^<div class="cc-title">AED (' + SOURCE_NUMBER
  + ') ?</div>\\s*<div class="cc-description">Minimum Salary</div>$');
function select(input: Source[], id: string, url: string, pdf: boolean) {
  const matches = input.filter(x => x.id === id);
  const s = matches[0];
  if (matches.length !== 1 || !s || s.url !== url || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256)
      || s.fixtureTextSha256 !== digest(s.text) || !Number.isFinite(Date.parse(s.capturedAt))
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  return pdf ? s.sourceRepresentation === "pdftotext-layout" && s.sourceScope && s.sourceStartByte === undefined ? s : null
    : s.sourceRepresentation === "http-decoded-response-body" && s.sourceTextSha256 === s.sourceBodySha256
      && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
const sameCapture = (a: Source, b: Source) => a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return { parserId: "dib/named-prime-tiers/v1", productScope, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, ...(s.sourceStartByte === undefined
      ? { sourceExtraction: "pdftotext-layout", sourceScope: s.sourceScope }
      : { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    captureMethod: "public-http-reader", firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256 };
}

export function parseDibPrime(input: Source[], slug: string) {
  if (!Object.hasOwn(DIB_PRIME, slug)) return null;
  const p = DIB_PRIME[slug as keyof typeof DIB_PRIME];
  const route = "prime-" + p.tier + "-card";
  const productUrl = ORIGIN + "/personal/cards/" + route;
  const application = ORIGIN + "/global/apply-now?type=card&view=Default&product=" + route;
  const html = (key: string, url = productUrl) => select(input, "prime-" + p.tier + "-" + key, url, false);
  const heading = html("heading"), apply = html("apply"), landing = html("landing", application);
  const salary = html("salary"), vat = select(input, "kfs-vat", KFS, true), tariff = select(input, "soc-fees", SOC, true);
  if (!heading || !apply || !landing || !salary || !vat || !tariff || !sameCapture(heading, apply)
      || !sameCapture(heading, salary)
      || heading.text.replace(/\s+/g, " ") !== '<h1 class="col-side-heading-1" itemprop="name"> <text>' + p.name + '</text> </h1>'
      || landing.text.replace(/\s+/g, " ") !== '<h1 class="col-side-heading-1"> ' + p.name + ' </h1>'
      || !apply.text.startsWith('<a href="/global/apply-now?type=card&amp;view=Default&amp;product=' + route + '" ')
      || !/>\s*Apply Now\s*<\/a>$/.test(apply.text)) return null;
  const insideNamedBlock = (s: Source) => sameCapture(heading, s)
    && s.sourceStartByte! > heading.sourceStartByte!
    && s.sourceStartByte! < apply.sourceStartByte!
    && apply.sourceStartByte! - heading.sourceStartByte! < 2500;
  const amount = salary.text.match(incomePattern)?.[1];
  const income = amount ? parseSourceNumber(amount) : null;
  if (!insideNamedBlock(salary) || income === null || income <= 0) return null;

  const rows = stripBidi(tariff.text).split("\n");
  if (rows.length !== 18 || !/^\s*Annual Fee\b/.test(rows[0])
      || !/Signature\s+إنفنيت Infinite$/.test(rows[2])
      || rows[3].trim().split(/\s+/).join("|") !== "Classic|Reward/Gold|Platinum"
      || !/^\s*مجانًا\s*$/.test(rows[4]) || !/^\s*Free\s*$/.test(rows[6])
      || !/^Prime Covered Card(?: +مجانًا Free){4} +بطاقة برايم المغطاة$/.test(rows[5].trim())
      || !/^• All charges are inclusive of 5% VAT which may be amended from time$/.test(stripBidi(vat.text))) return null;

  const sources = [heading, apply, landing, salary, vat, tariff];
  const annualEvidence = [pin(tariff, p.name, "AED standard annual membership fee", "inclusive"),
    pin(vat, p.name, "KFS stated VAT treatment", "not-applicable")];
  if (p.kfsColumn === null) {
    // English KFS extraction omits the Gold heading: never attribute an anonymous KFS column.
    // The exact Gold headline corroborates the explicitly labelled Reward/Gold tariff column.
    const headlineFee = html("annual-fee");
    if (!headlineFee || !insideNamedBlock(headlineFee)
        || !/^<div class="cc-title">No <\/div>\s*<div class="cc-description">Annual Fee <\/div>$/.test(headlineFee.text)) return null;
    sources.push(headlineFee);
    annualEvidence.push(pin(headlineFee, p.name, "AED issuer headline annual fee", "inclusive"));
  } else {
    const fees = select(input, "kfs-fees", KFS, true);
    if (!fees || !sameCapture(fees, vat)) return null;
    const kfs = stripBidi(fees.text).split("\n");
    if (kfs.length !== 20 || !/^Annual Fee\b/.test(kfs[15]) || !/^Renewal Fee\b/.test(kfs[19])
        || tokenAt(kfs[2], 117) !== "Prime" || tokenAt(kfs[0], 137) !== "Prime"
        || tokenAt(kfs[4], 116) !== "Infinite" || tokenAt(kfs[4], 135) !== "Signature"
        || tokenAt(kfs[15], p.kfsColumn) !== "Nil" || tokenAt(kfs[19], p.kfsColumn) !== "Nil") return null;
    sources.push(fees);
    annualEvidence.push(pin(fees, p.name, "AED annual membership and renewal fee", "inclusive"));
  }
  return { name: p.name, productUrl, application, kfsUrl: KFS, capturedDate: heading.capturedAt.slice(0, 10), annualFee: 0,
    income, ids: sources.map(source => source.id), sources: [productUrl, application, KFS, SOC],
    evidence: { annualFee: annualEvidence, "eligibility.publishedMinMonthlyIncome":
      [pin(salary, p.name, "AED published salary floor only", "not-applicable")] } };
}
