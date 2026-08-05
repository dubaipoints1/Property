// Registry-URL discovery core — shared by the per-surface discover-*.mjs
// entry points. Pure except for firecrawlMap(); no side effects on import.
//
// Extracted from discover-offers.mjs when salary-transfer discovery was
// added. The mapping, ranking and dry-run reporting are identical across
// surfaces; only the URL patterns, the reject rule and the map search
// term differ, so those are the config a caller supplies.
//
// Every entry point PROPOSES and commits nothing. Guessing a bank's page
// wrong would point a monitor at the wrong document and we would then
// trust it, which is worse than having no monitor at all.

import { readFileSync, readdirSync } from "node:fs";

const BANKS_DIR = "scripts/scrape/banks";

/** slug → site origin, derived from the same configs the scraper uses. */
export function bankOrigins() {
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

export async function firecrawlMap(key, origin, search) {
  const res = await fetch("https://api.firecrawl.dev/v2/map", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ url: origin, search, limit: 200 }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`map HTTP ${res.status}`);
  const json = await res.json();
  // v2 returns { success, links: [{url,...}] } or { data: { links } }
  const links = json?.links ?? json?.data?.links ?? [];
  return links.map((l) => (typeof l === "string" ? l : l.url)).filter(Boolean);
}

/**
 * Rank candidate URLs for one surface.
 *
 * Ordering is pattern confidence first, then path length — a bare
 * /offers beats /personal/cards/offers/seasonal, because the shorter
 * path is likelier to be the durable landing page rather than one
 * campaign that will 404 next quarter.
 *
 * @param urls   candidate URLs from firecrawlMap
 * @param config { patterns, reject, limit }
 */
export function rank(urls, config) {
  const { patterns, reject, limit = 5 } = config;
  const scored = [];
  for (const u of urls) {
    if (reject && reject.test(u)) continue;
    const idx = patterns.findIndex((p) => p.test(u));
    if (idx === -1) continue;
    let pathLength;
    try {
      pathLength = new URL(u).pathname.length;
    } catch {
      continue; // malformed URL — not a candidate
    }
    scored.push({ url: u, score: idx * 100 + pathLength });
  }
  scored.sort((a, b) => a.score - b.score);
  return [...new Set(scored.map((s) => s.url))].slice(0, limit);
}

/**
 * Shared CLI for a discovery entry point.
 *
 * @param config { surface, search, patterns, reject, limit, registryPath }
 */
export async function runDiscovery(config) {
  const key = process.env.FIRECRAWL_API_KEY;
  const origins = bankOrigins();

  if (!key) {
    console.error("ERROR: FIRECRAWL_API_KEY unset (use 'skip' for a dry run).");
    process.exit(1);
  }

  if (key === "skip") {
    console.log(`[dry-run] would map ${origins.size} bank origins for ${config.surface} pages:\n`);
    for (const [slug, origin] of origins) console.log(`  ${slug.padEnd(20)} ${origin}`);
    console.log(`\n[dry-run] ~${origins.size} credits (1 map call per bank).`);
    process.exit(0);
  }

  console.log(
    `Candidate ${config.surface} pages — REVIEW EACH before adding to ${config.registryPath}\n`,
  );
  for (const [slug, origin] of origins) {
    try {
      const links = await firecrawlMap(key, origin, config.search);
      const candidates = rank(links, config);
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
  console.log(`Confirmed URLs go in ${config.registryPath}.`);
}
