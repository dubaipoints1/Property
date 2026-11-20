import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWireReport, main, probeFeedBatch, probeRegisteredFeed } from "../../scripts/newsroom/wire.mjs";
import { BATCHES, SOURCES } from "../../scripts/newsroom/wire-sources.mjs";

const first = "2026-11-12T05:00:00.000Z";
const second = "2026-11-12T06:00:00.000Z";
const third = "2026-11-12T07:00:00.000Z";
const sky = "https://www.emirates.com/english/skywards/emirates-skywards-program-updates/";
const regular = { url: sky, title: "Skywards programme news", note: "Editorial fixture: existing terms" };
const update = { ...regular, note: "Editorial fixture: expiry terms moved; read the full terms" };
const row = (sourceId, observedAt, items) => ({ sourceId, surfaceUrl: SOURCES.find(source => source.id === sourceId)!.url,
  observedAt, status: "usable", items });
const baselineFor = (...sources) => ({ schemaVersion: 1, sources });
const observedChange = (changes = [update], options = {}) => buildWireReport({
  baseline: baselineFor(row("skywards-updates", first, [regular])),
  observations: [row("skywards-updates", second, changes)], ...options,
});

test("43 local RSS slots preserve the imported OPML and keep distinct replacement identities", () => {
  assert.deepEqual([...new Set(SOURCES.map(row => row.beat))].sort(), ["airlines", "cards", "hotels", "points", "travel"]);
  assert.equal(new Set(SOURCES.map(row => row.id)).size, SOURCES.length);
  assert.equal(new Set(SOURCES.map(row => row.url)).size, SOURCES.length);
  assert.deepEqual(BATCHES.map(batch => batch.sourceIds.length), [3, 5, 4, 5, 9, 2, 5, 3, 4, 3]);
  const imported = BATCHES.flatMap(batch => batch.sourceIds.map(id => SOURCES.find(row => row.id === id)!));
  assert.equal(new Set(imported.map(row => row.id)).size, 43);
  assert.equal(imported.filter(row => row.role === "official").length, 18);
  assert.equal(imported.filter(row => row.role === "discovery").length, 25);
  assert.ok(imported.every(row => row.method === "rss"));
  assert.ok(imported.every(row => !["air-service-one", "travel-daily-media"].includes(row.id)));
  assert.equal(imported.find(row => row.id === "oag-aviation-analysis")?.url, "https://www.oag.com/blog/rss.xml");
  assert.equal(imported.find(row => row.id === "hospitality-net-hotel-openings")?.url,
    "https://www.hospitalitynet.org/rss/announcements/openings.xml");
  assert.equal(SOURCES.filter(row => row.method === "rss").length, 44);
  assert.equal(SOURCES.filter(row => row.method === "manual").length, 21);
  assert.deepEqual(imported.filter(row => ["flydubai", "hilton-stories", "hyatt-newsroom"].includes(row.id)).map(row => row.url), [
    "https://news.flydubai.com/feed", "https://stories.hilton.com/feed", "https://newsroom.hyatt.com/news-releases?pagetemplate=rss",
  ]);
  assert.equal(buildWireReport().receipts.length, 0);
});

test("all 43 first observations establish baselines without backlog or publication", () => {
  const feeds = SOURCES.filter(source => source.batch);
  const result = buildWireReport({ observations: feeds.map(source => row(source.id, first, [{
    url: new URL("/news/private-fixture", source.url).href, title: "An existing Dubai announcement",
  }])) });
  assert.equal(result.receipts.filter(receipt => receipt.status === "baseline-only").length, 43);
  assert.equal(result.nextBaseline.sources.length, 43);
  assert.deepEqual(result.leads, []);
  assert.equal(result.publicationReady, false);
});

test("only proven longer feeds exceed 25 and report returned, inspected, and truncated separately", async () => {
  const counts = new Map([
    ["schiphol-airport", 50], ["al-khaleej-tourism-and-aviation", 50], ["hfp", 30],
    ["mainly-miles", 70], ["time-out-dubai", 150], ["finance-middle-east-banking-and-insurance", 200],
    ["ch-aviation", 50], ["aerotime", 100], ["simple-flying", 40],
  ]);
  const validate = async (value: string) => ({ url: new URL(value), addresses: [] });
  for (const [id, count] of counts) {
    const href = SOURCES.find(source => source.id === id)!.url;
    const items = Array.from({ length: count }, (_, index) =>
      `<item><title>Dubai item ${index}</title><link>${new URL(`/fixture-${index}`, href).href}</link></item>`);
    const result = await probeRegisteredFeed(id, { validate, request: async () => ({
      status: 200, headers: {}, body: Buffer.from(`<rss><channel>${items.join("")}</channel></rss>`),
    }) });
    const expected = id === "simple-flying" ? 25 : count;
    assert.equal(result.items.length, expected, id);
    const receipt = buildWireReport({ observations: [result] }).receipts[0];
    assert.equal(receipt.returned, count, id);
    assert.equal(receipt.inspected, expected, id);
    assert.equal(receipt.accepted, expected, id);
    assert.equal(receipt.truncated, expected < count, id);
  }
});

