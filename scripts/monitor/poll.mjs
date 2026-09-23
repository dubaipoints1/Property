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
  needsBaseline,
  SALARY_TRANSFER,
  OFFERS_REGISTRY,
  SALARY_TRANSFER_REGISTRY,
  registryUrlToBank,
  isReadableCheck,
  checkListQueries,
  newestFirst,
  pageFetchLimit,
  coverageGapsFor,
  readCardUrls,
  readRegistryUrls,
  unwatchedUrls,
} from "./_routing.mjs";

const KEY = process.env.FIRECRAWL_API_KEY;
// Overridable so tests/monitor/poll.test.ts can drive this file — the real
// one, not a re-implementation of it — against a local stand-in. The unit
// tests cover the coverage rules; this exists so the wiring that consumes
// them is covered too, which is the half that actually failed.
const API = process.env.MONITOR_API_BASE ?? "https://api.firecrawl.dev/v2/monitor";
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
const coverageWarnings = [];
const banksToScrape = new Set();
let creditsThisPoll = 0;

/**
 * What each monitor is supposed to be watching, from the same files
 * setup.mjs provisions from. Only the sets that are derived from the repo
 * are checked; press-rooms is a literal list inside setup.mjs and has
 * nothing here to drift from.
 */
function expectedUrls() {
  const { kfs, product } = readCardUrls(BANKS_DIR);
  return {
    "fee-docs": kfs,
    "product-pages": product,
    offers: readRegistryUrls(OFFERS_REGISTRY),
    "salary-transfer": readRegistryUrls(SALARY_TRANSFER_REGISTRY),
  };
}

const EXPECTED = expectedUrls();

for (const [key, mon] of Object.entries(monitors)) {
  if (!mon?.id) continue;

  // Is this monitor still watching everything the repo says it should?
  // Reading a monitor definition costs no credits. A URL in the config but
  // not on the monitor produces no check, no diff and no alert — it is
  // indistinguishable from a page that never changes, which is the most
  // expensive kind of silence this pipeline can produce.
  if (EXPECTED[key]?.length) {
    try {
      const def = await api(`/${mon.id}`);
      const missing = unwatchedUrls(EXPECTED[key], def?.data ?? def);
      if (missing.length) {
        coverageWarnings.push({
          monitor: key,
          checkId: "(monitor definition)",
          kind: "unwatched",
          count: missing.length,
          note:
            `${missing.length} URL(s) in the repo config are not on the live ` +
            `monitor and have never been checked: ${missing.join(", ")}. ` +
            `Re-run scripts/monitor/setup.mjs to provision them.`,
        });
        console.error(`[${key}] ${missing.length} unwatched URL(s) — setup.mjs is due`);
      }
    } catch (e) {
      console.error(`[${key}] definition read failed: ${String(e).slice(0, 140)}`);
    }
  }

  let checks;
  try {
    // One request per readable status, merged. The API's `status` takes a
    // single value and omitting it does NOT mean "all" — an unfiltered list
    // leaves `partial` out, so there is no default to lean on. See
    // checkListQueries() in ./_routing.mjs for what asking for `completed`
    // alone cost.
    const byId = new Map();
    const counts = [];
    for (const query of checkListQueries(10)) {
      const res = await api(`/${mon.id}/checks${query}`);
      const got = res?.data ?? res?.checks ?? [];
      counts.push(`${query.match(/status=([a-z]+)/)?.[1] ?? "?"}=${got.length}`);
      for (const c of got) if (c?.id) byId.set(c.id, c);
    }
    checks = [...byId.values()].filter(isReadableCheck).sort(newestFirst);
    // Log what each status query actually returned. Two fixes to this
    // poller in a row were shipped on an assumption about what the API
    // hands back, and both times the only symptom was a cheerful "no new
    // checks" — a line that looks identical whether nothing changed or the
    // request was wrong. The counts make the difference visible.
    console.log(`[${key}] listed ${counts.join(" ")} → ${byId.size} unique`);
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
  const isBaseline = needsBaseline(state.baselined[key], mon.id);

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
      const detail = await api(
        `/${mon.id}/checks/${check.id}?status=changed&limit=${pageFetchLimit(check)}`,
      );
      pages = detail?.data?.pages ?? detail?.pages ?? [];
    } catch (e) {
      console.error(`[${key}] check detail failed: ${String(e).slice(0, 140)}`);
      coverageWarnings.push({
        monitor: key,
        checkId: check.id,
        kind: "unread",
        count: check?.summary?.changed ?? 0,
        note: `the check could not be read at all: ${String(e).slice(0, 140)}`,
      });
      continue;
    }

    // Report what this check could not see. An unread page is not a
    // change deferred to next week — the next check diffs against this
    // one's scrape, so it is a change no run will ever surface.
    for (const gap of coverageGapsFor(check, pages.length)) {
      coverageWarnings.push({ monitor: key, checkId: check.id, ...gap });
      console.error(`[${key}] coverage gap (${gap.kind}): ${gap.note}`);
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

  state.baselined[key] = mon.id;
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

/**
 * What this poll could not see, rendered for a human.
 *
 * Kept separate from findings on purpose: a finding says something moved,
 * a coverage gap says we do not know whether something moved and never
 * will for that page. The second is the more dangerous of the two and
 * must not be filed under the first.
 */
function renderCoverage(warnings) {
  const lines = [
    "## Coverage gaps — pages this poll could not read",
    "",
    "_Not a change signal. Each line is a page whose diff no run will surface:_",
    "_the next check diffs against this check's scrape, so a page missed here_",
    "_is missed permanently. Re-read these by hand against the issuer's page._",
    "",
  ];
  for (const w of warnings) {
    lines.push(`- **${w.monitor}** · check \`${w.checkId}\` · ${w.kind} — ${w.note}`);
  }
  lines.push("");
  return lines.join("\n");
}

if (cardFindings.length || coverageWarnings.length) {
  const path = `.council/monitoring/card-change-${stamp}.md`;
  const body = renderFindings(
    cardFindings,
    "Card data change signals",
    "_CHANGE SIGNAL ONLY. Diffs and judge reasoning below are context for a human._\n" +
      "_Every figure must be re-derived by the deterministic scraper before it_\n" +
      "_reaches cards.json (Charter §6). Offers changes are editor-typed by hand_\n" +
      "_per the scrape merge contract — they are never auto-scraped._",
  );
  writeFileSync(path, coverageWarnings.length ? `${body}\n${renderCoverage(coverageWarnings)}` : body);
  console.log(
    `Wrote ${path} (${cardFindings.length} findings, ${coverageWarnings.length} coverage gaps)`,
  );
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
