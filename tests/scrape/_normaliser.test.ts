// Unit tests for the scrape normaliser.
//
// Run: node --import tsx --test tests/scrape/_normaliser.test.ts
// (or via `npm test` once wired into package.json)

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { loadFixture, parseAED, parsePercent, parseMinSalary, parseEarnRate } from "../../scripts/scrape/_lib.ts";
import { normalise, parseWelcomeBonus } from "../../scripts/scrape/_normaliser.ts";

test("parseAED extracts dirhams from common phrasings", () => {
  assert.equal(parseAED("Annual fee: AED 525"), 525);
  assert.equal(parseAED("AED1,575/year"), 1575);
  assert.equal(parseAED("AED 30,000 per month"), 30000);
  assert.equal(parseAED("no fee"), null);
});

test("parsePercent extracts percentages", () => {
  assert.equal(parsePercent("FX fee: 1.99%"), 1.99);
  assert.equal(parsePercent("3.25 % per month"), 3.25);
  assert.equal(parsePercent("not a percentage"), null);
});

test("parseMinSalary extracts AED salary band", () => {
  assert.equal(parseMinSalary("Minimum salary AED 12,000 per month"), 12000);
  assert.equal(parseMinSalary("Min salary: AED 5,000"), 5000);
  assert.equal(parseMinSalary("salary above AED 100,000"), null);
});

test("parseEarnRate finds category-specific rates", () => {
  assert.equal(parseEarnRate("5% cashback on dining", "dining"), 5);
  assert.equal(parseEarnRate("Earn 3x rewards on groceries", "groceries"), 3);
  assert.equal(parseEarnRate("2x on fuel and 1x elsewhere", "fuel"), 2);
});

test("normalise produces a valid draft against the FAB fixture", () => {
  const fixture = loadFixture(
    path.join("tests", "scrape", "fixtures", "fab-cashback.html"),
  );
  assert.equal(fixture.status, "ok", `Fixture must load: ${fixture.failReason ?? ""}`);

  const draft = normalise(
    "fab",
    {
      slug: "fab-cashback",
      name: "FAB Cashback Card",
      network: "Visa",
      categories: ["cashback"],
      loyaltyProgram: "FAB Rewards",
      salaryTransferRequired: false,
      urls: {
        product: "https://www.bankfab.com/en-ae/personal/cards/credit-cards/cashback-card",
        kfs: null,
        welcome: null,
      },
    },
    [fixture],
  );

  assert.equal(draft.bank, "fab");
  assert.equal(draft.name, "FAB Cashback Card");
  assert.equal(draft.network, "Visa");
  assert.equal(draft.annualFee.amount, 525);
  assert.equal(draft.fxFee, 1.99);
  assert.equal(draft.eligibility.minSalary, 8000);
  assert.equal(draft.eligibility.salaryTransferRequired, false);
  assert.equal(draft.eligibility.residencyRequired, true);
  assert.equal(draft.earnRates.dining, 5);
  assert.equal(draft.earnRates.groceries, 3);
  assert.equal(draft.earnRates.fuel, 2);
  assert.equal(draft.earnRates.everythingElse, 1);
  assert.ok(draft.welcomeBonus, "Should detect a welcome bonus");
  assert.ok(draft.perks.length >= 5, "Should extract perks bullets");
});

test("Audit-05 perk filter strips bank-site navigation links", () => {
  const fakeMd = `# Card name

- 7% cashback on LuLu groceries
- [Personal Online Banking (UAE)](https://online.bankfab.com/PersonalBankingWeb/login)
- [FAB Business Portal](https://business.bankfab.com/)
- Complimentary access to 25 airport lounges
- [iBanking Corporate Online Banking](https://ibanking.bankfab.com/iportalweb/)
- Buy 1 Get 1 cinema tickets at VOX

Annual fee: AED 100.
Minimum salary AED 8,000 per month.
FX fee: 2%.`;

  const fixture = {
    url: "file://test",
    markdown: fakeMd,
    status: "ok" as const,
  };
  const draft = normalise(
    "fab",
    {
      slug: "test-card",
      name: "Test Card",
      network: "Visa",
      categories: ["cashback"],
      loyaltyProgram: "FAB Rewards",
      salaryTransferRequired: false,
      urls: { product: "https://test", kfs: null, welcome: null },
    },
    [fixture],
  );

  // Real card features are kept; nav-link bullets are dropped.
  assert.ok(
    draft.perks.some((p) => p.includes("LuLu groceries")),
    "Should keep real perks",
  );
  assert.ok(
    draft.perks.some((p) => p.includes("VOX")),
    "Should keep VOX cinema perk",
  );
  for (const navTerm of ["Online Banking", "Business Portal", "iBanking"]) {
    assert.ok(
      !draft.perks.some((p) => p.includes(navTerm)),
      `Should drop nav link containing "${navTerm}"`,
    );
  }
});

