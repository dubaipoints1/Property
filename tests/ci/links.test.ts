// Unit tests for the internal link sweep (scripts/ci/check-links.mjs).
// The sweep itself runs post-build; these pin the pure parsing and
// resolution rules against fixtures so a refactor can't silently loosen
// them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  extractInternalHrefs,
  parseRedirectSources,
  hrefResolves,
  checkLinks,
  // eslint-disable-next-line import/extensions
} from "../../scripts/ci/check-links.mjs";

test("extractInternalHrefs keeps root-relative, drops external/mailto/fragment", () => {
  const html = `
    <a href="/cards/">c</a>
    <a href="/guides/x/#section">g</a>
    <a href="/search/?q=fab">s</a>
    <a href="https://example.com/">e</a>
    <a href="//cdn.example.com/x">p</a>
    <a href="mailto:desk@dubaipoints.ae">m</a>
    <a href="#top">f</a>
    <a href="/cards/">dupe</a>
  `;
  assert.deepEqual(extractInternalHrefs(html).sort(), ["/cards/", "/guides/x/", "/search/"]);
});

test("parseRedirectSources reads first column, skips comments", () => {
  const body = "# comment\n/friday-brief /newsletter/ 301\n/friday-brief/ /newsletter/ 301\n\n";
  const s = parseRedirectSources(body);
  assert.ok(s.has("/friday-brief"));
  assert.ok(s.has("/friday-brief/"));
  assert.equal(s.size, 2);
});

test("hrefResolves and checkLinks against a fixture dist", () => {
  const dist = mkdtempSync(path.join(tmpdir(), "links-"));
  mkdirSync(path.join(dist, "cards"), { recursive: true });
  writeFileSync(path.join(dist, "cards", "index.html"), "<a href=\"/missing/\">x</a>");
  writeFileSync(path.join(dist, "index.html"), "<a href=\"/cards/\">ok</a><a href=\"/cards\">ok2</a>");
  writeFileSync(path.join(dist, "og-default.png"), "png");

  assert.equal(hrefResolves(dist, "/cards/"), true);
  assert.equal(hrefResolves(dist, "/cards"), true);
  assert.equal(hrefResolves(dist, "/og-default.png"), true);
  assert.equal(hrefResolves(dist, "/missing/"), false);
  assert.equal(hrefResolves(dist, "/../etc/passwd"), false);

  const res = checkLinks(dist, new Set());
  assert.equal(res.ok, false);
  assert.deepEqual(res.broken, [{ file: path.join("cards", "index.html"), href: "/missing/" }]);

  // Redirect sources pass.
  const res2 = checkLinks(dist, new Set(["/missing/"]));
  assert.equal(res2.ok, true);
});
