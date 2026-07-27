// Shared RSS rendering — extracted from src/pages/rss.xml.ts when the
// per-beat desk feeds landed (council session 2026-07-27, follow-up
// queued in .council/research/2026-07/news-taxonomy-routing.md).
//
// Hand-rolled, no @astrojs/rss dependency, matching the existing feed's
// output byte-for-byte for the site-wide case.

const SITE_URL = "https://dubaipoints.ae";

export const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c,
  );

export const cdata = (s: string): string =>
  `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;

export interface FeedItem {
  href: string;
  title: string;
  description: string;
  pubDate: Date;
  category: string;
}

/**
 * Render a complete RSS 2.0 document.
 *
 * @param feedPath  Path of the feed itself (e.g. "/rss.xml",
 *                  "/news/airlines/rss.xml") — used for the atom:link
 *                  self-reference, which readers use to detect moves.
 */
export function renderFeed(opts: {
  title: string;
  description: string;
  feedPath: string;
  items: FeedItem[];
}): Response {
  const items = [...opts.items].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
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
    <title>${xmlEscape(opts.title)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEscape(opts.description)}</description>
    <language>en-ae</language>
    <lastBuildDate>${channelDate}</lastBuildDate>
    <atom:link href="${SITE_URL}${opts.feedPath}" rel="self" type="application/rss+xml" />${itemXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
