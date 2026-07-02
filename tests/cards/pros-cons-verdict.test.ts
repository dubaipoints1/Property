// Phase 2a.2.0 (2026-05-20) — ProsCons + EditorVerdict component contract test.
//
// The components (`src/components/cards/ProsCons.astro`,
// `src/components/cards/EditorVerdict.astro`) read their input from the
// `cards` content collection at render time via Astro's `getEntry`.
// The Astro virtual module isn't accessible from node:test, so this
// file tests the data contract directly:
//
//   1. The MDX frontmatter that the components consume — parsed from
//      `src/content/cards/<slug>.mdx` — carries the shape and counts
//      the rebuilt page relies on.
//   2. The component source files contain the null-guarding render
//      logic mandated by the brief (no chrome when frontmatter is
//      missing or empty).
//
// This mirrors the `tests/cards/card-comparison.test.ts` approach:
// snapshot the data shape, not the rendered DOM. `npm run build`
// is the integration test for actual Astro rendering — a contract
// drift in either component will fail the build.
//
// Run: node --import tsx --test tests/cards/pros-cons-verdict.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const CARD_MDX_DIR = path.join("src", "content", "cards");
const COMPONENT_DIR = path.join("src", "components", "cards");

// ── Minimal YAML frontmatter parser ──────────────────────────────────────
// Hand-rolled because js-yaml isn't a project dependency and adding one
// for a single test is the wrong trade. Only handles the shapes that the
// cards collection actually uses (string scalars, arrays of strings with
// hyphen markers and 2-space continuation indents). If a card's
// frontmatter grows beyond these shapes the test will fail loudly and
// the parser can be extended.

type ParsedFrontmatter = {
  pros?: string[];
  cons?: string[];
  editorTake?: string;
  slug?: string;
};

function parseFrontmatter(mdxSource: string): ParsedFrontmatter {
  const match = mdxSource.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error("parseFrontmatter: no frontmatter block found");
  }
  const block = match[1];
  const lines = block.split(/\r?\n/);

  const out: ParsedFrontmatter = {};
  let currentKey: keyof ParsedFrontmatter | null = null;
  let currentList: string[] | null = null;
  let currentScalar: string[] | null = null;

  const flushScalar = () => {
    if (currentKey && currentScalar) {
      const joined = currentScalar.join(" ").trim();
      (out as Record<string, unknown>)[currentKey] = joined;
    }
    currentScalar = null;
  };

  for (const line of lines) {
    // Top-level key (`key: value` or `key:` opening an array/scalar block).
    // Anchored at column 0 — indented lines fall through to list/cont
    // matching below.
    const topMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    // List item — accept any indent; canonical is no leading space.
    const listMatch = line.match(/^-\s+(.*)$/);
    // Continuation line of a folded scalar (2-space indent, non-empty).
    const contMatch = line.match(/^\s{2,}(\S.*)$/);

    if (topMatch && !listMatch && !line.startsWith(" ")) {
      flushScalar();
      const key = topMatch[1] as keyof ParsedFrontmatter;
      const value = topMatch[2];
      currentKey = key;
      currentList = null;
      if (value === "") {
        // Opens either a list or a folded scalar — decide on the next line.
        currentScalar = null;
      } else {
        // Inline scalar with optional folded continuation. Seed the
        // scalar buffer so subsequent 2-space-indented continuation
        // lines fold in. `flushScalar` on the next top-level key (or
        // end-of-block) commits the final value. Strip optional
        // surrounding quotes from the seed.
        const seed = value.replace(/^"(.*)"$|^'(.*)'$/, (_m, a, b) => a ?? b);
        currentScalar = [seed];
      }
    } else if (listMatch && currentKey) {
      if (!currentList) {
        currentList = [];
        (out as Record<string, unknown>)[currentKey] = currentList;
        // Opening a list discards any pending scalar buffer.
        currentScalar = null;
      }
      currentList.push(listMatch[1]);
    } else if (contMatch && currentKey) {
      if (currentList && currentList.length > 0) {
        // Folded continuation of the last list item.
        currentList[currentList.length - 1] =
          currentList[currentList.length - 1] + " " + contMatch[1];
      } else {
        // Folded continuation of a scalar.
        if (!currentScalar) currentScalar = [];
        currentScalar.push(contMatch[1]);
      }
    }
  }
  flushScalar();
  return out;
}

