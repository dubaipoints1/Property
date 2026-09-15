// End-to-end test for scripts/monitor/poll.mjs against a stand-in API.
//
// Run: node --import tsx --test tests/monitor/poll.test.ts
//
// tests/monitor/coverage.test.ts pins the rules. This pins the wiring that
// consumes them, because the wiring is the half that failed: the rule
// "read the check" was never wrong, the query string that fetched the
// checks was. A test of the helpers alone would have passed on 6 September
// 2026 while the ADCB welcome-bonus cut went unseen.
//
// The fixture is the real 6 September 2026 product-pages check, reduced to
// the fields the poller reads: status `partial`, 42 changed pages, 1
// errored, and the ADCB Essential Cashback page judged meaningful with the
// AED 300 → AED 250 diff the poller never got to see.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);

const REPO = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const MONITOR_ID = "019fd16a-85e3-77fc-aed3-759fc1b3714a";
const ADCB_URL = "https://www.adcb.com/en/personal/cards/credit-cards/essential-cashback-credit-card.aspx";

const PARTIAL_CHECK = {
  id: "01a0740f-a656-70ee-8331-68a65f14cd70",
  status: "partial",
  actualCredits: 97,
  summary: { totalPages: 55, same: 12, changed: 2, new: 0, removed: 0, error: 1 },
};

const CHANGED_PAGES = [
  {
    url: ADCB_URL,
    status: "changed",
    judgment: {
      meaningful: true,
      confidence: "high",
      reason: "The welcome bonus for the ADCB Essential Cashback Credit Card decreased from AED 300 to AED 250.",
    },
    diff: { text: "-- Enjoy a welcome bonus of up to _AED_ 300\n++ Enjoy a welcome bonus of up to _AED_ 250" },
  },
  {
    url: "https://www.adcb.com/en/personal/cards/credit-cards/traveller-credit-card.aspx",
    status: "changed",
    judgment: { meaningful: false, confidence: "high", reason: "reCAPTCHA widget only." },
    diff: { text: "-reCAPTCHA" },
  },
];

async function runPoller() {
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url?.includes("/checks/")) {
      // Honour the limit the poller asked for, so a too-small one truncates
      // here exactly as the real API would.
      const limit = Number(new URL(req.url, "http://x").searchParams.get("limit") ?? 0);
      res.end(JSON.stringify({ data: { pages: CHANGED_PAGES.slice(0, limit) } }));
    } else if (req.url?.includes("/checks")) {
      res.end(JSON.stringify({ data: [PARTIAL_CHECK] }));
    } else {
      res.statusCode = 404;
      res.end("{}");
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as { port: number };

  const cwd = mkdtempSync(path.join(tmpdir(), "poll-"));
  try {
    mkdirSync(path.join(cwd, "data/monitor"), { recursive: true });
    mkdirSync(path.join(cwd, "scripts/monitor"), { recursive: true });
    mkdirSync(path.join(cwd, "scripts/scrape/banks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "data/monitor/monitors.json"),
      JSON.stringify({ monitors: { "product-pages": { id: MONITOR_ID } } }),
    );
    // Already baselined, so this check is treated as a real change set.
    writeFileSync(
      path.join(cwd, "data/monitor/state.json"),
      JSON.stringify({ seenChecks: {}, baselined: { "product-pages": true }, creditsReported: {} }),
    );
    writeFileSync(
      path.join(cwd, "scripts/scrape/banks/adcb.urls.json"),
      JSON.stringify([{ slug: "adcb-essential-cashback", urls: { product: ADCB_URL } }]),
    );
    for (const f of ["offers.registry.json", "salary-transfer.registry.json"]) {
      writeFileSync(path.join(cwd, "scripts/monitor", f), JSON.stringify({ banks: [] }));
    }

    // execFile, not execFileSync: the stand-in API is served by this same
    // event loop, so a synchronous child would deadlock waiting on a
    // server that cannot answer until the child exits.
    const { stdout } = await run(process.execPath, [path.join(REPO, "scripts/monitor/poll.mjs")], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        FIRECRAWL_API_KEY: "test-key-not-a-real-credential",
        MONITOR_API_BASE: `http://127.0.0.1:${port}`,
        GITHUB_OUTPUT: "",
      },
    });

    const digestDir = path.join(cwd, ".council/monitoring");
    const digests = readdirSync(digestDir).filter((f) => f.startsWith("card-change-"));
    return {
      stdout,
      digest: digests.length ? readFileSync(path.join(digestDir, digests[0]), "utf8") : "",
    };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    server.close();
  }
}

test("the poller reads a partial check and surfaces the ADCB cut", async () => {
  const { stdout, digest } = await runPoller();

  // The whole bug in one assertion: before the fix this digest did not exist.
  assert.ok(digest, "a partial check must still produce a digest");
  assert.match(digest, /essential-cashback-credit-card/);
  assert.match(digest, /AED 300 to AED 250/);
  assert.match(digest, /\*\*adcb\*\*/, "the finding is mapped to its bank");

  // And the bank is queued for a deterministic re-scrape, which is what
  // turns the signal into a corrected figure (Charter §6).
  assert.match(stdout, /Banks to re-scrape: adcb/);
});

test("the poller still refuses to let the judge's 'noise' ruling into a digest as a finding", async () => {
  const { digest, stdout } = await runPoller();
  assert.doesNotMatch(digest, /traveller-credit-card/);
  assert.match(stdout, /judged noise, skipped/);
});

test("the errored page in the partial check is reported as a coverage gap", async () => {
  const { digest } = await runPoller();
  assert.match(digest, /Coverage gaps/);
  assert.match(digest, /1 page\(s\) failed to scrape/);
  assert.match(digest, /01a0740f-a656-70ee-8331-68a65f14cd70/);
});
