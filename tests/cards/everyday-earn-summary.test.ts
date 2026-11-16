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
  assert.deepEqual(out, { text: "1 Skywards Miles per USD 1 (qualifying domestic spend)", hasRates: true });
});

test("does not promote a tiered or merchant-only row to an everyday rate", () => {
  const card = { earnRates: { everythingElse: null }, scopedEarnRates: [row("weekday", "Weekday", 1), row("weekend", "Weekend", 3)] } as any;
  assert.deepEqual(everydayEarnSummary(card, fmt), { text: "Varies by spend", hasRates: true });
});

test("a held flat rate is not shown as confirmed", () => {
  assert.deepEqual(everydayEarnSummary({ earnRates: { everythingElse: 1 }, _provenance: { earnRates: "needs-review" } } as any, fmt), { text: "Not yet verified", hasRates: false });
  assert.deepEqual(everydayEarnSummary({ earnRates: { everythingElse: 1 }, _provenance: {} } as any, fmt), { text: "1 base", hasRates: true });
});

test("withholds a held ordinary-spend row but links to other verified rows", () => {
  const card = {
    earnRates: { everythingElse: null },
    scopedEarnRates: [row("domestic", "Domestic", 999), row("airfare", "Airfare", 3)],
    _provenance: { "scopedEarnRates.domestic.value": "needs-review" },
  } as any;
  assert.deepEqual(everydayEarnSummary(card, fmt), { text: "Varies by spend", hasRates: true });
  card._provenance = { scopedEarnRates: "needs-review" };
  assert.deepEqual(everydayEarnSummary(card, fmt), { text: "Not yet verified", hasRates: false });
});

test("links to confirmed legacy category rates, not a held flat rate or model", () => {
  const card = { earnRates: { everythingElse: 9, travel: 2 }, _provenance: { "earnRates.everythingElse": "needs-review" } } as any;
  assert.deepEqual(everydayEarnSummary(card, fmt), { text: "Varies by spend", hasRates: true });
  card._provenance["earnRates.model"] = "needs-review";
  assert.deepEqual(everydayEarnSummary(card, fmt), { text: "Not yet verified", hasRates: false });
  card._provenance = { earnUnit: "needs-review" };
  assert.deepEqual(everydayEarnSummary(card, fmt), { text: "Not yet verified", hasRates: false });
});