function readMdx(slug: string): ParsedFrontmatter {
  const file = path.join(CARD_MDX_DIR, `${slug}.mdx`);
  return parseFrontmatter(readFileSync(file, "utf8"));
}

// ── Parser self-check ────────────────────────────────────────────────────

test("parseFrontmatter: handles inline scalar key", () => {
  const out = parseFrontmatter(
    "---\nslug: x\neditorTake: hello world\n---\n",
  );
  assert.equal(out.slug, "x");
  assert.equal(out.editorTake, "hello world");
});

test("parseFrontmatter: handles list with folded continuation", () => {
  const out = parseFrontmatter(
    "---\npros:\n- first item\n- second item that\n  folds onto two lines\n- third item\n---\n",
  );
  assert.deepEqual(out.pros, [
    "first item",
    "second item that folds onto two lines",
    "third item",
  ]);
});

test("parseFrontmatter: handles folded scalar", () => {
  const out = parseFrontmatter(
    "---\neditorTake: line one of the take\n  line two folds in here\n  line three closes it.\n---\n",
  );
  assert.equal(
    out.editorTake,
    "line one of the take line two folds in here line three closes it.",
  );
});

// ── ProsCons contract — Skywards Infinite (the reference page) ───────────

test("ProsCons contract: skywards-infinite frontmatter carries 5 pros + 5 cons", () => {
  const fm = readMdx("emirates-nbd-skywards-infinite");
  assert.ok(Array.isArray(fm.pros), "pros[] must exist");
  assert.ok(Array.isArray(fm.cons), "cons[] must exist");
  assert.equal(fm.pros!.length, 5, "expected exactly 5 pros");
  assert.equal(fm.cons!.length, 5, "expected exactly 5 cons");
  // Every entry is a non-empty trimmed string.
  for (const p of fm.pros!) {
    assert.equal(typeof p, "string");
    assert.ok(p.trim().length > 0, "pro must be non-empty");
  }
  for (const c of fm.cons!) {
    assert.equal(typeof c, "string");
    assert.ok(c.trim().length > 0, "con must be non-empty");
  }
});

test("ProsCons contract: skywards-signature frontmatter carries pros + cons arrays", () => {
  const fm = readMdx("emirates-nbd-skywards-signature");
  assert.ok(Array.isArray(fm.pros), "pros[] must exist");
  assert.ok(Array.isArray(fm.cons), "cons[] must exist");
  assert.ok(fm.pros!.length > 0, "signature must surface at least one pro");
  assert.ok(fm.cons!.length > 0, "signature must surface at least one con");
});

