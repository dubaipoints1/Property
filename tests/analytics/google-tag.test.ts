import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { shouldLoadGoogleTag } from "../../src/lib/googleTag.mjs";
import { googleTagBootstrapSource } from "../../src/lib/deferredGoogleTag.mjs";
import { hashSource, buildPolicy, findInlineHandlers } from "../../scripts/build/csp-hashes.mjs";

const source = readFileSync(new URL("../../src/layouts/BaseLayout.astro", import.meta.url), "utf8");
const head = source.match(/<head>([\s\S]*?)<\/head>/)![1];

test("one shared hash-approved scheduler replaces the eager vendor request and initialiser", () => {
  assert.equal((source.match(/set:html=\{googleTagBootstrapSource\}/g) ?? []).length, 1);
  assert.match(source, /import \{ googleTagBootstrapSource \} from "~\/lib\/deferredGoogleTag\.mjs"/);
  assert.match(head, /<script is:inline set:html=\{googleTagBootstrapSource\}><\/script>/);
  assert.doesNotMatch(source, /src="https:\/\/www\.googletagmanager\.com|\bgtag\s*\(/);
  assert.equal((googleTagBootstrapSource.match(/G-VS2RL6KX46/g) ?? []).length, 1);
  assert.doesNotMatch(googleTagBootstrapSource, /api_secret|user_id|user_properties|send_to|\bconsent\s*\(|localStorage|sessionStorage|fetch\s*\(|sendBeacon|XMLHttpRequest|requestIdleCallback|requestAnimationFrame|(?:window|document)\.addEventListener\(["'](?:scroll|load)/);
  const root = new URL("../../src/", import.meta.url);
  const tagFiles = readdirSync(root, { recursive: true }).filter(file => /\.(?:astro|tsx?|m?js)$/.test(file.toString())
    && /googletagmanager\.com\/gtag\/js/.test(readFileSync(new URL(file.toString(), root), "utf8")));
  assert.deepEqual(tagFiles.map(file => file.toString()), [path.join("lib", "deferredGoogleTag.mjs")]);
});

test("the scheduler retains the strict Cloudflare production/main predicate", () => {
  const gate = source.match(/const\s+(\w+)\s*=\s*shouldLoadGoogleTag\s*\(/)?.[1];
  assert.ok(gate);
  assert.match(source, /production:\s*import\.meta\.env\.PROD/);
  assert.match(source, /pages:\s*(?:import\.meta\.env\.CF_PAGES|process\.env\.CF_PAGES)/);
  assert.match(source, /branch:\s*(?:import\.meta\.env\.CF_PAGES_BRANCH|process\.env\.CF_PAGES_BRANCH)/);
  const gated = head.match(new RegExp(`\\{${gate}\\s*&&\\s*\\(([\\s\\S]*?)\\)\\}`));
  assert.ok(gated);
  assert.match(gated[1], /set:html=\{googleTagBootstrapSource\}/);
});

test("development, local/CI builds and Cloudflare previews never enable Google", () => {
  const cases = [
    { production: false, pages: "1", branch: "main" }, { production: true, pages: undefined, branch: undefined },
    { production: true, pages: undefined, branch: "main" }, { production: true, pages: "0", branch: "main" },
    { production: true, pages: "true", branch: "main" }, { production: true, pages: "1", branch: undefined },
    { production: true, pages: "1", branch: "codex/speed-coverage-utility" }, { production: true, pages: "1", branch: "preview" },
    { production: true, pages: "1", branch: "Main" }, { production: "true", pages: "1", branch: "main" },
  ];
  for (const input of cases) assert.equal(shouldLoadGoogleTag(input), false, JSON.stringify(input));
  assert.equal(shouldLoadGoogleTag({ production: true, pages: "1", branch: "main" }), true);
});

test("exact scheduler source is hash-authorised without new CSP origins or inline relaxation", () => {
  const hash = hashSource(googleTagBootstrapSource);
  const policy = buildPolicy([hash], { googleTagEnabled: true });
  const scriptSrc = policy.split("; ").find(directive => directive.startsWith("script-src "))!;
  assert.ok(scriptSrc.includes(hash));
  assert.ok(scriptSrc.includes("https://www.googletagmanager.com"));
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'|'unsafe-eval'/);
  assert.deepEqual(findInlineHandlers(`<script>${googleTagBootstrapSource}</script>`), []);
  assert.doesNotMatch(buildPolicy([], { googleTagEnabled: false }), /google|doubleclick/);
});
