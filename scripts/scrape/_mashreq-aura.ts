// Offline source-only Mashreq Aura recurring principal fee cross-check.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

const ORIGIN = "https://www.mashreq.com";
const KFS_PATH = "/-/jssmedia/pdfs/aura-pdf/mashreq-cards-aura-kfs-en-ar.ashx";
export const MASHREQ_AURA_KFS = ORIGIN + KFS_PATH;
export const MASHREQ_AURA_LAUNCH = ORIGIN + "/en/uae/news/2026/october/mashreq-alshaya-aura/";
export const MASHREQ_AURA_REDEMPTION = ORIGIN + "/-/jssmedia/pdfs/aura-pdf/Mashreq-Aura-Rewards-Programme-tnc-en.ashx";
export const MASHREQ_AURA_PRODUCTS = {
  "mashreq-aura": { label: "Aura", route: "aura-credit-card", selector: "mashreqaura" },
  "mashreq-aura-world": { label: "Aura World", route: "aura-world-credit-card", selector: "mashreqauraworld" },
  "mashreq-aura-world-elite": { label: "Aura World Elite", route: "aura-elite-credit-card", selector: "mashreqauraworldelite" },
} as const;

type Source = { id: string; url: string; capturedAt: string; representation: string; sourceBodySha256: string;
  fixtureTextSha256: string; text: string; page?: number; firstLine?: number; sourceStartByte?: number };
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const source = (rows: Source[], id: string, url: string, representation: string) => {
  const hits = rows.filter(row => row.id === id);
  if (hits.length !== 1) return null;
  const s = hits[0]!;
  return s.url === url && s.representation === representation && /^[a-f0-9]{64}$/.test(s.sourceBodySha256) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s.capturedAt) && Number.isFinite(Date.parse(s.capturedAt)) &&
    hash(s.text) === s.fixtureTextSha256 ? s : null;
};
function pin(s: Source, name: string, vatTreatment: "exclusive" | "not-applicable") {
  if (!Number.isSafeInteger(s.firstLine) || s.firstLine! < 1 ||
      !Number.isSafeInteger(s.sourceStartByte) || s.sourceStartByte! < 0) return null;
  return {
    parserId: "mashreq/aura-product-and-named-kfs/v1",
    productScope: name, unit: "AED recurring annual primary membership fee", vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceBodySha256: s.sourceBodySha256,
    sourceTextSha256: s.sourceBodySha256, sourceRepresentation: "http-decoded-response-body" as const,
    captureMethod: "public-http-reader" as const, firstLine: s.firstLine!,
    lastLine: s.firstLine! + s.text.split("\n").length - 1, sourceStartByte: s.sourceStartByte!,
    sourceEndByte: s.sourceStartByte! + Buffer.byteLength(s.text), rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  };
}
const amount = (literal: string) => literal === "Free for life" ? 0 : parseSourceNumber(literal);
const EXPECTED_KFS_HEADER = "KFS_Cards_09 2026 | Annual fee (primary) – recurring (VAT inclusive) | Annual fee (supplementary) - recurring (VAT inclusive)";

