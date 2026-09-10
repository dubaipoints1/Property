// Unit tests for the render-probe helpers (scripts/audit/_lib.mjs).
// The probe itself needs Chromium and a built dist/; these pin the pure
// classification rules — what counts as overflow, a generic link, a small
// tap target, a CLS session — so a refactor cannot silently loosen the
// 2026-09-06 audit's findings.

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
  analyseHeadings,
  classifyImage,
  classifyLink,
  classifyTapTarget,
  clsFromShifts,
  computeLinkName,
  deriveRoutes,
  detectPlaywrightChromium,
  median,
  normaliseLinkText,
  pickOverflowOffenders,
  routeFromHtmlPath,
  routeToSlug,
  stableStringify,
  sumBytesBefore,
  summariseProbes,
  templateForRoute,
  // eslint-disable-next-line import/extensions
} from "../../scripts/audit/_lib.mjs";

test("routeFromHtmlPath maps index, nested index and bare html files", () => {
  assert.equal(routeFromHtmlPath("index.html"), "/");
  assert.equal(routeFromHtmlPath(path.join("cards", "x", "index.html")), "/cards/x/");
  assert.equal(routeFromHtmlPath("404.html"), "/404.html");
});

test("deriveRoutes sorts and dedupes; routeToSlug is filesystem-safe and injective", () => {
  const routes = deriveRoutes(["cards/x/index.html", "index.html", "cards/x/index.html", "404.html", "banks/adcb/index.html"]);
  assert.deepEqual(routes, ["/", "/404.html", "/banks/adcb/", "/cards/x/"]);

  assert.equal(routeToSlug("/"), "root");
  assert.equal(routeToSlug("/cards/x/"), "cards__x");
  assert.equal(routeToSlug("/search/?q=a b"), "search__q-a-b");
  assert.equal(routeToSlug("/404.html"), "404.html");

  const many = [...routes, "/cards/x-y/", "/cards/x/y/", "/search/?q=a b", "/salary-transfer/aed-5000-to-8000/", "/cards/salary/5000/"];
  const slugs = many.map(routeToSlug);
  assert.equal(new Set(slugs).size, many.length, "distinct routes must produce distinct slugs");
  for (const s of slugs) assert.match(s, /^[A-Za-z0-9._-]+$/);

  // Every route also gets a template label by path pattern.
  assert.equal(templateForRoute("/cards/x/"), "CardReviewLayout");
  assert.equal(templateForRoute("/news/airlines/"), "NewsIndexLayout");
  assert.equal(templateForRoute("/news/some-story/"), "ArticleLayout (news)");
  assert.equal(templateForRoute("/salary-transfer/aed-5000-to-8000/"), "SalaryTransferTrackerLayout");
  assert.equal(templateForRoute("/about/"), "TrustPageLayout");
  assert.equal(templateForRoute("/no-such-thing/"), null);
});

test("analyseHeadings counts h1s, first-is-h1 and level skips", () => {
  assert.deepEqual(analyseHeadings([1, 2, 4, 2, 3]), { h1Count: 1, firstIsH1: true, skips: [{ index: 2, from: 2, to: 4 }] });
  assert.equal(analyseHeadings([2, 3]).firstIsH1, false);
  assert.equal(analyseHeadings([2, 3]).skips.length, 0);
  assert.equal(analyseHeadings([1, 1]).h1Count, 2);
  assert.deepEqual(analyseHeadings([]), { h1Count: 0, firstIsH1: false, skips: [] });
});

test("normaliseLinkText + classifyLink flag generic text and pass descriptive text", () => {
  assert.equal(normaliseLinkText("  Read   More → "), "read more");
  assert.equal(normaliseLinkText("Here…"), "here");
  assert.equal(normaliseLinkText("Details:"), "details");
  assert.deepEqual(classifyLink({ text: "here" }), { code: "generic-text", text: "here" });
  assert.deepEqual(classifyLink({ text: "Click here »" }), { code: "generic-text", text: "click here" });
  assert.equal(classifyLink({ text: "Compare ADCB cards" }), null);
  assert.equal(classifyLink({ text: "Read more", ariaLabel: "Read more about the ADCB 365 review" }), null);
});

