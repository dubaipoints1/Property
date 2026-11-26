import { createHash } from "node:crypto";

const base = "https://www.almasraf.ae";
export const AL_MASRAF_WORLD = {
  slug: "al-masraf-mastercard-world",
  name: "Al Masraf Mastercard World Credit Card",
  productUrl: base + "/en/personal-banking/personal-card/world",
  kfsUrl: base + "/pdf/kfs-credit-card.pdf",
  tariffUrl: base + "/pdf/schedule-of-charges-retail-banking.pdf",
  campaignUrl: base + "/free-for-life",
} as const;

const profile = AL_MASRAF_WORLD;
/** Exact captured witnesses, not a general-purpose fee extractor. */
const pins = {
  "world-product-title": {
    "url": "https://www.almasraf.ae/en/personal-banking/personal-card/world",
    "firstLine": 9,
    "lastLine": 11,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "0ee7da4e292df4c1a3e6ec3de6447e5118519648e3472273b26723a550954388",
    "layout": "0ee7da4e292df4c1a3e6ec3de6447e5118519648e3472273b26723a550954388",
    "excerpt": "50b69e5acddefa6ff720c155583610c677f795ae1288cbc71c93c7adb6613f3b"
  },
  "world-product-canonical": {
    "url": "https://www.almasraf.ae/en/personal-banking/personal-card/world",
    "firstLine": 32,
    "lastLine": 32,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "0ee7da4e292df4c1a3e6ec3de6447e5118519648e3472273b26723a550954388",
    "layout": "0ee7da4e292df4c1a3e6ec3de6447e5118519648e3472273b26723a550954388",
    "excerpt": "f414aacd845472cd332ed842b40945d1f69b972a13fef6151c84f9148c7e4c02"
  },
  "world-shared-cta": {
    "url": "https://www.almasraf.ae/en/personal-banking/personal-card/world",
    "firstLine": 699,
    "lastLine": 702,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "0ee7da4e292df4c1a3e6ec3de6447e5118519648e3472273b26723a550954388",
    "layout": "0ee7da4e292df4c1a3e6ec3de6447e5118519648e3472273b26723a550954388",
    "excerpt": "7177e664d4d735530f22f91eba7abc836bcd0d958473fc6e366840185bc6c9eb"
  },
  "platinum-shared-cta-witness": {
    "url": "https://www.almasraf.ae/en/personal-banking/personal-card/platinum",
    "firstLine": 700,
    "lastLine": 703,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "9ce08afe6b55422d5e9479fce80bc1bc4208fe3871b20e1c37b1e8967ce36f35",
    "layout": "9ce08afe6b55422d5e9479fce80bc1bc4208fe3871b20e1c37b1e8967ce36f35",
    "excerpt": "7177e664d4d735530f22f91eba7abc836bcd0d958473fc6e366840185bc6c9eb"
  },
  "conventional-kfs-index-link": {
    "url": "https://www.almasraf.ae/key-fact-statements",
    "firstLine": 966,
    "lastLine": 970,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "af6ed75173365bc0302e8d07d3d77afa691edf2dcc9c52503a182b044680abfc",
    "layout": "af6ed75173365bc0302e8d07d3d77afa691edf2dcc9c52503a182b044680abfc",
    "excerpt": "5e4f9871f4974b020e14d31c4403dc85c574b7f03551b6022ea0814008d353fe"
  },
  "conventional-tariff-index-link": {
    "url": "https://www.almasraf.ae/schedule-charges",
    "firstLine": 714,
    "lastLine": 718,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "68eafc23f47c0511ce7f22701f5dee0c8bbf36f65080cbcbc3e30e2fdc4adab9",
    "layout": "68eafc23f47c0511ce7f22701f5dee0c8bbf36f65080cbcbc3e30e2fdc4adab9",
    "excerpt": "81b9979ddddb7005a1c1e74a478559ac0e38005f0602cccaf26398ab6499b7f6"
  },
  "conventional-kfs-product-row": {
    "url": "https://www.almasraf.ae/pdf/kfs-credit-card.pdf",
    "firstLine": 14,
    "lastLine": 14,
    "sourceRepresentation": "pdftotext-layout",
    "body": "0c0057c4209e0fc80a90558ce42384cc8bc1d2de8392a3091c8d4527e83c7bf1",
    "layout": "51cd58fed397a3dbc5986dc6034e921d8b6cd730ba39ff143097fde958941351",
    "excerpt": "5c074fb3cfc231a72399a71f1f9acd04b8b7e7fe15436167ad9e618d6dc6c878"
  },
  "conventional-kfs-fee-referral": {
    "url": "https://www.almasraf.ae/pdf/kfs-credit-card.pdf",
    "firstLine": 18,
    "lastLine": 20,
    "sourceRepresentation": "pdftotext-layout",
    "body": "0c0057c4209e0fc80a90558ce42384cc8bc1d2de8392a3091c8d4527e83c7bf1",
    "layout": "51cd58fed397a3dbc5986dc6034e921d8b6cd730ba39ff143097fde958941351",
    "excerpt": "43f4e4381210435509ef78a352daca4a9afa2958e4b690bfbeddc697f49532b6"
  },
  "retail-tariff-edition-tax": {
    "url": "https://www.almasraf.ae/pdf/schedule-of-charges-retail-banking.pdf",
    "firstLine": 6,
    "lastLine": 7,
    "sourceRepresentation": "pdftotext-layout",
    "body": "e85db62a18de21fc0aec9c8afb1ce920b4b04b2c258c0fafbb75b363696a4439",
    "layout": "0e9501b27919276372570f0b19f61082fc18fe8258d9f09ec7c6da5a226488c6",
    "excerpt": "72a1c7cc80d043a40d7cd97e7c6c9ca8786efbbc26ad539cd7a50085f627a7b7"
  },
  "retail-tariff-annual-table": {
    "url": "https://www.almasraf.ae/pdf/schedule-of-charges-retail-banking.pdf",
    "firstLine": 213,
    "lastLine": 217,
    "sourceRepresentation": "pdftotext-layout",
    "body": "e85db62a18de21fc0aec9c8afb1ce920b4b04b2c258c0fafbb75b363696a4439",
    "layout": "0e9501b27919276372570f0b19f61082fc18fe8258d9f09ec7c6da5a226488c6",
    "excerpt": "0cc7455a3c44ef5020b98e22e17bbb906660d42dfb74f13610257113ec1cff57"
  },
  "expired-campaign-date": {
    "url": "https://www.almasraf.ae/free-for-life",
    "firstLine": 607,
    "lastLine": 607,
    "sourceRepresentation": "http-decoded-response-body",
    "body": "e117cbc9103f2c60a6264a1e2376ef9cbd78f40768843d74d416e121acb922d8",
    "layout": "e117cbc9103f2c60a6264a1e2376ef9cbd78f40768843d74d416e121acb922d8",
    "excerpt": "e29f9c0da15d57a82a29fa1801547d69e312678c348891288ebef257cc1ce581"
  }
} as const;

