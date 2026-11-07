import type { CardData } from "./cardsData";

export const DIFFERENCE_SECTIONS = ["fees", "eligibility", "top", "rates", "welcome", "programme"] as const;
export type DifferenceSection = typeof DIFFERENCE_SECTIONS[number];
export type DifferenceDescriptor = { known: boolean; signature?: string };
export type CardDifference = Record<DifferenceSection, DifferenceDescriptor>;

/** Stable typed-data signature only: never formatted DOM text or rounding. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => JSON.stringify(key) + ":" + stable(item)).join(",") + "}";
  return JSON.stringify(value) ?? "undefined";
}

export function cardDifference(card: CardData & { slug?: string }, canonicalProgrammeId?: string): CardDifference {
  const provenance = card._provenance ?? {};
  const reviewed = (key: string) => provenance[key] === "editor-confirmed" || provenance[key] === "editor-corrected";
  const uncertain = (...prefixes: string[]) => Object.entries(provenance).some(([key, state]) => prefixes.some(prefix => key === prefix || key.startsWith(prefix + ".")) && (state === "needs-review" || state === "scraped"));
  const descriptor = (known: boolean, value: unknown): DifferenceDescriptor => known ? { known: true, signature: stable(value) } : { known: false };
  const joiningKnown = card.joiningFee ? reviewed("joiningFee") : provenance.joiningFee === "editor-confirmed-null";
  const waiverKnown = card.annualFeeWaiver === null ? provenance.annualFeeWaiver === "editor-confirmed-null"
    : typeof card.annualFeeWaiver === "object" && card.annualFeeWaiver !== null && reviewed("annualFeeWaiver");
  // An upper bound describes variable charges, not a confirmed exact fee.
  // Keep even matching nulls/bounds visible rather than treating them as
  // identical zero-cost facts or suppressing their scope/VAT caveats.
  const exactFxKnown = typeof card.fxFee === "number" && Number.isFinite(card.fxFee) && card.fxFee >= 0
    && card.fxFeeUpperBound === undefined;
  const fees = descriptor(exactFxKnown && reviewed("annualFee") && reviewed("fxFee") && joiningKnown && waiverKnown && !uncertain("annualFee", "fxFee", "fxFeeScope", "fxFeeVatTreatment", "fxFeeUpperBound", "joiningFee", "annualFeeWaiver", "vatPolicy"), {
    annualFee: card.annualFee, joiningFee: card.joiningFee, vatPolicy: card.vatPolicy,
    fxFee: card.fxFee, fxFeeScope: card.fxFeeScope, fxFeeVatTreatment: card.fxFeeVatTreatment, waiver: card.annualFeeWaiver,
  });
  const eligibility = descriptor(typeof card.eligibility.minSalary === "number" && Number.isFinite(card.eligibility.minSalary)
    && typeof card.eligibility.salaryTransferRequired === "boolean" && typeof card.eligibility.residencyRequired === "boolean"
    && card.eligibility.employmentTypes.length > 0 && reviewed("eligibility") && !uncertain("eligibility"), {
    ...card.eligibility,
    employmentTypes: [...new Set(card.eligibility.employmentTypes)].sort(),
    documents: [...new Set(card.eligibility.documents)].sort(),
  });
  const unmodelled = ["wio-credit", "liv-cashback", "liv-cashback-plus"].includes(card.slug ?? "");
  const rates = descriptor(!unmodelled && typeof card.earnRates.everythingElse === "number" && Number.isFinite(card.earnRates.everythingElse)
    && !card.scopedEarnRates?.length && reviewed("earnRates") && reviewed("earnUnit") && reviewed("loyaltyProgram")
    && Boolean(card.earnUnit?.trim()) && Boolean(card.loyaltyProgram?.trim()) && card.earnRates._caps !== undefined
    && !uncertain("earnRates", "earnUnit", "loyaltyProgram", "categories", "_features"), {
    earnRates: card.earnRates, earnUnit: card.earnUnit, programme: card.loyaltyProgram,
    categories: [...new Set(card.categories)].sort(), conditions: card._features,
  });
  const welcome = card.welcomeBonus;
  const branchKnown = (offer: unknown): boolean => {
    if (!offer || typeof offer !== "object") return false;
    const value = offer as Record<string, unknown>;
    return typeof value.amount === "number" && typeof value.unit === "string"
      && typeof value.spend_threshold_aed === "number" && typeof value.qualify_window_days === "number";
  };
  const structuredWelcome = welcome && typeof welcome === "object" && ("amount" in welcome ? branchKnown(welcome)
    : Object.values(welcome).length > 0 && Object.values(welcome).every(branchKnown));
  return {
    fees, eligibility, top: rates, rates,
    welcome: descriptor(Boolean(structuredWelcome) && reviewed("welcomeBonus") && !uncertain("welcomeBonus"), welcome),
    programme: descriptor(Boolean(canonicalProgrammeId) && reviewed("loyaltyProgram") && !uncertain("loyaltyProgram"), canonicalProgrammeId),
  };
}

/** Absence, pending, unmodelled and unlike units never count as equality. */
export function identicalKnownSections(cards: readonly CardDifference[]): DifferenceSection[] {
  if (cards.length < 2) return [];
  return DIFFERENCE_SECTIONS.filter(section => cards.every(card => card[section]?.known === true
    && typeof card[section].signature === "string" && card[section].signature === cards[0][section].signature));
}
