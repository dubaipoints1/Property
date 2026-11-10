import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rename, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PROGRAMME_STYLE_ROUTES, inlineProgrammeStyles } from "../../scripts/build/programme-style-delivery.mjs";
import { transformProgrammeStyles, transformHomepageStyles } from "../../scripts/build/home-style-delivery.mjs";
import { extractInlineScripts } from "../../scripts/build/csp-hashes.mjs";

const css = '@font-face{font-family:Newsreader;src:url("/_astro/font.woff2")}\n:root{--ink:#19282a}.photo{background:url(/images/photo.jpg)}';
const secondCss = '.programme{color:var(--ink)}@media(max-width:479px){.programme{display:grid}}';
const links = '<link rel="stylesheet" href="/_astro/a.css"><script>window.stage="between";</script><link rel="stylesheet" href="/_astro/b.css">';
const documentFor = (route: string) => `<!doctype html><html><head><meta charset="utf-8"><link rel="canonical" href="https://dubaipoints.ae${route}"><script>window.theme="dark";</script>${links}</head><body><section data-programme-hub="${route.split("/").filter(Boolean).at(-1)}"><h1>Programme</h1><details><summary>More</summary>Original prose</details></section><noscript>Still readable</noscript></body></html>`;
const marker = /<style data-dp-programme-css="([^"]+)" data-dp-css-sha256="([a-f0-9]{64})">([\s\S]*?)<\/style>/g;
const hash = (text: string) => createHash("sha256").update(text).digest("hex");

test("programme transform preserves exact CSS, cascade positions, scripts and all remaining HTML", () => {
  const before = documentFor(PROGRAMME_STYLE_ROUTES[0]);
  const result = transformProgrammeStyles(before, (href: string) => href.endsWith("/a.css") ? css : secondCss);
  const styles = [...result.html.matchAll(marker)];
  assert.equal(styles.length, 2);
  assert.deepEqual(styles.map(style => style[3]), [css, secondCss]);
  for (const style of styles) assert.equal(style[2], hash(style[3]));
  const reversed = result.html.replace(marker, (_all: string, href: string) => `<link rel="stylesheet" href="${href}">`);
  assert.equal(reversed, before);
  assert.deepEqual(extractInlineScripts(result.html), extractInlineScripts(before));
  assert.equal(result.html.slice(result.html.indexOf("<body")), before.slice(before.indexOf("<body")));
  assert.equal(transformProgrammeStyles(result.html, () => { throw Error("unexpected asset reread"); }).html, result.html);
  assert.doesNotMatch(result.html, /data-dp-home-css/);
  assert.match(transformHomepageStyles(before, () => css).html, /data-dp-home-css/);
});

test("programme transform shares the existing fail-closed CSS and link semantics", () => {
  for (const badCss of ['@import "late.css";', '.x{background:url(../photo.jpg)}', '.x{background:image-set("x.jpg" 1x)}', '.x{content:"</style>"}', '.x{src:u\\72l(relative.woff2)}']) {
    assert.throws(() => transformProgrammeStyles(documentFor(PROGRAMME_STYLE_ROUTES[0]), () => badCss));
  }
  for (const badLink of ['<link rel="stylesheet" href="https://outside.example/a.css">', '<link rel="stylesheet" href="/_astro/a.css" media="print">', '<link rel="stylesheet" href="/_astro/../a.css">']) {
    assert.throws(() => transformProgrammeStyles(documentFor(PROGRAMME_STYLE_ROUTES[0]).replace(links, badLink), () => css));
  }
  const valid = transformProgrammeStyles(documentFor(PROGRAMME_STYLE_ROUTES[0]), () => css).html;
  assert.throws(() => transformProgrammeStyles(valid.replace("--ink:#19282a", "--ink:red"), () => css), /fingerprint/);
});

async function withFixture(run: (state: { root: string; dist: string; originals: Map<string, string> }) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), "dp-programme-style-test-"));
  const dist = path.join(root, "dist");
  const originals = new Map<string, string>();
  try {
    await mkdir(path.join(dist, "_astro"), { recursive: true });
    await writeFile(path.join(dist, "_astro/a.css"), css);
    await writeFile(path.join(dist, "_astro/b.css"), secondCss);
    for (const route of [...PROGRAMME_STYLE_ROUTES, "/", "/cards/", "/news/example/", "/hotels/unknown/"]) {
      const file = path.join(dist, route.slice(1), "index.html");
      await mkdir(path.dirname(file), { recursive: true });
      const html = documentFor(route);
      originals.set(file, html);
      await writeFile(file, html);
    }
    await run({ root, dist, originals });
  } finally {
    await rm(root, { recursive: true, force: true }); // This test's isolated fixture only.
  }
}

const assertUnchanged = async (originals: Map<string, string>) => {
  for (const [file, html] of originals) assert.equal(await readFile(file, "utf8"), html);
};

test("runner changes only the ten exact routes; assets/homepage/other outputs retain exact bytes", async () => withFixture(async ({ dist, originals }) => {
  assert.equal(new Set(PROGRAMME_STYLE_ROUTES).size, 10);
  const assetsBefore = await Promise.all(["a.css", "b.css"].map(name => readFile(path.join(dist, "_astro", name))));
  const result = await inlineProgrammeStyles(dist);
  assert.deepEqual(result.map(item => item.route), PROGRAMME_STYLE_ROUTES);
  assert.ok(result.every(item => item.inlinedCount === 2));
  for (const [file, html] of originals) {
    const after = await readFile(file, "utf8");
    const targeted = PROGRAMME_STYLE_ROUTES.some(route => file === path.join(dist, route.slice(1), "index.html"));
    assert.equal(after === html, !targeted);
    if (targeted) assert.equal(after.replace(marker, (_all: string, href: string) => `<link rel="stylesheet" href="${href}">`), html);
  }
  assert.deepEqual(await Promise.all(["a.css", "b.css"].map(name => readFile(path.join(dist, "_astro", name)))), assetsBefore);
  assert.ok((await inlineProgrammeStyles(dist)).every(item => item.inlinedCount === 0));
}));

