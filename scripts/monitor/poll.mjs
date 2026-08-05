// Monitor poller — reads Firecrawl check results and routes them.
//
// Runs daily in GitHub Actions (.github/workflows/monitor.yml). Firecrawl
// does the watching on its own schedule; this reads what it found.
//
// Routing:
//   fee-docs, product-pages  → card digest + auto-scrape the affected bank
//   offers                   → card digest, editor-routed, NO auto-scrape
//   salary-transfer          → its own digest, editor-routed, NO auto-scrape
//   press-rooms              → news digest at the path the desks already read
//
// Why offers never auto-scrape: per the scrape merge contract, typed
// editor fields (welcomeBonus, annualFeeWaiver, _features) are never
// written by the scraper — it emits free text under _scraped_freetext.*
// for an editor to type up by hand. An offers change is therefore a
// human's job, and dispatching a scrape would fight that contract.
//
// Salary-transfer is the same rule with no exception to argue about: the
// salaryTransferOffers collection is *entirely* typed editor content —
// salary bands, reward amounts, payout months, clawback terms — and the
// scraper has no free-text equivalent for any of it. It gets its own
// digest rather than the card one because nothing in it reaches
// cards.json, and filing it under "card data change" would misdescribe
// the work it is asking an editor to do.
//
// Why nothing here writes a number: Charter §6. The monitor reports that
// something moved; the deterministic parsers in scripts/scrape/ decide
// what it now is. Diffs and judge reasoning are reproduced in the digest
// as CONTEXT for a human, never as a fact base.
//
// Reading check results costs no Firecrawl credits — the scheduled checks
// already paid for themselves. The credit counter here tracks what the
// monitors reported spending, for visibility in the digest.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";

import {
  AUTO_SCRAPE,
  NEWS,
  SALARY_TRANSFER,
  OFFERS_REGISTRY,
  SALARY_TRANSFER_REGISTRY,
  registryUrlToBank,
} from "./_routing.mjs";

const KEY = process.env.FIRECRAWL_API_KEY;
const API = "https://api.firecrawl.dev/v2/monitor";
const MONITORS_PATH = "data/monitor/monitors.json";
const STATE_PATH = "data/monitor/state.json";
const BANKS_DIR = "scripts/scrape/banks";

if (!KEY) {
  console.error("FIRECRAWL_API_KEY unset — nothing to poll.");
  process.exit(0);
}
if (!existsSync(MONITORS_PATH)) {
  console.error(`${MONITORS_PATH} missing — run scripts/monitor/setup.mjs first.`);
  process.exit(0);
}

const monitors = JSON.parse(readFileSync(MONITORS_PATH, "utf8")).monitors ?? {};
const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, "utf8"))
  : { seenChecks: {}, baselined: {}, lastPolled: null, creditsReported: {} };
state.seenChecks ??= {};
state.baselined ??= {};
state.creditsReported ??= {};

/** url → bank slug, built from the same configs the scraper uses. */
function urlToBank() {
  const map = new Map();
  for (const file of readdirSync(BANKS_DIR).filter((f) => f.endsWith(".urls.json"))) {
    const slug = file.replace(".urls.json", "");
    for (const card of JSON.parse(readFileSync(`${BANKS_DIR}/${file}`, "utf8"))) {
      const u = card?.urls ?? {};
      if (u.kfs) map.set(u.kfs, slug);
      if (u.product) map.set(u.product, slug);
    }
  }
  return map;
}

const bankOf = urlToBank();
const offerBankOf = registryUrlToBank(OFFERS_REGISTRY);
const salaryBankOf = registryUrlToBank(SALARY_TRANSFER_REGISTRY);

