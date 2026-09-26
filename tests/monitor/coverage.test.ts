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
  checkListQueries,
  coverageGapsFor,
  isReadableCheck,
  MONITOR_CRONS,
  newestFirst,
  pageAll,
  scheduleCollisions,
  cronSlots,
  checksPerMonth,
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

test("the check list is requested per status, never unfiltered", () => {
  // The API's `status` takes ONE value and omitting it does not mean "all":
  // an unfiltered list returns completed checks and leaves `partial` out.
  // The first attempt at this fix relied on that default, the poll reported
  // "no new checks", and the 6 September partial stayed invisible.
  const queries = checkListQueries(10);
  assert.equal(queries.length, READABLE_CHECK_STATUSES.size);
  assert.ok(
    queries.some((q) => q.includes("status=partial")),
    "partial must be asked for by name — it is not in the default",
  );
  assert.ok(queries.some((q) => q.includes("status=completed")));
  for (const q of queries) {
    assert.match(q, /^\?status=[a-z]+&limit=10$/);
  }
});

test("merged check lists sort newest first", () => {
  const sorted = [
    { id: "old", scheduledFor: "2026-08-30 00:00:00+00" },
    { id: "new", scheduledFor: "2026-09-13 00:00:00+00" },
    { id: "mid", scheduledFor: "2026-09-06 00:00:00+00" },
  ].sort(newestFirst);
  assert.deepEqual(
    sorted.map((c) => c.id),
    ["new", "mid", "old"],
  );
  // Missing timestamps must not throw or reorder unpredictably.
  assert.equal(newestFirst({}, {}), 0);
});

// ── the duplicate-monitor incident, 15 September 2026 ─────────────────
//
// setup.mjs matches existing monitors by name to decide update-vs-create.
// It listed them with one unpaged request; the endpoint defaults to
// limit=25 and this key carries 47 monitors, so all five of ours fell
// outside the page and the script created five duplicates beside the
// originals. The duplicates had no check history, the poller read them
// instead of the live monitors and reported "no new checks" for a fleet
// that was still running, and both sets billed — 5,330 credits/month
// against a 5,000/month plan.
//
// One unpaged list request is the whole bug, so paging is asserted.

test("pageAll follows every page, not just the first", async () => {
  const all = Array.from({ length: 47 }, (_, i) => ({ id: `m${i}` }));
  const seen: Array<[number, number]> = [];
  const got = await pageAll(
    async (limit, offset) => {
      seen.push([limit, offset]);
      return all.slice(offset, offset + limit);
    },
    { limit: 25 },
  );
  assert.equal(got.length, 47, "a 47-monitor key must not come back as 25");
  assert.deepEqual(got.map((m) => m.id), all.map((m) => m.id));
  assert.deepEqual(seen, [[25, 0], [25, 25]], "second page requested with the right offset");
});

test("pageAll stops on a short page and on an exactly-full final page", async () => {
  // Short first page → one request.
  let calls = 0;
  assert.equal(
    (await pageAll(async () => { calls += 1; return [{ id: "a" }]; }, { limit: 25 })).length,
    1,
  );
  assert.equal(calls, 1);

  // Exactly `limit` then empty → two requests, no infinite loop.
  const pages = [Array.from({ length: 25 }, (_, i) => ({ id: `x${i}` })), []];
  let n = 0;
  assert.equal((await pageAll(async () => pages[n++] ?? [], { limit: 25 })).length, 25);
  assert.equal(n, 2);
});

test("pageAll refuses to loop forever on a server that never shortens a page", async () => {
  await assert.rejects(
    () => pageAll(async (limit) => Array.from({ length: limit }, () => ({ id: "same" })), {
      limit: 25,
      hardCap: 100,
    }),
    /did not terminate/,
  );
});

