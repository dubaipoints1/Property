// Content ↔ image coverage — every rendered content entry should have a
// manifest image behind its conventional slug (guide-<id>, news-<id>,
// deal-<id>, bank-<slug>, programme-<slug>, card-<slug>).
//
// StockImage degrades silently to a generated SVG Cover when a slug is
// missing (BankHubLayout and AirlineProgramLayout render no hero at
// all), so nothing else surfaces an imageless page: 7 of the 8 news
// stories filed in August 2026 shipped with placeholder covers and no
// check noticed (29 Aug 2026 site audit). This makes the gap loud.
//
// A deliberate exception goes in ALLOWED_MISSING with a reason — the
// point is that shipping imageless becomes a recorded decision, not an
// accident.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

const ALLOWED_MISSING: Record<string, string> = {
  // slug: reason
};

const manifest = JSON.parse(
  readFileSync(`${root}/data/stock/manifest.json`, "utf8"),
);
const manifestEntries: Array<{ slug: string }> = Array.isArray(manifest)
  ? manifest
  : (manifest.images ?? manifest.entries);
const slugs = new Set(manifestEntries.map((e) => e.slug));

const contentIds = (dir: string): string[] =>
  readdirSync(`${root}/src/content/${dir}`)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.(mdx|md)$/, ""));

const surfaces: Array<[string, string[]]> = [
  ["guide-", contentIds("guides")],
  ["news-", contentIds("news")],
  ["deal-", contentIds("deals")],
  ["bank-", contentIds("banks")],
  ["programme-", contentIds("programs")],
  [
    "card-",
    Object.keys(JSON.parse(readFileSync(`${root}/src/data/cards.json`, "utf8"))),
  ],
];

test("every content entry has a stock-manifest image (or a recorded exception)", () => {
  const missing: string[] = [];
  for (const [prefix, ids] of surfaces) {
    for (const id of ids) {
      const slug = `${prefix}${id}`;
      if (!slugs.has(slug) && !(slug in ALLOWED_MISSING)) missing.push(slug);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `content entries without a manifest image — fetch one via refetch-image.yml or record a reason in ALLOWED_MISSING:\n  ${missing.join("\n  ")}`,
  );
});

test("ALLOWED_MISSING carries no stale entries", () => {
  const allContent = new Set(
    surfaces.flatMap(([prefix, ids]) => ids.map((id) => `${prefix}${id}`)),
  );
  for (const slug of Object.keys(ALLOWED_MISSING)) {
    assert.ok(
      allContent.has(slug),
      `ALLOWED_MISSING lists ${slug}, which no longer matches any content entry`,
    );
    assert.ok(
      !slugs.has(slug),
      `ALLOWED_MISSING lists ${slug}, but the manifest now carries it — remove the exception`,
    );
  }
});
