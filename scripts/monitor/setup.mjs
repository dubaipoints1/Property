// Firecrawl monitor provisioning — idempotent.
//
// Creates (or updates) the five monitors that replace blind scheduled
// scraping with event-driven alerts:
//
//   fee-docs         10 KFS / Schedule-of-Fees documents      daily
//   product-pages    52 card product pages                    weekly
//   offers           bank offers/promotions landing pages     daily
//   salary-transfer  bank salary-transfer offer pages + T&Cs  weekly
//   press-rooms       9 issuer press indexes                  daily
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
  readCardUrls,
  readRegistryUrls,
} from "./_routing.mjs";

const KEY = process.env.FIRECRAWL_API_KEY;
const API = "https://api.firecrawl.dev/v2/monitor";
const BANKS_DIR = "scripts/scrape/banks";
const OUT_PATH = "data/monitor/monitors.json";

// Budget guard. The create response returns estimatedCreditsPerMonth;
// we refuse to provision above this so a mis-specified monitor cannot
// quietly eat the 5,000/month plan. Design estimate is ~1,154.
const MAX_ESTIMATED_CREDITS = 1600;

// Press rooms — moved here from scripts/news-monitor/monitor.mjs, whose
// hand-rolled link-diffing once surfaced "Visit our Facebook page" as a
// headline. Firecrawl's own diff does this properly.
const PRESS_PAGES = [
  "https://www.emirates.com/media-centre/",
  "https://www.etihad.com/en-ae/news",
  "https://www.qatarairways.com/press-releases/en-ww",
  "https://news.marriott.com/",
  "https://stories.hilton.com/",
  "https://press.accor.com/",
  "https://www.emiratesnbd.com/en/media-centre",
  "https://www.adcb.com/en/about-us/media-centre/",
  "https://www.bankfab.com/en-ae/about-fab/group/news",
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
    schedule: { text: "daily at 03:00", timezone: "UTC" },
    goal:
      "Alert when an annual fee, foreign-currency or FX transaction fee, minimum salary requirement, late-payment fee or interest/profit rate changes. Ignore navigation, cookie banners, contact details, document version stamps and layout changes.",
  },
  {
    key: "product-pages",
    name: "dubaipoints-product-pages",
    urls: product,
    schedule: { text: "weekly", timezone: "UTC" },
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
    schedule: { text: "daily at 04:00", timezone: "UTC" },
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
    schedule: { text: "weekly", timezone: "UTC" },
    goal:
      "Alert when a salary-transfer offer changes: the cash or voucher amount, the salary bands that qualify, the minimum salary, the payout timing, the tenure or lock-in period, the clawback terms, any bundled credit-card or finance requirement, or the offer's validity dates. Alert when such an offer is launched or withdrawn. Ignore navigation, cookie banners, branch locators and layout changes.",
  },
  {
    key: "press-rooms",
    name: "dubaipoints-press-rooms",
    urls: PRESS_PAGES,
    schedule: { text: "daily at 05:00", timezone: "UTC" },
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

console.log("Monitors to provision:\n");
for (const m of planned) {
  const perMonth = m.schedule.text.startsWith("weekly") ? m.urls.length * 4.3 : m.urls.length * 30;
  console.log(`  ${m.name.padEnd(30)} ${String(m.urls.length).padStart(3)} URLs  ${m.schedule.text.padEnd(16)} ~${Math.round(perMonth)} credits/mo`);
}
for (const m of skipped) {
  console.log(`  ${m.name.padEnd(30)}   0 URLs  SKIPPED (no URLs configured yet)`);
}
const estimate = planned.reduce(
  (n, m) => n + (m.schedule.text.startsWith("weekly") ? m.urls.length * 4.3 : m.urls.length * 30),
  0,
);
console.log(`\n  local estimate: ~${Math.round(estimate)} credits/month (cap ${MAX_ESTIMATED_CREDITS})\n`);

if (KEY === "skip") {
  console.log("[dry-run] no network calls made, nothing written.");
  process.exit(0);
}

const existing = await api("", "GET").then((r) => r?.data ?? r?.monitors ?? []).catch(() => []);
const byName = new Map(existing.map((m) => [m.name, m]));

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

  out.monitors[m.key] = { id: data?.id, name: m.name, urls: m.urls.length, schedule: m.schedule.text };
}

mkdirSync("data/monitor", { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
console.log(`\nWrote ${OUT_PATH}`);
