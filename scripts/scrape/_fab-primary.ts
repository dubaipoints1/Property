// Offline, deterministic FAB primary-source observations. No fetch, data write,
// monitor activation or automatic protected-field approval.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";
import type { PrimaryCardSource } from "./_bank-parsers.ts";

export type FabObservation = {
  field: string; value: number; parserId: string; productScope: string; unit: string;
  vatTreatment: "inclusive" | "not-applicable"; sourceUrl: string; capturedAt: string;
  sourceTextSha256: string; sourceBodySha256: string; sourceRepresentation: "http-decoded-response-body";
  captureMethod: "public-http-reader"; sourceScope?: string; firstLine: number; lastLine: number;
  rawText: string; rawTextSha256: string;
};
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PRODUCTS = {
  "fab-travel": { path: "fab-travel-credit-card", name: "FAB Travel Card", row: "FAB Travel" },
  "fab-rewards-indulge": { path: "fab-rewards-indulge-card", name: "FAB Rewards Indulge Card", row: "FAB Rewards Indulge" },
} as const;
type FabSlug = keyof typeof PRODUCTS;
function valid(source: PrimaryCardSource, path: RegExp) {
  try {
    const u = new URL(source.url);
    return u.protocol === "https:" && u.hostname === "www.bankfab.com" && path.test(u.pathname)
      && u.username === "" && u.password === "" && Number.isInteger(source.firstLine) && source.firstLine > 0
      && /^[a-f0-9]{64}$/.test(source.sourceTextSha256) && /^[a-f0-9]{64}$/.test(source.sourceBodySha256 ?? "")
      && sha(source.text) === source.fixtureTextSha256
      && (source.sourceRepresentation === undefined || source.sourceRepresentation === "http-decoded-response-body");
  } catch { return false; }
}
function one(text: string, pattern: RegExp) {
  const all = [...text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))];
  return all.length === 1 ? all[0] : null;
}
function observation(source: PrimaryCardSource, match: RegExpMatchArray | null, field: string, token: string | undefined,
  productScope: string, unit: string, vatTreatment: FabObservation["vatTreatment"] = "not-applicable"): FabObservation | null {
  if (!match || token === undefined) return null;
  const value = token === "Free" ? 0 : parseSourceNumber(token);
  if (value === null) return null;
  const firstLine = source.firstLine + source.text.slice(0, match.index!).split("\n").length - 1;
  return { field, value, parserId: "fab/named-core-primary-fields/v1", productScope, unit, vatTreatment,
    sourceUrl: source.url, capturedAt: source.capturedAt, sourceTextSha256: source.sourceTextSha256,
    sourceBodySha256: source.sourceBodySha256!, sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader",
    ...(source.sourceScope ? { sourceScope: source.sourceScope } : {}), firstLine,
    lastLine: firstLine + match[0].split("\n").length - 1,
    rawText: match[0], rawTextSha256: sha(match[0]) };
}

/** Return the one named literal JSON object without executing/parsing script
 * code. Number extraction below still uses scoped regular expressions. */
function literalObject(text: string, key: string): RegExpMatchArray | null {
  const heading = one(text, new RegExp(`"${escape(key)}"[ \\t]*:[ \\t]*\\{`, "g"));
  if (!heading) return null;
  const start = heading.index!, brace = start + heading[0].length - 1;
  let quoted = false, escaped = false, depth = 0;
  for (let i = brace; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === '"') quoted = false; continue; }
    if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      const found = [text.slice(start, i + 1)] as RegExpMatchArray; found.index = start; return found;
    }
  }
  return null;
}