async function api(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${KEY}` },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

const cardFindings = [];
const newsFindings = [];
const salaryFindings = [];
const banksToScrape = new Set();
let creditsThisPoll = 0;

for (const [key, mon] of Object.entries(monitors)) {
  if (!mon?.id) continue;
  let checks;
  try {
    const res = await api(`/${mon.id}/checks?status=completed&limit=10`);
    checks = res?.data ?? res?.checks ?? [];
  } catch (e) {
    console.error(`[${key}] checks list failed: ${String(e).slice(0, 140)}`);
    continue;
  }

  const seen = (state.seenChecks[key] ??= []);
  const fresh = checks.filter((c) => c?.id && !seen.includes(c.id));
  if (!fresh.length) {
    console.log(`[${key}] no new checks`);
    continue;
  }

  // A monitor's first observed check reports every page as `new` — that
  // is the baseline snapshot, not 62 simultaneous changes. Record it and
  // dispatch nothing.
  const isBaseline = !state.baselined[key];

  for (const check of fresh) {
    seen.push(check.id);
    if (seen.length > 50) seen.splice(0, seen.length - 50);
    creditsThisPoll += check?.actualCredits ?? check?.estimatedCredits ?? 0;

    if (isBaseline) {
      console.log(`[${key}] baseline check ${check.id} recorded — no dispatch`);
      continue;
    }

    let pages;
    try {
      const detail = await api(`/${mon.id}/checks/${check.id}?status=changed&limit=50`);
      pages = detail?.data?.pages ?? detail?.pages ?? [];
    } catch (e) {
      console.error(`[${key}] check detail failed: ${String(e).slice(0, 140)}`);
      continue;
    }

    for (const page of pages) {
      // The judge is advisory only. When it explicitly rules a change
      // meaningless we skip the alert; we never let it assert a value.
      if (page?.judgment && page.judgment.meaningful === false) {
        console.log(`[${key}] ${page.url} — judged noise, skipped`);
        continue;
      }
      const finding = {
        monitor: key,
        url: page.url,
        bank:
          bankOf.get(page.url) ??
          offerBankOf.get(page.url) ??
          salaryBankOf.get(page.url) ??
          null,
        reason: page?.judgment?.reason ?? "",
        diff: page?.diff?.text ?? "",
      };
      if (NEWS.has(key)) newsFindings.push(finding);
      else if (SALARY_TRANSFER.has(key)) salaryFindings.push(finding);
      else cardFindings.push(finding);

      if (AUTO_SCRAPE.has(key) && finding.bank) banksToScrape.add(finding.bank);
    }
  }

  state.baselined[key] = true;
}

state.lastPolled = new Date().toISOString();
state.creditsReported[new Date().toISOString().slice(0, 7)] =
  (state.creditsReported[new Date().toISOString().slice(0, 7)] ?? 0) + creditsThisPoll;

mkdirSync("data/monitor", { recursive: true });
writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");

// ── digests ───────────────────────────────────────────────────────────
const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
mkdirSync(".council/monitoring", { recursive: true });

function renderFindings(findings, title, preamble) {
  const lines = [`# ${title} — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`, "", preamble, ""];
  const byMonitor = {};
  for (const f of findings) (byMonitor[f.monitor] ??= []).push(f);
  for (const [monitor, items] of Object.entries(byMonitor)) {
    lines.push(`## ${monitor}`, "");
    for (const f of items) {
      lines.push(`- **${f.bank ?? "unmapped"}** — ${f.url}`);
      if (f.reason) lines.push(`  _${f.reason}_`);
      if (f.diff) {
        lines.push("", "  ```diff", ...f.diff.split("\n").slice(0, 40).map((l) => `  ${l}`), "  ```");
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

if (cardFindings.length) {
  const path = `.council/monitoring/card-change-${stamp}.md`;
  writeFileSync(
    path,
    renderFindings(
      cardFindings,
      "Card data change signals",
      "_CHANGE SIGNAL ONLY. Diffs and judge reasoning below are context for a human._\n" +
        "_Every figure must be re-derived by the deterministic scraper before it_\n" +
        "_reaches cards.json (Charter §6). Offers changes are editor-typed by hand_\n" +
        "_per the scrape merge contract — they are never auto-scraped._",
    ),
  );
  console.log(`Wrote ${path} (${cardFindings.length} findings)`);
}

if (salaryFindings.length) {
  const path = `.council/monitoring/salary-transfer-change-${stamp}.md`;
  writeFileSync(
    path,
    renderFindings(
      salaryFindings,
      "Salary-transfer offer change signals",
      "_CHANGE SIGNAL ONLY. Diffs and judge reasoning below are context for a human._\n" +
        "_Nothing here is auto-applied: the salaryTransferOffers collection is typed_\n" +
        "_editor content end to end (salary bands, reward amounts, payout months,_\n" +
        "_clawback terms) and every field must be read off the source and typed up_\n" +
        "_by hand, then dated with a fresh lastVerified (Charter §6)._\n\n" +
        "_Owner: business-realestate-editor. Copy the deals desk._",
    ),
  );
  console.log(`Wrote ${path} (${salaryFindings.length} findings)`);
}

if (newsFindings.length) {
  // Same path shape the desks already consume from news-monitor.
  const path = `.council/monitoring/digest-${stamp}.md`;
  writeFileSync(
    path,
    renderFindings(
      newsFindings,
      "News monitoring digest",
      "_PRIMARY sources — scrape the linked release for the fact base._\n" +
        "_Generated by scripts/monitor/poll.mjs (Firecrawl monitors)._",
    ),
  );
  console.log(`Wrote ${path} (${newsFindings.length} findings)`);
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `banks=${[...banksToScrape].join(" ")}\n`);
}
console.log(`Banks to re-scrape: ${[...banksToScrape].join(" ") || "(none)"}`);
console.log(`Credits reported by monitors this poll: ${creditsThisPoll}`);
