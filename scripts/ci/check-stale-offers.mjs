// Stale-offer sweep — the prose sibling of check-deal-expiry.mjs and
// check-news-expiry.mjs.
//
// Deals carry `expiresOn` and news carries `staleAfter`, so the calendar
// flags them. Everything else — programme pages, bank hubs, guides, card
// reviews, page templates and the free-text in cards.json — mentions
// offers in prose with no date field, and nothing noticed when those dates
// passed. On 1 November 2026 that left the Etihad Guest and Qatar
// Privilege Club pages saying "Until 31 October 2026 those transfers carry
// a bonus" a day after both bonuses closed, and the FAB hub advertising an
// extra-miles offer "to 30 June 2026" four months after it ended — while
// the news posts about the same offers had been closed on time.
//
// The rule: a sentence that names a date already in the past after a
// running-offer word ("until", "to", "by", "ends", "valid until", ...) is
// a finding unless the same sentence already reads as past tense
// ("ended", "closed", "expired", "ran", "was", ...). That is a tripwire,
// not a judge: it reads text, it decides nothing, and an editor clears a
// finding by rewriting the sentence or by recording it in
// scripts/ci/stale-offers.allow.json with a reason.
//
// Deliberately NOT run in `npm test` against the live tree: staleness is a
// function of the calendar, so a repo-clean assertion would turn unrelated
// PRs red the morning a date passes. The weekly cron
// (.github/workflows/stale-offers.yml) is what notices; the pure functions
// are unit-tested in tests/ci/stale-offers.test.ts.
//
// Usage: node scripts/ci/check-stale-offers.mjs [--today YYYY-MM-DD]
// Exit 0 = clean, 1 = findings listed on stderr.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Words that, directly before a date, say "this is still running until".
const RUNNING = String.raw`(?:until|till|to|by|through|before|ends?|ending|expires?|expiring|closes?|closing|deadline|valid (?:until|till|to|through))`;

// Words anywhere in the same sentence that say the writer already knows it
// is over, or that the date is a record rather than a promise.
export const PAST_MARKERS =
  /\b(ended|closed|expired|lapsed|ran|was|were|had|has ended|is over|no longer|previous|previously|earlier|former|formerly|superseded|archived|read on|read \d|verified|checked|recorded|published on|announced on|as at|as of|last verified)\b/i;

const DATE_RE = new RegExp(
  String.raw`\b${RUNNING}\s+(?:the\s+)?(?:\*\*)?(\d{1,2})\s+(${MONTHS.join("|")})\s+(\d{4})(?:\*\*)?`,
  "gi",
);

/**
 * The sentence around a match: back to the previous sentence end and
 * forward to the next one, within the same paragraph. Prose here is
 * hard-wrapped, so single newlines are joined first.
 *
 * @param {string} text  paragraph text with newlines collapsed
 * @param {number} start
 * @param {number} end
 */
export function sentenceAround(text, start, end) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const s = Math.max(
    before.lastIndexOf(". "),
    before.lastIndexOf("! "),
    before.lastIndexOf("? "),
    before.lastIndexOf("; "),
  );
  const nextStops = [". ", "! ", "? ", "; "].map((p) => after.indexOf(p)).filter((i) => i >= 0);
  const e = nextStops.length ? Math.min(...nextStops) + 1 : after.length;
  return text.slice(s >= 0 ? s + 2 : 0, end + e).trim();
}

/**
 * Find running-offer phrases whose date is before `today`.
 *
 * @param {string} raw    file contents
 * @param {Date} today    UTC midnight
 * @returns {Array<{line: number, phrase: string, date: string, sentence: string}>}
 */
export function findStaleOffers(raw, today) {
  const findings = [];
  // Work paragraph by paragraph so a sentence never spans a blank line.
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "") { i++; continue; }
    const startLine = i;
    const para = [];
    while (i < lines.length && lines[i].trim() !== "") para.push(lines[i++]);
    // Map each character of the joined paragraph back to its source line.
    const offsets = [];
    let joined = "";
    para.forEach((l, k) => {
      offsets.push(joined.length);
      joined += (k ? " " : "") + l;
    });
    for (const m of joined.matchAll(DATE_RE)) {
      const [, d, mon, y] = m;
      const when = new Date(Date.UTC(Number(y), MONTHS.indexOf(mon.toLowerCase()), Number(d)));
      // The named day is still running (inclusive, like expiresOn).
      if (when.getTime() >= today.getTime()) continue;
      const sentence = sentenceAround(joined, m.index, m.index + m[0].length);
      if (PAST_MARKERS.test(sentence)) continue;
      let k = 0;
      while (k + 1 < offsets.length && offsets[k + 1] <= m.index) k++;
      findings.push({
        line: startLine + k + 1,
        phrase: m[0].replace(/\*\*/g, ""),
        date: when.toISOString().slice(0, 10),
        sentence,
      });
    }
  }
  return findings;
}

/**
 * Drop findings an editor has recorded as fine. An allow entry matches on
 * file plus a substring of the sentence, so it survives line moves but
 * not a rewrite of the sentence itself.
 *
 * @param {Array<{file: string, sentence: string}>} findings
 * @param {Array<{file: string, contains: string, reason: string}>} allow
 */
export function applyAllowList(findings, allow) {
  return findings.filter(
    (f) => !allow.some((a) => a.file === f.file && f.sentence.includes(a.contains)),
  );
}

// Surfaces with no machine-readable end date. News, deals and the
// salary-transfer collections are excluded: they carry staleAfter /
// expiresOn / validUntil and have their own sweeps, and their history
// entries legitimately quote past windows.
export const SCAN_ROOTS = [
  "src/content/programs",
  "src/content/banks",
  "src/content/guides",
  "src/content/cards",
  "src/content/bankReputation",
  "src/pages",
  "src/data/cards.json",
];

function walk(path) {
  const st = statSync(path, { throwIfNoEntry: false });
  if (!st) return [];
  if (st.isFile()) return [path];
  return readdirSync(path).flatMap((f) => walk(join(path, f)));
}

// ── CLI ──────────────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith("check-stale-offers.mjs")) {
  const flag = process.argv.indexOf("--today");
  const today = flag > 0
    ? new Date(`${process.argv[flag + 1]}T00:00:00Z`)
    : new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const allow = JSON.parse(readFileSync("scripts/ci/stale-offers.allow.json", "utf8")).entries;
  const files = SCAN_ROOTS.flatMap(walk).filter((f) => /\.(mdx?|astro|json)$/.test(f));
  const all = files.flatMap((file) =>
    findStaleOffers(readFileSync(file, "utf8"), today).map((f) => ({ file: relative(".", file), ...f })),
  );
  const findings = applyAllowList(all, allow);
  if (findings.length === 0) {
    console.log(`Stale-offer sweep clean: ${files.length} files, no past date written as a running offer.`);
    process.exit(0);
  }
  for (const f of findings) {
    console.error(`${f.file}:${f.line} — "${f.phrase}" (${f.date} has passed)\n    ${f.sentence}`);
  }
  console.error(
    `\n${findings.length} finding(s). Rewrite each sentence in the past tense, or record it in scripts/ci/stale-offers.allow.json with a reason.`,
  );
  process.exit(1);
}
