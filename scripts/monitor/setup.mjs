// Firecrawl monitor provisioning — idempotent.
//
// Creates (or updates) the five monitors that replace blind scheduled
// scraping with event-driven alerts:
//
//   fee-docs         12 KFS / Schedule-of-Fees documents      weekly
//   product-pages    57 card product pages                    weekly
//   offers           bank offers/promotions landing pages     daily 13:00
//   salary-transfer  bank salary-transfer offer pages + T&Cs  weekly
//   press-rooms      10 issuer press indexes                  daily 14:00
//   programme-offers  6 loyalty-programme promotion indexes   weekly Wed 10:00
//   press-rooms-weekly 2 second-tier issuer newsrooms         weekly Thu 10:00
//
// ── The §6 boundary, which is why this file looks the way it does ─────
// Charter §6 bans LLM extraction for typed numerics: fees, salary bands,
// earn rates and amounts "require deterministic regex parsers … so each
// value has a traceable source line".
//
// Firecrawl offers JSON-mode change tracking that would hand us
// {"annualFee": {"previous": "AED 500", "current": "AED 750"}} directly.
// That is LLM extraction and we do NOT use it. Monitors run in markdown
// mode only — a deterministic unified diff. The `goal` below drives
// Firecrawl's judge, which we use ONLY to suppress alert noise; its
// opinion never becomes a fact. Every number still comes from the
// regex parsers in scripts/scrape/_lib.ts and _normaliser.ts.
//
// The monitor answers "did something move?". The scraper answers "what
// is it now?". Those stay separate.
//
// Usage:
//   FIRECRAWL_API_KEY=... node scripts/monitor/setup.mjs
//   FIRECRAWL_API_KEY=skip node scripts/monitor/setup.mjs   # dry run
//
// Writes monitor IDs to data/monitor/monitors.json (committed) so
// poll.mjs knows what to read.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

import {
  OFFERS_REGISTRY,
  SALARY_TRANSFER_REGISTRY,
  MONITOR_CRONS,
  liveMonitorUrls,
  sameUrlSet,
  pageAll,
  readCardUrls,
  readRegistryUrls,
} from "./_routing.mjs";

const KEY = process.env.FIRECRAWL_API_KEY;
const API = "https://api.firecrawl.dev/v2/monitor";
const BANKS_DIR = "scripts/scrape/banks";
const OUT_PATH = "data/monitor/monitors.json";

// Budget guards. The create/update response returns
// estimatedCreditsPerMonth per monitor; we refuse to provision above
// these so a mis-specified monitor cannot quietly eat the 5,000/month
// plan.
//
// MAX_ESTIMATED_CREDITS is the PER-MONITOR cap, and was for a long time
// the only one — which left a hole. The fleet's largest single monitor
// estimates 720, so no monitor has ever come within half of 1,600 and
// this guard has never once fired, while the five together reached
// 2,740/month (measured 15 September 2026) with nothing checking the
// sum. A cap that cannot fire is not a cap.
const MAX_ESTIMATED_CREDITS = 1600;

// MAX_TOTAL_ESTIMATED_CREDITS is the fleet cap: 3,000 of the plan's
// 5,000/month. That sits only ~260 above today's fleet, deliberately.
// Audit hold F-020 — the plan tier, and who owns the other monitors on
// this API key — is still open, so the next material URL addition
// should stop here and force that answer rather than grow the bill on
// an assumption. Raising it is the account owner's call, not a
// session's.
const MAX_TOTAL_ESTIMATED_CREDITS = 3000;

// Press rooms — moved here from scripts/news-monitor/monitor.mjs, whose
// hand-rolled link-diffing once surfaced "Visit our Facebook page" as a
// headline. Firecrawl's own diff does this properly.
const PRESS_PAGES = [
  "https://www.emirates.com/media-centre/",
  "https://www.etihad.com/en-ae/news",
  // flydubai, added 22 September 2026. It was missing from this list
  // although `flydubai` has always been in the news-monitor's own UAE
  // relevance regex, so the only flydubai signal the desks ever got came
  // from aggregators — which the sourcing ladder makes discovery, never a
  // citable fact. On 17 September an aggregator reported flydubai crossing
  // 100 aircraft and retrofitting 21 MAX with lie-flat business; the
  // airline's own newsroom carried no such release and its boilerplate
  // still read 98 aircraft, so the story could not be written. Note the
  // host: `media.flydubai.com` (in Part II's allowlist table) no longer
  // resolves at all — the newsroom is Prezly-hosted at news.flydubai.com.
  "https://news.flydubai.com/",
  "https://www.qatarairways.com/press-releases/en-ww",
  "https://news.marriott.com/",
  "https://stories.hilton.com/",
  "https://press.accor.com/",
  "https://www.emiratesnbd.com/en/media-centre",
  "https://www.adcb.com/en/about-us/media-centre/",
  "https://www.bankfab.com/en-ae/about-fab/group/news",
];

