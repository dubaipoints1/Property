// Propose-changes script (Audit-06 — typed fields + freetext stash).
//
// Reads the most recent scrape output for each bank under data/scraped/<bank>/
// and merges parsed fields into src/data/cards.json with these rules:
//
//   - Per-field merge: each field gets a _provenance entry. Editor-confirmed
//     fields are NEVER overwritten by a scrape.
//   - Typed fields (welcomeBonus / annualFeeWaiver / _features) the scraper
//     does NOT write directly. Scraper produces free-text; that free-text
//     is stashed in _scraped_freetext for the editor to type up later.
//   - PR_BODY.md is always written with the per-card change summary.

import fs from "node:fs";
import path from "node:path";

interface ScrapeFile {
  bankSlug: string;
  scrapedAt: string;
  cards: Array<{
    slug: string;
    name: string;
    fetched: Array<{ url: string; status: string; failReason?: string }>;
    draft: Record<string, unknown> | null;
    errors: string[];
  }>;
}

interface ProvenanceMap {
  [key: string]: "scraped" | "editor-confirmed" | "editor-corrected" | "needs-review";
}

interface CardEntry {
  [k: string]: unknown;
  _provenance?: ProvenanceMap;
  _lastScraped?: string | null;
  _lastReviewed?: string | null;
}

const SCRAPED_DIR = path.join("data", "scraped");
const CARDS_DATA_PATH = path.join("src", "data", "cards.json");
const PR_BODY_PATH = "PR_BODY.md";

/**
 * Top-level fields the scraper writes directly into cards.json.
 *
 * `welcomeBonus` was restored 2026-05-08 (Council STATUS Q-A resolved):
 * the normaliser's `parseWelcomeBonus()` now emits a structured object
 * (or string fallback) at `draft.welcomeBonus`, which routes here.
 *
 * `annualFeeWaiver` and `_features` typed forms are still NOT scraped —
 * those remain editor-only per the LLM-extraction policy in CLAUDE.md.
 */
export const SCRAPED_FIELDS = [
  "bank",
  "name",
  "network",
  "categories",
  "annualFee",
  "fxFee",
  "loyaltyProgram",
  "earnRates",
  "earnUnit",
  "welcomeBonus",
  "welcomeBonusValue",
  "eligibility",
  "applyUrl",
  "kfsUrl",
  "lastVerified",
  "sources",
] as const;

/**
 * Scraper-produced free-text fields. Map of target stash key → draft source key.
 *
 * `welcomeBonus` (target) sources from `welcomeBonusFreetext` (the normaliser's
 * always-raw copy) so the editor can audit the structured parse against the
 * raw bank copy. `annualFeeWaiver` and `perks` keep matching keys.
 *
 * `partnerBrands` (C1, May 2026) captures raw lines from the bank's product
 * page that mention any of the 22 PartnerBrand clusters. The editor maps
 * these onto slugs by hand per the C1.1 SOP — Charter §6 forbids LLM
 * mapping for typed taxonomies.
 *
 * These land under `_scraped_freetext.<target>` and never overwrite the typed
 * editor versions at the top level.
 */
export const FREETEXT_FIELDS = {
  welcomeBonus: "welcomeBonusFreetext",
  annualFeeWaiver: "annualFeeWaiver",
  perks: "perks",
  partnerBrands: "partnerBrands",
} as const;

/**
 * Editor-typed-only fields. The scraper never writes these directly — only
 * to their `_scraped_freetext.<name>` evidence trail. On a fresh scrape we
 * still mark `_provenance.<name> = "needs-review"` so the audit can detect
 * unbackfilled cards.
 *
 * C1 (May 2026): added `partnerBrands`. `annualFeeWaiver` and `_features`
 * have always been editor-typed but predate this constant; they continue
 * to fall through to the existing editor-only flow.
 */
export const EDITOR_TYPED_ONLY_FIELDS = ["partnerBrands"] as const;

