// Phase 2a.2.3 (2026-05-20) — scorecard frontmatter schema test.
//
// Pins the contract for the five new fields that landed in
// `src/content.config.ts` for the `cards` collection:
//
//   1. `kicker?: string` (≤ 200 chars — see schema comment for the bump
//      from the brief's original 160 ceiling to fit the Standards-Editor
//      Skywards Infinite reference copy)
//   2. `tier?: "editors-pick" | "strong" | "solid" | "niche" | "skip"`
//   3. `scores?: { welcomeValue?, earnRate?, perks?, feeValue?, access? }`
//      — each a number 0–5 in 0.5 steps
//   4. `applyIf?: string` (≤ 120 chars)
//   5. `skipIf?: string`  (≤ 120 chars)
//
// Implementation note: `src/content.config.ts` imports `z` from
// `astro:content`, which isn't resolvable under plain tsx. We therefore
// mirror the relevant schema slice locally — the same separation pattern
// `schema-2a-0.test.ts` already follows.
//
// Run: node --import tsx --test tests/content/scorecard-schema.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// ─── Local Zod mirror of the Phase 2a.2.3 additions ──────────────────────

const TIER = z.enum(["editors-pick", "strong", "solid", "niche", "skip"]);

const ScoreDimensions = z.object({
  welcomeValue: z.number().min(0).max(5).multipleOf(0.5).optional(),
  earnRate: z.number().min(0).max(5).multipleOf(0.5).optional(),
  perks: z.number().min(0).max(5).multipleOf(0.5).optional(),
  feeValue: z.number().min(0).max(5).multipleOf(0.5).optional(),
  access: z.number().min(0).max(5).multipleOf(0.5).optional(),
});

const CardFrontmatter = z.object({
  slug: z.string(),
  kicker: z.string().max(200).optional(),
  tier: TIER.optional(),
  scores: ScoreDimensions.optional(),
  applyIf: z.string().max(120).optional(),
  skipIf: z.string().max(120).optional(),
});

// ─── Tests ───────────────────────────────────────────────────────────────

test("scorecard-schema: kicker longer than 200 chars fails", () => {
  // 201 characters — exceeds the cap.
  const fixture = {
    slug: "fixture-card",
    kicker: "x".repeat(201),
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("scorecard-schema: score 4.3 fails (must be multipleOf 0.5)", () => {
  const fixture = {
    slug: "fixture-card",
    scores: {
      welcomeValue: 4.3,
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("scorecard-schema: score 6 fails (above max of 5)", () => {
  const fixture = {
    slug: "fixture-card",
    scores: {
      earnRate: 6,
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("scorecard-schema: tier 'great' fails (not in enumerated set)", () => {
  const fixture = {
    slug: "fixture-card",
    tier: "great",
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("scorecard-schema: applyIf longer than 120 chars fails", () => {
  const fixture = {
    slug: "fixture-card",
    applyIf: "x".repeat(121),
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

// ─── Positive-case sanity (not counted in the 5 negative tests) ─────────
// Pinning the locked Skywards reference values parse cleanly so a future
// schema tightening doesn't silently break the reference cards.

test("scorecard-schema: Skywards Infinite reference frontmatter parses", () => {
  const fixture = {
    slug: "emirates-nbd-skywards-infinite",
    kicker:
      "The strongest pure-miles card on a UAE-issued Visa for frequent Emirates flyers spending AED 100,000+ a year. Below that spend, the AED 1,575 renewal bites — take the Signature.",
    tier: "editors-pick",
    scores: {
      welcomeValue: 5,
      earnRate: 4.5,
      perks: 4,
      feeValue: 2.5,
      access: 2,
    },
    applyIf:
      "You fly Emirates twice a year or more out of DXB and spend AED 100,000 or more annually.",
    skipIf:
      "Your Emirates spend runs under AED 30,000 a year — the Signature carries less fee risk for similar earning.",
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.ok(
    result.success,
    `expected Skywards Infinite to parse: ${result.success ? "" : JSON.stringify(result.error.format())}`,
  );
});

test("scorecard-schema: Skywards Signature reference frontmatter parses", () => {
  const fixture = {
    slug: "emirates-nbd-skywards-signature",
    kicker:
      "A direct-earn Skywards on-ramp at AED 12,000 salary — accessible where the Infinite is not. Earn rate is lower; the AED 735 fee never waives on spend.",
    tier: "solid",
    scores: {
      welcomeValue: 3,
      earnRate: 3,
      perks: 2.5,
      feeValue: 3,
      access: 4,
    },
    applyIf:
      "You fly Emirates once or twice a year and want direct Skywards earning at the AED 12,000 minimum salary.",
    skipIf:
      "You spend AED 100,000 or more a year on the card — the Infinite earns enough more to cover the fee gap.",
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.ok(
    result.success,
    `expected Skywards Signature to parse: ${result.success ? "" : JSON.stringify(result.error.format())}`,
  );
});
