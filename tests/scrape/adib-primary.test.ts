import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { ADIB_PRODUCTS, ADIB_SOC_COLUMNS, parseAdibKfs, parseAdibSchedule, parseAdibListing, parseAdibListingEconomics, parseAdibDetail, parseAdibStandingTerms, parseAdibExceedProgramme, proposeAdibProfile, proposeAdibEnrichedProfile, proposeAdibReconciledProfile, type AdibSource } from "../../scripts/scrape/_adib-primary.ts";
import { parseSourceAED, parseSourceNumber } from "../../scripts/scrape/_lib.ts";

const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
// Exact full PDF reductions and unmodified HTML blocks are compressed to avoid
// checking hundreds of kilobytes of layout whitespace into the repository.
const envelope = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-adib-primary.json", "utf8"));
const decoded = gunzipSync(Buffer.from(envelope.data, "base64"));
assert.equal(sha(decoded), envelope.decodedSha256);
assert.equal(decoded.length, envelope.decodedBytes);
const fixture = JSON.parse(decoded.toString("utf8")) as { sources: AdibSource[] };
const source = (id: string) => fixture.sources.find(s => s.id === id)!;
const soc = source("adib-soc"), kfs = source("adib-kfs");
const mutate = (s: AdibSource, text: string) => ({ ...s, text, fixtureTextSha256: sha(text), sourceTextSha256: s.representation !== "http-decoded-html-excerpt" ? sha(text) : s.sourceTextSha256 });
const profile = (slug: string) => proposeAdibProfile(source(ADIB_PRODUCTS[slug].title), soc, kfs, slug);
const detailEnvelope = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-adib-details.json", "utf8"));
const detailDecoded = gunzipSync(Buffer.from(detailEnvelope.data, "base64"));
assert.equal(sha(detailDecoded), detailEnvelope.decodedSha256);
assert.equal(detailDecoded.length, detailEnvelope.decodedBytes);
const details = JSON.parse(detailDecoded.toString("utf8")) as { sources: AdibSource[] };
const detailSource = (slug: string) => details.sources.find(s => new URL(s.url).pathname === ADIB_PRODUCTS[slug].detailPath)!;
const termsEnvelope = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-adib-terms.json", "utf8"));
const termsDecoded = gunzipSync(Buffer.from(termsEnvelope.data, "base64"));
assert.equal(sha(termsDecoded), termsEnvelope.decodedSha256);
assert.equal(termsDecoded.length, termsEnvelope.decodedBytes);
const shared = JSON.parse(termsDecoded.toString("utf8")) as { sources: AdibSource[] };
const terms = shared.sources.find(s => s.id === "adib-terms-v31")!, programme = shared.sources.find(s => s.id === "adib-exceed-programme")!;

test("ADIB exact fixtures retain original hashes, timestamps, complete text and byte coordinates", () => {
  assert.equal(fixture.sources.length, Object.keys(ADIB_PRODUCTS).length + 2);
  for (const s of fixture.sources) {
    assert.equal(sha(s.text), s.fixtureTextSha256, s.id);
    assert.match(s.sourceBodySha256, /^[a-f0-9]{64}$/);
    assert.match(s.sourceTextSha256, /^[a-f0-9]{64}$/);
    assert.match(s.capturedAt, /^2026-11-0[67]T/);
    if (s.representation === "pdftotext-layout") assert.equal(sha(s.text), s.sourceTextSha256);
  }
});

