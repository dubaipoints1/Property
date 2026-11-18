import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseEnbdScopedCoBrands } from "../../scripts/scrape/_enbd-scoped-co-brands";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { annualFeeLabel, loyaltyTag } from "../../src/lib/cardsDataFormat";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import cards from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-enbd-scoped-co-brands.json";

const share = "emirates-nbd-share-visa-platinum";
const emaar = "emirates-nbd-u-by-emaar-signature";
const inputs = fixture.sources as Parameters<typeof parseEnbdScopedCoBrands>[0];
type Source = typeof inputs[number];
const alter = (id: string, fn: (s: Source) => Source) => inputs.map(s => {
  if (s.id !== id) return s;
  const changed = fn(s);
  return { ...changed, fixtureTextSha256: createHash("sha256").update(changed.text).digest("hex") };
});
const replace = (a: string, b: string) => (s: Source) => ({ ...s, text: s.text.replace(a, b) });

test("ENBD exact documents distinguish the joining and renewal rows in each named tier", () => {
  const platinum = parseEnbdScopedCoBrands(inputs, share);
  const signature = parseEnbdScopedCoBrands(inputs, emaar);
  assert.ok(platinum && signature);
  assert.deepEqual([platinum.joiningFee, platinum.annualFee, platinum.publishedIncome], [0, 0, 5000]);
  assert.deepEqual([signature.joiningFee, signature.annualFee, signature.publishedIncome], [525, 262.5, 12000]);
  assert.equal(signature.evidence.joiningFee[0].firstLine, 12);
  assert.equal(signature.evidence.annualFee[0].firstLine, 29);
  assert.equal(signature.evidence.annualFee[1].vatTreatment, "inclusive");
  assert.ok(signature.evidence.joiningFee.every(pin => pin.vatTreatment !== "inclusive"));
  assert.notEqual(platinum.guideUrl, signature.guideUrl);
  assert.equal(platinum.kfsUrl, signature.kfsUrl);
  assert.equal(platinum.programme, "SHARE");
  assert.equal(signature.programme, "U by Emaar");
});

test("ENBD exact sources fail closed for wrong tier, cost, section, network, or applicant route", () => {
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-share-heading", replace("Platinum", "Signature")), share), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-emaar-network", replace("Visa", "Mastercard")), emaar), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-share-application", replace("share-visa-platinum", "share-visa-signature")), share), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-emaar-headline-fee", replace("525", "262.50")), emaar), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-kfs-joining", replace("Joining", "Renewal")), emaar), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-kfs-renewal", replace("Renewal", "APR")), share), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-kfs-renewal", replace("SHARE Platinum", "SHARE Signature")), share), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-emaar-guide", replace("262.50", "250")), emaar), null);
  assert.equal(parseEnbdScopedCoBrands(alter("enbd-share-kfs-link", s => ({ ...s, sourceBodySha256: "0".repeat(64) })), share), null);
  assert.equal(parseEnbdScopedCoBrands(inputs, "emirates-nbd-share-visa-signature"), null);
});

test("ENBD shipped profiles replay exact pins and do not become salary or reward recommendations", () => {
  const active = new Set(getActiveCards().map(card => card.slug));
  const confirmed = new Set(getEditorConfirmedCards().map(card => card.slug));
  for (const slug of [share, emaar]) {
    const p = parseEnbdScopedCoBrands(inputs, slug);
    assert.ok(p, slug);
    const row = cards[slug];
    const publicCard = getCardData(slug);
    assert.ok(row && publicCard, slug);
    assert.equal(row.name, p.name);
    assert.equal(row.network, p.network);
    assert.equal(row.loyaltyProgram, p.programme);
    assert.equal(row.joiningFee.amount, p.joiningFee);
    assert.equal(row.annualFee.amount, p.annualFee);
    assert.equal(row.eligibility.publishedMinMonthlyIncome, p.publishedIncome);
    assert.equal(row.eligibility.publishedIncomeBasis, "salaried-applicants");
    assert.equal(row.eligibility.minSalary, null);
    assert.equal(row.eligibility.residencyRequired, null);
    assert.equal(row.eligibility.salaryTransferRequired, null);
    assert.equal(row.lastVerified, p.capturedDate);
    assert.equal(row.kfsUrl, p.kfsUrl);
    assert.equal(row.applyUrl, p.productUrl);
    assert.deepEqual(row.sources, p.sources);
    assert.ok(!row.sources.includes(p.application));
    assert.deepEqual(row._fieldEvidence, JSON.parse(JSON.stringify(p.evidence)));
    assert.equal(row.refreshMode, "manual-primary");
    assert.ok(active.has(slug));
    assert.ok(!confirmed.has(slug));
    assert.equal(hasUsableSalaryMinimum(publicCard), false);
    assert.equal(loyaltyTag(row.loyaltyProgram), "points");
    assert.deepEqual(finderEvidence(publicCard).rankRates, {});
    assert.equal(finderEvidence(publicCard).fallbackPending, true);
    assert.equal(publicCard.fxFee, null);
    assert.equal(Object.hasOwn(row, "welcomeBonus"), false);
    assert.equal(annualFeeLabel(publicCard).qual, slug === emaar ? "year 2+" : null);
    assert.equal("vatTreatment" in row.joiningFee ? row.joiningFee.vatTreatment : undefined, slug === emaar ? "unspecified" : undefined);
  }
});
