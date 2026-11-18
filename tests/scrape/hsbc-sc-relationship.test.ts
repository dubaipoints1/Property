import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseHsbcScRelationship, RELATIONSHIP_CARD_SLUGS } from "../../scripts/scrape/_hsbc-sc-relationship";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { eligibleForSalaryFilter } from "../../src/lib/cardSelection";
import { cardValueTerms } from "../../src/lib/cardValue";
import { annualFeeLabel, annualFeeWaiverDisplay, cardComparisonRows, loyaltyTag } from "../../src/lib/cardsDataFormat";
import { finderEvidence } from "../../src/lib/finderEvidence";
import l2 from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-hsbc-sc-relationship.json";

const inputs = fixture.sources;
type Source = (typeof inputs)[number];
const [premier, advance, journey] = RELATIONSHIP_CARD_SLUGS;
const alter = (id: string, f: (source: Source) => Source) => inputs.map(source => {
  if (source.id !== id) return source;
  const changed = f(source);
  return { ...changed, fixtureTextSha256: createHash("sha256").update(changed.text).digest("hex") };
});
const replace = (search: string, substitution: string) => (source: Source) => ({ ...source, text: source.text.replace(search, substitution) });

test("three exact named cards regenerate the scoped L2 fields from primary evidence", () => {
  for (const slug of RELATIONSHIP_CARD_SLUGS) {
    const parsed = parseHsbcScRelationship(inputs, slug);
    assert.ok(parsed, slug);
    const card = l2[slug];
    assert.equal(card.name, parsed.name);
    assert.equal(card.bank, parsed.bank);
    assert.equal(card.network, parsed.network);
    assert.equal(card.loyaltyProgram, parsed.programme);
    assert.equal(card.applyUrl, parsed.productUrl);
    assert.equal(card.kfsUrl, parsed.kfsUrl);
    assert.equal(card.refreshMode, "manual-primary");
    assert.equal(card.lastVerified, parsed.date);
    assert.equal(card._lastReviewed, parsed.date);
    assert.equal(card._lastScraped, null);
    assert.deepEqual(card.sources, parsed.sources);
    assert.deepEqual(card._fieldEvidence, JSON.parse(JSON.stringify(parsed.evidence)));
    for (const pin of Object.values(parsed.evidence).flat()) {
      if (pin.sourceRepresentation === "pdftotext-layout") {
        assert.match(pin.sourceScope ?? "", /pdfplumber 0\.11\.9/);
        assert.equal(Object.hasOwn(pin, "sourceExtraction"), false);
      }
    }
    assert.equal(card.annualFee.amount, parsed.annualFee);
    assert.match(card._dataIssues.eligibility, new RegExp(slug === journey ? "current or savings account" : parsed.account));
    if (slug === journey) {
      assert.equal(card.annualFee.amount, 1575);
      assert.equal(card.vatPolicy, "inclusive");
      assert.equal(l2[journey].eligibility.publishedMinMonthlyIncome, 30000);
      assert.equal(l2[journey].eligibility.publishedMinMonthlyIncome, parsed.income);
      assert.equal(l2[journey].annualFeeWaiver.notes, parsed.waiverNotes);
      assert.equal(l2[journey].annualFeeWaiver.year_one_waived, false);
      assert.equal(l2[journey].annualFeeWaiver.ongoing_threshold_aed, null);
      assert.match(l2[journey]._dataIssues.annualFeeWaiver, /different wording/);
    } else {
      assert.equal(card.annualFee.amount, 0);
      assert.equal(parsed.income, null);
      assert.equal(Object.hasOwn(card.eligibility, "publishedMinMonthlyIncome"), false);
      assert.equal(Object.hasOwn(card, "annualFeeWaiver"), false);
    }
  }
});

test("wrong tier, replaced fee, form, programme, salary proxy or renewal wording cannot pass", () => {
  assert.equal(parseHsbcScRelationship(alter("hsbc-premier-account", replace("Premier Account", "Advance Account")), premier), null);
  assert.equal(parseHsbcScRelationship(alter("hsbc-premier-kfs", replace("Premier Credit Card", "Advance Credit Card")), premier), null);
  assert.equal(parseHsbcScRelationship(alter("hsbc-advance-fee", replace("No annual fee", "No joining fee")), advance), null);
  assert.equal(parseHsbcScRelationship(alter("hsbc-advance-rewards-heading", replace("Advance rewards", "Premier rewards")), advance), null);
  assert.equal(parseHsbcScRelationship(alter("hsbc-advance-rewards-programme", replace("HSBC Rewards", "Skywards Miles")), advance), null);
  assert.equal(parseHsbcScRelationship(alter("hsbc-existing-form", source => ({ ...source, text: source.text.replace(/Premier\s+Advance/, "Advance") })), advance), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-apply", replace("productName=journey", "productName=platinum")), journey), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-form", replace("Journey credit card", "other credit card")), journey), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-form-salary", replace("30,000", "40,000")), journey), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-resident", replace("SCB Current or Savings Account", "Any bank account")), journey), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-kfs-fees", replace("For New Credit Card Applicants", "For All Credit Card Applicants")), journey), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-kfs-conditions", replace("exceeds", "reaches")), journey), null);
  assert.equal(parseHsbcScRelationship(alter("sc-journey-tariff", replace("1,575", "1,500")), journey), null);
  assert.equal(parseHsbcScRelationship(inputs.filter(source => source.id !== "sc-journey-kfs-conditions"), journey), null);
});

test("card listings show only source-supported facts without affecting ranked returns or salary matching", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const confirmed = new Set(getEditorConfirmedCards().map(c => c.slug));
  for (const slug of RELATIONSHIP_CARD_SLUGS) {
    const card = getCardData(slug)!;
    assert.ok(active.has(slug));
    assert.ok(!confirmed.has(slug));
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.salaryTransferRequired, null);
    assert.equal(card.fxFee, null);
    assert.equal(card.joiningFee, undefined);
    assert.equal(Object.hasOwn(l2[slug], "welcomeBonus"), false);
    assert.equal(card.welcomeBonus, "Welcome offer pending source review.");
    assert.equal(loyaltyTag(card.loyaltyProgram), "points");
    assert.equal(cardValueTerms(card, slug).rate, null);
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
    assert.equal(finderEvidence(card).salaryPending, true);
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.equal(eligibleForSalaryFilter(card._provenance, card.eligibility.minSalary), false);
    assert.equal(cardComparisonRows(card, getCardData("hsbc-cash-plus")!).find(row => row.key === "minSalary")?.winner, "none");
  }
  const sc = getCardData(journey)!;
  assert.match(annualFeeLabel(sc).qual ?? "", /waiver/i);
  assert.match(annualFeeWaiverDisplay(sc.annualFeeWaiver), /new credit card applicants.*at least AED 10,000 .*first 60 days.*existing cardholders.*last 6 months/i);
  assert.doesNotMatch(annualFeeWaiverDisplay(sc.annualFeeWaiver), /150,000|free first year/i);
});
