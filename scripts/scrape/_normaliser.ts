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

  /**
   * Audit-08: when the bonus copy parses cleanly we ship the typed
   * StructuredWelcomeBonus shape (matches src/lib/cardsData.ts). When the
   * parser can't lock down both `amount` and `unit` we fall back to the
   * raw marketing string so the editor still has something to type up by
   * hand. The L2 schema accepts either shape via `z.union`.
   */
  welcomeBonus?: StructuredWelcomeBonus | string;
  welcomeBonusValue?: number;

  /**
   * Always-present free-text capture of the welcome-bonus copy, even when
   * the structured parser succeeded. Lets the propose script keep stashing
   * the raw copy under `_scraped_freetext.welcomeBonus` for editor review
   * without having to round-trip the structured form back to a string.
   */
  welcomeBonusFreetext?: string;

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

/** C6 — sources that require multi-tier-aware handling. Typically the
 *  consolidated PDFs (Schedule-of-Charges / Key-Facts-Statements) that list
 *  every tier's fees on one page; auto-extracting annualFee or fxFee from
 *  such a corpus is a coin-flip across tiers. */
const SOF_URL_RX =
  /\b(?:sof|consolidated|schedule[-_\s]of[-_\s]charges|key[-_\s]facts[-_\s]statements?)\b/i;

/**
 * Heuristic: is this corpus a multi-tier consolidated SOF / KFS PDF?
 *
 *   (a) URL heuristic — any source URL containing `sof`, `consolidated`,
 *       `schedule-of-charges`, or `key-facts-statements` is SOF outright.
 *   (b) Text heuristic — > 3 distinct AED candidates within ±500 chars of
 *       an "Annual (Membership) Fee" header AND ≥ 3 of those candidates
 *       appear in the 400-char post-header window. The post-header
 *       tightening discriminates a real SOF table (multiple tier rows in
 *       quick succession) from a single-card page that happens to list
 *       several AED values within ±500 chars (welcome bonus + spend
 *       threshold + min salary + annual fee).
 *
 * When either signal fires, the caller marks annualFee and fxFee as
 * needs-review and returns null rather than guessing the wrong tier.
 */
function looksLikeMultiTierSof(text: string, sourceUrls: string[]): boolean {
  if (sourceUrls.some((u) => SOF_URL_RX.test(u))) return true;

  const headerRx = /annual\s+(?:membership\s+)?fee/gi;
  let m: RegExpExecArray | null;
  while ((m = headerRx.exec(text)) !== null) {
    const headerEnd = m.index + m[0].length;
    const wideStart = Math.max(0, m.index - 500);
    const wideEnd = Math.min(text.length, m.index + 500);
    const postEnd = Math.min(text.length, headerEnd + 400);

    const wide = text.slice(wideStart, wideEnd);
    const post = text.slice(headerEnd, postEnd);

    if (collectAedAmounts(wide).size > 3 && collectAedAmounts(post).size >= 3) {
      return true;
    }
  }
  return false;
}

