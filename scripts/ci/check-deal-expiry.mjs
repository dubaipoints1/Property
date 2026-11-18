// Deal expiry sweep — the weekly hygiene loop the 2026-H2 editorial
// strategy mandates ("every `expiresOn` in the deals collection is
// checked in the Tue slot; expired deals are archived same week"),
// enforced instead of remembered. Found 6 August 2026 with two deals
// past expiry and neither archived — the exact credibility failure the
// strategy doc says this loop exists to prevent, happening because the
// loop was a sentence in a doc rather than a check that runs.
//
// A deal whose `expiresOn` has passed must carry `archived: true`. The
// /deals/ index and RSS already filter expired entries out, so a stale
// entry is invisible to readers either way — what this check protects is
// the workflow: archiving is the desk's cue to look for the successor
// offer, and an unarchived expiry is a deal nobody has looked at since
// it died.
//
// Same shape as check-signoff.mjs: a pure function unit-tested in
// tests/ci/deal-expiry.test.ts, plus a thin CLI. The CLI parses only the
// frontmatter fields it needs (expiresOn, expiresAt, archived) with line-anchored
// regexes rather than a YAML dependency — both are plain scalars in every
// entry, and the schema (content.config.ts) is what enforces their shape.
//
// Usage: node scripts/ci/check-deal-expiry.mjs [dealsDir]
// Exit 0 = clean, 1 = expired-but-unarchived deals listed on stderr.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dealCalendarDaysUntil, isDealLiveAt } from "../../src/lib/dealWindow.mjs";

/**
 * @param {Array<{id: string, expiresOn: Date, expiresAt?: Date, archived: boolean}>} deals
 * @param {Date} today
 * @returns {{ok: boolean, stale: Array<{id: string, expiresOn: Date, daysOverdue: number}>}}
 */
export function checkDealExpiry(deals, today) {
  const stale = deals
    .filter((d) => !d.archived && !isDealLiveAt(d, today.getTime()))
    .map((d) => ({
      id: d.id,
      expiresOn: d.expiresOn,
      daysOverdue: -dealCalendarDaysUntil(d.expiresOn, today.getTime(), d.expiresAt) || 0,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  return { ok: stale.length === 0, stale };
}

/**
 * Read the fields this check needs from one deal file's frontmatter.
 * Returns null when the file has no frontmatter block or no expiresOn —
 * the schema fails the build for that long before this check matters.
 *
 * @param {string} raw
 * @returns {{expiresOn: Date, expiresAt?: Date, archived: boolean}|null}
 */
export function parseDealFrontmatter(raw) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const expires = fm[1].match(/^expiresOn:[ \t]*(["']?)(\d{4}-\d{2}-\d{2}(?:T\S+?)?)\1[ \t]*(?:#.*)?$/m);
  if (!expires) return null;
  const archived = /^archived:\s*true\b/m.test(fm[1]);
  const exact = fm[1].match(/^expiresAt:[ \t]*(["'])([^"'\r\n]+)\1[ \t]*(?:#.*)?$/m);
  const hasExact = /^expiresAt:/m.test(fm[1]);
  return { expiresOn: new Date(expires[2]), ...(hasExact ? { expiresAt: new Date(exact?.[2] ?? NaN) } : {}), archived };
}

/** @param {string} dir */
export function loadDeals(dir) {
  return readdirSync(dir)
    .filter((f) => /\.(md|mdx)$/.test(f))
    .flatMap((f) => {
      const parsed = parseDealFrontmatter(readFileSync(join(dir, f), "utf8"));
      return parsed ? [{ id: f.replace(/\.(md|mdx)$/, ""), ...parsed }] : [];
    });
}

// ── CLI ──────────────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith("check-deal-expiry.mjs")) {
  const dir = process.argv[2] ?? "src/content/deals";
  const result = checkDealExpiry(loadDeals(dir), new Date());
  if (result.ok) {
    console.log("Deal expiry sweep clean: no expired deal is missing `archived: true`.");
    process.exit(0);
  }
  console.error("Deal expiry sweep FAILED — expired deals not archived:\n");
  for (const d of result.stale) {
    console.error(
      `  · ${d.id} expired ${d.expiresOn.toISOString().slice(0, 10)} (${d.daysOverdue} day${d.daysOverdue === 1 ? "" : "s"} ago)`,
    );
  }
  console.error(
    "\nSet `archived: true` in each entry's frontmatter, and check the issuer page for a successor offer while you are there — that is the point of the sweep.",
  );
  process.exit(1);
}
