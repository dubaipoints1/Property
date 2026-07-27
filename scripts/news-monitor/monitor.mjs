// News-desk monitoring pipeline — runs in GitHub Actions (the only egress
// that reaches the press hosts; see .council/research/2026-07/
// news-sourcing-policy.md). Two tiers per the sourcing ladder:
//
//   1. Competitor/aggregator RSS (free, plain fetch) — DISCOVERY ONLY.
//      Titles + links land in the digest for the desks to chase via
//      primary sources. Never a fact base.
//   2. Press-room index pages via Firecrawl (credit-metered) — primary
//      discovery. New headlines diffed against the committed state file.
//
// Output: .council/monitoring/digest-<date>.md (only when something new)
// plus updated state in data/news-monitor/state.json. The digest is the
// input the airline-news / hotel-news desks work from; nothing here
// publishes anything.
//
// Credit governance: hard monthly cap (CREDIT_CAP) tracked in the state
// file; Firecrawl tier is skipped once the cap is reached (RSS tier
// always runs). Cap per the ratified sourcing policy: 500/month.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const STATE_PATH = "data/news-monitor/state.json";
const CREDIT_CAP = 500;
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

// ── Tier 1: RSS discovery (free) ──────────────────────────────────────
const RSS_FEEDS = [
  { id: "hfp", name: "Head for Points", url: "https://www.headforpoints.com/feed/" },
  { id: "omaat", name: "One Mile at a Time", url: "https://onemileatatime.com/feed/" },
  { id: "lfal", name: "Live From A Lounge", url: "https://livefromalounge.com/feed/" },
  { id: "tpg", name: "The Points Guy", url: "https://thepointsguy.com/feed/" },
];

// ── Tier 2: press-room indexes via Firecrawl (credit-metered) ─────────
const PRESS_PAGES = [
  { id: "emirates", name: "Emirates Media Centre", url: "https://www.emirates.com/media-centre/", beat: "airline" },
  { id: "etihad", name: "Etihad News", url: "https://www.etihad.com/en-ae/news", beat: "airline" },
  { id: "marriott", name: "Marriott News Center", url: "https://news.marriott.com/", beat: "hotel" },
  { id: "hilton", name: "Hilton Newsroom", url: "https://stories.hilton.com/", beat: "hotel" },
];

// UAE-relevance filter for RSS titles (press pages pass everything —
// they are already first-party and low-volume).
const RELEVANT = /\b(uae|dubai|abu dhabi|sharjah|dxb|auh|dwc|shj|emirates|skywards|etihad|flydubai|air arabia|qatar airways|avios|privilege club|alfursan|saudia|gcc|bonvoy|rotana|jumeirah|address hotels|staycation)\b/i;

const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, "utf8"))
  : { seen: {}, credits: { month: "", used: 0 } };

const now = new Date();
const monthKey = now.toISOString().slice(0, 7);
if (state.credits.month !== monthKey) state.credits = { month: monthKey, used: 0 };

const newItems = [];

function remember(sourceId, key, item) {
  const bucket = (state.seen[sourceId] ??= []);
  if (bucket.includes(key)) return;
  bucket.push(key);
  if (bucket.length > 300) bucket.splice(0, bucket.length - 300);
  newItems.push(item);
}

// Tier 1 — RSS
for (const feed of RSS_FEEDS) {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "dubaipoints-news-monitor/1.0 (+https://dubaipoints.ae)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { console.error(`[rss] ${feed.id} HTTP ${res.status}`); continue; }
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 25);
    for (const [, body] of items) {
      const title = (body.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim();
      const link = (body.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.trim();
      const date = (body.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]?.trim();
      if (!title || !link) continue;
      if (!RELEVANT.test(title)) continue;
      remember(feed.id, link, {
        tier: "rss", source: feed.name, sourceId: feed.id,
        title, link, date: date ?? "",
        note: "DISCOVERY ONLY — verify every fact against a primary source before use.",
      });
    }
    console.log(`[rss] ${feed.id} ok`);
  } catch (e) {
    console.error(`[rss] ${feed.id} failed: ${String(e).slice(0, 120)}`);
  }
}

// Tier 2 — press rooms via Firecrawl
async function firecrawlScrape(url) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { authorization: `Bearer ${FIRECRAWL_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ url, formats: ["links", "markdown"], onlyMainContent: true }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Firecrawl HTTP ${res.status}`);
  return res.json();
}

if (!FIRECRAWL_KEY) {
  console.error("[press] FIRECRAWL_API_KEY unset — skipping press tier");
} else if (state.credits.used >= CREDIT_CAP) {
  console.error(`[press] monthly credit cap reached (${state.credits.used}/${CREDIT_CAP}) — skipping press tier`);
} else {
  for (const page of PRESS_PAGES) {
    try {
      const out = await firecrawlScrape(page.url);
      state.credits.used += 1;
      const md = out?.data?.markdown ?? "";
      // headline-ish links: markdown [text](url) with text > 40 chars
      const links = [...md.matchAll(/\[([^\]]{40,160})\]\((https?:\/\/[^)]+)\)/g)].slice(0, 30);
      for (const [, text, href] of links) {
        const title = text.replace(/\s+/g, " ").replace(/\\+/g, "").trim();
        if (/subscribe|cookie|privacy|download|contact|about /i.test(title)) continue;
        remember(page.id, href, {
          tier: "press", source: page.name, sourceId: page.id, beat: page.beat,
          title, link: href, date: "",
          note: "PRIMARY source — scrape the linked release for the fact base.",
        });
      }
      console.log(`[press] ${page.id} ok (credits used: ${state.credits.used})`);
    } catch (e) {
      console.error(`[press] ${page.id} failed: ${String(e).slice(0, 120)}`);
    }
  }
}

// ── Output ────────────────────────────────────────────────────────────
mkdirSync("data/news-monitor", { recursive: true });
writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

if (newItems.length === 0) {
  console.log("No new items — no digest written.");
  process.exit(0);
}

const stamp = now.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
const digestPath = `.council/monitoring/digest-${stamp}.md`;
mkdirSync(".council/monitoring", { recursive: true });

const lines = [
  `# News monitoring digest — ${now.toISOString().slice(0, 16).replace("T", " ")} UTC`,
  "",
  "_Auto-generated by scripts/news-monitor/monitor.mjs (GitHub Actions)._",
  "_RSS items are DISCOVERY ONLY — the sourcing ladder requires primary_",
  "_verification of every fact before publication. Press items are_",
  "_first-party headlines; scrape the linked release for the fact base._",
  "",
  `Firecrawl credits used this month: ${state.credits.used}/${CREDIT_CAP}`,
  "",
];
for (const tier of ["press", "rss"]) {
  const items = newItems.filter((i) => i.tier === tier);
  if (!items.length) continue;
  lines.push(tier === "press" ? "## Press rooms (primary)" : "## Aggregator RSS (discovery only)", "");
  for (const i of items) {
    lines.push(`- **${i.title}**`);
    lines.push(`  ${i.source}${i.beat ? ` · beat: ${i.beat}` : ""}${i.date ? ` · ${i.date}` : ""}`);
    lines.push(`  ${i.link}`);
    lines.push(`  _${i.note}_`);
    lines.push("");
  }
}
writeFileSync(digestPath, lines.join("\n"));
console.log(`Digest written: ${digestPath} (${newItems.length} new items)`);