type Id = keyof typeof pins;
export type AlMasrafWorldSource = {
  id: string; url: string; capturedAt: string; text: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
  fixtureIsCompleteSource: false;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; lastLine: number; sourceScope?: string;
  sourceStartByte?: number; sourceEndByte?: number; sourceBodyBytes: number;
};
const sha = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const norm = (line: string) => line.replace(/[\u202a-\u202e\u2066-\u2069]/gu, "").trim().replace(/\s{2,}/g, " | ");
const clean = (line: string) => line.trim().replace(/\s+/g, " ");

function exact(sources: readonly AlMasrafWorldSource[], id: Id) {
  const hits = sources.filter(s => s.id === id);
  const s = hits[0], p = pins[id];
  if (hits.length !== 1 || !s || s.url !== p.url || s.sourceRepresentation !== p.sourceRepresentation
      || s.fixtureIsCompleteSource !== false
      || s.firstLine !== p.firstLine || s.lastLine !== p.lastLine
      || s.sourceBodySha256 !== p.body || s.sourceTextSha256 !== p.layout
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))
      || typeof s.text !== "string" || s.text.split("\n").length !== s.lastLine - s.firstLine + 1
      || s.fixtureTextSha256 !== p.excerpt || sha(s.text) !== p.excerpt) return null;
  if (s.sourceRepresentation === "http-decoded-response-body") {
    return Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0
      && Number.isSafeInteger(s.sourceEndByte) && s.sourceEndByte! <= s.sourceBodyBytes
      && s.sourceEndByte! - s.sourceStartByte! === Buffer.byteLength(s.text) ? s : null;
  }
  return s.sourceScope === "PDF page 1, page-local Poppler -layout lines"
    && s.sourceStartByte === undefined && s.sourceEndByte === undefined ? s : null;
}

