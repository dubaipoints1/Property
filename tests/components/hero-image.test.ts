// Phase 2a.2.4 (2026-05-21) — HeroImage render-source test.
//
// Same source-text pattern as `tests/components/section-break.test.ts`.
// The full Astro <Image> + virtual `astro:assets` path is exercised by
// `astro check` + `astro build`.
//
// Run: node --import tsx --test tests/components/hero-image.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const HERO_IMAGE_PATH = path.join(
  "src",
  "components",
  "cards",
  "HeroImage.astro",
);
const source = readFileSync(HERO_IMAGE_PATH, "utf8");

// ── 1. Renders an <Image> with the resolved src ─────────────────────────

test("HeroImage: renders Astro <Image> with the resolved metadata", () => {
  assert.match(source, /<Image\s/);
  assert.match(source, /src=\{resolved\}/);
});

// ── 2. Caption + credit both render when provided ───────────────────────

test("HeroImage: caption and credit render inside a figcaption", () => {
  assert.match(source, /<figcaption class="dp-cr-photo-attr">/);
  assert.match(source, /\{caption &&/);
  assert.match(source, /\{credit &&/);
});

// ── 3. Renders without caption or credit when both are omitted ──────────

test("HeroImage: the figcaption is conditional on caption || credit", () => {
  // The figcaption block is wrapped in `{(caption || credit) && (...)`
  // so a HeroImage with neither just renders the optimised <Image>.
  assert.match(source, /\{\(caption \|\| credit\) && \(/);
});

// ── 4. Throws on missing library file ───────────────────────────────────

test("HeroImage: throws when the library file is missing", () => {
  assert.match(source, /import\.meta\.glob/);
  assert.match(source, /throw new Error\(/);
  assert.match(
    source,
    /not found in \/src\/assets\/cards\/library\//,
  );
});

// ── 5. Hero is loading=eager (above-the-fold, post-band) ────────────────

test("HeroImage: loading is eager and decoding is async", () => {
  // Hero photographs sit between the navy band and the body grid — they
  // are visible on first paint and must not be lazy-loaded.
  assert.match(source, /loading="eager"/);
  assert.match(source, /decoding="async"/);
});

// ── 6. Responsive widths cover the full hero range ──────────────────────

test("HeroImage: responsive widths span 480 → 1800 for the 1180px hero", () => {
  // The hero wrapper is max-width 1180px — Astro's <Image> needs widths
  // bracketing 2x retina (so up to ~2360 in theory, 1800 chosen as the
  // ceiling the optimiser realistically reaches).
  assert.match(source, /widths=\{\[480, 720, 1080, 1440, 1800\]\}/);
});

// ── 7. Library binary referenced by the Skywards reference is on disk ──

test("HeroImage: Skywards reference library binaries exist", () => {
  const libDir = path.join("src", "assets", "cards", "library");
  assert.ok(existsSync(libDir), "library directory must exist");
  assert.ok(
    existsSync(path.join(libDir, "emirates-a380-dxb.jpg")),
    "emirates-a380-dxb.jpg must exist (Skywards Infinite hero)",
  );
  assert.ok(
    existsSync(path.join(libDir, "dxb-airport-concourse.jpg")),
    "dxb-airport-concourse.jpg must exist (Skywards Signature hero)",
  );
});
