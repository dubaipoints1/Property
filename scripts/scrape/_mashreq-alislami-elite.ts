import { createHash } from "node:crypto";

const kfs = "https://www.mashreqalislami.com/-/jssmedia/pdfs/mai/neo/cards/mai-credit-card-new-kfs.ashx";
const tariff = "https://www.mashreq.com/-/jssmedia/pdfs/neo/cards/mashreq-cards-soc-latest.ashx";
export const MASHREQ_ISLAMIC_ELITE = {
  "mashreq-islamic-platinum-elite": {
    name: "Mashreq Al Islami Platinum Elite Credit Card", heading: "Platinum Elite Credit Card",
    url: "https://www.mashreqalislami.com/en/uae/neo/cards/credit-cards/platinum-elite-credit-card/",
    query: "utm_pname=maiplatinumelite&amp;utm_pcode=MAI92", kColumn: 1, tariffColumn: 5,
  },
  "mashreq-emirati-solitaire": {
    name: "Mashreq Al Islami Emirati Solitaire Credit Card", heading: "Mashreq Al Islami Emirati Solitaire Credit Card",
    url: "https://www.mashreqalislami.com/en/uae/emirati-banking/solitaire-credit-card/",
    query: "utm_pname=emisolitaire&amp;utm_pcode=EMI92", kColumn: 2, tariffColumn: 4,
  },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; sourceBodySha256: string; sourceTextSha256: string;
  text: string; fixtureTextSha256: string; sourceRepresentation: string; firstLine: number;
  sourceScope?: string; sourceStartByte?: number;
};

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const digest = /^[0-9a-f]{64}$/;
const norm = (text: string) => text.trim().replace(/\s+/g, " ");
const row = (text: string) => text.trim().split(/ {3,}/).map(norm);
const sameCapture = (a: Source, b: Source) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
const pdf = "pdftotext-layout", html = "http-decoded-response-body";

function exact(sources: readonly Source[], id: string, url: string, representation: string) {
  const matches = sources.filter(s => s.id === id);
  const s = matches[0];
  if (matches.length !== 1 || !s || s.url !== url || s.sourceRepresentation !== representation
      || !digest.test(s.sourceBodySha256) || !digest.test(s.sourceTextSha256)
      || typeof s.text !== "string" || !s.text || s.text.length > 3000 || sha(s.text) !== s.fixtureTextSha256
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt)
      || !Number.isFinite(Date.parse(s.capturedAt))) return null;
  return representation === html
    ? (s.sourceTextSha256 === s.sourceBodySha256 && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null)
    : (s.sourceStartByte === undefined && s.sourceScope ? s : null);
}

const fee = (value: string) => /^\d+(?:\.\d{1,2})?$/.test(value) ? Number(value) : null;