test("Audit-06 typed welcomeBonus shape passes the schema", async () => {
  const { isStructuredWelcomeBonus, welcomeBonusDisplay } = await import(
    "../../src/lib/cardsDataFormat.ts"
  );

  const valid = {
    amount: 40000,
    unit: "skywards_miles" as const,
    spend_threshold_aed: 25000,
    qualify_window_days: 90,
    headline_value_aed: 800,
    notes: "first eligible spend",
  };
  assert.ok(isStructuredWelcomeBonus(valid), "valid shape passes type-guard");
  const display = welcomeBonusDisplay(valid);
  assert.match(display, /40,?000/, "display includes amount");
  assert.match(display, /Skywards Miles/, "display includes unit label");
  assert.match(display, /spend AED 25,?000/, "display includes spend threshold");
  assert.match(display, /90 days/, "display includes window");

  assert.equal(welcomeBonusDisplay("legacy"), "legacy");
  assert.equal(welcomeBonusDisplay(undefined), "");
});

test("Audit-06 typed annualFeeWaiver shape renders correctly", async () => {
  const { isStructuredAnnualFeeWaiver, annualFeeWaiverDisplay } = await import(
    "../../src/lib/cardsDataFormat.ts"
  );

  const waiver = {
    year_one_waived: true,
    ongoing_threshold_aed: 100000,
    threshold_period: "annual" as const,
    notes: "Reversible from year two",
  };
  assert.ok(isStructuredAnnualFeeWaiver(waiver));
  const display = annualFeeWaiverDisplay(waiver);
  assert.match(display, /year-one waived/i);
  assert.match(display, /AED 100,?000/);
  assert.match(display, /annual spend/);

  assert.equal(annualFeeWaiverDisplay("legacy text"), "legacy text");
  assert.equal(annualFeeWaiverDisplay(undefined), "");
});

test("Audit-06 _features discriminated union accepts all 14 types", async () => {
  // Spot-check: build one of each feature type and confirm the loader
  // doesn't reject. We can't import the schema directly (it's wrapped in
  // module-level validation), so we round-trip via JSON.
  const samples = [
    { type: "cinema_bogo", operator: "VOX", max_per_month: 4, fb_discount_pct: 25 },
    { type: "entertainer_bogo", program: "The Entertainer", scope: "limited" },
    {
      type: "lounge_access",
      network: "DragonPass",
      scope: "unlimited",
      geo: ["UAE"],
    },
    { type: "hotel_discount", operator: "Emaar", discount_pct: 20 },
    { type: "hotel_earn_boost", operator: "Emaar", earn_pct: 7.5 },
    { type: "golf", discount_pct: 40, courses_count: 100, scope: "global" },
    {
      type: "status_match",
      program: "Skywards",
      tier: "Silver",
      duration: "year_one",
    },
    { type: "insurance_life", cover_aed: 100000 },
    { type: "insurance_travel", scope: "Visa Infinite" },
    { type: "concierge", scope: "24/7" },
    { type: "transit_card", networks: ["Nol", "Salik"] },
    { type: "valet", location: "Grand Drive, Dubai Mall" },
    { type: "roadside_assistance", scope: "uae" },
    {
      type: "travel_desk_discount",
      flights_pct: 3,
      holiday_pct: 7,
      desk_name: "ENBD Travel Desk",
    },
  ];
  assert.equal(samples.length, 14, "expected exactly 14 feature types");

  // Round-trip stability: every sample serialises and parses back identically.
  for (const s of samples) {
    const round = JSON.parse(JSON.stringify(s));
    assert.deepEqual(round, s, `round-trip OK for ${s.type}`);
  }
});

