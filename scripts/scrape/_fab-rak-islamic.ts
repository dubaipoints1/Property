import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

export const ISLAMIC_CARDS = {
  "fab-cashback-islamic": {
    bank: "fab", name: "FAB Cashback Islamic Credit Card",
    product: "https://www.bankfab.com/en-ae/islamic-banking/personal-islamic-banking/islamic-cards/cashback-islamic-credit-card",
    kfs: "https://www.bankfab.com/-/media/fab-uds/personal/key-facts-statements/fab-islamic/fab-credit-cards-islamic-key-facts-statement.pdf?view=1",
    tariff: "https://www.bankfab.com/-/media/fab-uds/islamic-banking/personal-islamic-banking/islamic-cards/fab-cashback-islamic-credit-card/schedule-of-charges.pdf?view=1",
    guide: "https://www.bankfab.com/-/media/fab-uds/islamic-banking/overview/pdfs/islamic-banking-fees-and-charges-en-ar.pdf?view=1",
  },
  "rakbank-islamic-world": {
    bank: "rakbank", name: "RAKBANK Islamic World Mastercard",
    product: "https://www.rakbank.ae/en/islamic/personal/cards/credit-cards/world-credit-card",
    kfs: "https://www.rakbank.ae/globalassets/rakbank/all-pdfs/002---islamic---key-fact-statements/bilingual/kfs055-islamic-world-mastercard.pdf",
    tariff: "https://www.rakbank.ae/globalassets/rakbank/all-pdfs/002---islamic---service-and-price-guides/bilingual/013-j00686-sp-vat-consumercreditcard-islamic-en.pdf",
  },
} as const;

type Source = {
  id: string; url: string; capturedAt: string; text: string;
  fixtureTextSha256: string; sourceBodySha256: string; sourceTextSha256: string;
  firstLine: number; sourceStartByte?: number; sourceScope?: string;
  sourceRepresentation: "http-decoded-response-body" | "pdftotext-layout";
};
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const stripBidi = (text: string) => text.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "");
const clean = (text: string) => stripBidi(text).trim().replace(/[ \t]+/g, " ");
const same = (rows: Source[]) => rows.every(x => x.url === rows[0].url && x.capturedAt === rows[0].capturedAt
  && x.sourceBodySha256 === rows[0].sourceBodySha256 && x.sourceTextSha256 === rows[0].sourceTextSha256);
const LINK = (source: Source, href: string) => source.text === 'href="' + href + '"';
const AMOUNT = (s: string | undefined) => s === undefined ? null : parseSourceNumber(s);

