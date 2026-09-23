import { test } from "node:test";
import assert from "node:assert/strict";

import { RSS_FEEDS, RELEVANT, parseFeed, hasLatin, isSoft404 } from "../../scripts/news-monitor/_feeds.mjs";

// flydubai's real Prezly feed, 22 September 2026: RSS 2.0, CDATA titles,
// and every release published TWICE — once Arabic, once English, minutes
// apart. Trimmed to two pairs; the shape is what matters.
const FLYDUBAI = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
<title><![CDATA[flydubai's pressreleases]]></title>
<language>en</language>
<item>
  <title><![CDATA[  فلاي دبي تعلن عن شراكة استراتيجية مع إغناتيا للطيران وسكايبورن  ]]></title>
  <link>https://news.flydubai.com/flay-dby-tln-n-shrakt-astratyjyt</link>
  <pubDate>Fri, 18 Sep 2026 14:36:00 +0000</pubDate>
</item>
<item>
  <title><![CDATA[flydubai partners with Egnatia Aviation and Skyborne to advance pilot training]]></title>
  <link>https://news.flydubai.com/flydubai-partners-with-egnatia-aviation</link>
  <pubDate>Fri, 18 Sep 2026 14:30:00 +0000</pubDate>
</item>
<item>
  <title><![CDATA[يحصل المُسافرون القادمون على ميزة شراء بطاقة إسعاد بمبلغ خاص]]></title>
  <link>https://news.flydubai.com/yhsl-almusafrwn-alqadmwn</link>
  <pubDate>Fri, 18 Sep 2026 10:07:00 +0000</pubDate>
</item>
<item>
  <title><![CDATA[Dubai Police and flydubai sign MoU to enhance visitor happiness]]></title>
  <link>https://news.flydubai.com/dubai-police-and-flydubai-sign-mou</link>
  <pubDate>Fri, 18 Sep 2026 09:59:00 +0000</pubDate>
</item>
</channel></rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<entry>
  <title>Hyatt opens a property in Dubai</title>
  <link rel="alternate" href="https://newsroom.hyatt.com/dubai-opening"/>
  <updated>2026-09-17T15:25:00-05:00</updated>
</entry>
</feed>`;

test("parseFeed reads RSS 2.0 items with CDATA titles", () => {
  const items = parseFeed(FLYDUBAI);
  assert.equal(items.length, 4);
  assert.ok(items.every((i) => i.link?.startsWith("https://")));
  assert.ok(items.every((i) => i.date));
});

// Atom support is not decoration. Parsing only <item> would have made an
// Atom newsroom contribute ZERO items while the run still reported "ok"
// — a silent hole of exactly the kind the poller's partial-check bug was.
test("parseFeed reads Atom entries, taking href from <link>", () => {
  const items = parseFeed(ATOM);
  assert.equal(items.length, 1);
  assert.equal(items[0].link, "https://newsroom.hyatt.com/dubai-opening");
  assert.equal(items[0].title, "Hyatt opens a property in Dubai");
});

// The reason latinOnly exists: without it every flydubai story reaches
// the digest twice, because the feed carries both editions.
test("hasLatin keeps the English edition and drops the Arabic twin", () => {
  const kept = parseFeed(FLYDUBAI).filter((i) => hasLatin(i.title!));
  assert.equal(kept.length, 2);
  assert.ok(kept.every((i) => /^[A-Za-z]/.test(i.title!.trim())));
});

test("every feed declares a tier, and primary feeds are issuer-owned", () => {
  assert.ok(RSS_FEEDS.length > 0);
  for (const f of RSS_FEEDS) {
    assert.ok(["primary", "aggregator"].includes(f.tier), `${f.id} has no valid tier`);
    assert.ok(f.url.startsWith("https://"), `${f.id} url must be https`);
  }
  const primary = RSS_FEEDS.filter((f) => f.tier === "primary").map((f) => f.id);
  assert.deepEqual(primary.sort(), ["flydubai", "hilton-stories", "hyatt-newsroom"]);
});

// A global chain's feed is mostly properties we never cover, so it must
// be filtered. A Dubai carrier's feed is UAE news by construction, so
// filtering it against a UAE-keyword regex would drop real stories —
// "Dubai Police and flydubai sign MoU" passes, but a fleet or route
// release need not name a UAE place at all.
test("global chains are relevance-filtered; the Dubai carrier is not", () => {
  const byId = Object.fromEntries(RSS_FEEDS.map((f) => [f.id, f]));
  assert.equal(byId["flydubai"].filter, false);
  assert.notEqual(byId["hilton-stories"].filter, false);
  assert.notEqual(byId["hyatt-newsroom"].filter, false);
});

test("the relevance regex still matches the UAE terms the desks rely on", () => {
  for (const s of ["Emirates Skywards devalues", "New Bonvoy property in Abu Dhabi", "DXB lounge access"]) {
    assert.ok(RELEVANT.test(s), `${s} should be relevant`);
  }
  assert.equal(RELEVANT.test("Best credit cards in Ohio"), false);
});

// The exact signals the two real soft 404s sent on 23 September 2026.
// Both answered HTTP 200, and the feed probe had reported both reachable.
test("isSoft404 catches the redirect-to-error-route shape (Air Arabia, Saudia)", () => {
  assert.equal(isSoft404("https://www.airarabia.com/en/not-found", "<title>Not Found</title>"), true);
  assert.equal(isSoft404("https://www.saudia.com/en-US/404", "<title>Page</title>"), true);
});

test("isSoft404 catches an error page served at the original URL", () => {
  assert.equal(isSoft404("https://example.com/news", "<title>404 - Page not found</title>"), true);
  assert.equal(isSoft404("https://example.com/news", "<title>Page Not Found | Example</title>"), true);
});

// The detector has to stay out of the way of real pages, including ones
// whose paths or titles merely CONTAIN the words.
test("isSoft404 leaves real pages alone", () => {
  assert.equal(isSoft404("https://press.airarabia.com/", "<title>Newsroom Air Arabia</title>"), false);
  assert.equal(
    isSoft404("https://example.com/news/lost-and-not-found-luggage-rules", "<title>Lost luggage rules</title>"),
    false,
  );
  assert.equal(isSoft404("https://example.com/offers", "<title>Earn 2X points — offer not found elsewhere</title>"), false);
});
