// Unit tests for the scrape normaliser.
//
// Run: node --import tsx --test tests/scrape/_normaliser.test.ts
// (or via `npm test` once wired into package.json)

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { loadFixture, parseAED, parsePercent, parseMinSalary, parseEarnRate } from "../../scripts/scrape/_lib.ts";
import { normalise } from "../../scripts/scrape/_normaliser.ts";

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
