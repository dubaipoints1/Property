import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialiseFinderArtwork } from "../../src/scripts/finderArtwork";

test("Finder artwork is inert before actual visibility, but uses the same real artworks without JS", () => {
  const finder = readFileSync("src/components/cards/FinderCard.astro", "utf8");
  const art = readFileSync("src/components/cards/CompareCardArt.astro", "utf8");
  const page = readFileSync("src/pages/cards/finder/index.astro", "utf8");
  assert.match(finder, /data-finder-art-viewport[\s\S]*<template data-finder-art-template><BankLogo ([^\n]+)<\/template>\s*<noscript><BankLogo \1<\/noscript>/);
  assert.match(finder, /<CompareCardArt[^>]+ finderViewportDeferred/);
  assert.match(art, /data-card-art-reserved=\{deferred \|\| finderViewportDeferred \|\| undefined\}/);
  assert.match(art, /deferred \|\| finderViewportDeferred \? <>\s*<template data-finder-art-template=\{finderViewportDeferred \|\| undefined\} data-compare-art-template=\{deferred \|\| undefined\}><img \{\.\.\.image\} \/><\/template>\s*<noscript><img \{\.\.\.image\} \/><\/noscript>/);
  assert.match(page, /initialiseFinderArtwork\(\);/);
});

test("viewport callback defers offscreen or newly hidden art, activates it once and supports older engines", () => {
  const keys = ["window", "document", "IntersectionObserver"] as const;
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const records = Array.from({ length: 2 }, () => {
    let current = true;
    const record = { shown: true, copies: 0, inserted: 0,
      closest(selector: string) {
        assert.equal(selector, ".dp-finder-tile[hidden]");
        return this.shown ? null : {};
      },
      querySelector(selector: string) {
        assert.equal(selector, "template[data-finder-art-template]");
        return current ? template : null;
      },
    };
    const template = {
      content: { cloneNode(deep: boolean) { assert.equal(deep, true); record.copies++; return {}; } },
      replaceWith() { record.inserted++; current = false; },
    };
    return record;
  });
  const observed = new Set();
  let change: (entries: Pick<IntersectionObserverEntry, "target" | "isIntersecting" | "intersectionRatio">[]) => void;
  class Observer {
    constructor(callback: typeof change) { change = callback; }
    observe(element: unknown) { observed.add(element); }
    unobserve(element: unknown) { observed.delete(element); }
  }
  const insert = (key: string, value: unknown) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  try {
    insert("window", { IntersectionObserver: Observer });
    insert("document", { getElementById: (id: string) => {
      assert.equal(id, "finder-grid");
      return { querySelectorAll: () => records };
    } });
    insert("IntersectionObserver", Observer);
    initialiseFinderArtwork();
    assert.equal(observed.size, records.length);
    const transition = (index: number, ratio: number) =>
      change([{ target: records[index] as unknown as Element, isIntersecting: ratio > 0, intersectionRatio: ratio }]);
    transition(0, 0); transition(0, 0.05); records[0].shown = false; transition(0, 0.5);
    assert.equal(records[0].inserted, 0);
    records[0].shown = true; transition(0, 0.5); transition(0, 0.7);
    assert.equal(records[0].copies, 1);
    assert.equal(records[0].inserted, 1);
    assert.ok(!observed.has(records[0]));
    assert.equal(records[1].inserted, 0);
    insert("window", {});
    initialiseFinderArtwork();
    assert.equal(records[0].inserted, 1);
    assert.equal(records[1].inserted, 1);
  } finally {
    for (const key of keys) {
      const descriptor = saved.get(key);
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
