import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIntakeQueue } from "../../scripts/newsroom/wire-queue.mjs";

const started = (hour: number) => `2026-11-14T${String(hour).padStart(2, "0")}:01:00.000Z`;
const finished = (hour: number) => started(hour).replace(":01:", ":03:");
const receipt = (hour: number, leads: Record<string, any>[] = []) => ({
  startedAt: started(hour), finishedAt: finished(hour), publicationReady: false, leads,
});
const lead = (url: string, hour: number, opts: Record<string, any> = {}) => ({
  url, title: opts.title ?? "Dubai loyalty change", verified: opts.verified ?? false, existing: opts.existing ?? [],
  sightings: [{
    sourceId: opts.sourceId ?? "flydubai", sourceRole: "official", beat: "airlines",
    observedAt: opts.observedAt ?? started(hour).replace(":01:", ":02:"),
    kind: opts.kind ?? "new-to-observed-window", reportedAt: opts.reportedAt ?? null,
    evaluation: { disposition: opts.disposition ?? "needs-source-review" },
    ...(opts.sourceMethod ? { sourceMethod: opts.sourceMethod } : {}),
  }],
});
const commission = (id: string, url: string, stage = "held", reason = "Verify programme terms separately.") => ({
  id, topic: "Dubai scheme", owner: "managing-editor", desk: "airline", format: "quick-hit",
  nextAction: "Check current original terms.", stage, brief: null, draft: null, discoveredAt: "2026-11-13",
  disposition: { status: stage === "held" || stage === "passed-over" ? stage : "commissioned", reason },
  sources: [{ url, role: "primary", readStatus: "unread", claimsStatus: "unverified", evidencePath: null }],
  holds: stage === "held" ? ["Evidence still missing."] : [], coi: { status: "pending", record: null },
});
const queue = (...items: ReturnType<typeof commission>[]) => ({ schemaVersion: 1, items });

test("one private view retains the commission queue and joins RSS and page observations by URL", () => {
  const url = "https://www.emirates.com/updates/";
  const first = lead(url + "?utm_medium=rss", 4);
  const second = lead(url, 7, { title: "Terms changed on the publisher's page", sourceId: "skywards-rules-ae",
    sourceMethod: "manual", kind: "material-signal-changed" });
  const input = { editorialQueue: queue(commission("not-same", "https://www.emirates.com/other/")),
    receipts: [receipt(7, [second]), receipt(4, [first, structuredClone(first)])] };
  const before = structuredClone(input);
  const view = buildIntakeQueue(input);
  assert.deepEqual(input, before);
  assert.deepEqual(view.commissions, input.editorialQueue.items);
  assert.notStrictEqual(view.commissions[0], input.editorialQueue.items[0]);
  assert.deepEqual(view.window, { oldestReceiptAt: started(4), latestReceiptAt: started(7) });
  assert.deepEqual(view.counts, { receipts: 2, commissions: 1, leadRows: 3,
    uniqueUnverified: 1, intake: 1, reconcile: 0, suppressed: 0 });
  assert.equal(view.intake[0].url, url);
  assert.equal(view.intake[0].title, second.title);
  assert.equal(view.intake[0].verified, false);
  assert.equal(view.intake[0].firstObservedAt, "2026-11-14T04:02:00.000Z");
  assert.equal(view.intake[0].lastObservedAt, "2026-11-14T07:02:00.000Z");
  assert.deepEqual(view.intake[0].sightings.map(row => row.sourceId), ["flydubai", "skywards-rules-ae"]);
  assert.equal(view.intake[0].sightings[1].sourceMethod, "manual");
  assert.deepEqual(view.reconcile, []);
  assert.equal(view.publicationReady, false);
  assert.equal(view.publicationAuthority, false);
});