export function parseMashreqAura(sources: Source[], slug: string) {
  if (!Object.hasOwn(MASHREQ_AURA_PRODUCTS, slug)) return null;
  const { label, route, selector } = MASHREQ_AURA_PRODUCTS[slug as keyof typeof MASHREQ_AURA_PRODUCTS];
  const name = "Mashreq " + label + " Credit Card";
  const productUrl = ORIGIN + "/en/uae/neo/cards/credit-cards/" + route + "/";
  const html = (id: string, url = productUrl) => source(sources, id, url, "contiguous issuer HTML excerpt");
  const [head, apply, fee, disclosure] = ["-head", "-apply", "-fee", "-documents"].map(tag => html(slug + tag));
  const kfs = source(sources, "mashreq-aura-kfs", MASHREQ_AURA_KFS, "named issuer PDF table cells via pdfplumber");
  const redemption = source(sources, "mashreq-aura-redemption", MASHREQ_AURA_REDEMPTION, "contiguous issuer PDF text via pdfplumber");
  const launch = html("mashreq-aura-issued", MASHREQ_AURA_LAUNCH);
  if (!head || !apply || !fee || !disclosure || !kfs || !redemption || !launch || kfs.page !== 2 || redemption.page !== 4 ||
    ![head, apply, fee, disclosure].every(x => x.sourceBodySha256 === head.sourceBodySha256 && x.capturedAt === head.capturedAt &&
      Number.isSafeInteger(x.sourceStartByte) && x.sourceStartByte! >= 0) ||
    apply.sourceStartByte! <= head.sourceStartByte! || apply.sourceStartByte! - head.sourceStartByte! > 5400 ||
    fee.sourceStartByte! <= apply.sourceStartByte! || disclosure.sourceStartByte! <= fee.sourceStartByte! ||
    !/^<h5 [^>]+>[^<]+<\/h5>$/.test(head.text) || !head.text.endsWith(">" + name + "</h5>") ||
    !['<a href="' + KFS_PATH + '">click here</a>', '<a href="' + KFS_PATH + '" target="_blank">click here</a>'].includes(disclosure.text) ||
    launch.text !== "The partnership marks the launch of three co-branded cards on the Mastercard network: Mashreq Aura Credit Card, Mashreq Aura World Credit Card and Mashreq Aura World Elite Card." ||
    !/4\.1\.[\s\S]+no cash or\nmonetary value[\s\S]+participating Aura Brands[\s\S]+4\.2\.[\s\S]+cannot be withdrawn to a bank account or exchanged for cash and\nis non-transferable\.$/.test(redemption.text)) return null;

  // Validate the visible named CTA without submitting it, publishing it,
  // or reconstructing missing optional tracking parameters on the World CTA.
  const href = /^<a href="([^"]+)" [^>]*title="Apply Now"[^>]*><span [^>]+>Apply Now<\/span><\/a>$/.exec(apply.text)?.[1];
  if (!href) return null;
  let target: URL;
  try { target = new URL(href.replaceAll("&amp;", "&")); } catch { return null; }
  if (target.origin !== "https://digital.mashreqbank.com" || target.pathname !== "/creditcards/ntb/otp-send" ||
    target.hash || target.username || target.password || target.searchParams.getAll("utm_pname").length !== 1 ||
    target.searchParams.get("utm_pname") !== selector) return null;

  const [header, ...values] = kfs.text.split("\n");
  const labels = Object.values(MASHREQ_AURA_PRODUCTS).map(x => x.label);
  const cells = values.map(row => row.split(" | "));
  if (header !== EXPECTED_KFS_HEADER || cells.length !== labels.length ||
    cells.some((row, i) => row.length !== 3 || row[0] !== labels[i] || amount(row[1]!) === null || amount(row[2]!) === null)) return null;
  const [, grossPrimary, grossSupplementary] = cells[labels.indexOf(label)]!;
  const annualFee = amount(grossPrimary!);
  const supplementary = amount(grossSupplementary!);
  const text = /^<h6 class="ui-text ui-text-h6" data-event-title="A">Annual fee<\/h6><div class="ui-text ui-text-body4 pt-2 is-richtext">([^<]+)<\/div>$/.exec(fee.text)?.[1];
  const n = "(" + SOURCE_NUMBER + ")";
  const paid = text?.match(new RegExp("^Primary: AED " + n + " \\+ " + n + "% VAT\\nSupplementary: AED " + n + " \\+ " + n + "% VAT$"));
  if (label === "Aura") {
    if (text !== "Free for life" || annualFee !== 0 || supplementary !== 0) return null;
  } else {
    const base = parseSourceNumber(paid?.[1] ?? ""), rate = parseSourceNumber(paid?.[2] ?? "");
    const supp = parseSourceNumber(paid?.[3] ?? ""), suppRate = parseSourceNumber(paid?.[4] ?? "");
    if (base === null || annualFee === null || rate === null || supp === null || suppRate !== rate ||
      base <= 0 || rate <= 0 || rate > 10 || Math.round(base * (100 + rate)) / 100 !== annualFee ||
      Math.round(supp * (100 + rate)) / 100 !== supplementary) return null;
  }
  const evidence = pin(fee, name, label === "Aura" ? "not-applicable" : "exclusive");
  if (!evidence) return null;
  return { name, productUrl, annualFee, vatPolicy: "inclusive" as const,
    network: "Mastercard" as const, rewardCurrency: "Aura Points" as const, evidence: { annualFee: [evidence] } };
}
