import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { cardComparisonRows, loyaltyTag, annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { cardValueTerms } from "../../src/lib/cardValue";
import { FAB_Z_SHARE_PRODUCTS, parseFabZShare } from "../../scripts/scrape/_fab-z-share";
import data from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-fab-z-share.json";

const inputs = fixture.sources;
const slugs = ["fab-z-credit-card", "fab-share-platinum"] as const;
const rows = { "fab-z-credit-card": { amount: 105, network: "Mastercard", programme: "FAB Rewards" },
  "fab-share-platinum": { amount: 0, network: "Visa", programme: "SHARE points" } } as const;

test("FAB Z and SHARE Platinum: exact applicable membership fees, published salary and programme pins replay", () => {
  for (const slug of slugs) {
    const parsed = parseFabZShare(inputs, slug);
    assert.ok(parsed, slug);
    const card = data[slug];
    const t = FAB_Z_SHARE_PRODUCTS[slug];
    const art = inputs.find(s => s.id === t.key + "-card-art-source");
    const networkProof = fixture.networkProof.find(p => p.role === art?.id);
    assert.equal(networkProof?.url, art?.text.replaceAll("&amp;", "&"));
    assert.match(networkProof?.sha256 ?? "", /^[a-f0-9]{64}$/);
    assert.equal(card.network, networkProof?.network);
    assert.equal(card.network, rows[slug].network);
    assert.equal(card.name, parsed.name);
    assert.equal(card.annualFee.amount, rows[slug].amount);
    assert.equal(card.annualFee.amount, parsed.annualFee);
    assert.equal(card.vatPolicy, "inclusive");
    assert.equal(card.eligibility.publishedMinMonthlyIncome, parsed.publishedIncome);
    assert.equal(parsed.publishedIncome, 5000);
    assert.equal(card.loyaltyProgram, rows[slug].programme);
    assert.equal(card.loyaltyProgram, parsed.programme);
    assert.equal(card.applyUrl, parsed.productUrl);
    assert.equal(card.kfsUrl, parsed.kfsUrl);
    assert.equal(card.lastVerified, parsed.capturedDate);
    assert.deepEqual(card.sources, parsed.sources);
    assert.deepEqual(card._fieldEvidence, JSON.parse(JSON.stringify(parsed.evidence)));
    assert.equal(Object.hasOwn(card, "annualFeeWaiver"), parsed.yearOneWaived);
  }
});

test("FAB Z and SHARE Platinum: do not accept an unscoped tariff, mixed product, replacement programme or ambiguous waiver", () => {
  function mutate(id: string, from: string, to: string) {
    return inputs.map(s => {
      if (s.id !== id) return s;
      assert.ok(s.text.includes(from), id);
      const text = s.text.replace(from, to);
      return { ...s, text, fixtureTextSha256: createHash("sha256").update(text).digest("hex") };
    });
  }
  assert.equal(parseFabZShare(mutate("z-fee-row", "First year free", "First year uncertain"), slugs[0]), null);
  assert.equal(parseFabZShare(mutate("z-headline-fee", "first year", "first month"), slugs[0]), null);
  assert.equal(parseFabZShare(mutate("fab-z-share-fee-columns", "Inclusive", "Exclusive"), slugs[0]), null);
  assert.equal(parseFabZShare(mutate("z-programme", "FAB Rewards", "Cashback"), slugs[0]), null);
  assert.equal(parseFabZShare(mutate("share-title", "Platinum", "Signature"), slugs[1]), null);
  assert.equal(parseFabZShare(mutate("share-apply", "2FF9A945", "5DDC132D"), slugs[1]), null);
  assert.equal(parseFabZShare(mutate("share-salary", "Minimum Monthly Salary", "Indicative Salary"), slugs[1]), null);
  assert.equal(parseFabZShare(mutate("share-fee-row", "FAB SHARE Platinum", "FAB SHARE Infinite"), slugs[1]), null);
  assert.equal(parseFabZShare(inputs, "unreviewed"), null);
});

test("FAB Z and SHARE Platinum: never convert salary evidence, unavailable rates or a first-year waiver into ranked claims", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const confirmed = new Set(getEditorConfirmedCards().map(c => c.slug));
  const z = getCardData(slugs[0])!;
  const share = getCardData(slugs[1])!;
  for (const [slug, card] of [[slugs[0], z], [slugs[1], share]] as const) {
    assert.ok(active.has(slug));
    assert.ok(!confirmed.has(slug));
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.salaryTransferRequired, null);
    assert.equal(card.eligibility.residencyRequired, null);
    assert.equal(card.fxFee, null);
    assert.equal(card.joiningFee, undefined);
    assert.equal(card.welcomeBonus, "Welcome offer pending source review.");
    assert.equal(loyaltyTag(card.loyaltyProgram), "points");
    assert.equal(cardValueTerms(card, slug).rate, null);
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
    assert.equal(finderEvidence(card).salaryPending, true);
  }
  assert.equal(z.standardFeeConditions, "renewal-waiver");
  assert.equal(typeof z.annualFeeWaiver === "object" && z.annualFeeWaiver?.year_one_waived, true);
  assert.equal(annualFeeLabel(z).qual, "year 2+");
  assert.equal(annualFeeLabel(share).amount, "Free");
  const comparison = cardComparisonRows(z, share);
  assert.equal(comparison.find(row => row.key === "minSalary")?.winner, "none");
  assert.equal(comparison.find(row => row.key === "annualFee")?.winner, "none");
});
