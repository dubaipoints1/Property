// Deterministic, product-scoped primary-source observations. No network or writes.
// These are evidence candidates, not automatic protected-field corrections.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceAED, parseSourceNumber, parsePercent } from "./_lib.ts";

export interface PrimaryCardSource {
  url: string;
  capturedAt: string;
  sourceTextSha256: string;
  sourceBodySha256: string | null;
  sourceRepresentation?: "http-decoded-response-body" | "visible-main-dom-and-accessibility-snapshot";
  captureMethod?: "public-http-reader" | "normal-public-browser-ui";
  sourceSnapshotSha256?: string;
  sourceScope?: string;
  firstLine: number;
  fixtureTextSha256: string;
  text: string;
}
export interface BankFieldEvidence {
  field: string;
  value: number;
  parserId: string;
  productScope: string;
  unit: "AED" | "years" | "months" | "visits per year" | "USD denominator" | "percent cashback" | "Skywards Miles per USD" | "unresolved currency glyph" | "percent per month" | "percent APR" | "percent issuer processing fee";
  vatTreatment: "inclusive" | "not-applicable";
  sourceUrl: string;
  capturedAt: string;
  sourceTextSha256: string;
  sourceBodySha256: string | null;
  sourceRepresentation: "http-decoded-response-body" | "visible-main-dom-and-accessibility-snapshot";
  captureMethod: "public-http-reader" | "normal-public-browser-ui";
  sourceSnapshotSha256?: string;
  sourceScope?: string;
  firstLine: number;
  lastLine: number;
  rawText: string;
  rawTextSha256: string;
}
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
function valid(source: PrimaryCardSource, host: string, pathname: RegExp): boolean {
  try {
    const url = new URL(source.url);
    const dom = source.sourceRepresentation === "visible-main-dom-and-accessibility-snapshot";
    const representationValid = dom
      ? source.sourceBodySha256 === null && source.captureMethod === "normal-public-browser-ui" && /^[a-f0-9]{64}$/.test(source.sourceSnapshotSha256 ?? "") && !!source.sourceScope
      : typeof source.sourceBodySha256 === "string" && /^[a-f0-9]{64}$/.test(source.sourceBodySha256);
    return url.protocol === "https:" && url.hostname === host && pathname.test(url.pathname)
      && Number.isInteger(source.firstLine) && source.firstLine > 0
      && /^[a-f0-9]{64}$/.test(source.sourceTextSha256)
      && representationValid
      && hash(source.text) === source.fixtureTextSha256;
  } catch { return false; }
}

const ADCB_PRODUCTS: Record<string, { path: string; heading: string }> = {
  "adcb-365-cashback": { path: "365-cashback-card", heading: "365 Cashback Credit Card" },
  "adcb-lulu-platinum": { path: "adcb-lulu-credit-card", heading: "ADCB LuLu Platinum Credit Card" },
  "adcb-lulu-titanium-gold": { path: "adcb-lulu-titanium-gold-credit-card", heading: "ADCB LuLu Titanium Credit Card" },
  "adcb-betaqti": { path: "betaqti-credit-card", heading: "Betaqti Credit Card" },
  "adcb-essential-cashback": { path: "essential-cashback-credit-card", heading: "Essential Cashback Credit Card" },
  "adcb-shukran": { path: "shukran-credit-card", heading: "Shukran ADCB Credit Card" },
  "adcb-talabat": { path: "talabat-credit-card", heading: "talabat ADCB Credit Card" },
  "adcb-touchpoints-infinite": { path: "touchpoint-ic", heading: "ADCB TouchPoints Infinite Credit Card" },
  "adcb-touchpoints-platinum": { path: "touchpoint-platinum-cc", heading: "ADCB TouchPoints Platinum Credit Card" },
  "adcb-touchpoints-titanium-gold": { path: "touchpoint-tg-cc", heading: "ADCB TouchPoints Titanium and Gold Credit Card" },
  "adcb-traveller": { path: "traveller-credit-card", heading: "Traveller Credit Card" },
};

/** DOM snapshots are a separate representation, never fake HTTP response bytes.
 * Only captured UI state is parsed; absence in a collapsed panel proves nothing. */
