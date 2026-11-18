import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const HSBC = "https://www.hsbc.ae";
const SC = "https://www.sc.com";
export const HSBC_KFS = HSBC + "/content/dam/hsbc/ae/docs/en/cards/key-fact-statement-credit-cards.pdf";
export const HSBC_FORM = HSBC + "/content/dam/hsbc/ae/docs/en/cards/uae-credit-card-application-form-existing-account-holders.pdf";
export const SC_KFS = "https://av.sc.com/ae/content/docs/ae-scb-key-facts-statement.pdf";
export const SC_TARIFF = "https://av.sc.com/ae/content/docs/ae-sp-price-guide-conventional-english-v3.pdf?v=202499";
export const SC_JOURNEY = SC + "/ae/credit-cards/journey/";
export const SC_FORM = SC_JOURNEY + "apply-now/?productName=journey&entryPoint=web_product_credit-cards_journey-credit-card_presistentbar_apply-now";
export const RELATIONSHIP_CARD_SLUGS = ["hsbc-premier", "hsbc-advance", "sc-journey"] as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string; sourceRepresentation: string;
  sourceBodySha256: string; sourceTextSha256: string; fixtureTextSha256: string; firstLine: number;
  sourceStartByte?: number; sourceScope?: string;
};
const sha = /^[a-f0-9]{64}$/;
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&#39;|&apos;/g, "'")
  .replace(/&amp;/g, "&").replace(/[\u202a-\u202e\u2066-\u2069]/g, "").replace(/\s+/g, " ").trim();
function select(input: Source[], id: string, url: string, pdf = false) {
  const found = input.filter(row => row.id === id);
  const s = found[0];
  if (found.length !== 1 || s.url !== url || !sha.test(s.sourceBodySha256) || !sha.test(s.sourceTextSha256)
      || s.fixtureTextSha256 !== digest(s.text) || !Number.isFinite(Date.parse(s.capturedAt))
      || !Number.isSafeInteger(s.firstLine) || s.firstLine <= 0) return null;
  return pdf ? s.sourceRepresentation === "pdftotext-layout" && s.sourceScope && s.sourceStartByte === undefined ? s : null
    : s.sourceRepresentation === "http-decoded-response-body" && s.sourceTextSha256 === s.sourceBodySha256
      && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
const sameCapture = (a: Source, b: Source) => a.url === b.url && a.capturedAt === b.capturedAt
  && a.sourceBodySha256 === b.sourceBodySha256 && a.sourceTextSha256 === b.sourceTextSha256;
function pin(s: Source, productScope: string, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return { parserId: "hsbc-sc/relationship-cards/v1", productScope, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, ...(s.sourceStartByte === undefined
      ? { sourceScope: s.sourceScope }
      : { sourceStartByte: s.sourceStartByte, sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text) }),
    captureMethod: "public-http-reader", firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256 };
}

