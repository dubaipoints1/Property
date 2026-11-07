import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { canonicalUrl, discover, feedShape, fetchFeed, LIMITS, markdownText, renderDigest } from "../../scripts/news-monitor/_pipeline.mjs";
import { relevanceFor, parseFeed, suggestedDesk, scanMetadata } from "../../scripts/news-monitor/_feeds.mjs";

const now = new Date("2026-11-07T13:07:00Z");
const primary = { id: "hotel", name: "Hotel newsroom", url: "https://news.hotel.com/feed", tier: "primary", filter: true };
const aggregator = { id: "blog", name: "Blog", url: "https://blog.travel.com/feed", tier: "aggregator", filter: true };
const item = (title = "Hilton Honors double points promotion", link = "https://news.hotel.com/promo", date = "Fri, 06 Nov 2026 13:00:00 +0000") => `<item><title><![CDATA[${title}]]></title><link>${link.replaceAll("&", "&amp;")}</link><pubDate>${date}</pubDate></item>`;
const rss = (items = item()) => `<rss version="2.0"><channel>${items}</channel></rss>`;
const getter = (body: string, status = 200) => async () => new Response(body, { status });

test("canonical dedup removes only explicit tracking keys and preserves identity parameters/fragments", () => {
  assert.equal(canonicalUrl("https://news.hotel.com/promo?id=2&ref=partner&lang=en&utm_source=rss&fbclid=x#terms"), "https://news.hotel.com/promo?id=2&ref=partner&lang=en#terms");
  assert.notEqual(canonicalUrl("https://news.hotel.com/promo?id=1"), canonicalUrl("https://news.hotel.com/promo?id=2"));
  for (const url of ["javascript:alert(1)", "data:text/html,x", "http://news.hotel.com/promo", "https://user:pass@news.hotel.com/x", "https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x", "https://internal.local/x", "https://news.hotel.com:444/x", "https://news.hotel.com/a\n#inject", "https://news.hotel.com/<img>", `https://news.hotel.com/${"x".repeat(4100)}`]) assert.equal(canonicalUrl(url), null, url);
});

test("programme actions close the title gap without accepting global openings or corporate awards", () => {
  for (const title of ["Hilton Honors double points promotion", "World of Hyatt bonus points registration", "World of Hyatt award category changes", "IHG One Rewards points sale", "Accor ALL status match", "Accor points conversion offer", "ALL – Accor transfer bonus"]) {
    const result = relevanceFor(primary, title);
    assert.equal(result.keep, true, title);
    assert.match(result.reason, /eligibility.*UNCONFIRMED/);
  }
  for (const title of ["Hilton Miami Beach opens", "Hyatt appoints new finance chief", "IHG announces quarterly results", "Accor transfers ownership of assets", "IHG doubles operating profit", "Accor wins global sustainability award", "World of Hyatt member opens a restaurant", "Ohio credit cards"]) assert.equal(relevanceFor(primary, title).keep, false, title);
  assert.equal(relevanceFor(primary, "New Dubai hotel opens").keep, true);
  assert.equal(suggestedDesk("Accor ALL transfers to Skywards"), "airline-news-editor");
  assert.equal(suggestedDesk("IHG One Rewards bonus"), "hotel-news-editor");
});

test("incident exclusion wins over relevance, including unfiltered UAE carrier feeds", () => {
  const result = relevanceFor({ filter: false }, "flydubai emergency diversion in Dubai");
  assert.equal(result.keep, false);
  assert.match(result.reason, /Passed over/);
  assert.equal(relevanceFor({ filter: false }, "New route launched for summer").keep, true);
});

test("RSS and Atom text decode entities; article alternate beats self and enclosure", () => {
  const [entry] = parseFeed(`<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Dubai &amp; Abu Dhabi &#8217;</title><link rel="self" href="https://news.hotel.com/api"/><link rel="enclosure" href="https://news.hotel.com/photo"/><link rel="alternate" href="https://news.hotel.com/story?a=1&amp;b=2"/><published>2026-11-06T12:00:00Z</published><updated>2026-11-07T12:00:00Z</updated></entry></feed>`);
  assert.equal(entry.title, "Dubai & Abu Dhabi ’");
  assert.equal(entry.link, "https://news.hotel.com/story?a=1&b=2");
  assert.equal(entry.date, "2026-11-06T12:00:00Z");
});

