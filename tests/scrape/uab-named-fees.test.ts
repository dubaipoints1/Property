import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseUabNamedFees, UAB_NAMED_CARDS, type UabFeeSource } from "../../scripts/scrape/_uab-named-fees.ts";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { firstYearAnnualFeeStatus } from "../../src/lib/feeIndex";
import { cardValueTerms } from "../../src/lib/cardValue";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { classifyCoverage, coverageGuardError, SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH, SALARY_OFFER_REVIEW_PENDING_BANKS } from "../../src/lib/salaryTransferCoverage";
import { bankHasTextOnlyMark } from "../../src/lib/logos";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import fixture from "./fixtures/2026-11-uab-named-annual-fees.json";

const data = fixture.sources as UabFeeSource[];
const [titanium, platinum, world, islamic] = Object.keys(UAB_NAMED_CARDS) as (keyof typeof UAB_NAMED_CARDS)[];
const held = "united-arab-bank-islamic-mastercard-world";
const expected = [[0, 0, null], [0, 787.5, 60_000], [0, 1050, 60_000], [0, 0, null]];

function replace(id: string, before: string, after: string, rehash = true) {
  let edited = false;
  const out = data.map(pin => {
    if (pin.id !== id) return pin;
    assert.ok(pin.text.includes(before), id);
    const text = pin.text.replace(before, after);
    edited = true;
    return { ...pin, text, fixtureTextSha256: rehash ? createHash("sha256").update(text).digest("hex") : pin.fixtureTextSha256 };
  });
  assert.ok(edited, id);
  return out;
}

test("the fee periods come from the agreeing exact named primary-card documents", () => {
  for (const [i, slug] of [titanium, platinum, world, islamic].entries()) {
    const replay = parseUabNamedFees(data, slug);
    assert.ok(replay, slug);
    assert.deepEqual([replay.firstYearAnnualFee, replay.renewalAnnualFee, replay.waiverThreshold], expected[i]);
    assert.equal(replay.network, "Mastercard");
    assert.equal(replay.vatPolicy, "inclusive");
    assert.equal(replay.islamic, slug === islamic);
    assert.ok(replay.sources.includes(replay.kfsUrl));
    assert.ok(replay.evidence.annualFee.some(pin => pin.sourceUrl === replay.kfsUrl));
    assert.match(replay.evidence.network[1].unit, /no applicant approval/);
  }
  assert.equal(parseUabNamedFees(data, held), null);
  assert.equal(parseUabNamedFees(data, "united-arab-bank-mastercard-world-elite"), null);
});

test("drift in product, application, VAT, period, fee or waiver fails closed", () => {
  for (const [slug, id, before, after] of [
    [world, "world-identity-and-availability", "World Mastercard", "World Elite Mastercard"],
    [titanium, "titanium-identity-and-availability", "Titanium Mastercard", "Titanium MastercardPlus"],
    [platinum, "conv-selectable-three", "Mastercard Platinum", "Mastercard Gold"],
    [world, "conv-application-vat", "inclusive", "exclusive"],
    [world, "conv-tariff-vat", "inclusive", "exclusive"],
    [world, "conv-tariff-order", ") Second", ") First "],
    [world, "standard-world", "1,050.00", "787.50"],
    [platinum, "conv-annual-fee-matrix", "787.5", "787.6"],
    [platinum, "conv-spend-waiver", "annual spend", "monthly spend"],
    [islamic, "islamic-titanium-application", "Free for Life", "Free for First Year"],
    [islamic, "islamic-kfs-titanium-column", "Titanium Islamic", "Other Islamic   "],
    [islamic, "islamic-kfs-titanium-fee", "Free for life", "Free for year"],
    [islamic, "portal-islamic-type.pdf", "A33288E4D55743DDBE1472F11E4447DA.ashx", "0.ashx"],
  ]) assert.equal(parseUabNamedFees(replace(id, before, after), slug), null, id);
  assert.equal(parseUabNamedFees(replace("standard-world", "3.79%", "4.79%", false), world), null);
  const scope = data.find(pin => pin.id === "standard-world")!;
  assert.equal(parseUabNamedFees([...data, scope], world), null);
  assert.equal(parseUabNamedFees(data.filter(pin => pin !== scope), world), null);
  assert.equal(parseUabNamedFees(data.map(pin => pin === scope ? { ...pin, sourceScope: "PDF page 1" } : pin), world), null);
  assert.equal(parseUabNamedFees(data.map(pin => pin === scope ? { ...pin, sourceBodySha256: "0".repeat(64) } : pin), world), null);
});

