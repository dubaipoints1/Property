// FAB scraper entry point.
//
// Reads scripts/scrape/banks/fab.urls.json, fetches each card's URL set via
// Firecrawl, runs the normaliser, and writes a JSON snapshot to
// data/scraped/fab/<timestamp>.json.
//
// Run:
//   FIRECRAWL_API_KEY=fc-... npm run scrape:fab
//
// Dry run (no API call, validates wiring):
//   FIRECRAWL_API_KEY=skip npm run scrape:fab

import fs from "node:fs";
import path from "node:path";
import { firecrawlFetch, writeScrapeOutput, type CardScrapeResult, type CardUrlSet } from "./_lib.ts";
import { normalise } from "./_normaliser.ts";

const BANK_SLUG = "fab";
const URLS_PATH = path.join("scripts", "scrape", "banks", "fab.urls.json");

/**
 * Decide whether a draft has enough usable data to commit.
 *
 * Rule: emit the draft if any of the headline fields parsed.
 * - annualFee.amount > 0   → real fee data
 * - eligibility.minSalary > 0 → real salary band
 * - any earn-rate category > 1 → real earn rate (1 is the default)
 *
 * Drop only if every field is at default — fetches probably failed entirely.
 */
function hasUsableData(draft: ReturnType<typeof normalise>): boolean {
  if (draft.annualFee.amount > 0) return true;
  if (draft.eligibility.minSalary > 0) return true;
  const r = draft.earnRates;
  for (const k of [
    "dining",
    "groceries",
    "shopping",
    "travel",
    "fuel",
    "entertainment",
    "online",
    "international",
  ] as const) {
    if (typeof r[k] === "number" && r[k]! > 0) return true;
  }
  if (draft.earnRates.everythingElse > 1) return true;
  return false;
}

async function main() {
  if (!fs.existsSync(URLS_PATH)) {
    console.error(`[fab] URL config missing: ${URLS_PATH}`);
    process.exit(1);
  }
  const cards = JSON.parse(fs.readFileSync(URLS_PATH, "utf8")) as CardUrlSet[];
  console.log(`[fab] Scraping ${cards.length} card(s)`);

  const results: CardScrapeResult[] = [];
  for (const card of cards) {
    const sources = [];
    const urls = [card.urls.product, card.urls.kfs, card.urls.welcome].filter(
      (u): u is string => Boolean(u),
    );
    for (const url of urls) {
      console.log(`[fab] Fetching ${url}`);
      const fetched = await firecrawlFetch(url);
      sources.push(fetched);
      if (fetched.status === "fail") {
        console.warn(`[fab]   ✗ ${fetched.failReason}`);
      }
    }
    const draft = normalise(BANK_SLUG, card, sources);
    results.push({
      slug: card.slug,
      name: card.name,
      fetched: sources,
      draft: hasUsableData(draft) ? draft : null,
      errors: draft._errors,
    });
  }

  const file = writeScrapeOutput(BANK_SLUG, results);
  console.log(`[fab] Wrote ${file}`);

  const failures = results.filter((r) => r.errors.length > 0);
  if (failures.length > 0) {
    console.log(`[fab] ${failures.length} card(s) had parsing warnings:`);
    for (const f of failures) {
      console.log(`[fab]   ${f.slug}: ${f.errors.join("; ")}`);
    }
  }
}

main().catch((err) => {
  console.error("[fab] Fatal:", err);
  process.exit(1);
});
