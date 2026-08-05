// Monitor routing rules and registry readers — pure, no side effects.
//
// Extracted from poll.mjs/setup.mjs so the routing contract can be tested.
// poll.mjs runs its whole body on import (it polls, writes state and exits),
// so nothing in it was reachable from a test; the one rule most worth
// pinning — that offers and salary-transfer never auto-scrape — was
// therefore unasserted. It lives here now and is covered by
// tests/monitor/routing.test.ts.

import { readFileSync, existsSync } from "node:fs";

export const OFFERS_REGISTRY = "scripts/monitor/offers.registry.json";
export const SALARY_TRANSFER_REGISTRY = "scripts/monitor/salary-transfer.registry.json";

/**
 * Monitors whose changes justify re-running the deterministic scraper.
 *
 * Adding "offers" or "salary-transfer" here would put the scraper on a
 * path to typed editor fields, against the scrape merge contract: typed
 * fields (welcomeBonus, annualFeeWaiver, _features) are never written by
 * the scraper, and the whole salaryTransferOffers collection is typed
 * editor content. Both stay out; the test asserts it.
 */
export const AUTO_SCRAPE = new Set(["fee-docs", "product-pages"]);

/** Monitors that belong to the news desks rather than the card pipeline. */
export const NEWS = new Set(["press-rooms"]);

/** Monitors routed to the salary-transfer digest rather than the card one. */
export const SALARY_TRANSFER = new Set(["salary-transfer"]);

/**
 * Which digest a monitor's findings belong in.
 * @returns {"news"|"salary-transfer"|"card"}
 */
export function digestFor(key) {
  if (NEWS.has(key)) return "news";
  if (SALARY_TRANSFER.has(key)) return "salary-transfer";
  return "card";
}

/** Whether a monitor's findings may dispatch a scrape run. */
export function autoScrapes(key) {
  return AUTO_SCRAPE.has(key);
}

/** Flatten a per-bank registry ({banks:[{bank,urls:[]}]}) to a URL list. */
export function readRegistryUrls(path) {
  if (!existsSync(path)) return [];
  const reg = JSON.parse(readFileSync(path, "utf8"));
  return (reg.banks ?? []).flatMap((b) => b.urls ?? []);
}

/** url → bank slug for a per-bank registry ({banks:[{bank,urls:[]}]}). */
export function registryUrlToBank(path) {
  const map = new Map();
  if (!existsSync(path)) return map;
  for (const b of JSON.parse(readFileSync(path, "utf8")).banks ?? []) {
    for (const u of b.urls ?? []) map.set(u, b.bank);
  }
  return map;
}
