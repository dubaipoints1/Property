// C1 — PartnerBrand schema + cards.json provenance backfill.
//
// Pins the contract that:
//   (1) The L2 schema still validates cards.json after the partnerBrands
//       field lands (zero-state == undefined; the audit relies on this).
//   (2) Every card in cards.json carries a partnerBrands provenance marker —
//       either a populated typed array OR _provenance.partnerBrands ===
//       "needs-review". Silent absence breaks the C1.1 backfill audit.
//   (3) The PartnerBrand enum has exactly the 22 documented slugs. Adding /
//       removing slugs requires Chairman approval per Charter §1, so this
//       test forces a council-aware PR if anyone tries.
//
// Run: node --import tsx --test tests/data/partner-brands.test.ts
//
// Implementation note: src/lib/cardsData.ts imports `z` from `astro:content`,
// which isn't resolvable under plain tsx. We therefore validate the JSON
// shape with a local schema and pin the enum by parsing the source text.
// The full Zod validate path is exercised by `astro check`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const CARDS_PATH = path.join("src", "data", "cards.json");
const SCHEMA_PATH = path.join("src", "lib", "cardsData.ts");

const cardsRaw = readFileSync(CARDS_PATH, "utf8");
const cards = JSON.parse(cardsRaw) as Record<
  string,
  {
    partnerBrands?: unknown;
    _provenance?: Record<string, string>;
  }
>;

// Pin list — mirrors PARTNER_BRAND in src/lib/cardsData.ts. Any change here
// requires a Chairman-approved Charter amendment (Council §1) AND a synced
// edit to the PARTNER_BRAND_PHRASES table in scripts/scrape/_normaliser.ts.
const EXPECTED_PARTNER_BRANDS = [
  "emaar",
  "majid-al-futtaim",
  "lulu",
  "noon",
  "talabat",
  "adnoc",
  "enoc",
  "al-futtaim",
  "etihad",
  "skywards",
  "marriott",
  "booking-com",
  "amazon-ae",
  "shukran",
  "aldar",
  "gems",
  "dnata",
  "air-arabia",
  "etisalat",
  "choithrams",
  "du",
  "careem",
] as const;

test("C1 cards.json validates against the partnerBrands-aware schema", () => {
  // Minimal local mirror of the parts of CardDataSchema we need to
  // verify under tsx: provenance map shape + optional partnerBrands array
  // typed against the pinned slug list. If the slug list drifts from
  // src/lib/cardsData.ts the source-pin test below will catch it.
  const PARTNER_BRAND = z.enum(
    EXPECTED_PARTNER_BRANDS as unknown as [string, ...string[]],
  );
  const PROVENANCE = z.enum([
    "scraped",
    "editor-confirmed",
    "editor-corrected",
    "needs-review",
  ]);
  const MinimalCard = z
    .object({
      partnerBrands: z.array(PARTNER_BRAND).optional(),
      _provenance: z.record(z.string(), PROVENANCE).default({}),
    })
    .passthrough();
  const AllCards = z.record(z.string(), MinimalCard);

  const result = AllCards.safeParse(cards);
  assert.ok(
    result.success,
    `cards.json failed schema validation: ${
      result.success ? "" : JSON.stringify(result.error.format(), null, 2)
    }`,
  );
  // Sanity: schema loaded a non-trivial number of cards (C1 backfill ran).
  assert.ok(Object.keys(cards).length >= 25);
});

test("C1 every card has a partnerBrands provenance marker", () => {
  const silent: string[] = [];
  for (const [slug, card] of Object.entries(cards)) {
    const hasTypedArray =
      Array.isArray(card.partnerBrands) && card.partnerBrands.length > 0;
    const prov = card._provenance?.partnerBrands;
    const hasMarker =
      prov === "needs-review" ||
      prov === "editor-confirmed" ||
      prov === "editor-corrected";
    if (!hasTypedArray && !hasMarker) {
      silent.push(slug);
    }
  }
  assert.deepEqual(
    silent,
    [],
    `Cards silent on partnerBrands (no typed array AND no _provenance marker): ${silent.join(", ")}`,
  );
});

test("C1 PartnerBrand enum has exactly the 22 documented slugs", () => {
  // Read the schema source and pull the enum body via regex. This pins the
  // single source of truth in src/lib/cardsData.ts so a future PR
  // editing PARTNER_BRAND has to update this test in the same commit,
  // forcing a Charter-aware review.
  const schemaSrc = readFileSync(SCHEMA_PATH, "utf8");
  const enumMatch = schemaSrc.match(
    /const\s+PARTNER_BRAND\s*=\s*z\.enum\(\[([\s\S]*?)\]\)/,
  );
  assert.ok(enumMatch, "PARTNER_BRAND enum block not found in cardsData.ts");
  const slugs = Array.from(
    enumMatch![1].matchAll(/"([a-z][a-z0-9-]*)"/g),
    (m) => m[1],
  );
  assert.equal(
    slugs.length,
    EXPECTED_PARTNER_BRANDS.length,
    `Expected ${EXPECTED_PARTNER_BRANDS.length} slugs in PARTNER_BRAND, got ${slugs.length}`,
  );
  assert.deepEqual(
    slugs,
    [...EXPECTED_PARTNER_BRANDS],
    "PARTNER_BRAND enum in cardsData.ts diverged from the pinned C1 list",
  );
});

test("C1 normaliser exports parsePartnerBrandMentions + joins matching lines", async () => {
  const { parsePartnerBrandMentions } = await import(
    "../../scripts/scrape/_normaliser.ts"
  );
  const sample = [
    "- Earn 5x SHARE points at Carrefour and City Centre malls.",
    "- 10% cashback on ADNOC fuel up to AED 200/month.",
    "- Complimentary access to airport lounges via Visa Airport Companion.",
  ].join("\n");
  const out = parsePartnerBrandMentions(sample);
  assert.ok(out, "Should return a joined evidence string");
  assert.ok(out!.includes("Carrefour"), "Carrefour mention should land");
  assert.ok(out!.includes("ADNOC"), "ADNOC mention should land");
  // The non-partner lounge line is filtered out.
  assert.ok(
    !out!.includes("Visa Airport Companion"),
    "Non-partner lines must be excluded",
  );
});

test("C1 parsePartnerBrandMentions returns undefined when no mentions", async () => {
  const { parsePartnerBrandMentions } = await import(
    "../../scripts/scrape/_normaliser.ts"
  );
  const sample = "- Standard Visa Platinum card. AED 0 annual fee.";
  assert.equal(parsePartnerBrandMentions(sample), undefined);
});
