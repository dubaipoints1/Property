// Site-wide RSS feed.
// Hand-rolled — no @astrojs/rss dependency to keep the bundle lean.
//
// Aggregates news posts, latest guides, and live deals into a single
// reverse-chronological feed. Per-band salary-transfer RSS feeds will
// land separately at /rss/salary-transfer/aed-<band>.xml when the
// band landings ship (per .council/04_content_taxonomy.md).

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const SITE_URL = "https://dubaipoints.ae";
const FEED_TITLE = "DubaiPoints";
const FEED_DESC =
  "UAE rewards, banking, and travel — without the marketing. Every figure in AED, every card checked.";

const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c,
  );

const cdata = (s: string): string => `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;

interface FeedItem {
  href: string;
  title: string;
  description: string;
  pubDate: Date;
  category: string;
}

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
      .filter((d) => d.data.expiresOn.getTime() >= todayMs)
      .map((d) => ({
        href: `/deals/${d.id}/`,
        title: d.data.title,
        description: `Deal expires ${d.data.expiresOn.toLocaleDateString("en-GB")}.`,
        pubDate: d.data.expiresOn,
        category: d.data.category,
      })),
  ];

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const channelDate = (items[0]?.pubDate ?? new Date()).toUTCString();

  const itemXml = items
    .map(
      (item) => `
    <item>
      <title>${cdata(item.title)}</title>
      <link>${SITE_URL}${item.href}</link>
      <guid isPermaLink="true">${SITE_URL}${item.href}</guid>
      <description>${cdata(item.description)}</description>
      <category>${xmlEscape(item.category)}</category>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEscape(FEED_DESC)}</description>
    <language>en-ae</language>
    <lastBuildDate>${channelDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />${itemXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
