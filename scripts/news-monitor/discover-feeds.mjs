// Candidate feed discovery for the news desks — manual dispatch, proposes only.
//
// WHY THIS EXISTS. The desks are short of airline news, hotel news and
// programme promotions, and the obvious fix — more Firecrawl monitor URLs —
// is the expensive one. A daily monitored URL estimates 60 credits/month
// against a fleet cap of 3,000 that already sits at ~2,200.
//
// An issuer's OWN feed is both free (plain fetch, no Firecrawl) and
// PRIMARY, which is the combination the sourcing ladder actually wants.
// The four feeds in monitor.mjs are all aggregators — discovery only,
// never a citable fact. A Prezly, Presspage or WordPress newsroom usually
// publishes RSS; if it does, that source costs nothing and can be quoted.
//
// So: probe first, buy second. Anything with a working feed goes in
// monitor.mjs for free. Only what has no feed is a candidate for a paid
// Firecrawl monitor URL.
//
// This script PROPOSES. It writes no registry and commits nothing — the
// same contract as scripts/monitor/discover-*.mjs, for the same reason: a
// source we guessed at is worse than no source, because we would then
// trust it. A human confirms each one.
//
// Costs zero Firecrawl credits. Run it from Actions, not a web session:
// nearly every issuer host returns 000 on the session allowlist
// (CLAUDE.md §"Network allowlist").

import { isSoft404 } from "./_feeds.mjs";

const UA = "dubaipoints-news-monitor/1.0 (+https://dubaipoints.ae)";
const TIMEOUT_MS = 15000;