test("ADIB V46 full named schedule and bilingual KFS have agreeing fee cell cohorts", () => {
  const a = parseAdibSchedule(soc), b = parseAdibKfs(kfs);
  assert.ok(a); assert.ok(b);
  assert.equal(a.feeCells.length, ADIB_SOC_COLUMNS.length);
  assert.equal(b.feeCells.length, 18);
  assert.equal(a.vatRate, b.vatRate);
  assert.match(b.arabicDirhamEvidence.rawText, /دره/);
  for (const slug of Object.keys(ADIB_PRODUCTS)) {
    const p = profile(slug);
    assert.ok(p, slug);
    if (p.state === "held-discontinued-for-new-customers" || p.state === "held-conditional-fee") continue;
    assert.equal(p.sourceFeeExclusive, b.feeCells[ADIB_PRODUCTS[slug].kfsIndex].value, slug);
    assert.equal(p.annualFee.amount, Math.round(p.sourceFeeExclusive! * (1 + a.vatRate / 100) * 100) / 100);
    assert.equal(p.canonicalWriteEligible, false);
    assert.equal(p.minSalary, null); assert.equal(p.fxFee, null); assert.equal(p.baseEarnRate, null);
    assert.equal(p.calculatorEligible, false);
  }
});

test("ADIB exact family listing requires the matching Visa identity and observed detail/apply links", () => {
  for (const [slug, p] of Object.entries(ADIB_PRODUCTS)) {
    const s = source(p.title), parsed = parseAdibListing(s, slug);
    assert.ok(parsed, slug);
    assert.equal(parsed.network, "Visa");
    assert.equal(new URL(parsed.detailUrl).pathname, p.detailPath);
    assert.equal(parseAdibListing({ ...s, url: s.url.replace("adib.ae", "example.com") }, slug), null);
    assert.equal(parseAdibListing(mutate(s, s.text.replace(p.title, "Another Visa Card")), slug), null);
    assert.equal(parseAdibListing(mutate(s, s.text + s.text), slug), null);
  }
});

test("ADIB discontinued Exceed Platinum is held despite Apply Now, and Skywards Infinite's fee choice is held", () => {
  assert.equal(profile("adib-exceed-visa-platinum")!.state, "held-discontinued-for-new-customers");
  assert.equal(profile("adib-skywards-visa-infinite")!.state, "held-conditional-fee");
  assert.equal(profile("adib-exceed-visa")!.state, "held-fee-only-pending-economics");
  assert.equal(profile("adib-booking-visa-signature")!.state, "held-fee-only-pending-economics");
  assert.equal(profile("adib-cashback-visa")!.state, "protected-existing-field-review");
  assert.equal(ADIB_SOC_COLUMNS.filter(c => /\(23\)/.test(c)).length, 15);
});

test("ADIB source spans locate exact UTF-8 bytes, not JavaScript UTF-16 offsets", () => {
  for (const p of Object.keys(ADIB_PRODUCTS).map(profile)) {
    assert.ok(p);
    for (const e of p.evidence) {
      assert.equal(e.rawTextSha256, sha(e.rawText));
      const s = fixture.sources.find(s => s.url === e.sourceUrl && e.startByte >= s.firstByte && e.endByte <= s.firstByte + Buffer.byteLength(s.text))!;
      assert.ok(s);
      const bytes = Buffer.from(s.text).subarray(e.startByte - s.firstByte, e.endByte - s.firstByte);
      assert.equal(bytes.toString("utf8"), e.rawText);
      assert.ok((s.text.split("\n").slice(e.firstLine - s.firstLine, e.lastLine - s.firstLine + 1).join("\n") + "\n").includes(e.rawText));
    }
  }
});

test("ADIB positional table fails closed on changed/reordered/new/duplicated headers", () => {
  for (const text of [soc.text.replace("Item / Covered Card Types", "Other products"), soc.text.replace("ADIB Exceed Visa", "ADIB Wrong Visa"), soc.text + soc.text, soc.text.replace("Covered Card Annual Fee", "Covered Card Annual Fee  New Column")]) {
    assert.equal(parseAdibSchedule(mutate(soc, text)), null);
  }
  assert.equal(parseAdibKfs(mutate(kfs, kfs.text.replace("ADIB Aldar Visa", "New Card Column"))), null);
  assert.equal(parseAdibKfs(mutate(kfs, kfs.text + kfs.text)), null);
});

