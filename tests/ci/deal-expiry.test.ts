// Rules for scripts/ci/check-deal-expiry.mjs — fixed dates throughout,
// so the suite never goes red because time passed. The CLI's live-clock
// behaviour is exercised weekly by .github/workflows/deal-expiry.yml.
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error — plain .mjs module, typed via JSDoc only
import { checkDealExpiry, parseDealFrontmatter } from "../../scripts/ci/check-deal-expiry.mjs";
import { isDealLiveAt, dealCalendarDaysUntil } from "../../src/lib/dealWindow.mjs";

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

test("a date-only offer counts through the entire named Dubai day", () => {
  const offer = deal("boundary", "2026-11-29");
  const previousDubaiEvening = new Date("2026-11-28T19:59:59.999Z");
  const lastDubaiInstant = new Date("2026-11-29T19:59:59.999Z");
  const followingDubaiDay = new Date("2026-11-29T20:00:00Z");
  assert.equal(dealCalendarDaysUntil(offer.expiresOn, previousDubaiEvening.getTime()), 1);
  assert.equal(dealCalendarDaysUntil(offer.expiresOn, lastDubaiInstant.getTime()), 0);
  assert.equal(isDealLiveAt(offer, lastDubaiInstant.getTime()), true);
  assert.equal(isDealLiveAt(offer, followingDubaiDay.getTime()), false);
  assert.equal(checkDealExpiry([offer], lastDubaiInstant).ok, true);
  assert.equal(checkDealExpiry([offer], followingDubaiDay).stale[0].daysOverdue, 1);
  assert.equal(isDealLiveAt({ ...offer, archived: true }, lastDubaiInstant.getTime()), false);
});

test("an exact pinned cutoff remains precise including at UTC midnight", () => {
  const offer = parseDealFrontmatter('---\nexpiresOn: 2026-11-29\nexpiresAt: "2026-11-29T04:00:00+04:00"\n---');
  assert.ok(offer);
  const cutoff = new Date("2026-11-29T00:00:00Z");
  const afterCutoff = new Date("2026-11-29T00:00:00.001Z");
  assert.equal(offer.expiresAt?.getTime(), cutoff.getTime());
  assert.equal(isDealLiveAt(offer, cutoff.getTime()), true);
  assert.equal(isDealLiveAt(offer, afterCutoff.getTime()), false);
  assert.equal(checkDealExpiry([{ id: "explicit", ...offer }], afterCutoff).stale[0].daysOverdue, 0);
});

test("legacy timed expiries and invalid times do not become end-of-day offers", () => {
  const legacy = parseDealFrontmatter('---\nexpiresOn: "2026-11-29T12:00:00+04:00"\n---');
  const invalid = parseDealFrontmatter('---\nexpiresOn: 2026-11-29\nexpiresAt: invalid\n---');
  assert.ok(legacy && invalid);
  assert.equal(isDealLiveAt(legacy, Date.parse("2026-11-29T08:00:00.000Z")), true);
  assert.equal(isDealLiveAt(legacy, Date.parse("2026-11-29T08:00:00.001Z")), false);
  assert.equal(isDealLiveAt(invalid, Date.parse("2026-11-29T00:00:00Z")), false);
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
