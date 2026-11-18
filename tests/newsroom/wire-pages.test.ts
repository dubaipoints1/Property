import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_IDS, probeOfficialPage } from "../../scripts/newsroom/wire-pages.mjs";
import { SOURCES } from "../../scripts/newsroom/wire-sources.mjs";

const stamp = () => "2026-11-13T17:50:00.000Z";
const wrap = body => `<!doctype html><html><head><title>Fixture</title></head><body>${body}</body></html>`;
const response = (html, headers = {}) => ({ status: 200, headers: { "content-type": "text/html; charset=UTF-8", ...headers }, body: Buffer.from(html) });
const validate = async input => ({ url: new URL(input), addresses: [] });
const probe = (id, html, options = {}) => probeOfficialPage(id, { validate, request: async () => response(html), clock: stamp, ...options });

const story = (url, className, title) => `<a href="${url}"><div><h3 class="${className}">${title}</h3></div><p>Ignore date or teaser</p></a>`;
const emiratesHeading = "pp-tile-item-heading";
const airArabiaHeading = "pp-block-item-heading";
const tileBody = (which, heading, cards) => `<div class="${which}"><h2><a href="?h=1">${heading}</a></h2><div>${cards.join("")}</div></div>`;
const emirates = (cards = [story("/media-centre/story-a/", emiratesHeading, "A UAE headline"), story("/media-centre/story-b/", emiratesHeading, "A &amp; B")]) =>
  tileBody("pp-headline-tiles__latest-stories", "Latest Stories", cards);
const airarabia = () => tileBody("pp-headline-block__more-news", "More News", [
  story("/sharjah-news/", airArabiaHeading, "Sharjah news"), story("/ras-al-khaimah/", airArabiaHeading, "RAK news"),
]);
const fab = (extra = "", route = "promo-a") => `<h1>A fantastic range of offers for our FAB customers</h1>
  <div class="offer-card-grid-items">
    <a href="/en-ae/personal/credit-cards/offers/${route}" class="offer-card-grid-item"><span><div>Offer A</div></span><span> ${extra} </span></a>
    <a href="/en-ae/personal/credit-cards/offers/promo-b" class="offer-card-grid-item">Offer B</a>
    <a href="/en-ae/personal/credit-cards/offers/promo-c" class="offer-card-grid-item">Offer C</a>
  </div>`;
const airTerms = (term = "Updated material") => `<h1 class="mb-2 field-title">AirRewards Terms and Conditions</h1><div class="field-content"><ol>
  <li>General <ol><li>AirRewards is a Loyalty Program ${"Detailed rules are set out in this programme. ".repeat(16)}</li></ol></li>
  <li>Changes to Program Rules <ol><li>${term}</li></ol></li>
  </ol></div>`;
const notice = (name, content) => `<div class="enhanced-text-section"><header><h2><span class="enhanced-text-title__title">${name}</span></h2></header>
  <div class="enhanced-text-section__text--latest"><p>${content}</p></div></div>`;
const skywards = (copy = "Read the programme changes") => `<h1>Emirates Skywards Programme Updates</h1><main>
  ${notice("Notice A", copy)}${notice("Notice B", "Read the applicable terms")}
  </main>`;
const gha = (copy = "New hotels and participating brands") => `<h1 class="title-program">A quick tour of what&#x27;s new</h1>
  <div><h2 class="text-primary">New hotels</h2><div class="ez-richtext-container table-richtext"><p>${copy}</p></div></div>
  <div><h2 class="text-primary">Partners</h2><div class="ez-richtext-container table-richtext"><p>Check current partners.</p></div></div>
  <div><h2 class="text-primary">Dining</h2><div class="ez-richtext-container table-richtext"><p>Check dining eligibility.</p></div></div>`;
const fixtures = new Map([
  ["emirates-press", emirates()], ["air-arabia-press", airarabia()], ["fab-offers", fab()],
  ["airrewards-terms", airTerms()], ["skywards-updates", skywards()], ["gha-updates", gha()],
]);