/** Exact first-party KFS columns corroborated by the matching Islamic tariff columns. No other typed claims. */
export function parseMashreqIslamicElite(sources: readonly Source[], slug: string) {
  if (!Object.hasOwn(MASHREQ_ISLAMIC_ELITE, slug) || sources.length !== 6) return null;
  const product = MASHREQ_ISLAMIC_ELITE[slug as keyof typeof MASHREQ_ISLAMIC_ELITE];
  const heading = exact(sources, slug + "-heading", product.url, html);
  const cta = exact(sources, slug + "-cta", product.url, html);
  const kVersion = exact(sources, "mai-elite-kfs-version", kfs, pdf);
  const kPricing = exact(sources, "mai-elite-kfs-fee", kfs, pdf);
  const tVat = exact(sources, "mai-elite-tariff-vat", tariff, pdf);
  const tPricing = exact(sources, "mai-elite-tariff-principal", tariff, pdf);
  if (!heading || !cta || !kVersion || !kPricing || !tVat || !tPricing || !sameCapture(heading, cta)
      || !sameCapture(kVersion, kPricing) || !sameCapture(tVat, tPricing)
      || [kVersion, tVat].some(s => s.capturedAt.slice(0, 10) !== heading.capturedAt.slice(0, 10))
      || heading.text.match(/^<h5\b[^>]*>([^<>]+)<\/h5>$/)?.[1] !== product.heading
      || !/^<a\b[^>]*>$/.test(cta.text)
      || !cta.text.includes('href="https://digital.mashreqbank.com/creditcards/ntb/otp-send?' + product.query + '"')
      || !cta.text.includes('title="Apply Now"')
      || !(cta.sourceStartByte! > heading.sourceStartByte! && cta.sourceStartByte! - heading.sourceStartByte! < 3_000)) return null;

  const k = kPricing.text.split("\n");
  const t = tPricing.text.split("\n");
  if (kVersion.firstLine !== 1 || norm(kVersion.text) !== "KFS_Cards_September 2026"
      || kPricing.firstLine !== 17 || k.length !== 11 || norm(k[0]) !== "LOYALTY, BENEFITS & PRICING:"
      || row(k[1]).join("|") !== "MAI Cashback|MAI Platinum Elite|MAI Emirati Solitaire"
      || norm(k[3]) !== "Annual fee (primary) -" || norm(k[4]) !== "AED"
      || row(k[6])[0] !== "recurring (VAT inclusive)" || row(k[6]).length !== 4
      || row(k[9])[0] !== "Annual fee (supplementary) -" || norm(k[10]) !== "recurring (VAT inclusive)"
      || tVat.firstLine !== 2 || !/^Disclaimer: With effect from January 2019, all fees and charges mentoned below are inclusive of 5% Value Added Tax /.test(norm(tVat.text))
      || tPricing.firstLine !== 6 || t.length !== 4
      || row(t[0]).slice(0, 8).join("|") !== "Charges (in D)|Solitaire Card|Platinum Plus Card|24X7 Cashback Card|Smart Saver Card|Mashreq Al Islami Solitaire Card|Mashreq Al Islami Platinum Card|Mashreq Al Islami 24X7 Cashback Card"
      || norm(t[1]) !== "Joining Fee" || row(t[2])[0] !== "Principal Annual Fee" || row(t[2]).length !== row(t[0]).length
      || row(t[3])[0] !== "Supplementary Annual Fee" || row(t[3]).length !== row(t[0]).length) return null;
  const annual = fee(row(k[6])[product.kColumn + 1]);
  const rawTariff = row(t[2])[product.tariffColumn + 1];
  const other = /^free for life$/i.test(rawTariff) ? 0 : fee(rawTariff.match(/^D (\d+(?:\.\d{1,2})?)$/)?.[1] ?? "");
  if (annual === null || annual !== other) return null;
  const pin = (s: Source, unit: string, vatTreatment: "inclusive" | "not-applicable") => ({
    parserId: "mashreq/alislami-elite-standard/v1", productScope: product.name, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.sourceRepresentation, captureMethod:"public-http-reader",
    ...(s.sourceStartByte === undefined ? { sourceExtraction:pdf, sourceScope:s.sourceScope }
      : { sourceExtraction:"http-decoded-html-excerpt", sourceStartByte:s.sourceStartByte, sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text) }),
    firstLine:s.firstLine, lastLine:s.firstLine+s.text.split("\n").length-1, rawText:s.text, rawTextSha256:s.fixtureTextSha256,
  });
  return {
    name: product.name, productUrl: product.url, kfsUrl: kfs, annualFee: annual, vatPolicy: "inclusive" as const,
    capturedDate: heading.capturedAt.slice(0, 10), sources: [product.url, kfs, tariff],
    sourceFixtureIds: [heading, cta, kVersion, kPricing, tVat, tPricing].map(s => s.id),
    evidence: {
      name: [pin(heading, "Exact card heading on the Mashreq Al Islami UAE site", "not-applicable"),
        pin(cta, "Named public application link observed; destination not opened and no eligibility inferred", "not-applicable")],
      annualFee: [pin(kVersion, "Version of the issuer's named Al Islami Key Facts Sheet", "not-applicable"),
        pin(kPricing, "Exact named primary recurring annual membership fee, not the supplementary fee", "inclusive"),
        pin(tVat, "Published tariff VAT basis", "inclusive"),
        pin(tPricing, "The matching Islamic tariff annual membership column, not a joining or conventional-card charge", "inclusive")],
    },
  };
}
