// Reproducible ADIB canonical-mapping candidates. STDOUT ONLY. A parser
// observation is not editor approval, automatic insertion or activation.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { ADIB_PRODUCTS, proposeAdibReconciledProfile, type AdibSource, type AdibSpan } from "./_adib-primary.ts";

const hash = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
export const ADIB_SOURCE_FIXTURES = ["tests/scrape/fixtures/2026-11-adib-primary.json", "tests/scrape/fixtures/2026-11-adib-details.json", "tests/scrape/fixtures/2026-11-adib-terms.json"];
export function loadAdibMappingSources(): AdibSource[] {
  return ADIB_SOURCE_FIXTURES.flatMap(file => {
    const envelope = JSON.parse(readFileSync(file, "utf8"));
    if (!Number.isSafeInteger(envelope.decodedBytes) || envelope.decodedBytes <= 0 || envelope.decodedBytes > 8_000_000) throw new Error("Unexpected source fixture length");
    const decoded = gunzipSync(Buffer.from(envelope.data, "base64"), { maxOutputLength: envelope.decodedBytes });
    if (decoded.length !== envelope.decodedBytes || hash(decoded) !== envelope.decodedSha256) throw new Error("Source fixture identity mismatch");
    const payload = JSON.parse(decoded.toString("utf8")) as { sources: AdibSource[] };
    for (const source of payload.sources) if (hash(source.text) !== source.fixtureTextSha256) throw new Error("Source text identity mismatch");
    return payload.sources;
  });
}
const LABELS: Record<string, string> = {
  "local": "Qualifying UAE spend", "general-qualifying": "Standard qualifying expenditure",
  "international-excluding-eea": "International spend excluding the EEA", "eea": "EEA spending",
  "specific-merchants": "Issuer-defined specific merchants", "smiles-app": "Qualifying Smiles app spend",
  "participating-ecosystem": "Participating SHARE ecosystem", "marriott-direct": "Direct Marriott Bonvoy hotel spend",
  "aldar-malls-hospitality": "Aldar Malls and Aldar Hospitality", "aldar-education-properties": "Aldar Education and Aldar Properties",
  "airlines": "Qualifying airline expenditure",
};
function evidence(span: AdibSpan, context: { parserId: string; productScope: string; unit: string; vatTreatment: string }) {
  return { ...context, sourceUrl: span.sourceUrl, capturedAt: span.capturedAt,
    sourceTextSha256: span.sourceTextSha256, sourceBodySha256: span.sourceBodySha256,
    sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader",
    sourceExtraction: span.representation, sourceStartByte: span.startByte, sourceEndByte: span.endByte,
    firstLine: span.firstLine, lastLine: span.lastLine, rawText: span.rawText, rawTextSha256: span.rawTextSha256 };
}
const distinct = <T>(items: T[]) => items.filter((item, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index);

export function proposeAdibCanonicalMappings(sources: AdibSource[], reviewedOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn)) throw new Error("Explicit review date required");
  const source = (id: string) => { const found = sources.filter(s => s.id === id); if (found.length !== 1) throw new Error("Missing/ambiguous source " + id); return found[0]; };
  const soc = source("adib-soc"), kfs = source("adib-kfs"), terms = source("adib-terms-v31"), programme = source("adib-exceed-programme");
  const proposals: Array<{ slug: string; record: Record<string, unknown>; sourceState: string; classification: string }> = [];
  const holds: Array<{ slug: string; state: string; reason: string }> = [];
  for (const [slug, config] of Object.entries(ADIB_PRODUCTS)) {
    const detailCandidates = sources.filter(s => s.representation === "http-decoded-readable-text" && new URL(s.url).pathname === config.detailPath);
    if (detailCandidates.length > 1) throw new Error("Ambiguous detail " + slug);
    const profile = proposeAdibReconciledProfile(source(config.title), soc, kfs, detailCandidates[0], terms, programme, slug);
    if (!profile) { holds.push({ slug, state: "source-parser-hold", reason: "Required identity/fee/economics source did not parse uniquely" }); continue; }
    if (profile.state !== "qualified-partial-candidate" || !("standingTerms" in profile) || !profile.standingTerms) {
      holds.push({ slug, state: profile.state, reason: "Protected existing record, discontinued cohort or conditional annual-fee choice is not a new active profile" }); continue;
    }
    const standing = profile.standingTerms;
    // Use the actually captured detail URL, not a catalogue host assumption.
    // Booking's observed public detail redirects from .ae to .com.
    const productUrl = detailCandidates[0]?.url;
    if (!productUrl || new URL(productUrl).protocol !== "https:") throw new Error("Missing captured HTTPS product detail " + slug);
    const fieldEvidence: Record<string, unknown[]> = {};
    const feeContext = { parserId: profile.parserId, productScope: profile.name, unit: "AED primary annual fee derived with source-stated VAT", vatTreatment: "inclusive" };
    fieldEvidence.annualFee = distinct(profile.evidence.map(span => evidence(span, feeContext)));
    const conditions = [...standing.conditions, ...("exceedProgramme" in profile && profile.exceedProgramme ? profile.exceedProgramme.conditions : [])];
    fieldEvidence.earnRateConditions = distinct(conditions.map(span => evidence(span, { parserId: "adib/v31-qualifying-conditions/v1", productScope: profile.name, unit: "textual qualifying conditions", vatTreatment: "not-applicable" })));
    const limits: string[] = [];
    const rows = standing.observations.flatMap(observation => {
      const key = observation.field.replace(/^rewards\./, "").replace(/\./g, "-");
      if (observation.denominator === undefined && !observation.unit.startsWith("percent ")) {
        limits.push(`${key.replace(/-/g, " ")}: ${observation.value.toLocaleString("en-GB")} ${observation.unit}.`);
        fieldEvidence[`rewardLimits.${key}`] = distinct(observation.evidence.map(span => evidence(span, { parserId: observation.parserId, productScope: profile.name, unit: observation.unit, vatTreatment: "not-applicable" })));
        return [];
      }
      let label = key === "carrier" ? profile.programme === "Etihad Guest" ? "Direct Etihad Airways spend" : "Emirates and flydubai direct sales channels" : LABELS[key];
      if (!label) throw new Error("Unmapped contractual scope " + slug + "." + key);
      const denominator = observation.denominator === undefined ? null : { amount: observation.denominator, currency: observation.denominatorCurrency };
      if (denominator && (!Number.isFinite(denominator.amount) || denominator.amount <= 0 || !["AED", "USD"].includes(denominator.currency ?? ""))) throw new Error("Invalid denominator");
      fieldEvidence[`scopedEarnRates.${key}`] = distinct(observation.evidence.map(span => evidence(span, { parserId: observation.parserId, productScope: profile.name,
        unit: denominator ? `${observation.unit} per ${denominator.currency} ${denominator.amount}` : observation.unit, vatTreatment: "not-applicable" })));
      const clause = observation.evidence[0].rawText.replace(/\s+/g, " ");
      let clauseQualification = "";
      if (["international-excluding-eea", "eea"].includes(key) && !/adib-(?:marriott|share)-/.test(slug)) {
        if (!/non-\s*AED/.test(clause) || !/outside\s+UAE/.test(clause)) throw new Error("Non-AED/outside-UAE contractual scope missing: " + slug + "." + key);
        label = key === "eea" ? "Non-AED qualifying spend outside the UAE in the EEA" : "Non-AED qualifying spend outside the UAE, excluding the EEA";
        clauseQualification = " Only non-AED Qualifying Expenditure outside the UAE in the named geography qualifies for this row.";
      }
      if (key === "marriott-direct") {
        if (!/charged directly with Participating Hotels/.test(clause) || !/standalone Marriott branded retail establishments/.test(clause)
          || !/Marriott branded online stores/.test(clause) || !/Marriott branded gift cards/.test(clause)
          || !/wholly owned or managed by Marriott International/.test(clause)) throw new Error("Participating/owned Marriott outlet scope missing");
        label = "Participating Marriott hotels and qualifying Marriott outlets";
        clauseQualification = " Direct charges at Participating Hotels, standalone Marriott-branded retail establishments and Marriott-branded online stores (including Marriott-branded gift cards), in each case wholly owned or managed by Marriott International or its affiliates. Third-party bookings and independent branded outlets are not asserted eligible.";
      }
      const scope = `${standing.cohort}. Qualifying expenditure only; issuer merchant, EEA, card-limit and payment-status conditions apply.`
        + clauseQualification
        + (key === "aldar-education-properties" ? " This is the named Aldar Education/Properties row, not all UAE spending." : "")
        + (standing.scopeConflicts.length ? " Ecosystem/award scope is unresolved; see the source-conditions note." : "")
        + (key === "airlines" ? " Per-transaction and statement-cycle native-point caps apply; see the source-conditions note." : "");
      return [{ key, label, value: observation.value, unit: observation.unit, denominator, scope, bound: observation.bound }];
    });
    if (rows.length < 2 || new Set(rows.map(row => row.key)).size !== rows.length) throw new Error("Insufficient/ambiguous source-qualified economics " + slug);
    const salaryEvidence = profile.detail.observations.filter(o => o.field === "eligibility.minSalary");
    if (profile.minSalary !== null && salaryEvidence.length !== 1) throw new Error("Salary has no unique product evidence");
    if (salaryEvidence.length) fieldEvidence.eligibility = salaryEvidence.flatMap(o => o.evidence.map(span => evidence(span, { parserId: o.parserId, productScope: profile.name, unit: o.unit, vatTreatment: "not-applicable" })));
    const issuerConditions = profile.mandatoryVisibleLimits.filter(line => !line.startsWith("Minimum salary is Pending"));
    const rewardNote = ["These are named source-qualified rows, not a universal earn rate or guaranteed total return.", ...issuerConditions, ...limits].join(" ");
    const provenance = Object.fromEntries(["bank", "name", "network", "categories", "annualFee", "loyaltyProgram", "earnUnit", "applyUrl", "kfsUrl", "sources", "scopedEarnRates"].map(k => [k, "scraped"]));
    for (const field of ["fxFee", "joiningFee", "annualFeeWaiver", "interestRate", "eligibility", "eligibility.salaryTransferRequired", "eligibility.residencyRequired", "eligibility.employmentTypes", "earnRates.everythingElse", "_features", "welcomeBonus", "partnerBrands"]) provenance[field] = "needs-review";
    const evidenceSpans = Object.values(fieldEvidence).flat() as Array<{ capturedAt: string; sourceUrl: string }>;
    const dates = evidenceSpans.map(s => s.capturedAt.slice(0, 10)).sort();
    const record = { _provenance: provenance, _lastScraped: null, _lastReviewed: reviewedOn,
      bank: "adib", name: profile.name, network: profile.network,
      categories: ["Islamic", ...(/etihad|skywards|marriott|booking/.test(slug) ? ["travel", "co-brand"] : /share|smiles|aldar/.test(slug) ? ["shopping", "co-brand"] : ["lifestyle"])],
      annualFee: { amount: profile.annualFee.amount, currency: profile.annualFee.currency }, vatPolicy: "inclusive",
      fxFee: null, loyaltyProgram: profile.programme,
      earnRates: { everythingElse: null }, earnUnit: "Source-qualified rewards — see each row's unit and denominator", scopedEarnRates: rows,
      eligibility: { minSalary: profile.minSalary, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] },
      perks: [], _features: [], transferPartners: [], applyUrl: productUrl, kfsUrl: kfs.url,
      lastVerified: dates[0], sources: [...new Set([productUrl, ...evidenceSpans.map(s => s.sourceUrl)])], refreshMode: "manual-primary",
      _fieldEvidence: fieldEvidence, _dataIssues: {
        eligibility: profile.salaryState === "issuer-placeholder-pending" ? "The issuer detail has an unfilled salary placeholder. Salary and full qualification conditions remain Pending; an application link is not an approval promise."
          : "Only a source-stated income amount is retained where available. Full salary-transfer, residency and employment qualification conditions remain Pending; empty employment is unknown, not any employment.",
        fxFee: "Issuer service fees, VAT and scheme/international components have not been reconciled into an exact comparable FX charge. Pending does not mean free.",
        annualFee: "The displayed figure is the standard primary annual fee. Joining charges, fee waivers and profit charges have not been reconciled; no first-year or total annual cost is estimated.",
        earnRates: rewardNote,
        _features: "This source review covers identity, standard annual fee and scoped rewards. Perks and welcome incentives have not been editor-typed or valued.",
      },
    };
    proposals.push({ slug, record, sourceState: profile.sourceBasis, classification: "new current named product; qualified partial source profile, not salary-qualified or calculator-eligible" });
  }
  return { state: "candidate-record-mapping-not-accepted-inserted-or-published", proposals, holds };
}

/** Manual-registry entry point. It returns candidates only, never writes or
 * supplies editorial acceptance. The complete source chain is pinned. */
export function parseAdibCanonicalCandidates(sources: AdibSource[], reviewedOn: string) {
  return proposeAdibCanonicalMappings(sources, reviewedOn);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const packet = parseAdibCanonicalCandidates(loadAdibMappingSources(), process.argv[2] ?? "");
  const slug = process.argv.find(arg => arg.startsWith("--slug="))?.slice("--slug=".length);
  if (slug && !packet.proposals.some(p => p.slug === slug)) throw new Error("Unknown/held proposal slug");
  const out = slug ? packet.proposals.find(p => p.slug === slug) : process.argv.includes("--index")
    ? { ...packet, proposals: packet.proposals.map(p => ({ ...p, record: { ...p.record, _fieldEvidence: undefined },
      fullRecordFile: `${p.slug}.json`, evidenceFields: Object.keys(p.record._fieldEvidence as Record<string, unknown>) })) }
    : packet;
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}
