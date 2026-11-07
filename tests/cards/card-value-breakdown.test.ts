import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { getCardData } from "../../src/lib/cardsData.ts";
import { cardValueBreakdownTotals } from "../../src/lib/cardValueBreakdown.ts";

const synthetic = { annualFee: { amount: 1200 }, vatPolicy: "inclusive" as const, _provenance: {} as Record<string, string> };

test("a held annual-fee/VAT subtree never becomes zero, a net value or an inline override", () => {
  for (const field of ["annualFee", "annualFee.amount", "annualFee.currency", "vatPolicy", "vatPolicy.treatment"]) {
    const card = { ...synthetic, _provenance: { [field]: "needs-review" } };
    for (const override of [undefined, 0, 500]) {
      assert.deepEqual(cardValueBreakdownTotals(2400, card, override), { known: false, fee: null, net: null }, field);
    }
  }
  assert.deepEqual(cardValueBreakdownTotals(2400), { known: false, fee: null, net: null });
  assert.deepEqual(cardValueBreakdownTotals(2400, { ...synthetic, annualFee: { amount: 0 }, _provenance: { annualFee: "scraped" } }), { known: false, fee: null, net: null });
});

test("confirmed fee, explicit editorial zero and known VAT gross-up retain their arithmetic", () => {
  assert.deepEqual(cardValueBreakdownTotals(2400, synthetic), { known: true, fee: 1200, net: 1200, hasFee: true, barTotal: 3600 });
  assert.deepEqual(cardValueBreakdownTotals(2400, undefined, 0), { known: true, fee: 0, net: 2400, hasFee: false, barTotal: 2400 });
  assert.deepEqual(cardValueBreakdownTotals(2400, { ...synthetic, vatPolicy: "exclusive" }), { known: true, fee: 1260, net: 1140, hasFee: true, barTotal: 3660 });
  assert.equal(cardValueBreakdownTotals(2400, { ...synthetic, _provenance: { _features: "needs-review" } }).known, true);
  assert.deepEqual(cardValueBreakdownTotals(2400, undefined, -1), { known: false, fee: null, net: null });
  assert.deepEqual(cardValueBreakdownTotals(2400, undefined, NaN), { known: false, fee: null, net: null });
  assert.throws(() => cardValueBreakdownTotals(Infinity, synthetic), /finite, non-negative gross/);
});

test("the actual Astro component gates the complete quantitative chart behind the tested model", () => {
  const source = readFileSync("src/components/cards/AEDValueBreakdown.astro", "utf8");
  assert.match(source, /import \{ cardValueBreakdownTotals \} from "~\/lib\/cardValueBreakdown"/);
  assert.match(source, /const breakdown = cardValueBreakdownTotals\(gross, cardData, annualFee, items\.map\(item => item\.kind\)\)/);
  assert.match(source, /\{!breakdown\.known \? \([\s\S]*?Value estimate pending\.[\s\S]*?\) : \(\s*<article class="dpvb"/);
  assert.doesNotMatch(source, /annualFee\.amount\s*\?\?\s*0|free for life|aed\(fee\)|Math\.abs\(net\)/i);
});

test("static item dependencies cannot bypass held earning, benefit or bonus claims", () => {
  for (const [kind, field] of [["Earn", "earnRates"], ["Earn", "earnRates.dining"], ["Earn", "earnRates._caps.monthly_max_aed"], ["Earn", "earnUnit"], ["Perk", "_features.0.scope"], ["Perk", "perks.0"], ["Bonus", "welcomeBonus.amount"]]) {
    const card = { ...synthetic, _provenance: { [field]: "needs-review" } };
    assert.equal(cardValueBreakdownTotals(2400, card, 0, [kind]).known, false, field);
    assert.equal(cardValueBreakdownTotals(2400, card, 0).known, true, "three-argument fee-only contract stays compatible");
  }
  assert.equal(cardValueBreakdownTotals(2400, { ...synthetic, scopedEarnRates: [{}] }, 0, ["Earn"]).known, false);
  assert.equal(cardValueBreakdownTotals(2400, synthetic, 0, ["Earn", "Perk", "Bonus"]).known, true);
  assert.equal(cardValueBreakdownTotals(2400, { ...synthetic, _provenance: { earnRates: "needs-review" } }, 0, ["Perk"]).known, true, "known unrelated benefit values are not earning claims");
});

test("all current card-review callsites share the held-fee boundary", () => {
  const slugs = readdirSync("src/content/cards").filter(file => file.endsWith(".mdx")).flatMap(file => {
    const source = readFileSync(`src/content/cards/${file}`, "utf8");
    return [...source.matchAll(/<AEDValueBreakdown\b[\s\S]*?\/>/g)].map(match => {
      const slug = match[0].match(/\bcard="([^"]+)"/)?.[1];
      assert.ok(slug, `${file}: the breakdown must resolve the card's source evidence`);
      const kinds = [...match[0].matchAll(/\bkind:\s*"([^"]+)"/g)].map(item => item[1]);
      return { slug, kinds };
    });
  });
  assert.ok(slugs.length > 0, "expected the existing card-review chart callsites");
  for (const { slug, kinds } of slugs) {
    const card = getCardData(slug)!;
    assert.ok(card, slug);
    for (const field of ["annualFee", "annualFee.amount", "vatPolicy"]) {
      const held = { ...card, _provenance: { ...card._provenance, [field]: "needs-review" } };
      assert.deepEqual(cardValueBreakdownTotals(2400, held), { known: false, fee: null, net: null }, `${slug}: ${field}`);
    }
    for (const [kind, field] of [["Earn", "earnRates"], ["Perk", "_features"], ["Bonus", "welcomeBonus"]]) {
      if (!kinds.includes(kind)) continue;
      const held = { ...card, _provenance: { ...card._provenance, [field]: "needs-review" } };
      assert.equal(cardValueBreakdownTotals(2400, held, 0, kinds).known, false, `${slug}: ${kind} source hold`);
    }
  }
});
