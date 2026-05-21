// Phase 2a.2.4 (2026-05-21) — SectionBreak render-source test.
//
// `SectionBreak.astro` imports `Image` from `astro:assets`, a virtual
// module unavailable under plain tsx. We follow the same pattern as
// `tests/components/editor-scorecard.test.ts`: assert against the
// rendered Astro source text. The full Astro <Image> path is exercised
// by `astro check` + `astro build`.
//
// Run: node --import tsx --test tests/components/section-break.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const SECTION_BREAK_PATH = path.join(
  "src",
  "components",
  "cards",
  "SectionBreak.astro",
);
const source = readFileSync(SECTION_BREAK_PATH, "utf8");

// ── 1. Renders an <Image> with the resolved src ─────────────────────────

test("SectionBreak: renders Astro <Image> with the resolved metadata", () => {
  // Component must invoke Astro's <Image>, not a bare <img>.
  assert.match(source, /<Image\s/);
  // The src is the variable `resolved` from the importer await — not the
  // raw filename. Pin the contract: `src={resolved}` is the only
  // acceptable hand-off.
  assert.match(source, /src=\{resolved\}/);
});

// ── 2. Caption + credit text both render ────────────────────────────────

test("SectionBreak: caption and credit both render in the figcaption", () => {
  assert.match(source, /\{caption\}/);
  assert.match(source, /\{credit\}/);
  // The figcaption wraps both with the separator span.
  assert.match(source, /<figcaption class="dp-section-break-attr">/);
  assert.match(source, /class="sep"/);
});

// ── 3. Throws build-time on missing library file ────────────────────────

test("SectionBreak: throws when the library file is missing", () => {
  // The component must throw rather than render a broken <img>. Pin
  // the guard against the import.meta.glob lookup.
  assert.match(source, /import\.meta\.glob/);
  assert.match(source, /throw new Error\(/);
  assert.match(
    source,
    /not found in \/src\/assets\/cards\/library\//,
  );
});

// ── 4. alt defaults to caption when prop omitted ────────────────────────

test("SectionBreak: alt defaults to caption when the `alt` prop is omitted", () => {
  // Source must carry the fallback expression.
  assert.match(source, /const altText = alt \?\? caption;/);
  // And altText feeds the Image's alt attribute (not the raw `alt` prop).
  assert.match(source, /alt=\{altText\}/);
});

// ── 5. Aspect ratio is 21:9 desktop / 16:9 mobile ───────────────────────

test("SectionBreak: aspect-ratio is 21:9 desktop, 16:9 on small viewports", () => {
  // Desktop rule on .dp-section-break-img.
  assert.match(
    source,
    /\.dp-section-break-img\s*\{[\s\S]*?aspect-ratio:\s*21 \/ 9/,
  );
  // Mobile override inside the 719.98px media query.
  assert.match(
    source,
    /@media \(max-width: 719\.98px\) \{[\s\S]*?\.dp-section-break-img \{ aspect-ratio: 16 \/ 9; \}/,
  );
});

// ── 6. Lazy-loaded (never above the fold) ───────────────────────────────

test("SectionBreak: loading is lazy and decoding is async", () => {
  assert.match(source, /loading="lazy"/);
  assert.match(source, /decoding="async"/);
});

// ── 7. Library directory exists with the seed image referenced by tests ─

test("SectionBreak: the seed library directory ships at least one image", () => {
  // The Skywards reference MDX points at emirates-cabin-business.jpg via
  // SectionBreak. Make sure the placeholder is on disk so `npm run build`
  // doesn't fail on the resolver.
  const libDir = path.join("src", "assets", "cards", "library");
  assert.ok(existsSync(libDir), "library directory must exist");
  assert.ok(
    existsSync(path.join(libDir, "emirates-cabin-business.jpg")),
    "emirates-cabin-business.jpg must exist (Skywards Infinite section break)",
  );
  assert.ok(
    existsSync(path.join(libDir, "dubai-skyline-burj.jpg")),
    "dubai-skyline-burj.jpg must exist (Skywards Signature section break)",
  );
});