test("a widened view seeds unknown old tail only, retains changes, and emits a later new item", () => {
  const id = "time-out-dubai";
  const href = SOURCES.find(source => source.id === id)!.url;
  const fixture = (i: number) => ({ url: new URL(`/fixture-${i}`, href).href, title: `Dubai item ${i}` });
  const oldItems = Array.from({ length: 25 }, (_, index) => fixture(index + 50));
  const newTop = fixture(1000), newLater = fixture(1001), olderTail = fixture(0);
  const changedItem = { ...oldItems[2], title: "Dubai item: changed terms" };
  const widenedItems = [newTop, ...oldItems.slice(0, 2), changedItem, ...oldItems.slice(3), olderTail];
  const widenedRow = {
    ...row(id, second, widenedItems),
    window: { limit: 192, inspected: widenedItems.length, returned: widenedItems.length },
  };
  const firstWider = buildWireReport({ baseline: baselineFor(row(id, first, oldItems)), observations: [widenedRow] });
  assert.equal(firstWider.receipts[0].widened, true);
  assert.equal(firstWider.receipts[0].tailBaselined, 1);
  assert.deepEqual(firstWider.leads.map(lead => lead.url), [newTop.url, changedItem.url]);
  assert.equal(firstWider.leads[0].sightings[0].sourceMethod, "rss");
  const later = buildWireReport({
    baseline: firstWider.nextBaseline,
    observations: [{
      ...row(id, third, [newLater, ...widenedItems]),
      window: { limit: 192, inspected: widenedItems.length + 1, returned: widenedItems.length + 1 },
    }],
  });
  assert.deepEqual(later.leads.map(lead => lead.url), [newLater.url]);
  assert.equal(later.receipts[0].widened, undefined);
});

test("reported cap and counters cannot claim more than the registered RSS window", () => {
  const id = "simple-flying";
  const items = [{ url: "https://simpleflying.com/fixture/", title: "Dubai item" }];
  for (const window of [
    { limit: 26, inspected: 26, returned: 30 }, { limit: 25, inspected: 26, returned: 30 },
    { limit: 25, inspected: 25, returned: 24 }, { limit: 25, inspected: 0, returned: 0 },
  ]) assert.throws(() => buildWireReport({ observations: [{ ...row(id, first, items), window }] }), /Invalid RSS observation window/);
});

test("a temporarily short first response does not consume the pending wider-baseline boundary", () => {
  const id = "time-out-dubai";
  const href = SOURCES.find(source => source.id === id)!.url;
  const item = (i: number) => ({ url: new URL(`/fixture-${i}`, href).href, title: `Dubai item ${i}` });
  const legacyItems = Array.from({ length: 25 }, (_, index) => item(index + 30));
  const short = legacyItems.slice(0, 10);
  const firstWider = buildWireReport({
    baseline: baselineFor(row(id, first, legacyItems)),
    observations: [{ ...row(id, second, short), window: { limit: 192, inspected: 10, returned: 10 } }],
  });
  assert.equal(firstWider.nextBaseline.sources[0].completedWindowLimit, 25);
  assert.equal(firstWider.receipts[0].widened, undefined);
  const longer = [item(99), ...legacyItems, item(1), item(2)];
  const migrated = buildWireReport({
    baseline: firstWider.nextBaseline,
    observations: [{ ...row(id, third, longer), window: { limit: 192, inspected: 28, returned: 28 } }],
  });
  assert.equal(migrated.receipts[0].widened, true);
  assert.equal(migrated.receipts[0].tailBaselined, 2);
  assert.deepEqual(migrated.leads.map(lead => lead.url), [item(99).url]);
});