function latestScrape(bankSlug: string): ScrapeFile | null {
  const dir = path.join(SCRAPED_DIR, bankSlug);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) return null;
  const file = path.join(dir, files[files.length - 1]);
  return JSON.parse(fs.readFileSync(file, "utf8")) as ScrapeFile;
}

function loadCardsData(): Record<string, CardEntry> {
  if (!fs.existsSync(CARDS_DATA_PATH)) return {};
  return JSON.parse(fs.readFileSync(CARDS_DATA_PATH, "utf8")) as Record<string, CardEntry>;
}

function writeCardsData(data: Record<string, CardEntry>): void {
  // Stable key order for diffs.
  const sorted = Object.keys(data)
    .sort()
    .reduce<Record<string, CardEntry>>((acc, k) => {
      acc[k] = data[k];
      return acc;
    }, {});
  fs.writeFileSync(
    CARDS_DATA_PATH,
    JSON.stringify(sorted, null, 2) + "\n",
  );
}

interface MergeOutcome {
  changedFields: string[];
  preservedFields: string[];
  newCard: boolean;
}

/**
 * Merge a scraped draft into the existing card entry.
 *
 * Rules:
 *   - If existing entry has _provenance[field] === "editor-confirmed" or
 *     "editor-corrected", the scrape NEVER overwrites it.
 *   - Fields with _provenance "scraped" or "needs-review" or absent are
 *     replaced with the new scraped value.
 *   - All replaced fields get _provenance = "scraped".
 *   - _lastScraped is set to today's date.
 */
/**
 * Plausibility check for a scraped welcome-bonus value before it's written
 * to the top-level L2 `welcomeBonus` field. Closes the 6 June 2026 PR #207
 * audit's "ENBD cross-contamination" finding: the scraper captured the
 * issuer's shared promotional-banner alt-text (`![Earn upto 15 Plus Points
 * ...](https://www`) and assigned the identical string to four unrelated
 * cards. Same class as the 2026-05-29 §10 parseFxFee() failure.
 *
 * The check is intentionally conservative — false positives (i.e. real
 * welcome bonuses being rejected) just route the value to
 * _scraped_freetext.welcomeBonusFreetext for the editor to audit and
 * type up by hand. False negatives (garbage strings reaching L2) are the
 * actual harm we're guarding against.
 *
 * Returns true if `value` looks like a plausible welcome bonus.
 */
