// Pins the legacy goal classifier used by the homepage. Finder handles
// missing and unconfirmed programme evidence in its own regression tests.

import { test } from "node:test";
import assert from "node:assert/strict";

import { loyaltyTag } from "../../src/lib/cardsDataFormat";

test("miles programmes classify as miles", () => {
  for (const p of [
    "Emirates Skywards",
    "Etihad Guest",
    "Qatar Avios",
    "Saudia Alfursan",
    "Air Miles",
  ]) {
    assert.equal(loyaltyTag(p), "miles", p);
  }
});

test("cashback and AED-denominated programmes classify as cashback", () => {
  for (const p of ["", undefined, null, "Cashback", "AED cashback wallet"]) {
    assert.equal(loyaltyTag(p as string | undefined | null), "cashback", String(p));
  }
});

test("everything else classifies as points", () => {
  for (const p of ["Mashreq Salaam points", "FAB Rewards", "ADCB TouchPoints"]) {
    assert.equal(loyaltyTag(p), "points", p);
  }
});
