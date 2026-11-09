import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readCheckHistory,
  readChangedPages,
  retainedAcknowledgements,
  latestDueSlot,
  collectionFreshness,
} from "../../scripts/monitor/_routing.mjs";

const summaries = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `check-${index}`,
    status: "completed",
    scheduledFor: "2026-11-02 14:00:00+00",
    summary: { totalPages: 8, changed: 0, error: 0 },
  }));
const pages = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `page-${index}`,
    url: `https://issuer.example/news/${index}`,
    status: "changed",
  }));

test("real raw list shape has no pagination metadata; offsets reach a short or empty final page", async () => {
  for (const count of [3, 4]) {
    const input = summaries(count),
      offsets: number[] = [];
    const result = await readCheckHistory(
      async (limit, offset) => {
        offsets.push(offset);
        return { success: true, data: input.slice(offset, offset + limit) };
      },
      { limit: 2, maxChecks: 8, status: "completed" },
    );
    assert.equal(result.complete, true);
    assert.deepEqual(result.checks, input);
    assert.deepEqual(offsets, count === 3 ? [0, 2] : [0, 2, 4]);
  }
});

test("history pagination fails closed on ignored offset, duplicates, mismatch, transport and hard cap", async () => {
  const input = summaries(5);
  for (const mode of ["ignored", "duplicate", "mismatch", "transport", "cap"]) {
    const result = await readCheckHistory(
      async (limit, offset) => {
        if (offset && mode === "transport")
          throw new Error("connection closed");
        if (offset && mode === "duplicate") return { data: [input[0]] };
        if (offset && mode === "mismatch")
          return { data: [{ id: "wrong", status: "partial" }] };
        return {
          success: true,
          data: input.slice(
            mode === "ignored" ? 0 : offset,
            (mode === "ignored" ? 0 : offset) + limit,
          ),
        };
      },
      { limit: 2, maxChecks: mode === "cap" ? 4 : 8, status: "completed" },
    );
    assert.equal(result.complete, false, mode);
    assert.ok(result.error, mode);
    assert.ok(
      result.checks.length >= 2,
      "already read summaries remain useful",
    );
    assert.ok(result.requests <= 3, "a broken provider cannot loop forever");
  }
});

test("exact history cap can be proven complete with one empty terminal probe", async () => {
  const input = summaries(4),
    offsets: number[] = [];
  const result = await readCheckHistory(
    async (limit, offset) => {
      offsets.push(offset);
      return { data: input.slice(offset, offset + limit) };
    },
    { limit: 2, maxChecks: 4 },
  );
  assert.equal(result.complete, true);
  assert.deepEqual(offsets, [0, 2, 4]);
});

test("real detail shape with internal-service next hints is read through skip only", async () => {
  const input = pages(6),
    skips: number[] = [];
  input[0].url = "https://www.emirates.com/media-centre/";
  input[1].url = "https://news.marriott.com/";
  const result = await readChangedPages(
    async (limit, skip) => {
      skips.push(skip);
      // Reduced real response shape, including the provider's unusable origin.
      const next = `http://app-service.firecrawl:3002/v2/monitor/monitor-id/checks/check-id?skip=${skip + limit}&limit=${limit}&status=changed`;
      return {
        success: true,
        data: {
          id: "check-id",
          monitorId: "monitor-id",
          pages: input.slice(skip, skip + limit),
          next,
        },
        next,
      };
    },
    { limit: 1, maxResults: 8, expected: 6 },
  );
  assert.equal(result.complete, true);
  assert.deepEqual(result.pages, input);
  assert.deepEqual(skips, [0, 1, 2, 3, 4, 5, 6]);
});

test("detail reads tolerate a server page cap, but never dereference any next hint", async () => {
  const input = pages(3),
    skips: number[] = [];
  const result = await readChangedPages(
    async (_limit, skip) => {
      skips.push(skip);
      return {
        data: {
          pages: input.slice(skip, skip + 1),
          next: "https://attacker.invalid/credential-trap",
        },
        next: "file:///private/secret",
      };
    },
    { limit: 2, maxResults: 6, expected: 3 },
  );
  assert.equal(result.complete, true);
  assert.deepEqual(skips, [0, 1, 2]);
  assert.equal(result.pages.length, 3);
});

