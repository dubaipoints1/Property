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

/**
 * Monitors that belong to the news desks rather than the card pipeline.
 *
 * `programme-offers` is here rather than beside the bank `offers` monitor
 * because nothing it finds can reach cards.json: an Etihad Guest bonus or
 * a Hyatt points promotion is a story for the airline and hotel desks,
 * not a field on a card. Routing it to the card digest would put loyalty
 * promotions in front of the business-realestate editor and in no desk's
 * queue.
 */
export const NEWS = new Set(["press-rooms", "press-rooms-weekly", "programme-offers"]);

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
 * The check-list requests needed to see every readable check.
 *
 * The API's `status` query parameter takes ONE value, and omitting it does
 * not mean "all": an unfiltered `GET /checks` returns completed checks and
 * leaves `partial` out. Verified on 15 September 2026 — the first attempt
 * at this fix simply dropped `?status=completed`, the poll came back
 * "[product-pages] no new checks", and the 6 September partial check stayed
 * invisible. So the poller asks for each status by name and merges; there
 * is no default to rely on.
 */
export function checkListQueries(limit = 10) {
  return [...READABLE_CHECK_STATUSES].map((status) => `?status=${status}&limit=${limit}`);
}

/**
 * Newest check first, by the time it was scheduled.
 *
 * The API returns Postgres-style stamps — "2026-09-06 00:00:00+00" — which
 * Date.parse rejects twice over: the space instead of a T, and the bare
 * two-digit offset where ISO 8601 wants "+00:00". Both have to be repaired
 * or every stamp comes back NaN, the comparator returns 0 for every pair,
 * and the sort silently becomes a no-op that looks like it worked.
 */
export function checkTime(check) {
  const raw = String(check?.scheduledFor ?? check?.createdAt ?? "");
  const iso = raw.replace(" ", "T").replace(/([+-])(\d{2})$/, "$1$2:00");
  return Date.parse(iso) || 0;
}