test("the four active rows match pinned outputs and neither qualify nor estimate", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const eligible = new Set(getEditorConfirmedCards().map(c => c.slug));
  const expectedSlugs = [titanium, platinum, world, islamic];
  assert.deepEqual(Object.entries(l2).filter(([, row]) => row.bank === "united-arab-bank").map(([slug]) => slug).sort(), [...expectedSlugs].sort());
  assert.equal(getCardData(held), undefined);
  for (const slug of expectedSlugs) {
    const replay = parseUabNamedFees(data, slug)!;
    const row = l2[slug];
    const card = getCardData(slug)!;
    assert.ok(active.has(slug) && !eligible.has(slug));
    assert.deepEqual(row._fieldEvidence, JSON.parse(JSON.stringify(replay.evidence)));
    assert.deepEqual(row.sources, replay.sources);
    assert.deepEqual([row.applyUrl, row.kfsUrl, row.lastVerified], [replay.productUrl, replay.kfsUrl, replay.capturedDate]);
    assert.deepEqual(registry.cards.find(x => x.slug === slug)?.sourceFixtureIds, replay.ids);
    assert.deepEqual(card.annualFee, { amount: replay.renewalAnnualFee, currency: "AED" });
    for (const key of ["joiningFee", "welcomeBonus", "loyaltyProgram", "earnUnit", "interestRate", "scopedEarnRates"]) {
      assert.equal(Object.hasOwn(row, key), false, key);
    }
    assert.equal(card.fxFee, null);
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(cardValueTerms(card, slug).firstFee, null);
    assert.equal(cardValueTerms(card, slug).rate, null);
    assert.equal(firstYearAnnualFeeStatus(card), replay.renewalAnnualFee > 0 ? "waived" : "standard");
    if (replay.renewalAnnualFee > 0) {
      assert.equal(annualFeeLabel(card).qual, "year 2+");
      assert.equal(card.standardFeeConditions, "renewal-waiver");
      assert.deepEqual(card.annualFeeWaiver, { year_one_waived: true, ongoing_threshold_aed: replay.waiverThreshold, threshold_period: "annual" });
    } else {
      assert.equal(annualFeeLabel(card).amount, "Free");
      assert.equal(card.standardFeeConditions, undefined);
    }
  }
});

test("balance-led offers do not count as banded cash and the bank uses site text without a logo", () => {
  const bank = "united-arab-bank";
  const coverage = classifyCoverage({
    coveredBanks: [bank], liveOfferBanks: [], lapsedOfferBanks: [],
    checkedWithoutLiveOffer: SALARY_OFFER_CHECKED_WITHOUT_BANDED_CASH.filter(slug => slug === bank),
    advertisedWithoutCurrentTerms: [],
    reviewPendingBanks: SALARY_OFFER_REVIEW_PENDING_BANKS.filter(slug => slug === bank),
  });
  assert.equal(coverageGuardError(coverage, 1), null);
  assert.deepEqual(coverage.reviewPending, []);
  assert.deepEqual(coverage.tracked, []);
  assert.deepEqual(coverage.checkedWithoutLiveOffer, [bank]);
  assert.equal(bankHasTextOnlyMark(bank), true);
  assert.equal(bankHasTextOnlyMark("adcb"), false);
});
