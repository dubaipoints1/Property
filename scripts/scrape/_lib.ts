// Shared library for scrape scripts.
//
// - Firecrawl client wrapper (reads FIRECRAWL_API_KEY from env)
// - Pure parser helpers (price, percent, salary, date)
// - Type definitions matching the cards Zod schema

import fs from "node:fs";
import path from "node:path";

// ── Types ────────────────────────────────────────────────────────────────

export type CardCategory =
  | "travel"
  | "cashback"
  | "shopping"
  | "dining"
  | "lifestyle"
  | "co-brand"
  | "Islamic";

export interface CardUrlSet {
  slug: string;
  name: string;
  network: "Visa" | "Mastercard" | "Amex";
  categories: CardCategory[];
  loyaltyProgram?: string;
  salaryTransferRequired: boolean;
  urls: {
    product: string;
    kfs: string | null;
    welcome: string | null;
  };
}

export interface FetchedSource {
  url: string;
  markdown: string;
  html?: string;
  status: "ok" | "fail";
  failReason?: string;
}

export interface CardScrapeResult {
  slug: string;
  name: string;
  fetched: FetchedSource[];
  draft: Record<string, unknown> | null;
  errors: string[];
}

// ── Firecrawl client ─────────────────────────────────────────────────────

export async function firecrawlFetch(url: string): Promise<FetchedSource> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key || key === "skip") {
    return {
      url,
      markdown: "",
      status: "fail",
      failReason: "FIRECRAWL_API_KEY not set (or 'skip') — running dry",
    };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
    });
    if (!res.ok) {
      return {
        url,
        markdown: "",
        status: "fail",
        failReason: `Firecrawl HTTP ${res.status}: ${res.statusText}`,
      };
    }
    const data = (await res.json()) as {
      success?: boolean;
      data?: { markdown?: string; html?: string };
      error?: string;
    };
    if (!data.success || !data.data?.markdown) {
      return {
        url,
        markdown: "",
        status: "fail",
        failReason: data.error ?? "Firecrawl returned no markdown",
      };
    }
    // Optional fixture capture for parser debugging. Set
    //   SCRAPE_FIXTURE_DIR=/tmp/firecrawl-fixtures
    // before running the scrape and each fetched markdown lands at
    //   <dir>/<url-slug>.md
    // so the editor can inspect what the parsers actually saw. No-op
    // when the env var is unset.
    const fixtureDir = process.env.SCRAPE_FIXTURE_DIR;
    if (fixtureDir && data.data.markdown) {
      try {
        fs.mkdirSync(fixtureDir, { recursive: true });
        const slug = url
          .replace(/^https?:\/\//, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 120);
        fs.writeFileSync(path.join(fixtureDir, `${slug}.md`), data.data.markdown);
      } catch {
        /* fixture capture is best-effort; never fail the scrape */
      }
    }

    return {
      url,
      markdown: data.data.markdown,
      html: data.data.html,
      status: "ok",
    };
  } catch (err) {
    return {
      url,
      markdown: "",
      status: "fail",
      failReason: err instanceof Error ? err.message : String(err),
    };
  }
}

export function loadFixture(fixturePath: string): FetchedSource {
  const abs = path.resolve(fixturePath);
  if (!fs.existsSync(abs)) {
    return {
      url: `file://${abs}`,
      markdown: "",
      status: "fail",
      failReason: `Fixture not found: ${abs}`,
    };
  }
  const raw = fs.readFileSync(abs, "utf8");
  return {
    url: `file://${abs}`,
    markdown: htmlToMarkdownFallback(raw),
    html: raw,
    status: "ok",
  };
}

