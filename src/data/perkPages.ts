/**
 * Which typed perks get a page of their own at /cards/perks/<slug>/.
 *
 * `_features` carries fourteen types. Eleven of them cover between one and
 * five cards, and a comparison page listing one card is not a comparison —
 * it is a link with a table around it, which is the thin-content shape the
 * 2026-07-27 honest-nav rule exists to prevent. Only types with enough cards
 * to compare get a page; the rest stay as chips on /cards/, which is where a
 * reader meets them today.
 *
 * The threshold is asserted, not remembered: tests/cards/perk-pages.test.ts
 * fails if a listed perk drops below it, and flags a type that has grown
 * past it without being added here.
 */
import type { CardFeature } from "~/lib/cardsData";

/** Minimum cards before a perk is worth a page of its own. */
export const PERK_PAGE_MIN_CARDS = 8;

export interface PerkPage {
  /** URL segment. */
  slug: string;
  /** The `_features` discriminator this page filters on. */
  feature: CardFeature["type"];
  /** H1 and <title> stem. */
  heading: string;
  /** Meta description. */
  description: string;
  /** Header for the first column, which carries the perk's own detail. */
  detailColumn: string;
}

export const PERK_PAGES: readonly PerkPage[] = [
  {
    slug: "lounge-access",
    feature: "lounge_access",
    heading: "UAE credit cards with airport lounge access",
    description:
      "Every UAE credit card we cover that includes airport lounge access, with the number of visits each one allows, its annual fee and its salary requirement.",
    detailColumn: "Lounge access",
  },
  {
    slug: "golf",
    feature: "golf",
    heading: "UAE credit cards with golf benefits",
    description:
      "UAE credit cards that include complimentary golf rounds or tee-time benefits, compared on annual fee, salary requirement and welcome bonus.",
    detailColumn: "Golf",
  },
  {
    slug: "travel-insurance",
    feature: "insurance_travel",
    heading: "UAE credit cards with travel insurance",
    description:
      "UAE credit cards that include travel insurance cover, compared on annual fee, salary requirement and welcome bonus. Cover terms sit with the issuer.",
    detailColumn: "Travel insurance",
  },
] as const;
