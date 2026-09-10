import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFeeIndex, SALARY_TIERS, type CardForFeeIndex } from "../../src/lib/feeIndex.ts";
import { getActiveCards } from "../../src/lib/cardsData.ts";

function c(over: Partial<CardForFeeIndex> & { slug: string; fee: number; fx?: number; salary?: number }): CardForFeeIndex {
  return {
    slug: over.slug, name: over.name ?? over.slug, bank: over.bank ?? "bank",
    annualFee: { amount: over.fee, currency: "AED" },
    annualFeeWaiver: over.annualFeeWaiver,
    fxFee: over.fx ?? 2.99,
    eligibility: { minSalary: over.salary ?? 5000, invitationOnly: false },
    _provenance: over._provenance ?? {},
  };
}

test("headline aggregates on a fixture", () => {
  const idx = buildFeeIndex([
    c({ slug: "free-a", fee: 0, fx: 0 }),
    c({ slug: "free-b", fee: 0 }),
    c({ slug: "cheap", fee: 100, salary: 8000 }),
    c({ slug: "mid", fee: 400, salary: 15000, annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual" } }),
    c({ slug: "dear", fee: 2000, fx: 3.5, salary: 30000 }),
  ]);
  assert.equal(idx.total, 5);
  assert.equal(idx.freeForLife, 2);
  assert.equal(idx.freeShare, 0.4);
  assert.equal(idx.firstYearFree, 1, "only a structured year-one waiver on a paid card counts");
  assert.equal(idx.paidCount, 3);
  assert.equal(idx.medianFee, 100);
  assert.equal(idx.meanFee, 500);
  assert.equal(idx.medianPaidFee, 400);
  assert.equal(idx.highest!.slug, "dear");
  assert.equal(idx.lowestPaid!.slug, "cheap");
  assert.equal(idx.fxZero, 1);
  assert.equal(idx.medianFx, 2.99);
  assert.equal(idx.maxFx, 3.5);
  assert.deepEqual(idx.rows.map((r) => r.slug), ["free-a", "free-b", "cheap", "mid", "dear"], "cheapest first, 0% FX before 2.99% at the same fee");
});

test("salary tiers bucket on the verified minimum and skip unverified ones", () => {
  const idx = buildFeeIndex([
    c({ slug: "a", fee: 0, salary: 5000 }),
    c({ slug: "b", fee: 300, salary: 7999 }),
    c({ slug: "c", fee: 900, salary: 8000 }),
    c({ slug: "d", fee: 3000, salary: 40000 }),
    c({ slug: "e", fee: 500, salary: 5000, _provenance: { eligibility: "needs-review" } }),
  ]);
  const tier = Object.fromEntries(idx.bySalaryTier.map((t) => [t.label, t]));
  assert.equal(tier[SALARY_TIERS[1]!.label]!.cards, 2);
  assert.equal(tier[SALARY_TIERS[1]!.label]!.medianFee, 150);
  assert.equal(tier[SALARY_TIERS[2]!.label]!.cards, 1);
  assert.equal(tier[SALARY_TIERS[4]!.label]!.cards, 1);
  assert.equal(idx.rows.find((r) => r.slug === "e")!.minSalary, null);
  assert.equal(idx.bySalaryTier.reduce((n, t) => n + t.cards, 0), 4);
});

test("bank rows count every card once, most cards first", () => {
  const idx = buildFeeIndex([
    c({ slug: "a", fee: 0, bank: "enbd" }),
    c({ slug: "b", fee: 300, bank: "enbd" }),
    c({ slug: "c", fee: 900, bank: "adcb" }),
  ]);
  assert.deepEqual(idx.byBank.map((b) => [b.bank, b.cards, b.freeForLife, b.medianFee]), [["enbd", 2, 1, 150], ["adcb", 1, 0, 900]]);
});

test("the live index is the card set, row for row", () => {
  const cards = getActiveCards();
  const idx = buildFeeIndex(cards);
  assert.equal(idx.total, cards.length);
  assert.equal(idx.freeForLife + idx.paidCount, idx.total);
  assert.equal(idx.byBank.reduce((n, b) => n + b.cards, 0), idx.total);
  for (const row of idx.rows) {
    const card = cards.find((k) => k.slug === row.slug)!;
    assert.equal(row.annualFee, card.annualFee.amount, row.slug);
    assert.equal(row.fxFee, card.fxFee, row.slug);
  }
  for (let i = 1; i < idx.rows.length; i++) {
    assert.ok(idx.rows[i]!.annualFee >= idx.rows[i - 1]!.annualFee, "sorted by fee");
  }
});
