// Offline product-scoped Mashreq observations. No fetch, writes or defaults.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber, parseSourceAED } from "./_lib.ts";
import type { PrimaryCardSource } from "./_bank-parsers.ts";
export interface MashreqObservation {
  field: string; value: number; parserId: string; productScope: string; unit: string; vatTreatment: "inclusive" | "not-applicable";
  sourceUrl: string; capturedAt: string; sourceTextSha256: string; sourceBodySha256: string;
  sourceRepresentation: "http-decoded-response-body"; captureMethod: "public-http-reader";
  firstLine: number; lastLine: number; rawText: string; rawTextSha256: string;
}
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PRODUCTS = {
  "mashreq-aura": { row: "Aura", path: "aura-credit-card", product: "Mashreq Aura Credit Card" },
  "mashreq-aura-world": { row: "Aura World", path: "aura-world-credit-card", product: "Mashreq Aura World Credit Card" },
  "mashreq-aura-world-elite": { row: "Aura World Elite", path: "aura-elite-credit-card", product: "Mashreq Aura World Elite Credit Card" },
  "mashreq-solitaire": { row: "Solitaire", path: "solitaire-credit-card", product: "Solitaire Credit Card" },
  "mashreq-platinum-plus": { row: "Platinum Plus", path: "platinum-plus-credit-card", product: "Platinum Plus Credit Card" },
} as const;
function one(text: string, regex: RegExp) { const all = [...text.matchAll(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g"))]; return all.length === 1 ? all[0] : null; }
function valid(s: PrimaryCardSource, pathname: RegExp) {
  try { const u = new URL(s.url); return u.protocol === "https:" && u.hostname === "www.mashreq.com" && !u.username && !u.password
    && pathname.test(u.pathname) && sha(s.text) === s.fixtureTextSha256 && /^[a-f0-9]{64}$/.test(s.sourceTextSha256)
    && /^[a-f0-9]{64}$/.test(s.sourceBodySha256 ?? "") && Number.isInteger(s.firstLine) && s.firstLine > 0;
  } catch { return false; }
}
function evidence(s: PrimaryCardSource, match: RegExpMatchArray, field: string, value: number, productScope: string,
  unit: string, vatTreatment: MashreqObservation["vatTreatment"] = "not-applicable"): MashreqObservation {
  const firstLine = s.firstLine + s.text.slice(0, match.index!).split("\n").length - 1;
  return { field, value, parserId: "mashreq/named-kfs-product-core/v1", productScope, unit, vatTreatment,
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256, sourceBodySha256: s.sourceBodySha256!,
    sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader", firstLine,
    lastLine: firstLine + match[0].split("\n").length - 1, rawText: match[0], rawTextSha256: sha(match[0]) };
}
function absolute(m: RegExpMatchArray, offset: number) { m.index! += offset; return m; }
function validFeePageHeaders(kfs: PrimaryCardSource) {
  const pages = kfs.text.split("\f").filter(page => /LOYALTY, BENEFITS & PRICING:/.test(page));
  return pages.length === 2 && pages.every(page => one(page,
    /^ +Annual fee \(primary\) – +Annual fee \(supplementary\)\r?\n +Loyalty\r?\n +recurring \(VAT inclusive\) +- recurring \(VAT inclusive\)$/gm));
}

/** The assigned-limit restriction is a source condition, not a made-up
 * numeric cap. Existing records require independent correction review. */
export function parseMashreqCreditLimitCondition(s: PrimaryCardSource) {
  if (!valid(s, /^\/en\/uae\/neo\/cards\/credit-cards\/(?:cashback|aura(?:-world|-elite)?)-credit-card\/$/)) return null;
  const m = one(s.text, /^(?:Cashback during a monthly statement cycle will be earned for spend transactions carried out within the assigned credit limit on the card|Aura Points are earned on eligible spend transactions made within the assigned credit limit during each statement cycle\.)$/gm);
  if (!m) return null;
  return { parserId: "mashreq/assigned-credit-limit-condition/v1", sourceUrl: s.url, capturedAt: s.capturedAt,
    sourceTextSha256: s.sourceTextSha256, sourceBodySha256: s.sourceBodySha256,
    firstLine: s.firstLine + s.text.slice(0, m.index!).split("\n").length - 1,
    lastLine: s.firstLine + s.text.slice(0, m.index!).split("\n").length - 1,
    rawText: m[0], rawTextSha256: sha(m[0]), semantic: "assigned-credit-limit-cap-unknown-not-unlimited", numericCap: null };
}

/** A bound conflict is an editorial hold, never an overwrite or an inferred
 * guaranteed base. Both the named product and named KFS row are retained. */
export function parseMashreqCashbackBaseConflict(product: PrimaryCardSource, kfs: PrimaryCardSource) {
  if (!valid(product, /^\/en\/uae\/neo\/cards\/credit-cards\/cashback-credit-card\/$/)
    || !/^##### Cashback Credit Card$/m.test(product.text)
    || !valid(kfs, /^\/-\/jssmedia\/pdfs\/neo\/cards\/KFS-TnC\/Mashreq-Cards-KFS-new-en-ar\.ashx$/)
    || !/^KFS_Cards_09 2026$/m.test(kfs.text) || !validFeePageHeaders(kfs)) return null;
  const advertised = one(product.text, /^up to (\d+(?:\.\d+)?)% cashback on local spends$/gm);
  const block = one(kfs.text, /^ +Cashback[ \t]*\r?\n +Free for life +Free for life +\d+(?:\.\d+)?% on other international spends\r?\n\r?\n +\d+(?:\.\d+)?% on other spends in the UAE$/gm);
  if (!advertised || !block) return null;
  const standing = one(block[0], /^ +(\d+(?:\.\d+)?)% on other spends in the UAE$/gm);
  if (!standing) return null;
  absolute(standing, block.index!);
  const upper = parseSourceNumber(advertised[1]), exact = parseSourceNumber(standing[1]);
  if (upper === null || exact === null) return null;
  return { parserId: "mashreq/cashback-local-bound-conflict/v1", state: "needs-review" as const,
    productClaim: { ...evidence(product, advertised, "earnRates.everythingElse", upper, "Mashreq Cashback Credit Card", "percent cashback on local spends"), bound: "upper" as const },
    kfsClaim: { ...evidence(kfs, standing, "earnRates.everythingElse", exact, "Mashreq Cashback Credit Card", "percent cashback on other UAE spends"), bound: "exact" as const } };
}

export function parseMashreqPrimaryCore(product: PrimaryCardSource, kfs: PrimaryCardSource, slug: string) {
  if (!Object.hasOwn(PRODUCTS, slug)) return null;
  const config = PRODUCTS[slug as keyof typeof PRODUCTS];
  if (!valid(product, new RegExp(`^/en/uae/neo/cards/credit-cards/${config.path}/$`))
    || !product.text.includes(`##### ${config.product}`)
    || !valid(kfs, /^\/-\/jssmedia\/pdfs\/neo\/cards\/KFS-TnC\/Mashreq-Cards-KFS-new-en-ar\.ashx$/)
    || !/^KFS_Cards_09 2026$/m.test(kfs.text)) return null;
  // Every repeated table header is part of this fixture's positional contract.
  // An unchanged second page must not hide a swapped first-page fee column.
  if (!validFeePageHeaders(kfs)) return null;
  const out: MashreqObservation[] = [];
  const add = (s: PrimaryCardSource, m: RegExpMatchArray | null, field: string, token: string | undefined, unit: string, vat: MashreqObservation["vatTreatment"] = "not-applicable") => {
    if (!m || token === undefined) return null;
    const n = token === "Free for life" ? 0 : parseSourceNumber(token); if (n === null) return null;
    const e = evidence(s, m, field, n, config.product, unit, vat); out.push(e); return e;
  };
  // The primary fee is the first fee column on the named row; a wrapped
  // Platinum Plus fee is below its name but before its next rate line.
  const feeRowPattern = slug === "mashreq-aura-world-elite"
    ? `^[ \\t]+Aura World Elite[ \\t]*\\r?\\n +Up to ${SOURCE_NUMBER}% cashback as Aura Points on Aura brands in the UAE, at participating brands only\\r?\\n +${SOURCE_NUMBER}% cashback as Aura Points on domestic grocery spends\\r?\\n +(Free for life|${SOURCE_NUMBER}) +(Free for life|${SOURCE_NUMBER}) +${SOURCE_NUMBER}% cashback as Aura Points on international spends$`
    : slug === "mashreq-platinum-plus"
    ? `^[ \\t]+Platinum Plus[ \\t]*\\r?\\n +${SOURCE_NUMBER} Mashreq Vantage points for every +${SOURCE_NUMBER} on local spends on Government payments, utilities,\\r?\\n +(Free for life|${SOURCE_NUMBER}) +(Free for life|${SOURCE_NUMBER})[ \\t]*$`
    : `^[ \\t]+${escape(config.row)}[ \\t]*(?:\\r?\\n[ \\t]*){0,3}(Free for life|${SOURCE_NUMBER})[ \\t]+(Free for life|${SOURCE_NUMBER})[ \\t]*(?:[^\\n]*)$`;
  const row = one(kfs.text, new RegExp(feeRowPattern, "gm"));
  if (!add(kfs, row, "annualFee.amount", row?.[1], "AED primary annual fee", "inclusive")) return null;
  const fx = one(kfs.text, /^ +Spread on international transactions in non-AED Currency: (\d+(?:\.\d+)?)% \(plus\r?\n +VAT not applicable[^\r\n]*\r?\n +Visa\/Mastercard charges as applicable\)$/gm);
  if (!add(kfs, fx, "fxFee", fx?.[1], "percent issuer FX spread; scheme charges additional")) return null;
  const salary = one(product.text, new RegExp(`^Your monthly income should be a minimum of (AED ${SOURCE_NUMBER})\\.$`, "gm"));
  if (salary) { const n = parseSourceAED(salary[1]); if (n === null) return null; out.push(evidence(product, salary, "eligibility.minSalary", n, config.product, "AED monthly income")); }
  const aura = slug.startsWith("mashreq-aura");
  let channelExclusion: ReturnType<typeof parseMashreqCreditLimitCondition> = null;
  if (aura) {
    const excluded = one(product.text, /^Please note that Aura Points are not earned on bill payments made through Mashreq Mobile App or Online Banking\.$/gm);
    if (!excluded) return null;
    const line = product.firstLine + product.text.slice(0, excluded.index!).split("\n").length - 1;
    channelExclusion = { parserId: "mashreq/aura-bank-payment-channel-exclusion/v1", sourceUrl: product.url, capturedAt: product.capturedAt,
      sourceTextSha256: product.sourceTextSha256, sourceBodySha256: product.sourceBodySha256,
      firstLine: line, lastLine: line, rawText: excluded[0], rawTextSha256: sha(excluded[0]),
      semantic: "bank-channel-bill-payment-exclusion-not-a-reduced-rate", numericCap: null };
    const blocks = [...kfs.text.matchAll(/^ +Up to (\d+(?:\.\d+)?)% cashback as Aura Points on Aura brands in the UAE, at participating brands only[\s\S]*?^ +\d+(?:\.\d+)?% cashback as Aura Points on other local spends$/gm)];
    // A tall row's name can be vertically above its first reward line (World
    // Elite) or between its reward lines (Aura/World). Associate the exact
    // named annual-fee row with the one complete reward block ending after it,
    // and starting after the preceding reward block, never a prefix name.
    const matching = blocks.filter((b, i) => row!.index! < b.index! + b[0].length
      && (i === 0 || row!.index! >= blocks[i - 1].index! + blocks[i - 1][0].length));
    if (matching.length !== 1 || !parseMashreqCreditLimitCondition(product)) return null;
    const block = matching[0];
    for (const [category, label] of [["groceries", "domestic grocery spends"], ["international", "international spends"], ["everythingElse", "other local spends"]]) {
      const m = one(block[0], new RegExp(`(?:^ +|[ \\t]{3,})(\\d+(?:\\.\\d+)?)% cashback as Aura Points on ${label}$`, "gm"));
      if (!m) return null; absolute(m, block.index!); if (!add(kfs, m, `earnRates.${category}`, m[1], "percent value back paid as Aura Points")) return null;
    }
    const reduced = one(block[0], /^ +(\d+(?:\.\d+)?)% cashback as Aura Points on Government payments, utilities, education, charity, fuel, rental(?: and|,)?\r?\n +(?:and )?telecom purchase$/gm);
    if (!reduced) return null; absolute(reduced, block.index!);
    for (const key of ["government", "utilities", "education", "charity", "fuel", "realEstate", "telecom"])
      if (!add(kfs, reduced, `earnRates.${key}`, reduced[1], "percent value back paid as Aura Points")) return null;
  } else {
    // Product prose states AED denominators explicitly; use it rather than
    // inferring the currency lost from the KFS's embedded dirham glyph.
    const line = slug === "mashreq-solitaire"
      ? one(product.text, /^Earn (\d+(?:\.\d+)?) points per AED on international purchases, (\d+(?:\.\d+)?) points per AED on airlines, hotels and other travel spends, (\d+(?:\.\d+)?) points per AED on local spends and (\d+(?:\.\d+)?) point per AED on other local spends\. To know more, mashreq\.com\/vantage\.$/gm)
      : one(product.text, /^• Earn (\d+(?:\.\d+)?) points per AED at supermarket, fuel spends & dining , (\d+(?:\.\d+)?) points per AED on international spends and other local spends, (\d+(?:\.\d+)?) Mashreq Vantage points for every AED 1 on local spends on Government payments, utilities, education, charity,rental & telecom spends\.$/gm);
    if (!line) return null;
    const map = slug === "mashreq-solitaire" ? { international: 1, airfare: 2, hotels: 2, travel: 2, everythingElse: 3,
      government: 4, utilities: 4, fuel: 4, education: 4, charity: 4, realEstate: 4, telecom: 4 }
      : { dining: 1, groceries: 1, fuel: 1, international: 2, everythingElse: 2, government: 3, utilities: 3, education: 3, charity: 3, realEstate: 3, telecom: 3 };
    for (const [key, group] of Object.entries(map)) if (!add(product, line, `earnRates.${key}`, line[group], "Mashreq Vantage points per AED")) return null;
  }
  return { slug, name: config.product, observations: out,
    annualFee: out.find(e => e.field === "annualFee.amount")!.value,
    minSalary: out.find(e => e.field === "eligibility.minSalary")?.value ?? null,
    fxFee: out.find(e => e.field === "fxFee")!.value, fxFeeScope: "issuer-fx-charges-only" as const, fxFeeVatTreatment: "not-applicable" as const,
    earnRates: Object.fromEntries(out.filter(e => e.field.startsWith("earnRates.")).map(e => [e.field.slice("earnRates.".length), e.value])),
    earnUnit: aura ? "% value back (paid as Aura Points)" : "Mashreq Vantage points per AED 1 spent",
    // The complete accepted native-point prose above explicitly says "per
    // AED" (and, for the reduced Platinum Plus row, "per AED 1"). In this
    // exact regex grammar a singular currency unit means one AED; it is not
    // an exchange-rate conversion or a guessed redemption value.
    spendDenominator: aura ? null : { amount: 1, currency: "AED" as const },
    creditLimitCondition: aura ? parseMashreqCreditLimitCondition(product) : null,
    channelExclusion,
    pending: ["Complete product-specific eligibility and network require independent confirmation; absent salary is null, not zero.",
      aura ? "Brand up-to rates, assigned-credit-limit cap and current acquisition bonus are not modelled as universal cash returns. Aura Points are not earned on bill payments through Mashreq Mobile App or Online Banking; reduced sector rates do not override this payment-channel exclusion."
        : "Native-point redemption value and benefit-specific qualification are not assumed to be cash or unlimited perks."],
  };
}
