// Unit tests for the build-time Content-Security-Policy generator.
//
// Run: node --import tsx --test tests/build/csp-hashes.test.ts
//
// The classifier decides which inline <script> blocks need a script-src
// hash. Getting it wrong in one direction breaks the site (an executable
// script left unhashed is blocked); in the other it only bloats the header
// toward Cloudflare's 2,000-character limit (175 ld+json blocks hashed for
// nothing). Both directions are asserted.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  isExecutableInline,
  extractInlineScripts,
  hashSource,
  findInlineHandlers,
  buildPolicy,
  injectHeader,
  getAttr,
  GOOGLE_ANALYTICS,
  MAX_HEADER_LENGTH,
  // @ts-expect-error — plain .mjs module, no type declarations by design.
} from "../../scripts/build/csp-hashes.mjs";

test("classifies executable vs data vs external scripts", () => {
  assert.equal(isExecutableInline(""), true);
  assert.equal(isExecutableInline(' type="module"'), true);
  assert.equal(isExecutableInline(" type='text/javascript'"), true);
  assert.equal(isExecutableInline(" type=module data-astro-rerun"), true);
  assert.equal(isExecutableInline(' type="application/ld+json"'), false);
  assert.equal(isExecutableInline(' type="application/json" id="cards"'), false);
  assert.equal(isExecutableInline(' type="text/template"'), false);
  assert.equal(isExecutableInline(' src="/pagefind/pagefind-ui.js"'), false);
  assert.equal(isExecutableInline(' defer src="https://static.cloudflareinsights.com/beacon.min.js"'), false);
});

test("data-src / data-type attributes are not mistaken for src / type", () => {
  assert.equal(getAttr(' data-src="/x.js"', "src"), null);
  assert.equal(isExecutableInline(' data-src="/x.js"'), true);
  assert.equal(isExecutableInline(' data-type="application/json"'), true);
});

test("extracts every inline script and hashes the exact body", () => {
  const html = `<head><script>a()</script><script type="application/ld+json">{"@type":"Thing"}</script>
<script src="/x.js"></script><script type="module">
  b();
</script></head>`;
  const scripts = extractInlineScripts(html);
  assert.equal(scripts.length, 4);
  assert.deepEqual(scripts.map((s: { executable: boolean }) => s.executable), [true, false, false, true]);
  const body = "\n  b();\n";
  assert.equal(scripts[3].body, body);
  const expected = createHash("sha256").update(body, "utf8").digest("base64");
  assert.equal(hashSource(body), `'sha256-${expected}'`);
});

test("hash matches the CSP spec example for an empty-ish script", () => {
  // sha256 of the empty string, base64 — a fixed point any implementation must hit.
  assert.equal(hashSource(""), "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
});

test("finds inline event-handler attributes, ignores data-on and text", () => {
  const html = `<img src="a.svg" onerror="x()"><link rel=preload onload="y"><div data-online="1">turn on=off</div><button onClick=z>`;
  assert.deepEqual(findInlineHandlers(html), ["onerror", "onload", "onclick"]);
  assert.deepEqual(findInlineHandlers(`<img data-logo-fallback src="a.svg">`), []);
});

test("policy is enforced-shape, hash-only for inline script, no unsafe-inline script", () => {
  const p = buildPolicy(["'sha256-AAA='", "'sha256-BBB='"]);
  const scriptSrc = p.split("; ").find((d: string) => d.startsWith("script-src "))!;
  assert.match(scriptSrc, /'sha256-AAA=' 'sha256-BBB='/);
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'|'unsafe-eval'/);
  for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "upgrade-insecure-requests"]) {
    assert.ok(p.includes(d), d);
  }
});

test("form-action is 'self' only: no form posts off-site since the newsletter was removed", () => {
  const p = buildPolicy([]);
  const formAction = p.split("; ").find((d: string) => d.startsWith("form-action"));
  assert.equal(formAction, "form-action 'self'");
  assert.doesNotMatch(p, /buttondown/i);
});

