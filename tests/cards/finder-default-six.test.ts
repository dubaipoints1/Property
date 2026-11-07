import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { cardFinderState, cardJourneyParams } from "../../src/lib/readerJourneyState";
import { eligibleForSalaryFilter } from "../../src/lib/cardSelection";
import { cardFeeNeedsReview, compareKnownAnnualFees } from "../../src/lib/cardFeeProvenance";

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
      score: finderEvidence(card).fallbackPending ? null : card.earnRates.everythingElse ?? null,
      annualFee: finderEvidence(card).annualFeePending ? null : card.annualFee.amount,
    }))
    .sort((a, b) => a.score === null || b.score === null
      ? a.score === b.score ? compareKnownAnnualFees(a.annualFee, b.annualFee) : a.score === null ? 1 : -1
      : b.score !== a.score ? b.score - a.score : compareKnownAnnualFees(a.annualFee, b.annualFee))
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
  assert.match(SOURCE, /score: evidence\.fallbackPending \? null : card\.earnRates\.everythingElse \?\? null/);
  assert.match(SOURCE, /a\.score === null \|\| b\.score === null/);
  assert.match(SOURCE, /\.slice\(0, 6\)/);
});

function renderFinder(search: string, fixtures = getActiveCards()) {
  const cards = fixtures.map((card) => ({
    slug: card.slug,
    network: card.network,
    annualFee: finderEvidence(card).annualFeePending ? null : card.annualFee.amount,
    minSalary: card.eligibility.minSalary,
    eligibleForSalaryFilter: eligibleForSalaryFilter(card._provenance, card.eligibility.minSalary),
    salaryTransferRequired: card.eligibility.salaryTransferRequired,
    invitationOnly: card.eligibility.invitationOnly === true,
    discontinued: card.discontinuedForNewApplicants !== undefined,
    loyaltyProgram: card.loyaltyProgram ?? "",
    earnRates: finderEvidence(card).rankRates,
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
        spend: ["general", "groceries", "online", "dining", "travel", "fuel"],
        spendLabels: { general: "General / mixed", groceries: "Groceries", online: "Online shopping", dining: "Dining", travel: "Travel", fuel: "Fuel" },
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
  assert.match(SOURCE, /import \{ initialiseCardFinder \} from "~\/scripts\/cardFinder\.mjs"/);
  const script = readFileSync("src/scripts/cardFinder.mjs", "utf8")
    .replace(/^import[^\n]+\n/gm, "").replace("export function initialiseCardFinder", "function initialiseCardFinder") + "\ninitialiseCardFinder();";
  runInNewContext(script, {
    document: { getElementById: (id: string) => elements[id], createElement: () => ({ textContent: "" }) },
    window: { location: { search } },
    URLSearchParams,
    cardFinderState,
    cardJourneyParams,
    compareKnownAnnualFees,
    HTMLDetailsElement: class {},
  });
  return { cards, tiles: tiles.filter((tile) => !tile.hidden), compare, count };
}

test("the bare URL preserves server order, distinguishes count from preview and excludes invitations", () => {
  const result = renderFinder("");
  const slugs = result.tiles.map((tile) => tile.slug);
  assert.deepEqual(slugs, defaultSix());
  assert.equal(result.count.textContent, `Showing 6 of ${result.cards.filter((c) => !c.invitationOnly).length} cards that meet your filters`);
  const compare = new URL(result.compare.href, "https://dubaipoints.ae");
  assert.equal(compare.searchParams.get("cards"), slugs.slice(0, 3).join(","));
  assert.equal(compare.searchParams.get("via"), "finder");
});

test("a documented network-choice family matches either network without adding duplicate cards", () => {
  const source = getActiveCards()[0];
  const fixtures = [
    { ...source, slug: "choice", network: "Visa + Mastercard" as const, eligibility: { ...source.eligibility, invitationOnly: false } },
    { ...source, slug: "mastercard-only", network: "Mastercard" as const, eligibility: { ...source.eligibility, invitationOnly: false } },
  ];
  assert.deepEqual(renderFinder("?network=Visa", fixtures).tiles.map(t => t.slug), ["choice"]);
  assert.deepEqual(new Set(renderFinder("?network=Mastercard", fixtures).tiles.map(t => t.slug)), new Set(["choice", "mastercard-only"]));
  assert.equal(renderFinder("?network=Amex", fixtures).tiles.length, 0);
  assert.equal(renderFinder("", fixtures).cards.length, 2);
});

test("preferred benefits rank ahead of alternatives and compare uses that DOM order", () => {
  const result = renderFinder("?salary=12000&prefer=cashback&include_invite_only=false");
  assert.equal(result.tiles.length, 6);
  assert.match(result.tiles[0].note.textContent, /Matches your preference: AED cashback/);
  const target = new URL(result.compare.href, "https://dubaipoints.ae");
  assert.equal(target.searchParams.get("cards"), result.tiles.slice(0, 3).map((tile) => tile.slug).join(","));
  assert.equal(target.searchParams.get("salary"), "12000");
  assert.equal(target.searchParams.get("prefer"), "cashback");
});

test("Liv Cashback cards appear at their published salary thresholds, not below", () => {
  const liv = getActiveCards().filter((card) => card.bank === "liv");
  assert.equal(liv.length, 2);
  const matches = (salary: number) => renderFinder(`?salary=${salary}`, liv)
    .tiles.map((tile) => tile.slug).sort();

  assert.deepEqual(matches(4999), []);
  assert.deepEqual(matches(5000), ["liv-cashback"]);
  assert.deepEqual(matches(14999), ["liv-cashback"]);
  assert.deepEqual(matches(15000), ["liv-cashback", "liv-cashback-plus"]);
});

test("old explicit opt-in links still include invitation-only cards", () => {
  const fixtures = [getActiveCards().find(card => card.eligibility.invitationOnly)!, getActiveCards().find(card => !card.eligibility.invitationOnly)!];
  assert.ok(fixtures.every(Boolean));
  assert.equal(renderFinder("", fixtures).tiles.length, 1);
  const result = renderFinder("?include_invite_only=true", fixtures);
  assert.equal(result.count.textContent, "Showing 2 of 2 cards that meet your filters");
  assert.ok(result.tiles.some((tile) => tile.note.textContent.includes("Invitation only")));
  const invitation = result.tiles.find((tile) => tile.note.textContent.includes("Invitation only"));
  assert.match(invitation?.parts["[data-finder-checks]"].textContent ?? "", /The bank must invite you/);
});

test("confirmed synthetic category rates and base fallbacks use the same ranking and explanation", () => {
  const source = getCardData("citi-cashback")!;
  const citi = { ...source, slug: "synthetic-cash", earnRates: { everythingElse: 1, groceries: 2 }, scopedEarnRates: undefined, _provenance: {} };
  const dib = { ...citi, slug: "synthetic-groceries", earnRates: { everythingElse: 1, groceries: 3, _caps: { per_category: { groceries: { monthly_aed: 200 } } } } };
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
test("365 missing-category fallback remains unranked, not an assumed zero or universal base rate", () => {
  const adcb = getActiveCards().find(c => c.slug === "adcb-365-cashback")!;
  const citi = getActiveCards().find(c => c.slug === "citi-cashback")!;
  for (const spend of ["online", "travel", "general"]) {
    const result = renderFinder(`?spend=${spend}`, [adcb, citi]);
    assert.equal(result.tiles[0].slug, citi.slug);
    const tile = result.tiles.find(t => t.slug === adcb.slug)!;
    assert.match(tile.parts["[data-finder-ranking]"].textContent, /Not rate-ranked.*No general rate is assumed/);
    assert.doesNotMatch(tile.parts["[data-finder-ranking]"].textContent, /1%|0%/);
  }
  const dining = renderFinder("?spend=dining", [adcb]).tiles[0];
  assert.match(dining.parts["[data-finder-ranking]"].textContent, /Dining:/);
});

test("actual Finder controller cannot rank held category, unit or dotted rate inputs", () => {
  const original = getCardData("citi-cashback")!;
  const confirmed = { ...original, slug: "confirmed-example", earnRates: { everythingElse: 1, online: 2 }, _provenance: {} };
  for (const field of ["earnRates", "earnRates.model", "earnRates.model.paymentChannels", "earnUnit", "earnRates.online", "earnRates.online.value"]) {
    const held = { ...original, slug: "held-example", earnRates: { everythingElse: 1, online: 99 }, _provenance: { [field]: "needs-review" as const } };
    const evidence = finderEvidence(held);
    assert.equal(evidence.rankRates.online, undefined, field);
    assert.equal(evidence.earnLabels.online, undefined, field);
    const result = renderFinder("?spend=online", [held, confirmed]);
    assert.equal(result.tiles[0].slug, confirmed.slug, field);
    assert.match(result.tiles.find(t => t.slug === held.slug)!.parts["[data-finder-ranking]"].textContent, /Not rate-ranked/);
  }
  const current = getCardData("sc-platinum-x")!;
  const result = renderFinder("?spend=online", [{ ...current, slug: "sc-platinum-x" }, confirmed]);
  assert.equal(result.tiles[0].slug, confirmed.slug, "The actual held SC online rate must not win");
  assert.match(SOURCE, /earnRates: evidence\.rankRates/);
});

test("the actual DIB model hold stays unknown in public summaries and Finder ranking, not a published zero", () => {
  const dib = { ...getCardData("dib-consumer-cashback")!, slug: "dib-consumer-cashback" };
  assert.equal(dib._provenance?.["earnRates.model"], "needs-review");
  assert.deepEqual(dib.earnRates, { everythingElse: null }, "The canonical numeric model is withheld from public consumers, not replaced by zero");
  const evidence = finderEvidence(dib);
  assert.equal(evidence.fallbackPending, true);
  assert.deepEqual(evidence.rankRates, {}); assert.deepEqual(evidence.earnLabels, {});
  assert.doesNotMatch(`General spending: ${evidence.earnLabels.everythingElse ?? "rate needs confirmation"}.`, /0%/);
  const confirmedZero = { ...getCardData("citi-cashback")!, slug: "confirmed-zero-example", earnRates: { everythingElse: 0 }, scopedEarnRates: undefined, _provenance: {} };
  for (const spend of ["general", "groceries", "fuel", "online"]) {
    const result = renderFinder(`?spend=${spend}`, [dib, confirmedZero]);
    assert.equal(result.tiles[0].slug, confirmedZero.slug, spend);
    const tile = result.tiles.find(card => card.slug === dib.slug)!;
    assert.match(tile.parts["[data-finder-ranking]"].textContent, /Not rate-ranked.*No general rate is assumed/, spend);
    assert.doesNotMatch(tile.parts["[data-finder-ranking]"].textContent, /0%/, spend);
    assert.match(result.tiles[0].parts["[data-finder-ranking]"].textContent, /0%/, "A separately confirmed genuine zero remains distinct from unknown");
  }
});

test("unknown annual fees cannot match fee buckets or win the cheaper-fee tie-break", () => {
  const original = getCardData("citi-cashback")!;
  const known = { ...original, slug: "known-fee-example", earnRates: { everythingElse: 1 }, annualFee: { amount: 315, currency: "AED" as const }, _provenance: { annualFee: "editor-confirmed" as const } };
  for (const field of ["annualFee", "annualFee.amount", "vatPolicy"]) {
    const held = { ...known, slug: "held-fee-example", annualFee: { amount: 0, currency: "AED" as const }, _provenance: { [field]: "needs-review" as const } };
    assert.equal(renderFinder("", [held, known]).tiles[0].slug, known.slug, field);
    assert.equal(renderFinder("?fee=free", [held]).tiles.length, 0, field);
    assert.equal(renderFinder("?fee=under-500", [held]).tiles.length, 0, field);
    assert.match(finderEvidence(held).feeNotes[0], /confirmation pending/, field);
  }
  const scrapedZero = { ...known, slug: "scraped-zero-example", annualFee: { amount: 0, currency: "AED" as const }, _provenance: { annualFee: "scraped" as const } };
  assert.equal(renderFinder("?fee=free", [scrapedZero]).tiles.length, 0);
  const confirmedZero = { ...scrapedZero, _provenance: { annualFee: "editor-confirmed" as const } };
  assert.equal(renderFinder("?fee=free", [confirmedZero]).tiles.length, 1);
  assert.equal(renderFinder("", [known, confirmedZero]).tiles[0].slug, confirmedZero.slug);
  for (const tile of renderFinder("?fee=free").tiles) assert.equal(cardFeeNeedsReview(getCardData(tile.slug)!, "annualFee"), false);
  assert.equal((SOURCE.match(/annualFee: evidence\.annualFeePending \? null : card\.annualFee\.amount/g) ?? []).length, 2, "Both serialized and SSR fee inputs must use the guard");
});
test("unknown required eligibility flags never qualify under an active salary filter", () => {
  const citi = getActiveCards().find(c => c.slug === "citi-cashback")!;
  const unknown = { ...citi, slug: "unknown-eligibility-fixture", eligibility: { ...citi.eligibility, salaryTransferRequired: null, residencyRequired: null, employmentTypes: [] },
    _provenance: { ...citi._provenance, eligibility: "needs-review", "eligibility.salaryTransferRequired": "needs-review", "eligibility.residencyRequired": "needs-review", "eligibility.employmentTypes": "needs-review" } };
  assert.equal(renderFinder("?salary=50000", [unknown]).tiles.length, 0);
  const bare = renderFinder("", [unknown]).tiles[0];
  assert.match(bare.note.textContent, /Eligibility confirmation pending/);
  assert.doesNotMatch(bare.parts["[data-finder-checks]"].textContent, /Salary transfer required|not required|Any employment/);
});

test("held VAT also suppresses a separate joining-fee quote and annual VAT qualifier", () => {
  const original = getCardData("citi-cashback")!;
  const held = { ...original, annualFee: { amount: 315, currency: "AED" as const },
    joiningFee: { amount: 100, currency: "AED" as const }, vatPolicy: "exclusive" as const,
    _provenance: { ...original._provenance, vatPolicy: "needs-review" as const } };
  const evidence = finderEvidence(held);
  assert.deepEqual(evidence.feeNotes.slice(0, 2), ["Annual fee: confirmation pending.", "Joining fee: confirmation pending."]);
  assert.equal(evidence.feeExcludesVat, false);
  assert.doesNotMatch(evidence.feeNotes.join(" "), /AED|VAT/);
});

test("display evidence preserves rate denominators, pending data and published terms", () => {
  const bonvoy = getCardData("emirates-nbd-marriott-bonvoy-world-elite")!;
  assert.equal(finderEvidence(bonvoy).earnLabels.everythingElse, undefined, "source-qualified rows are not generic ranking rates");
  assert.equal(finderEvidence({ ...bonvoy, earnRates: { everythingElse: 3 }, scopedEarnRates: undefined,
    earnUnit: "Marriott Bonvoy Points per USD 1 spent", _provenance: {} }).earnLabels.everythingElse, "3× per USD 1");
  const adib = getCardData("adib-cashback-visa")!;
  const adibEvidence = finderEvidence(adib);
  assert.match(adibEvidence.feeNotes.join(" "), /AED\s103\.95 incl\. VAT/);
  assert.deepEqual(adibEvidence.categoryCaps, {}, "held cap terms must not escape through display evidence");
  const knownCap = finderEvidence({ ...adib, earnRates: { everythingElse: 0, groceries: 4, _caps: { per_category: { groceries: { monthly_aed: 300 } } } }, scopedEarnRates: undefined, _provenance: {} });
  assert.match(knownCap.categoryCaps.groceries, /AED\s300 a month/);
  assert.equal(adibEvidence.sourceUrl, adib.kfsUrl);

  const pending = finderEvidence({ ...adib, _provenance: { earnRates: "needs-review", annualFee: "needs-review", eligibility: "needs-review" } });
  assert.deepEqual(pending.earnLabels, {});
  assert.deepEqual(pending.capNotes, [adib._dataIssues?.earnRates].filter(Boolean), "source conflicts remain visible while held numeric cap quotes are removed");
  assert.deepEqual(pending.categoryCaps, {});
  assert.match(pending.feeNotes[0], /confirmation pending/);
  assert.equal(pending.salaryPending, true);
});

test("pending eligibility is accessible without salary but never a salary-qualified recommendation", () => {
  const original = structuredClone(getCardData("citi-cashback")!);
  const conflicted = { ...original, _provenance: { ...original._provenance, eligibility: "needs-review" as const } };
  const bare = renderFinder("", [conflicted]);
  assert.equal(bare.tiles.length, 1);
  assert.match(bare.tiles[0].note.textContent, /Eligibility confirmation pending/);
  assert.equal(renderFinder("?salary=1000000", [conflicted]).tiles.length, 0);
  const fieldPending = { ...original, _provenance: { ...original._provenance, "eligibility.minSalary": "needs-review" as const } };
  assert.equal(renderFinder("?salary=1000000", [fieldPending]).tiles.length, 0);
  const unpublished = { ...original, eligibility: { ...original.eligibility, minSalary: null } };
  assert.equal(renderFinder("", [unpublished]).tiles.length, 1);
  assert.equal(renderFinder("?salary=1000000", [unpublished]).tiles.length, 0);
  const scraped = { ...original, _provenance: { ...original._provenance, eligibility: "scraped" as const } };
  assert.equal(renderFinder("?salary=1000000", [scraped]).tiles.length, 1, "Do not silently change existing scraped-data handling");
});

test("malformed or repeated filter values use exactly the canonical default ranking", () => {
  for (const query of ["?salary=12000junk", "?salary=12000&salary=1", "?network=visa", "?prefer=miles&prefer=cashback", "?salary=1e6", "?salary=-1"]) {
    assert.deepEqual(renderFinder(query).tiles.map(tile => tile.slug), defaultSix(), query);
  }
});
