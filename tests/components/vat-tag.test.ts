// Phase 2a.2.3 (2026-05-20) — VAT tag render-source test.
//
// Asserts the VAT-tag rendering contract on the three components:
//   - FeeBlock        — "incl. VAT" line below the amount, "+5% VAT" on excl.
//   - AtAGlance       — `.qual` row beneath the annual fee value
//   - CardComparison  — inline `(incl. VAT)` after Annual fee + Joining fee
//
// Source-pattern assertions, NOT Astro Container render — same rationale
// as the EditorScorecard test.
//
// Run: node --import tsx --test tests/components/vat-tag.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cardFeeNeedsReview } from "../../src/lib/cardFeeProvenance.ts";

const FEE_BLOCK = readFileSync(
  path.join("src", "components", "cards", "FeeBlock.astro"),
  "utf8",
);
const AT_A_GLANCE = readFileSync(
  path.join("src", "components", "cards", "AtAGlance.astro"),
  "utf8",
);
const CARD_COMPARISON = readFileSync(
  path.join("src", "components", "cards", "CardComparison.astro"),
  "utf8",
);

function sourceExpression(source: string, name: string): string {
  const expression = source.match(new RegExp(`const ${name} = ([^;]+);`))?.[1];
  assert.ok(expression, `${name} gate not found`);
  return expression;
}

// ── 1. FeeBlock — inclusive policy renders "incl. VAT" ──────────────────

test("FeeBlock: inclusive vatPolicy renders 'incl. VAT' line beneath the amount", () => {
  // The vatTagText resolver:
  //   const vatTagText = vatPolicy === "exclusive" ? "+ 5% VAT" : "incl. VAT";
  assert.match(
    FEE_BLOCK,
    /const vatTagText\s*=\s*\n?\s*vatPolicy === "exclusive" \? "\+ 5% VAT" : "incl\. VAT";/,
  );
  // Positive, source-qualified fees only; unknown fees carry no VAT claim.
  assert.match(FEE_BLOCK, /const showVatTag = !annualFeePending && annualFee\.amount > 0;/);
  // And the tag DOM sits between .amt and .lbl.
  assert.match(
    FEE_BLOCK,
    /<div class="amt">\{feeLabel\}<\/div>\s*\n\s*\{showVatTag &&/,
  );
  assert.match(
    FEE_BLOCK,
    /\{showVatTag && <div class="vat">\{vatTagText\}<\/div>\}/,
  );
});

// ── 2. FeeBlock — annualFee.amount === 0 suppresses the tag ─────────────

test("FeeBlock: zero and held positive fees suppress VAT tags; known positive fees retain them", () => {
  const gate = new Function("annualFeePending", "annualFee", `return (${sourceExpression(FEE_BLOCK, "showVatTag")});`);
  for (const amount of [0, 315]) {
    for (const pending of [false, true]) {
      assert.equal(gate(pending, { amount }), !pending && amount > 0);
    }
  }
});

// ── 3. FeeBlock — exclusive policy renders "+ 5% VAT" ───────────────────

test("FeeBlock: exclusive vatPolicy renders '+ 5% VAT' tag text", () => {
  // The same resolver line carries both branches.
  assert.match(FEE_BLOCK, /"\+ 5% VAT"/);
  assert.match(FEE_BLOCK, /"incl\. VAT"/);
});

// ── 4. AtAGlance — qual tag is conditional + uses incl. / + 5% wording ──

test("AtAGlance: VAT qualifier appended to Annual fee tile when amount > 0", () => {
  // Resolver block:
  //   const showVatQual = !cardFeeNeedsReview(card, "annualFee") && annualFeeAmount > 0;
  //   const vatQualText = vatPolicy === "exclusive" ? "+ 5% VAT" : "incl. VAT";
  assert.match(AT_A_GLANCE, /const showVatQual = !cardFeeNeedsReview\(card, "annualFee"\) && annualFeeAmount > 0;/);
  const gate = new Function("card", "cardFeeNeedsReview", "annualFeeAmount", `return (${sourceExpression(AT_A_GLANCE, "showVatQual")});`);
  for (const amount of [0, 315]) {
    const confirmed = { annualFee: { amount }, _provenance: { annualFee: "editor-confirmed" } };
    assert.equal(gate(confirmed, cardFeeNeedsReview, amount), amount > 0);
    for (const field of ["annualFee", "annualFee.amount", "vatPolicy"]) {
      const held = { ...confirmed, _provenance: { ...confirmed._provenance, [field]: "needs-review" } };
      assert.equal(gate(held, cardFeeNeedsReview, amount), false, field);
    }
  }
  assert.match(
    AT_A_GLANCE,
    /const vatQualText\s*=\s*\n?\s*vatPolicy === "exclusive" \? "\+ 5% VAT" : "incl\. VAT";/,
  );
  // JSX gate appends a <span class="qual">…</span> beneath the value.
  assert.match(
    AT_A_GLANCE,
    /\{showVatQual && <span class="qual">\{vatQualText\}<\/span>\}/,
  );
});

// ── 5. CardComparison — inline `(incl. VAT)` on Annual fee + Joining fee ─

test("CardComparison: inline VAT tag rendered for annualFee + joiningFee rows only", () => {
  // The vatTagFor() helper restricts the tag to the two rowKeys.
  assert.match(
    CARD_COMPARISON,
    /if \(rowKey !== "annualFee" && rowKey !== "joiningFee"\) return null;/,
  );
  // The returned string is the literal `(incl. VAT)` parenthetical.
  assert.match(CARD_COMPARISON, /return "\(incl\. VAT\)";/);
  // Both left and right cells render via {leftVatTag} / {rightVatTag}.
  assert.match(
    CARD_COMPARISON,
    /\{leftVatTag && <span class="vat-tag">\{leftVatTag\}<\/span>\}/,
  );
  assert.match(
    CARD_COMPARISON,
    /\{rightVatTag && <span class="vat-tag">\{rightVatTag\}<\/span>\}/,
  );
});

// ── 6. CardComparison — Free / AED 0 / null amount yields no tag ────────

test("CardComparison: amount === 0 or null returns null from vatTagFor()", () => {
  // The helper's final guard:
  //   if (amount === null || amount === 0) return null;
  assert.match(
    CARD_COMPARISON,
    /if \(amount === null \|\| amount === 0\) return null;/,
  );
  // And the .vat-tag CSS sits below the .glyph rule, with --muted colour
  // and `white-space: nowrap` so the parenthetical doesn't wrap inside
  // narrow comparison cells.
  assert.match(
    CARD_COMPARISON,
    /\.dp-card-comparison \.vat-tag\s*\{[\s\S]*?color:\s*var\(--muted\)[\s\S]*?white-space:\s*nowrap/,
  );
});
