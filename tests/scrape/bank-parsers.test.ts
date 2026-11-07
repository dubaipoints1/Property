import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceAED, parseSourceNumber } from "../../scripts/scrape/_lib.ts";
import { parseScPlatinumXProduct, parseHsbcCardKfs, parseHsbcLivePlusIncomeClaims, parseHsbcNewProduct, type PrimaryCardSource } from "../../scripts/scrape/_bank-parsers.ts";
import { proposeHsbcPrimaryCards } from "../../scripts/scrape/propose-primary-cards.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";
import type { CardData } from "../../src/lib/cardsData.ts";

const fixturePath = "tests/scrape/fixtures/2026-11-primary-card-fields.json";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const source = (id: string): PrimaryCardSource => fixture.sources.find((s: any) => s.id === id);
const mutate = (s: PrimaryCardSource, text: string) => ({ ...s, text, fixtureTextSha256: sha(text) });
const sc = source("sc-platinum-x-product");
const hsbc = source("hsbc-card-kfs");

test("strict source numbers reject malformed or partial tokens rather than default to zero", () => {
  for (const bad of ["", ",", "1,", ",100", "12,34", "1,,000", "1e3", "-1", "NaN", "Infinity", "1.2.3", "12.4%", " 12 "])
    assert.equal(parseSourceNumber(bad), null, bad);
  for (const bad of ["AED ,", "AED 12,34", "USD 123", "AED 12xyz", "AED", "123"])
    assert.equal(parseSourceAED(bad), null, bad);
  assert.equal(parseSourceNumber("1,234.50"), Number("1234.50"));
  assert.equal(parseSourceNumber("0"), Number("0"));
});

test("source fixtures retain exact content identities and original provenance", () => {
  for (const s of fixture.sources) {
    assert.equal(sha(s.text), s.fixtureTextSha256, s.id);
    assert.match(s.sourceTextSha256, /^[a-f0-9]{64}$/);
    assert.match(s.sourceBodySha256, /^[a-f0-9]{64}$/);
    assert.match(s.capturedAt, /^2026-11-06T/);
    assert.equal(s.firstLine, 1);
  }
});

test("SC monthly charge is scoped to the named product's retail fee block", () => {
  const parsed = parseScPlatinumXProduct(sc);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].field, "interestRate.monthly");
  assert.equal(parsed[0].unit, "percent per month");
  assert.equal(parsed[0].value, Number(parsed[0].rawText.match(/Retail: ([\d.]+)% per month/)![1]));
  assert.equal(parsed[0].rawTextSha256, sha(parsed[0].rawText));
  assert.equal(parsed[0].firstLine, sc.text.split("\n").findIndex(l => l === "Finance charges") + 1);
  assert.deepEqual(parseScPlatinumXProduct({ ...sc, url: sc.url.replace("www.sc.com", "example.com") }), []);
  assert.deepEqual(parseScPlatinumXProduct(mutate(sc, sc.text.replace("# Platinum X", "# Another card"))), []);
  assert.deepEqual(parseScPlatinumXProduct(mutate(sc, sc.text + sc.text)), []);
  assert.deepEqual(parseScPlatinumXProduct(mutate(sc, sc.text.replace(/Retail: [\d.]+% per month/, "Retail: unknown"))), []);
});

test("HSBC named product blocks do not take another card's fee or salary", () => {
  const products = ["hsbc-live-plus", "hsbc-cash-plus", "hsbc-skywards-infinite", "hsbc-skywards-signature"];
  for (const slug of products) {
    const parsed = parseHsbcCardKfs(hsbc, slug);
    assert.deepEqual(parsed.map(p => p.field), ["annualFee.amount", "eligibility.minSalary", "fxFee", "interestRate.annual"]);
    const annual = parsed.find(p => p.field === "annualFee.amount")!;
    assert.equal(annual.vatTreatment, "inclusive");
    assert.equal(annual.value, parseSourceAED(annual.rawText.match(new RegExp(`AED[ \\t]+${SOURCE_NUMBER}`))![0]));
    assert.equal(parsed.find(p => p.field === "interestRate.annual")!.unit, "percent APR");
    assert.equal(parsed.find(p => p.field === "fxFee")!.vatTreatment, "inclusive");
    for (const p of parsed) {
      const lines = hsbc.text.split("\n").slice(p.firstLine - hsbc.firstLine, p.lastLine - hsbc.firstLine + 1).join("\n");
      assert.ok(lines.includes(p.rawText));
      assert.equal(p.rawTextSha256, sha(p.rawText));
    }
  }
  assert.deepEqual(parseHsbcCardKfs(hsbc, "hsbc-premier"), []);
  assert.deepEqual(parseHsbcCardKfs(mutate(hsbc, hsbc.text + "\n HSBC Live+ Credit Card\n"), "hsbc-live-plus"), []);
  const liveFee = parseHsbcCardKfs(hsbc, "hsbc-live-plus").find(p => p.field === "annualFee.amount")!.rawText;
  const malformed = mutate(hsbc, hsbc.text.replace(liveFee, " Annual Fee - AED , including VAT."));
  assert.equal(parseHsbcCardKfs(malformed, "hsbc-live-plus").find(p => p.field === "annualFee.amount"), undefined);
});