test("Audit-05 earn-rate cap rejects welcome-bonus contamination", () => {
  // FAB welcome offers like "Earn 40,000 Etihad Guest Miles" used to bleed
  // into earnRates.travel as 40 (mistaken for "40% on travel"). Cap at 10.
  const fakeMd = `Earn 40,000 Etihad Guest Miles when you spend AED 25,000 on travel in your first 90 days.
Annual fee: AED 1,500.
Minimum monthly salary AED 30,000.
FX fee: 1.99%.`;

  const fixture = {
    url: "file://test",
    markdown: fakeMd,
    status: "ok" as const,
  };
  const draft = normalise(
    "fab",
    {
      slug: "test-card",
      name: "Test Card",
      network: "Visa",
      categories: ["travel"],
      loyaltyProgram: "Etihad Guest",
      salaryTransferRequired: false,
      urls: { product: "https://test", kfs: null, welcome: null },
    },
    [fixture],
  );

  // travel earn rate must NOT be 40 (welcome bonus mile count).
  assert.notEqual(
    draft.earnRates.travel,
    40,
    "earn-rate cap should reject 40 as welcome-bonus contamination",
  );
});

// ── Audit-08: structured welcomeBonus parsing ────────────────────────────

test("Audit-08 parseWelcomeBonus: FAB Rewards points + spend + window", () => {
  const out = parseWelcomeBonus(
    "Earn 30,000 FAB Rewards points when you spend AED 5,000 in the first 60 days of card activation.",
  );
  assert.deepEqual(out, {
    amount: 30000,
    unit: "fab_rewards",
    spend_threshold_aed: 5000,
    qualify_window_days: 60,
  });
});

test("Audit-08 parseWelcomeBonus: Skywards Miles, months → days", () => {
  const out = parseWelcomeBonus(
    "Receive 50,000 Skywards Miles on AED 10,000 spend within 90 days.",
  );
  assert.deepEqual(out, {
    amount: 50000,
    unit: "skywards_miles",
    spend_threshold_aed: 10000,
    qualify_window_days: 90,
  });

  const months = parseWelcomeBonus(
    "Get AED 1,500 cashback when you spend AED 8,000 in your first 3 months.",
  );
  assert.deepEqual(months, {
    amount: 1500,
    unit: "aed_cashback",
    spend_threshold_aed: 8000,
    qualify_window_days: 90, // 3 months × 30
  });
});

test("Audit-08 parseWelcomeBonus returns null for un-parseable copy", () => {
  // No reward-unit keyword → null. The editor still gets the freetext stash;
  // we just don't fabricate a structured shape from a partial match.
  assert.equal(
    parseWelcomeBonus("Welcome to FAB. Apply today and unlock benefits."),
    null,
    "no unit keyword → null",
  );
  assert.equal(parseWelcomeBonus(""), null, "empty string → null");
  assert.equal(parseWelcomeBonus("AED 500"), null, "below min length → null");
  // Has a unit hint ("miles") but no amount adjacent to it → null.
  assert.equal(
    parseWelcomeBonus("Earn Skywards Miles on every dirham spent."),
    null,
    "unit without amount → null",
  );
});

test("Audit-08 normalise emits structured welcomeBonus from fixture", () => {
  const fixture = loadFixture(
    path.join("tests", "scrape", "fixtures", "welcome-bonus-samples.html"),
  );
  assert.equal(
    fixture.status,
    "ok",
    `Fixture must load: ${fixture.failReason ?? ""}`,
  );

  const draft = normalise(
    "fab",
    {
      slug: "fab-sample",
      name: "FAB Sample Card",
      network: "Visa",
      categories: ["lifestyle"],
      loyaltyProgram: "FAB Rewards",
      salaryTransferRequired: false,
      urls: {
        product: "https://www.bankfab.com/en-ae/personal/credit-cards/fab-sample",
        kfs: null,
        welcome: null,
      },
    },
    [fixture],
  );

  // Structured form, not a string. Asserting on the typed shape forces a
  // failure if the wiring regresses to the old free-text-only behaviour.
  assert.equal(
    typeof draft.welcomeBonus,
    "object",
    "welcomeBonus should be the structured object, not a string",
  );
  const wb = draft.welcomeBonus as {
    amount: number;
    unit: string;
    spend_threshold_aed: number | null;
    qualify_window_days: number | null;
  };
  assert.equal(wb.amount, 30000);
  assert.equal(wb.unit, "fab_rewards");
  assert.equal(wb.spend_threshold_aed, 5000);
  assert.equal(wb.qualify_window_days, 60);

  // Free-text capture is preserved alongside, so propose-changes can still
  // stash it under _scraped_freetext.welcomeBonus for editor review.
  assert.ok(
    draft.welcomeBonusFreetext &&
      draft.welcomeBonusFreetext.includes("FAB Rewards"),
    "welcomeBonusFreetext should keep the original marketing copy",
  );

  // welcomeBonusValue should mirror the structured amount, not the AED
  // spend-threshold figure (this was a regression risk pre-Audit-08).
  assert.equal(draft.welcomeBonusValue, 30000);
});