export function parseAdcbRenderedProduct(source: PrimaryCardSource, slug: string): BankFieldEvidence[] {
  const product = ADCB_PRODUCTS[slug];
  if (!product || source.sourceRepresentation !== "visible-main-dom-and-accessibility-snapshot"
    || !valid(source, "www.adcb.com", new RegExp(`^/en/personal/cards/credit-cards/${escape(product.path)}(?:\\.aspx)?/?$`))
    || !source.text.split("\n").slice(0, 3).includes(product.heading)) return [];
  const out: BankFieldEvidence[] = [];
  const add = (match: RegExpMatchArray | null, name: string, token: string | undefined, unit: BankFieldEvidence["unit"], vatTreatment: BankFieldEvidence["vatTreatment"] = "not-applicable") => {
    if (!match || token === undefined) return;
    const e = field(source, match, { field: name, value: parseSourceNumber(token), unit, vatTreatment,
      parserId: "adcb/rendered-product-standing-fields/v1", productScope: product.heading });
    if (e) out.push(e);
  };
  // Betaqti exposes the condition in its visible "Keep in mind" panel;
  // the later Eligibility accordion was not expanded in this capture.
  const eligibility = slug === "adcb-betaqti"
    ? one(source.text, /^Keep in mind\r?\n([\s\S]*?)^TouchPoints Rewards$/gm)
    : one(source.text, /^Eligibility\r?\n([\s\S]*?)^(?:Fees and charges|Charges and Fees|Terms and Conditions|Other credit card benefits)$/gmi);
  if (eligibility) {
    const alternative = one(eligibility[0], new RegExp(`You need to have a minimum (?:monthly )?salary of[\\s\\u00a0]*AED[\\s\\u00a0]*(${SOURCE_NUMBER}) or be eligible for a credit limit of at least[\\s\\u00a0]*AED[\\s\\u00a0]*(${SOURCE_NUMBER})(?=\\s|$)`, "g"));
    if (alternative) {
      absoluteMatch(alternative, eligibility.index!);
      add(alternative, "eligibility.salaryRoute", alternative[1], "AED");
      add(alternative, "eligibility.creditLimitAlternative", alternative[2], "AED");
    }
  }
  if (slug !== "adcb-365-cashback") return out;
  const fee = one(source.text, new RegExp(`An annual fee of[\\s\\u00a0]*AED[\\s\\u00a0]*(${SOURCE_NUMBER}) \\(including VAT\\) will be applicable on the primary credit card from the second year onwards\\.`, "g"));
  add(fee, "annualFee.amount", fee?.[1], "AED", "inclusive");
  const rateBlock = one(source.text, /^Applicable cashback earn rate:\r?\n([\s\S]*?)^Other credit card benefits$/gm);
  if (!rateBlock) return out;
  for (const [category, label] of [
    ["groceries", "Groceries & Supermarkets spends"],
    ["dining", "Dining spends including the online orders"],
    ["digitalEntertainment", "Home Digital Entertainment subscriptions like Netflix, Amazon Prime, Disney+ and more"],
    ["aiSubscriptions", "AI-powered subscriptions like ChatGPT, Microsoft Copilot, Google Gemini and more"],
    ["fuel", "Fuel & Salik spends"],
    ["everythingElse", "other Retail Spends"],
  ]) {
    const rate = one(rateBlock[0], new RegExp(`^(\\d+(?:\\.\\d+)?)% cashback on ${escape(label)}$`, "gm"));
    if (rate) { absoluteMatch(rate, rateBlock.index!); add(rate, `earnRates.${category}`, rate[1], "percent cashback"); }
  }
  const cap = one(rateBlock[0], new RegExp(`Maximum cashback earned per month:[\\s\\u00a0]*AED[\\s\\u00a0]*(${SOURCE_NUMBER})(?=\\s|$)`, "g"));
  if (cap) { absoluteMatch(cap, rateBlock.index!); add(cap, "earnRates._caps.monthly_max_aed", cap[1], "AED"); }
  const spend = one(rateBlock[0], new RegExp(`A minimum retail spend of[\\s\\u00a0]*AED[\\s\\u00a0]*(${SOURCE_NUMBER}) on your card, per calendar month, is required to be eligible to earn cashback`, "g"));
  if (spend) { absoluteMatch(spend, rateBlock.index!); add(spend, "earnRates._caps.min_monthly_spend_to_qualify_aed", spend[1], "AED"); }
  return out;
}

/** The bank's named eligibility guide narrows subscription and reduced-rate
 * categories. It does not establish a blanket entertainment/online rate. */
