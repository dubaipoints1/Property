import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { currentReadingSection, editorialRailBounds, preserveEditorialRailFocus } from "../../src/lib/editorialNavigation";

test("reading starts with first section and remains there between headings", () => {
  assert.equal(currentReadingSection([], 120), -1);
  assert.equal(currentReadingSection([500, 1000, 2000], 120), 0);
  assert.equal(currentReadingSection([-100, 450, 1500], 120), 0);
  assert.equal(currentReadingSection([-1000, -450, 600], 120), 1);
  assert.equal(currentReadingSection([-1000, -450, -100], 120), 2);
});
test("reading line includes an exact heading boundary and supports back-scroll", () => {
  assert.equal(currentReadingSection([-600, 120, 700], 120), 1);
  assert.equal(currentReadingSection([-300, 121, 900], 120), 0);
});
test("rail controls distinguish start, middle, end and no overflow", () => {
  assert.deepEqual(editorialRailBounds(0, 320, 900), { atStart: true, atEnd: false, overflow: true });
  assert.deepEqual(editorialRailBounds(250, 320, 900), { atStart: false, atEnd: false, overflow: true });
  assert.deepEqual(editorialRailBounds(579.5, 320, 900), { atStart: false, atEnd: true, overflow: true });
  assert.deepEqual(editorialRailBounds(0, 320, 320), { atStart: true, atEnd: true, overflow: false });
});

function focusHarness() {
  const events: string[] = [];
  const button = (name: string) => {
    let disabled = true;
    return {
      get disabled() { return disabled; },
      set disabled(value: boolean) { disabled = value; events.push(`${name}:disabled=${value}`); },
      focus(options: { preventScroll: boolean }) {
        assert.equal(disabled, false, "a disabled destination cannot receive focus");
        assert.equal(options.preventScroll, true);
        events.push(`${name}:focus`);
      },
    };
  };
  const previous = button("previous");
  const next = button("next");
  const track = { focus(options: { preventScroll: boolean }) {
    assert.equal(options.preventScroll, true);
    events.push("track:focus");
  } };
  return { previous, next, track, events };
}

test("focused Next hands off to enabled Previous before end-state disabling", () => {
  const state = focusHarness();
  preserveEditorialRailFocus(editorialRailBounds(580, 320, 900), { ...state, active: state.next, hasControlFocus: true });
  assert.deepEqual(state.events, ["previous:disabled=false", "previous:focus"]);
});

test("focused Previous hands off to enabled Next at the start", () => {
  const state = focusHarness();
  preserveEditorialRailFocus(editorialRailBounds(0, 320, 900), { ...state, active: state.previous, hasControlFocus: true });
  assert.deepEqual(state.events, ["next:disabled=false", "next:focus"]);
});

test("focused controls hand off to the track when resize removes overflow", () => {
  const state = focusHarness();
  preserveEditorialRailFocus(editorialRailBounds(0, 900, 900), { ...state, active: state.next, hasControlFocus: true });
  assert.deepEqual(state.events, ["track:focus"]);
});

test("rail sync never steals link, track or outside focus after scrolling or resize", () => {
  for (const bounds of [editorialRailBounds(580, 320, 900), editorialRailBounds(0, 320, 900), editorialRailBounds(0, 900, 900)]) {
    const state = focusHarness();
    for (const active of [{}, state.track, null]) preserveEditorialRailFocus(bounds, { ...state, active, hasControlFocus: false });
    assert.deepEqual(state.events, []);
  }
});

test("available focused controls retain focus in the middle and at their usable edge", () => {
  const state = focusHarness();
  for (const [bounds, active] of [[editorialRailBounds(250, 320, 900), state.next], [editorialRailBounds(0, 320, 900), state.next], [editorialRailBounds(580, 320, 900), state.previous]] as const) {
    preserveEditorialRailFocus(bounds, { ...state, active, hasControlFocus: true });
  }
  assert.deepEqual(state.events, []);
});

test("rail controller performs focus preservation before hiding or disabling controls", () => {
  const rail = readFileSync("src/components/EditorialRail.astro", "utf8");
  const handoff = rail.indexOf("preserveEditorialRailFocus(bounds");
  assert.ok(handoff > 0);
  for (const availability of ["controls.hidden = !bounds.overflow", "prev.disabled = bounds.atStart", "next.disabled = bounds.atEnd"]) {
    assert.ok(handoff < rail.indexOf(availability));
  }
});
