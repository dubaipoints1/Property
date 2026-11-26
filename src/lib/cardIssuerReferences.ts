export type CardIssuerReferenceFields = {
  publicIssuerReferences?: {
    mode: "text-only";
    documents: readonly { title: string; detail: string }[];
  };
  sources?: string[];
  applyUrl?: string;
  kfsUrl?: string;
  _fieldEvidence?: unknown;
  _scraped_freetext?: unknown;
};

/** Link restrictions apply to public copies, not the canonical source record. */
export function publicCardIssuerSourceFields<T extends CardIssuerReferenceFields>(card: T): T {
  if (card.publicIssuerReferences?.mode !== "text-only") return card;
  const out = { ...card, sources: [] };
  delete out.applyUrl;
  delete out.kfsUrl;
  delete out._fieldEvidence;
  delete out._scraped_freetext;
  return out;
}

export function publicCardIssuerTermUrl(card: CardIssuerReferenceFields): string | undefined {
  if (card.publicIssuerReferences?.mode === "text-only") return undefined;
  return card.kfsUrl ?? card.sources?.[0];
}