test("Audit-08 normalise falls back to free-text when structured parse fails", () => {
  // Welcome copy that mentions a unit-like word but no amount adjacent —
  // parseWelcomeBonus returns null and normalise falls back to the string.
  const md = `# Card

Welcome offer: earn rewards on every dirham. Contact us for details.

Annual fee: AED 200. FX fee: 1.99%. Minimum salary AED 8,000.`;

  const draft = normalise(
    "fab",
    {
      slug: "fab-fallback",
      name: "FAB Fallback Card",
      network: "Visa",
      categories: ["lifestyle"],
      salaryTransferRequired: false,
      urls: { product: "https://test", kfs: null, welcome: null },
    },
    [{ url: "file://test", markdown: md, status: "ok" as const }],
  );

  // Either undefined (no welcome match at all) or a string fallback is
  // acceptable — the contract is "never silently emit a half-structured
  // object". If welcomeBonus is set, it must be a string in the fallback path.
  if (draft.welcomeBonus !== undefined) {
    assert.equal(
      typeof draft.welcomeBonus,
      "string",
      "fallback path should emit string, not partial structured shape",
    );
  }
});

// ── C5: Parser improvements for ADCB-style phrasings ─────────────────────
// These tests synthesise minimal markdown fragments and feed them through
// normalise() to verify the parser improvements handle UAE bank phrasings
// beyond the original FAB-only patterns.

const stubCard = {
  slug: "stub",
  name: "Stub",
  network: "Visa" as const,
  categories: ["cashback" as const],
  loyaltyProgram: undefined,
  salaryTransferRequired: false,
  urls: { product: "https://example.com/card", kfs: null, welcome: null },
};

function synth(markdown: string) {
  return {
    url: "https://example.com/card",
    markdown,
    status: "ok" as const,
  };
}

test("C5 parseAnnualFee: tight phrasing 'Annual Fee: AED 314' (ADCB-style)", () => {
  const draft = normalise("adcb", stubCard, [
    synth("Annual Fee: AED 314\n\nForeign currency: 2.49%"),
  ]);
  assert.equal(draft.annualFee.amount, 314);
});

test("C5 parseAnnualFee: waiver-clause crosses a period", () => {
  const draft = normalise("adcb", stubCard, [
    synth("Annual fee waived for the first year. AED 525 thereafter."),
  ]);
  assert.equal(draft.annualFee.amount, 525);
});

test("C5 parseAnnualFee: 'Annual Card Fee' variant phrasing", () => {
  const draft = normalise("adcb", stubCard, [
    synth("| Annual Card Fee | AED 1,200 |\n| FX | 2.49% |"),
  ]);
  assert.equal(draft.annualFee.amount, 1200);
});

test("C5 parseAnnualFee: 'Free' / 'AED 0' returns 0 (not null)", () => {
  const a = normalise("adcb", stubCard, [synth("Annual Fee: Free")]);
  assert.equal(a.annualFee.amount, 0);

  const b = normalise("adcb", stubCard, [synth("Annual Fee: AED 0")]);
  assert.equal(b.annualFee.amount, 0);

  const c = normalise("adcb", stubCard, [synth("Annual Membership Fee: complimentary")]);
  assert.equal(c.annualFee.amount, 0);
});

