import { test } from "node:test";
import assert from "node:assert/strict";
import { everydayEarnSummary } from "../../src/lib/cardEarnModel";

// The miles comparison table printed "Pending — see scoped rewards" for every
// card whose rates are stored as source-qualified rows (reported by the
// owner, 16 November 2026). Those rates are sourced, not pending.

const fmt = (v: number) => `${v} base`;
const row = (key: string, label: string, value: number) => ({
  key, label, value, unit: "Skywards Miles", denominator: { amount: 1, currency: "USD" }, scope: "s",
});

test("shows the issuer's everyday row with its own label, never a 'pending' placeholder", () => {
  const card = { earnRates: { everythingElse: null }, scopedEarnRates: [row("emirates-partners", "Emirates partners", 2), row("domestic", "Qualifying domestic spend", 1)] } as any;
  const out = everydayEarnSummary(card, fmt);
  assert.equal(out, "1 Skywards Miles per USD 1 (qualifying domestic spend)");
  assert.doesNotMatch(out, /pending/i);
});

test("does not promote a tiered or merchant-only row to an everyday rate", () => {
  const card = { earnRates: { everythingElse: null }, scopedEarnRates: [row("weekday", "Weekday", 1), row("weekend", "Weekend", 3)] } as any;
  assert.equal(everydayEarnSummary(card, fmt), "Varies by category (2 rates); see the card's review");
});

test("a held flat rate is not shown as confirmed", () => {
  assert.equal(everydayEarnSummary({ earnRates: { everythingElse: 1 }, _provenance: { earnRates: "needs-review" } } as any, fmt), "Not yet confirmed");
  assert.equal(everydayEarnSummary({ earnRates: { everythingElse: 1 }, _provenance: {} } as any, fmt), "1 base");
});
