import { createHash } from "node:crypto";

const origin = "https://www.cbiuae.com";
export const CBI_WORLD = {
  slug: "cbi-rewards-world-mastercard",
  name: "CBI Rewards World Mastercard Credit Card",
  productUrl: origin + "/en/personal/products-and-services/cards/rewards-world-credit-card/",
  kfsUrl: origin + "/media/w3laroxq/cbi-credit-cards-key-facts-statement-april-2026.pdf",
  tariffUrl: origin + "/media/uqziuyjp/cbi-credit-card-schedule-of-charges-nov-2026-v1-1.pdf",
} as const;
type Source = {
  id: string; url: string; representation: "pdftotext-layout"|"http-decoded-response-body"; capturedAt: string;
  sourceBodySha256: string; sourceTextSha256: string; text: string; fixtureTextSha256: string; firstLine: number;
  sourceScope?: string; sourceStartByte?: number;
};
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const columns = (v: string) => v.trim().split(/ {3,}/);
const hash = /^[a-f0-9]{64}$/;

export function parseCbiRewardsWorld(sources: readonly Source[], slug: string) {
  const p = CBI_WORLD;
  if (slug !== p.slug || sources.length !== 8) return null;
  const html = "http-decoded-response-body", pdf = "pdftotext-layout";
  const get = (id: string, url: string, representation: Source["representation"]) => {
    const hits = sources.filter(x=>x.id===id), s=hits[0];
    if (hits.length!==1 || s.url!==url || s.representation!==representation || !s.text || sha(s.text)!==s.fixtureTextSha256
      || !hash.test(s.sourceBodySha256) || !hash.test(s.sourceTextSha256)
      || !Number.isSafeInteger(s.firstLine) || s.firstLine<1 || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt)
      || !Number.isFinite(Date.parse(s.capturedAt))) return null;
    if (representation===html) return s.sourceBodySha256===s.sourceTextSha256 && Number.isSafeInteger(s.sourceStartByte)
      && s.sourceStartByte!>=0 ? s : null;
    return s.sourceScope && s.sourceStartByte===undefined ? s : null;
  };
  const same = (a:Source,b:Source) => a.url===b.url && a.sourceBodySha256===b.sourceBodySha256
    && a.sourceTextSha256===b.sourceTextSha256 && a.capturedAt===b.capturedAt;
  const heading=get("world-heading",p.productUrl,html), network=get("world-mastercard",p.productUrl,html);
  const cta=get("world-shared-enquiry",p.productUrl,html), kfsLink=get("world-kfs-link",p.productUrl,html);
  const tariffLink=get("world-tariff-link",p.productUrl,html), kfs=get("world-kfs-primary",p.kfsUrl,pdf);
  const tariff=get("world-tariff-primary",p.tariffUrl,pdf), version=get("world-tariff-version",p.tariffUrl,pdf);
  if (!heading || !network || !cta || !kfsLink || !tariffLink || !kfs || !tariff || !version
    || ![network,cta,kfsLink,tariffLink].every(x=>same(x,heading)) || !same(tariff,version)
    || [kfs,tariff].some(x=>x.capturedAt.slice(0,10)!==heading.capturedAt.slice(0,10))
    || heading.text!=="<h1>Rewards World Credit Card</h1>"
    || !network.text.includes("with the CBI Rewards World Mastercard Credit Card</span>")
    || !(cta.sourceStartByte!>heading.sourceStartByte! && cta.sourceStartByte!-heading.sourceStartByte!<400)
    || !/^<a href="\/en\/personal\/products-and-services\/credit-card-form\/" class="btn btn-primary btnApplyNow" title="Apply Now ">Apply Now <\/a>$/.test(cta.text)
    || !kfsLink.text.includes('href="'+new URL(p.kfsUrl).pathname+'"') || !tariffLink.text.includes('href="'+new URL(p.tariffUrl).pathname+'"')
    || kfs.firstLine!==82 || tariff.firstLine!==1 || version.firstLine!==99
    || !/^\s*November 2026 V1\s+1\s+2\s*$/.test(version.text)) return null;
  const k=kfs.text.split("\n"), t=tariff.text.split("\n");
  if (k.length!==5 || k[0].trim()!=="Primary Card" || k[2].trim()!=="Annual Fee"
    || columns(k[3]).join("|")!=="CBI First|Rewards World|Rewards Platinum|Mastercard Titanium"
    || t.length!==6 || t[0]!=="Credit Card Service and Price Guide (Inclusive of VAT)"
    || columns(t[2]).join("|")!=="Rewards|Mastercard|Visa"
    || columns(t[3]).join("|")!=="Annual Fees|CBI First|Rewards World|Platinum|Titanium|Platinum5"
    || columns(t[4]).join("|")!=="1|2") return null;
  const kr=columns(k[4]), tr=columns(t[5]);
  const kFee=kr[1]?.match(/^D ([1-9]\d*)$/), tFee=tr[2]?.match(/^AED ([1-9]\d*)$/);
  if (kr.length!==4 || tr.length!==6 || tr[0]!=="Primary Card7" || !kFee || !tFee || kFee[1]!==tFee[1]) return null;
  const annualFee=Number(tFee[1]);
  if (!Number.isSafeInteger(annualFee)) return null;
  const pin = (s:Source,unit:string,vatTreatment:"inclusive"|"not-applicable") => ({
    parserId:"cbi/rewards-world-primary-annual/v1",productScope:p.name,unit,vatTreatment,sourceUrl:s.url,
    capturedAt:s.capturedAt,sourceBodySha256:s.sourceBodySha256,sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.representation,captureMethod:"public-http-reader",
    ...(s.sourceStartByte===undefined?{sourceExtraction:pdf,sourceScope:s.sourceScope}
      :{sourceExtraction:"http-decoded-html-excerpt",sourceStartByte:s.sourceStartByte,sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text)}),
    firstLine:s.firstLine,lastLine:s.firstLine+s.text.split("\n").length-1,rawText:s.text,rawTextSha256:s.fixtureTextSha256,
  });
  return {
    name:p.name,productUrl:p.productUrl,kfsUrl:p.kfsUrl,network:"Mastercard" as const,
    annualFee,vatPolicy:"inclusive" as const,standardFeeConditions:"standard-only" as const,
    capturedDate:heading.capturedAt.slice(0,10),sources:[p.productUrl,p.kfsUrl,p.tariffUrl],
    sourceFixtureIds:sources.map(s=>s.id),
    evidence:{
      name:[pin(heading,"Named Rewards World card","not-applicable"),pin(cta,"Shared issuer enquiry; specific intake unconfirmed","not-applicable")],
      network:[pin(network,"Unambiguous Rewards World Mastercard witness; ignore mixed-tier benefits copy","not-applicable")],
      annualFee:[pin(kfsLink,"Exact linked KFS","not-applicable"),pin(tariffLink,"Exact linked current price guide","not-applicable"),
        pin(kfs,"Exact primary annual-fee column, not supplementary","not-applicable"),
        pin(tariff,"Named Rewards World primary annual fee; no joining or personal price","inclusive"),
        pin(version,"November 2026 V1 edition","not-applicable")],
      vatPolicy:[pin(tariff,"Tariff is VAT-inclusive","inclusive")],
    },
  };
}
