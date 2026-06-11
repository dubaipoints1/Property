// Phase 2a.2 (2026-05-20) — CardComparison helpers test.
//
// Tests the two pure helpers added in `src/lib/cardsDataFormat.ts`:
//
//   1. `shortCardLabel(card)` — strips known bank-name prefixes from
//      `card.name` so the comparison header reads as the card-only
//      label with the issuer acronym as a small eyebrow.
//   2. `cardComparisonRows(left, right)` — produces the canonical
//      6-row spec the `CardComparison.astro` component renders.
//
// Pulls the live Skywards Infinite vs Signature row data from
// `src/data/cards.json` so the snapshot stays anchored to the actual
// shipped data (this is the reference comparison; if either card's
// numbers change, the snapshot needs updating — that is the point).
//
// Run: node --import tsx --test tests/cards/card-comparison.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  shortCardLabel,
  cardComparisonRows,
  type CardForComparison,
} from "../../src/lib/cardsDataFormat";

const CARDS_PATH = path.join("src", "data", "cards.json");
const cards = JSON.parse(readFileSync(CARDS_PATH, "utf8")) as Record<
  string,
  CardForComparison & { _features?: unknown[] }
>;

// ── shortCardLabel ───────────────────────────────────────────────────────

test("shortCardLabel: strips ENBD prefix from Skywards Infinite", () => {
  const out = shortCardLabel({ name: "Emirates NBD Skywards Infinite" });
  assert.equal(out.shortName, "Skywards Infinite");
  assert.equal(out.acronym, "ENBD");
});

test("shortCardLabel: strips ENBD prefix from Skywards Signature", () => {
  const out = shortCardLabel({ name: "Emirates NBD Skywards Signature" });
  assert.equal(out.shortName, "Skywards Signature");
  assert.equal(out.acronym, "ENBD");
});

test("shortCardLabel: strips FAB prefix", () => {
  const out = shortCardLabel({ name: "FAB Etihad Guest Infinite" });
  assert.equal(out.shortName, "Etihad Guest Infinite");
  assert.equal(out.acronym, "FAB");
});

test("shortCardLabel: strips ADCB prefix", () => {
  const out = shortCardLabel({ name: "ADCB TouchPoints Platinum" });
  assert.equal(out.shortName, "TouchPoints Platinum");
  assert.equal(out.acronym, "ADCB");
});

test("shortCardLabel: strips Mashreq prefix", () => {
  const out = shortCardLabel({ name: "Mashreq Cashback Credit Card" });
  assert.equal(out.shortName, "Cashback Credit Card");
  assert.equal(out.acronym, "Mashreq");
});

test("shortCardLabel: strips CBD prefix", () => {
  const out = shortCardLabel({ name: "CBD Visa Infinite" });
  assert.equal(out.shortName, "Visa Infinite");
  assert.equal(out.acronym, "CBD");
});

test("shortCardLabel: unknown prefix returns full name + empty acronym", () => {
  const out = shortCardLabel({ name: "Some New Bank Premium Card" });
  assert.equal(out.shortName, "Some New Bank Premium Card");
  assert.equal(out.acronym, "");
});

// ── cardComparisonRows — Skywards Infinite vs Signature ──────────────────

test("cardComparisonRows: produces 6 rows in canonical order for Skywards pair", () => {
  const infinite = cards["emirates-nbd-skywards-infinite"];
  const signature = cards["emirates-nbd-skywards-signature"];
  assert.ok(infinite, "fixture: emirates-nbd-skywards-infinite must exist");
  assert.ok(signature, "fixture: emirates-nbd-skywards-signature must exist");

  const rows = cardComparisonRows(infinite, signature);

  assert.equal(rows.length, 6, "expected exactly 6 rows");
  assert.deepEqual(
    rows.map((r) => r.key),
    ["annualFee", "joiningFee", "minSalary", "topEarn", "welcome", "lounge"],
  );
});

test("cardComparisonRows: Signature wins fee / joining-fee / min-salary rows", () => {
  const rows = cardComparisonRows(
    cards["emirates-nbd-skywards-infinite"],
    cards["emirates-nbd-skywards-signature"],
  );

  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));

  // Signature is the right-hand card → "right" should win these three.
  assert.equal(byKey.annualFee.winner, "right");
  assert.equal(byKey.joiningFee.winner, "right");
  assert.equal(byKey.minSalary.winner, "right");
});