test("ADIB wrong units, missing VAT/currency and malformed fee cells never become zero fees", () => {
  for (const text of [soc.text.replace("5% Value Added Tax", "VAT Value Added Tax"), soc.text.replace("All of the above currencies are in ⃃", "All of the above currencies are in USD"), soc.text.replace(/(Covered Card Annual Fee +)500/, "$1,500"), soc.text.replace(/(Covered Card Annual Fee +)500/, "$1USD 500")]) {
    assert.equal(parseAdibSchedule(mutate(soc, text)), null);
  }
  for (const token of ["AED ,", "USD 99", "AED 1,19", "AED 99junk"]) assert.equal(parseSourceAED(token), null);
  assert.equal(parseSourceNumber("0"), 0);
  const s = source("SHARE Visa Infinite Card");
  assert.equal(parseAdibListing(mutate(s, s.text.replace('alt="Dirham Symbol"', 'alt="US Dollar Symbol"')), "adib-share-visa-infinite"), null);
  assert.equal(proposeAdibProfile(mutate(s, s.text.replace("/>999*", "/>998*")), soc, kfs, "adib-share-visa-infinite"), null);
});

test("ADIB marketing upper bounds and denominators are retained; SHARE local/EEA/specific categories stay separate", () => {
  for (const slug of ["adib-share-visa-infinite", "adib-share-visa-platinum"]) {
    const s = source(ADIB_PRODUCTS[slug].title), a = parseAdibListingEconomics(s, slug);
    assert.deepEqual(a.map(x => x.field), ["rewards.local", "rewards.international-excluding-eea", "rewards.eea", "rewards.specific-merchants"]);
    assert.ok(a.every(x => x.unit === "percent value back in SHARE Points" && x.bound === "exact"));
    assert.ok(a.find(x => x.field === "rewards.eea")!.value < a.find(x => x.field === "rewards.local")!.value);
    assert.equal(profile(slug)!.calculatorEligible, false);
  }
  for (const slug of ["adib-marriott-bonvoy-visa-signature", "adib-marriott-bonvoy-visa-infinite", "adib-etihad-guest-infinite", "adib-aldar-visa-infinite", "adib-aldar-visa-platinum"]) {
    const s = source(ADIB_PRODUCTS[slug].title), a = parseAdibListingEconomics(s, slug);
    assert.equal(a.length, 1, slug); assert.equal(a[0].bound, "upper");
    assert.match(a[0].evidence.rawText, /[Uu]p to/);
    if (slug.startsWith("adib-marriott")) assert.equal(a[0].denominatorCurrency, "USD");
    if (slug.startsWith("adib-etihad")) assert.equal(a[0].denominatorCurrency, "AED");
    const wrongUnit = mutate(s, s.text.replaceAll("US$1", "AED 1").replaceAll("4 AED", "4 USD").replaceAll("Darna Points", "Unknown Points"));
    assert.deepEqual(parseAdibListingEconomics(wrongUnit, slug), []);
  }
});

test("ADIB captured product details keep source salary claims separate from placeholders and missing data", () => {
  assert.equal(details.sources.length, 16);
  for (const [slug] of Object.entries(ADIB_PRODUCTS).filter(([slug]) => slug !== "adib-exceed-visa-platinum")) {
    const s = detailSource(slug), parsed = parseAdibDetail(s, slug);
    assert.ok(parsed, slug);
    assert.equal(sha(s.text), s.sourceTextSha256);
    assert.equal(parseAdibDetail({ ...s, url: s.url.replace(/adib\.(ae|com)/, "example.com") }, slug), null);
    assert.equal(parseAdibDetail(mutate(s, s.text.replaceAll(parsed.identityEvidence.rawText, "# Another Card")), slug), null);
    assert.equal(parsed.calculatorEligible, false);
    if (slug.startsWith("adib-share-")) { assert.equal(parsed.minSalary, null); assert.equal(parsed.salaryState, "issuer-placeholder-pending"); }
    else if (slug.startsWith("adib-smiles-")) { assert.ok(parsed.minSalary! > 0); assert.equal(parsed.salaryState, "source-stated"); }
    else { assert.equal(parsed.minSalary, null); assert.equal(parsed.salaryState, "not-stated-in-readable-product-detail"); }
  }
});