test("GA sources are absent by default and add only GA4 script/measurement origins when enabled", () => {
  assert.doesNotMatch(buildPolicy([]), /google|doubleclick/);
  const enabled = buildPolicy([], { googleTagEnabled: true });
  const directives = new Map(enabled.split("; ").map((d: string) => {
    const [name, ...sources] = d.split(" ");
    return [name, sources];
  }));
  assert.deepEqual(GOOGLE_ANALYTICS, {
    scriptSrc: ["https://www.googletagmanager.com"],
    connectSrc: ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com"],
  });
  assert.deepEqual(directives.get("script-src"), [
    "'self'", "'wasm-unsafe-eval'", "https://static.cloudflareinsights.com", ...GOOGLE_ANALYTICS.scriptSrc,
  ]);
  assert.deepEqual(directives.get("connect-src"), [
    "'self'", "https://cloudflareinsights.com", ...GOOGLE_ANALYTICS.connectSrc,
  ]);
  assert.doesNotMatch(enabled, /doubleclick|googleadservices|googlesyndication|https:\/\/(?:\*\.)?google\.com(?: |;)|'unsafe-eval'/);
});

test("enabling GA preserves all other restrictions and the 2,000-character cap", () => {
  const defaults = buildPolicy([]).split("; ");
  const enabled = buildPolicy([], { googleTagEnabled: true }).split("; ");
  const unchanged = (directives: string[]) => directives.filter((d) => !/^(?:script|connect)-src /.test(d));
  assert.deepEqual(unchanged(enabled), unchanged(defaults));
  assert.equal(MAX_HEADER_LENGTH, 2000);
  assert.doesNotMatch(enabled.find((d: string) => d.startsWith("script-src "))!, /'unsafe-inline'|'unsafe-eval'|https:\s|\*\s/);
});

test("the postbuild command uses the same Cloudflare main gate and fails before writing over-limit CSP", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "dp-csp-ga-"));
  const headersPath = path.join(fixture, "_headers");
  const originalHeaders = "/*\n  X-Frame-Options: DENY\n";
  const command = fileURLToPath(new URL("../../scripts/build/csp-hashes.mjs", import.meta.url));
  const env = { ...process.env };
  delete env.CF_PAGES;
  delete env.CF_PAGES_BRANCH;
  try {
    writeFileSync(path.join(fixture, "index.html"), "<script>window.dataLayer=[];</script>");
    for (const [extra, expected] of [
      [{}, false],
      [{ CF_PAGES: "1", CF_PAGES_BRANCH: "preview" }, false],
      [{ CF_PAGES: "1", CF_PAGES_BRANCH: "main" }, true],
    ] as const) {
      writeFileSync(headersPath, originalHeaders);
      const result = spawnSync(process.execPath, [command, fixture], { env: { ...env, ...extra }, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      const headers = readFileSync(headersPath, "utf8");
      assert.equal(headers.includes("https://www.googletagmanager.com"), expected);
      assert.ok(headers.includes(hashSource("window.dataLayer=[];")));
      const cspLine = headers.split("\n").find((line) => line.includes("Content-Security-Policy:"))!;
      assert.ok(cspLine.length <= MAX_HEADER_LENGTH);
    }
    writeFileSync(headersPath, originalHeaders);
    writeFileSync(path.join(fixture, "index.html"), Array.from({ length: 40 }, (_, i) => `<script>var distinct${i}=${i};</script>`).join(""));
    const oversized = spawnSync(process.execPath, [command, fixture], {
      env: { ...env, CF_PAGES: "1", CF_PAGES_BRANCH: "main" }, encoding: "utf8",
    });
    assert.equal(oversized.status, 1);
    assert.match(oversized.stderr, /2,?000|2000/);
    assert.equal(readFileSync(headersPath, "utf8"), originalHeaders);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("injectHeader appends into the /* block and replaces an older CSP line", () => {
  const body = "# c\n/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: old\n\n/_astro/*\n  Cache-Control: x\n";
  const out = injectHeader(body, "  Content-Security-Policy: new");
  assert.equal(out, "# c\n/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: new\n\n/_astro/*\n  Cache-Control: x\n");
  assert.throws(() => injectHeader("/_astro/*\n  Cache-Control: x\n", "  X: y"));
});

test("a comment that mentions <script> does not mis-cut the next real script", () => {
  // BaseLayout.astro has exactly this: a comment saying Astro inlines the
  // module "as one <script type=\"module\">", followed by the real one. The
  // first version of this script hashed the comment tail plus the module and
  // every page was refused one script in the browser.
  const html = `<!-- inlined as one <script type="module"> at this size --><script type="module">real()</script>`;
  const scripts = extractInlineScripts(html);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].body, "real()");
});

test("<!-- inside a script body is text, and handler-like text in scripts is ignored", () => {
  const html = `<script>var a = "<!-- x"; var b = '<img onerror=y>';</script><p>ok</p>`;
  const scripts = extractInlineScripts(html);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].body, `var a = "<!-- x"; var b = '<img onerror=y>';`);
  assert.deepEqual(findInlineHandlers(html), []);
});
