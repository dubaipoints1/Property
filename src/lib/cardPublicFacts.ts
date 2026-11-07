type PublicFactsCard = {
  _provenance?: Record<string, string> | null;
  welcomeBonus?: unknown;
  welcomeBonusValue?: number;
  annualFeeWaiver?: unknown;
  _features?: readonly unknown[];
  perks?: readonly string[];
  interestRate?: unknown;
  minPayment?: string;
  cashAdvanceFee?: string;
  eligibility?: { salaryTransferRequired?: boolean | null; residencyRequired?: boolean | null };
  _dataIssues?: Record<string, string>;
  earnRates?: Record<string, unknown> & { everythingElse: number | null };
};

/** A field hold applies to the whole dependent claim. A held bonus tranche
 * must not escape through a headline, numeric sort, SSR card or client payload.
 * Canonical/editor records stay intact; these copies are for public consumers. */
export function cardFieldHeld(card: Pick<PublicFactsCard, "_provenance">, prefix: string): boolean {
  return Object.entries(card._provenance ?? {}).some(([field, state]) => state === "needs-review"
    && (field === prefix || field.startsWith(prefix + ".")));
}

export function publicCardFacts<T extends PublicFactsCard>(card: T): T {
  const out = { ...card };
  if (cardFieldHeld(card, "welcomeBonus")) {
    // A string is deliberately unpriced by welcomeBonusRank and cannot become
    // an AtAGlance numeric tile. This is unknown, not "no welcome offer".
    out.welcomeBonus = "Welcome offer pending source review.";
    delete out.welcomeBonusValue;
  }
  if (cardFieldHeld(card, "annualFeeWaiver")) out.annualFeeWaiver = null;
  if (card.earnRates) {
    const wholeRateHeld = card._provenance?.earnRates === "needs-review" || cardFieldHeld(card, "earnRates.model") || cardFieldHeld(card, "earnUnit")
      || cardFieldHeld(card, "earnRates._caps");
    const rates: Record<string, unknown> & { everythingElse: number | null } = wholeRateHeld
      ? { everythingElse: null } : { ...card.earnRates };
    if (!wholeRateHeld) for (const key of Object.keys(rates)) {
      if (!cardFieldHeld(card, "earnRates." + key)) continue;
      if (key === "everythingElse") rates.everythingElse = null;
      else delete rates[key];
    }
    out.earnRates = rates;
  }
  const emptyBenefitsUnconfirmed = Array.isArray(card._features) && card._features.length === 0
    && (!!card.perks?.length || !["editor-confirmed", "editor-confirmed-null", "editor-corrected"].includes(card._provenance?._features ?? ""));
  if (cardFieldHeld(card, "_features") || emptyBenefitsUnconfirmed) {
    // Keep the original index-based evidence map intact. Filtering/re-indexing
    // the array could attach a hold to the wrong benefit downstream.
    out._features = [];
    out.perks = [];
    // Empty public arrays must not become evidence of "None" or a competitor
    // winner. The conservative public projection withholds the whole benefit
    // summary; retain every original semantic/indexed hold for source history.
    out._provenance = { ...card._provenance, _features: "needs-review" };
    out._dataIssues = { ...card._dataIssues,
      _features: card._dataIssues?._features ?? "Some benefit conditions need confirmation. The automated benefit summary is withheld; absence here is not evidence that the card has no benefits. Read the current benefit conditions in this profile and the issuer sources.",
    };
  } else if (cardFieldHeld(card, "perks")) {
    // An uncertain prose fallback does not invalidate separately known typed
    // benefits. Keep their identities and indexes intact.
    out.perks = [];
  }
  if (cardFieldHeld(card, "interestRate")) delete out.interestRate;
  if (cardFieldHeld(card, "minPayment")) out.minPayment = "Pending source review";
  if (cardFieldHeld(card, "cashAdvanceFee")) out.cashAdvanceFee = "Pending source review";
  if (card.eligibility) {
    const parentHeld = card._provenance?.eligibility === "needs-review";
    const transferHeld = parentHeld || cardFieldHeld(card, "eligibility.salaryTransferRequired");
    const residencyHeld = parentHeld || cardFieldHeld(card, "eligibility.residencyRequired");
    if (transferHeld || residencyHeld) out.eligibility = {
      ...card.eligibility,
      ...(transferHeld ? { salaryTransferRequired: null } : {}),
      ...(residencyHeld ? { residencyRequired: null } : {}),
    };
  }
  return out;
}
