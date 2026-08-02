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

import { readFileSync, readdirSync } from "node:fs";

const KEY = process.env.FIRECRAWL_API_KEY;
const BANKS_DIR = "scripts/scrape/banks";

// Words that mark a URL as an offers/promotions surface. Ordered by
// confidence — an exact /offers path beats a page that merely mentions
// "promotion" somewhere in its slug.
const OFFER_PATTERNS = [
  /\/offers?(\/|$)/i,
  /\/promotions?(\/|$)/i,
  /\/deals?(\/|$)/i,
  /\/campaigns?(\/|$)/i,
  /card[-_]?offers?/i,
  /welcome[-_]?offers?/i,
];

// Paths that look like offers but are not the durable landing page we
// want to watch: a single expired campaign, a PDF T&C, an archive.
const REJECT = /\.(pdf|jpg|png)$|\/archive|\/expired|\/terms|\/tnc|\/\d{4}\//i;

function bankOrigins() {
  const out = new Map();
  for (const file of readdirSync(BANKS_DIR).filter((f) => f.endsWith(".urls.json"))) {
    const slug = file.replace(".urls.json", "");
    const cards = JSON.parse(readFileSync(`${BANKS_DIR}/${file}`, "utf8"));
    for (const card of cards) {
      const product = card?.urls?.product;
      if (!product) continue;
      try {
        out.set(slug, new URL(product).origin);
      } catch {
        /* ignore malformed */
      }
      break; // one origin per bank is enough
    }
  }
  return out;
}

async function firecrawlMap(origin) {
  const res = await fetch("https://api.firecrawl.dev/v2/map", {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ url: origin, search: "offers promotions", limit: 200 }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`map HTTP ${res.status}`);
  const json = await res.json();
  // v2 returns { success, links: [{url,...}] } or { data: { links } }
  const links = json?.links ?? json?.data?.links ?? [];
  return links.map((l) => (typeof l === "string" ? l : l.url)).filter(Boolean);
}

function rank(urls) {
  const scored = [];
  for (const u of urls) {
    if (REJECT.test(u)) continue;
    const idx = OFFER_PATTERNS.findIndex((p) => p.test(u));
    if (idx === -1) continue;
    // shorter paths are more likely the durable landing page
    scored.push({ url: u, score: idx * 100 + new URL(u).pathname.length });
  }
  scored.sort((a, b) => a.score - b.score);
  return [...new Set(scored.map((s) => s.url))].slice(0, 5);
}

const origins = bankOrigins();

if (!KEY) {
  console.error("ERROR: FIRECRAWL_API_KEY unset (use 'skip' for a dry run).");
  process.exit(1);
}

if (KEY === "skip") {
  console.log(`[dry-run] would map ${origins.size} bank origins for offers pages:\n`);
  for (const [slug, origin] of origins) console.log(`  ${slug.padEnd(20)} ${origin}`);
  console.log(`\n[dry-run] ~${origins.size} credits (1 map call per bank).`);
  process.exit(0);
}

console.log("Candidate offers pages — REVIEW EACH before adding to offers.registry.json\n");
for (const [slug, origin] of origins) {
  try {
    const links = await firecrawlMap(origin);
    const candidates = rank(links);
    console.log(`## ${slug}  (${origin})`);
    if (!candidates.length) {
      console.log("   no candidate found — locate manually\n");
      continue;
    }
    for (const c of candidates) console.log(`   ${c}`);
    console.log("");
  } catch (e) {
    console.log(`## ${slug}\n   FAILED: ${String(e).slice(0, 120)}\n`);
  }
}
console.log("Confirmed URLs go in scripts/monitor/offers.registry.json.");