export function isPlausibleWelcomeBonus(value: unknown): boolean {
  // Structured welcomeBonus object (the normaliser's preferred output) —
  // trust the typed shape, the schema validates downstream.
  if (value && typeof value === "object") return true;
  // Null/undefined — caller decides whether to write.
  if (value == null) return true;
  // Everything else must be a string to be considered.
  if (typeof value !== "string") return false;
  const s = value.trim();
  // Empty or near-empty captures.
  if (s.length < 16) return false;
  // Markdown image fragment — the ENBD contamination pattern.
  if (/!\[.*?\]\(/.test(s)) return false;
  // Truncated URL — the scraper cut mid-href.
  if (/https?:\/\/[^\s]*$/.test(s) && !/\.(com|ae|net|org)(\b|\/)/.test(s)) return false;
  // Raw HTML fragments — the LuLu Titanium Gold pattern ("Up to 1 LuLu
  // Points<br>- 0").
  if (/<br\s*\/?>|<div|<span|<p\s|<a\s/i.test(s)) return false;
  // No currency or count signal in the body — almost certainly not a
  // welcome bonus. (A real welcome bonus mentions AED, miles, points,
  // cashback, voucher, gift, or a numeric amount.)
  if (!/AED|\baed\b|miles?\b|points?\b|cashback|voucher|gift|bonus|\b\d/i.test(s)) {
    return false;
  }
  return true;
}

export function mergeDraft(
  slug: string,
  existing: CardEntry | undefined,
  draft: Record<string, unknown>,
): { entry: CardEntry; outcome: MergeOutcome } {
  const today = new Date().toISOString().slice(0, 10);
  const newCard = !existing;
  const entry: CardEntry = existing ? { ...existing } : { _provenance: {}, _lastScraped: null, _lastReviewed: null };
  const provenance: ProvenanceMap = { ...(entry._provenance ?? {}) };
  const changedFields: string[] = [];
  const preservedFields: string[] = [];

  for (const field of SCRAPED_FIELDS) {
    if (!(field in draft)) continue;
    const currentProv = provenance[field];
    if (currentProv === "editor-confirmed" || currentProv === "editor-corrected") {
      preservedFields.push(field);
      continue;
    }
    // Defensive guard against the welcomeBonus contamination class
    // surfaced on the 6 June 2026 PR #207 audit: the scraper had pulled
    // generic page-chrome banner alt-text ("welcome offer** ![Earn upto
    // 15 Plus Points...](https://www") and assigned the identical string
    // to four different ENBD cards. Same problem class as the 2026-05-29
    // §10 ADCB FX-fee parser confusion. The plausibility check below
    // rejects strings that look like markdown image fragments, truncated
    // URLs, raw HTML fragments, or near-empty captures — those route to
    // _scraped_freetext.welcomeBonusFreetext only, leaving the top-level
    // L2 welcomeBonus untouched until an editor verifies and types a
    // structured value by hand.
    if (
      (field === "welcomeBonus" || field === "welcomeBonusValue") &&
      !isPlausibleWelcomeBonus(draft[field])
    ) {
      // Skip top-level write; the free-text branch below still captures
      // the raw output for the editor to audit.
      continue;
    }
    const before = JSON.stringify(entry[field]);
    const after = JSON.stringify(draft[field]);
    if (before !== after) {
      entry[field] = draft[field];
      provenance[field] = "scraped";
      changedFields.push(field);
    }
  }

  // ── Free-text fields: stash under _scraped_freetext, never overwrite
  //    typed editor versions at the top level. Source key may differ from
  //    target stash key (see FREETEXT_FIELDS comment).
  const existingFreetext = (entry._scraped_freetext as Record<string, unknown> | undefined) ?? {};
  const newFreetext: Record<string, unknown> = { ...existingFreetext };
  for (const [target, source] of Object.entries(FREETEXT_FIELDS)) {
    if (!(source in draft)) continue;
    const before = JSON.stringify(existingFreetext[target]);
    const after = JSON.stringify(draft[source]);
    if (before !== after) {
      newFreetext[target] = draft[source];
      changedFields.push(`_scraped_freetext.${target}`);
    }
  }
  if (Object.keys(newFreetext).length > 0) {
    entry._scraped_freetext = newFreetext;
    // _scraped_freetext provenance is always "scraped" — it's the raw output
  }

  // ── Editor-typed-only fields (C1): never write the top-level value from
  //    a scrape, but DO seed `_provenance.<field> = "needs-review"` on a
  //    fresh scrape if the editor hasn't yet confirmed a value. This makes
  //    the audit able to count unbackfilled cards by querying provenance.
  for (const field of EDITOR_TYPED_ONLY_FIELDS) {
    const currentProv = provenance[field];
    if (
      currentProv === "editor-confirmed" ||
      currentProv === "editor-corrected"
    ) {
      // Editor has typed this field — leave it and its provenance alone.
      preservedFields.push(field);
      continue;
    }
    if (currentProv !== "needs-review") {
      provenance[field] = "needs-review";
      changedFields.push(`_provenance.${field}`);
    }
  }

  entry._provenance = provenance;
  entry._lastScraped = today;
  if (newCard) entry._lastReviewed = null;

  return { entry, outcome: { changedFields, preservedFields, newCard } };
}

async function main() {
  const banks = fs.existsSync(SCRAPED_DIR)
    ? fs.readdirSync(SCRAPED_DIR).filter((d) =>
        fs.statSync(path.join(SCRAPED_DIR, d)).isDirectory(),
      )
    : [];

  const cardsData = loadCardsData();

  const prSections: string[] = [
    "# Weekly card refresh",
    "",
    `_Generated by \`scripts/scrape/propose-changes.ts\` on ${new Date().toISOString()}._`,
    "",
    "Every change below was auto-extracted from a bank's published page and merged",
    "into `src/data/cards.json`. Editor-confirmed fields were preserved, not overwritten.",
    "Review every figure before merging; the scraper is best-effort, not authoritative.",
    "",
  ];

  let totalNew = 0;
  let totalChanged = 0;
  let totalErrors = 0;

  for (const bankSlug of banks) {
    const scrape = latestScrape(bankSlug);
    if (!scrape) continue;

    prSections.push(`## ${bankSlug.toUpperCase()}`);
    prSections.push(`_Scraped at ${scrape.scrapedAt}._`);
    prSections.push("");

    for (const card of scrape.cards) {
      prSections.push(`### \`${card.slug}\` — ${card.name}`);

      const sourceList = card.fetched
        .map((s) => `- ${s.status === "ok" ? "✓" : "✗"} ${s.url}${s.failReason ? ` (${s.failReason})` : ""}`)
        .join("\n");
      prSections.push("**Sources:**");
      prSections.push(sourceList);
      prSections.push("");

      if (card.errors.length > 0) {
        prSections.push("**Parser warnings:**");
        for (const e of card.errors) prSections.push(`- ⚠️ ${e}`);
        prSections.push("");
        totalErrors += card.errors.length;
      }

      if (!card.draft) {
        prSections.push("⚠️ Draft not generated — fetches failed and no usable data was extracted.");
        prSections.push("");
        continue;
      }

      const { entry, outcome } = mergeDraft(
        card.slug,
        cardsData[card.slug],
        card.draft,
      );
      cardsData[card.slug] = entry;

      if (outcome.newCard) totalNew++;
      if (outcome.changedFields.length > 0 || outcome.newCard) totalChanged++;

      if (outcome.newCard) {
        prSections.push("**NEW CARD** — created entry in `src/data/cards.json`. All fields marked `_provenance: scraped`.");
      } else if (outcome.changedFields.length === 0) {
        prSections.push("_No changes._");
      } else {
        prSections.push(`**Updated fields:** ${outcome.changedFields.map((f) => `\`${f}\``).join(", ")}`);
        if (outcome.preservedFields.length > 0) {
          prSections.push(`**Preserved (editor-confirmed):** ${outcome.preservedFields.map((f) => `\`${f}\``).join(", ")}`);
        }
      }
      prSections.push("");
    }
  }

  writeCardsData(cardsData);

  prSections.push("---");
  prSections.push("");
  prSections.push(`**Summary:** ${totalNew} new card(s), ${totalChanged} entr(y/ies) changed, ${totalErrors} parser warning(s).`);
  prSections.push("");
  prSections.push("This PR is auto-opened by `.github/workflows/scrape.yml`. Never auto-merge — review every figure against the cited source URLs.");

  fs.writeFileSync(PR_BODY_PATH, prSections.join("\n"));
  console.log(`[propose] Wrote ${PR_BODY_PATH}: ${totalNew} new, ${totalChanged} changed, ${totalErrors} warning(s)`);
}

// Only auto-run main() when invoked as a script (e.g. `npm run scrape:propose`).
// Importing this module from a test must not trigger an fs walk + cards.json
// rewrite.
const isDirectInvocation =
  typeof process.argv[1] === "string" &&
  /propose-changes(\.ts)?$/.test(process.argv[1]);

if (isDirectInvocation) {
  main().catch((err) => {
    console.error("[propose] Fatal:", err);
    process.exit(1);
  });
}
