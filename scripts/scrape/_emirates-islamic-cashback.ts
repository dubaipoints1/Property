import { createHash } from "node:crypto";
import { parseSourceNumber, SOURCE_NUMBER } from "./_lib.ts";

const bank = "https://www.emiratesislamic.ae";
export const EI_BASE_CASHBACK = "emirates-islamic-cashback";
const NAME = "Emirates Islamic Cashback Credit Card";
const URLS = {
  product: bank + "/en/cards/credit-cards/cashback-card",
  kfs: bank + "/en/key-information/kfs-credit-cards",
  tariff: bank + "/en/soc/cards",
  network: bank + "/en/offers/cards-travel-offers",
} as const;
type Role = keyof typeof URLS;
type DOM = {
  links?: { href: string; label: string; parentHeading: string }[];
  heading?: string;
  vat?: string;
  names?: string[];
  fees?: string[];
  from?: string;
  to?: string;
  tableCount?: number;
  headers?: string[][];
  productRows?: string[][];
};
type Source = {
  id: string;
  url: string;
  capturedAt?: string;
  capturedOn?: string;
  representation: string;
  captureMethod?: string;
  sourceBodySha256: null;
  sourceScope: string;
  fixtureIsCompleteSource: boolean;
  dom?: DOM;
  text: string;
  fixtureTextSha256: string;
  sourceSnapshotSha256?: string;
};

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const ENVELOPE = "visible-main-dom-and-accessibility-snapshot";
const METHOD = "normal-public-browser-ui";
const pars = "emirates-islamic/base-cashback-standard/v1";
const same = (lines: string[], text: string) => lines.join("\n") === text;
const sourceAmount = new RegExp("^(" + SOURCE_NUMBER + ")$");
const axAmount = new RegExp('^    - row "Cashback Platinum (\\d+\\.\\d+%) AED (' + SOURCE_NUMBER + ')":$');
const domAmount = new RegExp("^\uEADF\u00A0(" + SOURCE_NUMBER + ")$");
const headings = "Key Fact Statement (KFS) – Credit Cards";
const kfsVat = "All charges are inclusive of Value Added Tax (VAT) in AED currency.";
const tariffVat = "All charges, commissions and fees are inclusive of Value Added Tax or any other similar sales tax (VAT).";
const tariffHeaders = ["Credit Card Type", "Monthly Profit Rate", "Annual Membership Fee"];
const issuerDisclaimer = "Disclaimer: The term “Credit Card” refers to the Covered Card, which is structured and offered in accordance with the applicable Shariah principles.";

function field(s: Source, unit: string, vatTreatment: "inclusive" | "not-applicable") {
  return {
    parserId: pars, productScope: NAME, unit, vatTreatment, sourceUrl: s.url,
    capturedAt: s.capturedAt!, sourceBodySha256: null, sourceTextSha256: s.fixtureTextSha256,
    sourceRepresentation: ENVELOPE, captureMethod: METHOD, sourceSnapshotSha256: s.sourceSnapshotSha256!,
    sourceScope: s.sourceScope, firstLine: 1, lastLine: s.text.split("\n").length,
    rawText: s.text, rawTextSha256: s.fixtureTextSha256,
  } as const;
}

function source(items: readonly Source[], role: Role) {
  const matches = items.filter(s => s.id === "ei-base-cashback-" + role);
  const s = matches[0];
  if (!s || matches.length !== 1 || s.url !== URLS[role] || s.sourceBodySha256 !== null
      || s.fixtureIsCompleteSource !== false || typeof s.sourceScope !== "string" || !s.sourceScope.trim()
      || typeof s.text !== "string" || !s.text || s.text.length > 2_500 || s.fixtureTextSha256 !== hash(s.text)) return null;
  return s;
}

function domSource(items: readonly Source[], role: Exclude<Role, "network">) {
  const s = source(items, role);
  if (!s || s.representation !== ENVELOPE || s.captureMethod !== METHOD || !s.dom
      || !s.capturedAt || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s.capturedAt)
      || !Number.isFinite(Date.parse(s.capturedAt))
      || s.sourceSnapshotSha256 !== hash(JSON.stringify([s.id, s.url, s.capturedAt, s.sourceScope, s.dom, s.text]))) return null;
  return s as Source & { dom: DOM; capturedAt: string };
}

