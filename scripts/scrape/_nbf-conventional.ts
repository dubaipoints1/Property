import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const ORIGIN = "https://nbf.ae";
export const NBF_CONVENTIONAL_TARIFF = ORIGIN + "/wp-content/uploads/2025/09/NBF-Personal-Banking-SOC_Conventional.pdf";
export const NBF_CONVENTIONAL = {
  "nbf-visa-infinite": {
    tier: "infinite", kfsTier: "INFINITE", route: "infinite-credit-card", name: "NBF Visa Infinite Credit Card",
    heading: "Visa Infinite Credit Card for <br>Premium Rewards &amp; Travel", apply: "Apply For Infinite<br>Credit Card",
    kfsFile: "KFS_NBF-Infinite_Credit_Card_Apr-2025.pdf", priority: true,
  },
  "nbf-platinum-exclusive": {
    tier: "platinum", kfsTier: "PLATINUM", route: "platinum-exclusive-credit-card", name: "NBF Platinum Exclusive Credit Card",
    heading: "Platinum Exclusive Credit Card", apply: "Apply For Platinum<br> Exclusive Credit Card",
    kfsFile: "KFS_NBF-Platinum_Credit-Card_Apr-2025.pdf", priority: false,
  },
} as const;
const sha = /^[a-f0-9]{64}$/;
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const salaryPattern = new RegExp("^[ \\t]*Minimum Salary[ \\t]+AED (" + SOURCE_NUMBER + ")( or Priority Segment status with NBF\\.)?[ \\t]*$");
type Source = {
  id: string; url: string; capturedAt: string; text: string; sourceRepresentation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string; reviewedRenderSha256?: string;
};
const SAME = (a: Source,b: Source) => a.url === b.url && a.capturedAt === b.capturedAt && a.sourceBodySha256 === b.sourceBodySha256;

