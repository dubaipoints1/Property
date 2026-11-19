import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { FAB_ETIHAD_KFS, FAB_ETIHAD_TARIFF, parseFabEtihadConventional } from "../../scripts/scrape/_fab-etihad-conventional";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import rows from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-fab-etihad-conventional.json";

const { sources } = fixture as { sources: Parameters<typeof parseFabEtihadConventional>[0] };
type Source = typeof sources[number];
const signature = "fab-etihad-guest-signature", platinum = "fab-etihad-guest-platinum";
const drift = (id: string, change: (s: Source) => Source) => sources.map(row => {
  if (row.id !== "fab-etihad-conventional-" + id) return row;
  const next = change(row);
  return { ...next, fixtureTextSha256: createHash("sha256").update(next.text).digest("hex") };
});
const replace = (from: string, to: string) => (row: Source) => ({ ...row, text: row.text.replace(from, to) });

test("only the two named conventional FAB Etihad Guest tiers parse standard gross primary AMF and published salary", () => {
  const s = parseFabEtihadConventional(sources, signature), p = parseFabEtihadConventional(sources, platinum);
  assert.ok(s && p);
  assert.notEqual(s.productUrl, p.productUrl);
  assert.deepEqual([s.annualFee, s.publishedIncome], [1575, 15000]);
  assert.deepEqual([p.annualFee, p.publishedIncome], [525, 8000]);
  for (const result of [s, p]) {
    assert.equal(result.network, "Visa");
    assert.equal(result.programme, "Etihad Guest");
    assert.equal(result.kfsUrl, FAB_ETIHAD_KFS);
    assert.ok(result.evidence.annualFee.every(e => e.vatTreatment === "inclusive" && e.sourceScope === "PDF page 1"
      && e.sourceUrl === FAB_ETIHAD_TARIFF));
  }
});

test("parser holds cross-tier, Islamic, older KFS, conflicting salary and VAT/supplementary-column drift", () => {
  for (const slug of ["fab-etihad-guest-infinite", "fab-etihad-guest-signature-islamic", "fab-share-platinum", "constructor"]) {
    assert.equal(parseFabEtihadConventional(sources, slug), null);
  }
  const variants = [
    drift("signature-title", replace("Signature", "Platinum")),
    drift("signature-salary-repeat", replace("15,000", "8,000")),
    drift("signature-network", replace("Visa", "Mastercard")),
    drift("signature-programme", replace("Etihad Guest", "SHARE")),
    drift("signature-selector-heading", replace("Credit Card", "Islamic Credit Card")),
    drift("signature-selector-kfs", replace("Sept2026.pdf", "April2026.pdf")),
    drift("signature-selector-tariff", row => ({ ...row, sourceStartByte: row.sourceStartByte! + 5000 })),
    drift("signature-tariff-link", replace("?view=1", "")),
    drift("signature-tariff-fee", replace("Signature", "Infinite")),
    drift("signature-tariff-fee", row => ({ ...row, sourceBodySha256: "0".repeat(64) })),
    drift("tariff-columns", replace("Inclusive of VAT", "Exclusive of VAT")),
    drift("tariff-columns", replace("Primary Card", "Supplementary only")),
    drift("kfs-fee-delegation", replace("upon issuance or renewal", "only once")),
  ];
  for (const variant of variants) assert.equal(parseFabEtihadConventional(variant, signature), null);
});

test("only the approved scoped fields are populated; active profiles do not match eligibility or rank rewards", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const matchable = new Set(getEditorConfirmedCards().map(c => c.slug));
  for (const slug of [signature, platinum] as const) {
    const parsed = parseFabEtihadConventional(sources, slug), row = rows[slug], card = getCardData(slug);
    assert.ok(parsed && row && card);
    assert.equal(row.name, parsed.name);
    assert.equal(row.network, parsed.network);
    assert.equal(row.loyaltyProgram, parsed.programme);
    assert.deepEqual(row.annualFee, { amount: parsed.annualFee, currency: "AED" });
    assert.equal(row.vatPolicy, "inclusive");
    assert.equal(row.eligibility.publishedMinMonthlyIncome, parsed.publishedIncome);
    assert.equal(row.eligibility.publishedIncomeBasis, "salary");
    for (const value of [row.eligibility.minSalary, row.eligibility.residencyRequired, row.eligibility.salaryTransferRequired,
      row.fxFee, row.earnRates.everythingElse]) assert.equal(value, null);
    assert.deepEqual(row.eligibility.employmentTypes, []);
    assert.deepEqual(row.sources, [parsed.productUrl, FAB_ETIHAD_TARIFF, FAB_ETIHAD_KFS]);
    assert.ok(!row.sources.some(url => url.includes("/en-ae/etihad-cards") || /\?card=/.test(url)));
    assert.equal(row.applyUrl, parsed.productUrl);
    assert.equal(row.kfsUrl, FAB_ETIHAD_KFS);
    assert.equal(row.lastVerified, parsed.capturedDate);
    assert.equal(row.refreshMode, "manual-primary");
    assert.deepEqual(row._fieldEvidence, JSON.parse(JSON.stringify(parsed.evidence)));
    for (const held of ["welcomeBonus", "welcomeBonusValue", "joiningFee", "annualFeeWaiver", "scopedEarnRates", "fxFeeUpperBound", "perks"]) {
      assert.equal(Object.hasOwn(row, held), false, held);
    }
    assert.ok(active.has(slug));
    assert.ok(!matchable.has(slug));
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
  }
});