function hsbc(input: Source[], slug: "hsbc-premier" | "hsbc-advance") {
  const tier = slug === "hsbc-premier" ? "Premier" : "Advance", article = tier === "Premier" ? "a" : "an";
  const name = "HSBC " + tier + " Credit Card";
  const productUrl = HSBC + "/credit-cards/products/" + tier.toLowerCase() + "/";
  const programmeUrl = productUrl + "rewards/";
  const heading = select(input, slug + "-heading", productUrl), application = select(input, slug + "-apply", productUrl);
  const fee = select(input, slug + "-fee", productUrl), account = select(input, slug + "-account", productUrl);
  const scheme = select(input, slug + "-scheme", productUrl);
  const rewardsHead = select(input, slug + "-rewards-heading", programmeUrl);
  const rewardsText = select(input, slug + "-rewards-programme", programmeUrl);
  const kfs = select(input, slug + "-kfs", HSBC_KFS, true), form = select(input, "hsbc-existing-form", HSBC_FORM, true);
  if (!heading || !application || !fee || !account || !scheme || !rewardsHead || !rewardsText || !kfs || !form
      || ![application, fee, account, scheme].every(source => sameCapture(source, heading))
      || !sameCapture(rewardsHead, rewardsText) || strip(heading.text) !== tier + " Credit Card"
      || !application.text.includes('href="/new-to-bank/index/credit-card-apply/"')
      || !/^Apply now\b/i.test(strip(application.text)) || strip(fee.text) !== "No annual fee"
      || strip(account.text) !== "have " + article + " " + tier + " Account"
      || strip(scheme.text) !== "Download the Mastercard Travel Pass app and register your HSBC credit card"
      || strip(rewardsHead.text) !== "Your " + tier + " rewards"
      || strip(rewardsText.text) !== "How to redeem your HSBC Rewards"
      || !strip(kfs.text).startsWith(name + " Income requirement - you’ll need to have " + article + " " + tier
        + " Account. No annual fee is applicable. Key Features: HSBC Rewards,")
      || !/I wish to apply for a new credit card: Private Bank HSBC Emirates Skywards Infinite Live\+ HSBC Emirates Skywards Signature Premier Advance Cash\+/.test(strip(form.text))) return null;
  return {
    name, bank: "hsbc", network: "Mastercard", programme: "HSBC Rewards", productUrl, kfsUrl: HSBC_KFS,
    annualFee: 0, waiverNotes: null, income: null, date: heading.capturedAt.slice(0,10), account: tier + " Account",
    sources: [productUrl, HSBC_KFS, HSBC_FORM, programmeUrl],
    ids: [heading,application,fee,account,scheme,rewardsHead,rewardsText,kfs,form].map(s=>s.id),
    evidence: { annualFee: [pin(fee,name,"AED standard annual membership fee","not-applicable"),pin(kfs,name,"Named membership fee and account gate","not-applicable")],
      eligibility: [pin(account,name,"Issuer matching account requirement","not-applicable"),pin(form,name,"Distinct existing-customer application choices","not-applicable")],
      loyaltyProgram: [pin(rewardsHead,name,"Named rewards source identity","not-applicable"),pin(rewardsText,name,"Issuer rewards programme name only","not-applicable")],
      network: [pin(scheme,name,"Issuer Mastercard network identity","not-applicable")] },
  };
}
function sc(input: Source[]) {
  const name = "Standard Chartered Journey Credit Card";
  const s = (id:string) => select(input,"sc-journey-"+id,SC_JOURNEY);
  const heading=s("heading"), apply=s("apply"), fee=s("fee"), vat=s("vat"), programme=s("programme");
  const resident=s("resident"), national=s("national");
  const form=select(input,"sc-journey-form",SC_FORM), formTitle=select(input,"sc-journey-form-title",SC_FORM);
  const formPay=select(input,"sc-journey-form-salary",SC_FORM);
  const kfs=select(input,"sc-journey-kfs-fees",SC_KFS,true), terms=select(input,"sc-journey-kfs-conditions",SC_KFS,true);
  const tariff=select(input,"sc-journey-tariff",SC_TARIFF,true);
  if (!heading || !apply || !fee || !vat || !programme || !resident || !national || !form || !formTitle || !formPay
      || !kfs || !terms || !tariff || ![apply,fee,vat,programme,resident,national].every(item=>sameCapture(item,heading))
      || !sameCapture(formTitle,form) || !sameCapture(form,formPay) || !sameCapture(kfs,terms)
      || !/<h1\b[^>]*>[\s\S]*Journey Credit Card today\*/i.test(heading.text)
      || !apply.text.includes('href="' + SC_FORM.replaceAll("&", "&amp;") + '"') || !/^Apply Now/i.test(strip(apply.text))
      || strip(form.text) !== "Apply for Journey credit card and enjoy premium benefits"
      || !/Apply for Visa Infinite Credit Card/.test(strip(formTitle.text))
      || !/^Earn 360° Rewards Points on every spend\. 8$/.test(strip(programme.text))) return null;
  const f=strip(fee.text).match(new RegExp("^AED ("+SOURCE_NUMBER+") \\(Get First year annual fee waiver by meeting minimum AED("+SOURCE_NUMBER+") spends in first (\\d+) days\\. After the first year and every year after that, your annual fee will be waived if you spend at least AED ("+SOURCE_NUMBER+") in the previous (\\d+) months\\)\\.$"));
  const v=strip(vat.text).match(new RegExp("annual fee of AED ("+SOURCE_NUMBER+") \\(AED ("+SOURCE_NUMBER+") inclusive of VAT\\)"));
  const income=new RegExp("Minimum Monthly Income AED ("+SOURCE_NUMBER+") SCB Current or Savings Account$");
  const r=strip(resident.text).match(income), n=strip(national.text).match(income);
  const fIncome=strip(formPay.text).match(new RegExp("^Monthly Salary of at least AED ("+SOURCE_NUMBER+")$"));
  const k=strip(kfs.text).match(new RegExp("^Primary Card\\(s\\) Primary Card\\(s\\) For Existing Supplementary Card\\(s\\) For New Credit Card Applicants Credit Cardholders D("+SOURCE_NUMBER+") Journey Spend D ("+SOURCE_NUMBER+") in the first (\\d+) days for D ("+SOURCE_NUMBER+") Free an annual fee waiver\\.$"));
  const c=strip(terms.text).match(new RegExp("closed your Standard Chartered credit card\\(s\\) in the last (\\d+) months.*inclusive of 5% Value Added Tax \\(VAT\\)\\..*For Journey: Primary credit card Annual Fee from the second year onwards will be waived if retail spends D of the preceding (\\d+) months exceeds ("+SOURCE_NUMBER+") or equivalent in other currencies\\.$"));
  const t=strip(tariff.text).match(new RegExp("^Journey Charges \\(AED\\) Annual Fee Primary Card ("+SOURCE_NUMBER+") First card\\(s\\)$"));
  if (!f || !v || !r || !n || !fIncome || !k || !c || !t
      || r[1]!==n[1] || r[1]!==fIncome[1] || f[1]!==v[2] || f[1]!==k[1] || f[1]!==k[4]
      || f[2]!==k[2] || f[3]!==k[3] || f[4]!==c[3] || f[5]!==c[2]
      || parseSourceNumber(t[1])!==parseSourceNumber(f[1])) return null;
  const annualFee=parseSourceNumber(f[1]), publishedIncome=parseSourceNumber(r[1]);
  const firstSpend=parseSourceNumber(f[2]), firstDays=Number(f[3]), closedMonths=Number(c[1]);
  if (!annualFee || !publishedIncome || !firstSpend || !Number.isSafeInteger(firstDays) || firstDays<=0
      || !Number.isSafeInteger(closedMonths) || closedMonths<=0) return null;
  return { name, bank:"standard-chartered", network:"Visa", programme:"360° Rewards", productUrl:SC_JOURNEY,kfsUrl:SC_KFS,
    annualFee, income:publishedIncome, date:heading.capturedAt.slice(0,10), account:"SCB current or savings account",
    waiverNotes:`The Key Facts Statement lists a first-year waiver for new credit card applicants who spend at least AED ${firstSpend.toLocaleString("en-GB")} in the first ${firstDays} days, and lists the standard fee separately for existing cardholders. The fee applies from year one if you closed a Standard Chartered credit card in the last ${closedMonths} months and are applying again.`,
    sources:[SC_JOURNEY,SC_FORM,SC_KFS,SC_TARIFF],
    ids:[heading,apply,fee,vat,programme,resident,national,form,formTitle,formPay,kfs,terms,tariff].map(x=>x.id),
    evidence:{annualFee:[pin(fee,name,"AED standard annual membership including VAT","inclusive"),pin(vat,name,"Product's pre-VAT and VAT-inclusive amounts","inclusive"),pin(kfs,name,"Named primary card fee","inclusive"),pin(tariff,name,"Named tariff's primary card fee","inclusive")],
      annualFeeWaiver:[pin(fee,name,"First-year qualifying spend and days","not-applicable"),pin(kfs,name,"Named first-year qualifying spend and days","not-applicable"),pin(terms,name,"Issuance exclusion and conflicting renewal boundary; no typed renewal threshold","not-applicable")],
      "eligibility.publishedMinMonthlyIncome":[pin(resident,name,"AED published resident income floor, with account requirement","not-applicable"),pin(national,name,"AED published national income floor, with account requirement","not-applicable"),pin(formPay,name,"AED published application salary confirmation only","not-applicable")],
      loyaltyProgram:[pin(programme,name,"Issuer programme name only","not-applicable")],network:[pin(formTitle,name,"Named issuer Visa application network","not-applicable")]}};
}
export function parseHsbcScRelationship(input: Source[], slug: string) {
  if (slug === "hsbc-premier" || slug === "hsbc-advance") return hsbc(input,slug);
  return slug === "sc-journey" ? sc(input) : null;
}
