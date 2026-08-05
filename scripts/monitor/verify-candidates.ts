// Candidate verification — fetches proposed registry URLs and reports
// deterministic evidence. Proposes nothing, writes nothing.
//
// Why this exists. Discovery ranks URLs by their *spelling*, which is not
// the same as them being right. salaryTransferOfferHistory records that
// both of these returned 404 on re-verification (30 June 2026):
//
//   adcb.com/en/personal/promotions/salary-transfer
//   rakbank.ae/personal/accounts/salary-transfer
//
// Both read like perfectly ordinary salary-transfer URLs. Confirming
// candidates by eye would have admitted them. So a URL earns its place in
// salary-transfer.registry.json only once something has actually fetched
// it and seen salary-transfer content on the other end.
//
// Charter §6: every signal below is a deterministic regex over the fetched
// markdown, reusing the parsers the scrapers already use. Nothing here is
// LLM extraction, and nothing here becomes a fact in cards.json or the
// content collections — it is evidence for a human deciding what to trust.
//
// Usage:
//   FIRECRAWL_API_KEY=... tsx scripts/monitor/verify-candidates.ts
//   FIRECRAWL_API_KEY=skip tsx scripts/monitor/verify-candidates.ts   # dry run
//
// Reads the _pending block of the registry; add --all to re-check the
// already-admitted `banks` URLs too (useful for catching a page that has
// since died, which is how the two 404s above went unnoticed for months).

import { readFileSync, existsSync } from "node:fs";

import { firecrawlFetch, parseAED, parseMinSalary } from "../scrape/_lib.ts";

const REGISTRY = "scripts/monitor/salary-transfer.registry.json";
const CHECK_ADMITTED = process.argv.includes("--all");

export interface Signals {
  aedAmount: number | null;
  minSalary: number | null;
  /** Salary-band / tier language — the shape of a banded offer. */
  hasBands: boolean;
  /** Clawback or lock-in wording, which every real offer carries. */
  hasClawback: boolean;
  /** The words "salary transfer" (or close variants) appear at all. */
  mentionsSalaryTransfer: boolean;
}

/**
 * Deterministic content signals over fetched markdown.
 *
 * Exported and pure so tests can exercise it on fixture text without a
 * network call — see tests/monitor/verify.test.ts.
 */
export function signalsFor(markdown: string): Signals {
  return {
    aedAmount: parseAED(markdown),
    minSalary: parseMinSalary(markdown),
    hasBands:
      /salary\s+band|\bband\b[\s\S]{0,40}AED|AED[\s\S]{0,60}(?:and above|or more|up to)/i.test(
        markdown,
      ),
    hasClawback: /claw\s?back|forfeit|pro-?rata|lock-?in|recover(?:ed|y)?\s+(?:the\s+)?bonus/i.test(
      markdown,
    ),
    // Deliberately broad on product naming. The first version of this
    // matched only "salary transfer" / "transfer your salary" / "salary
    // account", and verify run 30988856840 reported ADIB's
    // salary-bonus-program-tcs-en.pdf as NO SALARY-TRANSFER CONTENT while
    // it carried an AED figure — a false negative of the detector, not a
    // bad URL. UAE banks brand this product several ways: salary bonus
    // (ADIB), salary credit, WPS salary. Missing one reads as "the bank
    // has no offer", which is the wrong answer to give.
    mentionsSalaryTransfer:
      /salary\s+transfer|transfer\s+your\s+salary|salary\s+account|salary\s+bonus|salary\s+credit|credit\s+your\s+salary|wps\s+salary/i.test(
        markdown,
      ),
  };
}

/**
 * Whether the evidence supports admitting this URL to the registry.
 *
 * Deliberately strict: a page must at minimum be reachable AND talk about
 * salary transfer. Everything else is reported for a human to weigh, not
 * folded into a pass/fail the script decides alone.
 */
export function verdictFor(status: "ok" | "fail", s: Signals): string {
  if (status === "fail") return "UNREACHABLE";
  if (!s.mentionsSalaryTransfer) return "NO SALARY-TRANSFER CONTENT";
  const strong = [s.aedAmount !== null, s.minSalary !== null, s.hasBands, s.hasClawback].filter(
    Boolean,
  ).length;
  if (strong >= 2) return "SUPPORTED";
  return "WEAK — mentions salary transfer but carries little offer detail";
}

function pendingUrls(): Array<{ bank: string; url: string; admitted: boolean }> {
  if (!existsSync(REGISTRY)) return [];
  const reg = JSON.parse(readFileSync(REGISTRY, "utf8"));
  const out: Array<{ bank: string; url: string; admitted: boolean }> = [];

  if (CHECK_ADMITTED) {
    for (const b of reg.banks ?? []) {
      for (const url of b.urls ?? []) out.push({ bank: b.bank, url, admitted: true });
    }
  }
  for (const [bank, entry] of Object.entries(reg._pending ?? {})) {
    if (bank.startsWith("_")) continue; // _doc, _no_candidate
    // Two accepted shapes: a bare array, or {urls, verdict} once a run has
    // recorded why the candidate did not qualify. Reading only the array
    // form silently found zero URLs after verdicts were added.
    const urls = Array.isArray(entry)
      ? entry
      : Array.isArray((entry as { urls?: unknown })?.urls)
        ? (entry as { urls: unknown[] }).urls
        : [];
    for (const url of urls) out.push({ bank, url: String(url), admitted: false });
  }
  return out;
}

async function main() {
  const targets = pendingUrls();

  if (!process.env.FIRECRAWL_API_KEY) {
    console.error("ERROR: FIRECRAWL_API_KEY unset (use 'skip' for a dry run).");
    process.exit(1);
  }

  if (process.env.FIRECRAWL_API_KEY === "skip") {
    console.log(`[dry-run] would fetch ${targets.length} candidate URLs:\n`);
    for (const t of targets) {
      console.log(`  ${t.bank.padEnd(20)} ${t.admitted ? "[admitted] " : ""}${t.url}`);
    }
    console.log(`\n[dry-run] ~${targets.length} credits (1 scrape per URL).`);
    process.exit(0);
  }

  console.log(
    `Candidate verification — ${targets.length} URLs. Evidence only; nothing is written.\n`,
  );

  for (const { bank, url, admitted } of targets) {
    const fetched = await firecrawlFetch(url);
    const s = signalsFor(fetched.markdown);
    const verdict = verdictFor(fetched.status, s);

    console.log(`## ${bank}${admitted ? "  [already admitted]" : ""}`);
    console.log(`   ${url}`);
    console.log(`   verdict: ${verdict}`);
    if (fetched.status === "fail") {
      console.log(`   reason: ${fetched.failReason ?? "unknown"}`);
    } else {
      console.log(
        `   signals: AED=${s.aedAmount ?? "-"}  minSalary=${s.minSalary ?? "-"}` +
          `  bands=${s.hasBands}  clawback=${s.hasClawback}`,
      );
    }
    console.log("");
  }

  console.log(
    "SUPPORTED URLs may be promoted into the registry's `banks` block by hand.\n" +
      "UNREACHABLE / NO SALARY-TRANSFER CONTENT stay out — record the bank as\n" +
      "unresolved rather than substituting a near-miss.",
  );
}

// Only run as a CLI. Importing this module — as tests/monitor/verify.test.ts
// does for signalsFor/verdictFor — must not fetch anything or exit the
// process. poll.mjs had exactly this problem and its routing rules were
// unreachable from a test as a result.
if (process.argv[1] && process.argv[1].endsWith("verify-candidates.ts")) {
  await main();
}