// Candidates are grouped by the gap they close. `home` is probed for
// declared <link rel="alternate"> feeds, which beats guessing paths;
// `guesses` are the conventional fallbacks for each newsroom platform.
const CANDIDATES = [
  // ── Airline newsrooms (UAE / GCC nexus) ───────────────────────────
  // Emirates, Etihad, Qatar and flydubai are already on the press-rooms
  // monitor. These are the gaps. Air Arabia is the glaring one: Sharjah
  // is a UAE airport in our own relevance regex and we watch nothing.
  // The newsroom is Presspage-hosted at press.airarabia.com; the path on
  // the main site is a soft 404. On the paid weekly monitor since 23 Sep.
  { id: "air-arabia", tier: "airline", name: "Air Arabia (SHJ)", home: "https://press.airarabia.com/",
    guesses: ["https://press.airarabia.com/feed", "https://press.airarabia.com/rss"] },
  { id: "wizz-abu-dhabi", tier: "airline", name: "Wizz Air Abu Dhabi", home: "https://wizzair.com/en-gb/information-and-services/about-us/news",
    guesses: ["https://wizzair.com/rss", "https://corporate.wizzair.com/en-GB/rss"] },
  { id: "gulf-air", tier: "airline", name: "Gulf Air (Falconflyer)", home: "https://www.gulfair.com/about-gulf-air/media-centre",
    guesses: ["https://www.gulfair.com/rss", "https://www.gulfair.com/feed"] },
  // media-center is a soft 404; information/media-centre is real but
  // renders its release list client-side, so neither a feed nor a monitor
  // can read it. Kept as a candidate in case a feed ever appears.
  { id: "saudia", tier: "airline", name: "Saudia (Alfursan)", home: "https://www.saudia.com/information/media-centre",
    guesses: ["https://www.saudia.com/rss", "https://www.saudia.com/feed"] },
  { id: "oman-air", tier: "airline", name: "Oman Air (Sindbad)", home: "https://www.omanair.com/en/media-centre",
    guesses: ["https://www.omanair.com/rss", "https://www.omanair.com/feed"] },
  // Already monitored, probed anyway: a free feed would let us drop the
  // paid URL, or at minimum give the desks a dated item list.
  { id: "flydubai", tier: "airline", name: "flydubai (Prezly)", home: "https://news.flydubai.com/",
    guesses: ["https://news.flydubai.com/rss", "https://news.flydubai.com/feed", "https://news.flydubai.com/atom"] },
  { id: "emirates", tier: "airline", name: "Emirates Media Centre", home: "https://www.emirates.com/media-centre/",
    guesses: ["https://www.emirates.com/media-centre/rss/", "https://www.emirates.com/rss"] },

  // ── Hotel newsrooms ───────────────────────────────────────────────
  // IHG and Hyatt are absent entirely although we publish IHG stories.
  // Rotana and Jumeirah are UAE-headquartered and in the relevance regex.
  { id: "ihg", tier: "hotel", name: "IHG (One Rewards)", home: "https://www.ihgplc.com/en/news-and-media",
    guesses: ["https://www.ihgplc.com/en/news-and-media/rss", "https://www.ihgplc.com/rss"] },
  { id: "hyatt", tier: "hotel", name: "World of Hyatt", home: "https://newsroom.hyatt.com/",
    guesses: ["https://newsroom.hyatt.com/rss", "https://newsroom.hyatt.com/feed", "https://newsroom.hyatt.com/index.rss"] },
  { id: "rotana", tier: "hotel", name: "Rotana (UAE)", home: "https://www.rotana.com/mediacentre",
    guesses: ["https://www.rotana.com/rss", "https://www.rotana.com/feed"] },
  { id: "jumeirah", tier: "hotel", name: "Jumeirah (Dubai)", home: "https://www.jumeirah.com/en/article-listing/press-releases",
    guesses: ["https://www.jumeirah.com/rss", "https://www.jumeirah.com/feed"] },
  { id: "hilton", tier: "hotel", name: "Hilton (WordPress)", home: "https://stories.hilton.com/",
    guesses: ["https://stories.hilton.com/feed", "https://stories.hilton.com/feed/", "https://stories.hilton.com/rss"] },
  { id: "marriott", tier: "hotel", name: "Marriott (Presspage)", home: "https://news.marriott.com/",
    guesses: ["https://news.marriott.com/rss", "https://news.marriott.com/feed", "https://news.marriott.com/rss.xml"] },
  { id: "accor", tier: "hotel", name: "Accor (ALL)", home: "https://press.accor.com/",
    guesses: ["https://press.accor.com/rss", "https://press.accor.com/feed", "https://press.accor.com/?lang=en&rss=1"] },

  // ── Programme promotions ──────────────────────────────────────────
  // The gap the desks feel most: we monitor twelve BANK offers pages and
  // zero loyalty-programme promo pages. Transfer bonuses, points sales,
  // double-points runs and status offers are announced here. These rarely
  // carry RSS — a null result is the useful answer, because it tells us
  // this tranche has to be bought as monitor URLs rather than fetched free.
  { id: "skywards-offers", tier: "promo", name: "Emirates Skywards offers", home: "https://www.emirates.com/english/skywards/miles/offers/", guesses: [] },
  { id: "etihad-guest-offers", tier: "promo", name: "Etihad Guest promotions", home: "https://www.etihadguest.com/en/promotions", guesses: [] },
  { id: "qatar-privilege-offers", tier: "promo", name: "Qatar Privilege Club offers", home: "https://www.qatarairways.com/en/privilegeclub/offers.html", guesses: [] },
  { id: "bonvoy-promos", tier: "promo", name: "Marriott Bonvoy promotions", home: "https://www.marriott.com/loyalty/promotions.mi", guesses: [] },
  { id: "honors-offers", tier: "promo", name: "Hilton Honors offers", home: "https://www.hilton.com/en/hilton-honors/member-offers/", guesses: [] },
  { id: "ihg-offers", tier: "promo", name: "IHG One Rewards offers", home: "https://www.ihg.com/onerewards/content/us/en/offers", guesses: [] },
  { id: "hyatt-offers", tier: "promo", name: "World of Hyatt offers", home: "https://world.hyatt.com/content/gp/en/offers.html", guesses: [] },
  { id: "all-offers", tier: "promo", name: "Accor ALL offers", home: "https://all.accor.com/gb/leclub/offers.shtml", guesses: [] },
];

async function get(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = res.ok ? await res.text() : "";
    return { status: res.status, body, finalUrl: res.url };
  } catch (e) {
    return { status: 0, body: "", finalUrl: url, error: String(e.name === "TimeoutError" ? "timeout" : e.message).slice(0, 60) };
  }
}