// Loyalty-programme promotion indexes — added 23 September 2026.
//
// Until now the fleet watched twelve BANK offers pages and not one
// loyalty-programme promo page, which is where transfer bonuses, points
// sales, double-miles runs and status offers are actually announced. The
// desks were learning about them from aggregators they cannot cite.
//
// Every URL below was scraped through Firecrawl on 23 September 2026 and
// carried live, dated promotions. They are INDEX pages on purpose: an
// individual offer page expires and 404s; the index is where the next one
// appears. The candidates that failed are recorded here so they are not
// re-added on a guess:
//
//   marriott.com/loyalty/promotionCentral.mi  redirects to a SIGN-IN page.
//     A monitor there diffs a login form forever. offers.mi is public.
//   all.accor.com/…/promotions-offers.html    a noindex shell that renders
//     no offers to a scraper. Accor's MEAPAC promos exist only as
//     individual pages; no index found.
//   Qatar Privilege Club                      map returned no offers index.
//
// Weekly, not daily: a promotion runs for weeks, so a daily read buys
// nothing but cost. This monitor is alert-only and routes to the news
// desks (NEWS in _routing.mjs) — nothing it finds can reach cards.json.
const PROMO_PAGES = [
  "https://www.emirates.com/ae/english/special-offers/", // Skywards bonus-miles offers live here
  "https://www.etihad.com/en/etihadguest/programme-offers",
  "https://www.marriott.com/offers.mi",
  "https://www.hilton.com/en/offers",
  "https://www.ihg.com/content/us/en/offers",
  "https://world.hyatt.com/content/gp/en/offers.html",
];

// Second-tier newsrooms, weekly — added 23 September 2026. Low-volume
// issuers whose news is rarely same-day urgent; a daily read would cost
// six times as much for the same stories a few days sooner.
//
// Verified the same day. Two rejections worth knowing, because both
// passed a naive check:
//
//   airarabia.com/en/news and saudia.com/about-saudia/media-center both
//     answer HTTP 200 with a "404 / Not Found" page body — soft 404s. The
//     feed probe (discover-feeds.mjs) reported them as reachable on the
//     22nd. Status code alone cannot tell a real page from an error page.
//   saudia.com media centre and news pages render only site navigation to
//     a scraper; the release list is client-side JavaScript. A monitor
//     would watch an unchanging menu. Saudia is not covered.
const TIER2_PRESS_PAGES = [
  "https://press.airarabia.com/", // Sharjah carrier; Presspage newsroom, feed blocked
  "https://www.ihgplc.com/en/news-and-media",
];

// readCardUrls now lives in ./_routing.mjs so poll.mjs can compare what
// this script would provision against what the live monitors actually
// watch. One source of truth, or the drift check is checking itself.
const { kfs, product } = readCardUrls(BANKS_DIR);
const offers = readRegistryUrls(OFFERS_REGISTRY);
const salaryTransfer = readRegistryUrls(SALARY_TRANSFER_REGISTRY);

