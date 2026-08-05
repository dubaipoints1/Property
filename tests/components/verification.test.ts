// Unit tests for the shared 90-day verification threshold.
//
// Run: node --import tsx --test tests/components/verification.test.ts
//
// The threshold used to be a literal copied into VerifiedStamp.astro,
// cards/SpecCard.astro and islands/RewardsCalculator.tsx. It is now one
// definition in ~/lib/verification consumed by those three plus the
// salary-transfer tracker island, so it is worth pinning: a change here
// moves the drift flag on every card and every offer at once.
//
// These tests inject `now` rather than reading the clock, so they do not
// start failing on a particular date. That matters — the live offers are
// currently ~36 days old, so the stale branch renders nowhere on the site
// today and this file is the only thing exercising it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { NINETY_DAYS_MS, isStale } from "../../src/lib/verification";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-08-05T00:00:00Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY);
}

test("the threshold is 90 days in milliseconds", () => {
  assert.equal(NINETY_DAYS_MS, 90 * DAY);
});

test("a recent verification is not stale", () => {
  assert.equal(isStale(daysAgo(0), NOW), false);
  assert.equal(isStale(daysAgo(36), NOW), false); // today's live offers
  assert.equal(isStale(daysAgo(69), NOW), false); // the archived ENBD row
});

test("the boundary is exclusive at exactly 90 days", () => {
  // Strictly greater-than, so a card verified 90 days ago to the second
  // is still fresh and flips the following day.
  assert.equal(isStale(daysAgo(90), NOW), false);
  assert.equal(isStale(new Date(NOW.getTime() - NINETY_DAYS_MS - 1), NOW), true);
});

test("a verification past the threshold is stale", () => {
  assert.equal(isStale(daysAgo(91), NOW), true);
  assert.equal(isStale(daysAgo(365), NOW), true);
});

test("accepts an ISO string as well as a Date", () => {
  // Offers arrive from offerAdapter as ISO strings; cards arrive as Dates.
  assert.equal(isStale("2026-01-01T00:00:00.000Z", NOW), true);
  assert.equal(isStale("2026-07-30T00:00:00.000Z", NOW), false);
});

test("accepts a numeric `now` as well as a Date", () => {
  assert.equal(isStale(daysAgo(91), NOW.getTime()), true);
  assert.equal(isStale(daysAgo(1), NOW.getTime()), false);
});

test("a future verification date is never stale", () => {
  // Not expected in the data, but the predicate should not wrap around.
  assert.equal(isStale(new Date(NOW.getTime() + 10 * DAY), NOW), false);
});
