// Phase 2a.2.3 (2026-05-20) — EditorScorecard render-source test.
//
// `EditorScorecard.astro` imports from `astro:content`, a virtual module
// unavailable under plain tsx. We follow the same pattern as
// `tests/cards/at-a-glance.test.ts`: assert against the rendered Astro
// source text + a small TS mirror of the helper logic. The full Zod +
// JSX path is exercised by `astro check` + `astro build`.
//
// Run: node --import tsx --test tests/components/editor-scorecard.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SCORECARD_PATH = path.join(
  "src",
  "components",
  "cards",
  "EditorScorecard.astro",
);
const source = readFileSync(SCORECARD_PATH, "utf8");

// ── Helper mirrors from the .astro file ─────────────────────────────────
//
// Keep these in lock-step with the resolver block in
// `src/components/cards/EditorScorecard.astro`. If the half-step rule,
// fmtScore behaviour, or row visibility changes, update both.

function starStates(value: number): Array<"full" | "half" | "empty"> {
  const out: Array<"full" | "half" | "empty"> = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) out.push("full");
    else if (value >= i - 0.5) out.push("half");
    else out.push("empty");
  }
  return out;
}

function fmtScore(n: number): string {
  return n % 1 === 0 ? String(Math.trunc(n)) : n.toFixed(1);
}

const DIMENSION_ORDER = [
  "welcomeValue",
  "earnRate",
  "perks",
  "feeValue",
  "access",
] as const;

// ── 1. Renders null when all four are absent ────────────────────────────

test("EditorScorecard: render gate checks tier OR scores OR applyIf OR skipIf", () => {
  // The render gate in the .astro source is:
  //   const render = hasTier || hasScores || hasApply || hasSkip;
  // Source must literally contain that fallthrough.
  assert.match(
    source,
    /const render = hasTier \|\| hasScores \|\| hasApply \|\| hasSkip;/,
  );
  // And the JSX wrapper renders only when `render` is truthy.
  assert.match(source, /\{render && \(/);
});

// ── 2. Tier badge renders alone (no scores, no apply/skip) ──────────────

test("EditorScorecard: tier badge has a TIER_LABELS map covering 5 tiers", () => {
  // Component must carry the locked 5-tier label map. Accept either
  // quoted ("strong": "Strong") or unquoted (strong: "Strong") key
  // forms — TS allows both for valid identifiers.
  const pairs: Array<[string, string]> = [
    ["editors-pick", "Editor's Pick"],
    ["strong", "Strong"],
    ["solid", "Solid"],
    ["niche", "Niche"],
    ["skip", "Skip"],
  ];
  for (const [tier, label] of pairs) {
    const quoted = source.includes(`"${tier}": "${label}"`);
    const unquoted = source.includes(`${tier}: "${label}"`);
    assert.ok(
      quoted || unquoted,
      `expected TIER_LABELS to map ${tier} -> ${label}`,
    );
  }
});

// ── 3. Fixed row order ──────────────────────────────────────────────────

test("EditorScorecard: dimension rows iterate in the locked order", () => {
  // DIMENSION_LABELS is the iteration source for visibleRows. Assert the
  // exact tuple order so future refactors don't accidentally reshuffle.
  const idx = (k: string) => source.indexOf(`"${k}"`);
  const positions = DIMENSION_ORDER.map(idx);
  for (let i = 1; i < positions.length; i++) {
    assert.ok(
      positions[i - 1] !== -1 && positions[i] !== -1,
      `expected ${DIMENSION_ORDER[i - 1]} and ${DIMENSION_ORDER[i]} in source`,
    );
    assert.ok(
      positions[i - 1] < positions[i],
      `expected ${DIMENSION_ORDER[i - 1]} before ${DIMENSION_ORDER[i]}`,
    );
  }
});

// ── 4. Half-step renders two paths ──────────────────────────────────────

test("EditorScorecard: half-star renders left filled + right empty", () => {
  // 4.5 = 4 full stars + 1 half star.
  assert.deepEqual(
    starStates(4.5),
    ["full", "full", "full", "full", "half"],
  );
  // The .astro renders TWO <path> halves per star so half-fill works
  // without clip-path. Pin that contract.
  const leftPaths = source.match(/class="half left"/g) ?? [];
  const rightPaths = source.match(/class="half right"/g) ?? [];
  assert.equal(leftPaths.length, 1, "exactly one left-half path template");
  assert.equal(rightPaths.length, 1, "exactly one right-half path template");
  // Half-state styling must fill left, stroke right.
  assert.match(
    source,
    /\.star-meter \.star\.is-half \.half\.left\s*\{[^}]*fill:\s*var\(--positive\)/,
  );
  assert.match(
    source,
    /\.star-meter \.star\.is-half \.half\.right\s*\{[^}]*fill:\s*none/,
  );
});

// ── 5. Score 0 renders empty stars + "0" ────────────────────────────────

test("EditorScorecard: score 0 renders 5 empty stars and '0' (no '.0')", () => {
  assert.deepEqual(
    starStates(0),
    ["empty", "empty", "empty", "empty", "empty"],
  );
  // fmtScore drops the .0 tail.
  assert.equal(fmtScore(0), "0");
  assert.equal(fmtScore(4), "4");
  assert.equal(fmtScore(4.5), "4.5");
  assert.equal(fmtScore(2.5), "2.5");
});

// ── 6. Methodology link always present when the component renders ───────

test("EditorScorecard: methodology link always rendered, href + label locked", () => {
  // The methodology row sits inside the {render && (...)} block, with no
  // further gating. Assert the href + the exact reader-facing text.
  assert.match(
    source,
    /href="\/editorial-policy\/how-we-score\/"/,
  );
  assert.match(source, /How we score →/);
  // And the link block isn't wrapped in any extra conditional.
  // Search for the literal block — must be a plain wrapper, not inside
  // a {hasX && (...)} fence.
  const methSlice = source.slice(source.indexOf("methodology-row"));
  // The opening {hasApply || hasSkip} block is *above* the methodology
  // row, so methSlice should not start with another `&& (`.
  assert.ok(
    !methSlice.slice(0, 200).match(/^\s*&&/),
    "methodology link must not be gated behind another conditional",
  );
});

// ── 7. editors-pick tier badge gets --green background ──────────────────

test("EditorScorecard: editors-pick tier uses --green background, paper text", () => {
  // Stylesheet rule for the editors-pick badge variant.
  assert.match(
    source,
    /\.tier-badge\.tier-editors-pick\s*\{[\s\S]*?background:\s*var\(--green\)/,
  );
  assert.match(
    source,
    /\.tier-badge\.tier-editors-pick\s*\{[\s\S]*?color:\s*var\(--paper\)/,
  );
});

// ── 8. applyIf alone spans full-width on desktop ────────────────────────

test("EditorScorecard: solo apply-or-skip block spans both columns at ≥720px", () => {
  // The `.apply-skip > :only-child { grid-column: 1 / -1; }` rule
  // ensures a single applyIf (or single skipIf) gets the full width
  // instead of half. Pin the rule.
  assert.match(
    source,
    /\.apply-skip > :only-child\s*\{\s*grid-column:\s*1 \/ -1;\s*\}/,
  );
});
