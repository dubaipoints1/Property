// Rules for scripts/ci/check-deal-expiry.mjs — fixed dates throughout,
// so the suite never goes red because time passed. The CLI's live-clock
// behaviour is exercised weekly by .github/workflows/deal-expiry.yml.
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error — plain .mjs module, typed via JSDoc only
import { checkDealExpiry, parseDealFrontmatter } from "../../scripts/ci/check-deal-expiry.mjs";

const TODAY = new Date("2026-08-06T00:00:00Z");

const deal = (id: string, expiresOn: string, archived = false) => ({
  id,
  expiresOn: new Date(`${expiresOn}T00:00:00Z`),
  archived,
});

test("live deal passes", () => {
  const r = checkDealExpiry([deal("live", "2026-08-15")], TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.stale.length, 0);
});

test("expired + archived passes — that is the correct end state", () => {
  const r = checkDealExpiry([deal("done", "2026-06-30", true)], TODAY);
  assert.equal(r.ok, true);
});

test("expired + unarchived fails with days overdue", () => {
  const r = checkDealExpiry([deal("stale", "2026-07-31")], TODAY);
  assert.equal(r.ok, false);
  assert.equal(r.stale[0].id, "stale");
  assert.equal(r.stale[0].daysOverdue, 6);
});

test("expiring today is still live — expiresOn is inclusive", () => {
  const r = checkDealExpiry([deal("today", "2026-08-06")], TODAY);
  assert.equal(r.ok, true);
});

test("stale deals sort most-overdue first", () => {
  const r = checkDealExpiry(
    [deal("recent", "2026-08-01"), deal("ancient", "2026-06-30")],
    TODAY,
  );
  assert.deepEqual(
    r.stale.map((d: { id: string }) => d.id),
    ["ancient", "recent"],
  );
});

test("empty collection passes", () => {
  assert.equal(checkDealExpiry([], TODAY).ok, true);
});

test("frontmatter parse reads expiresOn and archived", () => {
  const parsed = parseDealFrontmatter(
    "---\ntitle: \"X\"\nexpiresOn: 2026-06-30\narchived: true\ncategory: fare-sale\n---\nBody",
  );
  assert.ok(parsed);
  assert.equal(parsed.expiresOn.toISOString().slice(0, 10), "2026-06-30");
  assert.equal(parsed.archived, true);
});

test("frontmatter parse defaults archived to false and handles quoted dates", () => {
  const parsed = parseDealFrontmatter('---\nexpiresOn: "2026-08-15"\n---\n');
  assert.ok(parsed);
  assert.equal(parsed.archived, false);
  assert.equal(parsed.expiresOn.toISOString().slice(0, 10), "2026-08-15");
});

test("no frontmatter or no expiresOn returns null — schema's problem, not ours", () => {
  assert.equal(parseDealFrontmatter("no frontmatter"), null);
  assert.equal(parseDealFrontmatter("---\ntitle: x\n---\n"), null);
});

test("a note mentioning archived in prose does not count", () => {
  // The regex is line-anchored inside the frontmatter block only.
  const parsed = parseDealFrontmatter(
    "---\nexpiresOn: 2026-06-30\n---\nThis deal should be archived: true story.",
  );
  assert.ok(parsed);
  assert.equal(parsed.archived, false);
});