export function parseFabPrimaryCore(product: PrimaryCardSource, literal: PrimaryCardSource,
  soc: PrimaryCardSource, kfs: PrimaryCardSource, slug: string, benefits?: PrimaryCardSource) {
  if (!Object.hasOwn(PRODUCTS, slug)) return null;
  const identity = PRODUCTS[slug as FabSlug];
  const route = new RegExp(`^/en-ae/personal/credit-cards/${identity.path}$`);
  if (!valid(product, route) || !valid(literal, route) || product.url !== literal.url
    || !product.text.includes(`# ${identity.name}`)
    || !valid(soc, /^\/-\/media\/fab-uds\/personal\/credit-cards\/fees-and-charges\/credit-card\.pdf$/)
    || !valid(kfs, /^\/-\/media\/fab-uds\/personal\/key-facts-statements\/credit-cards\/fab-consolidated-credit-cards-en\.pdf$/)
    || !/Annual Membership Fee \(AMF\) Inclusive of VAT/.test(soc.text)
    || !/Primary Card[ \t]+Supplementary Card/.test(soc.text)
    || !/FAB Credit Cards: The purpose of this document/.test(kfs.text)
    || !/Fees and Charges Inclusive of VAT/.test(kfs.text)) return null;
  const productObject = literalObject(literal.text, "product");
  if (!productObject || !new RegExp(`"name": "${escape(identity.name)}"`).test(productObject[0])
    || !/"currency": "AED"/.test(productObject[0])) return null;
  const observations: FabObservation[] = [];
  const add = (source: PrimaryCardSource, match: RegExpMatchArray | null, field: string, token: string | undefined,
    unit: string, vat: FabObservation["vatTreatment"] = "not-applicable") => {
    const e = observation(source, match, field, token, identity.name, unit, vat); if (e) observations.push(e); return e;
  };
  const annual = one(soc.text, new RegExp(`^[ \\t]+${escape(identity.row)}[ \\t]+(Free|${SOURCE_NUMBER})[ \\t]+(?:Free|${SOURCE_NUMBER})[ \\t]*$`, "gm"));
  if (!add(soc, annual, "annualFee.amount", annual?.[1], "AED primary card annual fee", "inclusive")) return null;
  const salary = one(productObject[0], new RegExp(`"minimumMonthlySalary": \\{\\s*"value": (${SOURCE_NUMBER}),\\s*"currency": "AED"\\s*\\}`, "g"));
  if (!salary) return null;
  salary.index! += productObject.index!;
  const salaryEvidence = add(literal, salary, "eligibility.minSalary", salary[1], "AED monthly salary");
  // Repeated responsive copies must agree with the literal explicit-AED field;
  // duplicate same-value UI copy is not mistaken for multiple product tiers.
  const visibleSalary = [...product.text.matchAll(new RegExp(`^##  (${SOURCE_NUMBER})\\r?\\n\\r?\\nMinimum Monthly Salary$`, "gm"))];
  const salaryHeadings = [...product.text.matchAll(/^Minimum Monthly Salary$/gm)];
  if (!salaryEvidence || !visibleSalary.length || visibleSalary.length !== salaryHeadings.length
    || visibleSalary.some(m => parseSourceNumber(m[1]) !== salaryEvidence.value)) return null;
  const pending = ["The full product-specific approval and relationship conditions remain to be reconciled; a published minimum is not an approval guarantee."];
  let fxFee: number | null = null;
  let fxFeeUpperBound: { amount: number; unit: "percent"; vatTreatment: "inclusive"; scope: "issuer-fx-charges"; schemeCharges: "additional" } | undefined;
  if (slug === "fab-travel") {
    const zero = one(soc.text, /\*Not applicable for Travel Card as it is a true (\d+(?:\.\d+)?)% on International Transaction Fee and For Z Card International/g);
    if (!zero || !/\*Travel card: Bank charges and scheme charges not applicable \| Z card: Bank charges waived but Scheme charges applicable/.test(kfs.text)) return null;
    const e = add(soc, zero, "fxFee", zero[1], "percent bank and scheme international transaction fee", "inclusive");
    if (!e || e.value !== 0) return null;
    fxFee = e.value;
  } else {
    const fx = one(kfs.text, /International Transaction Fee\*[ \t]+Up to (\d+(?:\.\d+)?)% \+ scheme charges\*, including FX margin and fees/g);
    const e = add(kfs, fx, "fxFeeUpperBound.amount", fx?.[1], "percent issuer FX charges upper bound", "inclusive");
    if (!e) return null;
    fxFeeUpperBound = { amount: e.value, unit: "percent", vatTreatment: "inclusive", scope: "issuer-fx-charges", schemeCharges: "additional" };
  }
  const earnRates: Record<string, number> = {};
  if (slug === "fab-rewards-indulge") {
    for (const [category, regex] of [
      ["everythingElse", /"description": "Get (\d+(?:\.\d+)?) FAB Reward for each AED 1 spent on other spending in the UAE and abroad, including non-AED currencies, subject to the selected-category exception\."/g],
      ["online", /"description": "Receive (\d+(?:\.\d+)?) FAB Rewards for every AED 1 spent online\."/g],
    ] as const) {
      const m = one(literal.text, regex); const e = add(literal, m, `earnRates.${category}`, m?.[1], "FAB Rewards per AED");
      if (!e) return null; earnRates[category] = e.value;
    }
    if (!/FAB Rewards earning is capped at [\d,]+ FAB Rewards per month\./.test(product.text)
      || !/Selected categories will earn [\d.]+ FAB Rewards per  1 spent\./.test(product.text)) return null;
    pending.push("Selected categories earn a reduced rate, and rewards are capped in native FAB Rewards. The reduced-category mapping and native-point cap are not converted into AED or modelled as an unlimited cash return. Monthly bonus rewards are excluded from the base rate.");
  } else {
    if (!benefits || !valid(benefits, /^\/-\/media\/fab-uds\/personal\/credit-cards\/fab-travel-credit-card\/pdf\/card-benefits-terms-and-conditions-en\.pdf$/)
      || !/FAB Travel Credit Card/.test(benefits.text)) return null;
    const domestic = one(benefits.text, /Domestic Spends[\s\S]*?^ *(\d+(?:\.\d+)?) FAB Rewards per +1 spend/gm);
    const e = add(benefits, domestic, "earnRates.everythingElse", domestic?.[1], "FAB Rewards per AED domestic spend");
    if (!e) return null; earnRates.everythingElse = e.value;
    pending.push("The base rate is domestic only and excludes the listed reduced categories. International spending does not earn except eligible flights/hotels; the conditional flight/hotel boost, previous-month qualification and combined native-point cap are not modelled as universal rates or unlimited cash return.");
  }
  return { slug, name: identity.name, annualFee: observations.find(e => e.field === "annualFee.amount")!.value,
    minSalary: salaryEvidence.value, fxFee, ...(fxFeeUpperBound ? { fxFeeUpperBound } : {}), earnRates,
    earnUnit: "FAB Rewards per AED 1 spent", observations, pending,
    remainingReview: ["Product-specific network and complete eligibility conditions require independent editorial confirmation before profile insertion.",
      "Unknown native-point cap and reduced-category conditions block total-return calculations; no welcome or recurring benefit value is typed."] };
}
