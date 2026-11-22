import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

test("issuer art has an exact product path and is not reused under a different card slug", () => {
  const cards = JSON.parse(readFileSync("src/data/cards.json", "utf8"));
  const source = JSON.parse(readFileSync("data/card-art/sources.json", "utf8"));
  const manifest = JSON.parse(readFileSync("data/card-art/manifest.json", "utf8"));
  const images = new Map<string, string>();
  for (const [slug, raw] of Object.entries(manifest)) {
    const entry = raw as { file: string; url: string; page: string };
    assert.ok(Object.hasOwn(cards, slug), slug);
    assert.equal(entry.file, `images/cards/${slug}.webp`, slug);
    assert.equal(entry.url, source[slug]?.url, slug);
    assert.equal(entry.page, source[slug]?.page, slug);
    assert.equal(new URL(entry.url).protocol, "https:", slug);
    assert.equal(new URL(entry.page).protocol, "https:", slug);
    const digest = createHash("sha256").update(readFileSync(`public/${entry.file}`)).digest("hex");
    assert.ok(!images.has(digest), `${slug} would reuse identical visual bytes from ${images.get(digest)}`);
    images.set(digest, slug);
  }
});
