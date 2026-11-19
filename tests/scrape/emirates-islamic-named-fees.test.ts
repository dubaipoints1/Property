import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EI_NAMED_FEE_CARDS, parseEiNamedFees } from "../../scripts/scrape/_emirates-islamic-named-fees.ts";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import rows from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import fixture from "./fixtures/2026-11-emirates-islamic-named-fees.json";

const sources = fixture.sources as Parameters<typeof parseEiNamedFees>[0];
const sky = "emirates-islamic-skywards-signature";
const barca = "emirates-islamic-barca-cashback";
const rta = "emirates-islamic-rta";
const cases = { [sky]: 735, [barca]: 0, [rta]: 0 } as const;
const slugs = Object.keys(cases) as Array<keyof typeof cases>;
function replace(id: string, before: string, after: string, rehash = true) {
  let altered = false;
  const result = sources.map(source => {
    if (source.id !== id) return source;
    const text = source.text.replace(before, after);
    assert.notEqual(text, source.text);
    altered = true;
    return { ...source, text, fixtureTextSha256: rehash ? createHash("sha256").update(text).digest("hex") : source.fixtureTextSha256 };
  });
  assert.ok(altered);
  return result;
}

test("named Emirates Islamic Visa network and primary annual membership replay identically", () => {
  for (const slug of slugs) {
    const e = parseEiNamedFees(sources, slug);
    assert.ok(e);
    assert.deepEqual([e.fee, e.vatPolicy, e.network, e.capturedDate], [cases[slug], "inclusive", "Visa", "2026-11-18"]);
    assert.equal(e.name, EI_NAMED_FEE_CARDS[slug].name);
    assert.deepEqual(Object.keys(e.evidence), ["annualFee", "network"]);
    assert.ok(e.evidence.annualFee.some(pin => pin.rawText.includes("Profit based Cards")));
    assert.ok(e.evidence.annualFee.some(pin => pin.rawText.includes("Fee based Cards")));
    assert.ok(e.evidence.network.some(pin => pin.rawText === EI_NAMED_FEE_CARDS[slug].art));
    for (const p of Object.values(e.evidence).flat()) {
      assert.equal(p.sourceEndByte - p.sourceStartByte, Buffer.byteLength(p.rawText));
      assert.equal(p.lastLine - p.firstLine, p.rawText.split("\n").length - 1);
    }
  }
  assert.equal(parseEiNamedFees(sources, "emirates-islamic-skywards-infinite"), null);
  assert.equal(parseEiNamedFees(sources, "emirates-islamic-rta-fee-based"), null);
});

test("separate fee scope, mismatched KFS and tariff, missing or corrupt source and product identity fail closed", () => {
  for (const [slug, id, before, after] of [
    [sky, "ei-kfs-annual-fee-row", "735", "745"],
    [sky, "ei-kfs-card-columns", "Skywards Infinite", "Skywards Signature"],
    [sky, "ei-kfs-vat", "inclusive", "exclusive"],
    [sky, "ei-tariff-vat", "inclusive", "exclusive"],
    [sky, sky + "-tariff-row", "AED 735", "AED 725"],
    [barca, barca + "-tariff-row", "No Annual Membership Fee", "No Monthly Membership Fee"],
    [barca, barca + "-heading", "Barça Cashback Card", "Cashback Card"],
    [barca, barca + "-issuer-network", "VISA", "Mastercard"],
    [barca, barca + "-artwork-identity", "FCB_Campaign", "Unrelated_Campaign"],
    [rta, rta + "-tariff-row", "RTA Platinum", "RTA Signature"],
    [rta, "ei-tariff-profit-scope", "Profit based Cards", "Fee based Cards"],
    [rta, "ei-tariff-fee-based-boundary", "Fee based Cards", "Profit based Cards"],
    [rta, "ei-tariff-membership-columns", "Annual Membership Fee", "Monthly Fee"],
    [rta, rta + "-apply-identity", "rta-card", "another-card"],
  ] as const) assert.equal(parseEiNamedFees(replace(id, before, after), slug), null, id);
  assert.equal(parseEiNamedFees(replace(sky + "-tariff-row", "AED 735", "AED 725", false), sky), null);
  assert.equal(parseEiNamedFees(sources.filter(s => s.id !== rta + "-tariff-row"), rta), null);
  for (const [key, value] of [
    ["url", "https://example.com/fake-kfs"], ["sourceStartByte", 0],
    ["sourceBodySha256", "0".repeat(64)], ["capturedAt", "2026-01-01T00:00:00.000Z"],
  ] as const) {
    assert.equal(parseEiNamedFees(sources.map(s => s.id === "ei-kfs-annual-fee-row" ? { ...s, [key]: value } : s), rta), null, key);
  }
});

test("active profiles only contain source-matched scoped record; no salary matches or ranked estimates", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const matched = new Set(getEditorConfirmedCards().map(c => c.slug));
  for (const slug of slugs) {
    const e = parseEiNamedFees(sources, slug);
    const c = getCardData(slug), row = rows[slug];
    const route = registry.cards.find(entry => entry.slug === slug);
    assert.ok(e && c && route);
    assert.deepEqual([row.name, row.network, row.annualFee.amount, row.vatPolicy], [e.name, e.network, e.fee, e.vatPolicy]);
    assert.deepEqual(row._fieldEvidence, JSON.parse(JSON.stringify(e.evidence)));
    assert.deepEqual(row.sources, e.sources);
    assert.deepEqual(route.sourceFixtureIds, e.ids);
    assert.deepEqual([row.applyUrl, row.kfsUrl, row.lastVerified, row.refreshMode], [e.canonical, e.kfs, e.capturedDate, "manual-primary"]);
    assert.deepEqual(row.eligibility, { minSalary: null, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] });
    assert.equal(row.fxFee, null);
    for (const key of ["joiningFee", "annualFeeWaiver", "welcomeBonus", "scopedEarnRates", "loyaltyProgram", "_features"]) {
      assert.equal(Object.hasOwn(row, key), false, key);
    }
    assert.deepEqual(row.earnRates, { everythingElse: null });
    assert.ok(row.categories.includes("Islamic"));
    assert.ok(active.has(slug));
    assert.ok(!matched.has(slug));
    assert.equal(hasUsableSalaryMinimum(c), false);
    assert.deepEqual(finderEvidence(c).rankRates, {});
    assert.equal(finderEvidence(c).fallbackPending, true);
  }
  assert.match(rows[rta].name, /\(Profit-Based\)$/);
  assert.match(rows[rta]._dataIssues.annualFee, /fee-based plan with monthly charges/);
});
