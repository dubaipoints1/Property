// Content ↔ image coverage — every rendered content entry should have a
// stock image or the dedicated, source-recorded issuer card face behind its
// resolved slug (conventional unless overridden
// by the programme image selection).
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
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HOTEL_PROGRAMME_IDS, programmeImage } from "../../src/lib/programmes";

const root = fileURLToPath(new URL("../..", import.meta.url));

const ALLOWED_MISSING: Record<string, string> = {
  // slug: reason
  "news-uae-card-change-log-citi-cash-back-application-route":
    "Deliberately text-led: the issuer terms and worked comparison are the evidence; no decorative article hero, with the existing fallback cover on the listing.",
  "news-uae-salary-switch-scorecard":
    "Deliberately text-led: three dated, issuer-sourced examples need no decorative hero; the news listing retains its existing fallback cover.",
  "news-cash-or-miles-uae-flight-break-even":
    "Deliberately text-led: the worked comparisons are the visual focus and no image should imply that the hypothetical flights were priced or booked.",
  "news-cash-or-miles-etihad-abu-dhabi-muscat":
    "Deliberately text-led: the dated, parsed pricing evidence is the focus; the listing uses an original route pictogram, not a photo implying first-hand travel.",
  "news-flydubai-december-europe-returns":
    "Deliberately text-led: this is a timetable report, not a flight review. No licensed photograph for these routes or original on-location imagery was verified for this item.",
  "news-skywards-my-family-pooling-pause":
    "Deliberately text-led: the official account-transition notice is the evidence; an aircraft photo would not illustrate the pooling or transfer rules.",
  // Phase E.26 deals (20 October 2026): photos are seeded by
  // .github/workflows/seed-images-e26.yml after push. Remove each line once
  // the manifest carries it (the stale-entry test below will insist).
};

const manifest = JSON.parse(
  readFileSync(`${root}/data/stock/manifest.json`, "utf8"),
);
const manifestEntries: Array<{ slug: string; file: string; source_id?: string; source: string }> = Array.isArray(manifest)
  ? manifest
  : (manifest.images ?? manifest.entries);
const slugs = new Set(manifestEntries.map((e) => e.slug));
// The 9 October issuer-card-art amendment uses a separate provenance
// manifest; do not demand a duplicate stock row for the same real card.
const cardArt: Record<string, { file: string; url: string; page: string | null; width: number; height: number }> = JSON.parse(
  readFileSync(`${root}/data/card-art/manifest.json`, "utf8"),
);
function hasIssuerArt(id: string): boolean {
  const art = cardArt[id];
  if (!art) return false;
  assert.equal(art.file, `images/cards/${id}.webp`, `${id}: card-art path must identify this card`);
  assert.ok(existsSync(`${root}/public/${art.file}`), `${id}: issuer art file is missing`);
  assert.ok(art.width > 0 && art.height > 0, `${id}: issuer art dimensions are missing`);
  assert.equal(new URL(art.url).protocol, "https:", `${id}: image source must be recorded`);
  if (art.page) assert.equal(new URL(art.page).protocol, "https:", `${id}: product source must be HTTPS`);
  return true;
}

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

test("every content entry has a stock image, real issuer card art or a recorded exception", () => {
  const missing: string[] = [];
  for (const [prefix, ids] of surfaces) {
    for (const id of ids) {
      const slug = prefix === "programme-" ? programmeImage(id).slug : `${prefix}${id}`;
      const issuerImage = prefix === "card-" && hasIssuerArt(id);
      if (!slugs.has(slug) && !issuerImage && !(slug in ALLOWED_MISSING)) missing.push(slug);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `content entries without a manifest image — fetch one via refetch-image.yml or record a reason in ALLOWED_MISSING:\n  ${missing.join("\n  ")}`,
  );
});

test("hotel directory and hub images resolve to licensed files, not the retired Accor photo", () => {
  for (const id of HOTEL_PROGRAMME_IDS) {
    const image = programmeImage(id);
    const entry = manifestEntries.find((item) => item.slug === image.slug);
    assert.ok(entry, `${id} must resolve to a manifest image`);
    assert.ok(existsSync(`${root}/public/${entry.file}`), `${entry.file} is missing`);
    assert.notEqual(entry.source, "ai-generated", `${id} must use a photograph`);
    assert.notEqual(entry.source_id, "20543524", "the former Sofitel is now a Dorint property");
    if (id === "accor-all") assert.equal(image.caption, "Novotel Barcelona City");
  }
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
