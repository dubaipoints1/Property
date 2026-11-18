import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DIB_PRIME, parseDibPrime } from "../../scripts/scrape/_dib-prime";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { finderEvidence } from "../../src/lib/finderEvidence";
import { cardComparisonRows } from "../../src/lib/cardsDataFormat";
import data from "../../src/data/cards.json";
import html from "./fixtures/2026-11-dib-prime.json";
import pdf from "./fixtures/2026-11-dib-wave-two.json";

const inputs = [...html.sources, ...pdf.sources];
const bySlug = { "dib-prime-gold": 5000, "dib-prime-signature": 15000, "dib-prime-infinite": 20000 } as const;
type Source = (typeof inputs)[number];
function alter(id: string, fn: (s: Source) => Source) {
  return inputs.map(source => {
    if (source.id !== id) return source;
    const changed = fn(source);
    return { ...changed, fixtureTextSha256: createHash("sha256").update(changed.text).digest("hex") };
  });
}

test("DIB Prime: named application, annual fees and published salary regenerate from pinned sources", () => {
  for (const slug of Object.keys(DIB_PRIME) as Array<keyof typeof DIB_PRIME>) {
    const parsed = parseDibPrime(inputs, slug);
    assert.ok(parsed, slug);
    const card = data[slug];
    assert.equal(card.name, "DIB " + parsed.name);
    assert.equal(card.annualFee.amount, 0);
    assert.equal(card.annualFee.amount, parsed.annualFee);
    assert.equal(card.applyUrl, parsed.productUrl);
    assert.equal(card.kfsUrl, parsed.kfsUrl);
    assert.equal(card.lastVerified, parsed.capturedDate);
    assert.deepEqual(card.sources, parsed.sources);
    assert.equal(card.refreshMode, "manual-primary");
    assert.ok(card.sources.includes(parsed.application));
    assert.equal(card.eligibility.publishedMinMonthlyIncome, parsed.income);
    assert.equal(parsed.income, bySlug[slug]);
    assert.deepEqual(card._fieldEvidence, JSON.parse(JSON.stringify(parsed.evidence)));
  }
});

test("DIB Prime: mismatched applications, generic salary copy and unlabelled terms cannot pass", () => {
  const gold = "dib-prime-gold", signature = "dib-prime-signature", infinite = "dib-prime-infinite";
  const replacing = (a: string, b: string) => (s: Source) => ({ ...s, text: s.text.replace(a, b) });
  assert.equal(parseDibPrime(alter("prime-signature-landing", replacing("Signature", "Infinite")), signature), null);
  assert.equal(parseDibPrime(alter("prime-infinite-apply", replacing("prime-infinite-card", "prime-signature-card")), infinite), null);
  assert.equal(parseDibPrime(alter("prime-infinite-salary", s => ({ ...s, sourceStartByte: s.sourceStartByte! + 5000 })), infinite), null);
  assert.equal(parseDibPrime(alter("prime-signature-salary", replacing("Minimum Salary", "Generic Salary")), signature), null);
  assert.equal(parseDibPrime(alter("prime-gold-annual-fee", replacing("Annual Fee", "Joining Fee")), gold), null);
  assert.equal(parseDibPrime(alter("soc-fees", replacing("Reward/Gold", "Reward")), gold), null);
  assert.equal(parseDibPrime(alter("kfs-fees", replacing("‪Nil‬", "‪500‬")), infinite), null);
  assert.equal(parseDibPrime(inputs.filter(s => s.id !== "prime-gold-landing"), gold), null);
  assert.equal(parseDibPrime(inputs, "dib-prime-classic"), null);
});

test("DIB Prime: listing coverage is not eligibility or rewards advice", () => {
  const active = new Set(getActiveCards().map(c => c.slug));
  const confirmed = new Set(getEditorConfirmedCards().map(c => c.slug));
  for (const slug of Object.keys(bySlug)) {
    const card = getCardData(slug)!;
    assert.ok(active.has(slug));
    assert.ok(!confirmed.has(slug));
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.salaryTransferRequired, null);
    assert.equal(card.eligibility.residencyRequired, null);
    assert.equal(card.fxFee, null);
    assert.equal(card.joiningFee, undefined);
    assert.equal(Object.hasOwn(data[slug as keyof typeof bySlug], "welcomeBonus"), false);
    assert.equal(card.welcomeBonus, "Welcome offer pending source review.");
    assert.deepEqual(finderEvidence(card).rankRates, {});
    assert.equal(finderEvidence(card).fallbackPending, true);
    assert.equal(finderEvidence(card).salaryPending, true);
    const rows = cardComparisonRows(card, getCardData("dib-prime-platinum")!);
    assert.equal(rows.find(row => row.key === "minSalary")?.winner, "none");
    assert.equal(rows.find(row => row.key === "annualFee")?.winner, "tie");
  }
});