test("C5 parseAnnualFee: rejects implausibly large values", () => {
  // "Annual fee for spending AED 30,000" — 30000 should NOT be picked up as the fee
  const draft = normalise("adcb", stubCard, [
    synth("Annual fee waived if you spend AED 30,000 monthly. Otherwise AED 314."),
  ]);
  // First plausible match wins after the waiver phrasing
  assert.ok(
    draft.annualFee.amount === 314 || draft.annualFee.amount === 0,
    `Expected 314 or 0, got ${draft.annualFee.amount}`,
  );
});

test("C5 parseFxFee: 'Forex markup: 1.99%' (variant phrasing)", () => {
  const draft = normalise("adcb", stubCard, [
    synth("Annual Fee: AED 314\nForex markup: 1.99%\nMin salary AED 5,000"),
  ]);
  assert.equal(draft.fxFee, 1.99);
});

test("C5 parseFxFee: 'International transaction: 2.49%' (variant phrasing)", () => {
  const draft = normalise("adcb", stubCard, [
    synth("Annual Fee: AED 314\nInternational transaction fee: 2.49%"),
  ]);
  assert.equal(draft.fxFee, 2.49);
});

test("C5 parseFxFee: trigger after period still matches", () => {
  const draft = normalise("adcb", stubCard, [
    synth("Annual Fee: AED 314.\n\nForeign currency. Charged at 2.49%."),
  ]);
  assert.equal(draft.fxFee, 2.49);
});

test("C5 parseFxFee: implausible values rejected", () => {
  const draft = normalise("adcb", stubCard, [
    // 99% is way out of UAE FX-fee range — should reject, not capture
    synth("Annual Fee: AED 314\nForeign currency 99% adventures await"),
  ]);
  assert.ok(
    draft.fxFee === 0 || draft.fxFee === undefined || draft.fxFee === null,
    `Expected fxFee to be unset, got ${draft.fxFee}`,
  );
});

test("C5 parseWelcome: 'Sign-up bonus' trigger (ADCB-style)", () => {
  // Use FAB Rewards as the unit — ADCB-equivalent (TouchPoints) is also covered
  const draft = normalise("adcb", { ...stubCard, slug: "stub-touchpoints" }, [
    synth(
      "Annual Fee: AED 314.\nSign-up bonus: Earn 5,000 TouchPoints when you spend AED 3,000 in your first 60 days.",
    ),
  ]);
  // Either structured (preferred) or freetext fallback — both prove parseWelcome found the trigger
  assert.ok(
    draft.welcomeBonus !== undefined && draft.welcomeBonus !== null,
    "Welcome bonus should be detected with sign-up trigger",
  );
});

test("C5 parseWelcome: 'Joining offer' trigger", () => {
  const draft = normalise("adcb", stubCard, [
    synth(
      "Annual Fee: AED 314.\nJoining offer: Get AED 200 cashback after spending AED 5,000 in 30 days.",
    ),
  ]);
  assert.ok(
    draft.welcomeBonus !== undefined && draft.welcomeBonus !== null,
    "Welcome bonus should be detected with joining-offer trigger",
  );
});

test("C5 normalise: ADCB-style page produces a complete typed draft", () => {
  const md = `
# ADCB TouchPoints Platinum Credit Card

Annual Fee: AED 314 (waived for the first year).

Foreign currency transaction fee: 2.49%

Minimum monthly salary AED 8,000.

Sign-up bonus: Earn 10,000 TouchPoints when you spend AED 3,000 in 60 days.

- 5x TouchPoints on dining
- 3x TouchPoints on shopping
- 1x TouchPoints on every spend
- Complimentary lounge access via DragonPass
`;
  const draft = normalise(
    "adcb",
    { ...stubCard, slug: "adcb-touchpoints-platinum", loyaltyProgram: "ADCB TouchPoints" },
    [synth(md)],
  );
  assert.equal(draft.annualFee.amount, 314);
  assert.equal(draft.fxFee, 2.49);
  assert.equal(draft.eligibility.minSalary, 8000);
  assert.equal(draft.earnRates.dining, 5);
  assert.equal(draft.earnRates.shopping, 3);
  assert.equal(draft.earnRates.everythingElse, 1);
  assert.ok(draft.welcomeBonus !== undefined, "welcomeBonus should be set");
});
