// Tests for the propose-changes merge contract.
//
// Council STATUS Question A resolved 2026-05-08: welcomeBonus moved back into
// SCRAPED_FIELDS so the structured form from `parseWelcomeBonus()` reaches
// cards.json; the raw copy stays under _scraped_freetext.welcomeBonus, sourced
// from the normaliser's `welcomeBonusFreetext` field.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeDraft, SCRAPED_FIELDS, FREETEXT_FIELDS } from "../../scripts/scrape/propose-changes.ts";

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
