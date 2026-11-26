import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import fixture from "./fixtures/2026-11-cbd-islami-super-saver.json";
import catalogue from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { CBD_ISLAMI_SUPER_SAVER, matchCbdIslamiSuperSaverKfs, parseCbdIslamiSuperSaver } from "../../scripts/scrape/_cbd-islami-super-saver.ts";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { annualFeeLabel, cardComparisonRows } from "../../src/lib/cardsDataFormat.ts";
import { buildFeeIndex, feeIndexAnnualFeeLabel, firstYearAnnualFeeLabel, toRow } from "../../src/lib/feeIndex.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { calculateCardValue, cardValueTerms } from "../../src/lib/cardValue.ts";
import { cardSearchMetadata } from "../../src/lib/cardSearchMetadata.ts";

const { slug, kfsUrl, productUrl, kfsBodySha256 } = CBD_ISLAMI_SUPER_SAVER;
const conventionalSlug = "cbd-super-saver";
const sources = fixture.sources;

test("named Islamic primary KFS fee and limited year-one waiver replay into L2", () => {
  const parsed = parseCbdIslamiSuperSaver(sources, slug);
  const card = getCardData(slug);
  assert.ok(parsed && card);
  assert.equal(getActiveCards().some(c => c.slug === slug), false);
  assert.equal(card.applicationAvailability, "unconfirmed");
  assert.deepEqual([parsed.name, parsed.network, parsed.annualFee, parsed.vatPolicy], [card.name, "Visa", 420, "inclusive"]);
  assert.deepEqual([card.annualFee, card.annualFeeWaiver, card.sources], [
    { amount: parsed.annualFee, currency: "AED" }, parsed.annualFeeWaiver, parsed.sources,
  ]);
  assert.equal(parsed.annualFeeWaiver.year_one_waived, true);
  assert.equal(parsed.annualFeeWaiver.ongoing_threshold_aed, null);
  assert.equal(card.sharia, true);
  assert.equal(card.standardFeeConditions, "kfs-renewal-cohort");
  assert.equal(parsed.capturedDate, "2026-11-26");
  assert.equal(card.lastVerified.toISOString().slice(0, 10), parsed.capturedDate);
  assert.deepEqual(catalogue[slug]._fieldEvidence, parsed.evidence);
  assert.ok(Object.values(parsed.evidence).flat().every(pin => pin.sourceUrl === kfsUrl && pin.sourceBodySha256 === kfsBodySha256));
  assert.equal(card.kfsUrl, kfsUrl);
  assert.equal(card.sources[0], productUrl);
  assert.equal(card.applyUrl, undefined);
  assert.equal(card.joiningFee, undefined);
  assert.equal(card._provenance.joiningFee, "needs-review");
  assert.equal(hasUsableSalaryMinimum(card), false);
  assert.equal(card.fxFee, null);
  assert.equal(card.earnRates.everythingElse, null);
  for (const field of ["welcomeBonus", "interestRate", "loyaltyProgram", "scopedEarnRates", "_features", "perks"])
    assert.ok(!Object.hasOwn(catalogue[slug], field), field);
  assert.deepEqual(registry.cards.find(row => row.slug === slug)?.sourceFixtureIds, parsed.sourceFixtureIds);
  assert.equal(getCardData("dib-prime-classic"), undefined);
});

test("the exact parser holds a different revision, another variant, missing tariff or altered terms", () => {
  const change = (id: string, from: string, to: string) => sources.map(source => {
    if (source.id !== id) return source;
    const text = source.text.replace(from, to);
    assert.notEqual(text, source.text);
    return { ...source, text, fixtureTextSha256: createHash("sha256").update(text).digest("hex") };
  });
  assert.equal(parseCbdIslamiSuperSaver(sources, conventionalSlug), null);
  assert.equal(parseCbdIslamiSuperSaver(sources.slice(0, -1), slug), null);
  assert.equal(parseCbdIslamiSuperSaver(sources.map(s => s.observedKfsLink ? { ...s, observedKfsLink: productUrl } : s), slug), null);
  assert.equal(matchCbdIslamiSuperSaverKfs(Buffer.from("%PDF-"), sources[1].text, sources), false);
  for (const [id, from, to] of [
    ["cbd-islami-kfs-primary-fee", "420.00*", "840.00*"],
    ["cbd-islami-kfs-primary-fee", "Primary CARD", "Supplementary CARD"],
    ["cbd-islami-kfs-primary-fee", "Super Saver Visa Signature", "CBD Super Saver Visa Signature"],
    ["cbd-islami-kfs-primary-fee", "FIRST YEAR only", "for life"],
    ["cbd-islami-kfs-primary-fee", "assigned for each CARD Variant", "assigned as AED 3,000"],
    ["cbd-islami-kfs-vat", "inclusive", "exclusive"],
    ["cbd-islami-kfs-version", "1 November", "1 October"],
    ["cbd-islami-tariff-cohorts", "for existing Al Islami cardholders", "for all cardholders"],
  ]) assert.equal(parseCbdIslamiSuperSaver(change(id, from, to), slug), null, id + ": " + from);
});