/** Offline replay of the base card alone. No promotion, reward, FX or eligibility is typed. */
export function parseEiBaseCashback(items: readonly Source[], slug: string) {
  if (slug !== EI_BASE_CASHBACK || items.length !== 4) return null;
  const product = domSource(items, "product"), kfs = domSource(items, "kfs"), tariff = domSource(items, "tariff");
  const network = source(items, "network");
  if (!product || !kfs || !tariff || !network || product.capturedAt.slice(0, 10) !== kfs.capturedAt.slice(0, 10)
      || product.capturedAt.slice(0, 10) !== tariff.capturedAt.slice(0, 10)
      || product.capturedAt.slice(0, 10) !== network.capturedOn
      || network.representation !== "first-party-public-reader-excerpt" || network.dom
      || network.sourceSnapshotSha256 !== undefined || network.captureMethod !== undefined
      || !same([
        "VISA Travel Offers",
        "your Emirates Islamic Visa Credit or Debit Card.",
        "Avis",
        "Credit Cards:",
        "RTA & Cashback Credit Cards.",
        "Switch Cashback, Cashback Plus",
      ], network.text)) return null;

  const links = product.dom.links;
  if (!Array.isArray(links) || links.length !== 2 || links[0]?.parentHeading !== "Cashback Card"
      || links[1]?.parentHeading !== "What Our Customers Are Saying"
      || !links.every(link => link.label === "Apply Now" && link.href === "/en/apply-now?product=cashback%20card")
      || !same(['- heading "Cashback Card" [level=2]', '- link "Apply Now":',
        '- link "Apply Now":', '- emphasis: "' + issuerDisclaimer + '"'], product.text)) return null;

  const { heading, vat, names, fees } = kfs.dom;
  if (heading !== headings || vat !== kfsVat || !Array.isArray(names) || !Array.isArray(fees)
      || names.length !== 17 || fees.length !== names.length || new Set(names).size !== names.length
      || names[0] !== "Product Name" || fees[0] !== "Annual Fee" || names.indexOf("Cashback") !== 4
      || names[3] !== "Skywards Signature" || names[5] !== "Barça Cashback" || names[6] !== "Cashback Plus"
      || names[15] !== "Switch Cashback Card" || !same(['- heading "' + headings + '" [level=1]', "- paragraph: " + vat,
        '    - row "' + names.join(" ") + '":', '    - row "' + fees.join(" ") + '":'], kfs.text)) return null;

  const t = tariff.dom, row = t.productRows?.[0], lines = tariff.text.split("\n");
  const accessible = axAmount.exec(lines[4] ?? "");
  if (t.heading !== "Cards" || t.vat !== tariffVat || t.from !== "Profit based Cards" || t.to !== "Fee based Cards"
      || t.tableCount !== 1 || t.headers?.length !== 1 || t.headers[0].join("|") !== tariffHeaders.join("|")
      || t.productRows?.length !== 1 || !row || row.length !== 3 || row[0] !== "Cashback Platinum"
      || !accessible || row[1] !== accessible[1]
      || !same(['- heading "Cards" [level=1]', "- paragraph: " + tariffVat, '- heading "Profit based Cards" [level=2]',
        '    - row "' + tariffHeaders.join(" ") + '":', lines[4], '- heading "Fee based Cards" [level=2]'], tariff.text)) return null;
  const k = sourceAmount.exec(fees[4])?.[1], tx = domAmount.exec(row[2])?.[1];
  const annualFee = k === undefined ? null : parseSourceNumber(k);
  if (annualFee === null || annualFee <= 0 || tx === undefined || annualFee !== parseSourceNumber(tx)
      || annualFee !== parseSourceNumber(accessible[2])) return null;
  return {
    name: NAME, productUrl: URLS.product, kfsUrl: URLS.kfs, network: "Visa" as const,
    annualFee, vatPolicy: "inclusive" as const, capturedDate: kfs.capturedAt.slice(0, 10),
    sources: Object.values(URLS), sourceFixtureIds: [product.id, kfs.id, tariff.id, network.id],
    evidence: {
      name: [field(product, "Exact public product and named acquisition target; no application entered", "not-applicable")],
      annualFee: [
        field(kfs, "Exact Cashback column with the standard annual fee in AED; VAT-inclusive; not a first-year quote", "inclusive"),
        field(tariff, "Profit-based Cashback Platinum row: standard annual membership in AED, not profit or a waiver", "inclusive"),
      ],
    },
  };
}