export function parseAdcb365CashbackGuide(source: PrimaryCardSource): BankFieldEvidence[] {
  if (!valid(source, "www.adcb.com", /^\/en\/multimedia\/pdfs\/2026\/june\/home-digital-subscription-guide-en\.pdf$/)
    || !/ADCB 365 Cashback Credit Card -\s*\n\s*Cashback Eligibility Guide/.test(source.text)
    || !/Ver\.01\/Jun2026/.test(source.text)) return [];
  const block = one(source.text, /^([ \t]*)(\d+(?:\.\d+)?)% cashback on select category spends\r?\n[\s\S]*?(?=^IMPORTANT NOTES)/gm);
  if (!block) return [];
  block[0] = block[0].trimEnd();
  const categoryMap: Record<string, string> = { "Utilities": "utilities", "Charity": "charity",
    "Government payments": "government", "Telecom": "telecom", "Transport": "transport",
    "Auto dealers": "autoDealers", "Education": "education", "Insurance": "insurance",
    "Real estate": "realEstate", "Housing rentals": "realEstate" };
  const labels = [...block[0].matchAll(/^[ \t]*•[ \t]+([^\r\n]+)$/gm)].map(m => m[1].trim());
  if (labels.length !== Object.keys(categoryMap).length || new Set(labels).size !== labels.length
    || labels.some(label => !Object.hasOwn(categoryMap, label))) return [];
  const out: BankFieldEvidence[] = [];
  for (const category of new Set(labels.map(label => categoryMap[label]))) {
    const observed = field(source, block, { field: `earnRates.${category}`, value: parseSourceNumber(block[2]),
      parserId: "adcb/365-named-guide-reduced-categories/v1", productScope: "ADCB 365 Cashback Credit Card",
      unit: "percent cashback" });
    if (observed) out.push(observed);
  }
  return out;
}
function one(text: string, regex: RegExp): RegExpMatchArray | null {
  const hits = [...text.matchAll(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g"))];
  return hits.length === 1 ? hits[0] : null;
}
function sourceLocation(source: PrimaryCardSource, match: RegExpMatchArray) {
  const start = match.index!;
  return {
    sourceUrl: source.url, capturedAt: source.capturedAt,
    sourceTextSha256: source.sourceTextSha256, sourceBodySha256: source.sourceBodySha256,
    sourceRepresentation: source.sourceRepresentation ?? "http-decoded-response-body",
    captureMethod: source.captureMethod ?? "public-http-reader",
    ...(source.sourceSnapshotSha256 ? { sourceSnapshotSha256: source.sourceSnapshotSha256 } : {}),
    ...(source.sourceScope ? { sourceScope: source.sourceScope } : {}),
    firstLine: source.firstLine + source.text.slice(0, start).split("\n").length - 1,
    lastLine: source.firstLine + source.text.slice(0, start + match[0].length - 1).split("\n").length - 1,
    rawText: match[0], rawTextSha256: hash(match[0]),
  };
}
function field(source: PrimaryCardSource, match: RegExpMatchArray, config: {
  field: string; value: number | null; parserId: string; productScope: string;
  unit: BankFieldEvidence["unit"]; vatTreatment?: BankFieldEvidence["vatTreatment"];
}): BankFieldEvidence | null {
  if (config.value === null || !Number.isFinite(config.value)) return null;
  return { ...config, value: config.value, vatTreatment: config.vatTreatment ?? "not-applicable", ...sourceLocation(source, match) };
}
function absoluteMatch(match: RegExpMatchArray, offset: number): RegExpMatchArray {
  match.index = (match.index ?? 0) + offset;
  return match;
}

/** Product-page retail monthly charge only. No annual APR is inferred. */
export function parseScPlatinumXProduct(source: PrimaryCardSource): BankFieldEvidence[] {
  if (!valid(source, "www.sc.com", /^\/ae\/credit-cards\/platinum-x-cashback\/$/)
    || !/^# Platinum X [–-] Standard Chartered UAE$/m.test(source.text)) return [];
  const block = one(source.text, /^### Fees and charges\r?\n([\s\S]*?)^### Eligibility & Documents$/gm);
  if (!block) return [];
  const monthly = one(block[0], /^Finance charges\r?\nRetail: (\d+(?:\.\d+)?%) per month$/gm);
  if (!monthly) return [];
  const result = field(source, absoluteMatch(monthly, block.index!), {
    field: "interestRate.monthly", value: parsePercent(monthly[1]),
    parserId: "sc-platinum-x/product-retail-monthly/v1", productScope: "Standard Chartered Platinum X",
    unit: "percent per month",
  });
  return result ? [result] : [];
}

const HSBC_PRODUCTS: Record<string, string> = {
  "hsbc-live-plus": "HSBC Live+ Credit Card",
  "hsbc-cash-plus": "HSBC Cash+ Credit Card",
  "hsbc-skywards-infinite": "HSBC Emirates Skywards Infinite Credit Card",
  "hsbc-skywards-signature": "HSBC Emirates Skywards Signature Credit Card",
};
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Named English KFS sections plus the explicitly shared fee row. Never the
 * first arbitrary fee/salary in a multicard tariff. APR is not nominal interest. */
export function parseHsbcCardKfs(source: PrimaryCardSource, slug: string): BankFieldEvidence[] {
  const product = HSBC_PRODUCTS[slug];
  if (!product || !valid(source, "www.hsbc.ae", /^\/content\/dam\/hsbc\/ae\/docs\/en\/cards\/kfs-credit-cards\.pdf$/)
    || !/^HSBC Bank Middle East Limited\r?$/m.test(source.text)
    || !/^Applicable to HSBC Skywards, Cash\+ & Live\+ Cards\.$/m.test(source.text)) return [];
  const title = one(source.text, new RegExp(`^ ${escape(product)}$`, "gm"));
  if (!title) return [];
  const from = title.index! + title[0].length;
  const rest = source.text.slice(from);
  const next = rest.search(/^ (?:HSBC .+ Credit Card|The benefits and features set out)/m);
  if (next < 0) return [];
  const section = rest.slice(0, next);
  const out: BankFieldEvidence[] = [];
  const add = (match: RegExpMatchArray | null, config: Parameters<typeof field>[2], offset = 0) => {
    if (!match) return;
    const result = field(source, absoluteMatch(match, offset), config);
    if (result) out.push(result);
  };
  const annual = one(section, new RegExp(`^ Annual Fee[: \\-]+(AED[ \\t]+${SOURCE_NUMBER}) including VAT\\.?$`, "gm"));
  add(annual, { field: "annualFee.amount", value: annual ? parseSourceAED(annual[1]) : null,
    parserId: "hsbc/kfs-named-annual-fee/v1", productScope: product, unit: "AED", vatTreatment: "inclusive" }, from);
  const salary = one(section, new RegExp(`^ Income [^\\n]*?minimum monthly salary of (AED[ \\t]+${SOURCE_NUMBER})(?=[ .])[^\\n]*$`, "gm"));
  add(salary, { field: "eligibility.minSalary", value: salary ? parseSourceAED(salary[1]) : null,
    parserId: "hsbc/kfs-named-salary/v1", productScope: product, unit: "AED" }, from);
  // Shared processing fee explicitly applies to each named column in this KFS;
  // do not add the separately disclosed scheme fee to this issuer-only field.
  const fx = one(source.text, /Foreign Currency Processing\r?\n Fee\(3a\) Applicable on foreign\r?\n\s*([\d.]+)% \(([\d.]+)% Inclusive of VAT\) of the transaction amount as converted into your billing currency4/m);
  add(fx, { field: "fxFee", value: fx ? parseSourceNumber(fx[2]) : null,
    parserId: "hsbc/kfs-shared-fx-inclusive/v1", productScope: product,
    unit: "percent issuer processing fee", vatTreatment: "inclusive" });
  const apr = one(source.text, /Annual\r?\n\s*Percentage Rate\r?\n\s*(\d+(?:\.\d+)?%)\r?\n\s*on purchases and\r?\n\s*cash withdrawals1/m);
  add(apr, { field: "interestRate.annual", value: apr ? parsePercent(apr[1]) : null,
    parserId: "hsbc/kfs-shared-apr/v1", productScope: product, unit: "percent APR" });
  return out;
}

/** Does not type a salary: the issuer calls these income branches. Used only
 * to identify conflict with a KFS scalar and keep eligibility Pending. */
export function parseHsbcLivePlusIncomeClaims(source: PrimaryCardSource) {
  if (!valid(source, "www.hsbc.ae", /^\/credit-cards\/products\/live-plus\/$/)
    || !/^Live\+ Credit Card$/m.test(source.text)) return null;
  const claims = one(source.text, new RegExp(`^- Earn a monthly income starting from (⃃)(${SOURCE_NUMBER})(?:\\[@[^\\]]+\\])? for employees of approved companies, or (⃃)(${SOURCE_NUMBER}) for all other applicants$`, "gm"));
  if (!claims) return null;
  return {
    semantic: "income-not-universal-salary", sourceUrl: source.url,
    branches: [
      { condition: "employees of approved companies", rawCurrency: claims[1], amount: parseSourceNumber(claims[2]) },
      { condition: "all other applicants", rawCurrency: claims[3], amount: parseSourceNumber(claims[4]) },
    ],
    evidence: field(source, claims, { field: "eligibility.incomeClaims", value: parseSourceNumber(claims[2]),
      parserId: "hsbc/live-plus-conditional-income/v1", productScope: "HSBC Live+ Credit Card", unit: "unresolved currency glyph" }),
    requiresCurrencyCorroboration: true, canonicalWriteEligible: false,
  };
}

/** Core fields only: marketing bonuses and direct-carrier boosts are not
 * silently flattened into an all-spend rate. Requires product/KFS agreement. */
export function parseHsbcNewProduct(productSource: PrimaryCardSource, kfs: PrimaryCardSource, slug: string) {
  if (!(slug in HSBC_PRODUCTS) || slug === "hsbc-live-plus") return null;
  const product = HSBC_PRODUCTS[slug];
  const route = slug.replace("hsbc-", "");
  if (!valid(productSource, "www.hsbc.ae", new RegExp(`^/credit-cards/products/${escape(route)}/$`))
    || !(productSource.text.includes(product) || (slug === "hsbc-cash-plus" && /^Cash\+ Credit Card$/m.test(productSource.text)))) return null;
  const observations = parseHsbcCardKfs(kfs, slug);
  if (observations.length !== 4) return null;
  const eligibilityBlock = one(productSource.text, /^Who can apply\?\r?\n([\s\S]*?)^Fees and rates$/gm);
  if (!eligibilityBlock) return null;
  const eligibilityText = eligibilityBlock[0];
  const income = one(eligibilityText, new RegExp(`^- [Ee]arn at least (AED[ \\t]+${SOURCE_NUMBER}) a month$`, "gm"));
  const conditionalIncome = one(eligibilityText, new RegExp(`^- Earn a monthly income starting from (AED[ \\t]+${SOURCE_NUMBER})(?:\\[@[^\\]]+\\])? for employees of approved companies, or (AED[ \\t]+${SOURCE_NUMBER}) for all other applicants$`, "gm"));
  const salaryConfirmed = !!income && parseSourceAED(income[1]) === observations.find(o => o.field === "eligibility.minSalary")?.value;
  if (!salaryConfirmed && !conditionalIncome) return null;
  if (conditionalIncome) {
    const claim = field(productSource, absoluteMatch(conditionalIncome, eligibilityBlock.index!), { field: "eligibility.incomeClaims",
      value: parseSourceAED(conditionalIncome[1]), parserId: "hsbc/product-conditional-income/v1",
      productScope: product, unit: "AED" });
    if (!claim) return null;
    observations.push(claim);
  }
  const age = one(eligibilityText, /^- [Bb]e aged between (\d+) and (\d+)$/gm);
  const resident = one(eligibilityText, /^- [Ll]ive in the UAE$/gm);
  const noAccount = one(eligibilityText, /^You don't need an account with us to apply for [^\n]+ Credit Card, but you(?:'ll| do) need to:$/gm);
  const visa = /(?:HSBC Visa card|Visa is solely responsible for deciding the spend category)/.test(productSource.text);
  if (!age || !resident || !noAccount || !visa) return null;
  absoluteMatch(age, eligibilityBlock.index!);
  const add = (match: RegExpMatchArray, name: string, token: string, unit: BankFieldEvidence["unit"]) => {
    const observed = field(productSource, match, { field: name, value: parseSourceNumber(token),
      parserId: "hsbc/product-standing-fields/v1", productScope: product, unit });
    if (!observed) throw new Error("Validated product token unexpectedly failed");
    observations.push(observed);
  };
  add(age, "eligibility.minAge", age[1], "years");
  add(age, "eligibility.maxAge", age[2], "years");
  let unit: string;
  let yearOneWaived = false;
  if (slug === "hsbc-cash-plus") {
    const base = one(productSource.text, /^Earn (\d+(?:\.\d+)?)% cashback every day on all your purchases up to your credit card limit, with no minimum spend\.$/gm);
    if (!base) return null;
    add(base, "earnRates.everythingElse", base[1], "percent cashback");
    unit = "% cashback";
    const intro = one(productSource.text, new RegExp(`^- AED (${SOURCE_NUMBER}) for the first (\\d+) months\\. Then AED (${SOURCE_NUMBER}) including VAT[^\\n]*$`, "gm"));
    if (intro && parseSourceNumber(intro[1]) === 0 && Number(intro[2]) === 12
      && parseSourceNumber(intro[3]) === observations.find(o => o.field === "annualFee.amount")!.value) {
      yearOneWaived = true;
      add(intro, "annualFeeWaiver.introductoryAmount", intro[1], "AED");
      add(intro, "annualFeeWaiver.introductoryMonths", intro[2], "months");
    }
  } else {
    // The named KFS paragraph explicitly supplies the USD denominator.
    const title = one(kfs.text, new RegExp(`^ ${escape(product)}$`, "gm"))!;
    const from = title.index! + title[0].length;
    const rest = kfs.text.slice(from);
    const next = rest.search(/^ (?:HSBC .+ Credit Card|The benefits and features set out)/m);
    const section = rest.slice(0, next);
    const basis = one(section, /^ Key Features: Skywards Miles rewards, up to [\d.]+ miles per USD (\d+(?:\.\d+)?) equivalent of eligible spend\./gm);
    const domestic = one(productSource.text, /^Get (\d+(?:\.\d+)?) Skywards Miles on AED transactions$/gm);
    const international = one(productSource.text, /^Get (\d+(?:\.\d+)?) Skywards Miles on non-AED transactions$/gm);
    const reduced = one(productSource.text, /^Get (\d+(?:\.\d+)?) Skywards Miles on government services, public transport, utilities, telecoms, education, real estate, fuel, groceries and supermarkets, insurance and auto dealers \(AED\)$/gm);
    if (!basis || !domestic || !international || !reduced) return null;
    const denom = parseSourceNumber(basis[1]);
    if (denom === null || denom <= 0) return null;
    const denominatorEvidence = field(kfs, absoluteMatch(basis, from), { field: "earnBasis.denominator", value: denom,
      parserId: "hsbc/kfs-skywards-usd-denominator/v1", productScope: product, unit: "USD denominator" });
    if (!denominatorEvidence) return null;
    observations.push(denominatorEvidence);
    unit = `Skywards Miles per USD ${denom}`;
    add(domestic, "earnRates.everythingElse", domestic[1], "Skywards Miles per USD");
    add(international, "earnRates.international", international[1], "Skywards Miles per USD");
    for (const category of ["government", "transport", "utilities", "telecom", "education", "realEstate", "fuel", "groceries", "supermarkets", "insurance", "autoDealers"])
      add(reduced, `earnRates.${category}`, reduced[1], "Skywards Miles per USD");
  }
  const lounge = slug === "hsbc-cash-plus"
    ? one(productSource.text, /^Make at least [^\n]+ with your HSBC Visa card [^\n]+ to enjoy unlimited visits\.$/gm)
    : slug === "hsbc-skywards-infinite"
      ? one(productSource.text, /^Unlimited complimentary access [^\n]+$/gm)
      : one(productSource.text, /^(\d+) complimentary visits for you and additional cardholders [^\n]+ lounges a year when [^\n]+$/gm);
  if (!lounge) return null;
  const visits = slug === "hsbc-skywards-signature" ? parseSourceNumber(lounge[1]) : null;
  if (slug === "hsbc-skywards-signature" && (visits === null || !Number.isInteger(visits) || visits <= 0)) return null;
  const features = [{ type: "lounge_access" as const,
    network: productSource.text.includes("Visa Airport Companion") ? "Visa Airport Companion" : "Visa",
    scope: visits === null ? "unlimited" as const : { visits_per_year: visits },
    geo: ["global" as const], notes: lounge[0] }];
  const featureEvidence = [{ parserId: "hsbc/product-lounge-conditions/v1", productScope: product,
    unit: "lounge visits and qualifying conditions", vatTreatment: "not-applicable", ...sourceLocation(productSource, lounge) }];
  return { slug, product, network: "Visa" as const, unit, observations, yearOneWaived, salaryConfirmed, features, featureEvidence,
    salaryTransferRequired: false, residencyRequired: true,
    eligibilityScope: { noAccountRequired: noAccount[0], residence: resident[0] },
    pending: ["Welcome incentives are not included until their full current qualifying terms are reconciled.",
      ...(slug === "hsbc-cash-plus" ? ["Periodic spend-triggered bonus cashback is not included in the base rate."]
        : ["Direct-carrier earning boosts are not treated as an all-airfare rate. Reduced-sector rates apply to AED transactions."])] };
}