const MONITORS = [
  {
    key: "fee-docs",
    name: "dubaipoints-fee-docs",
    urls: kfs,
    // WEEKLY, not daily, and this is the single biggest credit lever in
    // the fleet. Measured actuals on 16 September 2026: this monitor bills
    // ~110 credits per check against an estimate of 24, because a KFS or
    // Schedule of Fees is a PDF and PDFs bill per PAGE, not per URL. Daily
    // that is ~3,300 credits/month — roughly two thirds of everything we
    // spend, on documents that are versioned quarterly ("Ver.46/February
    // 2026"). Weekly costs ~475 and still catches a fee change inside
    // seven days, which is well within the window that matters for the
    // failure this fleet exists to prevent.
    //
    // It also vacates 03:00 UTC. 37 monitors belonging to an unrelated
    // project share this API key on Asia/Dubai time, 21 of them firing in
    // that one hour, and our 12 PDF jobs landing in the middle of it is
    // what tripped Firecrawl's concurrent-browser limit on 16 September.
    schedule: { cron: MONITOR_CRONS["fee-docs"], timezone: "UTC" },
    goal:
      "Alert when an annual fee, foreign-currency or FX transaction fee, minimum salary requirement, late-payment fee or interest/profit rate changes. Ignore navigation, cookie banners, contact details, document version stamps and layout changes.",
  },
  {
    key: "product-pages",
    name: "dubaipoints-product-pages",
    urls: product,
    schedule: { cron: MONITOR_CRONS["product-pages"], timezone: "UTC" },
    // The goal steers Firecrawl's judge, which only ever suppresses noise
    // (Charter §6 — its opinion never becomes a fact). Two words of it
    // were load-bearing against us. It named neither "welcome bonus" nor
    // any synonym, and it told the judge to ignore "marketing carousels",
    // which is where a welcome-bonus line lives on most issuer pages. The
    // judge surfaced ADCB's 6 September 2026 cut anyway, but had to argue
    // past the goal to do it — its own words: "While the goal focuses on
    // earn rates and fees, a welcome bonus is a core financial reward
    // benefit of the card." A rule that survives only because the judge
    // overrode it is not a rule we should be relying on, so the bonus is
    // named and the ignore list is narrowed to furniture that carries no
    // figures.
    goal:
      "Alert when a card's welcome bonus, joining bonus, sign-up offer, introductory cashback, earn rate, cashback percentage, reward category, lounge or travel benefit, eligibility requirement or fee changes — including any change to an amount, a spend threshold, a qualifying window or an offer end date, and including one that appears in a promotional banner or hero tile. Ignore navigation, cookie banners, footers, application-form controls, CAPTCHA widgets and layout changes.",
  },
  {
    key: "offers",
    name: "dubaipoints-offers",
    urls: offers,
    schedule: { cron: MONITOR_CRONS["offers"], timezone: "UTC" },
    goal:
      "Alert when a welcome bonus, sign-up offer, limited-time promotion, cashback campaign or partner deal is added, changed, extended or withdrawn. Include the offer's end date when it appears. Ignore navigation, cookie banners and layout changes.",
  },
  {
    // Weekly, not daily: salary-transfer promotions move on quarterly
    // campaign cycles, and weekly keeps this at ~4.3 credits per URL per
    // month instead of 30 — headroom that matters once the offers
    // registry is populated and the estimate approaches the cap below.
    key: "salary-transfer",
    name: "dubaipoints-salary-transfer",
    urls: salaryTransfer,
    schedule: { cron: MONITOR_CRONS["salary-transfer"], timezone: "UTC" },
    goal:
      "Alert when a salary-transfer offer changes: the cash or voucher amount, the salary bands that qualify, the minimum salary, the payout timing, the tenure or lock-in period, the clawback terms, any bundled credit-card or finance requirement, or the offer's validity dates. Alert when such an offer is launched or withdrawn. Ignore navigation, cookie banners, branch locators and layout changes.",
  },
  {
    key: "press-rooms",
    name: "dubaipoints-press-rooms",
    urls: PRESS_PAGES,
    schedule: { cron: MONITOR_CRONS["press-rooms"], timezone: "UTC" },
    goal:
      "Alert when a new press release or news item is published. Ignore navigation, cookie banners, social links, careers listings and layout changes.",
  },
  {
    key: "programme-offers",
    name: "dubaipoints-programme-offers",
    urls: PROMO_PAGES,
    schedule: { cron: MONITOR_CRONS["programme-offers"], timezone: "UTC" },
    // The judge only suppresses noise (§6); it never types a number. Name
    // the things that matter so it does not have to argue past the goal,
    // which is what happened with welcome bonuses on product-pages.
    goal:
      "Alert when a loyalty promotion is added, changed or removed: bonus points or miles, points or miles sales, transfer bonuses, status or tier offers, double-earn campaigns, and their dates or deadlines. Ignore navigation, cookie banners, booking widgets, images, and generic room-rate discounts that carry no points or miles component.",
  },
  {
    key: "press-rooms-weekly",
    name: "dubaipoints-press-rooms-weekly",
    urls: TIER2_PRESS_PAGES,
    schedule: { cron: MONITOR_CRONS["press-rooms-weekly"], timezone: "UTC" },
    goal:
      "Alert when a new press release or news item is published. Ignore navigation, cookie banners, social links, careers listings and layout changes.",
  },
];

