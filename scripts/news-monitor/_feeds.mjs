// Pure feed definitions and parsing for the news desks' RSS tier.
//
// Split out of monitor.mjs so it can be tested: that file runs its
// fetches at module load, so importing it in a test would hit the
// network. Same reason readCardUrls lives in scripts/monitor/_routing.mjs
// — one source of truth, or the test is testing a copy.

// ── Tier 1: RSS (free) ────────────────────────────────────────────────
//
// Two kinds of feed live here and the difference is load-bearing.
//
//   tier: "aggregator"  Competitor coverage. DISCOVERY ONLY — a lead to
//                       chase, never a fact, never a number, never a
//                       structure. Content laundering is a §10 kill.
//   tier: "primary"     The issuer's OWN newsroom. This is a primary
//                       source under the sourcing ladder, so a desk may
//                       cite it directly. It is also free, which is the
//                       whole point: the same release read through a
//                       Firecrawl press-room monitor costs ~60 credits a
//                       month and arrives as a diff rather than a dated,
//                       titled item.
//
// Until 22 September 2026 every feed here was an aggregator, which is why
// the desks could see a story and not be able to write it: the 17
// September flydubai lead came from Live From A Lounge, and the airline's
// own newsroom was not being read at all.
//
// Feeds confirmed by `discover.yml` (surface: feeds) on 22 September 2026.
// Add nothing here that the probe has not returned items for.
//
//   filter    apply the UAE-relevance regex to titles. ON for global
//             chains, whose feeds are mostly properties we never cover;
//             OFF for a carrier whose every release is UAE news by
//             construction.
//   latinOnly keep the English edition of a bilingual feed. flydubai's
//             Prezly feed carries each release twice, Arabic and English,
//             minutes apart — without this every flydubai story reaches
//             the digest twice. Checked against all ten items in the feed
//             on 22 September 2026; each was paired. An Arabic release
//             with no English twin would be dropped, which is the
//             accepted cost of not double-reporting every story.
export const RSS_FEEDS = [
  // Issuer newsrooms — primary, citable, free.
  { id: "flydubai", name: "flydubai Newsroom", url: "https://news.flydubai.com/feed",
    tier: "primary", filter: false, latinOnly: true },
  { id: "hilton-stories", name: "Hilton Stories", url: "https://stories.hilton.com/feed",
    tier: "primary", filter: true },
  { id: "hyatt-newsroom", name: "Hyatt Newsroom", url: "https://newsroom.hyatt.com/news-releases?pagetemplate=rss",
    tier: "primary", filter: true },

  // Competitor coverage — discovery only.
  { id: "hfp", name: "Head for Points", url: "https://www.headforpoints.com/feed/", tier: "aggregator", filter: true },
  { id: "omaat", name: "One Mile at a Time", url: "https://onemileatatime.com/feed/", tier: "aggregator", filter: true },
  { id: "lfal", name: "Live From A Lounge", url: "https://livefromalounge.com/feed/", tier: "aggregator", filter: true },
  { id: "tpg", name: "The Points Guy", url: "https://thepointsguy.com/feed/", tier: "aggregator", filter: true },
];

// RSS 2.0 uses <item> with a <link> element; Atom uses <entry> with
// <link href>. Parsing only the first would have silently contributed
// zero items from any Atom newsroom rather than failing, so both are
// handled.
export function parseFeed(xml) {
  const out = [];
  for (const [, body] of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    out.push({
      title: (body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim(),
      link: (body.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1]?.trim(),
      date: (body.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1]?.trim(),
    });
  }
  for (const [, body] of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    out.push({
      title: (body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim(),
      link: (body.match(/<link[^>]*\bhref=["']([^"']+)["']/i) || [])[1]?.trim(),
      date: (body.match(/<(?:updated|published)[^>]*>([\s\S]*?)<\/(?:updated|published)>/i) || [])[1]?.trim(),
    });
  }
  return out;
}

// At least three ASCII letters. A transliterated Prezly slug still reads
// as Latin, so this tests the TITLE, which is the human-language field.
export const hasLatin = (s) => (s.match(/[A-Za-z]/g) || []).length >= 3;

// UAE-relevance filter for RSS titles (press pages pass everything —
// they are already first-party and low-volume).
export const RELEVANT = /\b(uae|dubai|abu dhabi|sharjah|dxb|auh|dwc|shj|emirates|skywards|etihad|flydubai|air arabia|qatar airways|avios|privilege club|alfursan|saudia|gcc|bonvoy|rotana|jumeirah|address hotels|staycation)\b/i;


// A "soft 404": HTTP 200 with an error page for a body. airarabia.com and
// saudia.com both answer a dead path this way, and discover-feeds.mjs
// reported both as reachable on 22 September 2026 because it trusted the
// status code. Those two candidates were then verified by hand on the
// 23rd and found to be 404 pages, which would have become monitor URLs
// diffing an error page forever.
//
// Two signals, either sufficient: the server redirected to a not-found
// route, or the document titles itself as one.
export function isSoft404(finalUrl, html) {
  if (/\/(404|not-?found)(\/|$|\?)/i.test(finalUrl ?? "")) return true;
  const title = (html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] ?? "";
  return /^\s*(404\b|page not found|not found)\b/i.test(title.trim());
}
