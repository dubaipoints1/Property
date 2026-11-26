import { createHash } from "node:crypto";

const bank = "https://www.cbiuae.com";
const products = bank + "/en/personal/products-and-services/cards/";
export const cbiTariff = bank + "/media/uqziuyjp/cbi-credit-card-schedule-of-charges-nov-2026-v1-1.pdf";
const kfsTail = "/cbi-credit-cards-key-facts-statement-april-2026.pdf";
export const cbiVariants = {
  "cbi-mastercard-titanium": { title: "Mastercard Titanium Credit Card", name: "CBI Mastercard Titanium Credit Card", path: "mastercard-titanium-credit-card/", kfsDirectory: "xbdnatz3", column: 3 },
  "cbi-rewards-platinum-mastercard": { title: "Rewards Platinum Credit Card", name: "CBI Rewards Platinum Mastercard Credit Card", path: "rewards-platinum-mastercard", kfsDirectory: "faspisn4", column: 2 },
} as const;
type Evidence = {
  id: string; url: string; representation: "pdftotext-layout" | "http-decoded-response-body";
  capturedAt: string; sourceBodySha256: string; sourceTextSha256: string; text: string;
  fixtureTextSha256: string; firstLine: number; sourceScope?: string; sourceStartByte?: number;
};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hash = /^[a-f0-9]{64}$/;
const sameBody = (a: Evidence, b: Evidence) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
const cols = (s: string) => s.trim().split(/ {3,}/);

/** Source-only standard primary annual fee, not total cost, add-on pricing, or application status. */
export function parseCbiAnnualFeeReferences(input: readonly Evidence[], slug: string) {
  if (!Object.hasOwn(cbiVariants, slug)) return null;
  const p = cbiVariants[slug as keyof typeof cbiVariants];
  const productUrl = products + p.path, kfsUrl = bank + "/media/" + p.kfsDirectory + kfsTail;
  const pdf = "pdftotext-layout", html = "http-decoded-response-body";
  const pick = (id: string, url: string, repr: Evidence["representation"]) => {
    const list = input.filter(x => x.id === id), s = list[0];
    if (list.length !== 1 || s.url !== url || s.representation !== repr || !s.text
      || sha(s.text) !== s.fixtureTextSha256 || !hash.test(s.sourceBodySha256) || !hash.test(s.sourceTextSha256)
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))) return null;
    return repr === pdf ? s.sourceScope && s.sourceStartByte === undefined ? s : null
      : s.sourceBodySha256 === s.sourceTextSha256 && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
  };

  const heading = pick(slug+"-heading", productUrl, html), cta = pick(slug+"-cta", productUrl, html);
  const network = pick(slug+"-mastercard", productUrl, html);
  const kfsLink = pick(slug+"-kfs-link", productUrl, html), tariffLink = pick(slug+"-tariff-link", productUrl, html);
  const kfs = pick(slug+"-kfs-primary", kfsUrl, pdf);
  const tariff = pick("cbi-tariff-primary", cbiTariff, pdf), revision = pick("cbi-tariff-revision", cbiTariff, pdf);
  const addOn = p.column === 2 ? pick(slug+"-optional-accelerator", productUrl, html) : null;
  if (!heading || !cta || !network || !kfsLink || !tariffLink || !kfs || !tariff || !revision
    || ![cta, network, kfsLink, tariffLink].every(s => sameBody(s, heading))
    || !sameBody(tariff, revision) || [tariff,kfs].some(s=>s.capturedAt.slice(0,10)!==heading.capturedAt.slice(0,10))
    || heading.text !== "<h1>"+p.title+"</h1>"
    || !(cta.sourceStartByte! > heading.sourceStartByte! && cta.sourceStartByte! - heading.sourceStartByte! < 400)
    || !/^<a href="\/en\/personal\/products-and-services\/credit-card-form\/" class="btn btn-primary btnApplyNow" title="Apply now">Apply now<\/a>$/i.test(cta.text)
    || !kfsLink.text.includes('href="'+new URL(kfsUrl).pathname+'"') || !tariffLink.text.includes('href="'+new URL(cbiTariff).pathname+'"')
    || !network.text.includes(p.column===2 ? "CBI Rewards Platinum Mastercard." : 'title="Mastercard Titanium Credit Card"')
    || (p.column===2 && (!addOn || !sameBody(addOn,heading) || !/^<li>Opt to pay AED [0-9,]+ as a rewards accelerator fee and get /.test(addOn.text)))
    || kfs.firstLine !== 82 || tariff.firstLine !== 1 || revision.firstLine !== 99
    || !/^\s*November 2026 V1\s+1\s+2\s*$/.test(revision.text)) return null;
  const k = kfs.text.split("\n"), t = tariff.text.split("\n");
  if (k.length !== 5 || k[0].trim() !== "Primary Card" || k[2].trim() !== "Annual Fee"
    || cols(k[3]).join("|") !== "CBI First|Rewards World|Rewards Platinum|Mastercard Titanium"
    || cols(k[4]).length !== 4 || cols(k[4])[p.column] !== "Free"
    || t.length !== 6 || t[0] !== "Credit Card Service and Price Guide (Inclusive of VAT)"
    || cols(t[2]).join("|") !== "Rewards|Mastercard|Visa"
    || cols(t[3]).join("|") !== "Annual Fees|CBI First|Rewards World|Platinum|Titanium|Platinum5"
    || cols(t[4]).join("|") !== "1|2") return null;
  const row = cols(t[5]);
  if (row.length !== 6 || row[0] !== "Primary Card7" || row[p.column+1] !== "Free") return null;
  const pin = (s: Evidence, unit: string, vatTreatment: "inclusive" | "not-applicable") => ({
    parserId:"cbi/primary-annual-fee/v1", productScope:p.name, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.representation, captureMethod:"public-http-reader",
    ...(s.sourceStartByte === undefined ? { sourceExtraction:pdf, sourceScope:s.sourceScope }
      : { sourceExtraction:"http-decoded-html-excerpt", sourceStartByte:s.sourceStartByte, sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text) }),
    firstLine:s.firstLine, lastLine:s.firstLine+s.text.split("\n").length-1, rawText:s.text, rawTextSha256:s.fixtureTextSha256,
  });
  return {
    name:p.name, productUrl, kfsUrl, annualFee:0, vatPolicy:"inclusive" as const, network:"Mastercard" as const,
    capturedDate:heading.capturedAt.slice(0,10), sources:[productUrl,kfsUrl,cbiTariff],
    sourceFixtureIds:[heading,cta,network,kfsLink,tariffLink,kfs,tariff,revision,...(addOn?[addOn]:[])].map(s=>s.id),
    evidence:{
      name:[pin(heading,"Issuer title for the exact tier", "not-applicable"), pin(cta,"Shared enquiry address only; tier intake unconfirmed", "not-applicable")],
      network:[pin(network,"Mastercard identity on exact product page", "not-applicable")],
      annualFee:[pin(kfsLink,"Exact Key Facts Statement linked from product page", "not-applicable"),
        pin(tariffLink,"Exact current November price guide linked from product page", "not-applicable"),
        pin(kfs,"Named primary annual-fee row, not supplementary card charges", "not-applicable"),
        pin(tariff,"Named standard primary annual fee in VAT-inclusive guide; Visa Platinum separate", "inclusive"),
        pin(revision,"November 2026 V1 edition", "not-applicable"),
        ...(addOn?[pin(addOn,"Confirms accelerator is optional; no amount or billing cadence is extracted", "not-applicable")]:[])],
      vatPolicy:[pin(tariff,"Price Guide identifies inclusive VAT basis", "inclusive")],
    },
  };
}