test("ADIB exact local earn observations retain currency denominators and exception scopes", () => {
  for (const slug of ["adib-skywards-visa-signature", "adib-skywards-visa-infinite", "adib-etihad-guest-infinite", "adib-exceed-visa", "adib-booking-visa-signature"]) {
    const parsed = parseAdibDetail(detailSource(slug), slug)!;
    const local = parsed.observations.find(o => o.field === "rewards.local");
    assert.ok(local, slug); assert.equal(local.denominatorCurrency, "AED"); assert.ok(local.denominator! > 0);
    assert.equal(local.bound, "exact");
    assert.ok(parsed.observations.find(o => o.field === "rewards.specific-category" || o.field === "rewards.specific-merchants"));
    for (const e of local.evidence) assert.equal(Buffer.from(detailSource(slug).text).subarray(e.startByte, e.endByte).toString("utf8"), e.rawText);
  }
  for (const slug of ["adib-aldar-visa-infinite", "adib-aldar-visa-platinum"]) {
    const parsed = parseAdibDetail(detailSource(slug), slug)!;
    assert.deepEqual(parsed.observations.map(o => o.field), ["rewards.aldar-malls-hospitality", "rewards.local", "rewards.international-excluding-eea", "rewards.eea", "rewards.specific-merchants"]);
    assert.ok(parsed.specificMerchantEvidence);
  }
});

test("ADIB Marriott detail preserves up-to domestic/foreign figures rather than inventing guaranteed rates", () => {
  for (const slug of ["adib-marriott-bonvoy-visa-signature", "adib-marriott-bonvoy-visa-infinite"]) {
    const parsed = parseAdibDetail(detailSource(slug), slug)!;
    assert.deepEqual(parsed.observations.map(o => o.bound), ["exact", "upper", "upper"]);
    assert.ok(parsed.observations.every(o => o.denominatorCurrency === "USD"));
    const wrongDenom = mutate(detailSource(slug), detailSource(slug).text.replaceAll("US$", "AED "));
    assert.equal(parseAdibDetail(wrongDenom, slug), null);
  }
});

test("ADIB combined proposals never promote fee-only profiles or erase unknown-base calculator limitations", () => {
  for (const slug of Object.keys(ADIB_PRODUCTS)) {
    const p = proposeAdibEnrichedProfile(source(ADIB_PRODUCTS[slug].title), soc, kfs, detailSource(slug), slug);
    assert.ok(p, slug);
    if (p.state === "held-discontinued-for-new-customers") continue;
    assert.equal(p.calculatorEligible, false);
    if (["adib-etihad-guest-gold", "adib-etihad-guest-platinum", "adib-smiles-visa-classic", "adib-smiles-visa-signature"].includes(slug)) assert.equal(p.state, "held-standing-rewards-unconfirmed");
    else if (p.state !== "held-conditional-fee" && slug !== "adib-cashback-visa") assert.equal(p.state, "qualified-partial-candidate");
  }
});

test("ADIB V31 parses named standing clauses without borrowing self-funded or legacy Etisalat rates", () => {
  for (const slug of Object.keys(ADIB_PRODUCTS).filter(s => !["adib-cashback-visa", "adib-exceed-visa-platinum"].includes(s))) {
    const p = parseAdibStandingTerms(terms, slug);
    assert.ok(p, slug); assert.ok(p.observations.length >= 4, slug);
    assert.ok(p.observations.every(o => o.bound === "exact"));
    for (const o of p.observations) for (const e of o.evidence) assert.equal(Buffer.from(terms.text).subarray(e.startByte, e.endByte).toString("utf8"), e.rawText);
  }
  assert.match(parseAdibStandingTerms(terms, "adib-etihad-guest-gold")!.cohort, /Non self-funded/);
  assert.match(parseAdibStandingTerms(terms, "adib-smiles-visa-signature")!.cohort, /not legacy Etisalat/);
  const classic = parseAdibStandingTerms(terms, "adib-smiles-visa-classic")!;
  assert.ok(classic.observations.find(o => o.field === "rewards.general-qualifying"));
  assert.ok(classic.observations.find(o => o.field === "rewards.monthly-points-cap"));
  assert.ok(parseAdibStandingTerms(terms, "adib-booking-visa-signature")!.conditions.some(e => /issued from 18 December 2023/.test(e.rawText)));
});

