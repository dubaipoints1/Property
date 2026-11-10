// Source-level recurrence guards, not a browser or WCAG certification.
// The separate before/after render record checks actual target rectangles,
// native-radio interaction and header/hero geometry in the built pages.
// 44px is the house target; WCAG 2.1's 2.5.5 is AAA, with exceptions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
const header = read("src/components/Header.astro");
const footer = read("src/components/Footer.astro");
const home = read("src/pages/index.astro");
const global = read("src/styles/global.css");
const homeGlobal = read("src/styles/home-global.css");

function rule(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...source.matchAll(new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`, "g"))];
  assert.ok(matches.length, `Missing ${selector} rule`);
  return matches[0][1];
}

function houseTarget(css: string, inline = false) {
  assert.match(css, /display:\s*inline-flex\s*;/);
  assert.match(css, /align-items:\s*center\s*;/);
  assert.match(css, /min-block-size:\s*var\(--dp-ui-control\)\s*;/);
  if (inline) assert.match(css, /min-inline-size:\s*var\(--dp-ui-control\)\s*;/);
  assert.doesNotMatch(css, /position:\s*absolute|inset:\s*-/);
}

test("header wordmark enlarges the native anchor without changing the fixed header or lettering", () => {
  houseTarget(rule(header, ".dp-wordmark"));
  assert.match(rule(header, ".dp-header-inner"), /height:\s*56px\s*;/);
  assert.match(rule(header, ".dp-wordmark-text"), /font-size:\s*22px\s*;/);
  assert.match(header, /<a href="\/" class="dp-wordmark" aria-label="DubaiPoints home">/);
});

test("footer brand, short navigation and standalone contact use real non-overlapping link targets", () => {
  houseTarget(rule(footer, ".dp-footer-wordmark"));
  houseTarget(rule(footer, ".dp-footer-col a"), true);
  houseTarget(rule(footer, ".dp-footer-bottom a"));
  assert.match(footer, /<a href="mailto:info@dubaipoints\.ae">info@dubaipoints\.ae<\/a>/);
  assert.match(footer, /\.dp-footer a:focus-visible\s*\{[^}]*outline:/);
});

test("every homepage more/trust link receives the shared target rather than only the newest sections", () => {
  houseTarget(rule(home, ".hp-more"));
  houseTarget(rule(home, ".hp-close-links a"));
  assert.doesNotMatch(home, /#latest \.hp-more, \.hp-guide-section \.hp-more\s*\{/,
    "do not restore the partial exception that left older controls undersized");
});

test("goal labels, not invisible radio rectangles, own the touch area in both stylesheet deliveries", () => {
  const labels = rule(global, ".dps-pills label");
  houseTarget(labels);
  assert.equal(rule(homeGlobal, ".dps-pills label"), labels);
  const radio = rule(global, ".dps-radio");
  assert.match(radio, /opacity:\s*0\s*;/);
  assert.doesNotMatch(radio, /display:\s*none|visibility:\s*hidden/);
  for (const goal of ["travel", "cashback", "welcome", "first"]) {
    assert.match(home, new RegExp(`<input type="radio" name="dps-goal" id="dps-${goal}" class="dps-radio"`));
    assert.ok(global.includes(`#dps-${goal}:focus-visible ~ .dps-pills label[for="dps-${goal}"]`));
    assert.ok(global.includes(`#dps-${goal}:checked ~ .dps-panel.is-${goal}`));
  }
});