export function parseNbfConventional(input: Source[], slug: string) {
  if (!Object.hasOwn(NBF_CONVENTIONAL, slug)) return null;
  const p = NBF_CONVENTIONAL[slug as keyof typeof NBF_CONVENTIONAL];
  const productUrl = ORIGIN + "/personal/personal-cards/" + p.route + "/";
  const enquiryUrl = productUrl + "apply/";
  const kfsUrl = ORIGIN + "/wp-content/uploads/2025/04/" + p.kfsFile;
  const used: Source[] = [];
  function select(id: string,url: string,page?: number) {
    const matches = input.filter(row=>row.id===id);
    const s = matches[0];
    if (matches.length !== 1 || !s || s.url!==url || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256)
        || s.fixtureTextSha256!==digest(s.text) || !Number.isFinite(Date.parse(s.capturedAt))
        || !Number.isSafeInteger(s.firstLine) || s.firstLine<1) return null;
    if (page ? s.sourceRepresentation!=="pdftotext-layout" || s.sourceScope!=="PDF page "+page || s.sourceStartByte!==undefined
      : s.sourceRepresentation!=="http-decoded-response-body" || s.sourceTextSha256!==s.sourceBodySha256
        || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte!<0) return null;
    used.push(s);
    return s;
  }
  const prefix="nbf-conventional-"+p.tier+"-";
  const heading=select(prefix+"heading",productUrl), apply=select(prefix+"apply",productUrl);
  const form=select(prefix+"enquiry",enquiryUrl), programme=select(prefix+"programme",productUrl);
  const docLink=select(prefix+"kfs-link",productUrl), tariffLink=select(prefix+"tariff-link",productUrl);
  const kfsName=select(prefix+"kfs-name",kfsUrl,1), network=select(prefix+"kfs-network",kfsUrl,1);
  const salary=select(prefix+"kfs-salary",kfsUrl,1), secured=select(prefix+"kfs-deposit",kfsUrl,1);
  const fee=select(prefix+"kfs-fee",kfsUrl,2);
  const table=select("nbf-conventional-tariff-fee",NBF_CONVENTIONAL_TARIFF,7);
  const caveat=select("nbf-conventional-tariff-priority",NBF_CONVENTIONAL_TARIFF,8);
  if (!heading || !apply || !form || !programme || !docLink || !tariffLink || !kfsName || !network || !salary || !secured || !fee || !table || !caveat
      || ![apply,programme,docLink,tariffLink].every(s=>SAME(heading,s))
      || ![network,salary,secured,fee].every(s=>SAME(kfsName,s)) || !SAME(table,caveat)
      || heading.text!=='<h1 class="elementor-heading-title elementor-size-default">'+p.heading+'</h1>'
      || form.text!=='<h2 class="elementor-heading-title elementor-size-default">'+p.apply+'</h2>'
      || apply.text!=='href="/personal/cards/'+p.route+'/apply/"'
      || apply.sourceStartByte!-heading.sourceStartByte!<=0 || apply.sourceStartByte!-heading.sourceStartByte!>2000
      || programme.text!=='<div class="e-n-accordion-item-title-text"> Experience a world of exclusive benefits with NBF Rewards </div>'
      || docLink.text!=='href="'+kfsUrl+'"' || tariffLink.text!=='href="'+NBF_CONVENTIONAL_TARIFF+'"'
      || kfsName.text.trim()!=="NBF "+p.kfsTier+" CREDIT CARD"
      || network.text.trim().replace(/\s+/g," ")!=="• "+(p.priority ? "Infinite Cards" : "Platinum Credit Cards")+" qualify for offers, discounts and benefits from Visa"
      || !/^ +• +The Credit Card can be issued based on your income or against a fixed deposit placed[ \t]*$/.test(secured.text)
      || !/^[ \t]*Annual Fee[ \t]+Lifetime free[ \t]*$/.test(fee.text)
      || !/^[ \t]*Annual fee[ \t]+Life-time free[ \t]+Life-time free[ \t]*$/.test(table.text)
      || table.sourceBodySha256!=="777a62df669b2bbde42f406b8c013054742137fee1fbfc9039870afa9e0c5d7f"
      || table.reviewedRenderSha256!=="f29dde9a75dabaf64a7830be55988eec59e7f04dd5fd7da513b4c620cf2b15b7"
      || caveat.text.trim()!=="10. The bank reserves the right to levy fees or replace the card in case Priority segment eligibility is not maintained") return null;
  const match=salary.text.match(salaryPattern), income=match ? parseSourceNumber(match[1]) : null;
  if (!income || Boolean(match?.[2])!==p.priority) return null;
  const pin=(s: Source,unit: string)=>({
    parserId:"nbf/conventional-named-tiers/v1",productScope:p.name,unit,vatTreatment:"not-applicable" as const,
    sourceUrl:s.url,capturedAt:s.capturedAt,sourceBodySha256:s.sourceBodySha256,sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.sourceRepresentation,captureMethod:"public-http-reader",
    ...(s.sourceStartByte===undefined ? {sourceScope:s.sourceScope,sourceExtraction:"pdftotext-layout"}
      : {sourceStartByte:s.sourceStartByte,sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text)}),
    firstLine:s.firstLine,lastLine:s.firstLine+s.text.split("\n").length-1,rawText:s.text,rawTextSha256:s.fixtureTextSha256,
  });
  return {name:p.name,productUrl,enquiryUrl,kfsUrl,capturedDate:heading.capturedAt.slice(0,10),income,priority:p.priority,
    standardAnnualFee:0,network:"Visa",loyaltyProgram:"NBF Rewards",sources:[productUrl,enquiryUrl,kfsUrl,NBF_CONVENTIONAL_TARIFF],
    ids:used.map(s=>s.id),evidence:{
      annualFee:[pin(caveat,"Priority relationship changes may affect card or fees"),pin(fee,"Issued KFS standard annual membership fee"),pin(table,"Current conventional tariff standard annual membership fee")],
      eligibility:[pin(salary,p.priority?"Published salary or NBF Priority status":"Published salary only"),pin(secured,"Possible deposit-backed route without any fee or approval promise")],
      ...(!p.priority ? {"eligibility.publishedMinMonthlyIncome":[pin(salary,"AED published salary for salaried applicants, not ranking")]} : {}),
      network:[pin(network,"Visa network identity only")],
      loyaltyProgram:[pin(programme,"Issuer programme identity only")],
    }};
}
