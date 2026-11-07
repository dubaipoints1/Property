import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, root), "utf8");
const data = JSON.parse(read(".council/research/2026-11/whole-site-experience-review.json"));
const source = read("src/pages/dev/21st-site-directions.astro");

test("whole-site review accounts for every distinct route and family without claiming bespoke visual certification", () => {
  assert.equal(data.routes.length, data.scope.routeCount);
  assert.equal(new Set(data.routes.map((r: {route: string}) => r.route)).size, data.routes.length);
  assert.equal(Object.keys(data.familyPlans).length, data.scope.familyCount);
  assert.equal(Object.values(data.familyPlans).reduce((n: number, f: any) => n + f.count, 0), data.routes.length);
  assert.equal(data.routes.filter((r: any) => r.renderedRepresentative).length, data.scope.renderedRoutes);
  assert.ok(data.scope.renderedRoutes < data.scope.routeCount);
  assert.ok(data.scope.limits.some((limit: string) => limit.includes("Safari")));
});

test("review evidence points at existing files and actual source lines", () => {
  for (const finding of data.findings) for (const ref of finding.sources) {
    assert.ok(existsSync(new URL(ref.file, root)), `${finding.id}: ${ref.file}`);
    assert.ok(ref.line > 0 && ref.line <= read(ref.file).split("\n").length, `${finding.id}: ${ref.file}:${ref.line}`);
  }
});

test("full-homepage options remain private and keep direct reader destinations", () => {
  assert.match(source, /noindex,nofollow/);
  assert.match(read("astro.config.mjs"), /!page\.includes\("\/dev\/"\)/);
  assert.match(read("scripts/build/prune-internal-pages.mjs"), /INTERNAL_ROUTE_DIRS = \["dev"/);
  for (const direction of data.directions) assert.ok(source.includes(direction.id));
  assert.match(source, /href=\{`\/news\/\$\{post.id\}\/`\} data-atlas-story-link/);
  assert.match(source, /data-atlas-select=\{index\}/);
  assert.doesNotMatch(source, /<video|setInterval\(|requestAnimationFrame\(|document\.body\.style/);
});

test("prototype imagery, fallback and motion contracts are explicit", () => {
  assert.match(source, /Card image: <a/);
  assert.match(source, /<ImageCredit/);
  assert.match(source, /object-fit: contain/);
  assert.match(source, /data-atlas-select=\{index\}[^>]+hidden|hidden data-atlas-select=\{index\}/);
  assert.match(source, /reducedMotion\.addEventListener\("change"/);
  assert.match(source, /entranceObserver\?\.disconnect\(\)/);
  assert.match(source, /animation\.cancel\(\)/);
  assert.match(source, /aria-controls/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
});