test("ADIB Exceed programme requires exact named row/headers and explicit AED reward valuation", () => {
  for (const slug of ["adib-exceed-visa", "adib-booking-visa-signature"]) {
    const p = parseAdibExceedProgramme(programme, slug);
    assert.ok(p, slug);
    const t = parseAdibStandingTerms(terms, slug)!;
    for (const o of p.observations) assert.equal(o.value, t.observations.find(t => t.field === o.field)!.value);
    assert.match(p.valueBackMeaning, /not cash cashback/);
    assert.equal(p.valueBackLocalPercent, p.observations[0].value * p.pointValueAED / p.denominatorAED * 100);
  }
  for (const text of [programme.text.replace("Local Spends", "Other Spends"), programme.text.replace("ADIB Exceed Visa Card\n", "Another Card\n"), programme.text + programme.text, programme.text.replace("equivalent to AED", "equivalent to USD"), programme.text.replace("0.50\n1.00", "0,50\n1.00")]) assert.equal(parseAdibExceedProgramme(mutate(programme, text), "adib-exceed-visa"), null);
});

test("ADIB final reconciliation lifts economics holds but retains fee, discontinuation, unknown salary and calculator gates", () => {
  const counts: Record<string, number> = {};
  for (const slug of Object.keys(ADIB_PRODUCTS)) {
    const p = proposeAdibReconciledProfile(source(ADIB_PRODUCTS[slug].title), soc, kfs, detailSource(slug), terms, programme, slug);
    assert.ok(p, slug); counts[p.state] = (counts[p.state] ?? 0) + 1;
    if (p.state !== "held-discontinued-for-new-customers") assert.equal(p.calculatorEligible, false);
    if (p.state === "qualified-partial-candidate") { assert.equal(p.standingRewardsConfirmed, true); assert.equal(p.canonicalWriteEligible, false); }
  }
  assert.deepEqual(counts, { "protected-existing-field-review": 1, "qualified-partial-candidate": 14, "held-discontinued-for-new-customers": 1, "held-conditional-fee": 1 });
  for (const slug of ["adib-aldar-visa-infinite", "adib-aldar-visa-platinum", "adib-share-visa-infinite", "adib-share-visa-platinum"]) assert.ok(parseAdibStandingTerms(terms, slug)!.scopeConflicts.length);
});

test("ADIB V31 fails closed on renamed/duplicated cohorts, malformed numbers, wrong units and new rate rows", () => {
  const goldHeading = "17.2.1.4 Non self-funded ADIB Etihad Guest Gold Card is:";
  const goldStart = terms.text.indexOf(goldHeading), nextStart = terms.text.indexOf("17.2.1.5", goldStart);
  const goldBlock = terms.text.slice(goldStart, nextStart);
  assert.ok(goldBlock.includes("for every AED 4"));
  const replaceGold = (block: string) => mutate(terms, terms.text.slice(0, goldStart) + block + terms.text.slice(nextStart));
  for (const block of [goldBlock.replace("Non self-funded", "Self-funded"), goldBlock.replace("for every AED 4", "for every USD 4"), goldBlock.replace("- 1.0 Etihad", "- 1,,0 Etihad"), goldBlock.replace("for every AED 4", "for every AED 0"), goldBlock + "\n- 9 Etihad Guest Miles for every AED 4 of Qualifying Expenditure within UAE\n", goldBlock + "\n" + goldHeading + "\n"]) assert.equal(parseAdibStandingTerms(replaceGold(block), "adib-etihad-guest-gold"), null);
  assert.equal(parseAdibStandingTerms(mutate(terms, terms.text + terms.text), "adib-etihad-guest-gold"), null);
  assert.equal(parseAdibStandingTerms(mutate(terms, terms.text.replace("21.2.1.4 ADIB Smiles Classic Card is:", "21.2.1.4 ADIB Etisalat Classic Card is:")), "adib-smiles-visa-classic"), null);
});

