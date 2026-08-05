// Salary-transfer URL discovery — one-off helper, human-reviewed output.
//
// The salary-transfer tracker is a Charter-named differentiator that had
// no automation behind it until August 2026: nothing read or wrote
// salaryTransferOffers, and the monitors watched fee docs, product pages,
// card offers and press rooms but no salary-transfer surface. This script
// proposes the pages to watch so salary-transfer.registry.json can be
// populated and the monitor stops being SKIPPED.
//
// Usage:
//   FIRECRAWL_API_KEY=... node scripts/monitor/discover-salary-transfer.mjs
//   FIRECRAWL_API_KEY=skip node scripts/monitor/discover-salary-transfer.mjs
//
// Output: prints a reviewable block per bank. Copy confirmed URLs into
// scripts/monitor/salary-transfer.registry.json — BY HAND. A monitor
// pointed at a guessed page is worse than none, because we would then
// trust it.

import { runDiscovery } from "./_discover.mjs";

// Ordered by confidence. An explicit /salary-transfer path is the
// strongest signal; a generic /payroll or campaign page is weaker but
// still worth showing a human.
export const SALARY_TRANSFER_PATTERNS = [
  /\/salary[-_]?transfers?(\/|$)/i,
  /transfer[-_]?your[-_]?salary/i,
  /\/salary[-_]?accounts?(\/|$)/i,
  /\/salary(\/|$)/i,
  /\/payroll/i,
  /salary.*t-?&?cs?.*\.pdf$/i,
  /\/campaigns?\/.*salary/i,
];

// Deliberately NARROWER than the offers reject rule *on documents*.
//
// discover-offers.mjs rejects `.pdf`, `/terms` and `/tnc` because for a
// promotions landing page those are noise. For salary transfer they are
// the target: the salary bands, payout months and clawback terms live in
// the T&C document, not the marketing page. DIB's shipped sourceUrl is
// literally dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf.
//
// So this keeps PDFs and terms pages, and rejects only what is genuinely
// not a UAE consumer salary-transfer surface. Every rule below was added
// from real noise in discovery run 30982700538 — see the matching cases
// in tests/monitor/discover.test.ts, which use those exact URLs.
//
// Non-UAE markets. These banks publish the same product across many
// countries and the map surfaces all of them.
//
// Enumerating the foreign codes does not hold: run 30982700538 returned
// sc.com/ng/ (Nigeria), and once the retry pass was added run 30985646889
// returned sc.com/np/ (Nepal) — Standard Chartered publishes ~60 markets,
// so a deny-list will always be one country behind.
//
// Inverted instead: a two-letter segment immediately after the host is a
// market code, and anything that is not /ae/ is foreign. /en/ is exempted
// because it is a language segment, not a market — Mashreq uses
// /en/uae/… and /en/egypt/…, so the language comes first there and the
// market is a full word, caught by NAMED_MARKET below.
const LEADING_MARKET = /:\/\/[^/]+\/(?!ae\/|en\/)[a-z]{2}\//i;

// Markets written as full words rather than codes.
const NAMED_MARKET = /\/(egypt|nigeria|pakistan|india|kenya|nepal|bahrain|qatar|oman|kuwait|jordan|lebanon)\//i;

// Arabic mirrors of pages whose /en/ equivalent is already surfaced —
// a pure duplicate, so dropping it removes no information.
const NON_EN_LOCALE = /\/ar\//i;

// Salary ADVANCE and payroll LOANS are credit products, not
// salary-transfer bonuses. CBD's only candidate was salaryadvance_t-c.pdf.
const CREDIT_PRODUCT = /salary-?advance|payroll-?loans?/i;

// B2B payroll services — the bank selling WPS processing to employers,
// not an offer a reader can take. Emirates Islamic and RAKBANK both
// surfaced these.
const B2B = /\/business(-banking)?\/|payroll-solutions?/i;

const NOT_DURABLE = /\.(jpg|jpeg|png|gif|svg)$|\/archive|\/expired|\/\d{4}\//i;

export const SALARY_TRANSFER_REJECT = new RegExp(
  [LEADING_MARKET, NAMED_MARKET, NON_EN_LOCALE, CREDIT_PRODUCT, B2B, NOT_DURABLE]
    .map((r) => r.source)
    .join("|"),
  "i",
);

export const SALARY_TRANSFER_CONFIG = {
  surface: "salary-transfer",
  search: "salary transfer",
  // Second search term, used only for banks the first pass missed.
  retrySearch: "salary account",
  patterns: SALARY_TRANSFER_PATTERNS,
  reject: SALARY_TRANSFER_REJECT,
  // Higher than the offers limit of 5: we want the landing page AND its
  // T&C document, and banks often publish several salary-account
  // variants (conventional vs Islamic, NEO vs branch).
  limit: 8,
  registryPath: "scripts/monitor/salary-transfer.registry.json",
};

if (process.argv[1] && process.argv[1].endsWith("discover-salary-transfer.mjs")) {
  await runDiscovery(SALARY_TRANSFER_CONFIG);
}
