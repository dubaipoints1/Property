// Actual poller subprocess + strict fake API. No credentials, paid calls or scraper.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const REPO = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
);
const SOURCE = "https://www.adcb.com/card";
const GOOD = {
  id: "old-good",
  status: "completed",
  scheduledFor: "2026-11-01 12:00:00+00",
  actualCredits: 4,
  summary: { totalPages: 2, changed: 0, error: 0 },
};
const PARTIAL = {
  id: "new-partial",
  status: "partial",
  scheduledFor: "2026-11-06 12:00:00+00",
  actualCredits: 97,
  summary: { totalPages: 3, changed: 2, error: 1 },
};
const PAGES = [
  {
    url: SOURCE,
    status: "changed",
    judgment: { meaningful: true, reason: "bonus changed" },
    diff: { text: "-AED 300\n+AED 250" },
  },
  {
    url: "https://www.adcb.com/noise",
    status: "changed",
    judgment: { meaningful: false },
    diff: { text: "-reCAPTCHA" },
  },
];
type Options = {
  checks?: any[];
  pages?: any[];
  key?: string;
  config?: string;
  monitor?: string;
  dryRun?: boolean;
  seen?: string[];
  failList?: string;
  failDefinition?: boolean;
  failDetail?: string;
  failDetailId?: string;
};

