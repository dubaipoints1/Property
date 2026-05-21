// Phase 2a.2.4 (2026-05-21) — heroImage frontmatter schema test.
//
// Pins the contract for the new `heroImage` field on the `cards`
// collection. Like `scorecard-schema.test.ts`, this mirrors the Zod
// slice locally rather than importing `astro:content` (unresolvable
// under plain tsx). If the schema in `src/content.config.ts` changes,
// update both sides.
//
// Run: node --import tsx --test tests/content/hero-image-schema.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// ─── Local Zod mirror of the Phase 2a.2.4 heroImage addition ─────────────

const HeroImage = z
  .object({
    src: z
      .string()
      .regex(/^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i, "must be a library filename"),
    alt: z.string().min(8).max(140),
    caption: z.string().max(120).optional(),
    credit: z.string().max(80).optional(),
  })
  .optional();

const CardFrontmatter = z.object({
  slug: z.string(),
  heroImage: HeroImage,
});

// ─── Positive cases (the two reference prefills) ─────────────────────────

test("hero-image-schema: Skywards Infinite prefill parses", () => {
  const fixture = {
    slug: "emirates-nbd-skywards-infinite",
    heroImage: {
      src: "emirates-a380-dxb.jpg",
      alt: "Emirates A380 parked at a Dubai International Airport gate at dusk",
      caption:
        "Emirates' A380 — the flagship aircraft for the long-haul redemptions this card pays back on.",
      credit: "Unsplash CC0 / placeholder pending Emirates Media Kit clearance",
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.ok(
    result.success,
    `expected Skywards Infinite heroImage to parse: ${result.success ? "" : JSON.stringify(result.error.format())}`,
  );
});

test("hero-image-schema: Skywards Signature prefill parses", () => {
  const fixture = {
    slug: "emirates-nbd-skywards-signature",
    heroImage: {
      src: "dxb-airport-concourse.jpg",
      alt: "Dubai International Airport, Concourse B departures",
      caption:
        "DXB Concourse B — the access point the Signature's Visa Airport Companion lounge benefit opens.",
      credit: "Unsplash CC0 / Mike Kononov",
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.ok(
    result.success,
    `expected Skywards Signature heroImage to parse: ${result.success ? "" : JSON.stringify(result.error.format())}`,
  );
});

test("hero-image-schema: heroImage is optional on the card", () => {
  const fixture = { slug: "card-without-image" };
  const result = CardFrontmatter.safeParse(fixture);
  assert.ok(result.success, "heroImage absent should parse fine");
});

// ─── Negative cases ──────────────────────────────────────────────────────

test("hero-image-schema: missing src fails", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      alt: "Plausible alt text describing the photograph",
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("hero-image-schema: missing alt fails", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      src: "emirates-a380-dxb.jpg",
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("hero-image-schema: alt under 8 chars fails", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      src: "emirates-a380-dxb.jpg",
      alt: "too sm", // 6 chars
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("hero-image-schema: caption over 120 chars fails", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      src: "emirates-a380-dxb.jpg",
      alt: "A plausible alt string for the image",
      caption: "x".repeat(121),
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("hero-image-schema: src as an external URL fails (must be a library filename)", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      src: "https://example.com/foo.jpg",
      alt: "A plausible alt string for the image",
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("hero-image-schema: src with uppercase / unsupported extension fails", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      src: "emirates.gif",
      alt: "A plausible alt string for the image",
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});

test("hero-image-schema: credit over 80 chars fails", () => {
  const fixture = {
    slug: "fixture-card",
    heroImage: {
      src: "emirates-a380-dxb.jpg",
      alt: "A plausible alt string for the image",
      credit: "x".repeat(81),
    },
  };
  const result = CardFrontmatter.safeParse(fixture);
  assert.equal(result.success, false);
});
