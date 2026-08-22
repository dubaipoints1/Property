// News expiry sweep — sibling of check-deal-expiry.mjs for the news
// collection. Deals carry `expiresOn` and readers never see an expired
// entry; news stories describe promotion windows only in prose ("running
// 21 May to 31 August", "window closes 30 September"), so nothing flagged
// a story once its window passed — it kept serving as-is. The optional
// `staleAfter` frontmatter field (news schema, content.config.ts) records
// the date after which the story's claims stop being safe to serve
// unreviewed. Past it, the owning desk re-checks the story against its
// sources and bumps `updatedAt` (and `staleAfter`, if a new window
// opened) — or the sweep keeps flagging it.
//
// Deterministic per Charter §6: `staleAfter` is typed frontmatter an
// editor sets from the story's own prose. This check never extracts dates
// from body text.
//
// Stories with no `staleAfter` are not failed — most news is a record of
// something that happened, not a live claim. But a story >60 days old
// with no `staleAfter` and no update in 60 days gets a non-fatal warning,
// so evergreen-looking staleness surfaces without blocking anything.
//
// Same shape as check-deal-expiry.mjs: pure functions unit-tested in
// tests/ci/news-expiry.test.ts, plus a thin CLI. The CLI parses only the
// frontmatter fields it needs with line-anchored regexes rather than a
// YAML dependency — all plain scalars, shape enforced by the schema.
//
// Usage: node scripts/ci/check-news-expiry.mjs [newsDir]
// Exit 0 = clean (warnings on stdout), 1 = stale stories listed on stderr.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;

// News has no Tue-slot mandate like deals; 60 days is two monthly cycles —
// long enough that a genuinely evergreen story only warns twice a year of
// cron runs, short enough to catch a dead promotion within one quarter.
export const WARN_AFTER_DAYS = 60;

/**
 * A story is stale when its `staleAfter` has passed AND nobody has touched
 * it since — `updatedAt` (falling back to `publishedAt`) is older than
 * `staleAfter`. A touch on or after `staleAfter` means an editor re-checked
 * the story with the window's end in view; that story passes even though
 * the date is behind us, because the flag did its job.
 *
 * @param {Array<{id: string, publishedAt: Date, updatedAt?: Date, staleAfter?: Date, beat?: string}>} entries
 * @param {Date} today
 * @returns {{ok: boolean,
 *   stale: Array<{id: string, staleAfter: Date, daysOverdue: number, beat?: string}>,
 *   warnings: Array<{id: string, lastTouched: Date, daysSinceTouch: number, beat?: string}>}}
 */
export function checkNewsExpiry(entries, today) {
  const stale = [];
  const warnings = [];
  for (const e of entries) {
    const touched = e.updatedAt ?? e.publishedAt;
    if (e.staleAfter) {
      // staleAfter is inclusive, matching expiresOn: the named day is
      // still safe to serve.
      if (e.staleAfter.getTime() < today.getTime() && touched.getTime() < e.staleAfter.getTime()) {
        stale.push({
          id: e.id,
          staleAfter: e.staleAfter,
          daysOverdue: Math.floor((today.getTime() - e.staleAfter.getTime()) / DAY_MS),
          beat: e.beat,
        });
      }
    } else if (today.getTime() - touched.getTime() > WARN_AFTER_DAYS * DAY_MS) {
      warnings.push({
        id: e.id,
        lastTouched: touched,
        daysSinceTouch: Math.floor((today.getTime() - touched.getTime()) / DAY_MS),
        beat: e.beat,
      });
    }
  }
  stale.sort((a, b) => b.daysOverdue - a.daysOverdue);
  warnings.sort((a, b) => b.daysSinceTouch - a.daysSinceTouch);
  return { ok: stale.length === 0, stale, warnings };
}

/**
 * Read the fields this check needs from one news file's frontmatter.
 * Returns null when the file has no frontmatter block or no publishedAt —
 * the schema fails the build for that long before this check matters.
 *
 * @param {string} raw
 * @returns {{publishedAt: Date, updatedAt?: Date, staleAfter?: Date, beat?: string}|null}
 */
export function parseNewsFrontmatter(raw) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const date = (field) => {
    const m = fm[1].match(new RegExp(`^${field}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, "m"));
    return m ? new Date(`${m[1]}T00:00:00Z`) : undefined;
  };
  const publishedAt = date("publishedAt");
  if (!publishedAt) return null;
  return {
    publishedAt,
    updatedAt: date("updatedAt"),
    staleAfter: date("staleAfter"),
    // beat routes the flag to the owning desk in the sweep output.
    beat: fm[1].match(/^beat:\s*["']?([a-z-]+)/m)?.[1],
  };
}

/** @param {string} dir */
export function loadNews(dir) {
  return readdirSync(dir)
    .filter((f) => /\.(md|mdx)$/.test(f))
    .flatMap((f) => {
      const parsed = parseNewsFrontmatter(readFileSync(join(dir, f), "utf8"));
      return parsed ? [{ id: f.replace(/\.(md|mdx)$/, ""), ...parsed }] : [];
    });
}

// ── CLI ──────────────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith("check-news-expiry.mjs")) {
  const dir = process.argv[2] ?? "src/content/news";
  const result = checkNewsExpiry(loadNews(dir), new Date());
  for (const w of result.warnings) {
    console.log(
      `WARN: ${w.id}${w.beat ? ` [${w.beat}]` : ""} last touched ${w.lastTouched.toISOString().slice(0, 10)} (${w.daysSinceTouch} days ago) with no staleAfter — confirm it is evergreen, or set one.`,
    );
  }
  if (result.ok) {
    console.log("News expiry sweep clean: no story is past `staleAfter` without a re-check.");
    process.exit(0);
  }
  console.error("News expiry sweep FAILED — stories past `staleAfter` with no re-check since:\n");
  for (const s of result.stale) {
    console.error(
      `  · ${s.id}${s.beat ? ` [${s.beat}]` : ""} went stale ${s.staleAfter.toISOString().slice(0, 10)} (${s.daysOverdue} day${s.daysOverdue === 1 ? "" : "s"} ago)`,
    );
  }
  console.error(
    "\nRe-check each story against its sources, update the prose, and bump `updatedAt` (plus `staleAfter` if a new window opened) — the re-check is the point of the sweep, not the flag.",
  );
  process.exit(1);
}