export function parseFabRakIslamic(input: readonly Source[], slug: string) {
  if (!Object.hasOwn(ISLAMIC_CARDS, slug)) return null;
  const card = ISLAMIC_CARDS[slug as keyof typeof ISLAMIC_CARDS];
  const used: Source[] = [];
  const get = (suffix: string, url: string, page?: number) => {
    const matches = input.filter(x => x.id === slug + "-" + suffix);
    const s = matches[0];
    if (matches.length !== 1 || !s || s.url !== url || !s.text || hash(s.text) !== s.fixtureTextSha256
      || !hex.test(s.sourceBodySha256) || !hex.test(s.sourceTextSha256) || !Number.isFinite(Date.parse(s.capturedAt))
      || !Number.isSafeInteger(s.firstLine) || s.firstLine < 1) return null;
    if (page === undefined) {
      if (s.sourceRepresentation !== "http-decoded-response-body" || s.sourceBodySha256 !== s.sourceTextSha256
        || !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
    } else if (s.sourceRepresentation !== "pdftotext-layout" || s.sourceScope !== "PDF page " + page
        || s.sourceStartByte !== undefined) return null;
    used.push(s);
    return s;
  };
  const pin = (s: Source, unit: string, vatTreatment: "inclusive" | "exclusive" | "not-applicable" = "not-applicable") => ({
    parserId: "fab-rak/islamic-primary-and-income/v1", productScope: card.name, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256, sourceTextSha256: s.sourceTextSha256,
    sourceRepresentation: s.sourceRepresentation, captureMethod: "public-http-reader" as const,
    sourceExtraction: s.sourceScope ? "pdftotext-layout" as const : "http-decoded-html-excerpt" as const,
    ...(s.sourceScope ? {sourceScope: s.sourceScope} : {sourceStartByte: s.sourceStartByte!,
      sourceEndByte: s.sourceStartByte! + Buffer.byteLength(s.text)}),
    firstLine: s.firstLine, lastLine: s.firstLine + s.text.split("\n").length - 1, rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  });
  const title = get("title", card.product);
  if (!title) return null;
  const base = { ...card, network: "Mastercard" as const, capturedDate: title.capturedAt.slice(0, 10) };
  if (card.bank === "fab") {
    const salary = get("salary", card.product), repeat = get("salary-repeat", card.product), network = get("network", card.product);
    const doc = get("tariff-link", card.product), columns = get("kfs-columns", card.kfs, 1), gross = get("kfs-fee", card.kfs, 1);
    const net = get("tariff-fee", card.tariff, 1), primary = get("guide-fee", card.guide, 1), vat = get("guide-vat", card.guide, 1);
    if (!salary || !repeat || !network || !doc || !columns || !gross || !net || !primary || !vat
      || !same([title, salary, repeat, network, doc]) || !same([columns, gross]) || !same([primary, vat])
      || title.text !== '<title data-react-helmet="true">Islamic Cashback Credit Card | First Abu Dhabi Bank (FAB) - UAE</title>'
      || salary.text !== repeat.text || salary.sourceStartByte! >= repeat.sourceStartByte!
      || network.text !== "Enjoy a vast variety of unmatched World Mastercard benefits." || !LINK(doc, card.tariff)
      || !columns.text.includes("Annual Fee (Inclusive of VAT)") || !columns.text.includes("Primary Card")
      || !columns.text.includes("Supplementary Card") || columns.firstLine >= gross.firstLine
      || !clean(primary.text).includes("Annual fee (primary cards)") || primary.firstLine >= vat.firstLine
      || !clean(vat.text).startsWith("The above fees and charges are inclusive of VAT, if any.")) return null;
    const income = AMOUNT(new RegExp('^<h2 class="infographic-heading">\ueadf (' + SOURCE_NUMBER
      + ')</h2><div class="global-rich-text infographic-text"><p>Minimum Monthly Salary</p>$').exec(salary.text)?.[1]);
    const exactGross = AMOUNT(new RegExp("^FAB Cashback Islamic Credit Card NIL\\nD (" + SOURCE_NUMBER
      + ") ال يوجد$").exec(gross.text.split("\n").map(clean).join("\n"))?.[1]);
    const exclusive = AMOUNT(new RegExp("^Annual Fees: D (" + SOURCE_NUMBER + ") ").exec(clean(net.text.split("\n")[0]))?.[1]);
    const currentTariff = AMOUNT(new RegExp("^Cashback Card - D (" + SOURCE_NUMBER + ") ").exec(clean(primary.text.split("\n")[0]))?.[1]);
    if (income === null || income <= 0 || exactGross === null || exactGross <= 0 || exclusive === null || exclusive <= 0
      || !net.text.includes("FAB Cashback") || !net.text.includes("Islamic") || !net.text.includes("(Excluding VAT")
      || exactGross !== currentTariff || Math.round(exclusive * 105) !== Math.round(exactGross * 100)) return null;
    return {...base, annualFee: exactGross, vatPolicy: "inclusive" as const, income, incomeBasis: "salary" as const, loyaltyProgram: undefined,
      sources: [card.product, card.kfs, card.tariff, card.guide], ids: used.map(x => x.id), evidence: {
        network: [pin(network, "Mastercard network identity; no benefits assertion")],
        annualFee: [pin(columns, "AED primary vs supplementary column; VAT inclusive", "inclusive"),
          pin(gross, "AED standard primary annual fee", "inclusive"), pin(net, "AED standard primary annual fee before VAT", "exclusive"),
          pin(primary, "AED Islamic pricing guide primary annual fee", "inclusive"), pin(vat, "Guide VAT basis", "inclusive")],
        "eligibility.publishedMinMonthlyIncome": [pin(salary, "AED monthly salary published by FAB; not a qualification decision")],
      }};
  }
  const kLink = get("kfs-link", card.product), doc = get("tariff-link", card.product), programme = get("programme", card.product);
  const exact = get("kfs-title", card.kfs, 1), salary = get("kfs-eligibility", card.kfs, 2), primary = get("kfs-fee", card.kfs, 4);
  const heading = get("tariff-columns", card.tariff, 1), fee = get("tariff-fee", card.tariff, 1);
  if (!kLink || !doc || !programme || !exact || !salary || !primary || !heading || !fee
    || !same([title, kLink, doc, programme]) || !same([exact, salary, primary]) || !same([heading, fee]) || heading.firstLine >= fee.firstLine
    || title.text !== "<title>Islamic World Credit Card with RAKrewards | RAKBANK</title>"
    || !LINK(kLink, new URL(card.kfs).pathname) || !LINK(doc, new URL(card.tariff).pathname)
    || programme.text !== "Expect RAKrewards, travel benefits, lifestyle privileges and unmatched savings."
    || !clean(exact.text).startsWith("Rakbank Islamic World MasterCard ")
    || !clean(primary.text).endsWith("No Annual fees ever for the primary card holder")
    || !clean(heading.text).includes("Islamic Consumer Credit Card Service and Price Guide (Including VAT)")
    || !clean(heading.text).includes("Primary Card Annual/Joining Fee (D)")
    || !/^World[ \t]{2,}Free$/.test(fee.text.trim())) return null;
  const amount = salary.text.split("\n").map(clean).map(line =>
    new RegExp("^\\(c\\) for salaried applicants, a minimum monthly salary of D (" + SOURCE_NUMBER + ") ").exec(line)?.[1]).filter(x => x !== undefined);
  const income = amount.length === 1 ? AMOUNT(amount[0]) : null;
  if (income === null || income <= 0 || !clean(salary.text).includes("or for the self-employed customers")
    || !clean(salary.text).includes("the resident of the United Arab Emirates") || !clean(salary.text).includes("provides a security cheque")) return null;
  return {...base, annualFee: 0, vatPolicy: undefined, income, incomeBasis: "salaried-applicants" as const, loyaltyProgram: "RAKrewards",
    sources: [card.product, card.kfs, card.tariff], ids: used.map(x => x.id), evidence: {
      network: [pin(exact, "Named Islamic World Mastercard; no benefits assertion")],
      loyaltyProgram: [pin(programme, "RAKrewards programme identity only")],
      annualFee: [pin(primary, "Current standard primary annual fee; not a promise about future fees"),
        pin(heading, "Islamic pricing guide labelled primary annual/joining column", "inclusive"),
        pin(fee, "No charge in the primary World row; no other fee assurance")],
      "eligibility.publishedMinMonthlyIncome": [pin(salary, "AED monthly threshold for salaried applicants only; separate self-employed requirements")],
    }};
}