test("ADIB Aldar retains unresolved ecosystem eligibility versus international/EEA award clauses for both tiers", () => {
  const clause = uniqueAldarEligibility();
  for (const slug of ["adib-aldar-visa-infinite", "adib-aldar-visa-platinum"]) {
    const standing = parseAdibStandingTerms(terms, slug)!;
    const eligibility = standing.conditions.find(e => e.rawText === clause);
    assert.ok(eligibility, `${slug}: exact section 33.1 eligibility clause must be retained`);
    assert.equal(Buffer.from(terms.text).subarray(eligibility.startByte, eligibility.endByte).toString("utf8"), clause);
    assert.equal(eligibility.firstLine, terms.text.slice(0, terms.text.indexOf(clause)).split("\n").length);
    assert.ok(standing.scopeConflicts.some(s => /33\.1/.test(s) && /33\.2/.test(s) && /unresolved/.test(s) && /non-AED/.test(s) && /EEA/.test(s)));
    assert.ok(standing.scopeConflicts.some(s => /null base rate/.test(s) && /does not resolve/.test(s)));
    const final = proposeAdibReconciledProfile(source(ADIB_PRODUCTS[slug].title), soc, kfs, detailSource(slug), terms, programme, slug)!;
    assert.ok(final.mandatoryVisibleLimits!.some(s => /33\.1/.test(s) && /unresolved/.test(s)));
    assert.equal(final.calculatorEligible, false);
    assert.equal(parseAdibStandingTerms(mutate(terms, terms.text.replace(clause, "")), slug), null);
    assert.equal(parseAdibStandingTerms(mutate(terms, terms.text + "\n" + clause), slug), null);
  }
});

function uniqueAldarEligibility() {
  const matches = [...terms.text.matchAll(/^33\.1 Eligibility\nDarna Points may be earned by ADIB Aldar Visa Covered Card\nholders only on approved Qualifying Expenditure in the Participating\nAldar Ecosystem\./gm)];
  assert.equal(matches.length, 1);
  return matches[0][0];
}

test("ADIB Marriott contractual mapping validates every scope label rather than clause number alone", () => {
  const labels: Record<string, RegExp> = {
    "rewards.marriott-direct": /Participating\s+Hotels/,
    "rewards.international-excluding-eea": /International\s+\(outside\s+of\s+UAE\s+but\s+not\s+in\s+EEA\)\s+Spend\./,
    "rewards.local": /Domestic\s+\(UAE\)\s+Spend\./,
    "rewards.eea": /European\s+Economic\s+Area\s+\(EEA\)\s+Spend\./,
    "rewards.specific-merchants": /Specific\s+Merchants\s+Spend\./,
  };
  for (const slug of ["adib-marriott-bonvoy-visa-signature", "adib-marriott-bonvoy-visa-infinite"]) {
    const parsed = parseAdibStandingTerms(terms, slug)!;
    for (const row of parsed.observations) {
      const raw = row.evidence[0].rawText, label = labels[row.field];
      assert.ok(label.test(raw), `${slug}/${row.field}: fixture must contain the named scope`);
      const originalLabel = raw.match(label)![0];
      const replacement = row.field === "rewards.local" ? "European Economic Area (EEA) Spend." : "Domestic (UAE) Spend.";
      for (const changed of [raw.replace(label, replacement), raw.replace(label, ""), raw.replace(label, originalLabel + " " + originalLabel)]) {
        assert.equal(parseAdibStandingTerms(mutate(terms, terms.text.replace(raw, changed)), slug) === null, true, `${slug}/${row.field}: swapped/missing/duplicated semantic label`);
      }
      assert.equal(parseAdibStandingTerms(mutate(terms, terms.text.replace(raw, "")), slug), null, `${slug}/${row.field}: missing row`);
      assert.equal(parseAdibStandingTerms(mutate(terms, terms.text + "\n" + raw), slug), null, `${slug}/${row.field}: duplicate row`);
    }
  }
});
