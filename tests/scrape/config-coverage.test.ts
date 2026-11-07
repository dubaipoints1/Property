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
import { readFileSync, existsSync, realpathSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const CARDS = "src/data/cards.json";
const BANKS_DIR = "scripts/scrape/banks";
const REGISTRY = "scripts/scrape/banks.registry.json";
const MANUAL = "scripts/scrape/manual-primary.registry.json";
type ManualConfig = { slug: string; bank: string; productUrl: string; kfsUrl: string; sourceFixtureIds: string[];
  parser: { module: string; export: string; sha256: string; dependencies: Array<{ path: string; sha256: string }> };
  fixtures: Array<{ path: string; sha256: string }> };
const manual = (): ManualConfig[] => JSON.parse(readFileSync(MANUAL, "utf8")).cards;

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
    const configured = new Set([...configFor(scraper).map((c) => c.slug), ...manual().filter(c => c.bank === bank).map(c => c.slug)]);
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

test("manual source profiles have exactly one maintenance route with pinned parser/fixture identity", () => {
  const allCards = JSON.parse(readFileSync(CARDS, "utf8"));
  const paid = activeBanks().flatMap(bank => configFor(bank).map(c => c.slug));
  const entries = manual();
  const slugs = [...paid, ...entries.map(c => c.slug)];
  assert.equal(new Set(slugs).size, slugs.length, "duplicate or paid/manual shadow slug");
  for (const slug of Object.keys(allCards)) assert.equal(slugs.filter(s => s === slug).length, 1, `exactly one maintenance route required: ${slug}`);
  const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
  const checkPinned = (file: string, expected: string, root: string) => {
    assert.ok(file.startsWith(root + "/"), `pin outside ${root}: ${file}`);
    assert.ok(realpathSync(file).startsWith(realpathSync(root) + path.sep), `pin escapes ${root}: ${file}`);
    assert.match(expected, /^[a-f0-9]{64}$/);
    assert.equal(sha(file), expected, `stale source identity: ${file}`);
  };
  for (const entry of entries) {
    assert.ok(allCards[entry.slug], `orphan manual profile ${entry.slug}`);
    assert.equal(allCards[entry.slug].bank, entry.bank);
    assert.equal(allCards[entry.slug].refreshMode, "manual-primary");
    for (const value of [entry.productUrl, entry.kfsUrl]) {
      const url = new URL(value); assert.equal(url.protocol, "https:");
      assert.equal(url.username + url.password, "");
    }
    checkPinned(entry.parser.module, entry.parser.sha256, "scripts/scrape");
    assert.match(entry.parser.export, /^parse[A-Z][A-Za-z0-9]*$/);
    assert.match(readFileSync(entry.parser.module, "utf8"), new RegExp(`export function ${entry.parser.export}\\(`));
    assert.ok(Array.isArray(entry.parser.dependencies));
    const moduleFiles = [entry.parser.module, ...entry.parser.dependencies.map(d => d.path)];
    assert.equal(new Set(moduleFiles).size, moduleFiles.length, "duplicate parser dependency");
    for (const dependency of entry.parser.dependencies) checkPinned(dependency.path, dependency.sha256, "scripts/scrape");
    // All relative runtime imports are pinned as part of the deterministic parser
    // identity, rather than hashing only the small public entry point.
    for (const moduleFile of moduleFiles) {
      const source = readFileSync(moduleFile, "utf8");
      const imports = [...source.matchAll(/(?:from\s+|import\s*\()["'](\.[^"']+)["']/g)];
      for (const imported of imports) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(moduleFile), imported[1]));
        assert.ok(moduleFiles.includes(resolved), `un-pinned local import ${moduleFile} -> ${resolved}`);
      }
    }
    assert.ok(entry.fixtures.length > 0);
    const sources: Array<{ id: string; url: string }> = [];
    for (const fixture of entry.fixtures) {
      checkPinned(fixture.path, fixture.sha256, "tests/scrape/fixtures");
      const envelope = JSON.parse(readFileSync(fixture.path, "utf8"));
      let parsed = envelope;
      if (envelope.encoding === "gzip+base64") {
        assert.ok(Number.isSafeInteger(envelope.decodedBytes) && envelope.decodedBytes > 0 && envelope.decodedBytes <= 8_000_000);
        const bytes = gunzipSync(Buffer.from(envelope.data, "base64"), { maxOutputLength: envelope.decodedBytes });
        assert.equal(bytes.length, envelope.decodedBytes);
        assert.equal(createHash("sha256").update(bytes).digest("hex"), envelope.decodedSha256);
        parsed = JSON.parse(bytes.toString("utf8"));
      }
      assert.ok(Array.isArray(parsed.sources), `missing source rows: ${fixture.path}`);
      sources.push(...parsed.sources);
    }
    assert.ok(entry.sourceFixtureIds.length >= 2, "product and KFS fixture identities required");
    assert.equal(new Set(entry.sourceFixtureIds).size, entry.sourceFixtureIds.length);
    const matched = entry.sourceFixtureIds.map(id => {
      const matches = sources.filter(s => s.id === id);
      assert.equal(matches.length, 1, `missing or ambiguous fixture id ${id}`);
      return matches[0];
    });
    assert.ok(matched.some(s => s.url === entry.productUrl), `product URL not present in pinned evidence: ${entry.slug}`);
    assert.ok(matched.some(s => s.url === entry.kfsUrl), `KFS URL not present in pinned evidence: ${entry.slug}`);
  }
  for (const [slug, card] of Object.entries(allCards) as Array<[string, { refreshMode?: string }]>) {
    if (card.refreshMode === "manual-primary") assert.equal(entries.filter(e => e.slug === slug).length, 1, slug);
  }
  for (const file of [...readdirSync("scripts/monitor").filter(f => f.endsWith(".mjs")).map(f => `scripts/monitor/${f}`), ...activeBanks().map(b => `scripts/scrape/${b}.ts`)])
    assert.doesNotMatch(readFileSync(file, "utf8"), /manual-primary\.registry/, `paid path must not import manual registry: ${file}`);
});
