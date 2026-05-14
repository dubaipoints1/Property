// Schema-validates the stock-image manifest and confirms every entry
// resolves to a real file on disk under public/.
//
// Run: node --import tsx --test tests/images/manifest.test.ts
// (or via `npm test`)

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "data/stock/manifest.json");

interface Entry {
  slug: string;
  source: string;
  file: string;
  photographer: string;
  licence: string;
  width: number;
  height: number;
  alt: string;
  fetched_at: string;
}

interface Manifest {
  version: 1;
  entries: Entry[];
}

function loadManifest(): Manifest {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as Manifest;
}

test("manifest file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(MANIFEST_PATH), `manifest missing at ${MANIFEST_PATH}`);
  const manifest = loadManifest();
  assert.equal(manifest.version, 1);
  assert.ok(Array.isArray(manifest.entries), "entries must be an array");
});

test("every entry has a kebab-case slug", () => {
  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    assert.match(entry.slug, /^[a-z0-9-]+$/, `slug "${entry.slug}" must be kebab-case`);
  }
});

test("slugs are unique", () => {
  const manifest = loadManifest();
  const seen = new Set<string>();
  for (const entry of manifest.entries) {
    assert.ok(!seen.has(entry.slug), `duplicate slug: ${entry.slug}`);
    seen.add(entry.slug);
  }
});

test("every entry has required attribution fields", () => {
  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    assert.ok(entry.photographer && entry.photographer.length > 0,
      `entry "${entry.slug}" missing photographer`);
    assert.ok(entry.licence && entry.licence.length > 0,
      `entry "${entry.slug}" missing licence`);
    assert.ok(entry.alt && entry.alt.length > 0,
      `entry "${entry.slug}" missing alt text`);
    assert.ok(["pexels", "unsplash", "editorial"].includes(entry.source),
      `entry "${entry.slug}" has invalid source: ${entry.source}`);
  }
});

test("every entry has valid dimensions", () => {
  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    assert.ok(Number.isInteger(entry.width) && entry.width > 0,
      `entry "${entry.slug}" has invalid width: ${entry.width}`);
    assert.ok(Number.isInteger(entry.height) && entry.height > 0,
      `entry "${entry.slug}" has invalid height: ${entry.height}`);
  }
});

test("every entry has a valid fetched_at date", () => {
  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    assert.match(entry.fetched_at, /^\d{4}-\d{2}-\d{2}$/,
      `entry "${entry.slug}" fetched_at must be YYYY-MM-DD`);
  }
});

test("every entry's file path resolves to a real file on disk", () => {
  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    const fullPath = path.join(REPO_ROOT, "public", entry.file);
    assert.ok(fs.existsSync(fullPath),
      `entry "${entry.slug}" file missing at ${fullPath}`);
  }
});

test("file paths conform to allowed locations", () => {
  const manifest = loadManifest();
  for (const entry of manifest.entries) {
    assert.match(entry.file, /^(images\/stock|cover)\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/,
      `entry "${entry.slug}" file path "${entry.file}" not in allowed locations`);
  }
});
