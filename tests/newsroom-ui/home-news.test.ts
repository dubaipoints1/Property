import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@astrojs/compiler";
import {
  selectHomeNews, selectHomeGuides, orderNews, partitionNewsEdition,
  newsDeskLabel, newsCategoryLabel,
} from "../../src/lib/homeNews.ts";

const news = (id: string, day: number, updatedDay = day, photo = false) => ({
  id, data: { publishedAt: new Date(Date.UTC(2026, 10, day)), updatedAt: new Date(Date.UTC(2026, 10, updatedDay)), photo },
});
const guide = (id: string, updatedDay: number) => ({
  id, data: { publishedAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date(Date.UTC(2026, 10, updatedDay)) },
});

test("six latest genuine news entries use publication dates, not updates or photographs", () => {
  const entries = [news("older-rechecked", 1, 30, true), ...Array.from({ length: 8 }, (_, i) => news(`report-${i + 2}`, i + 2))];
  const input = [...entries];
  const dates = entries.map(entry => entry.data.publishedAt.toISOString());
  const selected = selectHomeNews(entries);
  assert.deepEqual(selected.map(entry => entry.id), ["report-9", "report-8", "report-7", "report-6", "report-5", "report-4"]);
  assert.deepEqual(entries, input, "selection must not sort the collection in place");
  assert.deepEqual(entries.map(entry => entry.data.publishedAt.toISOString()), dates);
  assert.equal(selected[0], entries.at(-1), "selection retains the original entry and metadata");
});