function targetsFor(urls) {
  // Firecrawl accepts 1-50 targets per monitor and each target may carry
  // multiple URLs. markdown-only formats keeps this on the deterministic
  // diff path (see the §6 note at the top of this file).
  return [{ type: "scrape", urls, scrapeOptions: { formats: ["markdown"], onlyMainContent: true } }];
}

async function api(path, method, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

// ── main ──────────────────────────────────────────────────────────────
const planned = MONITORS.filter((m) => m.urls.length > 0);
const skipped = MONITORS.filter((m) => m.urls.length === 0);

if (!KEY) {
  console.error("ERROR: FIRECRAWL_API_KEY unset (use 'skip' for a dry run).");
  process.exit(1);
}

// The API's own estimate is exactly urls x checks/month x 2, which all
// five monitors matched to the credit on 15 September 2026
// (product-pages 57 x 5 x 2 = 570, fee-docs 12 x 30 x 2 = 720, and so
// on). The old local formula used 1 credit per URL and 4.3 weekly
// checks, so it under-reported the figure the guard actually tests by
// roughly half: the dry run printed ~1,317/month for a fleet the API
// priced at 2,740.
//
// It is a worst case, not a forecast. The second credit is the judge,
// which only validates pages that changed, so actuals land lower —
// product-pages billed 90 against an estimated 110 on 13 September.
const CREDITS_PER_URL_PER_CHECK = 2;
// Day-of-week `*` means daily (~30 checks/month); a literal day means
// weekly (~5). Reads the cron because that is now what we send — the
// API takes "either cron or text", and `text: "weekly"` was resolving to
// Sunday 00:00 UTC for three monitors at once without anyone picking it.
const checksPerMonth = (m) => (m.schedule.cron.split(/\s+/)[4] === "*" ? 30 : 5);
const monthlyCredits = (m) => m.urls.length * checksPerMonth(m) * CREDITS_PER_URL_PER_CHECK;

console.log("Monitors to provision:\n");
for (const m of planned) {
  console.log(`  ${m.name.padEnd(30)} ${String(m.urls.length).padStart(3)} URLs  ${m.schedule.cron.padEnd(14)} ~${monthlyCredits(m)} credits/mo`);
}
for (const m of skipped) {
  console.log(`  ${m.name.padEnd(30)}   0 URLs  SKIPPED (no URLs configured yet)`);
}
const estimate = planned.reduce((n, m) => n + monthlyCredits(m), 0);
console.log(
  `\n  local estimate: ~${estimate} credits/month ` +
    `(per-monitor cap ${MAX_ESTIMATED_CREDITS}, fleet cap ${MAX_TOTAL_ESTIMATED_CREDITS})\n`,
);

if (estimate > MAX_TOTAL_ESTIMATED_CREDITS) {
  console.error(
    `ABORT: the fleet estimates ${estimate} credits/month, above the ` +
      `${MAX_TOTAL_ESTIMATED_CREDITS} cap. Raising the cap is the account owner's\n` +
      `call and needs audit hold F-020 answered first (plan tier, and who else\n` +
      `owns monitors on this API key). Reduce a cadence or a URL set instead.`,
  );
  process.exit(1);
}

if (KEY === "skip") {
  console.log("[dry-run] no network calls made, nothing written.");
  process.exit(0);
}

/**
 * Every monitor on the key, paged to exhaustion.
 *
 * This is the idempotence hinge, and getting it wrong cost real money on
 * 15 September 2026. The previous one line was
 *
 *   await api("", "GET").then((r) => r?.data ?? ...).catch(() => [])
 *
 * and it had two faults that combined into one bad outcome. The List
 * Monitors endpoint defaults to `limit=25`; this key carries 47 monitors
 * (audit hold F-020), so our five were simply not in the page that came
 * back. `byName.get()` missed all five, and the script POSTed five
 * duplicates alongside the originals — new monitors with no check
 * history, which the poller then read instead of the real ones and
 * reported "no new checks" for all five while the live monitors kept
 * running unseen. Both sets billed: 5,330 credits/month against a
 * 5,000/month plan.
 *
 * The `.catch(() => [])` was the second fault and the more dangerous one:
 * it turned any failure to list — a timeout, a 500, an expired key — into
 * "no monitors exist", whose only possible next step is to create
 * everything again. A script that cannot see what exists must refuse to
 * act, not assume the slate is clean.
 */
function listAllMonitors() {
  // 100 is the endpoint's documented maximum (limit: 1..100, default 25).
  return pageAll(async (limit, offset) => {
    const res = await api(`?limit=${limit}&offset=${offset}`, "GET");
    return res?.data ?? res?.monitors ?? [];
  });
}

let existing;
try {
  existing = await listAllMonitors();
} catch (e) {
  console.error(
    `ABORT: could not list existing monitors (${String(e).slice(0, 160)}).\n` +
      `Refusing to continue: without the current list this script cannot tell an\n` +
      `update from a create, and guessing "nothing exists" duplicates the whole\n` +
      `fleet. Re-run once the API answers.`,
  );
  process.exit(1);
}

const byName = new Map(existing.map((m) => [m.name, m]));
console.log(`\n${existing.length} monitor(s) already on this key.`);

// A name we are about to provision that already exists TWICE is a
// duplicate pair from exactly the bug above. Say so loudly rather than
// silently picking one.
for (const m of MONITORS) {
  const dupes = existing.filter((e) => e.name === m.name);
  if (dupes.length > 1) {
    console.error(
      `WARNING: ${dupes.length} monitors are named ${m.name} — ${dupes
        .map((d) => d.id)
        .join(", ")}. Delete the extras; this run will update the first.`,
    );
  }
}

const out = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, "utf8")) : { monitors: {} };
out.monitors ??= {};

