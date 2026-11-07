import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildFeeIndex, SALARY_TIERS, toRow, firstYearAnnualFeeStatus, firstYearAnnualFeeLabel, type CardForFeeIndex } from "../../src/lib/feeIndex.ts";
import { getActiveCards } from "../../src/lib/cardsData.ts";
import { cardFeeNeedsReview, compareKnownAnnualFees } from "../../src/lib/cardFeeProvenance.ts";

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
  assert.equal(idx.firstYearPending, 0);
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
  assert.equal(idx.freeForLife + idx.paidCount + idx.annualFeePending, idx.total);
  assert.equal(idx.byBank.reduce((n, b) => n + b.cards, 0), idx.total);
  for (const row of idx.rows) {
    const card = cards.find((k) => k.slug === row.slug)!;
    assert.equal(row.annualFee, cardFeeNeedsReview(card, "annualFee") ? null : card.annualFee.amount, row.slug);
    assert.equal(row.fxFee, card.fxFee, row.slug);
  }
  for (let i = 1; i < idx.rows.length; i++) {
    assert.ok(compareKnownAnnualFees(idx.rows[i - 1]!.annualFee, idx.rows[i]!.annualFee) <= 0, "known fees sorted before unknown, never zero substituted");
  }
});

test("held annual fees are excluded from annual aggregates; an empty known sample never becomes zero", () => {
  const unknown = c({ slug: "scraped-zero", fee: 0, _provenance: { annualFee: "scraped" } });
  const held = c({ slug: "held-positive", fee: 100, _provenance: { "annualFee.amount": "needs-review" } });
  const idx = buildFeeIndex([unknown, held]);
  assert.equal(idx.annualFeePending, 2); assert.equal(idx.annualFeeSampleSize, 0);
  assert.equal(idx.freeForLife, 0); assert.equal(idx.freeShare, null); assert.equal(idx.paidCount, 0);
  for (const value of [idx.medianFee, idx.meanFee, idx.medianPaidFee, idx.meanPaidFee, idx.highest, idx.lowestPaid, idx.byBank[0].medianFee]) assert.equal(value, null);
  const mixed = buildFeeIndex([unknown, held, c({ slug: "known-paid", fee: 400 })]);
  assert.equal(mixed.annualFeeSampleSize, 1); assert.equal(mixed.medianFee, 400); assert.equal(mixed.meanFee, 400);
  assert.equal(mixed.highest?.slug, "known-paid"); assert.equal(mixed.lowestPaid?.slug, "known-paid");
});

test("first-year annual-fee status is tri-state and held waiver/fee evidence never counts as waived", () => {
  const waiver = { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual" };
  const known = c({ slug: "known-waiver", fee: 100, annualFeeWaiver: waiver });
  assert.equal(firstYearAnnualFeeStatus(known), "waived");
  assert.equal(firstYearAnnualFeeLabel(toRow(known)), "Waived");
  for (const field of ["annualFeeWaiver", "annualFeeWaiver.year_one_waived", "annualFeeWaiver.year_one_waived.condition", "annualFee", "annualFee.amount", "vatPolicy"]) {
    const held = { ...known, slug: field, _provenance: { [field]: "needs-review" } };
    assert.equal(firstYearAnnualFeeStatus(held), "pending", field);
    assert.equal(firstYearAnnualFeeLabel(toRow(held)), "Pending", field);
    const idx = buildFeeIndex([held]);
    assert.equal(idx.firstYearFree, 0, field); assert.equal(idx.firstYearPending, 1, field);
  }
  assert.equal(firstYearAnnualFeeStatus(c({ slug: "standard", fee: 100 })), "standard");
  assert.equal(firstYearAnnualFeeLabel(toRow(c({ slug: "standard", fee: 100 }))), "Standard fee");
  assert.equal(firstYearAnnualFeeStatus(c({ slug: "untyped-waiver", fee: 100, annualFeeWaiver: "Conditional introductory terms" })), "pending");
});

test("annual-only labels do not infer free first-year total from a zero annual fee or a known annual waiver", () => {
  const unknownJoin = { joiningFee: "needs-review" };
  const zeroAnnual = c({ slug: "zero-annual-unknown-joining", fee: 0, _provenance: unknownJoin });
  assert.equal(firstYearAnnualFeeLabel(toRow(zeroAnnual)), "No annual fee listed");
  assert.doesNotMatch(firstYearAnnualFeeLabel(toRow(zeroAnnual)), /free|waived/i);
  const heldZero = { ...zeroAnnual, _provenance: { ...unknownJoin, annualFeeWaiver: "needs-review" } };
  assert.equal(firstYearAnnualFeeLabel(toRow(heldZero)), "Pending");
  const annualWaived = c({ slug: "annual-waiver-unknown-joining", fee: 100, annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual" }, _provenance: unknownJoin });
  assert.equal(firstYearAnnualFeeStatus(annualWaived), "waived", "joining uncertainty does not erase a separately known annual waiver");
  assert.equal(buildFeeIndex([annualWaived]).firstYearFree, 1);
});

test("actual fee-page cell executes the shared status formatter and pending live partial profiles do not become charged", () => {
  const source = readFileSync("src/pages/cards/fees.astro", "utf8");
  const expression = source.match(/<td>\{(firstYearAnnualFeeLabel\(r\))\}<\/td>/)?.[1];
  assert.ok(expression, "actual page cell must call the tested formatter");
  const evaluate = new Function("r", "firstYearAnnualFeeLabel", `"use strict"; return (${expression});`);
  const annualExpression = source.match(/<td class="num">\{(r\.annualFee === null \? "Pending"[^\n]+)\}<\/td>/)?.[1];
  assert.ok(annualExpression, "actual annual-fee cell must distinguish null before any zero branch");
  const evaluateAnnual = new Function("r", "aed", `return (${annualExpression});`);
  const cards = getActiveCards(), idx = buildFeeIndex(cards);
  const held = cards.filter(card => card._provenance.annualFeeWaiver === "needs-review");
  assert.ok(held.length > 0);
  for (const card of held) {
    const row = idx.rows.find(row => row.slug === card.slug)!;
    assert.equal(evaluate(row, firstYearAnnualFeeLabel), "Pending", card.slug);
  }
  const classic = idx.rows.find(row => row.slug === "adib-smiles-visa-classic")!;
  assert.ok(classic); assert.equal(evaluate(classic, firstYearAnnualFeeLabel), "Pending");
  assert.equal(evaluateAnnual(classic, () => { throw new Error("unknown fee must not reach numeric formatter"); }), "Pending");
  const cash = idx.rows.find(row => row.slug === "hsbc-cash-plus")!;
  assert.equal(evaluate(cash, firstYearAnnualFeeLabel), "Waived", "the independently accepted annual-fee waiver remains visible");
  assert.equal(idx.firstYearPending, idx.rows.filter(row => row.firstYearAnnualFeeStatus === "pending").length);
  assert.equal(idx.firstYearFree, idx.rows.filter(row => row.firstYearAnnualFeeStatus === "waived").length);
  assert.match(source, /<th>First-year annual fee<\/th>/);
  assert.match(source, /<dt>Year-one annual fee waived<\/dt>/);
  assert.match(source, /not joining charges, interest or total first-year cost/);
  assert.doesNotMatch(source, /r\.firstYearWaived|<th>First year<\/th>|<dt>First year free<\/dt>/);
});
