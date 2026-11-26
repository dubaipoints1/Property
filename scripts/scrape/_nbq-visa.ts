import { createHash } from "node:crypto";

const root = "https://nbq.ae";
const kfsPath = "/docs/default-source/kfs/01-nbq-kfs-cc-15102025-3.pdf?sfvrsn=2cbb48d7_8";
const kfs = root + kfsPath;
const tariff = root + "/docs/default-source/sc/01-rrbd-soc-03122025.pdf";
const variants = {
  "nbq-visa-gold": { tier:"Gold", index:1, line:17 },
  "nbq-visa-platinum": { tier:"Platinum", index:2, line:30 },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; sourceBodySha256: string; sourceTextSha256: string;
  text: string; fixtureTextSha256: string; sourceRepresentation: string; firstLine: number;
  sourceScope?: string; sourceStartByte?: number;
};
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const norm = (s: string) => s.trim().replace(/\s+/g, " ");
const columns = (s: string) => s.trim().split(/ {3,}/).map(norm);
const hash = /^[0-9a-f]{64}$/;
const pdf = "pdftotext-layout", html = "http-decoded-response-body";
function find(input: readonly Source[], id: string, url: string, representation: string) {
  const matches = input.filter(s => s.id === id);
  const s = matches[0];
  if (matches.length !== 1 || !s || s.url !== url || s.sourceRepresentation !== representation
      || typeof s.text !== "string" || !s.text || s.text.length > 1000 || sha(s.text) !== s.fixtureTextSha256
      || !hash.test(s.sourceBodySha256) || !hash.test(s.sourceTextSha256) || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt)
      || !Number.isFinite(Date.parse(s.capturedAt))) return null;
  if (representation === pdf) return s.sourceStartByte === undefined && s.sourceScope ? s : null;
  return s.sourceBodySha256 === s.sourceTextSha256 && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
const same = (a: Source, b: Source) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
const fee = (s: string) => /^free$/i.test(s) ? 0 : /^\d+(?:\.\d{1,2})?$/.test(s) ? Number(s) : null;

/** Exact NBQ Gold and Platinum standard principal annual fees only. No offer, eligibility or other numbers. */
export function parseNbqVisa(input: readonly Source[], slug: string) {
  if (input.length !== 9 || !Object.hasOwn(variants, slug)) return null;
  const v = variants[slug as keyof typeof variants];
  const name = "NBQ Visa " + v.tier + " Credit Card";
  const product = root + "/personal/cards/nbq-" + v.tier.toLowerCase() + "-credit-card";
  const h = find(input, slug+"-title",product,html), c = find(input,slug+"-cta",product,html);
  const kLink = find(input,slug+"-kfs-link",product,html), n = find(input,slug+"-visa",product,html);
  const kHead = find(input,"nbq-kfs-heading",kfs,pdf), kRow = find(input,slug+"-kfs-row",kfs,pdf);
  const tRow = find(input,"nbq-tariff-annual",tariff,pdf), vat = find(input,"nbq-tariff-vat",tariff,pdf);
  const effective = find(input,"nbq-tariff-effective",tariff,pdf);
  if (!h || !c || !kLink || !n || !kHead || !kRow || !tRow || !vat || !effective
      || ![c,kLink,n].every(x => same(x,h)) || !same(kHead,kRow) || ![vat,effective].every(x=>same(x,tRow))
      || [kRow,tRow].some(x => x.capturedAt.slice(0,10) !== h.capturedAt.slice(0,10))
      || h.text !== '<h2 class="heroBanner-headingText">'+v.tier+' Credit Card</h2>'
      || c.text !== '<a class="heroBanner-callToActionButton btn" href="/personal/application-form?type=CardsNBQ'+v.tier+'CreditCardFormHeader">'
      || !(c.sourceStartByte! > h.sourceStartByte! && c.sourceStartByte! - h.sourceStartByte! < 2000)
      || !kLink.text.includes('href="'+kfsPath+'"') || !kLink.text.includes('alt="Key Facts Statement For Credit Cards"')
      || !n.text.includes('href="https://ae.visamiddleeast.com/en_AE/pay-with-visa/find-a-card/'+v.tier.toLowerCase()+'.html"')
      || kHead.firstLine !== 1 || !norm(kHead.text).startsWith("Key Facts Statement – Credit Card")
      || !/Card\s+Annual\s+.*?Type\s+Fee - AED/s.test(kHead.text)
      || kRow.firstLine !== v.line || columns(kRow.text)[0] !== v.tier
      || vat.firstLine !== 3 || !vat.text.startsWith("The below charges are exclusive of 5%") || !/\bVAT$/.test(vat.text)
      || effective.firstLine !== 497 || effective.text !== "The above Charges are applicable from 4 Feb 2026"
      || tRow.firstLine !== 325) return null;
  const lines = tRow.text.split("\n");
  if (lines.length !== 3 || columns(lines[0]).slice(0, 4).join("|") !== "Card Type|Gold|Platinum|Infinite"
      || lines[1] !== "" || columns(lines[2])[0] !== "Annual Fee" || columns(lines[2]).length < 4) return null;
  const annualFee = fee(columns(kRow.text)[1] ?? "");
  if (annualFee === null || annualFee !== fee(columns(lines[2])[v.index] ?? "")) return null;

  const pin = (s: Source, unit: string, vatTreatment: "exclusive"|"not-applicable") => ({
    parserId:"nbq/visa-primary-annual/v1", productScope:name, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.sourceRepresentation, captureMethod:"public-http-reader",
    ...(s.sourceStartByte === undefined ? { sourceExtraction:pdf, sourceScope:s.sourceScope }
      : { sourceExtraction:"http-decoded-html-excerpt", sourceStartByte:s.sourceStartByte, sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text) }),
    firstLine:s.firstLine, lastLine:s.firstLine+s.text.split("\n").length-1, rawText:s.text, rawTextSha256:s.fixtureTextSha256,
  });
  return { name, productUrl:product, kfsUrl:kfs, annualFee, vatPolicy:"exclusive" as const,
    capturedDate:h.capturedAt.slice(0,10), sources:[product,kfs,tariff],
    sourceFixtureIds:[h,c,kLink,n,kHead,kRow,tRow,vat,effective].map(s=>s.id),
    evidence:{
      name:[pin(h,"Named UAE credit card", "not-applicable"),
        pin(c,"Named acquisition link identity only; linked form was not opened", "not-applicable"),
        pin(kLink,"Product page points to the same issuer Key Facts Statement", "not-applicable")],
      network:[pin(n,"Exact tier Visa information link in the issuer page", "not-applicable")],
      annualFee:[pin(kHead,"Credit card KFS named annual fee column", "not-applicable"),
        pin(kRow,"Exact annual fee cell on the named card row", "exclusive"),
        pin(tRow,"NBQ credit-card standard annual fee by exact tier", "exclusive"),
        pin(vat,"Retail tariff excludes VAT", "exclusive"),
        pin(effective,"Published fee schedule effective date", "not-applicable")],
    },
  };
}
