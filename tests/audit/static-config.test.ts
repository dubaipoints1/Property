import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  parseRedirectRules,
  validateRedirects,
  parseHeadersFile,
  lintHeaders,
  RECOMMENDED_HEADERS,
  extractSitemapLocs,
  diffSitemap,
  buildStaticConfigReport,
} from "../../scripts/audit/check-headers-redirects.mjs";

function dist(): string {
  const d = mkdtempSync(path.join(tmpdir(), "dp-static-"));
  for (const r of ["newsletter", "cards", "old-page"]) {
    mkdirSync(path.join(d, r), { recursive: true });
    writeFileSync(path.join(d, r, "index.html"), "<html></html>");
  }
  writeFileSync(path.join(d, "index.html"), "<html></html>");
  writeFileSync(path.join(d, "404.html"), "<html></html>");
  return d;
}

test("parseRedirectRules parses the real two-line _redirects shape", () => {
  const rules = parseRedirectRules("# comment\n/friday-brief /newsletter/ 301\n/friday-brief/ /newsletter/ 301\n");
  assert.equal(rules.length, 2);
  assert.deepEqual(rules[0], { line: 2, source: "/friday-brief", target: "/newsletter/", status: 301, splat: false });
});

test("validateRedirects flags missing targets, shadowed pages, chains and loops", () => {
  const d = dist();
  const rules = parseRedirectRules(["/a /gone/ 301", "/old-page /newsletter/ 301", "/b /c 301", "/c /newsletter/ 301", "/d /d 301", "/e /newsletter/ 999", "/ext https://example.com/ 301"].join("\n"));
  const codes = validateRedirects(rules, d).map((p) => `${p.source}:${p.code}`).sort();
  assert.deepEqual(codes, ["/a:target-missing", "/b:chain", "/d:loop", "/e:bad-status", "/ext:target-external", "/old-page:shadows-page"]);
});

test("parseHeadersFile + lintHeaders accept the recommended block", () => {
  const blocks = parseHeadersFile(RECOMMENDED_HEADERS);
  assert.deepEqual(blocks.map((b) => b.path), ["/*", "/_astro/*"]);
  assert.equal(blocks[0].headers.length, 6);
  const lint = lintHeaders(blocks);
  assert.deepEqual(lint, { unknownHeaders: [], duplicatePaths: [], missingRecommended: [] });
});

test("RECOMMENDED_HEADERS is report-only CSP, never an enforcing one", () => {
  assert.match(RECOMMENDED_HEADERS, /Content-Security-Policy-Report-Only:/);
  assert.doesNotMatch(RECOMMENDED_HEADERS, /\n\s*Content-Security-Policy:/);
});

test("diffSitemap flags built routes missing from the sitemap and excludes 404/design-spike", () => {
  const locs = extractSitemapLocs(`<urlset><url><loc>https://dubaipoints.ae/</loc></url><url><loc>https://dubaipoints.ae/cards/</loc></url><url><loc>https://dubaipoints.ae/ghost/</loc></url></urlset>`);
  assert.deepEqual(locs, ["/", "/cards/", "/ghost/"]);
  const diff = diffSitemap(["/", "/cards/", "/newsletter/", "/404.html", "/design-spike/"], locs);
  assert.deepEqual(diff, { inSitemapNotBuilt: ["/ghost/"], builtNotInSitemap: ["/newsletter/"] });
});

test("report records headersPresent=false when the file is absent", () => {
  const r = buildStaticConfigReport({ redirects: { rules: [], problems: [] }, headers: { present: false, blocks: [], lint: lintHeaders([]) }, sitemap: { files: [], count: 0, diff: { inSitemapNotBuilt: [], builtNotInSitemap: [] } }, robots: { present: true, body: "User-agent: *" } });
  assert.equal(r.headers.present, false);
  assert.equal(r.headers.lint.missingRecommended.length, 6);
});
