// Tests for the propose-changes merge contract.
//
// Council STATUS Question A resolved 2026-05-08: welcomeBonus moved back into
// SCRAPED_FIELDS so the structured form from `parseWelcomeBonus()` reaches
// cards.json; the raw copy stays under _scraped_freetext.welcomeBonus, sourced
// from the normaliser's `welcomeBonusFreetext` field.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeDraft, SCRAPED_FIELDS, FREETEXT_FIELDS, isPlausibleWelcomeBonus } from "../../scripts/scrape/propose-changes.ts";

test("Audit-09 SCRAPED_FIELDS includes welcomeBonus", () => {
  assert.ok(
    SCRAPED_FIELDS.includes("welcomeBonus" as never),
    "welcomeBonus must be in SCRAPED_FIELDS so structured parses reach cards.json",
  );
});

test("Audit-09 FREETEXT_FIELDS maps welcomeBonus → welcomeBonusFreetext", () => {
  assert.equal(
    (FREETEXT_FIELDS as Record<string, string>).welcomeBonus,
    "welcomeBonusFreetext",
    "welcomeBonus stash must source from welcomeBonusFreetext per normaliser intent",
  );
});

test("Audit-09 mergeDraft routes structured welcomeBonus to top level", () => {
  const draft = {
    bank: "FAB",
    name: "FAB Cashback Visa",
    welcomeBonus: {
      amount: 30000,
      unit: "fab_rewards",
      spend_threshold_aed: 5000,
      qualify_window_days: 60,
    },
    welcomeBonusFreetext:
      "Earn 30,000 FAB Rewards points when you spend AED 5,000 in the first 60 days.",
  };

  const { entry, outcome } = mergeDraft("fab-cashback", undefined, draft);

  assert.deepEqual(entry.welcomeBonus, draft.welcomeBonus);
  assert.equal(entry._provenance?.welcomeBonus, "scraped");
  assert.ok(outcome.changedFields.includes("welcomeBonus"));
});

test("Audit-09 mergeDraft stashes raw copy under _scraped_freetext.welcomeBonus", () => {
  const draft = {
    welcomeBonus: { amount: 50000, unit: "skywards_miles", spend_threshold_aed: 10000, qualify_window_days: 90 },
    welcomeBonusFreetext: "Receive 50,000 Skywards Miles on AED 10,000 spend within 90 days.",
  };

  const { entry } = mergeDraft("enbd-skywards-infinite", undefined, draft);

  const stash = entry._scraped_freetext as Record<string, unknown> | undefined;
  assert.ok(stash, "_scraped_freetext should exist");
  assert.equal(
    stash?.welcomeBonus,
    "Receive 50,000 Skywards Miles on AED 10,000 spend within 90 days.",
    "freetext stash key is welcomeBonus, sourced from draft.welcomeBonusFreetext",
  );
});

test("Audit-09 mergeDraft preserves editor-confirmed welcomeBonus on subsequent scrape", () => {
  const existing = {
    welcomeBonus: {
      amount: 100000,
      unit: "fab_rewards",
      spend_threshold_aed: 25000,
      qualify_window_days: 90,
      notes: "editor verified against KFS, 2026-04-12",
    },
    _provenance: { welcomeBonus: "editor-confirmed" as const },
    _lastScraped: "2026-04-01",
    _lastReviewed: "2026-04-12",
  };
  const draft = {
    welcomeBonus: {
      amount: 30000,
      unit: "fab_rewards",
      spend_threshold_aed: 5000,
      qualify_window_days: 60,
    },
    welcomeBonusFreetext:
      "Earn 30,000 FAB Rewards points when you spend AED 5,000 in the first 60 days.",
  };

  const { entry, outcome } = mergeDraft("fab-cashback", existing, draft);

  assert.deepEqual(
    entry.welcomeBonus,
    existing.welcomeBonus,
    "editor-confirmed value must not be overwritten",
  );
  assert.equal(entry._provenance?.welcomeBonus, "editor-confirmed");
  assert.ok(outcome.preservedFields.includes("welcomeBonus"));
  assert.ok(!outcome.changedFields.includes("welcomeBonus"));
});

