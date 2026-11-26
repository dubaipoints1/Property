import { createHash } from "node:crypto";

export const MASHREQ_AL_ISLAMI_CASHBACK = "mashreq-alislami-cashback";
const name = "Mashreq Al Islami Cashback Credit Card";
const product = "https://www.mashreqalislami.com/en/uae/neo/cards/credit-cards/cashback-credit-card/";
const kfs = "https://www.mashreqalislami.com/-/jssmedia/pdfs/mai/neo/cards/mai-credit-card-new-kfs.ashx";
const tariff = "https://www.mashreq.com/-/jssmedia/pdfs/neo/cards/mashreq-cards-soc-latest.ashx";
const appHref = "https://digital.mashreqbank.com/creditcards/ntb/otp-send?utm_pname=maicashback&amp;utm_pcode=MAI92";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const fullHash = /^[0-9a-f]{64}$/;
const noFee = /^(no annual fees|free for life)$/i;
const typeFee = (s: string) => noFee.test(s) ? 0 : null;
const trim = (s: string) => s.trim().replace(/\s+/g," ");
const cell = (s: string, from: number, to: number) => trim(s.slice(from,to));

type Source = {
  id: string; url: string; capturedAt: string; sourceBodySha256: string; sourceTextSha256: string;
  text: string; fixtureTextSha256: string; sourceRepresentation: string; firstLine: number;
  sourceScope?: string; sourceStartByte?: number;
};

function source(input: readonly Source[], role: string, url: string, isPDF: boolean) {
  const list = input.filter(s => s.id === "mashreq-islami-cashback-" + role);
  const s = list[0];
  if (!s || list.length !== 1 || s.url !== url || typeof s.text !== "string" || !s.text || s.text.length > 2_500
      || s.fixtureTextSha256 !== sha(s.text) || !fullHash.test(s.sourceBodySha256) || !fullHash.test(s.sourceTextSha256)
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt) || !Number.isFinite(Date.parse(s.capturedAt))
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
  if (isPDF) return s.sourceRepresentation === "pdftotext-layout" && s.sourceStartByte === undefined && s.sourceScope ? s : null;
  return s.sourceRepresentation === "http-decoded-response-body" && s.sourceTextSha256 === s.sourceBodySha256
    && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte! >= 0 ? s : null;
}
const same = (s: Source, t: Source) => s.url === t.url && s.sourceBodySha256 === t.sourceBodySha256
  && s.sourceTextSha256 === t.sourceTextSha256 && s.capturedAt === t.capturedAt;
function field(s: Source, unit: string, vatTreatment: "inclusive" | "not-applicable" = "not-applicable") {
  return { parserId:"mashreq/alislami-base-cashback-standard/v1", productScope:name, unit, vatTreatment,
    sourceUrl:s.url, capturedAt:s.capturedAt, sourceBodySha256:s.sourceBodySha256, sourceTextSha256:s.sourceTextSha256,
    sourceRepresentation:s.sourceRepresentation, captureMethod:"public-http-reader",
    ...(s.sourceStartByte === undefined ? { sourceExtraction:"pdftotext-layout", sourceScope:s.sourceScope }
      : { sourceExtraction:"http-decoded-html-excerpt", sourceStartByte:s.sourceStartByte, sourceEndByte:s.sourceStartByte+Buffer.byteLength(s.text) }),
    firstLine:s.firstLine, lastLine:s.firstLine+s.text.split("\n").length-1, rawText:s.text, rawTextSha256:s.fixtureTextSha256 };
}

/** Limits replay to the base Islamic primary annual fee; no joining fee, perks, reward maths or eligibility. */
export function parseMashreqAlIslamiCashback(input: readonly Source[], slug: string) {
  if (slug !== MASHREQ_AL_ISLAMI_CASHBACK || input.length !== 6) return null;
  const head = source(input,"heading",product,false), apply = source(input,"acquisition",product,false);
  const zero = source(input,"headline",product,false), price = source(input,"kfs-pricing",kfs,true);
  const schVat = source(input,"tariff-vat",tariff,true), sch = source(input,"tariff-principal",tariff,true);
  if (!head || !apply || !zero || !price || !schVat || !sch || !same(head,apply) || !same(head,zero)
      || !same(schVat,sch) || ![price,sch].every(s => s.capturedAt.slice(0,10) === head.capturedAt.slice(0,10))) return null;
  if (!/^<h5\b[^>]*>Cashback Credit Card<\/h5>$/.test(head.text)
      || !/^<a\b[^>]*>$/.test(apply.text) || !apply.text.includes('href="' + appHref + '"')
      || !/^<h5\b[^>]*>No annual fees<\/h5>$/.test(zero.text)
      || !(head.sourceStartByte! < apply.sourceStartByte! && apply.sourceStartByte! < zero.sourceStartByte!
        && zero.sourceStartByte! - head.sourceStartByte! < 30_000)) return null;

  const k = price.text.split("\n"), t = sch.text.split("\n");
  if (price.firstLine !== 17 || k.length !== 11 || trim(k[0]) !== "LOYALTY, BENEFITS & PRICING:"
      || trim(k[1]) !== "MAI Cashback MAI Platinum Elite MAI Emirati Solitaire" || cell(k[1],100,145) !== "MAI Cashback"
      || trim(k[3]) !== "Annual fee (primary) -" || trim(k[4]) !== "AED"
      || cell(k[6],0,95) !== "recurring (VAT inclusive)" || !/^Annual fee \(supplementary\) -\b|^Annual fee \(supplementary\) - /.test(trim(k[9]))
      || schVat.firstLine !== 2 || !/^Disclaimer: With effect from January 2019, all fees and charges mentoned below are inclusive of 5% Value Added Tax /.test(trim(schVat.text))
      || sch.firstLine !== 6 || t.length !== 4
      || cell(t[0],95,150) !== "Cashback Card" || cell(t[0],150,198) !== "Mashreq Al Islami Cashback Card"
      || cell(t[0],198,235) !== "Platinum Elite Card"
      || trim(t[1]) !== "Joining Fee"
      || cell(t[2],0,60) !== "Principal Annual Fee" || cell(t[3],0,60) !== "Supplementary Annual Fee") return null;
  const a = typeFee(cell(k[6],100,145));
  const b = typeFee(cell(t[2],150,198));
  const c = typeFee(trim(zero.text.replace(/<[^>]*>/g,"")));
  if (a === null || a !== b || a !== c) return null;

  return { name, productUrl:product, kfsUrl:kfs, annualFee:a, vatPolicy:"inclusive" as const,
    capturedDate:head.capturedAt.slice(0,10), sources:[product,kfs,tariff],
    sourceFixtureIds:[head,apply,zero,price,schVat,sch].map(s=>s.id),
    evidence:{
      name:[field(head,"Exact base Cashback identity under the issuer's Islamic window"),
        field(apply,"Named acquisition entry observed in product HTML; no form opened or approval implied")],
      annualFee:[field(zero,"Issuer product's named standard annual fee, not total cost","inclusive"),
        field(price,"Exact MAI Cashback primary recurring VAT-inclusive fee row; supplementary row excluded","inclusive"),
        field(sch,"Exact named Islamic primary annual fee in the tariff's non-24X7 block","inclusive"),
        field(schVat,"Tariff stated VAT basis","inclusive")],
    },
  };
}