for (const m of planned) {
  const payload = {
    name: m.name,
    schedule: m.schedule,
    goal: m.goal,
    targets: targetsFor(m.urls),
    retentionDays: 30,
  };
  const found = byName.get(m.name);

  // Never re-send an unchanged URL list. Firecrawl answers ANY `targets`
  // in a PATCH by replacing the target, and a new target has no history:
  // the monitor's next check reports every page as `new` and diffs
  // nothing. A provisioning run meant to change one monitor's schedule was
  // silently blinding all of them for a cycle — up to a week for the
  // weekly ones. Omitting `targets` keeps the target and its history
  // (verified 23 September 2026: same target ID before and after).
  // Reading the definition costs no credits.
  if (found) {
    const live = await api(`/${found.id}`, "GET").then((r) => r?.data ?? r);
    if (sameUrlSet(liveMonitorUrls(live), m.urls)) {
      delete payload.targets;
    } else {
      console.warn(
        `NOTE: ${m.name} URL set changed — Firecrawl will replace its target, so its next ` +
          `check is a baseline and diffs nothing. Expected once per URL change; do not re-run ` +
          `provisioning casually.`,
      );
    }
  }

  const res = found
    ? await api(`/${found.id}`, "PATCH", payload)
    : await api("", "POST", payload);
  const data = res?.data ?? res;

  const est = data?.estimatedCreditsPerMonth;
  console.log(`${found ? "updated" : "created"} ${m.name} → ${data?.id}  estimatedCreditsPerMonth=${est ?? "n/a"}`);

  if (typeof est === "number" && est > MAX_ESTIMATED_CREDITS) {
    console.error(
      `\nABORT: ${m.name} estimates ${est} credits/month, above the ${MAX_ESTIMATED_CREDITS} cap.\n` +
        `Most likely cause: PDF documents billing per page rather than per URL.\n` +
        `Reduce that monitor's cadence (e.g. "every 2 days") and re-run.`,
    );
    process.exit(1);
  }

  out.monitors[m.key] = { id: data?.id, name: m.name, urls: m.urls.length, schedule: m.schedule.cron };
}

mkdirSync("data/monitor", { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
console.log(`\nWrote ${OUT_PATH}`);