test("computeLinkName follows ARIA precedence; nothing → empty-name", () => {
  const full = { text: "txt", ariaLabel: "label", ariaLabelledbyText: "labelledby", title: "title", imgAlts: ["alt"] };
  assert.deepEqual(computeLinkName(full), { name: "labelledby", source: "aria-labelledby" });
  assert.equal(computeLinkName({ ...full, ariaLabelledbyText: "" }).name, "label");
  assert.equal(computeLinkName({ ...full, ariaLabelledbyText: "", ariaLabel: null }).name, "txt");
  assert.equal(computeLinkName({ text: "  ", title: "title", imgAlts: ["Logo", ""] }).name, "Logo");
  assert.deepEqual(computeLinkName({ text: " \n ", title: "only title" }), { name: "only title", source: "title" });
  assert.deepEqual(computeLinkName({ text: "  ", imgAlts: [""] }), { name: "", source: null });
  assert.deepEqual(classifyLink({ text: "  ", imgAlts: [""] }), { code: "empty-name" });
});

test("classifyTapTarget: below-44, small (<24), inline exemption, ok", () => {
  assert.equal(classifyTapTarget({ w: 40, h: 40, display: "block", inTextBlock: false }), "below-44");
  assert.equal(classifyTapTarget({ w: 20, h: 20, display: "block", inTextBlock: false }), "small");
  assert.equal(classifyTapTarget({ w: 20, h: 18, display: "inline", inTextBlock: true }), "exempt-inline");
  assert.equal(classifyTapTarget({ w: 20, h: 18, display: "inline", inTextBlock: false }), "small");
  assert.equal(classifyTapTarget({ w: 48, h: 48, display: "inline-block", inTextBlock: true }), "ok");
  assert.equal(classifyTapTarget({ w: 120, h: 30, display: "block", inTextBlock: false }), "below-44");
});

test("pickOverflowOffenders sorts by overrun, honours tolerance, collapses descendants, caps", () => {
  const rects = [
    { selector: "div.wrap", left: 0, right: 420, width: 420, parentIndex: -1 }, // overrun 30
    { selector: "div.wrap > img", left: 0, right: 500, width: 500, parentIndex: 0 }, // child of offender → dropped
    { selector: "table", left: 0, right: 391, width: 391, parentIndex: -1 }, // within tolerance
    { selector: "pre", left: 0, right: 450, width: 450, parentIndex: -1 }, // overrun 60
    { selector: "aside", left: 300, right: 395, width: 95, parentIndex: -1 }, // overrun 5
  ];
  const out = pickOverflowOffenders(rects, 390);
  assert.deepEqual(
    out.map((o) => [o.selector, o.overrun]),
    [
      ["pre", 60],
      ["div.wrap", 30],
      ["aside", 5],
    ],
  );
  assert.deepEqual(pickOverflowOffenders(rects, 390, { max: 1 }).map((o) => o.selector), ["pre"]);
  assert.deepEqual(pickOverflowOffenders(rects, 390, { tolerance: 10 }).map((o) => o.selector), ["pre", "div.wrap"]);
  // A descendant whose ancestor is NOT offending is kept in its own right.
  const nested = [
    { selector: "main", left: 0, right: 380, width: 380, parentIndex: -1 },
    { selector: "main > code", left: 0, right: 600, width: 600, parentIndex: 0 },
  ];
  assert.deepEqual(pickOverflowOffenders(nested, 390).map((o) => o.selector), ["main > code"]);
});

test("classifyImage matrix", () => {
  const base = { alt: "x", hasWidth: true, hasHeight: true, hasAspectRatio: false, naturalWidth: 100, complete: true, loading: null, role: null, isHidden: false };
  assert.deepEqual(classifyImage(base), []);
  assert.deepEqual(classifyImage({ ...base, alt: null }), ["missing-alt"]);
  assert.deepEqual(classifyImage({ ...base, alt: "" }), []);
  assert.deepEqual(classifyImage({ ...base, hasWidth: false }), ["missing-dimensions"]);
  assert.deepEqual(classifyImage({ ...base, hasWidth: false, hasHeight: false, hasAspectRatio: true }), []);
  assert.deepEqual(classifyImage({ ...base, naturalWidth: 0 }), ["not-loaded"]);
  assert.deepEqual(classifyImage({ ...base, complete: false, loading: "lazy" }), []);
  assert.deepEqual(classifyImage({ ...base, complete: false, loading: "eager" }), ["not-loaded"]);
  assert.deepEqual(classifyImage({ ...base, alt: null, hasHeight: false, naturalWidth: 0 }), ["missing-alt", "missing-dimensions", "not-loaded"]);
  assert.deepEqual(classifyImage({ ...base, alt: null, isHidden: true }), []);
  assert.deepEqual(classifyImage({ ...base, alt: null, role: "presentation" }), []);
});

