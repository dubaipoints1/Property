// Offers-URL discovery — one-off helper, human-reviewed output.
//
// Confirmed during the 2026-08 monitoring design: 0 of 52 cards carry a
// `urls.welcome`, and no offers/promotions URL appears anywhere in
// scripts/scrape/banks/*.urls.json. Welcome bonuses and limited-time
// offers — the fastest-moving facts on the site — have never been under
// observation. This script proposes candidate offers pages per bank so a
// human can confirm them into offers.registry.json.
//
// It deliberately PROPOSES and does not commit. Guessing a bank's offers
// page wrong would put a daily monitor on the wrong document and we would
// then trust it. Every candidate is reviewed before it lands.
//
// Usage:
//   FIRECRAWL_API_KEY=... node scripts/monitor/discover-offers.mjs
//   FIRECRAWL_API_KEY=skip node scripts/monitor/discover-offers.mjs   # dry run
//
// Output: prints a reviewable block per bank. Copy confirmed URLs into
// scripts/monitor/offers.registry.json.

import { runDiscovery } from "./_discover.mjs";

// Words that mark a URL as an offers/promotions surface. Ordered by
// confidence — an exact /offers path beats a page that merely mentions
// "promotion" somewhere in its slug.
export const OFFER_PATTERNS = [
  /\/offers?(\/|$)/i,
  /\/promotions?(\/|$)/i,
  /\/deals?(\/|$)/i,
  /\/campaigns?(\/|$)/i,
  /card[-_]?offers?/i,
  /welcome[-_]?offers?/i,
];

// Paths that look like offers but are not the durable landing page we
// want to watch: a single expired campaign, a PDF T&C, an archive.
//
// Note the contrast with salary-transfer discovery, which deliberately
// KEEPS PDFs and terms pages — there the T&C document is the source of
// the salary bands, not noise around the marketing page.
export const OFFER_REJECT = /\.(pdf|jpg|png)$|\/archive|\/expired|\/terms|\/tnc|\/\d{4}\//i;

export const OFFERS_CONFIG = {
  surface: "offers",
  search: "offers promotions",
  patterns: OFFER_PATTERNS,
  reject: OFFER_REJECT,
  limit: 5,
  registryPath: "scripts/monitor/offers.registry.json",
};

// import.meta.main is not available on Node 20, so compare argv instead.
if (process.argv[1] && process.argv[1].endsWith("discover-offers.mjs")) {
  await runDiscovery(OFFERS_CONFIG);
}
