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

import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  appendFileSync,
} from "node:fs";

import {
  AUTO_SCRAPE,
  NEWS,
  SALARY_TRANSFER,
  OFFERS_REGISTRY,
  SALARY_TRANSFER_REGISTRY,
  registryUrlToBank,
  isReadableCheck,
  checkListQueries,
  healthListQueries,
  readCheckHistory,
  readChangedPages,
  retainedAcknowledgements,
  collectionFreshness,
  IN_PROGRESS_CHECK_STATUSES,
  isSuccessfulCollection,
  newestFirst,
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
const API =
  process.env.MONITOR_API_BASE ?? "https://api.firecrawl.dev/v2/monitor";
const MONITORS_PATH = "data/monitor/monitors.json";
const STATE_PATH = "data/monitor/state.json";
const PENDING_STATE_PATH = "data/monitor/state.pending.json";
const HEALTH_PATH = "data/monitor/health.json";
const BANKS_DIR = "scripts/scrape/banks";
const DRY_RUN = process.env.MONITOR_DRY_RUN === "true";
const RUN_ID = String(process.env.GITHUB_RUN_ID || "local");
const LIST_LIMIT = 100;
const HISTORY_CAP = 1000;
const DETAIL_CAP = 1000;
const attemptedAt = new Date().toISOString();
const health = {
  runId: RUN_ID,
  attemptedAt,
  asOf: attemptedAt,
  dryRun: DRY_RUN,
  healthy: true,
  inspectedWindowPerQuery: LIST_LIMIT,
  maxHistoryPerQuery: HISTORY_CAP,
  maxDetailPagesPerCheck: DETAIL_CAP,
  scope:
    "Free reads of existing checks only; no new collection, provisioning or card verification.",
  monitors: {},
  errors: [],
};
let state;

function fault(monitor, kind, note, checkId = "(poll)") {
  health.healthy = false;
  health.errors.push({ monitor, kind, note, checkId });
  console.error(`[${monitor}] ${kind}: ${note}`);
}

/** url → bank slug, built from the same configs the scraper uses. */
function urlToBank() {
  const map = new Map();
  for (const file of readdirSync(BANKS_DIR).filter((f) =>
    f.endsWith(".urls.json"),
  )) {
    const slug = file.replace(".urls.json", "");
    for (const card of JSON.parse(
      readFileSync(`${BANKS_DIR}/${file}`, "utf8"),
    )) {
      const u = card?.urls ?? {};
      if (u.kfs) map.set(u.kfs, slug);
      if (u.product) map.set(u.product, slug);
    }
  }
  return map;
}

async function api(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${KEY}` },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  const body = await res.json();
  if (body?.success === false)
    throw new Error(`GET ${path} → unsuccessful response`);
  return body;
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

try {
  if (process.env.MONITOR_AS_OF) {
    const reference = Date.parse(process.env.MONITOR_AS_OF);
    if (!Number.isFinite(reference))
      throw new Error("Invalid MONITOR_AS_OF diagnostic reference time");
    health.asOf = new Date(reference).toISOString();
  }
  if (!KEY)
    throw new Error("FIRECRAWL_API_KEY unset — monitoring did not run.");
  if (!existsSync(MONITORS_PATH))
    throw new Error(`${MONITORS_PATH} missing — monitor IDs unavailable.`);
  const monitors = JSON.parse(readFileSync(MONITORS_PATH, "utf8")).monitors;
  if (
    !monitors ||
    typeof monitors !== "object" ||
    Array.isArray(monitors) ||
    !Object.keys(monitors).length
  ) {
    throw new Error("Monitor configuration contains no monitor IDs.");
  }
  state = existsSync(STATE_PATH)
    ? JSON.parse(readFileSync(STATE_PATH, "utf8"))
    : { seenChecks: {}, baselined: {}, lastPolled: null, creditsReported: {} };
  if (!state || typeof state !== "object" || Array.isArray(state))
    throw new Error("Invalid monitor state.");
  state.seenChecks ??= {};
  state.baselined ??= {};
  state.creditsReported ??= {};
  state.latestSuccessfulChecks ??= {};
  for (const field of [
    "seenChecks",
    "baselined",
    "creditsReported",
    "latestSuccessfulChecks",
  ]) {
    if (
      !state[field] ||
      typeof state[field] !== "object" ||
      Array.isArray(state[field])
    ) {
      throw new Error(`Invalid monitor state field: ${field}`);
    }
  }
  const bankOf = urlToBank();
  const offerBankOf = registryUrlToBank(OFFERS_REGISTRY);
  const salaryBankOf = registryUrlToBank(SALARY_TRANSFER_REGISTRY);
  const EXPECTED = expectedUrls();
  let pollingComplete = true;

  for (const [key, mon] of Object.entries(monitors)) {
    const monitorHealth = (health.monitors[key] = {
      attemptedAt,
      listComplete: false,
      newChecks: 0,
      readableChecks: 0,
      latestObservedCheck: null,
      latestSuccessfulCheck: state.latestSuccessfulChecks[key] ?? null,
    });
    if (!mon?.id || typeof mon.id !== "string") {
      fault(
        key,
        "missing_id",
        "Configured monitor has no usable ID; nothing was collected.",
      );
      pollingComplete = false;
      continue;
    }
    const monitorId = encodeURIComponent(mon.id);
    let monitorComplete = true;
    let historyComplete = true;
    let definition = null;

    // Is this monitor still watching everything the repo says it should?
    // Reading a monitor definition costs no credits. A URL in the config but
    // not on the monitor produces no check, no diff and no alert — it is
    // indistinguishable from a page that never changes, which is the most
    // expensive kind of silence this pipeline can produce.
    {
      try {
        const def = await api(`/${monitorId}`);
        if (!Array.isArray((def?.data ?? def)?.targets))
          throw new Error("Monitor definition has no targets array.");
        definition = def?.data ?? def;
        if (definition.status && definition.status !== "active") {
          fault(
            key,
            "monitor_inactive",
            `Live monitor status is ${definition.status}; no activation attempted.`,
          );
        }
        const missing = unwatchedUrls(EXPECTED[key] ?? [], definition);
        if (missing.length) {
          coverageWarnings.push({
            monitor: key,
            checkId: "(monitor definition)",
            kind: "unwatched",
            count: missing.length,
            note:
              `${missing.length} URL(s) in the repo config are not on the live ` +
              `monitor and have never been checked: ${missing.join(", ")}. ` +
              `Review the provisioning gap; do not change targets or spend without approval.`,
          });
          fault(
            key,
            "unwatched",
            `${missing.length} expected URL(s) are absent from the live definition.`,
          );
          console.error(
            `[${key}] ${missing.length} unwatched URL(s) — setup.mjs is due`,
          );
        }
      } catch (e) {
        fault(key, "definition_read_failed", String(e).slice(0, 140));
        monitorComplete = false;
      }
    }

    const byId = new Map();
    const counts = [];
    // One request per readable status, merged. The API's `status` takes a
    // single value and omitting it does NOT mean "all" — an unfiltered list
    // leaves `partial` out, so there is no default to lean on. See
    // checkListQueries() in ./_routing.mjs for what asking for `completed`
    // alone cost.
    for (const query of [
      ...checkListQueries(LIST_LIMIT),
      ...healthListQueries(LIST_LIMIT),
    ]) {
      try {
        const requestedStatus = new URLSearchParams(query).get("status");
        const result = await readCheckHistory(
          (limit, offset) =>
            api(
              `/${monitorId}/checks?${requestedStatus ? `status=${requestedStatus}&` : ""}limit=${limit}&offset=${offset}`,
            ),
          {
            limit: LIST_LIMIT,
            maxChecks: HISTORY_CAP,
            status: requestedStatus,
          },
        );
        counts.push(
          `${requestedStatus ?? "health"}=${result.checks.length} (${result.requests} page reads)`,
        );
        for (const c of result.checks) byId.set(c.id, c);
        if (!result.complete) throw new Error(result.error);
      } catch (e) {
        fault(key, "check_list_failed", `${query}: ${String(e).slice(0, 140)}`);
        monitorComplete = false;
        historyComplete = false;
      }
    }
    const checks = [...byId.values()].sort(newestFirst);
    // Log what each status query actually returned. Two fixes to this
    // poller in a row were shipped on an assumption about what the API
    // hands back, and both times the only symptom was a cheerful "no new
    // checks" — a line that looks identical whether nothing changed or the
    // request was wrong. The counts make the difference visible.
    console.log(`[${key}] listed ${counts.join(" ")} → ${byId.size} unique`);
    monitorHealth.listComplete = monitorComplete;
    monitorHealth.historyComplete = historyComplete;
    monitorHealth.collection = collectionFreshness(
      definition,
      checks,
      health.asOf,
    );
    if (monitorHealth.collection.state !== "current-complete") {
      fault(
        key,
        `collection_${monitorHealth.collection.state.replaceAll("-", "_")}`,
        monitorHealth.collection.reason,
        checks[0]?.id,
      );
    }
    monitorHealth.latestObservedCheck = checks[0]
      ? {
          id: checks[0].id,
          status: checks[0].status,
          scheduledFor: checks[0].scheduledFor ?? checks[0].createdAt ?? null,
        }
      : null;
    const successful = checks.find(isSuccessfulCollection);
    if (successful) {
      const previous = state.latestSuccessfulChecks[key];
      if (!previous || newestFirst(successful, previous) < 0) {
        state.latestSuccessfulChecks[key] = {
          id: successful.id,
          status: successful.status,
          scheduledFor: successful.scheduledFor ?? successful.createdAt ?? null,
          totalPages: successful.summary.totalPages,
        };
      }
      monitorHealth.latestSuccessfulCheck = state.latestSuccessfulChecks[key];
    }
    if (!checks.length)
      fault(
        key,
        "no_checks",
        "No checks were returned; this is not evidence of successful collection.",
      );
    if (!monitorHealth.latestSuccessfulCheck)
      fault(
        key,
        "no_successful_collection",
        "No completed, non-empty, error-free collection is visible in the inspected history or acknowledged state.",
      );
    const latest = checks[0];
    if (latest?.status === "partial" || latest?.summary?.error > 0) {
      fault(
        key,
        "latest_collection_incomplete",
        "Latest observed collection is partial or contains failed pages; historical success is not current freshness.",
        latest.id,
      );
    }
    if (
      latest &&
      isReadableCheck(latest) &&
      !(latest?.summary?.totalPages > 0)
    ) {
      fault(
        key,
        "empty_collection",
        "Latest readable check reports no collected pages.",
        latest.id,
      );
    }
    if (
      latest &&
      !isReadableCheck(latest) &&
      !IN_PROGRESS_CHECK_STATUSES.has(latest.status)
    ) {
      fault(
        key,
        "latest_check_unhealthy",
        `Latest observed check has status ${latest.status}; polling it did not collect pages.`,
        latest.id,
      );
    }

    const seen = (state.seenChecks[key] ??= []);
    if (!Array.isArray(seen))
      throw new Error(`Invalid seenChecks list for ${key}`);
    const fresh = checks.filter(
      (c) => !seen.includes(c.id) && !IN_PROGRESS_CHECK_STATUSES.has(c.status),
    );
    monitorHealth.newChecks = fresh.length;
    if (!fresh.length) {
      state.seenChecks[key] = retainedAcknowledgements(
        seen,
        checks,
        historyComplete,
      );
      console.log(`[${key}] no new checks — no new collection claimed`);
      pollingComplete &&= monitorComplete;
      continue;
    }

    // A monitor's first observed check reports every page as `new` — that
    // is the baseline snapshot, not 62 simultaneous changes. Record it and
    // dispatch nothing.
    const isBaseline = !state.baselined[key];
    let baselineRead = false;

    for (const check of fresh) {
      const readable = isReadableCheck(check);
      if (!readable) {
        fault(
          key,
          "check_failed",
          `Check status ${check.status}: ${String(check.error ?? "no successful collection reported").slice(0, 160)}`,
          check.id,
        );
        // Some failed checks still expose useful completed pages. Do not
        // throw that evidence away, but do not call the check successful.
        if (!(check?.summary?.changed > 0)) {
          if (monitorComplete) seen.push(check.id);
          continue;
        }
      } else {
        monitorHealth.readableChecks += 1;
      }
      if (readable && !(check?.summary?.totalPages > 0)) {
        fault(
          key,
          "empty_collection",
          "Readable check reports no collected pages; it is not a healthy collection certificate.",
          check.id,
        );
      }
      if (isBaseline && !(check?.summary?.changed > 0)) {
        const gaps = coverageGapsFor(check, 0);
        for (const gap of gaps) {
          coverageWarnings.push({ monitor: key, checkId: check.id, ...gap });
          fault(key, gap.kind, gap.note, check.id);
        }
        if (monitorComplete && readable && check?.summary?.totalPages > 0) {
          seen.push(check.id);
          baselineRead = true;
          if (Number.isFinite(check.actualCredits))
            creditsThisPoll += check.actualCredits;
        }
        console.log(`[${key}] baseline check ${check.id} — no dispatch`);
        continue;
      }

      const detail = await readChangedPages(
        (limit, skip) =>
          api(
            `/${monitorId}/checks/${encodeURIComponent(check.id)}?status=changed&limit=${limit}&skip=${skip}`,
          ),
        {
          limit: LIST_LIMIT,
          maxResults: DETAIL_CAP,
          expected: check?.summary?.changed ?? 0,
        },
      );
      const pages = detail.pages;
      if (!detail.complete) {
        const e = detail.error;
        console.error(
          `[${key}] check detail failed: ${String(e).slice(0, 140)}`,
        );
        coverageWarnings.push({
          monitor: key,
          checkId: check.id,
          kind: "unread",
          count: check?.summary?.changed ?? 0,
          note: `the check could not be read at all: ${String(e).slice(0, 140)}`,
        });
        fault(key, "detail_read_failed", String(e).slice(0, 140), check.id);
        monitorComplete = false;
      }

      // Report what this check could not see. An unread page is not a
      // change deferred to next week — the next check diffs against this
      // one's scrape, so it is a change no run will ever surface.
      const changedPages = pages.filter(
        (page) => !page.error && (!page.status || page.status === "changed"),
      );
      if (
        Number.isSafeInteger(check?.summary?.changed) &&
        changedPages.length > check.summary.changed
      ) {
        fault(
          key,
          "detail_count_mismatch",
          "The detail returned more changed pages than the check summary; useful evidence is retained without acknowledgement or paid hand-off.",
          check.id,
        );
        monitorComplete = false;
      }
      if (changedPages.length !== pages.length) {
        fault(
          key,
          "page_failed",
          "Changed-page response includes a failed or unexpected page; usable pages remain routed and the check remains retryable.",
          check.id,
        );
        monitorComplete = false;
      }
      const gaps = coverageGapsFor(check, changedPages.length);
      for (const gap of gaps) {
        coverageWarnings.push({ monitor: key, checkId: check.id, ...gap });
        fault(key, gap.kind, gap.note, check.id);
      }

      // Retriable read/truncation faults never enter the candidate seen set.
      // Permanent scrape errors are acknowledged only with the human alert.
      const acknowledged =
        monitorComplete && !gaps.some((gap) => gap.kind === "truncated");
      if (acknowledged) {
        seen.push(check.id);
        if (Number.isFinite(check.actualCredits))
          creditsThisPoll += check.actualCredits;
        if (readable && check?.summary?.totalPages > 0) baselineRead = true;
      } else if (gaps.some((gap) => gap.kind === "truncated")) {
        monitorComplete = false;
      }
      if (isBaseline) {
        console.log(`[${key}] baseline check ${check.id} read — no dispatch`);
        continue;
      }

      for (const page of changedPages) {
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

        if (acknowledged && AUTO_SCRAPE.has(key) && finding.bank)
          banksToScrape.add(finding.bank);
      }
    }

    state.seenChecks[key] = retainedAcknowledgements(
      seen,
      checks,
      historyComplete,
    );
    if (baselineRead) state.baselined[key] = true;
    pollingComplete &&= monitorComplete;
  }

  state.lastAttempted = attemptedAt;
  if (pollingComplete && health.healthy) state.lastPolled = attemptedAt;
  state.creditsReported[new Date().toISOString().slice(0, 7)] =
    (state.creditsReported[new Date().toISOString().slice(0, 7)] ?? 0) +
    creditsThisPoll;
} catch (e) {
  state = undefined;
  fault("configuration", "poll_failed", String(e).slice(0, 180));
}

// ── digests ───────────────────────────────────────────────────────────
const stamp = new Date()
  .toISOString()
  .slice(0, 16)
  .replace("T", "-")
  .replace(":", "");
mkdirSync(".council/monitoring", { recursive: true });
const digestPaths = {
  card_digest_path: "",
  salary_digest_path: "",
  news_digest_path: "",
  health_digest_path: "",
};

function renderFindings(findings, title, preamble) {
  const lines = [
    `# ${title} — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
    "",
    preamble,
    "",
  ];
  const byMonitor = {};
  for (const f of findings) (byMonitor[f.monitor] ??= []).push(f);
  for (const [monitor, items] of Object.entries(byMonitor)) {
    lines.push(`## ${monitor}`, "");
    for (const f of items) {
      // Newsrooms and programme pages belong to no bank; name the publisher's
      // host rather than printing "unmapped", which read as a routing fault.
      let who = f.bank;
      if (!who) {
        try {
          who = new URL(f.url).hostname.replace(/^www\./, "");
        } catch {
          who = "unmapped";
        }
      }
      lines.push(`- **${who}** — ${f.url}`);
      if (f.reason) lines.push(`  _${f.reason}_`);
      if (f.diff) {
        lines.push(
          "",
          "  ```diff",
          ...f.diff
            .split("\n")
            .slice(0, 40)
            .map((l) => `  ${l}`),
          "  ```",
        );
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
    "_Not a verified change. Failed source scrapes may leave an unrecoverable comparison gap;_",
    "_unread API details remain unacknowledged and will be retried. Re-read source failures_",
    "_by hand against the issuer's page. No freshness date is changed by this alert._",
    "",
  ];
  for (const w of warnings) {
    lines.push(
      `- **${w.monitor}** · check \`${w.checkId}\` · ${w.kind} — ${w.note}`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

if (cardFindings.length || coverageWarnings.length) {
  const path = `.council/monitoring/card-change-${stamp}.md`;
  digestPaths.card_digest_path = path;
  const body = renderFindings(
    cardFindings,
    "Card data change signals",
    "_CHANGE SIGNAL ONLY. Diffs and judge reasoning below are context for a human._\n" +
      "_Every figure must be re-derived by the deterministic scraper before it_\n" +
      "_reaches cards.json (Charter §6). Offers changes are editor-typed by hand_\n" +
      "_per the scrape merge contract — they are never auto-scraped._",
  );
  writeFileSync(
    path,
    coverageWarnings.length
      ? `${body}\n${renderCoverage(coverageWarnings)}`
      : body,
  );
  console.log(
    `Wrote ${path} (${cardFindings.length} findings, ${coverageWarnings.length} coverage gaps)`,
  );
}

if (salaryFindings.length) {
  const path = `.council/monitoring/salary-transfer-change-${stamp}.md`;
  digestPaths.salary_digest_path = path;
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
  digestPaths.news_digest_path = path;
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

if (health.errors.length) {
  const path = `.council/monitoring/monitor-health-${stamp}.md`;
  digestPaths.health_digest_path = path;
  const lines = [
    `# Monitor health — ${attemptedAt}`,
    "",
    `Collection reference time: ${health.asOf}. Poll attempt time remains ${attemptedAt}.`,
    "",
    "Health warning, not a new collection or verified card update. Reading existing check results is free.",
    "No monitor was created, executed, activated or reconfigured by this poll.",
    "",
    "## Failures and limits",
    "",
    ...health.errors.map(
      (error) =>
        `- **${error.monitor}** · \`${error.checkId}\` · ${error.kind} — ${error.note}`,
    ),
    "",
    "## Latest observations",
    "",
  ];
  for (const [key, observation] of Object.entries(health.monitors)) {
    const observed = observation.latestObservedCheck;
    const successful = observation.latestSuccessfulCheck;
    lines.push(
      `- **${key}**: latest observed ${observed ? `${observed.status} (${observed.scheduledFor ?? "time unavailable"})` : "unavailable"}; latest known successful collection ${successful ? `${successful.scheduledFor ?? "time unavailable"} (${successful.totalPages} pages)` : "unavailable"}.`,
    );
    if (observation.collection)
      lines.push(
        `  Collection state: ${observation.collection.state}; latest due slot ${observation.collection.latestDueSlot ?? "unverifiable"}; next scheduled run ${observation.collection.nextRunAt ?? "unavailable"}. No new grace period or field-verification promise is implied.`,
      );
  }
  lines.push(
    "",
    `Historical success is not current freshness. Status history uses verified offset pagination (${LIST_LIMIT} per request, ${HISTORY_CAP} per query); detail uses verified skip pagination (${DETAIL_CAP} changed pages per check). Missing pages, repeated identities or safety-cap exhaustion are explicit recovery gaps. Provider next URLs are never fetched.`,
    "",
    "Owner: technical-lead; source/credit recovery requires explicit review. A credit warning is a historical check result, not the current account balance.",
    "",
  );
  writeFileSync(path, lines.join("\n"));
}

mkdirSync("data/monitor", { recursive: true });
writeFileSync(HEALTH_PATH, JSON.stringify(health, null, 2) + "\n");
// State is only a candidate. The workflow owns acknowledgement, after all
// required digests and existing downstream hand-offs actually succeed.
if (state && !DRY_RUN)
  writeFileSync(PENDING_STATE_PATH, JSON.stringify(state, null, 2) + "\n");

if (process.env.GITHUB_OUTPUT) {
  const output = {
    health_written: RUN_ID,
    health_path: HEALTH_PATH,
    state_written: state && !DRY_RUN ? RUN_ID : "",
    state_path: state && !DRY_RUN ? PENDING_STATE_PATH : "",
    ...digestPaths,
    banks: DRY_RUN || !state ? "" : [...banksToScrape].join(" "),
  };
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(output)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(""),
  );
}
console.log(
  `Banks to re-scrape: ${DRY_RUN ? "(dry run — suppressed)" : [...banksToScrape].join(" ") || "(none)"}`,
);
console.log(
  `Actual credits reported by newly acknowledged candidate checks: ${creditsThisPoll}; reading them spent no credits.`,
);
console.log(
  `Monitor health: ${health.healthy ? "no detected faults in bounded history" : "unhealthy — review health digest"}`,
);
if (!health.healthy) process.exitCode = 1;