test("clsFromShifts uses session windows and ignores shifts after input", () => {
  // Two sessions separated by a >1 s gap: 0.1+0.2 vs 0.25 → 0.3.
  const shifts = [
    { value: 0.1, startTime: 100, hadRecentInput: false },
    { value: 0.2, startTime: 600, hadRecentInput: false },
    { value: 0.25, startTime: 3000, hadRecentInput: false },
    { value: 0.9, startTime: 3100, hadRecentInput: true },
  ];
  assert.equal(clsFromShifts(shifts), 0.3);
  // 5 s window cap: shifts every 900 ms for 7 s split into two windows.
  const long = Array.from({ length: 8 }, (_, i) => ({ value: 0.1, startTime: i * 900, hadRecentInput: false }));
  assert.equal(clsFromShifts(long), 0.6);
  assert.equal(clsFromShifts([]), 0);
  assert.equal(clsFromShifts([{ value: 0.12345, startTime: 0, hadRecentInput: false }]), 0.123);
});

test("sumBytesBefore and median edge cases", () => {
  const entries = [
    { endMs: 100, bytes: 1000 },
    { endMs: 900, bytes: 500 },
    { endMs: 901, bytes: 999 },
    { endMs: null, bytes: 5 },
  ];
  assert.equal(sumBytesBefore(entries, 900), 1500);
  assert.equal(sumBytesBefore(entries, 0), 0);
  assert.equal(sumBytesBefore([], 100), 0);
  assert.equal(median([]), null);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([1, null, 3] as number[]), 2);
});

test("detectPlaywrightChromium precedence: DP_CHROME_PATH > CHROME_PATH > highest chromium-<rev> > null", () => {
  const fs = {
    "/opt/pw/chromium-1194/chrome-linux/chrome": true,
    "/opt/pw/chromium-1201/chrome-linux/chrome": true,
    "/custom/chrome": true,
    "/env/chrome": true,
  } as Record<string, boolean>;
  const exists = (p: string) => !!fs[p];
  const listDir = (d: string) => (d === "/opt/pw" ? ["chromium-1194", "chromium-1201", "chromium_headless_shell-1201", "ffmpeg-1011"] : []);
  const base = { PLAYWRIGHT_BROWSERS_PATH: "/opt/pw", HOME: "/home/x" };

  assert.equal(detectPlaywrightChromium({ env: { ...base, DP_CHROME_PATH: "/custom/chrome", CHROME_PATH: "/env/chrome" }, listDir, exists }), "/custom/chrome");
  assert.equal(detectPlaywrightChromium({ env: { ...base, CHROME_PATH: "/env/chrome" }, listDir, exists }), "/env/chrome");
  assert.equal(detectPlaywrightChromium({ env: base, listDir, exists }), "/opt/pw/chromium-1201/chrome-linux/chrome");
  // A stale env path that does not exist falls through rather than being returned.
  assert.equal(detectPlaywrightChromium({ env: { ...base, CHROME_PATH: "/gone" }, listDir, exists }), "/opt/pw/chromium-1201/chrome-linux/chrome");
  assert.equal(detectPlaywrightChromium({ env: { HOME: "/home/x" }, listDir, exists }), null);
});

