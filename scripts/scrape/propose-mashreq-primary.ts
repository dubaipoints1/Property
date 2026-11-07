// Pure candidate mapping. Source parsers, explicit issuer-only FX qualifiers
// and display-only native reward rows; stdout only, never automatic acceptance.
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { parseMashreqPrimaryCore } from "./_mashreq-primary.ts";
import type { PrimaryCardSource } from "./_bank-parsers.ts";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const MASHREQ_SOURCE_FIXTURE = "tests/scrape/fixtures/2026-11-mashreq-primary.json";
export const MASHREQ_NEW_SLUGS = ["mashreq-aura", "mashreq-aura-world", "mashreq-aura-world-elite", "mashreq-solitaire", "mashreq-platinum-plus"];
export function loadMashreqMappingSources(): PrimaryCardSource[] {
  return JSON.parse(readFileSync(MASHREQ_SOURCE_FIXTURE, "utf8")).sources.map((source: { textDeflateBase64: string; fixtureTextSha256: string }) => {
    const text = inflateSync(Buffer.from(source.textDeflateBase64, "base64"), { maxOutputLength: 2_000_000 }).toString("utf8");
    if (sha(text) !== source.fixtureTextSha256) throw new Error("Source fixture identity mismatch");
    return { ...source, text };
  });
}
const LABELS: Record<string, string> = { dining: "Qualifying dining", groceries: "Qualifying grocery spend", fuel: "Qualifying fuel spend", international: "Qualifying international spend", airfare: "Qualifying airfare", hotels: "Qualifying hotel spend", travel: "Other qualifying travel spend", everythingElse: "Other qualifying local spend", government: "Government payments", utilities: "Utilities", education: "Education", charity: "Charity", realEstate: "Rental expenditure", telecom: "Telecom" };
export function parseMashreqCanonicalCandidates(sources: PrimaryCardSource[], reviewedOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn)) throw new Error("Explicit bounded review date required");
  const source = (id: string) => { const found = sources.filter(s => s.id === id); if (found.length !== 1) throw new Error("Missing/ambiguous fixture " + id); return found[0]; };
  const kfs = source("mashreq-card-kfs");
  return { state: "candidate-records-not-accepted-inserted-or-published", proposals: MASHREQ_NEW_SLUGS.map(slug => {
    const product = source(slug + "-product"), core = parseMashreqPrimaryCore(product, kfs, slug);
    if (!core) throw new Error("Required source core failed " + slug);
    const aura = slug.startsWith("mashreq-aura");
    if ((!aura && !core.spendDenominator) || (aura && core.spendDenominator !== null)) throw new Error("Unsupported source denominator " + slug);
    const fieldEvidence: Record<string, unknown[]> = {};
    for (const field of ["annualFee.amount", "fxFee", "eligibility.minSalary"]) {
      const observations = core.observations.filter(o => o.field === field);
      if (observations.length) fieldEvidence[field === "annualFee.amount" ? "annualFee" : field] = observations;
    }
    const rows = core.observations.filter(o => o.field.startsWith("earnRates.")).map(o => {
      const key = o.field.slice("earnRates.".length), label = LABELS[key];
      if (!label) throw new Error("Unmapped source category " + key);
      fieldEvidence[`scopedEarnRates.${key.toLowerCase()}`] = [o];
      return { key: key.toLowerCase(), label, value: o.value,
        unit: aura ? "percent value back paid as Aura Points" : "Mashreq Vantage points",
        denominator: core.spendDenominator,
        scope: aura
          ? "Eligible purchase transactions within the assigned credit-card limit per statement cycle. Aura Points are not earned on bill payments through Mashreq Mobile App or Online Banking; a reduced sector rate does not override this channel exclusion. Brand upper bounds are not included in this row."
          : "The named product's qualifying purchase category only. Programme exclusions, merchant coding and redemption conditions apply. No cash conversion or universal all-spend reward estimate is asserted.",
        bound: "exact" };
    });
    if (core.creditLimitCondition) fieldEvidence.earnRateConditions = [{ ...core.creditLimitCondition,
      sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader", productScope: core.name, unit: "textual assigned-credit-limit condition", vatTreatment: "not-applicable" }];
    if (core.channelExclusion) (fieldEvidence.earnRateConditions ??= []).push({ ...core.channelExclusion,
      sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader", productScope: core.name, unit: "textual payment-channel exclusion", vatTreatment: "not-applicable" });
    const provenance = Object.fromEntries(["bank", "name", "categories", "annualFee", "fxFee", "fxFeeScope", "fxFeeVatTreatment", "loyaltyProgram", "earnUnit", "scopedEarnRates", "applyUrl", "kfsUrl", "sources"].map(field => [field, "scraped"]));
    // Network is the deliberately reviewed named KFS artwork/identity mapping,
    // not permission to reuse card art or an unreviewed scraper inference.
    provenance.network = "editor-confirmed";
    for (const field of ["eligibility", "eligibility.salaryTransferRequired", "eligibility.residencyRequired", "eligibility.employmentTypes", "earnRates.everythingElse", "joiningFee", "annualFeeWaiver", "interestRate", "welcomeBonus", "_features"]) provenance[field] = "needs-review";
    const dates = core.observations.map(o => o.capturedAt.slice(0, 10)).sort();
    const record = { _provenance: provenance, _lastScraped: null, _lastReviewed: reviewedOn,
      bank: "mashreq", name: core.name, network: aura ? "Mastercard" : "Visa", categories: ["lifestyle"],
      annualFee: { amount: core.annualFee, currency: "AED" }, vatPolicy: "inclusive",
      fxFee: core.fxFee, fxFeeScope: core.fxFeeScope, fxFeeVatTreatment: core.fxFeeVatTreatment,
      loyaltyProgram: aura ? "Aura Points" : "Mashreq Vantage", earnUnit: "Source-qualified rewards — see each row's unit and denominator",
      earnRates: { everythingElse: null }, scopedEarnRates: rows,
      eligibility: { minSalary: core.minSalary, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] },
      perks: [], _features: [], transferPartners: [], applyUrl: product.url, kfsUrl: kfs.url,
      lastVerified: dates[0], sources: [product.url, kfs.url], refreshMode: "manual-primary", _fieldEvidence: fieldEvidence,
      _dataIssues: { eligibility: "Any source-stated income is retained only in the source record. Full transfer, residency and employment conditions remain Pending; empty employment is unknown, not any employment.",
        annualFee: "The fee is the standard primary annual fee. Joining charges, waivers and interest terms remain unreconciled; no first-year or total annual cost is estimated.",
        fxFee: "The FX figure is the issuer spread only. The KFS marks VAT not applicable to that spread and says Visa/Mastercard charges apply additionally. It is not an all-in conversion cost.",
        earnRates: ["These named qualifying rows are display-only. No universal base, cash redemption value, all-spend ranking or total return is estimated.", ...core.pending].join(" "),
        _features: "Welcome incentives and perks have not been reconciled or editor-typed. An empty feature set is not a claim that the card has no benefits." },
    };
    return { slug, record, classification: "source-qualified partial; not salary-qualified or calculator-eligible", sourceCore: core };
  }) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const packet = parseMashreqCanonicalCandidates(loadMashreqMappingSources(), process.argv[2] ?? "");
  const slug = process.argv.find(arg => arg.startsWith("--slug="))?.slice("--slug=".length);
  if (slug && !packet.proposals.some(p => p.slug === slug)) throw new Error("Unknown proposal slug");
  const output = slug ? packet.proposals.find(p => p.slug === slug) : process.argv.includes("--index")
    ? { ...packet, proposals: packet.proposals.map(p => ({ slug: p.slug, classification: p.classification, record: { ...p.record, _fieldEvidence: undefined }, evidenceFields: Object.keys(p.record._fieldEvidence), coreObservationCount: p.sourceCore.observations.length })) } : packet;
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}
