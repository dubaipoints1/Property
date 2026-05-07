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
      draft: draft._errors.length > 0 && draft.eligibility.minSalary === 0 ? null : draft,
      errors: draft._errors,
    });
  }

  const file = writeScrapeOutput(BANK_SLUG, results);
  console.log(`[fab] Wrote ${file}`);

  const failures = results.filter((r) => r.errors.length > 0);
  if (failures.length > 0) {
    console.log(`[fab] ${failures.length} card(s) had parsing errors:`);
    for (const f of failures) {
      console.log(`[fab]   ${f.slug}: ${f.errors.join("; ")}`);
    }
  }
}

main().catch((err) => {
  console.error("[fab] Fatal:", err);
  process.exit(1);
});