test("ProsCons contract: null-guard when both arrays empty", () => {
  // The render-null contract is enforced in source: the component reads
  //   const hasPros = pros.length > 0;
  //   const hasCons = cons.length > 0;
  //   const render = hasPros || hasCons;
  //   {render && (<section …/>)}
  // Verify the guard is present so Astro emits nothing when the
  // frontmatter is absent or carries empty arrays.
  const src = readFileSync(
    path.join(COMPONENT_DIR, "ProsCons.astro"),
    "utf8",
  );
  assert.match(src, /const hasPros = pros\.length > 0/);
  assert.match(src, /const hasCons = cons\.length > 0/);
  assert.match(src, /const render = hasPros \|\| hasCons/);
  assert.match(src, /\{render && \(/);
});

test("ProsCons contract: cons-only-empty drops the cons column", () => {
  // Mirror the render path with a hand-built fixture for the
  // `cons: []` case. The component's source asserts the column wraps
  // are conditional on hasPros / hasCons, so this test verifies the
  // generators in the template are gated independently.
  const src = readFileSync(
    path.join(COMPONENT_DIR, "ProsCons.astro"),
    "utf8",
  );
  // Both column wrappers gated by their own boolean.
  assert.match(src, /\{hasPros && \(\s*<div class="dp-proscons-v2-col is-pros">/);
  assert.match(src, /\{hasCons && \(\s*<div class="dp-proscons-v2-col is-cons">/);
});

test("ProsCons contract: pros eyebrow == 'Pros', cons eyebrow == 'Cons'", () => {
  const src = readFileSync(
    path.join(COMPONENT_DIR, "ProsCons.astro"),
    "utf8",
  );
  // h2, not h3: the block renders before the first prose h2 on every
  // review, so h3 created an h1->h3 outline skip on all 55 pages
  // (2 July 2026 heading-hierarchy audit). Visuals are class-scoped.
  assert.match(src, /<h2 class="eyebrow">Pros<\/h2>/);
  assert.match(src, /<h2 class="eyebrow">Cons<\/h2>/);
});

// ── EditorVerdict contract — Skywards Infinite ───────────────────────────

test("EditorVerdict contract: skywards-infinite editorTake is a non-empty string", () => {
  const fm = readMdx("emirates-nbd-skywards-infinite");
  assert.equal(typeof fm.editorTake, "string");
  assert.ok(fm.editorTake!.trim().length > 0);
  // Sanity: the take mentions both the strategic pitch ("Emirates") and the
  // fee constraint ("AED 3,149") that the brief calls out as the verdict
  // signals readers need above the fold.
  assert.match(fm.editorTake!, /Emirates/);
  assert.match(fm.editorTake!, /AED 3,149/);
});

test("EditorVerdict contract: skywards-signature editorTake is a non-empty string", () => {
  const fm = readMdx("emirates-nbd-skywards-signature");
  assert.equal(typeof fm.editorTake, "string");
  assert.ok(fm.editorTake!.trim().length > 0);
});

test("EditorVerdict contract: null-guard when kicker + editorTake both missing or whitespace", () => {
  const src = readFileSync(
    path.join(COMPONENT_DIR, "EditorVerdict.astro"),
    "utf8",
  );
  // Phase 2a.2.3 (2026-05-20) — EditorVerdict prefers `kicker`, falls
  // back to first sentence of `editorTake`. Render-null contract:
  //   const kicker = entry?.data?.kicker;
  //   const rawTake = entry?.data?.editorTake;
  //   let body = "";
  //   if (kicker is non-empty string) body = kicker.trim();
  //   else if (editorTake is non-empty string) body = raw.split(/[.!?]/)[0] + ".";
  //   const editorTake = body;
  //   const render = editorTake.length > 0;
  //   {render && (<aside …/>)}
  assert.match(src, /const kicker = entry\?\.data\?\.kicker;/);
  assert.match(src, /const rawTake = entry\?\.data\?\.editorTake;/);
  assert.match(src, /body = raw\.split\(\/\[\.!\?\]\/\)\[0\] \+ "\."/);
  assert.match(src, /const editorTake = body;/);
  assert.match(src, /const render = editorTake\.length > 0/);
  assert.match(src, /\{render && \(/);
});

test("EditorVerdict contract: eyebrow == 'Our take', body wraps editorTake", () => {
  const src = readFileSync(
    path.join(COMPONENT_DIR, "EditorVerdict.astro"),
    "utf8",
  );
  assert.match(src, /<div class="eyebrow">Our take<\/div>/);
  assert.match(src, /<p class="body">\{editorTake\}<\/p>/);
});

// ── Token discipline ─────────────────────────────────────────────────────

test("token discipline: --positive + --negative declared in global.css, single-use", () => {
  const css = readFileSync(
    path.join("src", "styles", "global.css"),
    "utf8",
  );
  assert.match(css, /--positive:\s*#2f6a4f/);
  assert.match(css, /--negative:\s*#b54a2c/);
  // The tokens should only be referenced from the ProsCons component's
  // svg fills — never from global.css selectors. Look for `var(--positive)`
  // or `var(--negative)` in global.css; should be zero.
  assert.equal(
    (css.match(/var\(--positive\)/g) ?? []).length,
    0,
    "--positive must not be referenced outside ProsCons.astro",
  );
  assert.equal(
    (css.match(/var\(--negative\)/g) ?? []).length,
    0,
    "--negative must not be referenced outside ProsCons.astro",
  );
});

test("token discipline: ProsCons.astro references both --positive and --negative", () => {
  const src = readFileSync(
    path.join(COMPONENT_DIR, "ProsCons.astro"),
    "utf8",
  );
  assert.match(src, /var\(--positive\)/);
  assert.match(src, /var\(--negative\)/);
});

// ── Layout chrome removal ────────────────────────────────────────────────

test("layout chrome: CardReviewLayout no longer renders the duplicate take/proscons blocks", () => {
  const layout = readFileSync(
    path.join("src", "layouts", "CardReviewLayout.astro"),
    "utf8",
  );
  // The migration note above the slot must be present.
  assert.match(layout, /Phase 2a\.2\.0 \(2026-05-20\): the "Our take" callout/);
  // No more <aside class="dp-take"> in the layout body (the sidebar
  // .dp-spec-card.is-call block remains — that's a different selector).
  assert.equal(
    (layout.match(/<aside class="dp-take">/g) ?? []).length,
    0,
    'layout must not render <aside class="dp-take">',
  );
  // No more legacy <section class="dp-proscons"> in the layout.
  assert.equal(
    (layout.match(/<section class="dp-proscons">/g) ?? []).length,
    0,
    'layout must not render <section class="dp-proscons">',
  );
});

test("layout chrome: orphaned .dp-proscons CSS removed from global.css", () => {
  const css = readFileSync(
    path.join("src", "styles", "global.css"),
    "utf8",
  );
  // The legacy selectors should no longer be declared.
  assert.equal(
    (css.match(/^\.dp-proscons\s*\{/gm) ?? []).length,
    0,
    ".dp-proscons rule must be removed",
  );
  assert.equal(
    (css.match(/^\.dp-proscons-block/gm) ?? []).length,
    0,
    ".dp-proscons-block rules must be removed",
  );
});

// ── MDX import + invocation contract ─────────────────────────────────────

test("MDX: skywards-infinite imports + invokes EditorVerdict + ProsCons", () => {
  const mdx = readFileSync(
    path.join(CARD_MDX_DIR, "emirates-nbd-skywards-infinite.mdx"),
    "utf8",
  );
  assert.match(
    mdx,
    /import EditorVerdict from "~\/components\/cards\/EditorVerdict\.astro";/,
  );
  assert.match(
    mdx,
    /import ProsCons from "~\/components\/cards\/ProsCons\.astro";/,
  );
  assert.match(
    mdx,
    /<EditorVerdict card="emirates-nbd-skywards-infinite" \/>/,
  );
  assert.match(mdx, /<ProsCons card="emirates-nbd-skywards-infinite" \/>/);
});

test("MDX: skywards-signature imports + invokes EditorVerdict + ProsCons", () => {
  const mdx = readFileSync(
    path.join(CARD_MDX_DIR, "emirates-nbd-skywards-signature.mdx"),
    "utf8",
  );
  assert.match(
    mdx,
    /import EditorVerdict from "~\/components\/cards\/EditorVerdict\.astro";/,
  );
  assert.match(
    mdx,
    /import ProsCons from "~\/components\/cards\/ProsCons\.astro";/,
  );
  assert.match(
    mdx,
    /<EditorVerdict card="emirates-nbd-skywards-signature" \/>/,
  );
  assert.match(
    mdx,
    /<ProsCons card="emirates-nbd-skywards-signature" \/>/,
  );
});
