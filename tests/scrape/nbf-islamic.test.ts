import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { NBF_ISLAMIC, parseNbfIslamic } from "../../scripts/scrape/_nbf-islamic";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { loyaltyTag } from "../../src/lib/cardsDataFormat";
import data from "../../src/data/cards.json";
import fixture from "./fixtures/2026-11-nbf-islamic.json";

const inputs = fixture.sources;
const infinite = "nbf-islamic-visa-infinite";
const platinum = "nbf-islamic-platinum-exclusive";
type Source = typeof inputs[number];
const alter = (id: string, fn: (source: Source) => Source) => inputs.map(source => {
  if (source.id !== id) return source;
  const changed = fn(source);
  return { ...changed, fixtureTextSha256: createHash("sha256").update(changed.text).digest("hex") };
});

test("NBF Islamic: the exact products and named disclosures reproduce the shipped scoped data", () => {
  for (const slug of Object.keys(NBF_ISLAMIC) as Array<keyof typeof NBF_ISLAMIC>) {
    const parsed = parseNbfIslamic(inputs, slug);
    assert.ok(parsed, slug);
    const card = data[slug];
    assert.equal(card.name, parsed.name);
    assert.equal(card.network, parsed.network);
    assert.equal(card.annualFee.amount, parsed.annualFee);
    assert.equal(card.applyUrl, parsed.productUrl);
    assert.equal(card.kfsUrl, parsed.kfsUrl);
    assert.equal(card.lastVerified, parsed.capturedDate);
    assert.deepEqual(card.sources, parsed.sources);
    assert.equal(card.refreshMode, "manual-primary");
    assert.deepEqual(card._fieldEvidence, JSON.parse(JSON.stringify(parsed.evidence)));
    assert.equal(card.loyaltyProgram, parsed.loyaltyProgram);
    if (slug === infinite) {
      assert.ok(parsed.priority);
      assert.equal(parsed.income, 40000);
      assert.equal(Object.hasOwn(card.eligibility, "publishedMinMonthlyIncome"), false);
      assert.equal(card._dataIssues.eligibility, "The issuer lists AED " + new Intl.NumberFormat("en-GB").format(parsed.income) + " monthly salary or NBF Priority status. Other criteria apply. Neither route guarantees approval.");
    } else {
      assert.equal(parsed.priority, false);
      assert.equal(parsed.income, 9000);
      assert.equal(data[platinum].eligibility.publishedMinMonthlyIncome, parsed.income);
      assert.equal(data[platinum].eligibility.publishedIncomeBasis, "salaried-applicants");
    }
  }
});

test("NBF Islamic: blocked on wrong product, application, network, eligibility alternatives or fee scope", () => {
  const replacing = (a: string, b: string) => (s: Source) => ({ ...s, text: s.text.replace(a, b) });
  assert.equal(parseNbfIslamic(alter("nbf-islamic-infinite-apply", replacing("infinite-credit-card", "platinum-exclusive-credit-card")), infinite), null);
  assert.equal(parseNbfIslamic(alter("nbf-islamic-platinum-kfs-title", replacing("PLATINUM", "INFINITE")), platinum), null);
  assert.equal(parseNbfIslamic(alter("nbf-islamic-platinum-kfs-network", replacing("Visa", "Mastercard")), platinum), null);
  assert.equal(parseNbfIslamic(alter("nbf-islamic-infinite-kfs-salary", replacing(" or priority status with NBF", "")), infinite), null);
  assert.equal(parseNbfIslamic(alter("nbf-islamic-platinum-kfs-salary", replacing("9000", "9000 or priority status with NBF")), platinum), null);
  assert.equal(parseNbfIslamic(alter("nbf-islamic-platinum-kfs-fee", s => ({ ...s, sourceScope: "PDF page 2" })), platinum), null);
  assert.equal(parseNbfIslamic(alter("nbf-islamic-infinite-kfs-fee", replacing("Annual fee", "Joining fee")), infinite), null);
  assert.equal(parseNbfIslamic(inputs, "nbf-visa-infinite"), null);
});

test("NBF Islamic: listed in catalogue, never recommended by salary or unsourced rewards", () => {
  const active = new Set(getActiveCards().map(card => card.slug));
  const confirmed = new Set(getEditorConfirmedCards().map(card => card.slug));
  for (const slug of [infinite, platinum] as const) {
    const card = getCardData(slug)!;
    assert.ok(active.has(slug));
    assert.ok(!confirmed.has(slug));
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.salaryTransferRequired, null);
    assert.equal(card.eligibility.residencyRequired, null);
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.equal(card.fxFee, null);
    assert.equal(card.joiningFee, undefined);
    assert.equal(Object.hasOwn(data[slug], "welcomeBonus"), false);
    assert.equal(loyaltyTag(card.loyaltyProgram), "points");
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
    assert.equal(finderEvidence(card).salaryPending, true);
  }
});