test("bad final route identity aborts before writing any earlier route", async () => withFixture(async ({ dist, originals }) => {
  const final = path.join(dist, PROGRAMME_STYLE_ROUTES.at(-1)!.slice(1), "index.html");
  const wrong = originals.get(final)!.replace('data-programme-hub="world-of-hyatt"', 'data-programme-hub="wrong-programme"');
  await writeFile(final, wrong);
  originals.set(final, wrong);
  await assert.rejects(inlineProgrammeStyles(dist), /identity/);
  await assertUnchanged(originals);
}));

test("wrong canonical and missing routes fail closed", async () => {
  await withFixture(async ({ dist, originals }) => {
    const final = path.join(dist, PROGRAMME_STYLE_ROUTES.at(-1)!.slice(1), "index.html");
    const wrong = originals.get(final)!.replace("https://dubaipoints.ae/hotels/world-of-hyatt/", "https://outside.example/hotels/world-of-hyatt/");
    await writeFile(final, wrong); originals.set(final, wrong);
    await assert.rejects(inlineProgrammeStyles(dist), /identity/); await assertUnchanged(originals);
  });
  await withFixture(async ({ dist, originals }) => {
    const final = path.join(dist, PROGRAMME_STYLE_ROUTES.at(-1)!.slice(1), "index.html");
    await unlink(final); originals.delete(final);
    await assert.rejects(inlineProgrammeStyles(dist)); await assertUnchanged(originals);
  });
  for (const variant of ["comment-canonical", "script-canonical", "duplicate-canonical", "comment-hub", "script-hub"]) await withFixture(async ({ dist, originals }) => {
    const route = PROGRAMME_STYLE_ROUTES.at(-1)!;
    const final = path.join(dist, route.slice(1), "index.html");
    const canonical = `<link rel="canonical" href="https://dubaipoints.ae${route}">`;
    const hub = '<section data-programme-hub="world-of-hyatt">';
    let wrong = originals.get(final)!;
    if (variant === "comment-canonical" || variant === "script-canonical") {
      wrong = wrong.replace(canonical, canonical.replace("dubaipoints.ae", "outside.example"));
      wrong = wrong.replace("</head>", (variant === "comment-canonical" ? `<!--${canonical}-->` : `<script>window.example=${JSON.stringify(canonical)};</script>`) + "</head>");
    } else if (variant === "duplicate-canonical") wrong = wrong.replace("</head>", canonical + "</head>");
    else {
      wrong = wrong.replace(hub, '<section data-programme-hub="wrong">');
      wrong = wrong.replace("</body>", (variant === "comment-hub" ? `<!--${hub}-->` : `<script>window.example=${JSON.stringify(hub)};</script>`) + "</body>");
    }
    await writeFile(final, wrong); originals.set(final, wrong);
    await assert.rejects(inlineProgrammeStyles(dist), /identity/, variant); await assertUnchanged(originals);
  });
});

test("missing/invalid/shared CSS never produces a partially transformed set", async () => {
  for (const mode of ["missing", "unsafe", "invalid-utf8"]) await withFixture(async ({ dist, originals }) => {
    const target = path.join(dist, "_astro/b.css");
    if (mode === "missing") await unlink(target);
    if (mode === "unsafe") await writeFile(target, '@import "late.css";');
    if (mode === "invalid-utf8") await writeFile(target, Buffer.from([0xff]));
    await assert.rejects(inlineProgrammeStyles(dist)); await assertUnchanged(originals);
  });
});

test("symlinked programme ancestors, HTML and CSS cannot write outside the build", async () => {
  for (const target of ["html", "asset", "directory", "astro-directory", "dist"]) await withFixture(async ({ root, dist, originals }) => {
    const route = PROGRAMME_STYLE_ROUTES.at(-1)!;
    if (target === "html" || target === "asset") {
      const file = target === "html" ? path.join(dist, route.slice(1), "index.html") : path.join(dist, "_astro/a.css");
      const outside = path.join(root, "outside"); const before = await readFile(file);
      await writeFile(outside, before); await unlink(file); await symlink(outside, file);
      await assert.rejects(inlineProgrammeStyles(dist), /contained|symlink/);
      assert.deepEqual(await readFile(outside), before);
      if (target === "html") originals.delete(file);
      await assertUnchanged(originals);
    } else {
      const file = target === "dist" ? dist : target === "astro-directory" ? path.join(dist, "_astro") : path.join(dist, "hotels/world-of-hyatt");
      const outside = path.join(root, "outside-dir");
      await rename(file, outside); await symlink(outside, file, "dir");
      await assert.rejects(inlineProgrammeStyles(dist), /contained|real|symlink/);
      await assertUnchanged(originals);
    }
  });
});

test("programme delivery runs before index/CSP/link gates without replacing the homepage pass", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  const sequence = ["home-style-delivery.mjs", "programme-style-delivery.mjs", "pagefind --site dist", "csp-hashes.mjs", "check-links.mjs"].map(name => pkg.scripts.postbuild.indexOf(name));
  assert.ok(sequence.every((position, index) => position >= 0 && (index === 0 || position > sequence[index - 1])));
});
