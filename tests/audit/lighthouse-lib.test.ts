// Unit tests for the Lighthouse-sample helpers (scripts/audit/_lib.mjs).
// Lighthouse itself needs a full Chrome and minutes of wall clock; these pin
// the parts that turn an LHR into a scores row and a budget verdict so the
// 2026-09-06 audit's numbers are reproducible from any saved LHR.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  aboveFoldBytesFromLhr,
  evaluateBudget,
  lhrToRow,
  pickMedianRun,
  renderScoresTableMd,
  resolveSampleRoutes,
  // eslint-disable-next-line import/extensions
} from "../../scripts/audit/_lib.mjs";

function fakeLhr(perf: number | null, overrides: Record<string, unknown> = {}) {
  return {
    requestedUrl: "http://127.0.0.1:1/cards/x/",
    finalDisplayedUrl: "http://127.0.0.1:1/cards/x/",
    lighthouseVersion: "13.4.1",
    categories: {
      performance: { score: perf },
      accessibility: { score: 1 },
      "best-practices": { score: 0.964 },
      seo: { score: 0.92 },
    },
    audits: {
      "largest-contentful-paint": { numericValue: 1234.4 },
      "cumulative-layout-shift": { numericValue: 0.01234 },
      "total-blocking-time": { numericValue: 12.6 },
      "total-byte-weight": { numericValue: 307200 },
      "network-requests": {
        details: {
          items: [
            { networkEndTime: 800, transferSize: 100000 },
            { networkEndTime: 1300, transferSize: 50000 },
            { networkEndTime: 1200, transferSize: 2048 },
          ],
        },
      },
    },
    ...overrides,
  };
}

test("resolveSampleRoutes keeps explicit routes that exist, first sorted match, reports missing", () => {
  const all = ["/", "/404.html", "/cards/", "/cards/b/", "/cards/a/", "/search/", "/news/airlines/", "/news/story/"];
  const sample = [
    { template: "Homepage", route: "/" },
    { template: "CardReviewLayout", match: "^/cards/[^/]+/$" },
    { template: "ArticleLayout (news)", match: "^/news/(?!airlines/|banking/|hotels/)[^/]+/$" },
    { template: "Search (pagefind runtime)", route: "/search/?q=cashback" },
    { template: "404", route: "/404.html" },
    { template: "Deals", route: "/deals/" },
    { template: "BankHubLayout", match: "^/banks/[^/]+/$" },
    { template: "Homepage again", route: "/" },
  ];
  const { routes, missing } = resolveSampleRoutes(sample, all);
  assert.deepEqual(routes, [
    { route: "/", template: "Homepage" },
    { route: "/cards/a/", template: "CardReviewLayout" },
    { route: "/news/story/", template: "ArticleLayout (news)" },
    { route: "/search/?q=cashback", template: "Search (pagefind runtime)" },
    { route: "/404.html", template: "404" },
  ]);
  assert.deepEqual(missing, ["Deals", "BankHubLayout"]);
});

test("lhrToRow rounds scores to 0-100 and metrics to sensible precision", () => {
  const row = lhrToRow(fakeLhr(0.945), "mobile");
  assert.deepEqual(row, {
    route: "/cards/x/",
    preset: "mobile",
    performance: 95,
    accessibility: 100,
    bestPractices: 96,
    seo: 92,
    lcpMs: 1234,
    cls: 0.012,
    tbtMs: 13,
    aboveFoldKb: 99.7,
    requests: 3,
    totalKb: 300,
  });
  const nulls = lhrToRow(fakeLhr(null, { audits: {} }), "desktop");
  assert.equal(nulls.performance, null);
  assert.equal(nulls.lcpMs, null);
  assert.equal(nulls.aboveFoldKb, null);
  assert.equal(nulls.requests, 0);
});

test("aboveFoldBytesFromLhr sums transferSize of requests finished by LCP", () => {
  assert.equal(aboveFoldBytesFromLhr(fakeLhr(0.9)), 102048);
  assert.equal(aboveFoldBytesFromLhr(fakeLhr(0.9, { audits: { "network-requests": { details: { items: [] } } } })), null);
});

test("evaluateBudget: mobile 94 breaches, desktop 94 does not, 201 KB breaches", () => {
  const rows = [
    { route: "/", preset: "mobile", performance: 94, aboveFoldKb: 120 },
    { route: "/", preset: "desktop", performance: 94, aboveFoldKb: 120 },
    { route: "/cards/", preset: "mobile", performance: 99, aboveFoldKb: 201 },
    { route: "/guides/", preset: "mobile", performance: 95, aboveFoldKb: 200 },
  ];
  const res = evaluateBudget(rows);
  assert.equal(res.ok, false);
  assert.deepEqual(res.breaches, [
    { route: "/", preset: "mobile", metric: "performance", value: 94, limit: 95 },
    { route: "/cards/", preset: "mobile", metric: "aboveFoldKb", value: 201, limit: 200 },
  ]);
  assert.equal(evaluateBudget(rows, { mobilePerf: 90, aboveFoldKb: 250 }).ok, true);
  assert.equal(evaluateBudget([{ route: "/", preset: "mobile", performance: null, aboveFoldKb: 1 }]).ok, false);
});

test("pickMedianRun picks the median by performance (lower-middle on even counts)", () => {
  const a = fakeLhr(0.9);
  const b = fakeLhr(0.97);
  const c = fakeLhr(0.93);
  assert.equal(pickMedianRun([a, b, c]), c);
  assert.equal(pickMedianRun([b, a]), a);
  assert.equal(pickMedianRun([a]), a);
  assert.equal(pickMedianRun([]), null);
  const n = fakeLhr(null);
  assert.equal(pickMedianRun([n, b]), b);
});

test("renderScoresTableMd lists rows and adds a Budget section only when there are breaches", () => {
  const rows = [lhrToRow(fakeLhr(0.945), "mobile"), lhrToRow(fakeLhr(0.99), "desktop")];
  const clean = renderScoresTableMd(rows, { ok: true, breaches: [] });
  assert.match(clean, /\| \/cards\/x\/ \| desktop \| 99 \|/);
  assert.match(clean, /\| \/cards\/x\/ \| mobile \| 95 \|/);
  assert.match(clean, /pessimistic/);
  assert.doesNotMatch(clean, /## Budget/);

  const breached = renderScoresTableMd(rows, evaluateBudget([{ route: "/cards/x/", preset: "mobile", performance: 80, aboveFoldKb: 10 }]));
  assert.match(breached, /## Budget/);
  assert.match(breached, /\| \/cards\/x\/ \| mobile \| performance \| 80 \| 95 \|/);
});
