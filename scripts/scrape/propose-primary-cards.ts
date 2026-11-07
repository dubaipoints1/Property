// Offline primary-source candidate assembly. STDOUT ONLY: no network, writes,
// dates on existing records, monitor provisioning or automatic acceptance.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseHsbcNewProduct, type BankFieldEvidence, type PrimaryCardSource } from "./_bank-parsers.ts";

const META_KEYS = ["parserId", "productScope", "unit", "vatTreatment", "sourceUrl", "capturedAt", "sourceTextSha256", "sourceBodySha256", "sourceRepresentation", "captureMethod", "sourceSnapshotSha256", "sourceScope", "firstLine", "lastLine", "rawText", "rawTextSha256"] as const;
const evidenceMeta = (e: BankFieldEvidence) => Object.fromEntries(META_KEYS.map(key => [key, e[key]]));

/** Omitted joining/waiver fields are unknown, never an accepted zero or a
 * guaranteed first-year charge. Preserve separately approved editor typing. */
export function applyHsbcOmittedCostHolds<T extends { _provenance: Record<string, string>; _dataIssues?: Record<string, string> }>(slug: string, before: T): T {
  if (!["hsbc-cash-plus", "hsbc-skywards-infinite", "hsbc-skywards-signature"].includes(slug)) throw new Error("Outside reviewed new HSBC cohort");
  const record = structuredClone(before);
  record._provenance.joiningFee = "needs-review";
  const waiverAccepted = ["editor-confirmed", "editor-corrected", "editor-confirmed-null"].includes(record._provenance.annualFeeWaiver);
  if (!waiverAccepted) record._provenance.annualFeeWaiver = "needs-review";
  record._dataIssues = { ...record._dataIssues, annualFee: waiverAccepted
    ? "The approved introductory annual-fee waiver does not establish that any independent joining charge is zero. Joining charges remain Pending; no first-year total is estimated. Standard renewal illustrations use the known standard fee, not an assumed ongoing waiver."
    : "The displayed annual fee is the standard primary charge. Joining charges and fee-waiver conditions have not been reconciled; omitted fields do not mean zero or no waiver. No first-year total is estimated. Standard renewal illustrations use the known standard fee, not an assumed ongoing waiver." };
  return record;
}

