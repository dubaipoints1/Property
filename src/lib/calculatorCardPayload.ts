import type { CardData } from "./cardsData";
import { publicCardIssuerSourceFields } from "./cardIssuerReferences";

/** The spend calculator never reads source archives or scraper drafts. Keep
 * all financial inputs, uncertainty/provenance and scope conditions unchanged. */
export function calculatorCardPayload<T extends CardData>(cards: readonly T[]): Array<Omit<T, "_fieldEvidence" | "_scraped_freetext">> {
  return cards.map(original => {
    const { _fieldEvidence: _auditArchive, _scraped_freetext: _scraperDraft, ...card } = publicCardIssuerSourceFields(original);
    return card;
  });
}