test("KFS cohort terms are visible but not a fee-index sample, Finder rank, Compare price or Offer", () => {
  const data = getCardData(slug);
  assert.ok(data);
  const card = { ...data, slug };
  const conventional = getActiveCards().find(c => c.slug === conventionalSlug);
  assert.ok(card && conventional);
  assert.match(annualFeeLabel(card).qual ?? "", /Key Facts Statement, year 2\+; legacy rates differ/);
  assert.match(cardSearchMetadata(card).description, /420 including VAT · Key Facts Statement, year 2\+; legacy rates differ/);
  assert.doesNotMatch(cardSearchMetadata(card).description, /\bfree\b|apply now/i);
  const finder = finderEvidence(card);
  assert.equal(finder.comparableAnnualFee, null);
  assert.equal(finder.rewardPreference, null);
  assert.equal(finder.salaryPending, true);
  assert.deepEqual(finder.rankRates, {});
  assert.match(finder.feeNotes.join(" "), /Key Facts Statement lists a primary annual-fee waiver/);
  assert.doesNotMatch(finder.feeNotes.join(" "), /420|840/);
  const estimate = cardValueTerms(card, slug);
  assert.deepEqual([estimate.firstFee, estimate.laterFee, estimate.rate, estimate.assumesYearOneWaiver, estimate.hasWelcomeOffer],
    [null, null, null, false, false]);
  const value = calculateCardValue(estimate, 3000);
  assert.deepEqual([value.first, value.later, value.rewards], [null, null, null]);
  const comparison = cardComparisonRows(card, conventional);
  assert.match(comparison.find(r => r.key === "annualFee")?.leftValue ?? "", /420 · Key Facts Statement, year 2\+; legacy rates differ/);
  assert.equal(comparison.find(r => r.key === "annualFee")?.winner, "none");
  assert.equal(comparison.find(r => r.key === "joiningFee")?.leftValue, "Pending");
  const row = toRow(card);
  assert.equal(row.annualFee, null);
  assert.match(feeIndexAnnualFeeLabel(row), /420 incl\. VAT · Key Facts Statement, year 2\+; legacy rates differ/);
  assert.equal(firstYearAnnualFeeLabel(row), "Waiver listed in KFS");
  const before = buildFeeIndex([conventional]), now = buildFeeIndex([conventional, card]);
  assert.equal(now.annualFeeSampleSize, before.annualFeeSampleSize);
  assert.equal(now.firstYearFree, before.firstYearFree);
  assert.equal(now.medianFee, before.medianFee);
  // Existing rendered Product Offer gate rejects a qualified manual-primary fee.
  // The actual static output is also probed in release QA.
  const layout = readFileSync("src/layouts/CardReviewLayout.astro", "utf8");
  assert.match(layout, /&& !\(cardData\?\.refreshMode === "manual-primary" && recurringFee\.qual\)/);
  assert.match(layout, /const compareOtherCards = kfsCohortReference \|\|/);
  assert.match(layout, /compareOtherCards \? "\/cards\/compare\/" : compareHref/);
  assert.match(layout, /rivals=\{compareOtherCards \? \[\] : relatedCards\.map/);
  assert.equal(card.refreshMode, "manual-primary");
  assert.ok(annualFeeLabel(card).qual);
  const hub = readFileSync("src/content/banks/cbd.mdx", "utf8");
  assert.match(hub, /Issuer source profile — application availability unconfirmed/);
  assert.ok(hub.includes("/cards/" + slug + "/"));
  // This distinct mode must not change the existing conventional card's behaviour.
  assert.equal(conventional.sharia, false);
  assert.equal(conventional.standardFeeConditions, "renewal-waiver");
  assert.equal(annualFeeLabel(conventional).qual, "year 2+");
  assert.equal(firstYearAnnualFeeLabel(toRow(conventional)), "Waived");
  assert.equal(cardValueTerms(conventional, conventionalSlug).laterFee, conventional.annualFee.amount);
});
