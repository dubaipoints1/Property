import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { MASHREQ_PRODUCTS, parseMashreqExpansion } from "../../scripts/scrape/_mashreq-expansion.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const sources = () => read("./fixtures/2026-11-mashreq-expansion.json").sources;
const digest = (s: string) => createHash("sha256").update(s).digest("hex");

test("Mashreq profiles reconcile exact principal annual fee and keep income out of the salary matcher", () => {
  const profiles = read("../../src/data/cards.json");
  for (const slug of Object.keys(MASHREQ_PRODUCTS)) {
    const p = parseMashreqExpansion(sources(), slug)!;
    const card = profiles[slug];
    assert.ok(p, slug);
    assert.equal(card.annualFee.amount, p.annualFee);
    assert.equal(card.vatPolicy, "inclusive");
    assert.equal(card.applyUrl, p.productUrl);
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.publishedMinMonthlyIncome, p.publishedIncome);
    assert.equal(card.earnRates.everythingElse, null);
    if (slug === "mashreq-noon") assert.ok(!card.categories.includes("cashback"), "noon credits are not unrestricted cashback");
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.deepEqual(card._fieldEvidence, p.evidence);
  }
});

test("Mashreq parser rejects contradictory amounts, repeated columns, source mixup and bad pins", () => {
  const edit = (id: string, fn: (s: string) => string) =>
    sources().map((s: { id: string; text: string; fixtureTextSha256: string }) => s.id === id
      ? { ...s, text: fn(s.text), fixtureTextSha256: digest(fn(s.text)) } : s);
  assert.equal(parseMashreqExpansion(edit("mashreq-fee-schedule", s => s.replace("313.95", "314.00")), "mashreq-platinum-plus"), null);
  assert.equal(parseMashreqExpansion(edit("mashreq-kfs", s => s.replace("313.95", "314.00")), "mashreq-platinum-plus"), null);
  assert.equal(parseMashreqExpansion(edit("mashreq-fee-schedule", s => s.replace("Solitaire Card", "Platinum Plus Card")), "mashreq-solitaire"), null);
  assert.equal(parseMashreqExpansion(sources().slice(1), "mashreq-noon"), null);
  assert.equal(parseMashreqExpansion(sources().map((s: { id: string }) => s.id === "mashreq-solitaire-fee" ?
    { ...s, sourceBodySha256: "d".repeat(64) } : s), "mashreq-solitaire"), null);
  assert.equal(parseMashreqExpansion(sources(), "mashreq-cashback"), null);
});

test("Mashreq partial profiles defer only below-fold related artwork, preserving a no-script fallback", () => {
  const layout = readFileSync(new URL("../../src/layouts/CardReviewLayout.astro", import.meta.url), "utf8");
  assert.match(layout, /deferRelatedArt = slug === "mashreq-noon" \|\| slug === "mashreq-platinum-plus" \|\| slug === "mashreq-solitaire"/);
  assert.match(layout, /<template data-related-card-art>\s*<CardImage/);
  assert.match(layout, /<noscript><CardImage/);
  assert.match(layout, /new IntersectionObserver/);
  assert.match(layout, /dp-related-art-slot \{ display: block; aspect-ratio: 16 \/ 10/);
});
