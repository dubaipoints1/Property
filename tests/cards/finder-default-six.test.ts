import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getActiveCards } from "../../src/lib/cardsData.ts";

/**
 * /cards/finder/ renders every card and lets an inline script hide all but
 * the first six. Painting 58 tiles and collapsing to 6 about 160 ms later
 * cost CLS 0.248 at 1280px (2026-09-06 audit, F-027), so the page now
 * server-renders the six the script will choose on a bare URL and starts
 * the rest hidden.
 *
 * That only works while the two agree. These tests pin the agreement: the
 * page's own frontmatter expression, and the inline script's score() and
 * filter, must keep picking the same six.
 */
const SOURCE = readFileSync("src/pages/cards/finder/index.astro", "utf8");

/** The default ranking, written out once here as the reference. */
function defaultSix(): string[] {
  return getActiveCards()
    .filter((card) => card.discontinuedForNewApplicants === undefined && card.eligibility.invitationOnly !== true)
    .map((card) => ({
      slug: card.slug,
      score: card.earnRates.everythingElse ?? 0,
      annualFee: card.annualFee.amount,
    }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.annualFee - b.annualFee))
    .slice(0, 6)
    .map((c) => c.slug);
}

test("the default six are six real, distinct cards open without an invitation", () => {
  const six = defaultSix();
  assert.equal(six.length, 6);
  assert.equal(new Set(six).size, 6);
  const active = new Set(
    getActiveCards()
      .filter((c) => c.discontinuedForNewApplicants === undefined && c.eligibility.invitationOnly !== true)
      .map((c) => c.slug),
  );
  for (const slug of six) assert.ok(active.has(slug), `${slug} is not an active card`);
});

test("the page still derives its pre-rendered set the documented way", () => {
  // If any of these move, the SSR set and the client scorer can disagree
  // silently and the layout shift comes back.
  assert.match(SOURCE, /const defaultCandidates = cardsWithBanks\.filter\(/);
  assert.match(SOURCE, /const defaultTopSlugs = defaultCandidates/);
  assert.match(SOURCE, /const defaultRank = new Map\(defaultTopSlugs\.map\(/);
  assert.match(SOURCE, /card\.discontinuedForNewApplicants === undefined/);
  assert.match(SOURCE, /card\.eligibility\.invitationOnly !== true/);
  assert.match(SOURCE, /card\.earnRates\.everythingElse \?\? 0/);
  assert.match(SOURCE, /b\.score !== a\.score \? b\.score - a\.score : a\.annualFee - b\.annualFee/);
  assert.match(SOURCE, /\.slice\(0, 6\)/);
});

function renderFinder(search: string) {
  const cards = getActiveCards().map((card) => ({
    slug: card.slug,
    network: card.network,
    annualFee: card.annualFee.amount,
    minSalary: card.eligibility.minSalary,
    invitationOnly: card.eligibility.invitationOnly === true,
    discontinued: card.discontinuedForNewApplicants !== undefined,
    loyaltyProgram: card.loyaltyProgram ?? "",
    earnRates: card.earnRates,
    hasLounge: card._features.some((f) => f.type === "lounge_access"),
    hasStatus: card._features.some((f) => f.type === "status_match"),
  }));
  const tiles = cards.map(({ slug }) => {
    const note = { textContent: "", hidden: true };
    return { slug, hidden: true, note, getAttribute: () => slug, querySelector: () => note };
  });
  const grid = {
    hidden: false,
    querySelectorAll: () => [...tiles],
    prepend(...nodes: typeof tiles) {
      tiles.splice(0, tiles.length, ...nodes, ...tiles.filter((tile) => !nodes.includes(tile)));
    },
  };
  const compare = { href: "", hidden: false, textContent: "" };
  const count = { textContent: "" };
  const elements: Record<string, object> = {
    "finder-card-index": { textContent: JSON.stringify(cards) },
    "finder-options": {
      textContent: JSON.stringify({
        prefer: ["none", "cashback", "miles", "lounges"],
        spendLabels: { general: "General / mixed" },
        preferLabels: { cashback: "AED cashback", miles: "Airline miles" },
      }),
    },
    "finder-grid": grid,
    "finder-count": count,
    "finder-mode": {},
    "finder-empty": {},
    "finder-compare": compare,
  };
  const script = SOURCE.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, "finder inline script");
  runInNewContext(script, {
    document: { getElementById: (id: string) => elements[id] },
    window: { location: { search } },
    URLSearchParams,
    HTMLDetailsElement: class {},
  });
  return { cards, tiles: tiles.filter((tile) => !tile.hidden), compare, count };
}

test("the bare URL preserves server order, distinguishes count from preview and excludes invitations", () => {
  const result = renderFinder("");
  const slugs = result.tiles.map((tile) => tile.slug);
  assert.deepEqual(slugs, defaultSix());
  assert.equal(result.count.textContent, `Showing 6 of ${result.cards.filter((c) => !c.invitationOnly).length} cards that meet your filters`);
  assert.equal(result.compare.href, `/cards/compare/?cards=${slugs.slice(0, 3).join(",")}`);
});

test("preferred benefits rank ahead of alternatives and compare uses that DOM order", () => {
  const result = renderFinder("?salary=12000&prefer=cashback&include_invite_only=false");
  assert.equal(result.tiles.length, 6);
  assert.match(result.tiles[0].note.textContent, /Matches your preference: AED cashback/);
  assert.equal(result.compare.href, `/cards/compare/?cards=${result.tiles.slice(0, 3).map((tile) => tile.slug).join(",")}`);
});

test("old explicit opt-in links still include invitation-only cards", () => {
  const result = renderFinder("?include_invite_only=true");
  assert.equal(result.count.textContent, `Showing 6 of ${result.cards.length} cards that meet your filters`);
  assert.ok(result.tiles.some((tile) => tile.note.textContent.includes("Invitation only")));
});
