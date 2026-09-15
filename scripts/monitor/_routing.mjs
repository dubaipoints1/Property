// Monitor routing rules and registry readers — pure, no side effects.
//
// Extracted from poll.mjs/setup.mjs so the routing contract can be tested.
// poll.mjs runs its whole body on import (it polls, writes state and exits),
// so nothing in it was reachable from a test; the one rule most worth
// pinning — that offers and salary-transfer never auto-scrape — was
// therefore unasserted. It lives here now and is covered by
// tests/monitor/routing.test.ts.

import { readFileSync, readdirSync, existsSync } from "node:fs";

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

// ── check coverage ────────────────────────────────────────────────────
//
// A check is the unit the poller reads. Whether it reads one at all, and
// whether it read all of it, decides whether a change ever reaches a
// human — and a change the poller skips is not deferred, it is lost:
// the NEXT check diffs against this check's scrape, so the old value is
// already gone from the comparison and can never resurface.
//
// That is precisely how ADCB's Essential Cashback welcome bonus went
// from AED 300 to AED 250 unseen. The monitor did its job: the
// 6 September 2026 check flagged the page `changed` and the judge ruled
// it `meaningful: true` at high confidence, quoting the diff line for
// line. But one unrelated page in the same run errored, so the check
// came back `partial`, and the poller asked the API only for
// `status=completed`. The check was never listed, never read, never
// recorded as seen. By the 13 September run the page diffed against the
// 6 September scrape, whose text already said AED 250, so the cut showed
// up nowhere. It was found by hand.

/**
 * Check statuses that carry page results and must therefore be read.
 *
 * `partial` is the load-bearing entry. A partial check is a completed
 * check with a hole in it: every page that scraped still has its diff
 * and its judgment. Dropping the whole check to avoid the hole discards
 * the ~41 good pages to sidestep the 1 bad one, permanently.
 */
export const READABLE_CHECK_STATUSES = new Set(["completed", "partial"]);

/** Whether a check carries page results the poller must read. */
export function isReadableCheck(check) {
  return READABLE_CHECK_STATUSES.has(check?.status);
}

/**
 * How many changed pages to ask for.
 *
 * The API returns no pagination cursor, so the only defence against a
 * silent truncation is to ask for more than the check says changed and
 * then verify the count. The previous fixed `limit=50` sat under the
 * product-pages monitor's own 55 URLs and had already come within five
 * of truncating twice (45 changed on 16 and 23 August 2026).
 */
export function pageFetchLimit(check) {
  return Math.max(100, (check?.summary?.changed ?? 0) + 25);
}

/**
 * Coverage gaps in a check the poller has just read — pages the monitor
 * could not scrape, and pages the API did not hand back.
 *
 * These are reported to a human rather than swallowed, because in this
 * pipeline an unread page is an unseeable change, not a delayed one.
 *
 * @returns {Array<{kind:"errored"|"truncated", count:number, note:string}>}
 */
export function coverageGapsFor(check, pagesReturned) {
  const gaps = [];
  const errored = check?.summary?.error ?? 0;
  if (errored > 0) {
    gaps.push({
      kind: "errored",
      count: errored,
      note:
        `${errored} page(s) failed to scrape in this check, so any change on ` +
        `them is invisible to this run AND to the next one — the next check ` +
        `diffs against this check's scrape. Re-read those pages by hand.`,
    });
  }
  const expected = check?.summary?.changed ?? 0;
  const short = expected - pagesReturned;
  if (short > 0) {
    gaps.push({
      kind: "truncated",
      count: short,
      note:
        `the API reported ${expected} changed page(s) but returned ` +
        `${pagesReturned}; ${short} change(s) were not read.`,
    });
  }
  return gaps;
}

// ── monitor coverage drift ────────────────────────────────────────────
//
// The second way this pipeline loses a change silently: a page that is in
// the repo's config but was never provisioned onto the live monitor.
// setup.mjs is idempotent and PATCHes the URL list, so the fix is always
// just to re-run it — but until 15 September 2026 nothing said it was due,
// and two card product pages (liv-cashback-plus, wio-credit) had sat
// unwatched since they were added. A page nobody watches produces no
// check, no diff and no alert, so it looks exactly like a page that never
// changes.

/** Every card URL the scrapers know about, by monitor key. */
export function readCardUrls(banksDir = "scripts/scrape/banks") {
  const kfs = new Set();
  const product = new Set();
  for (const file of readdirSync(banksDir).filter((f) => f.endsWith(".urls.json"))) {
    for (const card of JSON.parse(readFileSync(`${banksDir}/${file}`, "utf8"))) {
      const u = card?.urls ?? {};
      if (u.kfs) kfs.add(u.kfs);
      if (u.product) product.add(u.product);
    }
  }
  return { kfs: [...kfs], product: [...product] };
}

/** URLs a live monitor definition is actually watching. */
export function liveMonitorUrls(definition) {
  return (definition?.targets ?? []).flatMap((t) => t.urls ?? []);
}

/**
 * URLs the repo expects a monitor to watch but which it does not.
 *
 * One-directional on purpose: a URL live but not in the repo is usually a
 * page an editor retired, which is noise. A URL in the repo but not live
 * is a blind spot.
 */
export function unwatchedUrls(expected, definition) {
  const live = new Set(liveMonitorUrls(definition));
  return expected.filter((u) => !live.has(u));
}
