import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  extractIds,
  extractFragmentHrefs,
  checkFragments,
  extractFormActions,
  checkFormActions,
} from "../../scripts/ci/check-fragments.mjs";

function fixtureDist(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "dp-fragments-"));
  mkdirSync(path.join(dir, "cards", "x"), { recursive: true });
  mkdirSync(path.join(dir, "guides", "y"), { recursive: true });
  mkdirSync(path.join(dir, "search"), { recursive: true });
  writeFileSync(path.join(dir, "index.html"), `<h1 id="top">home</h1>`);
  writeFileSync(
    path.join(dir, "cards", "x", "index.html"),
    `<h2 id="earn-rates">Earn</h2><a href="#earn-rates">same page ok</a><a href="#fee-summary">same page missing</a>
     <a href="/guides/y/#faq">cross page ok</a><a href="/guides/y/#nope">cross page missing</a><a href="/gone/#x">missing page</a>
     <a href="#">bare</a><a href="#top">top</a><a href="/friday-brief#f">redirect</a><a href="https://x.example/#ext">external</a>`,
  );
  writeFileSync(path.join(dir, "guides", "y", "index.html"), `<section id="faq"></section><a name="legacy&amp;anchor"></a>`);
  writeFileSync(
    path.join(dir, "search", "index.html"),
    `<form action="/" method="get"><input name="q"></form><form action="/missing/" method="post"></form><form action="/search/"><input name="q"></form>`,
  );
  return dir;
}

test("extractIds picks up id attributes and <a name>, entity-decoded", () => {
  const ids = extractIds(`<h2 id="earn-rates"></h2><div id='single'></div><a name="legacy&amp;anchor"></a><span id=""></span>`);
  assert.deepEqual([...ids].sort(), ["earn-rates", "legacy&anchor", "single"]);
});

test("extractFragmentHrefs handles #f, /x/#f and /x#f and skips bare, top, text and external fragments", () => {
  const hrefs = extractFragmentHrefs(
    `<a href="#a"></a><a href="/x/#b"></a><a href="/x#c"></a><a href="#"></a><a href="#top"></a><a href="/x/#:~:text=hi"></a><a href="https://e.com/#d"></a><a href="//cdn/#e"></a>`,
  );
  assert.deepEqual(hrefs, [
    { href: "#a", path: null, fragment: "a" },
    { href: "/x/#b", path: "/x/", fragment: "b" },
    { href: "/x#c", path: "/x", fragment: "c" },
  ]);
});

test("checkFragments reports same-page ok, cross-page ok, cross-page missing and missing pages", () => {
  const dist = fixtureDist();
  const r = checkFragments(dist, new Set(["/friday-brief"]));
  assert.equal(r.ok, false);
  assert.equal(r.checked, 5); // #earn-rates, #fee-summary, /guides/y/#faq, /guides/y/#nope, /gone/#x (redirect skipped)
  assert.deepEqual(
    r.broken.map((b) => [b.href, b.targetFile, b.fragment]),
    [
      ["#fee-summary", path.join("cards", "x", "index.html"), "fee-summary"],
      ["/guides/y/#nope", path.join("guides", "y", "index.html"), "nope"],
    ],
  );
  assert.deepEqual(r.missingTargets, [{ file: path.join("cards", "x", "index.html"), href: "/gone/#x" }]);
});

test("redirect sources are skipped rather than reported as missing", () => {
  const dist = fixtureDist();
  const withRedirect = checkFragments(dist, new Set(["/friday-brief"]));
  const without = checkFragments(dist, new Set());
  assert.equal(without.missingTargets.length, withRedirect.missingTargets.length + 1);
});

test("form actions: missing targets are reported and GET forms posting to / are warned", () => {
  const dist = fixtureDist();
  assert.deepEqual(extractFormActions(`<form action="/a/" method="POST"></form><form action="https://x/"></form><form action="/b/"></form>`), [
    { action: "/a/", method: "post" },
    { action: "/b/", method: "get" },
  ]);
  const r = checkFormActions(dist);
  assert.deepEqual(r.missing.map((m) => m.action), ["/missing/"]);
  assert.deepEqual(r.warnings.map((w) => [w.action, w.method]), [["/", "get"]]);
});