test("known URL meets current holds, passed-over status and historical references without reopening", () => {
  const hold = "https://www.etihad.com/terms/";
  const old = "https://example.org/loyalty-offer/";
  const before = queue(commission("hold-card", hold), commission("existing-story", "https://example.org/source", "published"));
  const rows = [lead(hold, 5, { existing: [{ id: "hold-card", stage: "triage" }] }),
    lead(old, 5, { existing: [{ id: null, stage: "seen-by-existing-rss" }, { id: "old-record", stage: "passed-over" }] }),
    lead("https://example.org/source", 5)];
  const view = buildIntakeQueue({ editorialQueue: before, receipts: [receipt(5, rows)] });
  assert.equal(view.counts.reconcile, 3);
  assert.equal(view.counts.intake, 0);
  assert.deepEqual(view.reconcile.find(row => row.url === hold)?.references, [{ id: "hold-card", stage: "held" }]);
  assert.deepEqual(view.reconcile.find(row => row.url === old)?.references, rows[1].existing);
  assert.equal(view.commissions[1].stage, "published");
  assert.ok(view.reconcile.every(row => row.verified === false && row.next.includes("do not reopen")));
});

test("safety and owner-withdrawn records stay out of intake even when later wording looks benign", () => {
  const withdrawn = "https://www.etihad.com/future-service/";
  const text = "https://www.etihad.com/reported";
  const linked = "https://example.org/another-page";
  const arabic = "https://example.org/%D8%AF%D9%85%D8%B4%D9%82/";
  const prior = commission("withdrawn-story", withdrawn, "passed-over",
    "Owner withdrew this topic on 9 November.");
  const view = buildIntakeQueue({ editorialQueue: queue(prior), receipts: [
    receipt(4, [lead(withdrawn, 4), lead(text, 4, { title: "Dubai accident update" }),
      lead(linked, 4, { existing: [{ id: prior.id, stage: "research" }] }),
      lead(arabic, 4)]),
    receipt(5, [lead(text, 5), lead("https://example.org/%FF/milestone", 5)]),
  ] });
  assert.equal(view.counts.suppressed, 4);
  assert.deepEqual(view.intake.map(row => row.url), ["https://example.org/%FF/milestone"]);
  assert.deepEqual(view.reconcile, []);
  assert.deepEqual(view.commissions, [prior]);
});

test("similar headlines at distinct URLs are not assumed to be the same story", () => {
  const view = buildIntakeQueue({ editorialQueue: queue(), receipts: [receipt(8, [
    lead("https://publisher.org/release-one/", 8, { disposition: "scope-review" }),
    lead("https://publisher.org/release-two/", 8),
  ])] });
  assert.equal(view.counts.uniqueUnverified, 2);
  assert.equal(view.intake[0].disposition, "scope-review");
});

test("verified prior releases exclude repeats without rewriting recorded approval or queue history", () => {
  const url = "https://example.org/current-story/";
  const original = commission("known-story", url, "draft");
  const marker = { id: original.id, canonical: "https://dubaipoints.ae/guides/known-story/",
    mergeCommit: "a".repeat(40), liveCheckedAt: finished(6) };
  const inputs = { editorialQueue: queue(original), receipts: [receipt(5, [lead(url, 5)])] };
  const output = buildIntakeQueue({ ...inputs, verifiedReleaseMarkers: [marker] });
  assert.equal(output.commissions[0].stage, "draft");
  assert.equal(output.reconcile[0].verifiedPriorReleases?.[0].canonical, marker.canonical);
  assert.match(output.reconcile[0].next, /Do not recommission/);
  assert.deepEqual(output.intake, []);
  assert.equal(output.publicationAuthority, false);
  assert.throws(() => buildIntakeQueue({ ...inputs, verifiedReleaseMarkers: [
    { ...marker, canonical: "https://another-site.example/guides/known-story/" },
  ] }), /Invalid release marker/);
});

test("malformed, future, duplicate and publication-ready receipt data fail closed", () => {
  const wrap = (...receipts: ReturnType<typeof receipt>[]) =>
    buildIntakeQueue({ editorialQueue: queue(), receipts });
  assert.throws(() => wrap(receipt(5, [lead("http://example.org/news", 5)])), /Invalid unverified/);
  assert.throws(() => wrap(receipt(5, [lead("https://example.org/news", 5, { verified: true })])), /Invalid unverified/);
  assert.throws(() => wrap(receipt(5, [lead("https://example.org/news", 6)])), /Invalid discovery sighting/);
  assert.throws(() => wrap(receipt(5), receipt(5)), /Duplicate discovery receipt/);
  assert.throws(() => wrap({ ...receipt(5), publicationReady: true }), /Invalid discovery receipt/);
});
