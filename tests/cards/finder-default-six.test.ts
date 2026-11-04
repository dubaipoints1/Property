import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";

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

function renderFinder(search: string, fixtures = getActiveCards()) {
  const cards = fixtures.map((card) => ({
    slug: card.slug,
    network: card.network,
    annualFee: card.annualFee.amount,
    minSalary: card.eligibility.minSalary,
    salaryTransferRequired: card.eligibility.salaryTransferRequired,
    invitationOnly: card.eligibility.invitationOnly === true,
    discontinued: card.discontinuedForNewApplicants !== undefined,
    loyaltyProgram: card.loyaltyProgram ?? "",
    earnRates: card.earnRates,
    hasLounge: card._features.some((f) => f.type === "lounge_access"),
    hasStatus: card._features.some((f) => f.type === "status_match"),
    evidence: finderEvidence(card),
  }));
  const tiles = cards.map(({ slug }) => {
    const parts = {
      "[data-finder-match]": { textContent: "", hidden: true },
      "[data-finder-ranking]": { textContent: "" },
      "[data-finder-filters]": { textContent: "" },
      "[data-finder-checks]": { textContent: "", replaceChildren(...nodes: Array<{ textContent: string }>) {
        this.textContent = nodes.map((node) => node.textContent).join(" ");
      } },
    };
    return { slug, hidden: true, parts, note: parts["[data-finder-match]"], getAttribute: () => slug,
      querySelector: (selector: keyof typeof parts) => parts[selector] };
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
        spend: ["general", "groceries", "online", "dining"],
        spendLabels: { general: "General / mixed", groceries: "Groceries", online: "Online shopping", dining: "Dining" },
        preferLabels: { cashback: "AED cashback", miles: "Airline miles", lounges: "Airport lounges" },
        network: ["any", "Visa", "Mastercard"],
        fee: ["any", "free", "under-500", "under-1000"],
        feeLabels: { free: "Free only", "under-500": "Under AED 500", "under-1000": "Under AED 1,000" },
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
    document: { getElementById: (id: string) => elements[id], createElement: () => ({ textContent: "" }) },
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
  const invitation = result.tiles.find((tile) => tile.note.textContent.includes("Invitation only"));
  assert.match(invitation?.parts["[data-finder-checks]"].textContent ?? "", /The bank must invite you/);
});

test("the explanation uses the same selected-category rate and base fallback as ranking", () => {
  const citi = getActiveCards().find((c) => c.slug === "citi-cashback")!;
  const dib = getActiveCards().find((c) => c.slug === "dib-consumer-cashback")!;
  const result = renderFinder("?salary=12000&spend=groceries&fee=under-500", [citi, dib]);
  const tile = result.tiles.find((t) => t.slug === citi.slug)!;
  assert.match(tile.parts["[data-finder-ranking]"].textContent, /Groceries: 2%/);
  assert.match(tile.parts["[data-finder-filters]"].textContent, /Meets the listed salary minimum of AED\s\d[\d,]* a month/);
  assert.match(tile.parts["[data-finder-filters]"].textContent, /Fee filter: Under AED 500/);
  assert.match(tile.parts["[data-finder-checks]"].textContent, /AED\s315 incl\. VAT/);
  assert.match(tile.parts["[data-finder-checks]"].textContent, /renewal waiver terms/);
  assert.match(result.tiles[0].parts["[data-finder-checks]"].textContent, /Listed category cap: AED\s200 a month/);

  const fallback = renderFinder("?spend=online&prefer=miles", [citi]).tiles[0];
  assert.match(fallback.parts["[data-finder-ranking]"].textContent, /No separate rate listed for online shopping; general-spending rate used: 1%/);
  assert.match(fallback.note.textContent, /Different reward or benefit/);
  assert.equal(fallback.parts["[data-finder-filters]"].textContent, "No salary, network or fee filter applied.");
});

test("display evidence preserves rate denominators, pending data and published terms", () => {
  const bonvoy = getCardData("emirates-nbd-marriott-bonvoy-world-elite")!;
  assert.equal(finderEvidence(bonvoy).earnLabels.everythingElse, "3× per USD 1");
  const adib = getCardData("adib-cashback-visa")!;
  const adibEvidence = finderEvidence(adib);
  assert.match(adibEvidence.feeNotes.join(" "), /AED\s103\.95 incl\. VAT/);
  assert.match(adibEvidence.categoryCaps.groceries, /AED\s300 a month/);
  assert.equal(adibEvidence.sourceUrl, adib.kfsUrl);

  const pending = finderEvidence({ ...adib, _provenance: { earnRates: "needs-review", annualFee: "needs-review", eligibility: "needs-review" } });
  assert.deepEqual(pending.earnLabels, {});
  assert.deepEqual(pending.capNotes, []);
  assert.deepEqual(pending.categoryCaps, {});
  assert.match(pending.feeNotes[0], /confirmation pending/);
  assert.equal(pending.salaryPending, true);
});
