import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { FAB_SHARE_UPPER, parseFabShareUpper } from "../../scripts/scrape/_fab-share-upper";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { loyaltyTag } from "../../src/lib/cardsDataFormat";
import rows from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-fab-share-upper.json";

const { sources } = fixture as { sources: Parameters<typeof parseFabShareUpper>[0] };
const infinite = "fab-share-infinite", signature = "fab-share-signature";
type Source = typeof sources[number];
const alter = (id: string, change: (s: Source) => Source) => sources.map(s => {
  if (s.id !== "fab-share-upper-" + id) return s;
  const next = change(s);
  return { ...next, fixtureTextSha256: createHash("sha256").update(next.text).digest("hex") };
});
const replace = (from: string, to: string) => (s: Source) => ({ ...s, text: s.text.replace(from, to) });

test("FAB SHARE upper tiers parse only the named gross annual fee and published salary", () => {
  const i = parseFabShareUpper(sources, infinite), s = parseFabShareUpper(sources, signature);
  assert.ok(i && s);
  assert.deepEqual([i.annualFee, i.publishedIncome], [1050, 25000]);
  assert.deepEqual([s.annualFee, s.publishedIncome], [525, 10000]);
  assert.notEqual(i.application, s.application);
  assert.ok(i.evidence.annualFee.every(pin => pin.vatTreatment === "inclusive" && pin.sourceScope === "PDF page 1"));
  assert.ok(s.evidence.annualFee.every(pin => pin.vatTreatment === "inclusive" && pin.sourceScope === "PDF page 1"));
});

test("FAB SHARE rejects wrong tier/CTA, disputed amount across device labels, or non-gross source substitutions", () => {
  assert.equal(parseFabShareUpper(alter("infinite-title", replace("Infinite", "Signature")), infinite), null);
  assert.equal(parseFabShareUpper(alter("signature-application", replace(FAB_SHARE_UPPER[signature].applicationId, FAB_SHARE_UPPER[infinite].applicationId)), signature), null);
  assert.equal(parseFabShareUpper(alter("infinite-salary-repeat", replace("25,000", "10,000")), infinite), null);
  assert.equal(parseFabShareUpper(alter("tariff-columns", replace("Inclusive of VAT", "Excluding VAT")), signature), null);
  assert.equal(parseFabShareUpper(alter("tariff-columns", replace("Primary Card", "Supplementary only")), signature), null);
  assert.equal(parseFabShareUpper(alter("signature-tariff-fee", replace("Signature", "Platinum")), signature), null);
  assert.equal(parseFabShareUpper(alter("infinite-tariff-link", replace("?view=1", "")), infinite), null);
  assert.equal(parseFabShareUpper(alter("kfs-delegation", replace("upon issuance or renewal", "only once")), signature), null);
  assert.equal(parseFabShareUpper(alter("signature-network", replace("Visa", "Mastercard")), signature), null);
  assert.equal(parseFabShareUpper(alter("infinite-tariff-fee", s => ({...s, sourceBodySha256:"1".repeat(64)})), infinite), null);
  assert.equal(parseFabShareUpper(sources, "fab-share-platinum"), null);
});

test("FAB SHARE shipped profiles expose only primary sources and bypass automatic salary and reward ranking", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const matchable = new Set(getEditorConfirmedCards().map(c => c.slug));
  for (const slug of [infinite, signature]) {
    const parsed = parseFabShareUpper(sources, slug), row = rows[slug], card = getCardData(slug);
    assert.ok(parsed && row && card);
    assert.equal(row.name, parsed.name);
    assert.equal(row.network, parsed.network);
    assert.equal(row.annualFee.amount, parsed.annualFee);
    assert.equal(row.vatPolicy, "inclusive");
    assert.equal(row.eligibility.publishedMinMonthlyIncome, parsed.publishedIncome);
    assert.equal(row.eligibility.minSalary, null);
    assert.equal(row.eligibility.residencyRequired, null);
    assert.equal(row.eligibility.salaryTransferRequired, null);
    assert.equal(row.loyaltyProgram, parsed.programme);
    assert.equal(loyaltyTag(card.loyaltyProgram), "points");
    assert.equal(row.applyUrl, parsed.productUrl);
    assert.equal(row.kfsUrl, parsed.kfsUrl);
    assert.deepEqual(row.sources, parsed.sources);
    assert.ok(!row.sources.includes(parsed.application));
    assert.equal(row.lastVerified, parsed.capturedDate);
    assert.equal(row.refreshMode, "manual-primary");
    assert.deepEqual(row._fieldEvidence, JSON.parse(JSON.stringify(parsed.evidence)));
    assert.equal(row.fxFee, null);
    assert.equal(Object.hasOwn(row, "welcomeBonus"), false);
    assert.equal(Object.hasOwn(row, "joiningFee"), false);
    assert.equal(Object.hasOwn(row, "annualFeeWaiver"), false);
    assert.equal(Object.hasOwn(row, "scopedEarnRates"), false);
    assert.ok(active.has(slug));
    assert.ok(!matchable.has(slug));
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
  }
});