// ── batch collision, 16 September 2026 ────────────────────────────────
//
// Firecrawl's concurrent-browser limit tripped because three of our five
// monitors fired at the same instant — "weekly" resolves to Sunday 00:00
// UTC, so product-pages (57 URLs), salary-transfer (19) and fee-docs (12)
// launched 88 pages together. The 37 unrelated monitors sharing this API
// key were NOT the cause: they are many small search jobs, already
// staggered across 02:00–03:00 UTC. Our few very large page batches are
// what amplified their few-minute delays into a hard limit.
//
// So the invariant is about OUR batches, and it is simply: never two at
// once. Asserted rather than commented, because the last version of this
// schedule was also believed to be staggered.

test("no two monitors fire in the same hour", () => {
  assert.deepEqual(
    scheduleCollisions(),
    [],
    "two monitors sharing an hour is the 16 September concurrency failure",
  );
});

test("scheduleCollisions actually detects a collision", () => {
  // The guard above is worthless if the detector cannot fail. This is
  // the exact shape that broke: three monitors on Sunday 00:00.
  const broken = {
    "product-pages": "0 0 * * 0",
    "salary-transfer": "0 0 * * 0",
    "fee-docs": "0 0 * * 0",
  };
  const found = scheduleCollisions(broken);
  assert.equal(found.length, 3, "all three pairs collide");
  for (const [, , slot] of found) assert.equal(slot, "0:0");
});

test("a daily monitor collides with a weekly one in the same hour", () => {
  // Daily expands to all seven days, so it must clash with a weekly
  // monitor at that hour — the subtler case a hand-check would miss.
  assert.deepEqual(
    scheduleCollisions({ daily: "0 9 * * *", weekly: "0 9 * * 0" }),
    [["daily", "weekly", "0:9"]],
  );
  // ...and not with one an hour away.
  assert.deepEqual(scheduleCollisions({ daily: "0 9 * * *", weekly: "0 10 * * 0" }), []);
});

test("every monitor is scheduled clear of the shared key's busy window", () => {
  // 37 monitors belonging to another project run on Asia/Dubai time and
  // cluster into 02:00–03:00 UTC. Ours must not be in there.
  for (const [key, cron] of Object.entries(MONITOR_CRONS)) {
    const hour = Number(cron.split(/\s+/)[1]);
    assert.ok(
      hour >= 8 && hour <= 15,
      `${key} at ${hour}:00 UTC is outside the quiet 08:00–15:00 band`,
    );
  }
});

test("cronSlots handles the day-list and day-of-month shapes of the 26 Sep cadence cut", () => {
  assert.deepEqual([...cronSlots("0 13 * * 1,4")].sort(), ["1:13", "4:13"]);
  // A day-of-month schedule can fall on any weekday, so it occupies its
  // hour on all seven — and therefore collides with any weekly monitor there.
  assert.equal(cronSlots("0 12 1 * *").size, 7);
  assert.deepEqual(scheduleCollisions({ monthly: "0 9 1 * *", weekly: "0 9 * * 0" }), [
    ["monthly", "weekly", "0:9"],
  ]);
});

test("checksPerMonth prices each cron shape the fleet uses", () => {
  assert.equal(checksPerMonth("0 13 * * *"), 30);
  assert.equal(checksPerMonth("0 10 * * 3"), 5);
  assert.equal(checksPerMonth("0 13 * * 1,4"), 9);
  assert.equal(checksPerMonth("0 14 * * 1,3,5"), 13);
  assert.equal(checksPerMonth("0 9 1,15 * *"), 2);
  assert.equal(checksPerMonth("0 12 1 * *"), 1);
});

test("no schedule restricts both day-of-month and day-of-week", () => {
  // Standard cron ORs the two when both are set — "the 1st OR any Monday" —
  // which would silently multiply the checks the cadence cut removed.
  for (const [key, cron] of Object.entries(MONITOR_CRONS)) {
    const [, , dom, , dow] = cron.split(/\s+/);
    assert.ok(dom === "*" || dow === "*", `${key} (${cron}) restricts both day fields`);
  }
});