test("approved official pages only; all return a stable identity and only a scoped fingerprint", async () => {
  assert.deepEqual(PAGE_IDS, [...fixtures.keys()]);
  for (const [id, html] of fixtures) {
    const url = SOURCES.find(source => source.id === id)?.url;
    const row = await probe(id, wrap(html));
    assert.equal(row.status, "usable", `${id}: ${row.detail}`);
    assert.equal(row.surfaceUrl, url);
    assert.equal(row.observedAt, stamp());
    assert.equal(row.items.length, 1);
    assert.equal(row.items[0].url, url);
    assert.match(row.items[0].note, /^Scoped HTML SHA-256: [0-9a-f]{64}$/);
    assert.doesNotMatch(JSON.stringify(row), /Updated material|UAE headline|Offer A|applicable terms/);
  }
  await assert.rejects(probe("united-airlines", wrap(emirates())), /registered official page/);
  await assert.rejects(probe("accor-deals", wrap(emirates())), /registered official page/);
});

test("navigation, script, layout reorder and tracking markup are not changes; changed titles/terms are", async () => {
  const first = await probe("emirates-press", wrap(emirates()));
  const noise = `<script>const ignored=${JSON.stringify(emirates())}</script>
    <nav><a href="/unrelated">Ignore global chrome</a></nav>`;
  const reordered = emirates([
    story("/media-centre/story-b/?campaign=varies", emiratesHeading, "A &amp; B"),
    story("/media-centre/story-a/", emiratesHeading, "A     UAE headline"),
  ]);
  assert.deepEqual((await probe("emirates-press", wrap(noise + reordered))).items, first.items);
  assert.notDeepEqual((await probe("emirates-press", wrap(emirates([
    story("/media-centre/story-b/", emiratesHeading, "Updated story"),
    story("/media-centre/story-a/", emiratesHeading, "A UAE headline"),
  ])))).items, first.items);
  for (const [id, update] of [
    ["fab-offers", fab("Changed date")], ["airrewards-terms", airTerms("Rule wording changed")],
    ["skywards-updates", skywards("New expiry terms")], ["gha-updates", gha("Another participating brand")],
  ]) {
    assert.notDeepEqual((await probe(id, wrap(fixtures.get(id)))).items, (await probe(id, wrap(update))).items);
  }
});

test("missing or ambiguous sections, wrong publisher links, and access gates do not yield fingerprints", async () => {
  const malformed = [
    ["emirates-press", wrap(emirates() + emirates())],
    ["emirates-press", wrap(emirates([story("/media-centre/b/", emiratesHeading, "One"),
      story("https://www.example.com/media-centre/another/", emiratesHeading, "Wrong origin")]))],
    ["fab-offers", wrap(fab("", "../../login"))],
    ["airrewards-terms", wrap(airTerms().replace("Changes to Program Rules", "Removed anchor"))],
    ["airrewards-terms", wrap(airTerms().replace('class="field-content"', 'data-class="field-content"'))],
    ["skywards-updates", wrap(skywards().replace('class="enhanced-text-section__text--latest"', ""))],
    ["gha-updates", wrap(gha().replace('class="ez-richtext-container table-richtext"', 'class="other-content"'))],
    ["emirates-press", wrap(emirates()).replace("<title>Fixture", "<title>Access denied")],
    ["emirates-press", wrap("<main id=app></main><script>shell</script>")],
    ["emirates-press", wrap("<script>" + emirates())],
    ["emirates-press", wrap("<!--" + emirates())],
  ];
  for (const [id, html] of malformed) {
    const r = await probe(id, html);
    assert.equal(r.status, "gap", id);
    assert.deepEqual(r.items, []);
  }
});

test("follows a benign trailing slash only; rejects off-host, other paths and partial response", async () => {
  const calls = [];
  const row = await probe("emirates-press", "", { request: async (url, options) => {
    calls.push(url.href);
    assert.equal(options.maxBytes, 4 * 1024 * 1024);
    return calls.length === 1 ? { status: 301, headers: { location: "/media-centre" }, body: Buffer.alloc(0) } : response(wrap(emirates()));
  }});
  assert.equal(row.status, "usable");
  assert.equal(calls.length, 2);
  for (const location of ["https://www.example.com/media-centre/", "/english/", "/media-centre/?login=1", "http://www.emirates.com/media-centre/"]) {
    let count = 0;
    const row = await probe("emirates-press", "", { request: async () => {
      count++;
      return { status: 302, headers: { location }, body: Buffer.alloc(0) };
    }});
    assert.equal(row.status, "gap");
    assert.equal(count, 1);
  }
  assert.equal((await probe("emirates-press", "", { request: async () =>
    response(wrap(emirates()), { "content-range": "bytes 0-80/100" }) })).status, "gap");
});