test("detail failures preserve good pages but remain incomplete and retryable", async () => {
  const input = pages(5);
  for (const mode of ["repeat", "transport", "malformed", "cap"]) {
    const result = await readChangedPages(
      async (limit, skip) => {
        if (skip && mode === "transport")
          throw new Error("detail connection closed");
        if (skip && mode === "malformed") return { data: { pages: {} } };
        return {
          data: {
            pages: input.slice(
              mode === "repeat" ? 0 : skip,
              (mode === "repeat" ? 0 : skip) + limit,
            ),
          },
        };
      },
      { limit: 2, maxResults: mode === "cap" ? 4 : 8, expected: 5 },
    );
    assert.equal(result.complete, false, mode);
    assert.ok(result.pages.length >= 2, mode);
    assert.ok(result.error, mode);
  }
});

test("complete enumeration retains more than500 handled IDs without evicting recent changes", () => {
  const history = summaries(800),
    handled = history.map((check) => check.id);
  assert.deepEqual(
    retainedAcknowledgements(["expired", ...handled], history, true),
    handled,
  );
  assert.deepEqual(
    retainedAcknowledgements(
      ["expired", ...handled],
      history.slice(0, 100),
      false,
    ),
    ["expired", ...handled],
  );
});

test("live UTC fleet cron shapes identify the latest due slot across day/month/leap boundaries", () => {
  assert.equal(
    latestDueSlot(
      { cron: "0 9 1,15 * *", timezone: "UTC" },
      "2026-11-08T15:00:00Z",
    ),
    "2026-11-01T09:00:00.000Z",
  );
  assert.equal(
    latestDueSlot(
      { cron: "0 14 * * 1,3,5", timezone: "UTC" },
      "2026-11-08T15:00:00Z",
    ),
    "2026-11-06T14:00:00.000Z",
  );
  assert.equal(
    latestDueSlot(
      { cron: "0 12 1 * *", timezone: "UTC" },
      "2026-11-01T11:59:59Z",
    ),
    "2026-10-01T12:00:00.000Z",
  );
  assert.equal(
    latestDueSlot(
      { cron: "30 12 29 * *", timezone: "UTC" },
      "2028-03-01T00:00:00Z",
    ),
    "2028-02-29T12:30:00.000Z",
  );
});

test("unsupported cron/timezones are explicit; no guessed timing grace is added", () => {
  for (const schedule of [
    null,
    { cron: "0 9 * * *", timezone: "Asia/Dubai" },
    { cron: "*/5 * * * *", timezone: "UTC" },
    { cron: "0 9 1 * 1", timezone: "UTC" },
    { cron: "0 9 32 * *", timezone: "UTC" },
  ])
    assert.throws(() => latestDueSlot(schedule, "2026-11-08T15:00:00Z"));
  assert.equal(
    latestDueSlot(
      { cron: "0 12 * * *", timezone: "UTC" },
      "2026-11-08T12:00:00Z",
    ),
    "2026-11-08T12:00:00.000Z",
  );
});

test("freshness distinguishes current collection, in-progress, failed, missed and unverifiable", () => {
  const definition = {
    schedule: { cron: "0 14 * * 1,3,5", timezone: "UTC" },
    nextRunAt: "2026-11-09 14:00:00+00",
    lastRunAt: "2026-11-06 14:04:13+00",
    currentCheckId: null,
  };
  const asOf = "2026-11-08T15:00:00Z";
  const base = { ...summaries(1)[0], scheduledFor: "2026-11-06 14:00:00+00" };
  assert.equal(
    collectionFreshness(definition, [base], asOf).state,
    "current-complete",
  );
  assert.equal(
    collectionFreshness(definition, [{ ...base, status: "running" }], asOf)
      .state,
    "in-progress",
  );
  assert.equal(
    collectionFreshness(
      definition,
      [{ ...base, status: "skipped_no_credits" }],
      asOf,
    ).state,
    "failed",
  );
  assert.equal(
    collectionFreshness(definition, [{ ...base, status: "partial" }], asOf)
      .state,
    "failed",
  );
  assert.equal(
    collectionFreshness(
      definition,
      [{ ...base, scheduledFor: "2026-11-02 14:00:00+00" }],
      asOf,
    ).state,
    "missed-slot",
  );
  assert.equal(collectionFreshness(definition, [], asOf).state, "missed-slot");
  assert.equal(
    collectionFreshness(
      definition,
      [{ ...base, scheduledFor: "2027-01-01T00:00:00Z" }],
      asOf,
    ).state,
    "schedule-unverifiable",
  );
  assert.equal(
    collectionFreshness({}, [base], asOf).state,
    "schedule-unverifiable",
  );
});
