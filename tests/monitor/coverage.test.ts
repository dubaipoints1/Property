// Unit tests for check coverage — the rules that decide whether a check
// is read at all, and whether the poller noticed it read all of it.
//
// Run: node --import tsx --test tests/monitor/coverage.test.ts
//
// The first test is the ADCB regression and the reason this file exists.
// On 6 September 2026 the product-pages monitor caught ADCB cutting the
// Essential Cashback welcome bonus from AED 300 to AED 250: the page came
// back `changed` and the judge ruled it `meaningful: true` at high
// confidence. One unrelated page in the same run failed to scrape, so the
// check's status was `partial`, and poll.mjs listed checks with
// `?status=completed`. The check was never listed, so its 42 changed
// pages were never read.
//
// The cut was not delayed by a week — it was lost. The 13 September check
// diffed against the 6 September scrape, which already said AED 250, so
// no later run could surface it. It was found by hand on 13 September.
//
// Restoring `partial` to the completed-only filter is a one-line change
// and therefore a one-line revert. These tests are what stands between
// that revert and another silent miss.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  READABLE_CHECK_STATUSES,
  coverageGapsFor,
  isReadableCheck,
  pageFetchLimit,
} from "../../scripts/monitor/_routing.mjs";

/** The 6 September 2026 product-pages check, as the API reported it. */
const ADCB_PARTIAL_CHECK = {
  id: "01a0740f-a656-70ee-8331-68a65f14cd70",
  status: "partial",
  summary: { totalPages: 55, same: 12, changed: 42, new: 0, removed: 0, error: 1 },
};

test("a partial check is read — the ADCB welcome-bonus regression", () => {
  assert.equal(
    isReadableCheck(ADCB_PARTIAL_CHECK),
    true,
    "a check with one failed page still carries 42 good diffs; dropping it loses them permanently",
  );
  assert.ok(READABLE_CHECK_STATUSES.has("partial"));
  assert.ok(READABLE_CHECK_STATUSES.has("completed"));
});

test("a check still running is not read, and not marked seen", () => {
  for (const status of ["running", "pending", "queued", "failed", undefined]) {
    assert.equal(isReadableCheck({ status }), false, `status ${String(status)}`);
  }
  assert.equal(isReadableCheck(undefined), false);
});

test("the page fetch asks for more than the check says changed", () => {
  // The old fixed limit of 50 sat below the product-pages monitor's own
  // 55 URLs and came within five of truncating twice in August 2026.
  assert.ok(pageFetchLimit({ summary: { changed: 45 } }) > 55);
  assert.ok(pageFetchLimit({ summary: { changed: 55 } }) > 55);
  assert.ok(pageFetchLimit({ summary: { changed: 200 } }) > 200);
  assert.equal(pageFetchLimit({}), 100);
  assert.equal(pageFetchLimit(undefined), 100);
});

test("an errored page is reported as a coverage gap, not swallowed", () => {
  const gaps = coverageGapsFor(ADCB_PARTIAL_CHECK, 42);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].kind, "errored");
  assert.equal(gaps[0].count, 1);
  assert.match(gaps[0].note, /invisible to this run AND to the next one/);
});

test("a short page list is reported as truncation", () => {
  const gaps = coverageGapsFor({ summary: { changed: 55, error: 0 } }, 50);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].kind, "truncated");
  assert.equal(gaps[0].count, 5);
  assert.match(gaps[0].note, /reported 55 changed page\(s\) but returned 50/);
});

test("a clean check reports no gaps", () => {
  assert.deepEqual(coverageGapsFor({ summary: { changed: 35, error: 0 } }, 35), []);
  assert.deepEqual(coverageGapsFor({ summary: { changed: 0, error: 0 } }, 0), []);
  assert.deepEqual(coverageGapsFor({}, 0), []);
});

test("both gaps are reported when a check errors and truncates", () => {
  const gaps = coverageGapsFor({ summary: { changed: 60, error: 2 } }, 50);
  assert.deepEqual(gaps.map((g) => g.kind).sort(), ["errored", "truncated"]);
});