test("empty, HTML, truncated and unbalanced feed bodies cannot masquerade as healthy reads", () => {
  assert.equal(feedShape(rss()), "items");
  assert.equal(feedShape("<rss><channel></channel></rss>"), "empty");
  for (const body of ["<html><body>Blocked</body></html>", rss().slice(0, -6), "<rss><channel><item></channel></rss>", "<rss><channel><broken></channel></rss>", "<!DOCTYPE rss [<!ENTITY x SYSTEM 'file:///x'>]><rss></rss>", "<rss><channel><item><title>x & unknown</title></item></channel></rss>"]) assert.equal(feedShape(body), "invalid", body);
});

test("commented or CDATA item markup cannot become source-attributed leads", async () => {
  const body = rss(`<!-- ${item("Dubai COMMENT FORGERY", "https://news.hotel.com/fake")} -->` +
    `<description><![CDATA[${item("Dubai CDATA FORGERY", "https://news.hotel.com/cdata").replaceAll("<![CDATA[", "").replaceAll("]]>", "")}]]></description>` + item("Dubai real story", "https://news.hotel.com/real"));
  const result = await discover({ feeds: [primary], state: { seen: {} }, now, fetchImpl: getter(body) });
  assert.equal(result.health.results[0].parsed, 1);
  assert.deepEqual(result.triage.items.map((lead) => lead.link), ["https://news.hotel.com/real"]);
});

test("350 KB CDATA markup bait is scanned within a bounded child timeout", async () => {
  const module = new URL("../../scripts/news-monitor/_feeds.mjs", import.meta.url).href;
  const code = `import {parseFeed} from ${JSON.stringify(module)}; const xml = '<rss><channel><item><description><![CDATA[' + '<title>'.repeat(50000) + ']]></description></item></channel></rss>'; console.log(parseFeed(xml).length);`;
  const result = await promisify(execFile)(process.execPath, ["--input-type=module", "-e", code], { timeout: 3000 });
  assert.equal(result.stdout.trim(), "1");
});

test("one metadata scan bounds retained fields/depth/bytes and validates beyond the item window", () => {
  const scanned = scanMetadata(rss(Array.from({ length: 30 }, (_, index) => item(`Dubai ${index}`, `https://news.hotel.com/${index}`)).join("")), { maxItems: 2 });
  assert.equal(scanned.count, 30);
  assert.equal(scanned.items.length, 2);
  assert.equal(scanMetadata(rss(item("Dubai " + "x".repeat(9000)))).items[0].title, "");
  assert.equal(scanMetadata("<rss>" + "<x>".repeat(70) + "</x>".repeat(70) + "</rss>").status, "invalid");
  assert.equal(scanMetadata(rss(), { maxBytes: 8 }).status, "invalid");
  assert.equal(scanMetadata(rss(item()).replace("</channel>", "<broken></channel>"), { maxItems: 0 }).status, "invalid");
});

test("legacy raw-link state remains compatible; tracking variants do not resurface", async () => {
  const state = { seen: { hotel: ["https://news.hotel.com/promo?utm_source=old"] }, extra: "preserve" };
  const result = await discover({ feeds: [primary], state, now, fetchImpl: getter(rss(item(undefined, "https://news.hotel.com/promo?utm_source=new"))) });
  assert.equal(result.health.status, "ok");
  assert.equal(result.health.newLeads, 0);
  assert.equal(result.health.results[0].alreadySeen, 1);
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.state, state);
  assert.equal(result.state.extra, "preserve");
});