test("wider history remembers a formerly observed entry below the original 150-signature cap", () => {
  const id = "finance-middle-east-banking-and-insurance";
  const href = SOURCES.find(source => source.id === id)!.url;
  const fixture = (i: number) => ({ url: new URL(`/fixture-${i}`, href).href, title: `Dubai item ${i}` });
  const initial = Array.from({ length: 200 }, (_, index) => fixture(index));
  const window = { limit: 224, inspected: 200, returned: 200 };
  const base = buildWireReport({ observations: [{ ...row(id, first, initial), window }] });
  const changed = buildWireReport({ baseline: base.nextBaseline, observations: [row(id, second, [initial[0]])] });
  assert.equal(changed.nextBaseline.sources[0].history.length, 200);
  const returned = buildWireReport({ baseline: changed.nextBaseline, observations: [row(id, third, [initial[0], initial[1]])] });
  assert.equal(returned.leads.length, 0);
});

test("batches limit concurrent requests, reject duplicates and validate every ID before requesting", async () => {
  const batch = BATCHES.find(item => item.id === "points-miles")!.sourceIds;
  let active = 0, peak = 0, calls = 0;
  const probe = async (id: string) => {
    calls++;
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return id;
  };
  assert.deepEqual(await probeFeedBatch(batch, probe), batch);
  assert.equal(peak, 4);
  await assert.rejects(probeFeedBatch([...batch, "flydubai"], probe), /at most nine/);
  await assert.rejects(probeFeedBatch(["flydubai", "flydubai"], probe), /distinct/);
  await assert.rejects(probeFeedBatch(["flydubai", "skywards-updates"], probe), /registered RSS/);
  await assert.rejects(main(["--batch", "unknown"]), /registered batch/);
  await assert.rejects(main(["--batch", "uae-airlines", "--probe", "hilton-stories"]), /without individual probes/);
  assert.equal(calls, 9);
});

test("imported headlines retain discovery status; off-scope global and Arabic excluded leads stay out of drafting", () => {
  const arabic = "al-khaleej-tourism-and-aviation";
  const global = "united-airlines";
  const a = { url: "https://www.alkhaleej.ae/old", title: "السياحة في دبي" };
  const b = { url: "https://united.mediaroom.com/old", title: "US flight change" };
  const result = buildWireReport({ baseline: baselineFor(row(arabic, first, [a]), row(global, first, [b])),
    observations: [row(arabic, second, [a,
      { url: "https://www.alkhaleej.ae/new", title: "رحلات جديدة إلى دبي" },
      { url: "https://www.alkhaleej.ae/excluded", title: "حادث في دمشق" }]),
    row(global, second, [b, { url: "https://united.mediaroom.com/new", title: "New Thanksgiving onboard service" }])] });
  assert.equal(result.exclusions.count, 1);
  assert.equal(result.leads[0].sightings[0].sourceRole, "discovery");
  assert.match(result.leads[0].sightings[0].evaluation.next, /issuer or authority/);
  assert.equal(result.leads[1].sightings[0].evaluation.disposition, "scope-review");
  assert.ok(result.leads.every(lead => !lead.verified));
});

test("first usable read is a baseline, not newly reported stories", () => {
  const observation = row("skywards-updates", first, [regular]);
  const result = buildWireReport({ observations: [observation] });
  assert.equal(result.leads.length, 0);
  assert.equal(result.receipts[0].status, "baseline-only");
  assert.equal(result.nextBaseline.sources[0].observedAt, first);
  assert.equal(result.publicationReady, false);
});

test("material signals generate a source review card but not verified facts", () => {
  const result = observedChange([{ ...update, reportedAt: "2026-11-12" }]);
  assert.equal(result.leads[0].verified, false);
  const sighting = result.leads[0].sightings[0];
  assert.equal(sighting.kind, "material-signal-changed");
  assert.equal(sighting.reportedAt, "2026-11-12");
  assert.equal(sighting.observedAt, second);
  assert.equal(sighting.evaluation.priority, "check-now");
  assert.match(sighting.evaluation.question, /balances, expiry/);
  assert.doesNotMatch(JSON.stringify(sighting), /verifiedAt|latency/);
});

test("feed rearrangement and refresh timestamps do not create news", () => {
  const a = { url: "https://news.flydubai.com/a", title: "A regular UAE story" };
  const b = { url: "https://news.flydubai.com/b", title: "A second UAE story" };
  const result = buildWireReport({ baseline: baselineFor(row("flydubai", first, [a, b])),
    observations: [row("flydubai", second, [{ ...b, reportedAt: second }, a])] });
  assert.equal(result.receipts[0].status, "no-change-in-observed-window");
  assert.equal(result.leads.length, 0);
});