const href = (text: string) => text.match(/(?:^|[\s<])href="([^"]+)"/)?.[1];
const sameCapture = (a: AlMasrafWorldSource, b: AlMasrafWorldSource) => a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;

export function parseAlMasrafWorld(sources: readonly AlMasrafWorldSource[], slug: string) {
  if (slug !== profile.slug || sources.length !== Object.keys(pins).length) return null;
  const title = exact(sources, "world-product-title"), canonical = exact(sources, "world-product-canonical");
  const cta = exact(sources, "world-shared-cta"), witness = exact(sources, "platinum-shared-cta-witness");
  const kfsIndex = exact(sources, "conventional-kfs-index-link"), tariffIndex = exact(sources, "conventional-tariff-index-link");
  const family = exact(sources, "conventional-kfs-product-row"), period = exact(sources, "conventional-kfs-fee-referral");
  const vat = exact(sources, "retail-tariff-edition-tax"), feeTable = exact(sources, "retail-tariff-annual-table");
  const ended = exact(sources, "expired-campaign-date");
  if (!title || !canonical || !cta || !witness || !kfsIndex || !tariffIndex || !family || !period || !vat || !feeTable || !ended
      || !sameCapture(title, canonical) || !sameCapture(title, cta) || !sameCapture(family, period) || !sameCapture(vat, feeTable)
      || sources.some(s => s.capturedAt.slice(0, 10) !== title.capturedAt.slice(0, 10))
      || clean(title.text) !== "<title> World Credit Card | Al Masraf </title>"
      || !canonical.text.includes('rel="canonical"') || href(canonical.text) !== profile.productUrl
      || !/>\s*Apply now\s*<\/a>$/.test(cta.text) || !/>\s*Apply now\s*<\/a>$/.test(witness.text)
      || href(cta.text) !== base + "/en/apply-now" || href(witness.text) !== href(cta.text)
      || href(kfsIndex.text) !== "/pdf/kfs-credit-card.pdf" || !/>\s*KFS Credit Card\s*<\/a>$/.test(kfsIndex.text)
      || href(tariffIndex.text) !== "/pdf/schedule-of-charges-retail-banking.pdf"
      || !/>\s*Schedule of Charges\s+-\s+Retail Banking\s*<\/a>$/.test(tariffIndex.text)
      || !/^Products offered \| Al Masraf Mastercard Word Elite \| Al Masraf Mastercard World \| Al Masraf Mastercard Platinum$/.test(norm(family.text))
      || !/The Annual Fee is payable as prescribed by Al Masraf in the Schedule of Charges SCHEDULE OF CHARGES - Retail\s+Annual Fees\s+Banking \(2023\) \(almasraf\.ae\) for the Customer’s Credit Card\./.test(clean(period.text))
      || !/Will be charged once a year, irrespective of usage\/status\.$/.test(clean(period.text))
      || !/^With Effect from 09\/01\/2023 \|/.test(norm(vat.text.split("\n")[0]))
      || !/^Additional 5% VAT will be charged on all tariff mentioned below \|/.test(norm(vat.text.split("\n")[1]))) return null;
  const rows = feeTable.text.split("\n").map(norm);
  if (rows.length !== 5 || !/^11\.1 \| \)Annual Fee \(per annum \|/.test(rows[0])
      || !/^11\.1\.1 \| World Elite Credit Card \|/.test(rows[1])
      || !/^11\.1\.3 \| Platinum Credit Card \|/.test(rows[3])
      || !/^11\.2 \| Supplementary Card Annual Fee \|/.test(rows[4])) return null;
  const raw = rows[2].match(/^11\.1\.2 \| World Credit Card \| ((?:[1-9]\d{0,2})(?:,\d{3})*) \| \1 \|/);
  const annualFee = raw ? Number(raw[1].replaceAll(",", "")) : NaN;
  const campaign = clean(ended.text).match(/^Limited time offer\. Valid until (\d{1,2})th June (\d{4})$/);
  if (!Number.isSafeInteger(annualFee) || annualFee <= 0 || !campaign) return null;
  const expiredCampaignDate = campaign[2] + "-06-" + campaign[1].padStart(2, "0");
  if (expiredCampaignDate !== "2026-06-14" || expiredCampaignDate >= ended.capturedAt.slice(0, 10)) return null;
  const record = (s: AlMasrafWorldSource, unit: string, vatTreatment: "exclusive" | "not-applicable") => ({
    parserId:"almasraf/conventional-world-standard-annual/v1", productScope:profile.name, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.sourceRepresentation, captureMethod:"public-http-reader",
    ...(s.sourceStartByte === undefined ? { sourceExtraction:"pdftotext-layout",sourceScope:s.sourceScope }
      : { sourceExtraction:"http-decoded-html-excerpt",sourceStartByte:s.sourceStartByte,sourceEndByte:s.sourceEndByte }),
    firstLine:s.firstLine,lastLine:s.lastLine,rawText:s.text,rawTextSha256:s.fixtureTextSha256,
  });
  return {
    name:profile.name,productUrl:profile.productUrl,kfsUrl:profile.kfsUrl,
    annualFee, vatPolicy:"exclusive" as const, network:"Mastercard" as const, sharia:false as const,
    standardFeeConditions:"standard-only" as const, applicationAvailability:"unconfirmed" as const,
    expiredCampaignDate, tariffPrintedEffectiveDate:"09/01/2023" as const, capturedDate:title.capturedAt.slice(0,10),
    sources:[profile.productUrl,profile.kfsUrl,profile.tariffUrl,profile.campaignUrl],
    sourceFixtureIds:Object.keys(pins),
    evidence: {
      name:[record(title,"Exact issuer World Credit Card title", "not-applicable"),
        record(canonical,"Canonical conventional World product route", "not-applicable"),
        record(kfsIndex,"Current conventional KFS index link", "not-applicable")],
      network:[record(family,"Exact conventional KFS Products offered row identifies Al Masraf Mastercard World", "not-applicable")],
      annualFee:[record(period,"Conventional KFS names the retail tariff as price authority and the once-yearly period; it does not state the amount", "not-applicable"),
        record(tariffIndex,"Current bank index links the conventional retail tariff", "not-applicable"),
        record(feeTable,"Named World retail-credit-card annual tariff row, excluded from supplementary charge or campaign illustration", "exclusive"),
        record(vat,"Retail tariff with a printed 2023 effective date specifies additional VAT", "exclusive")],
      vatPolicy:[record(vat,"Retail tariff with a printed 2023 effective date specifies additional VAT on displayed fees", "exclusive")],
      applicationAvailability:[record(cta,"World product points to the shared issuer application entry only; no exact-tier intake verified", "not-applicable"),
        record(witness,"Platinum sibling uses the same generic link; destination not opened", "not-applicable")],
    },
  };
}
