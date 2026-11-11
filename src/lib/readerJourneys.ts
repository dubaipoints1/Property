// Navigation, not recommendations: use only explicit collection references
// and a small editorial route map. No prose extraction, financial scoring,
// inferred eligibility, browser storage or network calls.

export interface ReaderAction {
  href: string;
  label: string;
  kind: "tool" | "programme" | "card" | "bank" | "directory" | "guide";
}

export interface ReaderGuide {
  id: string;
  title: string;
  updatedAt: Date;
  cards: readonly string[];
  programmes: readonly string[];
}

export interface ReaderContext {
  section: "guides" | "news" | "deals";
  id: string;
  category?: string;
  cards?: readonly string[];
  programmes?: readonly string[];
  banks?: readonly string[];
}

export interface ReaderCatalogue {
  cards: readonly { id: string; name: string; bank: string }[];
  programmes: readonly { id: string; name: string; href: string }[];
  banks: readonly { id: string; name: string }[];
  guides: readonly ReaderGuide[];
}

interface EditorialJourney {
  actions: readonly ReaderAction[];
  guides?: readonly string[];
}

// These are route-to-route editorial choices, not guessed topic tags. An
// entry is used only for this exact guide, and a guide target must exist.
const GUIDE_JOURNEYS: Readonly<Record<string, EditorialJourney>> = {
  "uae-credit-card-eligibility-2026": {
    actions: [{ href: "/cards/finder/", label: "Find cards by salary and rewards", kind: "tool" }],
    guides: ["aecb-credit-report-walkthrough", "expat-starter-first-credit-card"],
  },
  "aecb-credit-report-walkthrough": {
    actions: [{ href: "/guides/uae-credit-card-eligibility-2026/", label: "Read the card eligibility guide", kind: "guide" }],
    guides: ["expat-starter-first-credit-card"],
  },
  "salary-transfer-mechanics-2026": {
    actions: [
      { href: "/salary-transfer/", label: "Compare salary-transfer offers", kind: "tool" },
      { href: "/salary-transfer/calculator/", label: "Calculate a salary-transfer reward", kind: "tool" },
    ],
    guides: ["choosing-first-uae-bank"],
  },
  "choosing-first-uae-bank": {
    actions: [{ href: "/banks/", label: "Browse UAE bank coverage", kind: "directory" }],
    guides: ["salary-transfer-mechanics-2026", "expat-starter-banking-basics"],
  },
  "expat-starter-banking-basics": {
    actions: [{ href: "/banks/", label: "Browse UAE bank coverage", kind: "directory" }],
    guides: ["choosing-first-uae-bank", "salary-transfer-mechanics-2026"],
  },
  "expat-starter-first-credit-card": {
    actions: [
      { href: "/cards/finder/", label: "Shortlist cards by salary and spending", kind: "tool" },
      { href: "/cards/fees/", label: "Check annual fees and first-year waivers", kind: "directory" },
      { href: "/cards/compare/", label: "Open the side-by-side comparison", kind: "tool" },
    ],
    guides: ["uae-credit-card-eligibility-2026", "aecb-credit-report-walkthrough"],
  },
  "uae-transfer-ratios-2026": {
    actions: [{ href: "/transfer-finder/", label: "Find a bank-points transfer route", kind: "tool" }],
    guides: ["expat-starter-points-101"],
  },
  "paint-protection-film-dubai": {
    actions: [{ href: "/guides/expat-starter-car-costs/", label: "Read the UAE car-costs guide", kind: "guide" }],
    guides: ["expat-starter-car-costs"],
  },
  "expat-starter-avoid-mistakes": {
    actions: [{ href: "/guides/expat-starter/", label: "Start with the UAE banking and cards guide", kind: "guide" }],
    guides: ["expat-starter-banking-basics"],
  },
};

const unique = (values: readonly string[] = []) => [...new Set(values)];
const pathFor = (context: ReaderContext) => `/${context.section}/${context.id}/`;

