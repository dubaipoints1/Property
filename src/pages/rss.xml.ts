// Site-wide RSS feed.
// Hand-rolled — no @astrojs/rss dependency to keep the bundle lean.
//
// Aggregates news posts, latest guides, and live deals into a single
// reverse-chronological feed. Per-beat desk feeds live at
// /news/<beat>/rss.xml; both share the renderer in ~/lib/rssFeed.
// Per-band salary-transfer RSS feeds will land separately at
// /rss/salary-transfer/aed-<band>.xml when the band landings ship
// (per .council/04_content_taxonomy.md).

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderFeed, type FeedItem } from "~/lib/rssFeed";

export const GET: APIRoute = async () => {
  const todayMs = Date.now();

  const news = await getCollection("news");
  const guides = await getCollection("guides");
  const deals = await getCollection("deals");

  const items: FeedItem[] = [
    ...news.map((p) => ({
      href: `/news/${p.id}/`,
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishedAt,
      category: p.data.category,
    })),
    ...guides.map((g) => ({
      href: `/guides/${g.id}/`,
      title: g.data.title,
      description: g.data.description,
      pubDate: g.data.publishedAt,
      category: "guide",
    })),
    ...deals
      .filter((d) => !d.data.archived && d.data.expiresOn.getTime() >= todayMs)
      .map((d) => ({
        href: `/deals/${d.id}/`,
        title: d.data.title,
        description: `Deal expires ${d.data.expiresOn.toLocaleDateString("en-GB")}.`,
        pubDate: d.data.publishedAt,
        category: d.data.category,
      })),
  ];

  return renderFeed({
    title: "DubaiPoints",
    description:
      "UAE rewards, banking, and travel — without the marketing. AED-first, sourced and dated.",
    feedPath: "/rss.xml",
    items,
  });
};
