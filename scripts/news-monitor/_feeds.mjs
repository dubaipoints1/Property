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
//   tier: "aggregator"  Unread discovery here. The 27 September 2026
//                       amendment permits attributed secondary news facts
//                       only AFTER reading and editorial review.
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

// RSS and Atom share one structure-aware bounded scanner. Comments and
// markup-looking CDATA are never reparsed as actual feed elements.
import { scanMetadata } from "./_xml.mjs";
export { scanMetadata } from "./_xml.mjs";
export const parseFeed = (xml) => scanMetadata(xml).items;

// At least three ASCII letters. A transliterated Prezly slug still reads
// as Latin, so this tests the TITLE, which is the human-language field.
export const hasLatin = (s) => (s.match(/[A-Za-z]/g) || []).length >= 3;

// UAE-relevance filter for RSS titles (press pages pass everything —
// they are already first-party and low-volume).
export const RELEVANT = /\b(uae|dubai|abu dhabi|sharjah|dxb|auh|dwc|shj|emirates|skywards|etihad|flydubai|air arabia|qatar airways|avios|privilege club|alfursan|saudia|gcc|bonvoy|rotana|jumeirah|address hotels|staycation)\b/i;

// Programme name alone would flood the queue with global property openings
// and corporate results. Require an actionable loyalty-change/promo signal.
const HOTEL_PROGRAMME = /\b(hilton hono[u]?rs|world of hyatt|ihg(?: one rewards)?|accor(?: all)?|all accor|all - accor|all – accor)\b/i;
const PROGRAMME_ACTION = /\b(bonus|promotion|promo|buy points|purchase points|points sale|status match|status challenge|fast track|elite nights?|award (?:nights?|stays?|pricing|charts?|categor(?:y|ies))|redeem|redemption|devaluation|points expir(?:y|ation)|register|registration)\b|\b(?:double|triple)\b.{0,40}\b(?:points|miles|elite nights?)\b|\b(?:transfer|conversion|convert)\b.{0,40}\b(?:points|miles|avios|skywards)\b|\b(?:points|miles|avios|skywards)\b.{0,40}\b(?:transfer|conversion|convert)\b/i;
const SENSITIVE = /\b(accident|emergency|emergencies|diversion|diverted|hijack|terror|violence|assault|crash|security incident|safety incident|crew misconduct|staff misconduct)\b/i;

export function relevanceFor(feed, title) {
  if (SENSITIVE.test(title)) return { keep: false, reason: "Passed over: possible incident/safety/security story; 1 October 2026 exclusion. Human review still required for all leads." };
  if (feed.latinOnly && !hasLatin(title)) return { keep: false, reason: "Non-Latin edition omitted by this feed's existing language rule." };
  if (feed.filter === false) return { keep: true, reason: "UAE carrier newsroom; title relevance only, not editorial verification." };
  if (RELEVANT.test(title)) return { keep: true, reason: "Matched existing UAE/regional/programme title terms; eligibility not established." };
  if (HOTEL_PROGRAMME.test(title) && PROGRAMME_ACTION.test(title)) return {
    keep: true, reason: "Global hotel-programme action candidate; UAE-resident/property eligibility and full terms are UNCONFIRMED.",
  };
  return { keep: false, reason: "No supported title-level relevance signal." };
}

// Currency governs the eventual desk; title routing is merely a suggestion.
export function suggestedDesk(title) {
  if (/\b(skywards|etihad guest|avios|privilege club|alfursan|emirates|etihad|flydubai|air arabia|qatar airways|saudia)\b/i.test(title)) return "airline-news-editor";
  if (/\b(hotel|hilton|hyatt|ihg|accor|bonvoy|marriott|rotana|jumeirah|staycation)\b/i.test(title)) return "hotel-news-editor";
  return "managing-editor";
}


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