test("summariseProbes rolls up a two-route fixture; stableStringify is byte-identical on permuted keys", () => {
  const ok = {
    route: "/cards/x/",
    slug: "cards__x",
    template: "CardReviewLayout",
    status: "ok",
    httpStatus: 200,
    headings: { h1Count: 2, firstIsH1: true, skips: [{ index: 2, from: 2, to: 4 }] },
    images: { total: 3, issues: [{ selector: "img.hero", src: "/a.png", codes: ["missing-alt", "missing-dimensions"] }] },
    links: { total: 10, external: 1, issues: [{ selector: "a.more", href: "/x/", code: "generic-text", text: "read more" }] },
    console: { errors: [{ text: "boom" }], pageErrors: [], failedRequests: [], httpErrors: [], externalBlocked: 2 },
    metrics: { lcpMs: 800, cls: 0.02, domNodes: 900, transferredBytes: 204800 },
    focus: { desktop: { stops: [{}, {}], failures: [{ selector: "a.skip", text: "Skip", invisible: true }] }, mobile: { stops: [], failures: [] } },
    motion: { animationsNoPreference: 1, animationsReduced: 1, reducedOffenders: [{ animationName: "pulse", selector: "div.sk" }] },
    menu: { enterOpens: false, spaceOpens: false, escapeCloses: true },
    viewports: {
      "390": {
        overflow: { scrollWidth: 420, innerWidth: 390, offenders: [{ selector: "pre", overrun: 30 }] },
        tapTargets: { checked: 5, below44: 2, small: [] },
      },
      "1280": { overflow: { scrollWidth: 1280, innerWidth: 1280, offenders: [] } },
    },
    axe: {
      light: { violations: [{ id: "color-contrast", impact: "serious", help: "h", helpUrl: "u", nodeCount: 3, nodes: [{ target: "p.muted" }] }], incomplete: [], passes: 40 },
      dark: { violations: [{ id: "color-contrast", impact: "serious", help: "h", helpUrl: "u", nodeCount: 1, nodes: [{ target: "a.link" }] }] },
    },
  };
  const errored = { route: "/broken/", slug: "broken", template: "Custom page", status: "error", error: "route timed out", attempts: 3 };

  const s = summariseProbes([errored, ok]);
  assert.equal(s.totals.routes, 2);
  assert.equal(s.totals.done, 1);
  assert.equal(s.totals.errored, 1);
  assert.equal(s.totals.overflowRoutes, 1);
  assert.equal(s.totals.axeViolationRoutes, 1);
  assert.equal(s.totals.axeViolationNodes, 3);
  assert.equal(s.totals.imageIssues, 1);
  assert.equal(s.totals.linkIssues, 1);
  assert.equal(s.totals.focusFailures, 1);
  assert.equal(s.totals.consoleErrors, 1);
  assert.equal(s.totals.headingIssues, 2); // h1Count=2 + one skip
  assert.equal(s.totals.tapTargetIssues, 2);
  assert.equal(s.totals.menuFailures, 1);
  assert.deepEqual(Object.keys(s.overflowByViewport), ["390"]);
  assert.equal(s.overflowByViewport["390"][0].offender, "pre");
  assert.deepEqual(s.byRoute.map((r) => r.route), ["/cards/x/"]);
  assert.deepEqual(s.byRoute[0].overflowViewports, ["390"]);
  assert.equal(s.axeByRule.length, 1);
  assert.deepEqual(s.axeByRule[0].routes, ["/cards/x/"]);
  assert.equal(s.axeByRule[0].nodeCount, 3);
  assert.equal(s.axeByRule[0].example.target, "p.muted");
  assert.equal(s.darkContrastByRule[0].nodeCount, 1);
  assert.deepEqual(s.genericTextByLabel.map((g) => [g.text, g.count]), [["read more", 1]]);
  assert.deepEqual(s.imagesByCode.map((g) => g.code), ["missing-alt", "missing-dimensions"]);
  assert.deepEqual(s.focusFailures.map((f) => [f.route, f.mode, f.invisibleCount]), [["/cards/x/", "desktop", 1]]);
  assert.equal(s.motionOffenders[0].offenders[0].animationName, "pulse");
  assert.deepEqual(s.metricsByTemplate.CardReviewLayout.lcpMs, { median: 800, p75: 800 });
  assert.equal(s.metricsByTemplate.CardReviewLayout.routes, 1);
  assert.deepEqual(s.erroredRoutes, [{ route: "/broken/", error: "route timed out", attempts: 3 }]);

  const a = stableStringify({ b: 1, a: { z: [3, { y: 1, x: 2 }], k: null }, c: "s" });
  const b = stableStringify({ c: "s", a: { k: null, z: [3, { x: 2, y: 1 }] }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, JSON.stringify({ a: { k: null, z: [3, { x: 2, y: 1 }] }, b: 1, c: "s" }, null, 2));
  assert.equal(stableStringify(summariseProbes([errored, ok])), stableStringify(summariseProbes([ok, errored])));
});