async function poll(
  options: Options = {},
  inspect?: (result: any, rerun: () => Promise<any>) => Promise<void>,
) {
  const checks = options.checks ?? [PARTIAL, GOOD];
  const calls: string[] = [];
  const server = createServer((req, res) => {
    calls.push(`${req.method} ${req.url}`);
    res.setHeader("content-type", "application/json");
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("{}");
      return;
    }
    const url = new URL(req.url!, "http://fixture");
    const status = url.searchParams.get("status");
    if (url.pathname.includes("/checks/")) {
      const fails =
        !options.failDetailId || url.pathname.endsWith(options.failDetailId);
      if (fails && options.failDetail === "transport") {
        req.socket.destroy();
        return;
      }
      if (fails && options.failDetail === "http") {
        res.statusCode = 503;
        res.end("{}");
        return;
      }
      const pages = url.pathname.endsWith(GOOD.id)
        ? []
        : (options.pages ?? PAGES);
      res.end(
        JSON.stringify({
          data: {
            pages:
              options.failDetail === "malformed"
                ? {}
                : pages.slice(0, Number(url.searchParams.get("limit"))),
          },
        }),
      );
    } else if (url.pathname.endsWith("/checks")) {
      // Unsupported filters must fail, not answer with convenient fixtures.
      // skipped_no_credits is observed through unfiltered history only.
      if (status && !["completed", "partial", "failed"].includes(status)) {
        res.statusCode = 400;
        res.end("{}");
        return;
      }
      if (options.failList === (status ?? "unfiltered")) {
        res.statusCode = 503;
        res.end("{}");
        return;
      }
      // Preserve the real API quirk: unfiltered history can omit partials.
      res.end(
        JSON.stringify({
          data: checks
            .filter((check) =>
              status ? check.status === status : check.status !== "partial",
            )
            .slice(0, Number(url.searchParams.get("limit"))),
        }),
      );
    } else if (url.pathname === "/monitor-id" && !options.failDefinition) {
      res.end(
        JSON.stringify({
          data: { status: "active", targets: [{ urls: [SOURCE] }] },
        }),
      );
    } else {
      res.statusCode = 503;
      res.end("{}");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  const cwd = mkdtempSync(path.join(tmpdir(), "dp-poll-health-"));
  const monitor = options.monitor ?? "product-pages";
  const statePath = path.join(cwd, "data/monitor/state.json");
  const initial = JSON.stringify({
    seenChecks: {
      [monitor]: options.seen ?? [GOOD.id],
      ...(options.config === "corrupt-second" ? { "fee-docs": "invalid" } : {}),
    },
    baselined: { [monitor]: true },
    lastPolled: "2026-11-01T00:00:00.000Z",
    creditsReported: {},
  });
  try {
    for (const directory of [
      "data/monitor",
      "scripts/monitor",
      "scripts/scrape/banks",
    ])
      mkdirSync(path.join(cwd, directory), { recursive: true });
    if (options.config !== "missing")
      writeFileSync(
        path.join(cwd, "data/monitor/monitors.json"),
        options.config === "invalid"
          ? "invalid JSON"
          : JSON.stringify({
              monitors:
                options.config === "empty"
                  ? {}
                  : {
                      [monitor]:
                        options.config === "missing-id"
                          ? {}
                          : { id: "monitor-id" },
                      ...(options.config === "corrupt-second"
                        ? { "fee-docs": { id: "monitor-id" } }
                        : {}),
                    },
            }),
      );
    writeFileSync(statePath, initial);
    writeFileSync(
      path.join(cwd, "scripts/scrape/banks/adcb.urls.json"),
      JSON.stringify([{ slug: "adcb-card", urls: { product: SOURCE } }]),
    );
    for (const filename of [
      "offers.registry.json",
      "salary-transfer.registry.json",
    ])
      writeFileSync(
        path.join(cwd, "scripts/monitor", filename),
        JSON.stringify({ banks: [{ bank: "adcb", urls: [SOURCE] }] }),
      );
    const rerun = async () => {
      const outputPath = path.join(cwd, "outputs");
      writeFileSync(outputPath, "");
      let result: any;
      try {
        result = await run(
          process.execPath,
          [path.join(REPO, "scripts/monitor/poll.mjs")],
          {
            cwd,
            encoding: "utf8",
            timeout: 15000,
            env: {
              ...process.env,
              FIRECRAWL_API_KEY: options.key ?? "fake-local-key",
              MONITOR_API_BASE: `http://127.0.0.1:${port}`,
              MONITOR_DRY_RUN: String(options.dryRun ?? false),
              GITHUB_RUN_ID: "fixture-run",
              GITHUB_OUTPUT: outputPath,
            },
          },
        );
        result.code = 0;
      } catch (error) {
        result = error;
      }
      const pendingPath = path.join(cwd, "data/monitor/state.pending.json");
      return {
        ...result,
        calls,
        health: JSON.parse(
          readFileSync(path.join(cwd, "data/monitor/health.json"), "utf8"),
        ),
        pending: existsSync(pendingPath)
          ? JSON.parse(readFileSync(pendingPath, "utf8"))
          : null,
        output: Object.fromEntries(
          readFileSync(outputPath, "utf8")
            .trim()
            .split("\n")
            .map((line) => line.split("=")),
        ),
        canonical: readFileSync(statePath, "utf8"),
        digests: Object.fromEntries(
          readdirSync(path.join(cwd, ".council/monitoring")).map((name) => [
            name,
            readFileSync(path.join(cwd, ".council/monitoring", name), "utf8"),
          ]),
        ),
      };
    };
    const result = await rerun();
    assert.equal(
      result.canonical,
      initial,
      "the poller must not acknowledge canonical state",
    );
    assert.ok(
      calls.every((call) => call.startsWith("GET ")),
      "no paid/create/execute operation permitted",
    );
    if (inspect) await inspect(result, rerun);
    return result;
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    server.close();
  }
}
const digest = (result: any, prefix: string) =>
  (Object.entries(result.digests).find(([name]) =>
    name.startsWith(prefix),
  )?.[1] as string) ?? "";

test("partial useful findings survive, errors stay visible, and canonical acknowledgement is deferred", async () => {
  const result = await poll();
  assert.equal(result.code, 1);
  assert.match(digest(result, "card-change-"), /AED 250/);
  assert.match(digest(result, "card-change-"), /1 page\(s\) failed to scrape/);
  assert.doesNotMatch(digest(result, "card-change-"), /reCAPTCHA|\/noise/);
  assert.equal(result.output.banks, "adcb");
  assert.ok(result.pending.seenChecks["product-pages"].includes(PARTIAL.id));
  assert.equal(result.pending.lastPolled, "2026-11-01T00:00:00.000Z");
  assert.equal(
    result.health.monitors["product-pages"].latestSuccessfulCheck.id,
    GOOD.id,
  );
});

test("skipped credits, failures and unknown statuses cannot hide behind older successful collection", async () => {
  for (const status of ["skipped_no_credits", "failed", "paused_by_provider"]) {
    const unhealthy = {
      id: "latest-unhealthy",
      status,
      scheduledFor: "2026-11-07 12:00:00+00",
      actualCredits: 0,
      error: "provider did not collect",
    };
    const result = await poll({ checks: [unhealthy, GOOD] });
    assert.equal(result.code, 1);
    assert.match(digest(result, "monitor-health-"), new RegExp(status));
    assert.equal(
      result.health.monitors["product-pages"].latestObservedCheck.id,
      unhealthy.id,
    );
    assert.equal(
      result.health.monitors["product-pages"].latestSuccessfulCheck.id,
      GOOD.id,
    );
    assert.ok(
      !result.calls.some((call) => call.includes("status=skipped_no_credits")),
    );
    assert.equal(result.output.health_written, "fixture-run");
  }
});

test("already acknowledged partial or empty collection remains currently unhealthy", async () => {
  for (const latest of [
    PARTIAL,
    {
      ...PARTIAL,
      status: "completed",
      summary: { totalPages: 0, changed: 0, error: 0 },
    },
    { ...PARTIAL, status: "completed" },
  ]) {
    const result = await poll({
      checks: [latest, GOOD],
      seen: [GOOD.id, latest.id],
    });
    assert.equal(result.code, 1);
    assert.equal(result.health.healthy, false);
    assert.equal(result.health.monitors["product-pages"].newChecks, 0);
  }
});

for (const options of [
  { key: "" },
  { config: "missing" },
  { config: "empty" },
  { config: "invalid" },
]) {
  test(`invalid configuration fails visibly without a state candidate: ${JSON.stringify(options)}`, async () => {
    const result = await poll(options);
    assert.equal(result.code, 1);
    assert.equal(result.calls.length, 0);
    assert.ok(digest(result, "monitor-health-"));
    assert.equal(result.output.state_written, "");
    assert.equal(result.pending, null);
  });
}

test("missing monitor ID is a fault, not success", async () => {
  const result = await poll({ config: "missing-id" });
  assert.equal(result.code, 1);
  assert.match(digest(result, "monitor-health-"), /missing_id/);
  assert.equal(result.pending.lastPolled, "2026-11-01T00:00:00.000Z");
});

for (const failDetail of ["transport", "http", "malformed"]) {
  test(`detail ${failDetail} failure is unacknowledged and retried`, async () => {
    await poll({ failDetail }, async (result, rerun) => {
      assert.equal(result.code, 1);
      assert.ok(
        !result.pending.seenChecks["product-pages"].includes(PARTIAL.id),
      );
      assert.match(digest(result, "monitor-health-"), /detail_read_failed/);
      const again = await rerun();
      assert.ok(
        again.calls.filter((call: string) =>
          call.includes(`/checks/${PARTIAL.id}`),
        ).length >= 2,
      );
      assert.equal(again.canonical, result.canonical);
    });
  });
}

test("list/definition failures retain useful findings without acknowledgement or paid hand-off", async () => {
  for (const options of [
    { failList: "completed" },
    { failList: "unfiltered" },
    { failDefinition: true },
  ]) {
    const result = await poll(options);
    assert.equal(result.code, 1);
    assert.match(digest(result, "card-change-"), /AED 250/);
    assert.match(
      digest(result, "monitor-health-"),
      /check_list_failed|definition_read_failed/,
    );
    assert.ok(!result.pending.seenChecks["product-pages"].includes(PARTIAL.id));
    assert.equal(result.output.banks, "");
  }
});

test("truncated detail or failed page retains good evidence, but no acknowledgement or paid hand-off", async () => {
  for (const pages of [
    PAGES.slice(0, 1),
    [
      PAGES[0],
      { url: "https://www.adcb.com/failed", status: "error", error: "timeout" },
    ],
  ]) {
    const result = await poll({ pages });
    assert.equal(result.code, 1);
    assert.match(digest(result, "card-change-"), /AED 250/);
    assert.match(digest(result, "monitor-health-"), /truncated/);
    assert.ok(!result.pending.seenChecks["product-pages"].includes(PARTIAL.id));
    assert.equal(result.output.banks, "");
  }
});

test("failed checks with usable pages still emit findings", async () => {
  const result = await poll({
    checks: [{ ...PARTIAL, status: "failed" }, GOOD],
  });
  assert.equal(result.code, 1);
  assert.match(digest(result, "card-change-"), /AED 250/);
});

test("healthy no-new-check poll records a poll attempt, not newly collected success", async () => {
  const result = await poll({ checks: [GOOD] });
  assert.equal(result.code, 0);
  assert.equal(result.health.monitors["product-pages"].newChecks, 0);
  assert.equal(
    result.health.monitors["product-pages"].latestSuccessfulCheck.scheduledFor,
    GOOD.scheduledFor,
  );
  assert.match(result.stdout, /no new checks — no new collection claimed/);
  assert.equal(result.output.health_digest_path, "");
  assert.ok(result.pending.lastAttempted);
});

test("no checks or completed zero-page checks cannot certify collection", async () => {
  for (const checks of [
    [],
    [{ ...GOOD, summary: { totalPages: 0, changed: 0, error: 0 } }],
  ]) {
    const result = await poll({ checks });
    assert.equal(result.code, 1);
    assert.equal(
      result.health.monitors["product-pages"].latestSuccessfulCheck,
      null,
    );
    assert.match(digest(result, "monitor-health-"), /no_successful_collection/);
  }
});

test("100-check bound reads beyond ten but exposes saturation and suppresses acknowledgement/bank hand-off", async () => {
  const many = Array.from({ length: 101 }, (_, i) => ({
    ...GOOD,
    id: `check-${i}`,
  }));
  const result = await poll({ checks: many });
  assert.equal(result.code, 1);
  assert.match(digest(result, "monitor-health-"), /check_window_full/);
  assert.equal(result.health.inspectedWindowPerQuery, 100);
  assert.equal(result.health.monitors["product-pages"].newChecks, 100);
  assert.deepEqual(result.pending.seenChecks["product-pages"], [GOOD.id]);
  assert.equal(result.output.banks, "");
});

test("salary/news/offers get explicit digest outputs and never auto-scrape", async () => {
  for (const [monitor, prefix, output] of [
    ["salary-transfer", "salary-transfer-change-", "salary_digest_path"],
    ["press-rooms", "digest-", "news_digest_path"],
    ["offers", "card-change-", "card_digest_path"],
  ]) {
    const result = await poll({ monitor });
    assert.ok(digest(result, prefix));
    assert.ok(result.output[output].includes(prefix));
    assert.equal(result.output.banks, "");
  }
});

test("dry-run never proposes acknowledgement or paid invocation", async () => {
  const result = await poll({ dryRun: true });
  assert.equal(result.health.dryRun, true);
  assert.equal(result.output.banks, "");
  assert.equal(result.output.state_written, "");
  assert.equal(result.output.state_path, "");
  assert.equal(result.pending, null);
});

test("fatal later configuration keeps earlier evidence but suppresses every bank hand-off", async () => {
  const result = await poll({ config: "corrupt-second" });
  assert.equal(result.code, 1);
  assert.match(digest(result, "card-change-"), /AED 250/);
  assert.match(digest(result, "monitor-health-"), /Invalid seenChecks/);
  assert.equal(result.output.banks, "");
  assert.equal(result.output.state_written, "");
  assert.equal(result.pending, null);
});

test("earlier acknowledged change retains bank hand-off when a later detail fails", async () => {
  const newer = {
    ...PARTIAL,
    id: "newer-complete",
    status: "completed",
    scheduledFor: "2026-11-07 12:00:00+00",
    summary: { totalPages: 2, changed: 2, error: 0 },
  };
  const result = await poll({
    checks: [newer, PARTIAL, GOOD],
    failDetail: "http",
    failDetailId: PARTIAL.id,
  });
  assert.equal(result.code, 1);
  assert.ok(result.pending.seenChecks["product-pages"].includes(newer.id));
  assert.ok(!result.pending.seenChecks["product-pages"].includes(PARTIAL.id));
  assert.equal(result.output.banks, "adcb");
});