test("Audit-09 mergeDraft falls back to string welcomeBonus when normaliser couldn't structure it", () => {
  const draft = {
    welcomeBonus:
      "Bonus rewards available — terms and conditions apply, see KFS.",
    welcomeBonusFreetext:
      "Bonus rewards available — terms and conditions apply, see KFS.",
  };

  const { entry } = mergeDraft("some-card", undefined, draft);

  assert.equal(typeof entry.welcomeBonus, "string");
  assert.equal(entry._provenance?.welcomeBonus, "scraped");
});

// ─────────────────────────────────────────────────────────────────────────
// PR #207 audit (6 June 2026): the plausibility guard against the welcome-
// bonus contamination class. The four cases below are the actual strings
// the 2 June scrape merge produced. Each must be rejected by
// isPlausibleWelcomeBonus() AND must NOT be written to top-level L2 by
// mergeDraft() (instead the raw value lands under _scraped_freetext.welcome
// BonusFreetext for editor audit).
// ─────────────────────────────────────────────────────────────────────────

test("PR-207 isPlausibleWelcomeBonus rejects markdown-image contamination", () => {
  const contaminated = "welcome offer** ![Earn upto 15 Plus Points on your retail spends](https://www";
  assert.equal(isPlausibleWelcomeBonus(contaminated), false);
});

test("PR-207 isPlausibleWelcomeBonus rejects raw-HTML fragments", () => {
  const broken = "Up to 1 LuLu Points<br>- 0";
  assert.equal(isPlausibleWelcomeBonus(broken), false);
});

test("PR-207 isPlausibleWelcomeBonus rejects empty / near-empty captures", () => {
  assert.equal(isPlausibleWelcomeBonus(""), false);
  assert.equal(isPlausibleWelcomeBonus("welcome"), false);
});

test("PR-207 isPlausibleWelcomeBonus accepts the structured object the normaliser emits", () => {
  const structured = { amount: 1000, unit: "aed_voucher", spend_threshold_aed: 10000, qualify_window_days: 30 };
  assert.equal(isPlausibleWelcomeBonus(structured), true);
});

test("PR-207 isPlausibleWelcomeBonus accepts plausible editor-typed string fallback", () => {
  const real = "Welcome bonus of AED 365 - Enjoy a welcome bonus of AED 365 when you sign up for the card.";
  assert.equal(isPlausibleWelcomeBonus(real), true);
});

test("PR-207 isPlausibleWelcomeBonus accepts a real bifurcated bonus signal", () => {
  const bifurcated = "welcome bonus of AED 1,200 and UAE residents will receive a welcome bonus of AED 1,000";
  assert.equal(isPlausibleWelcomeBonus(bifurcated), true);
});

test("PR-226 mergeDraft does not write present-with-null for previously-absent optional string fields", () => {
  // The 6 June 2026 weekly scrape (PR #226) wrote `loyaltyProgram: null`
  // to adcb-365-cashback + adcb-essential-cashback. Pre-scrape, these
  // cards had no loyaltyProgram key at all. Zod's `z.string().optional()`
  // accepts absent OR string but NOT present-with-null — the build broke
  // on parse. The guard skips the write when the scraped value is null
  // and the existing entry has no value, so the field stays absent.
  const draft = { loyaltyProgram: null };
  // No existing entry — first scrape on a new card
  const { entry } = mergeDraft("test-card", undefined, draft);
  assert.equal("loyaltyProgram" in entry, false, "loyaltyProgram must not appear in entry as a null key");
});

test("PR-207 mergeDraft skips top-level write for contaminated welcomeBonus, freetext still captured", () => {
  const draft = {
    welcomeBonus: "welcome offer** ![Earn upto 15 Plus Points on your retail spends](https://www",
    welcomeBonusFreetext: "welcome offer** ![Earn upto 15 Plus Points on your retail spends](https://www",
  };
  const { entry } = mergeDraft("emirates-nbd-visa-flexi", undefined, draft);
  assert.equal(entry.welcomeBonus, undefined, "contaminated string must not reach top-level welcomeBonus");
  assert.equal(
    (entry._scraped_freetext as Record<string, unknown> | undefined)?.welcomeBonus,
    "welcome offer** ![Earn upto 15 Plus Points on your retail spends](https://www",
    "raw capture must still land in _scraped_freetext for editor audit",
  );
});
