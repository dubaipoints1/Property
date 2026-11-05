import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { shouldLoadGoogleTag } from "../../src/lib/googleTag.mjs";
import { extractInlineScripts, getAttr, hashSource, buildPolicy } from "../../scripts/build/csp-hashes.mjs";

const source = readFileSync(new URL("../../src/layouts/BaseLayout.astro", import.meta.url), "utf8");
const head = source.match(/<head>([\s\S]*?)<\/head>/)![1];
const measurementId = "G-VS2RL6KX46";
const googleUrl = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
const scripts = extractInlineScripts(head);
const loader = scripts.filter((script: { attrs: string }) => getAttr(script.attrs, "src")?.includes("googletagmanager.com"));
const initialisers = scripts.filter((script: { body: string }) => /\bgtag\s*\(/.test(script.body));

test("the supplied Google tag appears once, high in the single shared head", () => {
  assert.equal(loader.length, 1);
  assert.equal(getAttr(loader[0].attrs, "src"), googleUrl);
  assert.notEqual(getAttr(loader[0].attrs, "async"), null);
  assert.notEqual(getAttr(loader[0].attrs, "is:inline"), null);
  assert.equal(initialisers.length, 1);
  assert.equal(initialisers[0].executable, true);
  assert.notEqual(getAttr(initialisers[0].attrs, "is:inline"), null);
  assert.equal((source.match(/G-VS2RL6KX46/g) ?? []).length, 2);
  assert.ok(head.indexOf(googleUrl) < head.indexOf('rel="stylesheet"'));
  assert.ok(scripts.indexOf(loader[0]) < scripts.indexOf(initialisers[0]));

  const root = new URL("../../src/", import.meta.url);
  const tagFiles = readdirSync(root, { recursive: true }).filter((file) => {
    if (!/\.(?:astro|tsx?|m?js)$/.test(file.toString())) return false;
    return /googletagmanager\.com\/gtag\/js/.test(readFileSync(new URL(file.toString(), root), "utf8"));
  });
  assert.deepEqual(tagFiles.map((file) => file.toString()), [path.join("layouts", "BaseLayout.astro")]);
});

test("the unmodified initialiser queues only the standard js and config commands", () => {
  assert.equal(initialisers.length, 1);
  const context: Record<string, unknown> = {};
  context.window = context;
  runInNewContext(initialisers[0].body, context);
  const queue = (context.dataLayer as ArrayLike<unknown>[]).map((args) => Array.from(args));
  assert.equal(queue.length, 2);
  assert.equal(queue[0][0], "js");
  assert.equal(Object.prototype.toString.call(queue[0][1]), "[object Date]");
  assert.deepEqual(queue[1], ["config", measurementId]);
  assert.doesNotMatch(initialisers[0].body, /api_secret|user_id|user_properties|send_to|consent|localStorage|sessionStorage|fetch\s*\(|sendBeacon|XMLHttpRequest/);
});

test("both tag scripts use the shared strict Cloudflare production/main gate", () => {
  const gate = source.match(/const\s+(\w+)\s*=\s*shouldLoadGoogleTag\s*\(/)?.[1];
  assert.ok(gate, "BaseLayout must call the tested production predicate");
  assert.match(source, /production:\s*import\.meta\.env\.PROD/);
  assert.match(source, /pages:\s*(?:import\.meta\.env\.CF_PAGES|process\.env\.CF_PAGES)/);
  assert.match(source, /branch:\s*(?:import\.meta\.env\.CF_PAGES_BRANCH|process\.env\.CF_PAGES_BRANCH)/);
  const gated = head.match(new RegExp(`\\{${gate}\\s*&&\\s*\\(([\\s\\S]*?)\\)\\}`));
  assert.ok(gated, "both tag scripts must live inside the conditional fragment");
  assert.equal(extractInlineScripts(gated[1]).length, 2);
  assert.ok(gated[1].includes(googleUrl));
  assert.ok(gated[1].includes(initialisers[0].body));
});

test("development, local/CI builds and Cloudflare previews never enable Google", () => {
  const cases = [
    { production: false, pages: "1", branch: "main" },
    { production: true, pages: undefined, branch: undefined },
    { production: true, pages: undefined, branch: "main" },
    { production: true, pages: "0", branch: "main" },
    { production: true, pages: "true", branch: "main" },
    { production: true, pages: "1", branch: undefined },
    { production: true, pages: "1", branch: "codex/google-analytics-header" },
    { production: true, pages: "1", branch: "preview" },
    { production: true, pages: "1", branch: "Main" },
    { production: "true", pages: "1", branch: "main" },
  ];
  for (const input of cases) assert.equal(shouldLoadGoogleTag(input), false, JSON.stringify(input));
  assert.equal(shouldLoadGoogleTag({ production: true, pages: "1", branch: "main" }), true);
});

test("the exact Google initialiser is hash-authorised, without inline-script relaxation", () => {
  assert.equal(initialisers.length, 1);
  const hash = hashSource(initialisers[0].body);
  const policy = buildPolicy([hash], { googleTagEnabled: true });
  const scriptSrc = policy.split("; ").find((directive: string) => directive.startsWith("script-src "))!;
  assert.ok(scriptSrc.includes(hash));
  assert.ok(scriptSrc.includes("https://www.googletagmanager.com"));
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'|'unsafe-eval'/);
});
