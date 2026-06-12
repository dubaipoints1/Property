// Phase 2a.0 (2026-05-20) — schema additions test.
//
// Pins the contract for the four new fields that landed in
// `src/lib/cardsData.ts` ahead of Phase 2a's per-bank passes:
//
//   1. `joiningFee?: { amount: number; currency: "AED" }`
//   2. `eligibility.invitationOnly: boolean` (default false)
//   3. `discontinuedForNewApplicants?: { date: YYYY-MM-DD; note?: string ≤200 }`
//   4. `welcomeBonus.headline?: string ≤90 chars`
//
// Implementation note: src/lib/cardsData.ts imports `z` from
// `astro:content`, which isn't resolvable under plain tsx. We therefore
// validate the JSON shape with a local schema mirror. The full Zod
// validate path is exercised by `astro check`.
//
// Run: node --import tsx --test tests/cards/schema-2a-0.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const CARDS_PATH = path.join("src", "data", "cards.json");
const cardsRaw = readFileSync(CARDS_PATH, "utf8");
const cards = JSON.parse(cardsRaw) as Record<string, unknown>;

// ─── Local Zod mirror of the Phase 2a.0 additions ────────────────────────
// Mirrors the relevant slice of `CardDataSchema` in cardsData.ts. Keeps
// the contract pinned: a schema regression in the source file would not
// be caught by the JSON-only assertions below but would fail `astro
// check` separately.

const JoiningFee = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("AED").default("AED"),
});

const Eligibility2a0 = z
  .object({
    minSalary: z.number().nonnegative(),
    salaryTransferRequired: z.boolean(),
    residencyRequired: z.boolean(),
    invitationOnly: z.boolean().default(false),
  })
  .passthrough();

const Discontinued = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
});

