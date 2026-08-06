// Per-beat desk RSS feeds — /news/airlines/rss.xml, /news/hotels/rss.xml,
// /news/banking/rss.xml. Queued follow-up from the 2026-07-27 council
// session; each desk becomes independently subscribable so a reader who
// only wants airline news isn't served card-fee stories.
//
// The route param mirrors the desk index routes (/news/<beat>/), so the
// feed URL is discoverable by appending rss.xml to the page a reader is
// already on. Shares the renderer with the site-wide feed.

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { renderFeed, type FeedItem } from "~/lib/rssFeed";

/** URL segment → schema `beat` value + feed copy. */
const BEATS = {
  airlines: {
    beat: "airline",
    title: "DubaiPoints — Airline news",
    description:
      "Airline and airline-loyalty news with a UAE nexus: programme changes, award pricing, routes from DXB, AUH, SHJ and DWC, with published denominations retained and source links provided.",
  },
  hotels: {
    beat: "hotel",
    title: "DubaiPoints — Hotel news",
    description:
      "Hotel and hotel-loyalty news with a UAE/GCC nexus: openings, points promotions, award repricings and status offers, with published denominations retained and source links provided.",
  },
  banking: {
    beat: "banking",
    title: "DubaiPoints — Banking news",
    description:
      "UAE card and banking news: welcome cycles, earn-rate changes, fee moves and salary-transfer offers, verified against issuer documents.",
  },
} as const;

export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(BEATS).map((beat) => ({ params: { beat } }));

export const GET: APIRoute = async ({ params }) => {
  const key = params.beat as keyof typeof BEATS | undefined;
  const config = key ? BEATS[key] : undefined;
  if (!config) return new Response("Not found", { status: 404 });

  const news = await getCollection("news");
  const items: FeedItem[] = news
    .filter((p) => p.data.beat === config.beat)
    .map((p) => ({
      href: `/news/${p.id}/`,
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishedAt,
      category: p.data.category,
    }));

  return renderFeed({
    title: config.title,
    description: config.description,
    feedPath: `/news/${key}/rss.xml`,
    items,
  });
};
