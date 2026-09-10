/**
 * Computed facts for the at-a-glance strips on the trust pages.
 *
 * Every figure here is derived at build time from the data the site already
 * ships — `cards.json` through `getActiveCards()`, the corrections log,
 * the valuation baselines. None is typed by hand anywhere.
 *
 * That constraint is the point of the module. `/valuations/` carried a
 * hand-typed promise that ranges would land in Q3 2026; the quarter ran out
 * and ruling R10 had to cut four columns on 10 September. A trust page is
 * the worst place on the site for a number that can quietly go stale, because
 * a stale figure there discredits the very claim the page exists to make.
 * Putting a figure on a trust page means adding it here, backed by data.
 *
 * Facts that are policy rather than measurement — "one editor", "no
 * affiliate revenue" — are stable statements and belong in the page, not
 * here. This module holds only things that are counted.
 */
import { getActiveCards } from "./cardsData";
import { corrections, cardsCorrected, lastCorrectionDate } from "../data/corrections";
import { programmeValuations, baselinesConfirmed } from "./valuations";

const nf = new Intl.NumberFormat("en-AE");

/** Active cards under coverage. */
export function cardsTracked(): number {
  return getActiveCards().length;
}

/** Distinct issuers across those cards. */
export function banksCovered(): number {
  return new Set(getActiveCards().map((c) => c.bank)).size;
}

/**
 * How many cards carry at least one source URL, against the total — the
 * Charter's "every card has ≥1 source URL" guarantee, stated as a fraction
 * so it reads as evidence rather than as a claim.
 */
export function cardsSourced(): string {
  const cards = getActiveCards();
  const sourced = cards.filter((c) => (c.sources?.length ?? 0) > 0).length;
  return `${sourced} of ${cards.length}`;
}

/**
 * Total per-field provenance entries across the card set. Each one records
 * whether a value was scraped, editor-confirmed or editor-corrected.
 */
export function provenanceFields(): string {
  const n = getActiveCards().reduce(
    (total, card) => total + Object.keys(card._provenance ?? {}).length,
    0,
  );
  return nf.format(n);
}

/** Month stamp of the newest verification across the card set. */
export function verifiedThrough(): string {
  const newest = Math.max(
    ...getActiveCards().map((c) => new Date(c.lastVerified).getTime()),
  );
  return new Date(newest).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/** Corrections published, all time. */
export function correctionsPublished(): number {
  return corrections.length;
}

/** Card pages touched by a correction, all time. */
export function cardPagesCorrected(): number {
  return cardsCorrected();
}

/** Most recent correction as a short month stamp, or a stated absence. */
export function lastCorrection(): string {
  const d = lastCorrectionDate();
  return d
    ? d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "None yet";
}

/** Loyalty currencies on /valuations/. */
export function programmesTracked(): number {
  return programmeValuations.length;
}

/**
 * How many of those carry a published DP-value baseline. Deliberately shown
 * as a fraction: five of ten are still Pending, and the methodology page
 * should say so rather than imply the table is complete.
 */
export function baselinesPublished(): string {
  const withValue = programmeValuations.filter((p) => p.dpValue != null).length;
  return `${withValue} of ${programmeValuations.length}`;
}

/** When the published baselines were last confirmed against source. */
export function baselinesConfirmedStamp(): string {
  return baselinesConfirmed.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}