test("coverage failures retain the last usable snapshot for later comparison", () => {
  const before = baselineFor(row("skywards-updates", first, [regular]));
  const failed = buildWireReport({ baseline: before,
    observations: [{ ...row("skywards-updates", second, []), status: "gap", detail: "HTTP 403" }] });
  assert.equal(failed.receipts[0].status, "coverage-gap");
  assert.equal(failed.nextBaseline.sources[0].observedAt, first);
  const recovered = buildWireReport({ baseline: failed.nextBaseline, observations: [row("skywards-updates", third, [update])] });
  assert.equal(recovered.leads.length, 1);
  assert.equal(before.sources[0].items[0].note, regular.note);
});

test("a completely different RSS window is a coverage gap, not silent reset", () => {
  const a = { url: "https://news.flydubai.com/a", title: "Old window" };
  const b = { url: "https://news.flydubai.com/b", title: "New window" };
  const result = buildWireReport({ baseline: baselineFor(row("flydubai", first, [a])),
    observations: [row("flydubai", second, [b])] });
  assert.equal(result.receipts[0].status, "coverage-gap");
  assert.equal(result.nextBaseline.sources[0].items[0].url, a.url);
});

test("reviewed disjoint RSS recovery restarts once without leads or loss of dedupe history", () => {
  const id = "simple-flying";
  const a = { url: "https://simpleflying.com/old/", title: "Old item" };
  const b = { url: "https://simpleflying.com/restart/", title: "Restart item" };
  const c = { url: "https://simpleflying.com/restart-later/", title: "Later item" };
  const recovery = new Map([[id, first]]);
  const before = baselineFor(row(id, first, [a]));
  const fresh = row(id, second, [b]);
  const capped = { ...fresh, window: { limit: 1, returned: 2, inspected: 1 } };
  for (const observation of [fresh, capped]) {
    const held = buildWireReport({ baseline: before, observations: [observation], recovery });
    assert.equal(held.receipts[0].status, "coverage-gap");
    assert.equal(held.nextBaseline.sources[0].observedAt, first);
    assert.equal(held.leads.length, 0);
  }
  const restarted = buildWireReport({ baseline: before,
    observations: [{ ...fresh, window: { limit: 2, returned: 1, inspected: 1 } }], recovery });
  assert.equal(restarted.receipts[0].status, "rebaselined-after-gap");
  assert.equal(restarted.receipts[0].previousUsableAt, first);
  assert.equal(restarted.leads.length, 0);
  assert.equal(restarted.nextBaseline.sources[0].observedAt, second);
  const noSecondReset = buildWireReport({ baseline: restarted.nextBaseline,
    observations: [row(id, third, [c])], recovery });
  assert.equal(noSecondReset.receipts[0].status, "coverage-gap");
  const overlapping = buildWireReport({ baseline: restarted.nextBaseline,
    observations: [row(id, third, [a, b, c])], recovery });
  assert.deepEqual(overlapping.leads.map(lead => lead.url), [c.url]);
  const transport = buildWireReport({ baseline: before, observations: [
    { ...row(id, second, []), status: "gap", detail: "Transport failed" },
  ], recovery });
  assert.equal(transport.receipts[0].status, "coverage-gap");
  assert.equal(transport.nextBaseline.sources[0].observedAt, first);
});

test("known RSS leads remain a reconciliation item with tracking keys stripped", () => {
  const result = observedChange([{ ...update, url: `${sky}?utm_source=test` }],
    { seenState: { seen: { example: [sky] } } });
  assert.equal(result.leads[0].url, sky);
  assert.equal(result.leads[0].sightings[0].evaluation.disposition, "reconcile-existing");
});

test("hard exclusions are withheld; possible disruptions are sent only for scope review", () => {
  const result = observedChange([
    { ...regular, title: "Damascus: Syria update" },
    { url: `${sky}#scope`, title: "Suspension announced; cause not given" },
  ]);
  assert.equal(result.exclusions.count, 1);
  assert.equal(result.leads.length, 1);
  assert.equal(result.leads[0].sightings[0].evaluation.disposition, "scope-review");
});