test("cross-feed duplicates retain source/tier/date provenance in one unread queue row", async () => {
  const result = await discover({ feeds: [primary, aggregator], state: { seen: {} }, now, fetchImpl: getter(rss()) });
  assert.equal(result.triage.items.length, 1);
  const lead = result.triage.items[0];
  assert.equal(lead.status, "discovered-unread");
  assert.equal(lead.verified, false);
  assert.deepEqual(lead.sources.map((source) => source.sourceId), ["hotel", "blog"]);
  assert.deepEqual(lead.sources.map((source) => source.tier), ["primary", "aggregator"]);
  assert.ok(lead.sources.every((source) => source.reportedDate && source.publishedAt));
  assert.deepEqual(Object.keys(result.state.seen), ["hotel", "blog"]);
});

test("bounded window, feed order and 300-key state retention remain unchanged", async () => {
  const state = { seen: { hotel: Array.from({ length: 300 }, (_, i) => `https://news.hotel.com/old-${i}`) } };
  const result = await discover({ feeds: [primary], state, now, fetchImpl: getter(rss(Array.from({ length: 30 }, (_, i) => item(`Dubai story ${i}`, `https://news.hotel.com/new-${i}`)).join(""))) });
  assert.equal(result.health.results[0].parsed, 30);
  assert.equal(result.health.results[0].inspected, 25);
  assert.equal(result.triage.items.length, 25);
  assert.equal(result.triage.items[0].title, "Dubai story 0");
  assert.equal(result.state.seen.hotel.length, 300);
  assert.equal(result.state.seen.hotel[0], "https://news.hotel.com/old-25");
});

test("partial failure is explicit, all failures/invalid/empty feeds fail after collection", async () => {
  const partial = await discover({ feeds: [primary, aggregator], state: { seen: {} }, now, fetchImpl: async (url: string) => new Response(url.includes("blog.travel") ? "unavailable" : rss(), { status: url.includes("blog.travel") ? 503 : 200 }) });
  assert.equal(partial.exitCode, 0);
  assert.equal(partial.health.status, "degraded");
  assert.equal(partial.health.usableFeeds, 1);
  assert.match(renderDigest(partial), /Coverage gaps — action required/);
  for (const body of ["<html>denied</html>", "<rss><channel></channel></rss>"]) {
    const failed = await discover({ feeds: [primary], state: { seen: {} }, now, fetchImpl: getter(body) });
    assert.equal(failed.exitCode, 1);
    assert.equal(failed.health.usableFeeds, 0);
  }
});

test("missing dates remain unknown, unsafe items are counted, excluded incidents are passed over", async () => {
  const result = await discover({ feeds: [primary], state: { seen: {} }, now, fetchImpl: getter(rss(item("Dubai promotion", "https://news.hotel.com/x", "not a date") + item("Dubai bad link", "javascript:alert(1)") + item("Dubai emergency diversion"))) });
  assert.equal(result.triage.items.length, 1);
  assert.equal(result.triage.items[0].publishedAt, null);
  assert.equal(result.health.status, "degraded");
  assert.equal(result.health.results[0].undated, 1);
  assert.equal(result.health.results[0].rejected, 1);
  assert.equal(result.health.results[0].passedOver, 1);
});