function collectAedAmounts(window: string): Set<number> {
  const amounts = new Set<number>();
  const aedRx = /AED\s*([\d,]+(?:\.\d+)?)/gi;
  let a: RegExpExecArray | null;
  while ((a = aedRx.exec(window)) !== null) {
    const n = Number(a[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) amounts.add(n);
  }
  return amounts;
}

/** Best-effort percent parser scoped to "FX fee" or "foreign currency" copy.
 * Tolerated triggers: FX, foreign currency, non-AED, international,
 * cross-border, forex, foreign exchange, currency conversion. The window
 * after the trigger uses [\s\S] (not [^.]) so phrasings with periods
 * between trigger and value still match (e.g. "Foreign currency. Charged
 * at 2.49%."). */
function parseFxFee(text: string): number | null {
  const trigger =
    /(?:FX|foreign\s+(?:currency|exchange)|non-AED|international\s+(?:transaction|spend|purchase)|cross-border|forex(?:\s+markup)?|currency\s+conversion)/i;
  // Tight: trigger then up to 60 chars then digits + % (covers "FX fee 2.49%")
  let m = text.match(
    new RegExp(`${trigger.source}[\\s\\S]{0,60}?(\\d+(?:\\.\\d+)?)\\s*%`, "i"),
  );
  if (m) {
    const n = Number(m[1]);
    if (isPlausibleFxFee(n)) return n;
  }
  // Reverse: percent before trigger ("2.49% on foreign currency")
  m = text.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%[\\s\\S]{0,40}?${trigger.source}`, "i"),
  );
  if (m) {
    const n = Number(m[1]);
    if (isPlausibleFxFee(n)) return n;
  }
  return null;
}

/** UAE FX fee plausibility: 1.5%–5%. C6 raised the floor from 0.5% — no UAE
 *  retail card charges < 1.5% on FX, so a sub-1.5% candidate is almost always
 *  a VAT-on-FX line or marketing footnote, not the headline fee. */
function isPlausibleFxFee(n: number): boolean {
  return Number.isFinite(n) && n >= 1.5 && n <= 5;
}

/** Best-effort annual-fee parser. Tolerates UAE phrasings:
 *   "Annual Fee: AED 314"
 *   "Annual Card Fee AED 314"
 *   "Annual Membership Fee | AED 314"
 *   "Annual fee waived for the first year. AED 314 thereafter"
 *
 * Strategy:
 *   1. Tight match — "Annual (Card|Membership)? Fee" + AED <= 30 chars.
 *   2. Looser match — same trigger, AED within 100 chars (catches multi-line
 *      and waiver-clause phrasings like "Free for first year. AED 314.").
 *   3. Plausibility filter — UAE annual fees are AED 0–10,000. Anything else
 *      is almost certainly a min-spend threshold or other unrelated AED value.
 *
 * Returns 0 explicitly when the page says "Free", "AED 0", "no fee", or
 * "complimentary" near the trigger — different from "couldn't parse".
 */
function parseAnnualFee(text: string): number | null {
  const trigger =
    /annual\s+(?:card\s+|membership\s+|account\s+)?fee/i;

  // C6 — year-2 priority. "First year complimentary, AED 2,500 thereafter"
  // would otherwise trip the freeMatch branch below and return 0 (or a 250
  // first-year promo number via the tight match). If an explicit
  // "thereafter / from year 2 / year 2 onwards / second year" anchor is
  // present anywhere in the corpus, that figure wins.
  const year2 =
    text.match(
      /(?:from\s+year\s*2|year\s*2\s+onwards?|second\s+year(?:\s+onwards?)?|thereafter|year\s+two)\b[^.]*?AED\s*([\d,]+)/i,
    ) ??
    text.match(
      /AED\s*([\d,]+)[^.]{0,80}?(?:from\s+year\s*2|year\s*2\s+onwards?|second\s+year(?:\s+onwards?)?|thereafter|year\s+two)/i,
    );
  if (year2) {
    const n = Number(year2[1].replace(/,/g, ""));
    if (isPlausibleAnnualFee(n) && n > 0) return n;
  }

  // 0a — explicit "free" / "AED 0" / "no fee" near trigger
  const freeMatch = text.match(
    new RegExp(
      `${trigger.source}[\\s\\S]{0,40}?(?:free|AED\\s*0(?!\\d)|no\\s+fee|complimentary|nil)`,
      "i",
    ),
  );
  if (freeMatch) return 0;

  // 1 — tight: trigger + AED within 30 chars (handles "Annual Fee: AED 314",
  // "Annual Fee | AED 314", "Annual Fee\nAED 314")
  let m = text.match(
    new RegExp(`${trigger.source}[\\s\\S]{0,30}?AED\\s*([\\d,]+)`, "i"),
  );
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (isPlausibleAnnualFee(n)) return n;
  }

  // 2 — looser: trigger + AED within 100 chars (handles waiver clauses)
  m = text.match(
    new RegExp(`${trigger.source}[\\s\\S]{0,100}?AED\\s*([\\d,]+)`, "i"),
  );
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (isPlausibleAnnualFee(n)) return n;
  }

  return null;
}

/** UAE annual-fee plausibility: 0–10,000 AED. Reject larger values to avoid
 * confusing min-spend thresholds, credit limits, or other AED amounts on the
 * same page. */
function isPlausibleAnnualFee(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 10000;
}

/** Pull "Up to N Skywards Miles" / "AED N cashback" welcome offers.
 * Trigger phrases tolerated: welcome bonus, welcome offer, welcome reward,
 * sign-up bonus, joining bonus, joining offer, sign-on bonus, new card
 * bonus. Window after trigger uses [\s\S] so multi-line copy matches.
 *
 * Match captures up to the first sentence terminator (.!?) or end of
 * string after the action verb, so downstream parsers (detectAmount,
 * detectSpendThreshold, detectQualifyWindowDays) get the full
 * marketing sentence. */
function parseWelcome(text: string): string | null {
  const trigger =
    /(?:welcome|sign[\s-]?up|sign[\s-]?on|joining|new\s+card|new\s+customer|new\s+to\s+bank)\s+(?:bonus|offer|reward|gift|special|promotion)/i;
  // Trigger + action verb + greedy run-up to first period
  let m = text.match(
    new RegExp(
      `${trigger.source}[^.]*?\\b(?:up\\s+to|earn|get|receive|enjoy)\\b[^.]+`,
      "i",
    ),
  );
  if (m) return m[0].replace(/\s+/g, " ").trim();

  // Fallback 1: original FAB-style "Up to N (unit) miles/points"
  m = text.match(
    /up\s+to\s+[\d,]+\s+(?:Skywards\s+Miles|Etihad\s+Guest\s+Miles|FAB\s+Rewards|Avios|TouchPoints|Salaam|SHARE|LuLu)[^.]*/i,
  );
  if (m) return m[0].replace(/\s+/g, " ").trim();

  return null;
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

// ── Structured welcome-bonus parser ───────────────────────────────────────
//
// Audit-08 (council/scrape spike): produce the typed WelcomeBonus shape
// declared in src/lib/cardsData.ts so the propose script can write
// `welcomeBonus` directly instead of stashing only free-text. Returns null
// when the input doesn't have all the load-bearing fields — null forces the
// propose script to keep the editor's existing typed value untouched and
// stash the freetext for review.

/** Mirror of the REWARD_UNIT enum in src/lib/cardsData.ts. */
export type RewardUnit =
  | "skywards_miles"
  | "etihad_guest_miles"
  | "qatar_avios"
  | "saudia_alfursan"
  | "share_points"
  | "lulu_points"
  | "upoints"
  | "fab_rewards"
  | "enbd_plus_points"
  | "enbd_smiles"
  | "adcb_touchpoints"
  | "mashreq_salaam"
  | "aed_cashback"
  | "aed_voucher"
  | "aed_credit";

export interface StructuredWelcomeBonus {
  amount: number;
  unit: RewardUnit;
  spend_threshold_aed: number | null;
  qualify_window_days: number | null;
  headline_value_aed?: number;
  notes?: string;
}

/**
 * Map a UAE bank's marketing phrasing for a reward unit to the canonical
 * REWARD_UNIT enum. Order matters — the longer / more specific phrases
 * MUST come first or "miles" would match "skywards miles" by accident.
 *
 * Synced by hand with REWARD_UNIT in src/lib/cardsData.ts. If you add
 * a new unit there, add a phrase here too.
 */
const UNIT_PATTERNS: Array<{ rx: RegExp; unit: RewardUnit }> = [
  { rx: /skywards\s+miles?/i, unit: "skywards_miles" },
  { rx: /etihad\s+guest(?:\s+miles?)?/i, unit: "etihad_guest_miles" },
  { rx: /qatar\s+(?:airways\s+)?avios|qmiles|privilege\s+club/i, unit: "qatar_avios" },
  { rx: /alfursan|saudia(?:\s+alfursan)?/i, unit: "saudia_alfursan" },
  { rx: /share\s+points?/i, unit: "share_points" },
  { rx: /lulu\s+points?/i, unit: "lulu_points" },
  { rx: /upoints?|u\s+by\s+emaar/i, unit: "upoints" },
  { rx: /fab\s+rewards?(?:\s+points?)?/i, unit: "fab_rewards" },
  { rx: /enbd\s+plus|emirates\s+nbd\s+plus/i, unit: "enbd_plus_points" },
  { rx: /smiles\s+points?|smiles(?=\s|$)/i, unit: "enbd_smiles" },
  { rx: /adcb\s+touch\s*points?|touch\s*points?/i, unit: "adcb_touchpoints" },
  { rx: /salaam\s+points?|mashreq\s+salaam/i, unit: "mashreq_salaam" },
  { rx: /(?:aed|dh)\s*[\d,]+\s+cashback|cashback/i, unit: "aed_cashback" },
  { rx: /voucher/i, unit: "aed_voucher" },
  { rx: /statement\s+credit|credit\s+back/i, unit: "aed_credit" },
];

function detectUnit(text: string): RewardUnit | null {
  for (const { rx, unit } of UNIT_PATTERNS) {
    if (rx.test(text)) return unit;
  }
  return null;
}

/**
 * Pull the welcome-bonus amount. We prefer the number that sits closest to
 * the unit phrase ("30,000 FAB Rewards") rather than the spend-threshold
 * number ("AED 5,000 in 60 days"), so we anchor the regex on the unit.
 *
 * For AED-denominated bonuses the amount is the AED figure that follows
 * earn / receive / get and is NOT framed as the spend threshold.
 */
function detectAmount(text: string, unit: RewardUnit): number | null {
  // AED-denominated bonuses: capture the bonus AED, distinct from the
  // spend-threshold AED. Two phrasings cover most UAE marketing copy:
  //   1. "<verb> [up to] AED N (cashback|voucher|credit|back)"
  //      ("Earn AED 500 cashback", "Get up to AED 1,500 credit")
  //   2. "AED N (cashback|voucher|credit) on AED M ..."
  //      ("Up to AED 500 cashback on AED 10,000 spend") — verbless,
  //      common when the headline sits in a "Welcome bonus" sub-heading.
  // We try the verbed pattern first because it's stricter; the verbless
  // pattern is anchored on the unit word being immediately adjacent so
  // it can't capture the *spend-threshold* AED (which is followed by
  // "spend", not by "cashback").
  if (unit === "aed_cashback" || unit === "aed_voucher" || unit === "aed_credit") {
    const verbed = text.match(
      /(?:earn|receive|get|enjoy)\s+(?:up\s+to\s+)?AED\s*([\d,]+)\s*(?:cashback|voucher|credit|back)/i,
    );
    if (verbed) {
      const n = Number(verbed[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
    const verbless = text.match(
      /(?:up\s+to\s+)?AED\s*([\d,]+)\s+(?:cashback|voucher|credit|statement\s+credit|credit\s+back)\b/i,
    );
    if (verbless) {
      const n = Number(verbless[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }

  // Points/miles bonuses: number adjacent to the unit phrase.
  // Search within 40 chars before the unit name for a 3+-digit grouped
  // number (so "AED 5,000" spend thresholds won't match — they need
  // "AED" prefix which we exclude).
  const unitRx = UNIT_PATTERNS.find((p) => p.unit === unit)?.rx;
  if (!unitRx) return null;
  const unitMatch = text.match(unitRx);
  if (!unitMatch || unitMatch.index === undefined) return null;

  const lookback = text.slice(Math.max(0, unitMatch.index - 40), unitMatch.index);
  // Reject "AED N" — that's a currency, not a points count.
  const amt = lookback.match(/(?:^|[^A-Za-z])([\d,]{3,})\s*$/);
  if (amt) {
    const raw = amt[1].replace(/,/g, "");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 100) return n;
  }
  return null;
}

/**
 * Pull the spend threshold. In UAE marketing copy the spend threshold is
 * almost always written "spend AED N" or "on AED N" — never bare numbers.
 * We require the AED prefix to avoid capturing the bonus amount itself.
 */
function detectSpendThreshold(text: string): number | null {
  const m =
    text.match(/(?:spend(?:ing)?|on|after)\s+AED\s*([\d,]+)/i) ??
    text.match(/AED\s*([\d,]+)\s+(?:cumulative\s+)?spend/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/**
 * Pull the qualifying window in days. Tolerates:
 *   - "first 60 days"
 *   - "within 90 days"
 *   - "first 3 months" → 90 days
 *   - "in your first month" → 30 days
 */
function detectQualifyWindowDays(text: string): number | null {
  // days
  let m = text.match(/(?:first|within|in\s+your\s+first)\s+(\d+)\s+days?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // months → multiply by 30
  m = text.match(/(?:first|within|in\s+your\s+first)\s+(\d+)\s+months?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n * 30;
  }
  // singular "first month"
  if (/(?:first|within|in\s+your\s+first)\s+month\b/i.test(text)) return 30;
  return null;
}

/**
 * Parse a marketing string into the structured WelcomeBonus shape.
 *
 * Returns null when amount or unit can't be confidently detected — partial
 * matches would mislead the editor more than they help. Spend threshold
 * and qualify window are nullable per the schema, so missing those is fine.
 *
 * The free-text version is kept separately by the caller (see normalise()
 * below) so the editor still has the raw copy to verify against.
 */
export function parseWelcomeBonus(input: string): StructuredWelcomeBonus | null {
  if (!input || typeof input !== "string") return null;
  // Compact whitespace so cross-line copy is matchable.
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length < 10) return null;

  const unit = detectUnit(text);
  if (!unit) return null;

  const amount = detectAmount(text, unit);
  if (amount === null) return null;

  return {
    amount,
    unit,
    spend_threshold_aed: detectSpendThreshold(text),
    qualify_window_days: detectQualifyWindowDays(text),
  };
}

/**
 * Bullet/list scrape for perks — filters to plausible card-feature lines.
 *
 * Rejects bullets that look like site navigation:
 *   - lines that are only a markdown link, e.g. "[Personal Online Banking](https://...)"
 *   - lines mentioning common chrome words (banking, login, portal, etc.)
 *   - lines mentioning bank-specific platform / sub-brand names (per the
 *     `BANK_NAV_OVERRIDES` map below)
 *   - lines under 8 chars or over 200 chars
 *
 * Generalising the bank-specific filter lets a new bank scraper inherit the
 * generic rules and only ship its own override regex for its in-house chrome
 * (mobile app brand, digital sub-brand, corporate-banking line names, etc.).
 */
const GENERIC_NAV_RX = /\b(?:online\s+banking|portal|login|subscription|corporate|securities|ipo|business\s+banking|investment\s+banking|securities\s+services|ibanking|adgm|prepaid\s+card\s+balance)\b/i;

const BANK_NAV_OVERRIDES: Record<string, RegExp> = {
  // FAB chrome: FABonline (web banking), FABaccess (mobile app), bankfab.com
  fab: /\b(?:fabonline|fabe?access|bankfab\.com)\b/i,
  // ENBD chrome: Liv. (digital sub-brand), ENBD X (mobile app brand),
  // smartBUSINESS / smartTRADE (corporate platforms), WealthLine (advisory)
  enbd: /\b(?:liv\.?\s+by\s+(?:emirates\s+nbd|enbd)|enbd\s+x\b|smartbusiness|smarttrade|wealthline)\b/i,
};

function parsePerks(text: string, bankSlug: string): string[] {
  const bankNavRx = BANK_NAV_OVERRIDES[bankSlug];
  const ONLY_LINK_RX = /^\[[^\]]+\]\(https?:[^)]+\)\s*\.?$/;

  const lines = text.split(/\n/).map((l) => l.trim());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    if (!/^[-*•]\s+/.test(raw)) continue;
    const line = raw.replace(/^[-*•]\s+/, "").trim();
    if (line.length < 8 || line.length > 200) continue;
    if (ONLY_LINK_RX.test(line)) continue;
    if (GENERIC_NAV_RX.test(line)) continue;
    if (bankNavRx?.test(line)) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

/**
 * Plausible UAE card earn rate. Anything above the cap is almost always
 * welcome-bonus contamination ("Earn 40,000 Etihad Guest Miles" → 40 mistaken
 * for 40%). Real rates on UAE cards top out around 8% (cashback) or 8 miles
 * per AED. Above 10 → mark as suspicious; we return null so the field stays
 * undefined and the propose script surfaces a needs-review warning.
 */
const PLAUSIBLE_EARN_MAX = 10;
function plausibleRate(n: number | null): number | null {
  if (n === null) return null;
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > PLAUSIBLE_EARN_MAX) return null;
  return n;
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

  // C6 — consolidated SOF / KFS PDFs list every tier on one page. Both
  // annualFee and fxFee become coin-flips across tiers, so we short-circuit
  // to null and surface a "needs editor confirmation" warning instead of
  // shipping the wrong tier number.
  const sourceUrlList = sources
    .filter((s) => s.status === "ok")
    .map((s) => s.url);
  const isMultiTierSof = looksLikeMultiTierSof(text, sourceUrlList);

  const annualFee = isMultiTierSof ? null : parseAnnualFee(text);
  const fxFee = isMultiTierSof ? null : parseFxFee(text);
  const minSalary = parseMinSalary(text);

  // Welcome bonus: prefer the typed StructuredWelcomeBonus shape; fall back
  // to the free-text marketing string (the L2 schema accepts either via
  // z.union). welcomeBonusFreetext always holds the raw copy so propose
  // can stash it under _scraped_freetext.welcomeBonus for editor review.
  const welcomeFreetext = parseWelcome(text);
  const welcomeStructured = welcomeFreetext
    ? parseWelcomeBonus(welcomeFreetext)
    : null;
  const welcomeBonus: StructuredWelcomeBonus | string | undefined =
    welcomeStructured ?? welcomeFreetext ?? undefined;
  const welcomeBonusValue =
    welcomeStructured?.amount ?? parseWelcomeValue(welcomeFreetext);

  // Apply plausibility cap (≤ PLAUSIBLE_EARN_MAX) so welcome-bonus mile counts
  // can't masquerade as 40% earn rates on travel/online.
  const earnRates = {
    dining: plausibleRate(parseEarnRate(text, "dining")) ?? undefined,
    groceries: plausibleRate(parseEarnRate(text, "groceries")) ?? undefined,
    shopping: plausibleRate(parseEarnRate(text, "shopping")) ?? undefined,
    travel: plausibleRate(parseEarnRate(text, "travel")) ?? undefined,
    fuel: plausibleRate(parseEarnRate(text, "fuel")) ?? undefined,
    entertainment: plausibleRate(parseEarnRate(text, "entertainment")) ?? undefined,
    online: plausibleRate(parseEarnRate(text, "online")) ?? undefined,
    international: plausibleRate(parseEarnRate(text, "international")) ?? undefined,
    everythingElse: 1, // sane default; overridden if base rate parseable
  };
  const baseRateMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:x|×|%)\s+(?:on\s+)?(?:all\s+)?(?:other|everything\s+else|every\s+spend)/i);
  if (baseRateMatch) {
    const n = Number(baseRateMatch[1]);
    if (Number.isFinite(n)) earnRates.everythingElse = n;
  }

  const draftErrors: string[] = [...errors];
  if (isMultiTierSof) {
    draftErrors.push(
      "Multi-tier SOF page — annualFee not auto-extracted; needs editor confirmation",
    );
    draftErrors.push(
      "Multi-tier SOF page — fxFee not auto-extracted; needs editor confirmation",
    );
  } else {
    if (annualFee === null) draftErrors.push("Could not parse annual fee");
    if (fxFee === null) draftErrors.push("Could not parse FX fee");
  }
  if (minSalary === null) draftErrors.push("Could not parse minimum salary");
  if (Object.values(earnRates).every((v) => v === undefined || v === 1)) {
    draftErrors.push("No earn-rate categories detected — base rate defaulted to 1");
  }
  if (welcomeFreetext && !welcomeStructured) {
    draftErrors.push(
      "Welcome bonus copy detected but could not be parsed into the typed shape — fell back to free-text",
    );
  }

  const sourceUrls = sourceUrlList;

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

    welcomeBonus: welcomeBonus,
    welcomeBonusFreetext: welcomeFreetext ?? undefined,
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

    perks: parsePerks(text, bankSlug).slice(0, 12),

    applyUrl: config.urls.product,
    kfsUrl: config.urls.kfs ?? undefined,
    lastVerified: today,
    sources: sourceUrls,

    _errors: draftErrors,
  };
}