test("duplicate, off-domain, stale, local-time and empty observations fail closed", () => {
  assert.throws(() => observedChange([regular, regular]), /Duplicate item URLs/);
  assert.throws(() => observedChange([{ ...regular, url: "https://foreign.com/" }]), /identity/);
  assert.throws(() => buildWireReport({ baseline: baselineFor(row("skywards-updates", second, [regular])),
    observations: [row("skywards-updates", first, [update])] }), /not newer/);
  assert.throws(() => buildWireReport({ observations: [row("skywards-updates", "2026-11-12T05:00:00", [regular])] }), /explicit UTC/);
  assert.throws(() => observedChange([]), /cannot establish a baseline/);
  assert.throws(() => observedChange([regular], { asOf: first }), /in the future/);
  assert.throws(() => buildWireReport({ observations: [{ ...row("skywards-updates", first, [regular]),
    surfaceUrl: "https://www.emirates.com/media-centre/" }] }), /exact configured source/);
});

test("disjoint manual capture cannot replace a known scope", () => {
  const result = observedChange([{ ...regular, url: "https://www.emirates.com/media-centre/other/" }],
    { recovery: new Map([["skywards-updates", first]]) });
  assert.equal(result.receipts[0].status, "coverage-gap");
  assert.equal(result.nextBaseline.sources[0].observedAt, first);
});

test("RSS failure diagnostics distinguish DNS, transport and UTF-8 without exposing remote details", async () => {
  const validate = async value => ({ url: new URL(value), addresses: [] });
  const failed = (code: string) => async () => {
    throw Object.assign(Error("remote-specific detail not suitable for logging"), { code });
  };
  const dns = await probeRegisteredFeed("oag-aviation-analysis", { validate: failed("ENOTFOUND") });
  const https = await probeRegisteredFeed("oag-aviation-analysis", { validate, request: failed("ECONNRESET") });
  const invalidBytes = await probeRegisteredFeed("oag-aviation-analysis", { validate, request:
    async () => ({ status: 200, headers: {}, body: Buffer.from([0xff]) }) });
  assert.match(dns.detail, /DNS.*ENOTFOUND/);
  assert.match(https.detail, /HTTPS.*ECONNRESET/);
  assert.match(invalidBytes.detail, /UTF-8/);
  assert.doesNotMatch(JSON.stringify([dns, https, invalidBytes]), /remote-specific/);
});

test("only the two affected RSS transports retry once from the registered URL with fresh bounds", async () => {
  for (const [id, behavior, expectedCalls, expected] of [
    ["cathay-pacific", "success-on-retry", 2, "usable"],
    ["united-airlines", "timeout-twice", 2, "gap"],
    ["frequent-miler", "timeout-twice", 1, "gap"],
    ["united-airlines", "policy", 0, "gap"],
    ["cathay-pacific", "403", 1, "gap"],
  ] as const) {
    const source = SOURCES.find(row => row.id === id)!;
    const attempts: AbortController[] = [], requests: string[] = [];
    const observed = await probeRegisteredFeed(id, {
      makeSignal: deadline => {
        assert.equal(deadline, 12_000);
        const ctl = new AbortController(); attempts.push(ctl); return ctl.signal;
      },
      validate: async (value, { signal }) => {
        assert.equal(value, source.url);
        assert.equal(signal, attempts.at(-1)!.signal);
        if (behavior === "policy") throw Error("refused address");
        return { url: new URL(value), addresses: [] };
      },
      request: async (value, { signal, maxBytes }) => {
        requests.push(value.href);
        assert.equal(signal, attempts.at(-1)!.signal);
        assert.equal(signal.aborted, false);
        assert.equal(maxBytes, 4 * 1024 * 1024);
        if (behavior === "403") return { status: 403, headers: {}, body: Buffer.alloc(0) };
        if (attempts.length === 1 || behavior === "timeout-twice") {
          attempts.at(-1)!.abort(); throw Error("private transport detail");
        }
        const link = new URL("/release", source.url).href;
        return { status: 200, headers: {}, body: Buffer.from(
          `<rss version="2.0"><channel><item><title>UAE release</title><link>${link}</link></item></channel></rss>`) };
      },
    });
    assert.equal(observed.status, expected, id);
    assert.deepEqual(requests, Array(expectedCalls).fill(source.url));
    assert.equal(attempts.length, Math.max(1, expectedCalls));
    assert.equal(observed.detail?.startsWith("Retried once after a transport timeout."), expectedCalls === 2);
    assert.doesNotMatch(observed.detail ?? "", /private transport detail/);
  }
});