test("cardComparisonRows: Infinite wins topEarn + lounge rows", () => {
  const rows = cardComparisonRows(
    cards["emirates-nbd-skywards-infinite"],
    cards["emirates-nbd-skywards-signature"],
  );

  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));

  // Infinite top earn rate is 2× (dining / travel / partnerBrands tie at 2),
  // Signature top is 1.5× — left wins.
  assert.equal(byKey.topEarn.winner, "left");

  // Infinite lounge is DragonPass unlimited; Signature is DragonPass 6/yr.
  assert.equal(byKey.lounge.winner, "left");
});

test("cardComparisonRows: welcome bonus row never highlights a winner", () => {
  const rows = cardComparisonRows(
    cards["emirates-nbd-skywards-infinite"],
    cards["emirates-nbd-skywards-signature"],
  );
  const welcome = rows.find((r) => r.key === "welcome");
  assert.ok(welcome);
  assert.equal(
    welcome!.winner,
    "none",
    "welcome row carries no winner by design (temporal + bundled)",
  );
});

test("cardComparisonRows: AED values format with no fractional digits when integer", () => {
  const rows = cardComparisonRows(
    cards["emirates-nbd-skywards-infinite"],
    cards["emirates-nbd-skywards-signature"],
  );
  const fee = rows.find((r) => r.key === "annualFee")!;
  // Infinite annualFee.amount = 1575, an integer → no decimals.
  assert.match(fee.leftValue, /AED\s*1,575$/);
  assert.match(fee.rightValue, /AED\s*735$/);
});

test("cardComparisonRows: AED values keep 2dp when fractional (joining fee)", () => {
  const rows = cardComparisonRows(
    cards["emirates-nbd-skywards-infinite"],
    cards["emirates-nbd-skywards-signature"],
  );
  const join = rows.find((r) => r.key === "joiningFee")!;
  // 3148.95 / 1573.95 — both fractional.
  assert.match(join.leftValue, /3,148\.95$/);
  assert.match(join.rightValue, /1,573\.95$/);
});

test("cardComparisonRows: snapshot of Skywards Infinite vs Signature display values", () => {
  const rows = cardComparisonRows(
    cards["emirates-nbd-skywards-infinite"],
    cards["emirates-nbd-skywards-signature"],
  );

  // Map to a compact triple per row so the snapshot stays readable. If
  // the data or formatting drifts, this assertion surfaces exactly which
  // row regressed.
  // Normalise non-breaking spaces (` `, used by Intl.NumberFormat
  // for the AED-symbol separator) to ASCII spaces so the snapshot
  // remains readable in source. The component renders the NBSP as-is.
  const snapshot = rows.map((r) => ({
    key: r.key,
    left: r.leftValue.replace(/ /g, " "),
    right: r.rightValue.replace(/ /g, " "),
    winner: r.winner,
  }));

  assert.deepEqual(snapshot, [
    {
      key: "annualFee",
      left: "AED 1,575",
      right: "AED 735",
      winner: "right",
    },
    {
      key: "joiningFee",
      left: "AED 3,148.95",
      right: "AED 1,573.95",
      winner: "right",
    },
    {
      key: "minSalary",
      left: "AED 30,000/mo",
      right: "AED 12,000/mo",
      winner: "right",
    },
    {
      key: "topEarn",
      // earnRates: dining 2, travel 2, partnerBrands 2 — `topEarnEntry`
      // iterates in the fixed TOP_EARN_ITERATION_ORDER (dining first),
      // and breaks ties on first-hit, so "Dining 2×" wins the label.
      // The numeric value is what drives the winner-rule comparison.
      left: "Dining 2×",
      right: "Dining 1.5×",
      winner: "left",
    },
    {
      key: "welcome",
      left: "Up to 100,000 Skywards Miles + complimentary Rotana Rewards",
      right: "Up to 40,000 Skywards Miles + Visa lounge access",
      winner: "none",
    },
    {
      key: "lounge",
      left: "DragonPass — unlimited",
      right: "DragonPass — 6 visits/yr",
      winner: "left",
    },
  ]);
});

// ── Tie-breaking and edge cases ──────────────────────────────────────────

test("cardComparisonRows: identical annualFee resolves to a tie", () => {
  const a: CardForComparison = {
    name: "A",
    annualFee: { amount: 500 },
    eligibility: { minSalary: 10000 },
    earnRates: { everythingElse: 1, dining: 2 },
  };
  const b: CardForComparison = {
    name: "B",
    annualFee: { amount: 500 },
    eligibility: { minSalary: 10000 },
    earnRates: { everythingElse: 1, dining: 2 },
  };

  const rows = cardComparisonRows(a, b);
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.equal(byKey.annualFee.winner, "tie");
  assert.equal(byKey.minSalary.winner, "tie");
  assert.equal(byKey.topEarn.winner, "tie");
});

