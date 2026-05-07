// Pure normaliser: (FetchedSource[], CardUrlSet) → draft card data.
//
// Maps marketing copy from a bank's product page + KFS PDF + welcome page
// (when separate) into the cards Zod shape declared in src/content.config.ts.
//
// Pure so it's unit-testable against fixture HTML without API calls.

import type { CardUrlSet, FetchedSource } from "./_lib.ts";
import {
  parseAED,
  parsePercent,
  parseMinSalary,
  parseEarnRate,
  parseSalaryTransferRequired,
} from "./_lib.ts";

export interface CardDraft {
  bank: string;
  name: string;
  network: "Visa" | "Mastercard" | "Amex";
  categories: string[];

  annualFee: { amount: number; currency: "AED" };
  fxFee: number;
  minPayment?: string;

  loyaltyProgram?: string;
  earnRates: {
    dining?: number;
    groceries?: number;
    shopping?: number;
    travel?: number;
    fuel?: number;
    entertainment?: number;
    online?: number;
    international?: number;
    everythingElse: number;
  };
  earnUnit?: string;

  welcomeBonus?: string;
  welcomeBonusValue?: number;

  eligibility: {
    minSalary: number;
    salaryTransferRequired: boolean;
    residencyRequired: boolean;
    employmentTypes: string[];
    minAge?: number;
  };

  perks: string[];

  applyUrl?: string;
  kfsUrl?: string;
  lastVerified: string; // ISO date
  sources: string[];

  /** Errors encountered during normalisation — surfaced in the propose PR for review. */
  _errors: string[];
}

/**
 * Concatenate all OK markdown into a single corpus for parsing.
 * Returns null + errors when no source is OK.
 */
function combine(sources: FetchedSource[]): { text: string; errors: string[] } {
  const okSources = sources.filter((s) => s.status === "ok");
  const errors = sources
    .filter((s) => s.status === "fail")
    .map((s) => `${s.url}: ${s.failReason}`);
  return {
    text: okSources.map((s) => s.markdown).join("\n\n---\n\n"),
    errors,
  };
}

/** Best-effort percent parser scoped to "FX fee" or "foreign currency" copy. */
function parseFxFee(text: string): number | null {
  const ctx = text.match(
    /(?:FX|foreign\s+currency|non-AED)[^.]*?(\d+(?:\.\d+)?)\s*%/i,
  );
  if (ctx) {
    const n = Number(ctx[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Best-effort annual-fee parser scoped to "annual fee" copy. */
function parseAnnualFee(text: string): number | null {
  const ctx = text.match(/annual\s+fee[^.]*?AED\s*([\d,]+)/i);
  if (ctx) {
    const n = Number(ctx[1].replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Pull "Up to N Skywards Miles" / "AED N cashback" welcome offers. */
function parseWelcome(text: string): string | null {
  const m =
    text.match(/welcome\s+(?:bonus|offer)[^.]*?\b(?:up\s+to|earn|get)\b[^.]+/i) ||
    text.match(/up\s+to\s+[\d,]+\s+(?:Skywards\s+Miles|Etihad\s+Guest\s+Miles|FAB\s+Rewards)[^.]*/i);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

/** Pull a numeric welcome value if recognisable. */
function parseWelcomeValue(welcome: string | null): number | null {
  if (!welcome) return null;
  const m = welcome.match(/([\d,]+)\s+(?:Skywards|Etihad|Avios|FAB|miles|points)/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  const aed = parseAED(welcome);
  return aed;
}

/** Bullet/list scrape for perks — anything resembling "<li>...</li>" content. */
function parsePerks(text: string): string[] {
  const lines = text.split(/\n/).map((l) => l.trim());
  return lines
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, "").trim())
    .filter((l) => l.length > 4 && l.length < 200);
}

/**
 * Map fetched sources + url-set config → CardDraft.
 *
 * Returns a partially-populated draft even when fields are missing;
 * the propose script flags missing required fields in its diff output.
 */
export function normalise(
  bankSlug: string,
  config: CardUrlSet,
  sources: FetchedSource[],
): CardDraft {
  const { text, errors } = combine(sources);
  const today = new Date().toISOString().slice(0, 10);

  const annualFee = parseAnnualFee(text);
  const fxFee = parseFxFee(text);
  const minSalary = parseMinSalary(text);
  const welcomeBonus = parseWelcome(text);
  const welcomeBonusValue = parseWelcomeValue(welcomeBonus);

  const earnRates = {
    dining: parseEarnRate(text, "dining") ?? undefined,
    groceries: parseEarnRate(text, "groceries") ?? undefined,
    shopping: parseEarnRate(text, "shopping") ?? undefined,
    travel: parseEarnRate(text, "travel") ?? undefined,
    fuel: parseEarnRate(text, "fuel") ?? undefined,
    entertainment: parseEarnRate(text, "entertainment") ?? undefined,
    online: parseEarnRate(text, "online") ?? undefined,
    international: parseEarnRate(text, "international") ?? undefined,
    everythingElse: 1, // sane default; overridden if base rate parseable
  };
  const baseRateMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:x|×|%)\s+(?:on\s+)?(?:all\s+)?(?:other|everything\s+else|every\s+spend)/i);
  if (baseRateMatch) {
    const n = Number(baseRateMatch[1]);
    if (Number.isFinite(n)) earnRates.everythingElse = n;
  }

  const draftErrors: string[] = [...errors];
  if (annualFee === null) draftErrors.push("Could not parse annual fee");
  if (fxFee === null) draftErrors.push("Could not parse FX fee");
  if (minSalary === null) draftErrors.push("Could not parse minimum salary");
  if (Object.values(earnRates).every((v) => v === undefined || v === 1)) {
    draftErrors.push("No earn-rate categories detected — base rate defaulted to 1");
  }

  const sourceUrls = sources.filter((s) => s.status === "ok").map((s) => s.url);

  return {
    bank: bankSlug,
    name: config.name,
    network: config.network,
    categories: config.categories,

    annualFee: { amount: annualFee ?? 0, currency: "AED" },
    fxFee: fxFee ?? 0,

    loyaltyProgram: config.loyaltyProgram,
    earnRates,
    earnUnit: config.loyaltyProgram
      ? `${config.loyaltyProgram} per AED 1 spent`
      : undefined,

    welcomeBonus: welcomeBonus ?? undefined,
    welcomeBonusValue: welcomeBonusValue ?? undefined,

    eligibility: {
      minSalary: minSalary ?? 0,
      salaryTransferRequired: parseSalaryTransferRequired(
        text,
        config.salaryTransferRequired,
      ),
      residencyRequired: true, // UAE law — always required
      employmentTypes: ["salaried"],
    },

    perks: parsePerks(text).slice(0, 12),

    applyUrl: config.urls.product,
    kfsUrl: config.urls.kfs ?? undefined,
    lastVerified: today,
    sources: sourceUrls,

    _errors: draftErrors,
  };
}