test("three guide updates have a separate selection and cannot displace any of six news stories", () => {
  const reporting = Array.from({ length: 7 }, (_, i) => news(`report-${i}`, i + 1));
  const guides = [guide("old-review", 1), guide("review-c", 30), guide("review-b", 29), guide("review-a", 28)];
  assert.equal(selectHomeNews(reporting).length, 6);
  assert.deepEqual(selectHomeGuides(guides).map(entry => entry.id), ["review-c", "review-b", "review-a"]);
  const source = readFileSync("src/pages/index.astro", "utf8");
  assert.match(source, /const latestNews = selectHomeNews\(allNews\)/);
  assert.match(source, /const latestGuides = selectHomeGuides\(allGuides\)/);
  assert.doesNotMatch(source, /const latest(?:\s*:\s*[^=]+)?\s*=\s*\[/, "no mixed news/guide edition");
});

test("deduplicated selection produces unique route URLs with deterministic same-date ordering", () => {
  const entries = [news("same", 3), news("z-last", 5), news("a-first", 5), news("same", 4)];
  const selected = selectHomeNews(entries);
  assert.deepEqual(selected.map(entry => entry.id), ["a-first", "z-last", "same"]);
  const urls = selected.map(entry => `/news/${entry.id}/`);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(selected.at(-1)?.data.publishedAt.getUTCDate(), 4);
  assert.deepEqual(selectHomeNews([]), []);
  assert.deepEqual(selectHomeGuides([]), []);
  assert.throws(() => orderNews([{ id: "invalid", data: { publishedAt: new Date("invalid") } }]), /Invalid editorial date/);
});

test("edition keeps eight current stories, three visible text previews and the remaining closed archive", () => {
  const entries = Array.from({ length: 18 }, (_, i) => news(`story-${String(i + 1).padStart(2, "0")}`, i + 1, 30 - i, i % 2 === 0));
  const edition = partitionNewsEdition(entries);
  assert.equal(edition.current.length, 8);
  assert.equal(edition.earlier.length, 3);
  assert.equal(edition.archive.length, 7);
  const all = [...edition.current, ...edition.earlier, ...edition.archive];
  assert.deepEqual(all.map(entry => entry.id), orderNews(entries).map(entry => entry.id));
  assert.equal(new Set(all.map(entry => `/news/${entry.id}/`)).size, edition.total);
  assert.equal(edition.earlier[0].data.publishedAt.getUTCDate(), 10);
  assert.equal(edition.archive.at(-1)?.data.publishedAt.getUTCDate(), 1);
});

test("small editions do not lose or duplicate stories at archive boundaries", () => {
  for (const count of [0, 1, 7, 8, 9, 10, 11, 12]) {
    const entries = Array.from({ length: count }, (_, i) => news(`story-${i}`, i + 1));
    const edition = partitionNewsEdition(entries);
    const all = [...edition.current, ...edition.earlier, ...edition.archive];
    assert.equal(all.length, count);
    assert.equal(new Set(all.map(entry => entry.id)).size, count);
    assert.equal(edition.current.length, Math.min(8, count));
    assert.equal(edition.earlier.length, Math.min(3, Math.max(0, count - 8)));
    assert.equal(edition.archive.length, Math.max(0, count - 11));
  }
});

test("desk/category labels distinguish the newsroom axes without inventing a beat", () => {
  assert.equal(newsDeskLabel("airline"), "Airlines");
  assert.equal(newsDeskLabel("hotel"), "Hotels");
  assert.equal(newsDeskLabel("banking"), "Banking");
  assert.equal(newsDeskLabel(), "Newsroom");
  assert.equal(newsDeskLabel("__proto__"), "Newsroom");
  assert.equal(newsCategoryLabel("programme-change"), "Programme Change");
  assert.equal(newsCategoryLabel("deal-update"), "Deal Update");
});

type Node = { type: string; name?: string; value?: string; attributes?: { name: string; value: string }[]; children?: Node[] };
function find(root: Node, predicate: (node: Node) => boolean): Node[] {
  return [...(predicate(root) ? [root] : []), ...(root.children ?? []).flatMap(child => find(child, predicate))];
}
const has = (node: Node, name: string) => node.attributes?.some(attribute => attribute.name === name) ?? false;

test("homepage source retains hero anchor/motion hooks and renders distinct correctly dated editions", async () => {
  const source = readFileSync("src/pages/index.astro", "utf8");
  const root = (await parse(source)).ast as unknown as Node;
  const latest = find(root, node => node.name === "section" && node.attributes?.some(attribute => attribute.name === "id" && attribute.value === "latest"));
  assert.equal(latest.length, 1);
  assert.ok(has(latest[0], "data-hp-anim"));
  assert.equal(find(latest[0], node => has(node, "data-home-news")).length, 1);
  assert.equal(find(latest[0], node => has(node, "data-home-guides")).length, 0);
  assert.match(source, /latestNews\.map\(\(post, i\)/);
  assert.match(source, /newsDeskLabel\(post\.data\.beat\)/);
  assert.match(source, /newsCategoryLabel\(post\.data\.category\)/);
  assert.match(source, /datetime=\{post\.data\.publishedAt\.toISOString\(\)\.slice\(0, 10\)\}/);
  assert.match(source, /Updated \{fmtLong\(guide\.data\.updatedAt\)\}/);
  assert.match(source, /<NewsListingVisual id=\{post.id\} compact \/>/);
  assert.equal(find(root, node => node.name === "HomeJourneyHero").length, 1);
  assert.doesNotMatch(readFileSync("src/lib/homeNews.ts", "utf8"), /Date\.now|new Date\(/, "selection must not manufacture fresh dates");
});

test("archive source exposes original-date preview before native closed details without preview images", async () => {
  const source = readFileSync("src/layouts/NewsIndexLayout.astro", "utf8");
  const root = (await parse(source)).ast as unknown as Node;
  const history = find(root, node => has(node, "data-news-history"));
  assert.equal(history.length, 1);
  const preview = find(history[0], node => has(node, "data-news-earlier"));
  const details = find(history[0], node => has(node, "data-news-archive"));
  assert.equal(preview.length, 1);
  assert.equal(details.length, 1);
  assert.equal(details[0].name, "details");
  assert.equal(has(details[0], "open"), false, "the full image archive stays closed initially");
  assert.equal(find(details[0], node => node.name === "summary").length, 1);
  assert.equal(find(preview[0], node => ["img", "picture", "NewsListingVisual", "NewsStoryRow"].includes(node.name ?? "")).length, 0);
  assert.ok(source.indexOf("data-news-earlier") < source.indexOf("data-news-archive"));
  assert.match(source, /dates are original publication dates/);
  assert.match(source, /const first = edition\.current\[0\]/);
  assert.doesNotMatch(source, /posts\.slice\(0, 6\)\.find|sameDayFromAnotherDesk|latest\[1\]\s*=/, "photographs must not reorder stories");
  assert.doesNotMatch(source, /<script|onclick=|on:click|client:/, "archive uses native keyboard/no-JS behaviour");
  const visual = readFileSync("src/components/NewsListingVisual.astro", "utf8");
  assert.match(visual, /loading=\{featured \? "eager" : "lazy"\}/);
});