test("digest cannot execute feed HTML/Markdown, forge headings or ping a GitHub team", async () => {
  const result = await discover({ feeds: [primary], state: { seen: {} }, now, fetchImpl: getter(rss(item("Dubai **fake** [click](javascript:x) @org/team\n# forged <img src=x>", "https://news.hotel.com/promo_(one)?id=1"))) });
  const digest = renderDigest(result);
  assert.doesNotMatch(digest, /<img|@org\/team|\n# forged/);
  assert.match(digest, /promo_%28one%29\?id=1/);
  assert.match(digest, /NOT VERIFIED/);
  assert.equal(markdownText("@org **x**"), "@\u200borg \\*\\*x\\*\\*");
});

test("transport bounds streamed/announced bytes, timeout signal and redirects", async () => {
  const limits = { ...LIMITS, bytes: 8, redirects: 1 };
  await assert.rejects(fetchFeed(primary, getter("x".repeat(9)), limits), /byte limit/);
  await assert.rejects(fetchFeed(primary, async () => new Response("x", { headers: { "content-length": "100" } }), limits), /byte limit/);
  await assert.rejects(fetchFeed(primary, async () => new Response(null, { status: 302, headers: { location: "https://127.0.0.1/secret" } }), limits), /unexpected feed redirect/);
  await assert.rejects(fetchFeed(primary, async () => new Response(null, { status: 302, headers: { location: "/again" } }), limits), /redirect limit/);
  await assert.rejects(fetchFeed(primary, async () => new Response("part", { status: 206 })), /incomplete/);
  let options: any;
  await fetchFeed(primary, async (_url: string, init: any) => { options = init; return new Response("ok"); });
  assert.equal(options.redirect, "manual");
  assert.ok(options.signal instanceof AbortSignal);
});

test("corrupt legacy state is refused rather than silently reset", async () => {
  await assert.rejects(discover({ feeds: [primary], state: { seen: [] }, now, fetchImpl: getter(rss()) }), /refusing to reset/);
  await assert.rejects(discover({ feeds: [primary], state: { seen: { hotel: [42] } }, now, fetchImpl: getter(rss()) }), /refusing to reset/);
});

const exec = promisify(execFile);
const monitorPath = new URL("../../scripts/news-monitor/monitor.mjs", import.meta.url).pathname;

test("actual CLI exits nonzero but writes diagnostics, summary/output and state on all-feed failure", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "news-cli-"));
  try {
    mkdirSync(join(cwd, "data/news-monitor"), { recursive: true });
    const existing = JSON.stringify({ seen: { flydubai: ["https://news.flydubai.com/already-read"] } }, null, 2);
    writeFileSync(join(cwd, "data/news-monitor/state.json"), existing);
    writeFileSync(join(cwd, "preload.mjs"), "globalThis.fetch = async () => new Response('unavailable', {status:503});\n");
    const env = { ...process.env, NEWS_MONITOR_DRY_RUN: "false", GITHUB_RUN_ID: "test-run", GITHUB_OUTPUT: join(cwd, "outputs"), GITHUB_STEP_SUMMARY: join(cwd, "summary") };
    await assert.rejects(exec(process.execPath, ["--import", join(cwd, "preload.mjs"), monitorPath], { cwd, env }), (error: any) => error.code === 1);
    const health = JSON.parse(readFileSync(join(cwd, "data/news-monitor/latest-health.json"), "utf8"));
    assert.equal(health.status, "failed");
    assert.equal(health.usableFeeds, 0);
    assert.equal(readFileSync(join(cwd, "data/news-monitor/state.json"), "utf8"), existing);
    assert.match(readFileSync(join(cwd, "outputs"), "utf8"), /digest_path=\.council\/monitoring\/digest-/);
    assert.match(readFileSync(join(cwd, "outputs"), "utf8"), /health_written=test-run\nstate_written=test-run/);
    assert.equal(health.runId, "test-run");
    assert.match(readFileSync(join(cwd, "summary"), "utf8"), /Coverage: FAILED/);
    assert.equal(JSON.parse(readFileSync(join(cwd, "data/news-monitor/latest-triage.json"), "utf8")).items.length, 0);
    assert.equal(readdirSync(join(cwd, ".council/monitoring")).length, 1);
    // Same failure still exits red and retains snapshots, but no duplicate alert.
    writeFileSync(join(cwd, "outputs"), "");
    await assert.rejects(exec(process.execPath, ["--import", join(cwd, "preload.mjs"), monitorPath], { cwd, env }), (error: any) => error.code === 1);
    assert.doesNotMatch(readFileSync(join(cwd, "outputs"), "utf8"), /digest_path=/);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("manual preview reads dispatched code but writes no state/digest or alert outputs", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "news-preview-"));
  try {
    mkdirSync(join(cwd, "data/news-monitor"), { recursive: true });
    const existing = JSON.stringify({ seen: { flydubai: ["https://news.flydubai.com/old"] } });
    writeFileSync(join(cwd, "data/news-monitor/state.json"), existing);
    writeFileSync(join(cwd, "preload.mjs"), `globalThis.fetch = async () => new Response(${JSON.stringify(rss())});\n`);
    const env = { ...process.env, NEWS_MONITOR_DRY_RUN: "true", GITHUB_RUN_ID: "preview-run", GITHUB_OUTPUT: join(cwd, "outputs"), GITHUB_STEP_SUMMARY: join(cwd, "summary") };
    const result = await exec(process.execPath, ["--import", join(cwd, "preload.mjs"), monitorPath], { cwd, env });
    assert.match(result.stdout, /PREVIEW DRY RUN/);
    assert.equal(readFileSync(join(cwd, "data/news-monitor/state.json"), "utf8"), existing);
    assert.deepEqual(readdirSync(join(cwd)), ["data", "outputs", "preload.mjs", "summary"]);
    const health = JSON.parse(readFileSync(join(cwd, "data/news-monitor/latest-health.json"), "utf8"));
    assert.equal(health.runId, "preview-run");
    assert.equal(health.mode, "preview-dry-run");
    assert.match(health.stateBasis, /NOT current automation-state/);
    assert.match(readFileSync(join(cwd, "summary"), "utf8"), /preview-dry-run/);
    const outputs = readFileSync(join(cwd, "outputs"), "utf8");
    assert.match(outputs, /health_written=preview-run/);
    assert.doesNotMatch(outputs, /digest_path|state_written/);
    // A monitor/state failure must not advertise restored stale snapshots as fresh.
    writeFileSync(join(cwd, "data/news-monitor/state.json"), "not json");
    writeFileSync(join(cwd, "outputs"), "");
    await assert.rejects(exec(process.execPath, ["--import", join(cwd, "preload.mjs"), monitorPath], { cwd, env }));
    assert.equal(readFileSync(join(cwd, "outputs"), "utf8"), "");
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("workflow retains failure diagnostics and state without hiding the failed discovery step", () => {
  const workflow = readFileSync(new URL("../../.github/workflows/news-monitor.yml", import.meta.url), "utf8");
  assert.match(workflow, /cron: "7 5,13 \* \* \*"/);
  assert.match(workflow, /if: always\(\) && steps\.discovery\.outputs\.health_written == github\.run_id && steps\.discovery\.outputs\.digest_path != ''/);
  assert.match(workflow, /if: always\(\) && steps\.discovery\.outputs\.health_written == github\.run_id && steps\.discovery\.outputs\.state_written == github\.run_id/);
  assert.match(workflow, /if: always\(\) && steps\.discovery\.outputs\.health_written == github\.run_id\n\s+uses: actions\/upload-artifact/);
  assert.match(workflow, /dry_run:[\s\S]*?type: boolean\n\s+default: true/);
  assert.match(workflow, /ref: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.dry_run && github\.ref \|\| 'refs\/heads\/main' \}\}/);
  assert.match(workflow, /if: github\.event_name != 'workflow_dispatch' \|\| !inputs\.dry_run/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(workflow, /steps\.discovery\.outputs\.digest_path/);
  assert.doesNotMatch(workflow, /continue-on-error|FIRECRAWL_API_KEY|npm run (?:build|scrape)|\|\| echo/);
});

