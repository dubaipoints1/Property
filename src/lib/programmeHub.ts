/** Editorial joins only: explicit references, original dates and no inferred facts. */
type Reference = { id: string };
type RelatedEntry = {
  id: string;
  data: { relatedPrograms: readonly Reference[]; publishedAt: Date };
};
type NewsEntry = RelatedEntry & { data: { staleAfter?: Date } };
type GuideEntry = RelatedEntry & { data: { updatedAt: Date } };
type DealEntry = {
  id: string;
  data: { program?: Reference; publishedAt: Date; expiresOn: Date; archived: boolean };
};

const time = (date: Date) => date.getTime();
const valid = (date: Date) => date instanceof Date && Number.isFinite(time(date));
const endOfUtcDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
const tie = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id, "en");
function unique<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => !seen.has(item.id) && Boolean(seen.add(item.id)));
}

/** Build-time curation, not a source-verification or real-time availability claim.
 * A news staleAfter date is inclusive through its UTC calendar day. Deals use
 * the site's existing exact expiresOn instant contract, not a new timezone rule.
 */
export function selectProgrammeHub<N extends NewsEntry, G extends GuideEntry, D extends DealEntry>(
  programme: string,
  input: { news: readonly N[]; guides: readonly G[]; deals: readonly D[] },
  now = new Date(),
) {
  if (!valid(now)) throw new Error("A valid programme hub build date is required.");
  const nowMs = time(now);
  const published = (entry: { data: { publishedAt: Date } }) => valid(entry.data.publishedAt) && time(entry.data.publishedAt) <= nowMs;
  const related = (entry: RelatedEntry) => entry.data.relatedPrograms.some(ref => ref.id === programme);
  const news = unique(input.news.filter(entry => related(entry) && published(entry)
    && (!entry.data.staleAfter || (valid(entry.data.staleAfter) && endOfUtcDay(entry.data.staleAfter) > nowMs)))
    .sort((a, b) => time(b.data.publishedAt) - time(a.data.publishedAt) || tie(a, b))).slice(0, 3);
  const guides = unique(input.guides.filter(entry => related(entry) && published(entry)
    && valid(entry.data.updatedAt) && time(entry.data.updatedAt) <= nowMs)
    .sort((a, b) => time(b.data.updatedAt) - time(a.data.updatedAt) || tie(a, b))).slice(0, 3);
  const deals = unique(input.deals.filter(entry => entry.data.program?.id === programme && published(entry)
    && !entry.data.archived && valid(entry.data.expiresOn) && time(entry.data.expiresOn) >= nowMs)
    .sort((a, b) => time(a.data.expiresOn) - time(b.data.expiresOn) || tie(a, b))).slice(0, 3);
  return { news, guides, deals };
}