export function proposeHsbcPrimaryCards(kfs: PrimaryCardSource, products: Array<PrimaryCardSource & { id: string }>, reviewedOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn)) throw new Error("Explicit editorial review date required");
  const proposals: Array<{ slug: string; record: any; editorialTypingProposal: Record<string, unknown>; scope: string }> = [];
  const holds: Array<{ slug: string; reason: string }> = [];
  for (const product of products) {
    const parsed = parseHsbcNewProduct(product, kfs, product.id);
    if (!parsed) {
      holds.push({ slug: product.id, reason: "Core product/KFS evidence is incomplete, conditional or contradictory; no default record created." });
      continue;
    }
    const value = (field: string) => {
      const hits = parsed.observations.filter(e => e.field === field);
      if (hits.length !== 1) throw new Error(`Non-unique required field ${parsed.slug}.${field}`);
      return hits[0].value;
    };
    const earnRates = Object.fromEntries(parsed.observations.filter(e => e.field.startsWith("earnRates.")).map(e => [e.field.slice("earnRates.".length), e.value]));
    if (typeof earnRates.everythingElse !== "number") throw new Error("No source-backed base rate");
    const evidence: Record<string, unknown[]> = {};
    for (const e of parsed.observations) {
      const group = e.field.split(".")[0];
      const item = evidenceMeta(e), items = evidence[group] ??= [];
      if (!items.some(existing => JSON.stringify(existing) === JSON.stringify(item))) items.push(item);
    }
    // Generated records begin as parser observations, not fabricated human
    // approval. Council review confirms the core provenance before release.
    const provenance = Object.fromEntries(["bank", "name", "network", "categories", "annualFee", "fxFee", "earnRates", "earnUnit", "eligibility", "applyUrl", "kfsUrl", "sources"].map(k => [k, "scraped"]));
    provenance.welcomeBonus = "needs-review";
    provenance.partnerBrands = "needs-review";
    provenance._features = "needs-review";
    provenance["eligibility.employmentTypes"] = "needs-review";
    evidence._features = parsed.featureEvidence;
    const record: any = {
      _provenance: provenance, _lastScraped: null, _lastReviewed: reviewedOn,
      bank: "hsbc", name: parsed.product, network: parsed.network,
      categories: parsed.slug === "hsbc-cash-plus" ? ["cashback"] : ["travel", "co-brand"],
      annualFee: { amount: value("annualFee.amount"), currency: "AED" },
      fxFee: value("fxFee"), fxFeeScope: "issuer-processing-only",
      loyaltyProgram: parsed.slug === "hsbc-cash-plus" ? "HSBC Cashback" : "Emirates Skywards",
      earnRates, earnUnit: parsed.unit,
      eligibility: { minSalary: parsed.salaryConfirmed ? value("eligibility.minSalary") : null, salaryTransferRequired: parsed.salaryTransferRequired,
        residencyRequired: parsed.residencyRequired, employmentTypes: [],
        minAge: value("eligibility.minAge"), maxAge: value("eligibility.maxAge") },
      perks: ["Issuer foreign-currency processing fee is VAT-inclusive; separate scheme charges may also apply.", ...parsed.pending],
      _features: [], transferPartners: [], applyUrl: product.url, kfsUrl: kfs.url,
      // Oldest actual capture in this evidence set, never today's date by default.
      lastVerified: [product.capturedAt, kfs.capturedAt].map(d => d.slice(0, 10)).sort()[0],
      sources: [product.url, kfs.url], refreshMode: "manual-primary", vatPolicy: "inclusive", _fieldEvidence: evidence,
      _dataIssues: { welcomeBonus: parsed.pending[0], earnRates: parsed.pending[1],
        employmentTypes: "The captured documents do not establish an exclusive employment-type restriction. Employment eligibility remains Pending; an empty list does not mean any employment is accepted.",
        _features: "Perk mappings are separate editorial-typing proposals, not parser-approved canonical features.",
        interestRate: "The issuer publishes APR. No monthly rate is inferred or supplied to the payoff calculator." },
    };
    const editorialTypingProposal: Record<string, unknown> = { _features: parsed.features };
    if (parsed.yearOneWaived) {
      editorialTypingProposal.annualFeeWaiver = { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual",
        notes: "Introductory waiver confirmed by product page. Ongoing fee-waiver conditions have not been typed; check current issuer terms." };
      record._provenance.annualFeeWaiver = "needs-review";
    }
    if (parsed.slug === "hsbc-cash-plus") {
      record._provenance["earnRates._caps"] = "needs-review";
      record._dataIssues.earnRates = "Cashback-eligible purchases are limited by the assigned credit-card limit. That unknown cap is not invented or modelled, so no total-return example is calculated. Periodic spend-triggered bonus cashback is also excluded from the base rate.";
    }
    if (!parsed.salaryConfirmed) {
      record._provenance.eligibility = "needs-review";
      record._dataIssues.eligibility = "The product's income requirement depends on approved-employer status. No universal salary qualification is confirmed, so the salary field is Pending and this profile is excluded from salary-qualified recommendations.";
    }
    proposals.push({ slug: parsed.slug, record: applyHsbcOmittedCostHolds(parsed.slug, record), editorialTypingProposal, scope: "Standing core fields only; typed features and fee waivers require separate deliberate editorial acceptance. Welcome incentives, conditional bonuses and unmapped direct-carrier boosts excluded." });
  }
  return { state: "candidate-not-accepted-or-published", proposals, holds };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sources = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-primary-card-fields.json", "utf8")).sources;
  const products = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-hsbc-new-products.json", "utf8")).sources;
  const kfs = sources.find((s: any) => s.id === "hsbc-card-kfs");
  process.stdout.write(JSON.stringify(proposeHsbcPrimaryCards(kfs, products, process.argv[2] ?? ""), null, 2) + "\n");
}
