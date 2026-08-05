// Every card in cards.json must be reachable by a scraper.
//
// Run: node --import tsx --test tests/scrape/config-coverage.test.ts
//
// Found 5 August 2026: three Emirates NBD cards —
// share-visa-infinite, share-visa-signature and voyager-world — existed in
// src/data/cards.json but were absent from scripts/scrape/banks/enbd.urls.json.
// 31 cards in the data, 28 in the config.
//
// Nothing scraped them, so their `lastVerified` could not advance by any
// automated means. They sat at 71-77 days and were due to trip the 90-day
// amber flag on 18 and 24 August with no mechanism able to clear it.
//
// This is the same SYMPTOM the ALWAYS_REFRESHABLE fix addressed in #299 —
// dates that cannot move — from a completely different cause. That was
// provenance freezing the field; this was the card never being fetched at
// all. A staleness sweep looks identical in both cases, which is why this
// belongs in the suite rather than in a runbook.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const CARDS = "src/data/cards.json";
const BANKS_DIR = "scripts/scrape/banks";
const REGISTRY = "scripts/scrape/banks.registry.json";

type CardConfig = { slug: string; urls?: { product?: string | null } };

function activeBanks(): string[] {
  return JSON.parse(readFileSync(REGISTRY, "utf8")).banks as string[];
}

function configFor(bank: string): CardConfig[] {
  const path = `${BANKS_DIR}/${bank}.urls.json`;
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8")) as CardConfig[];
}

function cardsByBank(): Map<string, string[]> {
  const cards = JSON.parse(readFileSync(CARDS, "utf8")) as Record<
    string,
    { bank?: string }
  >;
  const out = new Map<string, string[]>();
  for (const [slug, card] of Object.entries(cards)) {
    if (!card.bank) continue;
    const list = out.get(card.bank) ?? [];
    list.push(slug);
    out.set(card.bank, list);
  }
  return out;
}

// cards.json uses the bank's own slug ("emirates-nbd"); the scrape registry
// and its config filenames use the scraper's short name ("enbd"). Keep the
// mapping explicit — an implicit guess here would silently skip a bank and
// defeat the whole test.
const BANK_TO_SCRAPER: Record<string, string> = {
  "emirates-nbd": "enbd",
};

const scraperFor = (bank: string) => BANK_TO_SCRAPER[bank] ?? bank;

test("every card belonging to an active bank is in that bank's scraper config", () => {
  const active = new Set(activeBanks());
  const uncovered: string[] = [];

  for (const [bank, slugs] of cardsByBank()) {
    const scraper = scraperFor(bank);
    if (!active.has(scraper)) continue; // bank not yet on the scrape rota
    const configured = new Set(configFor(scraper).map((c) => c.slug));
    for (const slug of slugs) {
      if (!configured.has(slug)) uncovered.push(`${slug} (missing from ${scraper}.urls.json)`);
    }
  }

  assert.deepEqual(
    uncovered,
    [],
    `these cards can never have lastVerified refreshed:\n  ${uncovered.join("\n  ")}`,
  );
});

test("every scraper config entry corresponds to a real card", () => {
  // The converse. A config entry with no card burns a Firecrawl fetch every
  // run and quietly produces nothing.
  const byBank = cardsByBank();
  const orphans: string[] = [];

  for (const scraper of activeBanks()) {
    const bankSlug =
      Object.entries(BANK_TO_SCRAPER).find(([, s]) => s === scraper)?.[0] ?? scraper;
    const known = new Set(byBank.get(bankSlug) ?? []);
    if (known.size === 0) continue; // no cards for this bank yet
    for (const entry of configFor(scraper)) {
      if (!known.has(entry.slug)) orphans.push(`${entry.slug} (in ${scraper}.urls.json)`);
    }
  }

  assert.deepEqual(orphans, [], `config entries with no matching card:\n  ${orphans.join("\n  ")}`);
});

test("every configured card has a product URL to fetch", () => {
  // An entry present but with a null product URL is covered on paper and
  // fetches nothing in practice — the same invisible-staleness outcome.
  const missing: string[] = [];
  for (const scraper of activeBanks()) {
    for (const entry of configFor(scraper)) {
      if (!entry.urls?.product) missing.push(`${entry.slug} (${scraper})`);
    }
  }
  assert.deepEqual(missing, [], `configured cards with no product URL:\n  ${missing.join("\n  ")}`);
});
