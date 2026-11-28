import { test } from "node:test";
import assert from "node:assert/strict";
import { observeTrackerIssuerMark } from "../../src/scripts/trackerIssuerArtwork.mjs";

test("scoped artwork only activates an actually visible mounted mark, once, using one observer", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "IntersectionObserver");
  const live = { getClientRects: () => [1] };
  const hidden = { getClientRects: () => [] };
  const removed = { getClientRects: () => [1] };
  const fired: string[] = [];
  type Mark = typeof live | typeof hidden;
  type Entry = { target: Mark; isIntersecting: boolean; intersectionRatio: number };
  let emit!: (entries: Entry[]) => void;
  let observers = 0;
  const targets = new Set<Mark>();
  class FakeObserver {
    constructor(callback: typeof emit, options: { threshold: number }) {
      assert.equal(options.threshold, 0.01);
      emit = callback;
      observers++;
    }
    observe(target: Mark) { targets.add(target); }
    unobserve(target: Mark) { targets.delete(target); }
  }
  try {
    Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, value: undefined });
    observeTrackerIssuerMark(live, () => fired.push("no observer"))();
    Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, value: FakeObserver });
    const stop = observeTrackerIssuerMark(live, () => fired.push("live"));
    const stopHidden = observeTrackerIssuerMark(hidden, () => fired.push("hidden"));
    observeTrackerIssuerMark(removed, () => fired.push("removed"))();
    assert.equal(observers, 1);
    emit([{ target: live, isIntersecting: true, intersectionRatio: 0 }, { target: hidden, isIntersecting: true, intersectionRatio: 1 },
      { target: removed, isIntersecting: true, intersectionRatio: 1 }]);
    assert.deepEqual(fired, ["no observer"]);
    emit([{ target: live, isIntersecting: true, intersectionRatio: 1 }]);
    emit([{ target: live, isIntersecting: true, intersectionRatio: 1 }]);
    assert.deepEqual(fired, ["no observer", "live"]);
    stop();
    stopHidden();
    assert.equal(targets.size, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, "IntersectionObserver", original);
    else Reflect.deleteProperty(globalThis, "IntersectionObserver");
  }
});