export function newestFirst(a, b) {
  return checkTime(b) - checkTime(a);
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
 * Whether two URL lists name the same pages, ignoring order and repeats.
 *
 * setup.mjs uses this to decide whether an update may send `targets` at
 * all. Sending them — even an identical list — makes Firecrawl REPLACE the
 * monitor's target with a new one, and a new target has no scrape history,
 * so the monitor's next check reports every page as `new` and diffs
 * nothing. Found 23 September 2026: two routine provisioning runs had
 * reset every monitor's history, and that day's offers and press-rooms
 * checks came back `new: 12, changed: 0` and `new: 10, changed: 0`.
 *
 * @param {string[]} a
 * @param {string[]} b
 */
export function sameUrlSet(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const u of sa) if (!sb.has(u)) return false;
  return true;
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

/**
 * Page a "list monitors" endpoint to exhaustion.
 *
 * Takes the page fetcher rather than calling the API itself, so the paging
 * contract is testable without a network. `fetchPage(limit, offset)` must
 * resolve to that page's array.
 *
 * This exists because relying on one unpaged request cost real money on
 * 15 September 2026: the List Monitors endpoint defaults to limit=25, this
 * key carries 47 monitors, so setup.mjs's name lookup missed all five of
 * ours and POSTed five duplicates beside the originals. The duplicates had
 * no check history, the poller read them instead of the real monitors and
 * reported "no new checks" for a fleet that was still running, and both
 * sets billed — 5,330 credits/month against a 5,000/month plan.
 */
export async function pageAll(fetchPage, { limit = 100, hardCap = 5000 } = {}) {
  const all = [];
  for (let offset = 0; ; offset += limit) {
    const page = (await fetchPage(limit, offset)) ?? [];
    all.push(...page);
    if (page.length < limit) return all;
    if (all.length > hardCap) throw new Error("monitor list did not terminate");
  }
}

// ── Schedule: one batch per hour, never two at once ───────────────────
//
// Explicit cron, not the API's natural-language `text` field. The create
// endpoint takes "either `cron` or `text`", and cron is the half we can
// assert: "weekly" silently resolved to Sunday 00:00 UTC, which is how
// three of our five monitors ended up firing 88 URLs simultaneously
// without anyone choosing that.
//
// The constraint is CONCURRENCY, not credits, and the unit that matters
// is the size of a single batch. This API key carries 42 monitors and 37
// of them belong to an unrelated AI-governance project — but those are
// many small search jobs, already staggered across 02:00–03:00 UTC, and
// they were not the problem. Ours are a handful of very large page
// batches, and a 57-URL batch landing on top of their queue is what
// amplified a few minutes of their delay into Firecrawl's
// concurrent-browser limit on 16 September 2026.
//
// So every DubaiPoints batch gets its own hour, and all of them sit in
// 09:00–15:00 UTC where that fleet is silent. Sunday 00:00 UTC is
// specifically vacated: it held product-pages (57) + salary-transfer
// (19) + fee-docs (12) at the same instant.
//
// Times are UTC. Dubai is UTC+4, so 09:00 UTC is 13:00 local — well
// clear of the 06:00–08:00 local window the other fleet occupies.
export const MONITOR_CRONS = {
  // Cadence cut 26 September 2026, on the account owner's instruction to
  // keep usage tight after a credit top-up. Priced from the measured
  // per-check actuals in CLAUDE.md (16 September): the fleet drops from
  // ~2,100 to ~770 credits/month. What it buys back is paid for in
  // detection latency, and each line says how much.
  //
  // Day-of-month schedules deliberately leave day-of-week `*`: in standard
  // cron, restricting BOTH fields ORs them ("the 1st OR any Monday"), which
  // would quietly multiply the checks this cut exists to remove.
  "product-pages": "0 9 1,15 * *", //   57 URLs — 1st and 15th, 09:00 (was weekly; welcome-bonus changes now up to ~2 weeks late)
  "salary-transfer": "0 11 8,22 * *", // 19 URLs — 8th and 22nd, 11:00 (was weekly; campaigns run quarterly)
  "fee-docs": "0 12 1 * *", //           12 PDFs — 1st of the month, 12:00 (was weekly; ~110 credits a check, documents versioned quarterly)
  offers: "0 13 * * 1,4", //            12 URLs — Mon + Thu 13:00 (was daily)
  "press-rooms": "0 14 * * 1,3,5", //    8 URLs — Mon/Wed/Fri 14:00 (was daily; flydubai + Hilton moved to free RSS)
  // Weekly news-desk tier, added 23 September 2026. Mid-week on purpose:
  // the weekend is already the heavy end of the fleet, and 10:00 is an
  // hour no other monitor uses, so these cannot land on one.
  "programme-offers": "0 10 * * 3", // 6 URLs — Wednesday 10:00 UTC
  "press-rooms-weekly": "0 10 * * 4", // 2 URLs — Thursday 10:00 UTC
};

/**
 * Expand a monitor's cron into the set of (weekday, hour) slots it fires
 * in, so two schedules can be compared for collision. Supports the shapes
 * this fleet uses: a literal hour; day-of-week `*`, a digit, or a comma
 * list; and day-of-month `*` or a comma list. A day-of-month schedule can
 * land on any weekday, so it conservatively occupies its hour on all
 * seven — a monthly monitor must be clear of every weekly one.
 *
 * @param {string} cron
 * @returns {Set<string>} e.g. {"0:9"} for Sunday 09:00, or every day at 13
 */
export function cronSlots(cron) {
  const [, hour, dom, , dow] = cron.split(/\s+/);
  const days = dom !== "*" || dow === "*" ? [0, 1, 2, 3, 4, 5, 6] : dow.split(",").map(Number);
  return new Set(days.map((d) => `${d}:${Number(hour)}`));
}

/**
 * Checks a month for one of this fleet's crons — the multiplier in the
 * credit estimate setup.mjs guards on. Day-of-month list: one per entry.
 * Day-of-week `*`: 30. Day-of-week list: ~4.3 per listed day, rounded up.
 *
 * @param {string} cron
 */
export function checksPerMonth(cron) {
  const [, , dom, , dow] = cron.split(/\s+/);
  if (dom !== "*") return dom.split(",").length;
  if (dow === "*") return 30;
  return Math.ceil(dow.split(",").length * (30 / 7));
}

/**
 * Every pair of monitors that would fire in the same hour on the same
 * day. Empty is the invariant; anything else is a batch collision of the
 * kind that tripped the concurrency limit.
 *
 * @param {Record<string, string>} crons
 * @returns {Array<[string, string, string]>} [a, b, slot]
 */
export function scheduleCollisions(crons = MONITOR_CRONS) {
  const keys = Object.keys(crons);
  const out = [];
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const a = cronSlots(crons[keys[i]]);
      for (const slot of cronSlots(crons[keys[j]])) {
        if (a.has(slot)) out.push([keys[i], keys[j], slot]);
      }
    }
  }
  return out;
}
