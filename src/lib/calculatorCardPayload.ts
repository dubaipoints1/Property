import type { CardData } from "./cardsData";

/** The spend calculator never reads source archives or scraper drafts. Keep
 * all financial inputs, uncertainty/provenance and scope conditions unchanged. */
export function calculatorCardPayload<T extends CardData>(cards: readonly T[]): Array<Omit<T, "_fieldEvidence" | "_scraped_freetext">> {
  return cards.map(({ _fieldEvidence: _auditArchive, _scraped_freetext: _scraperDraft, ...card }) => card);
}
