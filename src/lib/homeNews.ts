// Editorial selection only. Publication dates order news; guide review dates
// order guides. Neither stream can displace or re-date the other.
type PublishedEntry = { id: string; data: { publishedAt: Date } };
type UpdatedEntry = { id: string; data: { updatedAt: Date } };

export const HOME_NEWS_LIMIT = 6;
export const HOME_GUIDE_LIMIT = 3;
export const NEWS_EDITION_SIZE = 8;
export const NEWS_EARLIER_PREVIEW_SIZE = 3;

function orderedUnique<T extends { id: string }>(entries: readonly T[], date: (entry: T) => Date): T[] {
  const times = new Map<T, number>();
  for (const entry of entries) {
    const time = date(entry).getTime();
    if (!Number.isFinite(time)) throw new Error(`Invalid editorial date: ${entry.id}`);
    times.set(entry, time);
  }
  const ordered = [...entries].sort((a, b) => times.get(b)! - times.get(a)! || a.id.localeCompare(b.id, "en"));
  const seen = new Set<string>();
  return ordered.filter(entry => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

export function orderNews<T extends PublishedEntry>(entries: readonly T[]): T[] {
  return orderedUnique(entries, entry => entry.data.publishedAt);
}

export function selectHomeNews<T extends PublishedEntry>(entries: readonly T[]): T[] {
  return orderNews(entries).slice(0, HOME_NEWS_LIMIT);
}

export function selectHomeGuides<T extends UpdatedEntry>(entries: readonly T[]): T[] {
  return orderedUnique(entries, entry => entry.data.updatedAt).slice(0, HOME_GUIDE_LIMIT);
}

export function partitionNewsEdition<T extends PublishedEntry>(entries: readonly T[]) {
  const ordered = orderNews(entries);
  return {
    current: ordered.slice(0, NEWS_EDITION_SIZE),
    earlier: ordered.slice(NEWS_EDITION_SIZE, NEWS_EDITION_SIZE + NEWS_EARLIER_PREVIEW_SIZE),
    archive: ordered.slice(NEWS_EDITION_SIZE + NEWS_EARLIER_PREVIEW_SIZE),
    total: ordered.length,
  };
}

export function newsDeskLabel(beat?: string): string {
  switch (beat) {
    case "banking": return "Banking";
    case "airline": return "Airlines";
    case "hotel": return "Hotels";
    default: return "Newsroom";
  }
}

export function newsCategoryLabel(category: string): string {
  return category.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