test("HSBC income branches are not emitted as a confirmed scalar salary", () => {
  const s = source("hsbc-live-plus-product");
  const claims = parseHsbcLivePlusIncomeClaims(s)!;
  assert.equal(claims.canonicalWriteEligible, false);
  assert.equal(claims.semantic, "income-not-universal-salary");
  assert.equal(claims.requiresCurrencyCorroboration, true);
  assert.equal(claims.evidence!.unit, "unresolved currency glyph");
  assert.equal(new Set(claims.branches.map(b => b.amount)).size, claims.branches.length);
  assert.equal(parseHsbcLivePlusIncomeClaims(mutate(s, s.text.replaceAll("⃃", "$"))), null);
});

test("new HSBC standing fields require full core evidence and product/KFS income agreement", () => {
  const products = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-hsbc-new-products.json", "utf8")).sources;
  for (const slug of ["hsbc-cash-plus", "hsbc-skywards-infinite"]) {
    const product = products.find((p: any) => p.id === slug);
    const parsed = parseHsbcNewProduct(product, hsbc, slug)!;
    assert.ok(parsed, slug);
    assert.ok(parsed.observations.some(p => p.field === "earnRates.everythingElse"));
    assert.ok(parsed.observations.some(p => p.field === "eligibility.minAge"));
    assert.ok(parsed.observations.some(p => p.field === "eligibility.maxAge"));
    assert.equal(parsed.residencyRequired, true);
    assert.equal(parsed.salaryTransferRequired, false);
    assert.equal(parsed.network, "Visa");
    assert.equal(parsed.observations.filter(p => p.field.startsWith("welcomeBonus")).length, 0);
    assert.equal(parsed.observations.filter(p => p.field === "earnRates.airfare").length, 0);
    const changed = mutate(product, product.text.replace(/^- [Ee]arn at least AED [\d,]+ a month$/m, "- Earn at least AED , a month"));
    assert.equal(parseHsbcNewProduct(changed, hsbc, slug), null);
  }
  // The approved-employer/other-applicant branches are represented as
  // Pending salary, not coerced into a universal scalar or zero.
  const conditional = products.find((p: any) => p.id === "hsbc-skywards-signature");
  assert.equal(parseHsbcNewProduct(conditional, hsbc, conditional.id)!.salaryConfirmed, false);
  const pending = proposeHsbcPrimaryCards(hsbc, products, "2026-11-07").proposals.find(p => p.slug === conditional.id)!.record;
  assert.equal(pending.eligibility.minSalary, null);
  assert.equal(pending._provenance.eligibility, "needs-review");
});

test("Cash+ unknown credit-limit cap blocks total-return examples without inventing a numeric cap", () => {
  const products = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-hsbc-new-products.json", "utf8")).sources;
  const proposed = proposeHsbcPrimaryCards(hsbc, products, "2026-11-07");
  const cash = proposed.proposals.find(p => p.slug === "hsbc-cash-plus")!.record as CardData;
  assert.equal(cash._provenance["earnRates._caps"], "needs-review");
  assert.equal(cash.earnRates._caps, undefined);
  assert.match(cash._dataIssues!.earnRates, /credit-card limit/);
  const terms = cardValueTerms(cash, "hsbc-cash-plus");
  assert.equal(terms.rate, null);
  assert.match(terms.rewardIssue, /cap needs confirmation/);
});
test("HSBC proposal output does not automatically type protected editorial features or waiver fields", () => {
  const products = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-hsbc-new-products.json", "utf8")).sources;
  const proposed = proposeHsbcPrimaryCards(hsbc, products, "2026-11-07");
  for (const candidate of proposed.proposals) {
    assert.deepEqual(candidate.record._features, []);
    assert.equal(candidate.record._provenance._features, "needs-review");
    assert.equal(candidate.record._provenance.partnerBrands, "needs-review");
    assert.equal(candidate.record.partnerBrands, undefined);
    assert.equal(candidate.record.annualFeeWaiver, undefined);
    assert.ok(Array.isArray(candidate.editorialTypingProposal._features));
    assert.deepEqual(candidate.record.eligibility.employmentTypes, []);
    assert.equal(candidate.record._provenance["eligibility.employmentTypes"], "needs-review");
  }
  assert.ok(proposed.proposals.find(p => p.slug === "hsbc-cash-plus")!.editorialTypingProposal.annualFeeWaiver);
});