// A feed is only interesting if it actually carries dated items. A 200
// that returns an HTML error page is not a feed, which is why this counts
// <item>/<entry> rather than trusting the status code.
function feedShape(body) {
  if (!/<(rss|feed|rdf:RDF)\b/i.test(body)) return null;
  const items = (body.match(/<(item|entry)\b/gi) || []).length;
  const title = (body.match(/<item\b[\s\S]*?<title[^>]*>([\s\S]{0,180}?)<\/title>/i) ||
                 body.match(/<entry\b[\s\S]*?<title[^>]*>([\s\S]{0,180}?)<\/title>/i) || [])[1];
  const date = (body.match(/<(pubDate|updated|published)[^>]*>([^<]{4,40})</i) || [])[2];
  return { items, title: title?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/\s+/g, " ").trim(), date: date?.trim() };
}

// Prefer what the page itself declares over what we guessed. A newsroom
// that advertises its feed in <head> is telling us the supported path.
function declaredFeeds(html, baseUrl) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?alternate/i.test(tag)) continue;
    if (!/type\s*=\s*["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = (tag.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (href) { try { out.push(new URL(href, baseUrl).href); } catch {} }
  }
  return [...new Set(out)];
}

const results = [];
for (const c of CANDIDATES) {
  const home = await get(c.home);
  if (home.status === 200 && isSoft404(home.finalUrl, home.body)) {
    home.status = 404;
    home.error = "soft 404 (200 with an error page)";
  }
  const declared = home.body ? declaredFeeds(home.body, home.finalUrl) : [];
  const tried = [...declared, ...c.guesses];
  let hit = null;
  for (const url of tried) {
    const r = await get(url);
    if (r.status !== 200) continue;
    const shape = feedShape(r.body);
    if (shape && shape.items > 0) { hit = { url, ...shape, declared: declared.includes(url) }; break; }
  }
  results.push({ ...c, homeStatus: home.status, homeError: home.error, declaredCount: declared.length, hit, triedCount: tried.length });
  console.log(`[${c.tier}] ${c.id}: home=${home.status}${home.error ? ` (${home.error})` : ""} declared=${declared.length} → ${hit ? `FEED ${hit.url} (${hit.items} items)` : "no feed"}`);
}

const lines = [];
lines.push("## Candidate feed discovery — proposes only, nothing written\n");
lines.push("A **feed** is free to poll and is a PRIMARY source, so it can be quoted.");
lines.push("A candidate with **no feed** but a reachable page is a paid Firecrawl");
lines.push("monitor URL instead (~60 credits/month daily, ~10 weekly).");
lines.push("An unreachable home is neither — it needs a human with a browser.\n");

for (const tier of ["airline", "hotel", "promo"]) {
  const rows = results.filter((r) => r.tier === tier);
  if (!rows.length) continue;
  lines.push(`### ${tier}\n`);
  lines.push("| Source | Home | Feed found | Items | Latest |");
  lines.push("|---|---|---|---|---|");
  for (const r of rows) {
    const home = r.homeStatus === 200 ? "200" : `${r.homeStatus || "000"}${r.homeError ? ` ${r.homeError}` : ""}`;
    const feed = r.hit ? `\`${r.hit.url}\`${r.hit.declared ? " (declared)" : ""}` : "—";
    const latest = r.hit ? `${(r.hit.title || "").slice(0, 70)}${r.hit.date ? ` · ${r.hit.date}` : ""}` : "";
    lines.push(`| ${r.name} | ${home} | ${feed} | ${r.hit?.items ?? ""} | ${latest} |`);
  }
  lines.push("");
}

const withFeed = results.filter((r) => r.hit);
const noFeedReachable = results.filter((r) => !r.hit && r.homeStatus === 200);
const unreachable = results.filter((r) => !r.hit && r.homeStatus !== 200);
lines.push("### Summary\n");
lines.push(`- **${withFeed.length} with a usable feed** — free and primary; add to \`RSS_FEEDS\` in \`scripts/news-monitor/monitor.mjs\`.`);
lines.push(`- **${noFeedReachable.length} reachable but no feed** — cost them as monitor URLs before adding any.`);
lines.push(`- **${unreachable.length} unreachable from this runner** — verify by hand before assuming they are dead.`);
lines.push("\nNothing here is confirmed. A human confirms each URL before it ships.");

const summary = lines.join("\n");
console.log(`\n${summary}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
