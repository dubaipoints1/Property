import { test } from "node:test";
import assert from "node:assert/strict";
import { selectProgrammeHub } from "../../src/lib/programmeHub.ts";

const date = (value: string) => new Date(value);
const now = date("2026-11-10T12:00:00Z");
const story = (id: string, programme = "skywards", publishedAt = "2026-11-09", staleAfter?: string) => ({ id, data: {
  relatedPrograms: [{ id: programme }], publishedAt: date(publishedAt), ...(staleAfter ? { staleAfter: date(staleAfter) } : {}),
} });
const guide = (id: string, programme = "skywards", updatedAt = "2026-11-08") => ({ id, data: {
  relatedPrograms: [{ id: programme }], publishedAt: date("2026-10-01"), updatedAt: date(updatedAt),
} });
const deal = (id: string, programme = "skywards", expiresOn = "2026-11-12", archived = false) => ({ id, data: {
  program: { id: programme }, publishedAt: date("2026-11-01"), expiresOn: date(expiresOn), archived,
} });

test("programme hub uses explicit references, not names or card/bank adjacency", () => {
  const input = { news: [story("yes"), story("skywards-looking-title", "etihad-guest")], guides: [guide("yes"), guide("no", "accor-all")], deals: [deal("yes"), deal("no", "accor-all"), { ...deal("bank"), data: { ...deal("bank").data, program: undefined } }] };
  const result = selectProgrammeHub("skywards", input, now);
  for (const entries of Object.values(result)) assert.deepEqual(entries.map(entry => entry.id), ["yes"]);
});

test("news keeps original publication ordering and excludes future/expired reports", () => {
  const input = [story("new", "skywards", "2026-11-09"), story("old", "skywards", "2026-11-01"), story("future", "skywards", "2026-11-11"), story("ended", "skywards", "2026-11-09", "2026-11-09"), story("ends-today", "skywards", "2026-11-08", "2026-11-10")];
  const before = JSON.stringify(input);
  const result = selectProgrammeHub("skywards", { news: input, guides: [], deals: [] }, now);
  assert.deepEqual(result.news.map(item => item.id), ["new", "ends-today", "old"]);
  assert.equal(JSON.stringify(input), before, "the join must not redate or mutate source entries");
  assert.equal(selectProgrammeHub("skywards", { news: [input[4]], guides: [], deals: [] }, date("2026-11-11T00:00:00Z")).news.length, 0);
  const timestampExpiry = story("timestamp-expiry", "skywards", "2026-11-09", "2026-11-10T12:00:00Z");
  assert.equal(selectProgrammeHub("skywards", { news: [timestampExpiry], guides: [], deals: [] }, date("2026-11-10T23:59:59Z")).news.length, 1);
  assert.equal(selectProgrammeHub("skywards", { news: [timestampExpiry], guides: [], deals: [] }, date("2026-11-11T00:00:00Z")).news.length, 0);
});

test("live offer selection rejects archive/future/expired and uses earliest expiry", () => {
  const future = deal("future"); future.data.publishedAt = date("2026-11-11");
  const result = selectProgrammeHub("skywards", { news: [], guides: [], deals: [deal("later", "skywards", "2026-12-01"), deal("soon"), deal("old", "skywards", "2026-11-09"), deal("archived", "skywards", "2026-12-01", true), future] }, now);
  assert.deepEqual(result.deals.map(item => item.id), ["soon", "later"]);
});

test("guides use their own update dates without being relabelled as news", () => {
  const result = selectProgrammeHub("skywards", { news: [], guides: [guide("old", "skywards", "2026-10-01"), guide("new"), guide("future", "skywards", "2026-11-11")], deals: [] }, now);
  assert.deepEqual(result.guides.map(item => item.id), ["new", "old"]);
  assert.deepEqual(result.news, []);
});

test("ties, deduplication, limits and truly empty programme states are deterministic", () => {
  const result = selectProgrammeHub("skywards", { news: [story("d"), story("b"), story("a"), story("a"), story("c")], guides: [], deals: [] }, now);
  assert.deepEqual(result.news.map(item => item.id), ["a", "b", "c"]);
  assert.deepEqual(selectProgrammeHub("world-of-hyatt", { news: [story("a")], guides: [], deals: [] }, now), { news: [], guides: [], deals: [] });
});

test("invalid dates fail closed rather than bypassing source and expiry checks", () => {
  const invalidStory = story("bad"); invalidStory.data.publishedAt = date("invalid");
  const invalidGuide = guide("bad"); invalidGuide.data.updatedAt = date("invalid");
  const invalidDeal = deal("bad"); invalidDeal.data.expiresOn = date("invalid");
  const result = selectProgrammeHub("skywards", { news: [invalidStory, story("bad-expiry", "skywards", "2026-11-09", "invalid")], guides: [invalidGuide], deals: [invalidDeal] }, now);
  assert.deepEqual(result, { news: [], guides: [], deals: [] });
  assert.throws(() => selectProgrammeHub("skywards", { news: [], guides: [], deals: [] }, date("invalid")), /valid programme hub build date/);
});
