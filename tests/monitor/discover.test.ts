// Unit tests for registry-URL discovery ranking.
//
// Run: node --import tsx --test tests/monitor/discover.test.ts
//
// The assertion that matters most here is the PDF inversion: a T&C
// document must rank IN for salary-transfer and OUT for offers. That
// inversion is the entire reason the two surfaces have separate config
// rather than sharing one reject rule, and it is trivially easy to
// regress by "tidying up" the two regexes into one.
//
// Ranking had no test coverage at all before this — discover-offers.mjs
// shipped in the 2026-08 monitoring work untested.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { rank, bankOrigins } from "../../scripts/monitor/_discover.mjs";
import { OFFERS_CONFIG } from "../../scripts/monitor/discover-offers.mjs";
import { SALARY_TRANSFER_CONFIG } from "../../scripts/monitor/discover-salary-transfer.mjs";

// ── the inversion ─────────────────────────────────────────────────────

test("a salary-transfer T&C PDF ranks in for salary-transfer", () => {
  // DIB's real shipped sourceUrl shape.
  const urls = ["https://www.dib.ae/docs/default-source/pdf/dib-salary-tc.pdf"];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), urls);
});

test("a PDF ranks out for offers", () => {
  // Same document, offers config — rejected as noise around the landing
  // page. If this ever passes, the two reject rules have been merged and
  // the offers monitor will start watching T&C documents.
  const urls = ["https://www.dib.ae/docs/default-source/pdf/dib-offers-tc.pdf"];
  assert.deepEqual(rank(urls, OFFERS_CONFIG), []);
});

test("a /terms path ranks in for salary-transfer but out for offers", () => {
  const st = ["https://www.mashreq.com/en/uae/salary-transfer/terms"];
  const of = ["https://www.mashreq.com/en/uae/offers/terms"];
  assert.equal(rank(st, SALARY_TRANSFER_CONFIG).length, 1);
  assert.deepEqual(rank(of, OFFERS_CONFIG), []);
});

// ── ordering ──────────────────────────────────────────────────────────

test("higher-confidence patterns outrank lower ones", () => {
  const urls = [
    "https://www.x.ae/personal/payroll",
    "https://www.x.ae/salary-transfer",
  ];
  // /salary-transfer is pattern 0; /payroll is pattern 4.
  assert.equal(rank(urls, SALARY_TRANSFER_CONFIG)[0], "https://www.x.ae/salary-transfer");
});

test("shorter paths win within the same pattern", () => {
  const urls = [
    "https://www.x.ae/personal/accounts/salary-transfer/",
    "https://www.x.ae/salary-transfer/",
  ];
  assert.equal(rank(urls, SALARY_TRANSFER_CONFIG)[0], "https://www.x.ae/salary-transfer/");
});

test("offers ranking is unchanged by the refactor", () => {
  const urls = [
    "https://www.x.ae/personal/cards/promotions",
    "https://www.x.ae/offers",
  ];
  assert.deepEqual(rank(urls, OFFERS_CONFIG), [
    "https://www.x.ae/offers",
    "https://www.x.ae/personal/cards/promotions",
  ]);
});

// ── filtering ─────────────────────────────────────────────────────────

test("non-matching URLs are dropped entirely", () => {
  const urls = [
    "https://www.x.ae/about-us",
    "https://www.x.ae/branch-locator",
    "https://www.x.ae/careers",
  ];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), []);
  assert.deepEqual(rank(urls, OFFERS_CONFIG), []);
});

test("archives, expired campaigns and year-stamped paths are rejected", () => {
  const urls = [
    "https://www.x.ae/salary-transfer/archive",
    "https://www.x.ae/salary-transfer/expired",
    "https://www.x.ae/2024/salary-transfer",
  ];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), []);
});

test("images are rejected for salary-transfer", () => {
  const urls = ["https://www.x.ae/salary-transfer/hero.png"];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), []);
});

test("duplicates collapse and the limit is honoured", () => {
  const dupes = ["https://www.x.ae/salary-transfer", "https://www.x.ae/salary-transfer"];
  assert.equal(rank(dupes, SALARY_TRANSFER_CONFIG).length, 1);

  const many = Array.from({ length: 20 }, (_, i) => `https://www.x.ae/salary-transfer/v${i}`);
  assert.equal(rank(many, SALARY_TRANSFER_CONFIG).length, SALARY_TRANSFER_CONFIG.limit);
  assert.equal(rank(many, OFFERS_CONFIG).length, 0); // not an offers surface
});

test("a malformed URL does not throw", () => {
  // firecrawlMap output is external input; a bad entry should be skipped
  // rather than taking the whole discovery run down.
  const urls = ["not-a-url-but-mentions-salary-transfer", "https://www.x.ae/salary-transfer"];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), ["https://www.x.ae/salary-transfer"]);
});

// ── origins ───────────────────────────────────────────────────────────

test("bankOrigins covers every bank in the scrape registry", () => {
  const origins = bankOrigins();
  const registry = JSON.parse(
    readFileSync("scripts/scrape/banks.registry.json", "utf8"),
  ).banks as string[];
  for (const slug of registry) {
    assert.ok(origins.has(slug), `no origin derived for ${slug}`);
    assert.ok(origins.get(slug)!.startsWith("https://"), `${slug} origin is not https`);
  }
});
