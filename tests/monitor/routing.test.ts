// Unit tests for monitor routing — the first tests for scripts/monitor/.
//
// Run: node --import tsx --test tests/monitor/routing.test.ts
//
// The assertion that matters here is the AUTO_SCRAPE one. Everything else
// in this file is scaffolding around it. The scrape merge contract says
// typed editor fields are never written by the scraper; the monitoring
// system upholds that by keeping the offers and salary-transfer monitors
// off the auto-scrape path. That is a one-line regression away from being
// untrue, and until now nothing would have caught it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  AUTO_SCRAPE,
  NEWS,
  SALARY_TRANSFER,
  OFFERS_REGISTRY,
  SALARY_TRANSFER_REGISTRY,
  autoScrapes,
  digestFor,
  readRegistryUrls,
  registryUrlToBank,
} from "../../scripts/monitor/_routing.mjs";

// ── the merge-contract guard ──────────────────────────────────────────

test("editor-typed monitors never dispatch a scrape", () => {
  // Per the scrape merge contract: typed editor fields (welcomeBonus,
  // annualFeeWaiver, _features) are never written by the scraper, and the
  // salaryTransferOffers collection is typed editor content end to end.
  assert.equal(autoScrapes("offers"), false);
  assert.equal(autoScrapes("salary-transfer"), false);
  assert.ok(!AUTO_SCRAPE.has("offers"));
  assert.ok(!AUTO_SCRAPE.has("salary-transfer"));
});

test("deterministic-source monitors do dispatch a scrape", () => {
  // The converse, so the test above can't pass by autoScrapes() being
  // broken and returning false for everything.
  assert.equal(autoScrapes("fee-docs"), true);
  assert.equal(autoScrapes("product-pages"), true);
});

// ── digest routing ────────────────────────────────────────────────────

test("each monitor routes to exactly one digest", () => {
  assert.equal(digestFor("fee-docs"), "card");
  assert.equal(digestFor("product-pages"), "card");
  assert.equal(digestFor("offers"), "card");
  assert.equal(digestFor("salary-transfer"), "salary-transfer");
  assert.equal(digestFor("press-rooms"), "news");
});

test("routing sets are disjoint", () => {
  // A key in two sets would be filed twice or silently misrouted,
  // depending on branch order in poll.mjs.
  for (const key of SALARY_TRANSFER) {
    assert.ok(!NEWS.has(key), `${key} is in both SALARY_TRANSFER and NEWS`);
    assert.ok(!AUTO_SCRAPE.has(key), `${key} is in both SALARY_TRANSFER and AUTO_SCRAPE`);
  }
  for (const key of NEWS) {
    assert.ok(!AUTO_SCRAPE.has(key), `${key} is in both NEWS and AUTO_SCRAPE`);
  }
});

// ── registry readers ──────────────────────────────────────────────────

function withRegistry(contents: unknown, fn: (p: string) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), "dp-monitor-"));
  const file = path.join(dir, "registry.json");
  writeFileSync(file, JSON.stringify(contents));
  try {
    fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("readRegistryUrls flattens per-bank URL lists", () => {
  withRegistry(
    {
      banks: [
        { bank: "fab", urls: ["https://x.test/a", "https://x.test/b"] },
        { bank: "adcb", urls: ["https://y.test/c"] },
      ],
    },
    (p) => {
      assert.deepEqual(readRegistryUrls(p), [
        "https://x.test/a",
        "https://x.test/b",
        "https://y.test/c",
      ]);
    },
  );
});

test("registryUrlToBank maps every URL back to its bank", () => {
  withRegistry(
    {
      banks: [
        { bank: "fab", urls: ["https://x.test/a", "https://x.test/b"] },
        { bank: "adcb", urls: ["https://y.test/c"] },
      ],
    },
    (p) => {
      const map = registryUrlToBank(p);
      assert.equal(map.get("https://x.test/a"), "fab");
      assert.equal(map.get("https://x.test/b"), "fab");
      assert.equal(map.get("https://y.test/c"), "adcb");
      assert.equal(map.get("https://z.test/unknown"), undefined);
    },
  );
});

test("registry readers tolerate an empty or missing registry", () => {
  // Both registries ship empty; setup.mjs relies on a 0-length URL list
  // to SKIP the monitor rather than provisioning one that watches nothing.
  withRegistry({ banks: [] }, (p) => {
    assert.deepEqual(readRegistryUrls(p), []);
    assert.equal(registryUrlToBank(p).size, 0);
  });
  withRegistry({}, (p) => {
    assert.deepEqual(readRegistryUrls(p), []);
    assert.equal(registryUrlToBank(p).size, 0);
  });
  assert.deepEqual(readRegistryUrls("does/not/exist.json"), []);
  assert.equal(registryUrlToBank("does/not/exist.json").size, 0);
});

test("a bank entry with no urls key does not throw", () => {
  withRegistry({ banks: [{ bank: "fab" }] }, (p) => {
    assert.deepEqual(readRegistryUrls(p), []);
    assert.equal(registryUrlToBank(p).size, 0);
  });
});

// ── the shipped registries ────────────────────────────────────────────

test("the shipped registries parse and are the shape the readers expect", () => {
  // Empty today — both await hand-confirmed URLs. This asserts they stay
  // parseable, so a malformed edit fails here rather than at 03:00 UTC in
  // a workflow run.
  for (const reg of [OFFERS_REGISTRY, SALARY_TRANSFER_REGISTRY]) {
    assert.ok(Array.isArray(readRegistryUrls(reg)), `${reg} did not parse`);
    assert.ok(registryUrlToBank(reg) instanceof Map, `${reg} did not map`);
  }
});