function htmlToMarkdownFallback(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Parsers (pure, unit-testable) ────────────────────────────────────────

/** Parse "AED 1,575" or "AED1,575/year" or "AED 1575" → 1575. */
export function parseAED(input: string): number | null {
  const m = input.match(/AED\s*([\d,]+(?:\.\d+)?)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Parse "1.99%" or "1.99 %" → 1.99. */
export function parsePercent(input: string): number | null {
  const m = input.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a UAE minimum monthly salary in AED.
 *
 * Tolerated phrasings (in priority order):
 *   1. "Minimum salary AED 12,000 per month"     (existing)
 *   2. "Min salary: AED 5,000"                   (existing)
 *   3. "Minimum Monthly Salary\n\n## 5,000"      (FAB heading layout)
 *   4. "Minimum Monthly Salary **5,000**"        (FAB bold layout)
 *   5. "Minimum Monthly Salary 5,000"            (bare number)
 *   6. "Salary AED 8,000"                        (no "minimum" prefix)
 *
 * Validates the parsed number is in the plausible AED-salary range
 * (1,000–500,000) so we don't pick up FX-fee percentages, fees, etc.
 */
export function parseMinSalary(input: string): number | null {
  // Pattern 1+2 — explicit AED prefix near "salary" word
  let m = input.match(/min(?:imum)?\s+(?:monthly\s+)?salary\s*[:of\s]*AED\s*([\d,]+)/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (isPlausibleSalary(n)) return n;
  }

  // Pattern 3+4+5 — "Minimum (Monthly )Salary" label, look ahead up to
  // 80 chars (handles markdown headings, bold, currency icons) for a
  // number that looks like a salary band.
  m = input.match(/min(?:imum)?\s+(?:monthly\s+)?salary[\s\S]{0,80}?(\d{1,3}(?:,\d{3})+|\d{4,6})/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (isPlausibleSalary(n)) return n;
  }

  // Pattern 6 — generic "Salary AED 8,000" without "minimum"
  m = input.match(/(?:^|\W)salary\s*[:of\s]*AED\s*([\d,]+)/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (isPlausibleSalary(n)) return n;
  }

  return null;
}

/** Plausible UAE monthly salary band: AED 1,000 – AED 500,000. */
function isPlausibleSalary(n: number): boolean {
  return Number.isFinite(n) && n >= 1000 && n <= 500000;
}

/**
 * Parse a category-specific earn rate. Tolerates phrasings like:
 *   "5% cashback on dining"
 *   "Earn 3x rewards on groceries"
 *   "2x on fuel"
 *   "dining: 5%"
 *
 * Splits the input into short chunks first so we don't cross-talk between
 * categories (e.g. matching "5% on dining" when looking for "groceries").
 */
export function parseEarnRate(
  input: string,
  category:
    | "dining"
    | "groceries"
    | "shopping"
    | "travel"
    | "fuel"
    | "entertainment"
    | "online"
    | "international",
): number | null {
  const chunks = input.split(
    /[.\n;]|<\/?li[^>]*>|<br\s*\/?>|\s+(?:and|plus)\s+/i,
  );
  const forward = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(?:x|×|times|%|per\\s+AED)?[\\s\\S]{0,60}?\\b${category}\\b`,
    "i",
  );
  const reverse = new RegExp(
    `\\b${category}\\b[\\s\\S]{0,30}?(\\d+(?:\\.\\d+)?)\\s*(?:x|×|%)`,
    "i",
  );
  for (const chunk of chunks) {
    const m = chunk.match(forward) ?? chunk.match(reverse);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Parse the salary-transfer-required flag from copy. */
export function parseSalaryTransferRequired(
  input: string,
  fallback: boolean,
): boolean {
  if (/no\s+salary\s+transfer/i.test(input)) return false;
  if (/salary\s+transfer\s+(required|mandatory|needed)/i.test(input))
    return true;
  return fallback;
}

// ── Disk helpers ────────────────────────────────────────────────────────

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function writeScrapeOutput(
  bankSlug: string,
  cards: CardScrapeResult[],
): string {
  const dir = path.join("data", "scraped", bankSlug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify({ bankSlug, scrapedAt: new Date().toISOString(), cards }, null, 2));
  return file;
}
