// Phase 2a.2.2 (2026-05-20) — AtAGlance helpers test.
//
// AtAGlance.astro is a thin render layer over three pure helpers from
// `src/lib/cardsDataFormat.ts`:
//
//   - `formatAED(amount)` — canonical AED formatter
//   - `topEarnEntry(earnRates)` — canonical "headline earn rate" picker
//   - `CATEGORY_LABELS_FOR_TOP` — label map for the qualifier line
//
// We test the helpers (not the Astro render — the `astro:content`
// virtual module isn't available under node:test) plus the small
// inline label-resolution logic AtAGlance.astro does on top of them
// (Free / Invitation only / No minimum fallbacks). The logic is
// mirrored here so the test stays anchored even if the .astro file's
// JSX changes shape.
//
// Run: node --import tsx --test tests/cards/at-a-glance.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  formatAED,
  topEarnEntry,
  CATEGORY_LABELS_FOR_TOP,
} from "../../src/lib/cardsDataFormat";

// ── Fixture: live cards.json so the reference pair stays anchored ───────

const CARDS_PATH = path.join("src", "data", "cards.json");
const cards = JSON.parse(readFileSync(CARDS_PATH, "utf8")) as Record<
  string,
  {
    name: string;
    annualFee: { amount: number };
    eligibility: { minSalary: number; invitationOnly?: boolean };
    earnRates: Record<string, unknown>;
  }
>;

// Normalise the NBSP (U+00A0) that Intl.NumberFormat inserts between
// the AED symbol and the number into an ASCII space so the snapshot
// assertions remain readable in source. The component renders the
// NBSP as-is (correct behaviour for typography).
function normaliseNbsp(s: string): string {
  return s.replace(/ /g, " ");
}

// ── Mirror of the AtAGlance.astro inline resolution logic ───────────────
//
// Keep these in lock-step with the resolver block in
// `src/components/cards/AtAGlance.astro`. If the Astro component's
// behaviour changes (e.g. new fallback for `minSalary === 0` +
// `invitationOnly`), update both.

function annualFeeLabelFor(amount: number): string {
  return amount === 0 ? "Free" : formatAED(amount);
}

function minSalaryLabelFor(
  minSalary: number,
  invitationOnly: boolean | undefined,
): string {
  if (invitationOnly === true) return "Invitation only";
  if (minSalary === 0) return "No minimum";
  return `${formatAED(minSalary)}/mo`;
}

// ── Skywards Infinite ───────────────────────────────────────────────────

test("AtAGlance: Skywards Infinite — annual fee renders as 'AED 1,575'", () => {
  const card = cards["emirates-nbd-skywards-infinite"];
  assert.ok(card, "fixture: emirates-nbd-skywards-infinite must exist");
  const label = normaliseNbsp(annualFeeLabelFor(card.annualFee.amount));
  assert.equal(label, "AED 1,575");
});

test("AtAGlance: Skywards Infinite — min salary renders as 'AED 30,000/mo'", () => {
  const card = cards["emirates-nbd-skywards-infinite"];
  const label = normaliseNbsp(
    minSalaryLabelFor(
      card.eligibility.minSalary,
      card.eligibility.invitationOnly,
    ),
  );
  assert.equal(label, "AED 30,000/mo");
});

test("AtAGlance: Skywards Infinite — top earn rate is Dining 2× (first-hit tie)", () => {
  const card = cards["emirates-nbd-skywards-infinite"];
  const top = topEarnEntry(card.earnRates);
  assert.ok(top, "expected a top earn entry");
  // earnRates: dining 2, travel 2, partnerBrands 2 — the canonical
  // iteration order puts dining first, so dining wins the tie.
  assert.equal(top!.key, "dining");
  assert.equal(top!.value, 2);
  assert.equal(CATEGORY_LABELS_FOR_TOP[top!.key], "Dining");
});

// ── Skywards Signature ──────────────────────────────────────────────────

test("AtAGlance: Skywards Signature — annual fee renders as 'AED 735'", () => {
  const card = cards["emirates-nbd-skywards-signature"];
  assert.ok(card, "fixture: emirates-nbd-skywards-signature must exist");
  const label = normaliseNbsp(annualFeeLabelFor(card.annualFee.amount));
  assert.equal(label, "AED 735");
});

test("AtAGlance: Skywards Signature — min salary renders as 'AED 12,000/mo'", () => {
  const card = cards["emirates-nbd-skywards-signature"];
  const label = normaliseNbsp(
    minSalaryLabelFor(
      card.eligibility.minSalary,
      card.eligibility.invitationOnly,
    ),
  );
  assert.equal(label, "AED 12,000/mo");
});

test("AtAGlance: Skywards Signature — top earn rate is Dining 1.5× (first-hit tie)", () => {
  const card = cards["emirates-nbd-skywards-signature"];
  const top = topEarnEntry(card.earnRates);
  assert.ok(top, "expected a top earn entry");
  // earnRates: dining 1.5, travel 1.5, partnerBrands 1.5 — dining
  // wins on iteration order.
  assert.equal(top!.key, "dining");
  assert.equal(top!.value, 1.5);
  assert.equal(CATEGORY_LABELS_FOR_TOP[top!.key], "Dining");
});

// ── Free-card fallback ──────────────────────────────────────────────────

test("AtAGlance: annual fee 0 renders as 'Free' (not 'AED 0')", () => {
  assert.equal(annualFeeLabelFor(0), "Free");
});

// ── Invitation-only fallback ────────────────────────────────────────────

test("AtAGlance: invitationOnly=true returns 'Invitation only' regardless of minSalary", () => {
  assert.equal(minSalaryLabelFor(0, true), "Invitation only");
  assert.equal(minSalaryLabelFor(250000, true), "Invitation only");
  assert.equal(minSalaryLabelFor(50000, true), "Invitation only");
});

// ── No-minimum fallback ─────────────────────────────────────────────────

test("AtAGlance: minSalary=0 + invitationOnly=false returns 'No minimum'", () => {
  assert.equal(minSalaryLabelFor(0, false), "No minimum");
});

test("AtAGlance: minSalary=0 + invitationOnly=undefined returns 'No minimum'", () => {
  assert.equal(minSalaryLabelFor(0, undefined), "No minimum");
});

// ── Top-earn-omitted case ───────────────────────────────────────────────

test("AtAGlance: card with only everythingElse:1 returns null from topEarnEntry", () => {
  // `everythingElse` is intentionally excluded from TOP_EARN_ITERATION_ORDER —
  // it's the base rate, not a "top" headline. A card with no boosted
  // categories yields a null top entry, and AtAGlance omits the third tile.
  const top = topEarnEntry({ everythingElse: 1 });
  assert.equal(top, null);
});

test("AtAGlance: card with no recognised earn keys returns null", () => {
  // Empty earnRates also yields null.
  const top = topEarnEntry({});
  assert.equal(top, null);
});

// ── formatAED edge cases ────────────────────────────────────────────────

test("AtAGlance: formatAED handles integer amounts with no fractional digits", () => {
  assert.match(normaliseNbsp(formatAED(1575)), /^AED 1,575$/);
  assert.match(normaliseNbsp(formatAED(735)), /^AED 735$/);
});

test("AtAGlance: formatAED keeps 2dp on fractional amounts", () => {
  assert.match(normaliseNbsp(formatAED(3148.95)), /^AED 3,148\.95$/);
});