const WelcomeBonus2a0 = z
  .object({
    amount: z.number().nonnegative(),
    unit: z.string(),
    spend_threshold_aed: z.number().nonnegative().nullable(),
    qualify_window_days: z.number().int().positive().nullable(),
    headline: z.string().max(90).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

const MinimalCard2a0 = z
  .object({
    annualFee: z.object({
      amount: z.number().nonnegative(),
      currency: z.literal("AED").default("AED"),
    }),
    joiningFee: JoiningFee.optional(),
    eligibility: Eligibility2a0,
    discontinuedForNewApplicants: Discontinued.optional(),
    // Welcome bonus accepts the structured-object shape, a legacy
    // string, or null. We *don't* fall through to a permissive record
    // type — the headline cap must be enforced when the shape is the
    // structured one.
    welcomeBonus: z
      .union([WelcomeBonus2a0, z.string()])
      .nullable()
      .optional(),
  })
  .passthrough();

const AllCards2a0 = z.record(z.string(), MinimalCard2a0);

// ─── Positive-case fixtures ──────────────────────────────────────────────
// Four fixture cards exercising each of the four schema additions.

test("schema-2a-0: parses fixture card with joiningFee", () => {
  const fixture = {
    bank: "fixture-bank",
    name: "Fixture Card With Joining Fee",
    network: "Visa",
    annualFee: { amount: 1575, currency: "AED" },
    joiningFee: { amount: 3148.95, currency: "AED" },
    fxFee: 1.99,
    earnRates: { everythingElse: 1 },
    eligibility: {
      minSalary: 30000,
      salaryTransferRequired: false,
      residencyRequired: true,
      employmentTypes: ["salaried"],
    },
    sources: ["https://example.com"],
    lastVerified: "2026-05-20",
    _lastReviewed: "2026-05-20",
  };
  const result = MinimalCard2a0.parse(fixture);
  assert.ok(result.joiningFee);
  assert.equal(result.joiningFee!.amount, 3148.95);
  assert.equal(result.joiningFee!.currency, "AED");
});

test("schema-2a-0: parses fixture card with invitationOnly = true", () => {
  const fixture = {
    annualFee: { amount: 0, currency: "AED" },
    eligibility: {
      minSalary: 0,
      salaryTransferRequired: false,
      residencyRequired: true,
      invitationOnly: true,
    },
  };
  const result = MinimalCard2a0.parse(fixture);
  assert.equal(result.eligibility.invitationOnly, true);
  assert.equal(result.eligibility.minSalary, 0);
});

test("schema-2a-0: parses fixture card with discontinuedForNewApplicants", () => {
  const fixture = {
    annualFee: { amount: 0, currency: "AED" },
    eligibility: {
      minSalary: 5000,
      salaryTransferRequired: false,
      residencyRequired: true,
    },
    discontinuedForNewApplicants: {
      date: "2025-06-01",
      note: "Closed to new applications. Existing cardholders retain all benefits.",
    },
  };
  const result = MinimalCard2a0.parse(fixture);
  assert.ok(result.discontinuedForNewApplicants);
  assert.equal(result.discontinuedForNewApplicants!.date, "2025-06-01");
  assert.match(
    result.discontinuedForNewApplicants!.note ?? "",
    /Existing cardholders retain/,
  );
});

test("schema-2a-0: parses fixture card with welcomeBonus.headline", () => {
  const fixture = {
    annualFee: { amount: 1575, currency: "AED" },
    eligibility: {
      minSalary: 25000,
      salaryTransferRequired: true,
      residencyRequired: true,
    },
    welcomeBonus: {
      amount: 200000,
      unit: "marriott_bonvoy_points",
      spend_threshold_aed: 55000,
      qualify_window_days: 90,
      headline:
        "200,000 Marriott Bonvoy points (100k on activation + 100k on US$15k spend)",
      notes:
        "100,000 Marriott Bonvoy points on activation + 100,000 bonus on USD$15,000 spend in first 3 billing statements.",
    },
  };
  const result = MinimalCard2a0.parse(fixture);
  const wb = result.welcomeBonus as { headline?: string };
  assert.ok(wb.headline);
  assert.ok(wb.headline!.length <= 90);
  assert.match(wb.headline!, /Marriott Bonvoy/);
});

// ─── Negative-case fixtures ──────────────────────────────────────────────

test("schema-2a-0: rejects invalid date format on discontinuedForNewApplicants", () => {
  const fixture = {
    annualFee: { amount: 0, currency: "AED" },
    eligibility: {
      minSalary: 5000,
      salaryTransferRequired: false,
      residencyRequired: true,
    },
    discontinuedForNewApplicants: {
      // ISO date regex requires YYYY-MM-DD — this should fail.
      date: "01/06/2025",
      note: "Bad date format",
    },
  };
  const result = MinimalCard2a0.safeParse(fixture);
  assert.equal(result.success, false);
});

test("schema-2a-0: rejects welcomeBonus.headline longer than 90 chars", () => {
  const fixture = {
    annualFee: { amount: 0, currency: "AED" },
    eligibility: {
      minSalary: 5000,
      salaryTransferRequired: false,
      residencyRequired: true,
    },
    welcomeBonus: {
      amount: 100,
      unit: "aed_voucher",
      spend_threshold_aed: 0,
      qualify_window_days: null,
      // 91 characters — exceeds the ≤90 cap.
      headline:
        "x".repeat(91),
    },
  };
  const result = MinimalCard2a0.safeParse(fixture);
  assert.equal(result.success, false);
});

test("schema-2a-0: rejects invitationOnly as a string", () => {
  const fixture = {
    annualFee: { amount: 0, currency: "AED" },
    eligibility: {
      minSalary: 0,
      salaryTransferRequired: false,
      residencyRequired: true,
      // String instead of boolean — should fail Zod typing.
      invitationOnly: "true",
    },
  };
  const result = MinimalCard2a0.safeParse(fixture);
  assert.equal(result.success, false);
});

test("schema-2a-0: rejects joiningFee with negative amount", () => {
  const fixture = {
    annualFee: { amount: 1575, currency: "AED" },
    eligibility: {
      minSalary: 30000,
      salaryTransferRequired: false,
      residencyRequired: true,
    },
    joiningFee: { amount: -100, currency: "AED" },
  };
  const result = MinimalCard2a0.safeParse(fixture);
  assert.equal(result.success, false);
});

// ─── Whole-file migration sanity ─────────────────────────────────────────
// Pins the migration counts so a future edit that drops one of the
// Phase 2a.0 fields is caught by the test suite. Numbers come straight
// from the brief's spec.

test("schema-2a-0: cards.json validates against the augmented schema", () => {
  const result = AllCards2a0.safeParse(cards);
  assert.ok(
    result.success,
    `cards.json failed 2a.0 schema validation: ${
      result.success ? "" : JSON.stringify(result.error.format(), null, 2)
    }`,
  );
});

test("schema-2a-0: 9 cards carry joiningFee", () => {
  // 9th added 2026-06-11: etihad-guest-elevate AED 2,625 joining fee,
  // verified against the live product page + May 2026 KFS (both agree).
  const slugs = Object.entries(cards)
    .filter(([, c]) => (c as { joiningFee?: unknown }).joiningFee !== undefined)
    .map(([s]) => s);
  assert.equal(
    slugs.length,
    9,
    `Expected 9 cards with joiningFee, got ${slugs.length}: ${slugs.join(", ")}`,
  );
});

test("schema-2a-0: 2 cards carry eligibility.invitationOnly = true", () => {
  const slugs = Object.entries(cards)
    .filter(
      ([, c]) =>
        (c as { eligibility?: { invitationOnly?: boolean } }).eligibility
          ?.invitationOnly === true,
    )
    .map(([s]) => s);
  assert.deepEqual(
    slugs.sort(),
    [
      "emirates-nbd-priority-banking-visa-infinite",
      "fab-world-elite",
    ].sort(),
  );
});

test("schema-2a-0: Manchester United is the sole discontinued card", () => {
  const slugs = Object.entries(cards)
    .filter(
      ([, c]) =>
        (c as { discontinuedForNewApplicants?: unknown })
          .discontinuedForNewApplicants !== undefined,
    )
    .map(([s]) => s);
  assert.deepEqual(slugs, ["emirates-nbd-manchester-united"]);
  const mu = cards["emirates-nbd-manchester-united"] as {
    discontinuedForNewApplicants: { date: string; note?: string };
  };
  assert.equal(mu.discontinuedForNewApplicants.date, "2025-06-01");
});

test("schema-2a-0: every welcomeBonus with notes > 90 chars carries a headline", () => {
  const missing: string[] = [];
  for (const [slug, card] of Object.entries(cards)) {
    const wb = (card as { welcomeBonus?: unknown }).welcomeBonus;
    if (
      wb &&
      typeof wb === "object" &&
      !Array.isArray(wb) &&
      "notes" in wb &&
      typeof (wb as { notes?: string }).notes === "string"
    ) {
      const notes = (wb as { notes: string }).notes;
      const headline = (wb as { headline?: string }).headline;
      if (notes.length > 90 && !headline) {
        missing.push(slug);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    `Cards with verbose welcomeBonus notes but no headline: ${missing.join(", ")}`,
  );
});