test("an unchanged item returning to the window is not new again", () => {
  const a = { url: "https://news.flydubai.com/a", title: "Existing first item" };
  const b = { url: "https://news.flydubai.com/b", title: "Existing second item" };
  const before = baselineFor(row("flydubai", first, [a, b]));
  const moved = buildWireReport({ baseline: before, observations: [row("flydubai", second, [a])] });
  const returned = buildWireReport({ baseline: moved.nextBaseline, observations: [row("flydubai", third, [a, b])] });
  assert.equal(returned.leads.length, 0);
});

test("flydubai preview preserves the existing English-first intake rule", () => {
  const a = { url: "https://news.flydubai.com/english", title: "English release" };
  const b = { url: "https://news.flydubai.com/arabic", title: "رحلات جديدة" };
  const report = buildWireReport({ observations: [row("flydubai", first, [a, b])] });
  assert.deepEqual(report.nextBaseline.sources[0].items.map(item => item.url), [a.url]);
});

test("only listed RSS is fetched; a response cannot redirect off publisher or act as a usable HTML shell", async () => {
  const tried = [];
  const validate = async value => { tried.push(value); return { url: new URL(value), addresses: [] }; };
  const redirect = async () => ({ status: 302, body: Buffer.alloc(0), headers: { location: "https://other.com/feed" } });
  await assert.rejects(probeRegisteredFeed("skywards-updates", { validate, request: redirect }), /registered RSS/);
  const moved = await probeRegisteredFeed("flydubai", { validate, request: redirect });
  assert.match(moved.detail, /Unexpected feed redirect/);
  assert.deepEqual(tried, ["https://news.flydubai.com/feed"]);
  const shell = await probeRegisteredFeed("flydubai", { validate,
    request: async () => ({ status: 200, headers: {}, body: Buffer.from("<html><title>Sign in</title></html>") }) });
  assert.equal(shell.status, "gap");
  assert.equal(shell.items.length, 0);
});

test("publisher-specific article aliases work without widening feed redirects or other sources", async () => {
  const validate = async value => ({ url: new URL(value), addresses: [] });
  const feed = link => async () => ({ status: 200, headers: {}, body: Buffer.from(
    "<rss version='2.0'><channel><item><title>First item</title><link>" + link + "</link></item></channel></rss>") });
  for (const [id, url] of [["klm", "https://news.klm.com/example/"], ["schiphol-airport", "https://news.schiphol.com/example/"]]) {
    const result = await probeRegisteredFeed(id, { validate, request: feed(url) });
    assert.equal(result.status, "usable");
    assert.equal(result.items[0].url, url);
    const redirect = await probeRegisteredFeed(id, { validate,
      request: async () => ({ status: 302, headers: { location: url }, body: Buffer.alloc(0) }) });
    assert.equal(redirect.status, "gap");
    assert.match(redirect.detail, /Unexpected feed redirect/);
    const before = buildWireReport({ observations: [row(id, first, result.items)] });
    const again = buildWireReport({ baseline: before.nextBaseline, observations: [row(id, second, result.items)] });
    assert.equal(again.receipts[0].status, "no-change-in-observed-window");
  }
  assert.equal((await probeRegisteredFeed("flydubai", { validate,
    request: feed("https://news.klm.com/example/") })).status, "gap");
});

test("IHG upgrades only exact legacy press-article metadata; no HTTP request is made", async () => {
  const old = "http://www.ihgplc.com/en/news-and-media/news-releases/2026/example";
  const seen = [];
  const validate = async value => { seen.push(value); return { url: new URL(value), addresses: [] }; };
  const result = await probeRegisteredFeed("ihg-emeaa-newsroom", { validate,
    request: async () => ({ status: 200, headers: {}, body: Buffer.from(
      "<rss version='2.0'><channel><item><title>First item</title><link>" + old + "</link></item></channel></rss>") }) });
  assert.equal(result.status, "usable");
  assert.equal(result.items[0].url, old.replace("http:", "https:"));
  assert.equal(seen.length, 1);
  assert.match(seen[0], /^https:\/\/www\.ihgplc\.com\/en\/rss\//);
  for (const url of [old.replace("/2026/", "/2026/../../"), old + "%2Fother", old + "%5Cother",
    "http://www.ihgplc.com/en/not-a-press-release", old.replace("www.ihgplc.com", "wrong.org")]) {
    assert.throws(() => buildWireReport({ observations: [row("ihg-emeaa-newsroom", first, [{ url, title: "Test" }])] }), /identity/);
  }
});