export function resolveReaderJourney(context: ReaderContext, catalogue: ReaderCatalogue) {
  const cardMap = new Map(catalogue.cards.map((c) => [c.id, c]));
  const programmeMap = new Map(catalogue.programmes.map((p) => [p.id, p]));
  const bankMap = new Map(catalogue.banks.map((b) => [b.id, b]));
  const guideMap = new Map(catalogue.guides.map((g) => [g.id, g]));
  const cards = unique(context.cards).filter((id) => cardMap.has(id));
  const programmes = unique(context.programmes).filter((id) => programmeMap.has(id));
  const banks = unique([...(context.banks ?? []), ...cards.map((id) => cardMap.get(id)!.bank)])
    .filter((id) => bankMap.has(id));
  const currentPath = pathFor(context);
  const curated = context.section === "guides" ? GUIDE_JOURNEYS[context.id] : undefined;
  const actions: ReaderAction[] = [];
  const add = (action: ReaderAction) => {
    if (!action.href.startsWith("/") || action.href.startsWith("//") || action.href === currentPath || actions.some((a) => a.href === action.href)) return;
    if (action.kind === "guide" && !guideMap.has(action.href.split("/")[2])) return;
    actions.push(action);
  };
  curated?.actions.forEach(add);
  if (context.category === "salary-transfer") {
    add({ href: "/salary-transfer/", label: "Compare salary-transfer offers", kind: "tool" });
    add({ href: "/salary-transfer/calculator/", label: "Calculate a salary-transfer reward", kind: "tool" });
  }
  // A deliberate editorial journey supersedes incidental entity references
  // (e.g. a programme mentioned in a guide about card eligibility).
  if (!curated) {
    for (const id of programmes.slice(0, 2)) {
      const programme = programmeMap.get(id)!;
      add({ href: programme.href, label: `Read the ${programme.name} guide`, kind: "programme" });
    }
    if (cards.length > 1) {
      add({ href: `/cards/compare/?cards=${cards.slice(0, 4).join(",")}`, label: "Compare cards mentioned here", kind: "tool" });
    } else if (cards.length === 1) {
      const card = cardMap.get(cards[0])!;
      add({ href: `/cards/${card.id}/`, label: `Read the ${card.name} review`, kind: "card" });
    }
  }
  // The named bank is a useful continuation for an offer or bank story,
  // but not a new claim about a card's value or current offer availability.
  if (!curated && context.section !== "guides") {
    for (const id of banks.slice(0, 2)) {
      add({ href: `/banks/${id}/`, label: `Explore ${bankMap.get(id)!.name} coverage`, kind: "bank" });
    }
  }
  if (context.section === "deals") add({ href: "/deals/", label: "Browse current deals", kind: "directory" });

  const shares = (a: readonly string[], b: readonly string[]) => a.filter((id) => b.includes(id)).length;
  const chosen = new Set<string>();
  const relatedGuides: ReaderGuide[] = [];
  const addGuide = (guide: ReaderGuide | undefined) => {
    if (!guide || `/guides/${guide.id}/` === currentPath || chosen.has(guide.id) || actions.some((a) => a.href === `/guides/${guide.id}/`)) return;
    chosen.add(guide.id);
    relatedGuides.push(guide);
  };
  curated?.guides?.forEach((id) => addGuide(guideMap.get(id)));
  catalogue.guides.map((guide) => {
    const guideBanks = unique(guide.cards.map((id) => cardMap.get(id)?.bank).filter((b): b is string => Boolean(b)));
    return { guide, score: shares(programmes, guide.programmes) * 3 + shares(cards, guide.cards) * 2 + shares(banks, guideBanks) };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.guide.updatedAt.getTime() - a.guide.updatedAt.getTime() || a.guide.id.localeCompare(b.guide.id))
    .forEach(({ guide }) => addGuide(guide));

  return { actions: actions.slice(0, 3), relatedGuides: relatedGuides.slice(0, 2) };
}