test("cardComparisonRows: joiningFee row is omitted when neither card has one", () => {
  const a: CardForComparison = {
    name: "A",
    annualFee: { amount: 0 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
  };
  const b: CardForComparison = {
    name: "B",
    annualFee: { amount: 0 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
  };

  const rows = cardComparisonRows(a, b);
  assert.equal(rows.find((r) => r.key === "joiningFee"), undefined);
});

test("cardComparisonRows: one-sided null joiningFee renders '—' and takes no winner highlight", () => {
  const noFee: CardForComparison = {
    name: "No published joining fee",
    annualFee: { amount: 0 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
  };
  const charged: CardForComparison = {
    name: "Charged",
    annualFee: { amount: 0 },
    joiningFee: { amount: 1500 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
  };

  const rows = cardComparisonRows(noFee, charged);
  const join = rows.find((r) => r.key === "joiningFee")!;
  assert.equal(join.leftValue, "—");
  assert.equal(join.rightValue.replace(/ /g, " "), "AED 1,500");
  // An unpublished fee is not a verified AED 0 — neither side may be
  // marked "better on this dimension".
  assert.equal(join.winner, "none");
});

test("cardComparisonRows: invitation-only card surfaces 'Invitation only' in min-salary row", () => {
  const invite: CardForComparison = {
    name: "Priority Banking",
    annualFee: { amount: 2625 },
    eligibility: { minSalary: 0, invitationOnly: true },
    earnRates: { everythingElse: 1 },
  };
  const open: CardForComparison = {
    name: "Open",
    annualFee: { amount: 500 },
    eligibility: { minSalary: 25000 },
    earnRates: { everythingElse: 1 },
  };

  const rows = cardComparisonRows(invite, open);
  const sal = rows.find((r) => r.key === "minSalary")!;
  assert.equal(sal.leftValue, "Invitation only");
  // Normalise the NBSP (U+00A0) that Intl.NumberFormat inserts between
  // the AED symbol and the number.
  assert.equal(sal.rightValue.replace(/ /g, " "), "AED 25,000/mo");
});

test("cardComparisonRows: free annualFee renders 'Free' instead of 'AED 0'", () => {
  const a: CardForComparison = {
    name: "Free A",
    annualFee: { amount: 0 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
  };
  const b: CardForComparison = {
    name: "Paid B",
    annualFee: { amount: 525 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
  };

  const rows = cardComparisonRows(a, b);
  const fee = rows.find((r) => r.key === "annualFee")!;
  assert.equal(fee.leftValue, "Free");
  assert.match(fee.rightValue, /AED\s*525$/);
  assert.equal(fee.winner, "left");
});

test("cardComparisonRows: lounge feature absent on one side renders 'None'", () => {
  const withLounge: CardForComparison = {
    name: "With",
    annualFee: { amount: 500 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
    _features: [
      {
        type: "lounge_access",
        network: "Priority Pass",
        scope: "unlimited",
      },
    ],
  };
  const without: CardForComparison = {
    name: "Without",
    annualFee: { amount: 500 },
    eligibility: { minSalary: 5000 },
    earnRates: { everythingElse: 1 },
    _features: [],
  };

  const rows = cardComparisonRows(withLounge, without);
  const lounge = rows.find((r) => r.key === "lounge")!;
  assert.equal(lounge.leftValue, "Priority Pass — unlimited");
  assert.equal(lounge.rightValue, "None");
  assert.equal(lounge.winner, "left");
});

// ── Negative case for CardComparison.astro (unknown slug) ───────────────
// The component itself throws at build time on unknown slugs (see
// CardComparison.astro line 38–48). That behaviour can't be exercised
// from node:test (the Astro virtual module isn't available); we anchor
// it via the data-layer expectation instead: a slug not in cards.json
// returns undefined from the underlying map. The Astro component's
// throw is the build-time guard.

test("cards.json: unknown slug returns undefined (basis for CardComparison's build-time guard)", () => {
  const card = cards["this-slug-does-not-exist"];
  assert.equal(card, undefined);
});

// ── §6 unit-integrity: top-earn row renders % for cashback, × for points ──
// Regression guard for the 2026-05-29 fix. Earn values are stored as bare
// numbers; cashback cards must render "5%" and points cards "5×". The
// cardComparisonRows top-earn row was the call-site missed in the first
// pass (caught at the Chairman gate) — these assertions lock both polarities.
// Anchored to live cards.json: citi-cashback (earnUnit "% cashback") and
// emirates-nbd-skywards-infinite (earnUnit "Skywards Miles per USD 1 spent").

test("cardComparisonRows: cashback card top-earn row renders % not ×", () => {
  const citi = cards["citi-cashback"];
  const skywards = cards["emirates-nbd-skywards-infinite"];
  assert.ok(citi && skywards, "fixture cards present in cards.json");
  const rows = cardComparisonRows(citi, skywards);
  const top = rows.find((r) => r.key === "topEarn")!;
  // citi-cashback is the left side — must carry a % and never a ×
  assert.match(top.leftValue, /%/);
  assert.doesNotMatch(top.leftValue, /×/);
});

test("cardComparisonRows: points card top-earn row renders × not %", () => {
  const citi = cards["citi-cashback"];
  const skywards = cards["emirates-nbd-skywards-infinite"];
  const rows = cardComparisonRows(citi, skywards);
  const top = rows.find((r) => r.key === "topEarn")!;
  // skywards is the right side (points per USD) — must carry × not %
  assert.match(top.rightValue, /×/);
  assert.doesNotMatch(top.rightValue, /%/);
});

// formatEarnValue / earnIsPercentage direct unit tests — the parenthetical
// "(EU/UK at 50%)" on a points card must NOT trip the % branch.
test("earnIsPercentage: starts-with-% and cashback are percentage; parenthetical % is not", async () => {
  const { earnIsPercentage, formatEarnValue } = await import(
    "../../src/lib/cardsDataFormat"
  );
  assert.equal(earnIsPercentage("% cashback"), true);
  assert.equal(earnIsPercentage("% as ENBD Plus Points (5% grocery)"), true);
  assert.equal(earnIsPercentage("AED cashback per AED 1 spent"), true);
  assert.equal(
    earnIsPercentage("Skywards Miles per USD 1 spent (EU/UK at 50%)"),
    false,
  );
  assert.equal(earnIsPercentage("ADCB TouchPoints per AED 1 spent"), false);
  assert.equal(earnIsPercentage("FAB Rewards per AED 1 spent"), false);
  assert.equal(earnIsPercentage(undefined, ["cashback"]), true);
  assert.equal(formatEarnValue(5, "% cashback"), "5%");
  assert.equal(formatEarnValue(2, "Skywards Miles per USD 1 spent"), "2×");
});

// annualFeeLabel — year-1 vs year-2 disambiguation. The bare AED figure
// on a card with a joining premium or a year-1 waiver must carry the
// "(year 2+)" qualifier so listing tiles don't contradict body text.
// Regression guard against the 1 June 2026 audit where the qualifier
// landed only on the row list (PR #199) but was missing on Top picks,
// SpecCard compact/row variant, and cashback/miles/islamic comparison
// tables.
// Note: Intl.NumberFormat returns an NBSP between "AED" and the digits;
// `normSpaces` collapses it to a regular space for readable assertions.
const normSpaces = (s: string) => s.replace(/\s+/g, " ");

test("annualFeeLabel: year-1 joining premium adds qualifier", async () => {
  const { annualFeeLabel } = await import("../../src/lib/cardsDataFormat");
  const card = {
    annualFee: { amount: 735 },
    joiningFee: { amount: 1575 },
  };
  const out = annualFeeLabel(card);
  assert.equal(normSpaces(out.amount), "AED 735");
  assert.equal(out.qual, "year 2+");
});

test("annualFeeLabel: year-1 waiver adds qualifier", async () => {
  const { annualFeeLabel } = await import("../../src/lib/cardsDataFormat");
  const card = {
    annualFee: { amount: 315 },
    annualFeeWaiver: { year_one_waived: true, ongoing_threshold_aed: null },
  };
  const out = annualFeeLabel(card);
  assert.equal(normSpaces(out.amount), "AED 315");
  assert.equal(out.qual, "year 2+");
});

test("annualFeeLabel: flat-fee card has no qualifier", async () => {
  const { annualFeeLabel } = await import("../../src/lib/cardsDataFormat");
  const card = { annualFee: { amount: 525 } };
  const out = annualFeeLabel(card);
  assert.equal(normSpaces(out.amount), "AED 525");
  assert.equal(out.qual, null);
});

test("annualFeeLabel: zero fee renders Free, no qualifier", async () => {
  const { annualFeeLabel } = await import("../../src/lib/cardsDataFormat");
  const card = { annualFee: { amount: 0 } };
  const out = annualFeeLabel(card);
  assert.equal(out.amount, "Free");
  assert.equal(out.qual, null);
});