test("live acknowledgement cannot advance seen or health after failed digest delivery", () => {
  const workflow = readFileSync(new URL("../../.github/workflows/news-monitor.yml", import.meta.url), "utf8");
  const delivery = workflow.slice(workflow.indexOf("- name: Open digest issue"), workflow.indexOf("- name: Retain discovery diagnostics"));
  const save = workflow.slice(workflow.indexOf("- name: Save digest + state"));
  assert.match(delivery, /id: delivery/);
  assert.match(save, /\(steps\.discovery\.outputs\.digest_path == '' \|\| steps\.delivery\.outcome == 'success'\)/);
  assert.ok(workflow.indexOf("- name: Retain discovery diagnostics") < workflow.indexOf("- name: Save digest + state"));
});

test("only preview dispatches may check out feature refs; live dispatch and schedule remain main", () => {
  const workflow = readFileSync(new URL("../../.github/workflows/news-monitor.yml", import.meta.url), "utf8");
  assert.match(workflow, /ref: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.dry_run && github\.ref \|\| 'refs\/heads\/main' \}\}/);
});

test("fresh-checkout CLI runs retry undelivered leads/coverage, acknowledge delivery, and save healthy no-digest runs", async () => {
  const workflow = readFileSync(new URL("../../.github/workflows/news-monitor.yml", import.meta.url), "utf8");
  const save = workflow.slice(workflow.indexOf("- name: Save digest + state"));
  const condition = save.match(/\n\s+if: (.+)/)![1];
  // Evaluate the actual checked-in Actions boolean expression, not a copied
  // model. No GitHub token/API/issue/state branch is involved in this test.
  const shouldSave = new Function("steps", "github", "always", `return Boolean(${condition});`) as Function;
  for (const failedFeeds of [false, true]) {
    const root = mkdtempSync(join(tmpdir(), "news-ack-"));
    const canonical = new Map([["state.json", JSON.stringify({ seen: {} })]]);
    const original = canonical.get("state.json");
    try {
      const sweep = async (number: number, delivered: boolean) => {
        const cwd = join(root, `run-${number}`);
        mkdirSync(join(cwd, "data/news-monitor"), { recursive: true });
        for (const [name, bytes] of canonical) writeFileSync(join(cwd, "data/news-monitor", name), bytes);
        writeFileSync(join(cwd, "preload.mjs"), failedFeeds ? "globalThis.fetch = async () => new Response('unavailable', {status:503});\n" : `globalThis.fetch = async () => new Response(${JSON.stringify(rss())});\n`);
        const runId = `ack-${number}`;
        const env = { ...process.env, NEWS_MONITOR_DRY_RUN: "false", GITHUB_RUN_ID: runId, GITHUB_OUTPUT: join(cwd, "outputs"), GITHUB_STEP_SUMMARY: join(cwd, "summary") };
        let exitCode = 0;
        try { await exec(process.execPath, ["--import", join(cwd, "preload.mjs"), monitorPath], { cwd, env }); }
        catch (error: any) { exitCode = error.code; }
        assert.equal(exitCode, failedFeeds ? 1 : 0);
        // Actions resolves a missing step output to an empty string.
        const outputs = { digest_path: "", ...Object.fromEntries(readFileSync(join(cwd, "outputs"), "utf8").trim().split("\n").map((line) => line.split("="))) };
        const health = JSON.parse(readFileSync(join(cwd, "data/news-monitor/latest-health.json"), "utf8"));
        const saveAllowed = shouldSave({ discovery: { outputs }, delivery: { outcome: delivered ? "success" : "failure" } }, { run_id: runId }, () => true);
        // Actual fresh artifacts are available regardless of alert delivery.
        assert.equal(health.runId, runId);
        assert.ok(existsSync(join(cwd, "data/news-monitor/latest-triage.json")));
        if (saveAllowed) for (const name of ["state.json", "latest-health.json", "latest-triage.json"]) canonical.set(name, readFileSync(join(cwd, "data/news-monitor", name), "utf8"));
        return { saveAllowed, outputs, health };
      };
      const undelivered = await sweep(1, false);
      assert.ok(undelivered.outputs.digest_path);
      assert.equal(undelivered.saveAllowed, false);
      assert.equal(canonical.get("state.json"), original);
      assert.equal(canonical.has("latest-health.json"), false);
      const delivered = await sweep(2, true);
      assert.ok(delivered.outputs.digest_path, "fresh checkout must retry the undelivered human alert");
      assert.equal(delivered.health.newLeads, failedFeeds ? 0 : 1);
      assert.equal(delivered.saveAllowed, true);
      const unchanged = await sweep(3, false);
      assert.equal(unchanged.outputs.digest_path, "", "acknowledged unchanged coverage/leads need no duplicate alert");
      assert.equal(unchanged.health.newLeads, 0);
      assert.equal(unchanged.saveAllowed, true, "a no-digest run may save without an alert step");
      // A stale/missing fresh-output marker can never acknowledge anything.
      assert.equal(shouldSave({ discovery: { outputs: { ...unchanged.outputs, health_written: "stale" } }, delivery: { outcome: "success" } }, { run_id: "current" }, () => true), false);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});
