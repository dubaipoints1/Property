// Rules for scripts/ci/check-news-expiry.mjs — fixed dates throughout,
// so the suite never goes red because time passed. The CLI's live-clock
// behaviour is exercised weekly by .github/workflows/news-expiry.yml.
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error — plain .mjs module, typed via JSDoc only
import { checkNewsExpiry, parseNewsFrontmatter } from "../../scripts/ci/check-news-expiry.mjs";

const TODAY = new Date("2026-08-22T00:00:00Z");

const story = (
  id: string,
  fields: { publishedAt: string; updatedAt?: string; staleAfter?: string; beat?: string },
) => ({
  id,
  publishedAt: new Date(`${fields.publishedAt}T00:00:00Z`),
  updatedAt: fields.updatedAt ? new Date(`${fields.updatedAt}T00:00:00Z`) : undefined,
  staleAfter: fields.staleAfter ? new Date(`${fields.staleAfter}T00:00:00Z`) : undefined,
  beat: fields.beat,
});

test("future staleAfter passes", () => {
  const r = checkNewsExpiry(
    [story("live", { publishedAt: "2026-07-27", staleAfter: "2026-09-30" })],
    TODAY,
  );
  assert.equal(r.ok, true);
  assert.equal(r.stale.length, 0);
  assert.equal(r.warnings.length, 0);
});

test("past staleAfter with no touch since fails with days overdue", () => {
  const r = checkNewsExpiry(
    [story("stale", { publishedAt: "2026-05-22", staleAfter: "2026-07-31", beat: "airline" })],
    TODAY,
  );
  assert.equal(r.ok, false);
  assert.equal(r.stale[0].id, "stale");
  assert.equal(r.stale[0].daysOverdue, 22);
  assert.equal(r.stale[0].beat, "airline");
});

test("past staleAfter but updated on or after it passes — the flag did its job", () => {
  const r = checkNewsExpiry(
    [
      story("rechecked", { publishedAt: "2026-05-22", updatedAt: "2026-08-01", staleAfter: "2026-07-31" }),
      story("same-day", { publishedAt: "2026-05-22", updatedAt: "2026-07-31", staleAfter: "2026-07-31" }),
    ],
    TODAY,
  );
  assert.equal(r.ok, true);
});

test("update before staleAfter does not clear the flag", () => {
  const r = checkNewsExpiry(
    [story("early-touch", { publishedAt: "2026-05-22", updatedAt: "2026-07-27", staleAfter: "2026-07-31" })],
    TODAY,
  );
  assert.equal(r.ok, false);
});

test("staleAfter today is still fresh — staleAfter is inclusive", () => {
  const r = checkNewsExpiry(
    [story("today", { publishedAt: "2026-06-01", staleAfter: "2026-08-22" })],
    TODAY,
  );
  assert.equal(r.ok, true);
});

test("no staleAfter passes, but >60 days untouched warns without failing", () => {
  const r = checkNewsExpiry(
    [story("old", { publishedAt: "2026-05-01", beat: "banking" })],
    TODAY,
  );
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].id, "old");
  assert.equal(r.warnings[0].daysSinceTouch, 113);
});

test("recent updatedAt suppresses the 60-day warning even on an old story", () => {
  const r = checkNewsExpiry(
    [story("maintained", { publishedAt: "2026-03-01", updatedAt: "2026-08-01" })],
    TODAY,
  );
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 0);
});

test("fresh story with no staleAfter neither fails nor warns", () => {
  const r = checkNewsExpiry([story("fresh", { publishedAt: "2026-08-10" })], TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 0);
});

test("a staleAfter entry never double-reports into the warning path", () => {
  // Old and stale: it belongs in stale, not in both lists.
  const r = checkNewsExpiry(
    [story("both", { publishedAt: "2026-04-01", staleAfter: "2026-06-30" })],
    TODAY,
  );
  assert.equal(r.stale.length, 1);
  assert.equal(r.warnings.length, 0);
});

test("stale stories sort most-overdue first", () => {
  const r = checkNewsExpiry(
    [
      story("recent", { publishedAt: "2026-06-01", staleAfter: "2026-08-15" }),
      story("ancient", { publishedAt: "2026-04-01", staleAfter: "2026-06-30" }),
    ],
    TODAY,
  );
  assert.deepEqual(
    r.stale.map((s: { id: string }) => s.id),
    ["ancient", "recent"],
  );
});

test("empty collection passes", () => {
  assert.equal(checkNewsExpiry([], TODAY).ok, true);
});

test("frontmatter parse reads all three dates and beat", () => {
  const parsed = parseNewsFrontmatter(
    '---\ntitle: "X"\npublishedAt: 2026-05-22\nupdatedAt: 2026-07-27\nstaleAfter: 2026-08-31\nbeat: airline\ncategory: programme-change\n---\nBody',
  );
  assert.ok(parsed);
  assert.equal(parsed.publishedAt.toISOString().slice(0, 10), "2026-05-22");
  assert.equal(parsed.updatedAt.toISOString().slice(0, 10), "2026-07-27");
  assert.equal(parsed.staleAfter.toISOString().slice(0, 10), "2026-08-31");
  assert.equal(parsed.beat, "airline");
});

test("frontmatter parse leaves optional fields undefined and handles quoted dates", () => {
  const parsed = parseNewsFrontmatter('---\npublishedAt: "2026-07-27"\n---\n');
  assert.ok(parsed);
  assert.equal(parsed.publishedAt.toISOString().slice(0, 10), "2026-07-27");
  assert.equal(parsed.updatedAt, undefined);
  assert.equal(parsed.staleAfter, undefined);
  assert.equal(parsed.beat, undefined);
});

test("no frontmatter or no publishedAt returns null — schema's problem, not ours", () => {
  assert.equal(parseNewsFrontmatter("no frontmatter"), null);
  assert.equal(parseNewsFrontmatter("---\ntitle: x\n---\n"), null);
});

test("a date mentioned in prose does not count", () => {
  // The regexes are line-anchored inside the frontmatter block only.
  const parsed = parseNewsFrontmatter(
    "---\npublishedAt: 2026-07-27\n---\nThe window runs staleAfter: 2026-06-30 says nobody.",
  );
  assert.ok(parsed);
  assert.equal(parsed.staleAfter, undefined);
});
