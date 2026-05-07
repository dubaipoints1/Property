// Propose-changes script.
//
// Reads the most recent scrape output for each bank under data/scraped/<bank>/
// and emits:
//
//   1. Draft MDX files for new/changed cards in src/content/cards/<slug>.mdx
//      (only writes if the draft differs from the existing file)
//   2. A side-by-side diff table to PR_BODY.md (read by the GH Actions
//      workflow when opening the weekly scrape PR)
//
// Run:
//   npm run scrape:propose
//
// Never auto-merges. Every emitted MDX change is reviewed via the PR body.

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

const SCRAPED_DIR = path.join("data", "scraped");
const CARDS_DIR = path.join("src", "content", "cards");
const PR_BODY_PATH = "PR_BODY.md";

function latestScrape(bankSlug: string): ScrapeFile | null {
  const dir = path.join(SCRAPED_DIR, bankSlug);
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length === 0) return null;
  const file = path.join(dir, files[files.length - 1]);
  return JSON.parse(fs.readFileSync(file, "utf8")) as ScrapeFile;
}

function readExistingCard(slug: string): string | null {
  const file = path.join(CARDS_DIR, `${slug}.mdx`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function draftToYaml(draft: Record<string, unknown>): string {
  // Hand-rolled YAML — keeps frontmatter readable and avoids a yaml dep.
  // Only emits the fields the cards Zod schema uses.
  const d = draft as {
    bank: string;
    name: string;
    network: string;
    categories: string[];
    annualFee: { amount: number; currency: string };
    fxFee: number;
    loyaltyProgram?: string;
    earnRates: Record<string, number | undefined>;
    earnUnit?: string;
    welcomeBonus?: string;
    welcomeBonusValue?: number;
    eligibility: {
      minSalary: number;
      salaryTransferRequired: boolean;
      residencyRequired: boolean;
      employmentTypes: string[];
    };
    perks: string[];
    applyUrl?: string;
    kfsUrl?: string;
    lastVerified: string;
    sources: string[];
  };

  const lines: string[] = ["---"];
  lines.push(`bank: ${d.bank}`);
  lines.push(`name: ${JSON.stringify(d.name)}`);
  lines.push(`network: ${d.network}`);
  lines.push(`categories: [${d.categories.join(", ")}]`);
  lines.push("");
  lines.push("annualFee:");
  lines.push(`  amount: ${d.annualFee.amount}`);
  lines.push(`  currency: ${d.annualFee.currency}`);
  lines.push(`fxFee: ${d.fxFee}`);
  if (d.loyaltyProgram) lines.push(`loyaltyProgram: ${JSON.stringify(d.loyaltyProgram)}`);
  lines.push("earnRates:");
  for (const [k, v] of Object.entries(d.earnRates)) {
    if (typeof v === "number") lines.push(`  ${k}: ${v}`);
  }
  if (d.earnUnit) lines.push(`earnUnit: ${JSON.stringify(d.earnUnit)}`);
  if (d.welcomeBonus) lines.push(`welcomeBonus: ${JSON.stringify(d.welcomeBonus)}`);
  if (typeof d.welcomeBonusValue === "number")
    lines.push(`welcomeBonusValue: ${d.welcomeBonusValue}`);
  lines.push("eligibility:");
  lines.push(`  minSalary: ${d.eligibility.minSalary}`);
  lines.push(`  salaryTransferRequired: ${d.eligibility.salaryTransferRequired}`);
  lines.push(`  residencyRequired: ${d.eligibility.residencyRequired}`);
  lines.push(`  employmentTypes: [${d.eligibility.employmentTypes.join(", ")}]`);
  if (d.perks.length > 0) {
    lines.push("perks:");
    for (const p of d.perks) lines.push(`  - ${JSON.stringify(p)}`);
  } else {
    lines.push("perks: []");
  }
  if (d.applyUrl) lines.push(`applyUrl: ${JSON.stringify(d.applyUrl)}`);
  if (d.kfsUrl) lines.push(`kfsUrl: ${JSON.stringify(d.kfsUrl)}`);
  lines.push(`lastVerified: ${d.lastVerified}`);
  lines.push("sources:");
  for (const s of d.sources) lines.push(`  - ${s}`);
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

function compareSummary(existing: string | null, draft: string): string {
  if (!existing) return "**NEW CARD** — no prior MDX exists.";
  if (existing.trim() === draft.trim()) return "_No changes._";
  return [
    "Diff:",
    "```diff",
    diffPreview(existing, draft),
    "```",
  ].join("\n");
}

function diffPreview(a: string, b: string): string {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const out: string[] = [];
  const max = Math.max(aLines.length, bLines.length);
  let lastWasUnchanged = false;
  for (let i = 0; i < max; i++) {
    const aL = aLines[i] ?? "";
    const bL = bLines[i] ?? "";
    if (aL === bL) {
      if (!lastWasUnchanged && i < max - 1) out.push(`  ${aL}`);
      lastWasUnchanged = true;
      continue;
    }
    lastWasUnchanged = false;
    if (aL) out.push(`- ${aL}`);
    if (bL) out.push(`+ ${bL}`);
  }
  return out.slice(0, 80).join("\n");
}

async function main() {
  const banks = fs.existsSync(SCRAPED_DIR)
    ? fs.readdirSync(SCRAPED_DIR).filter((d) => fs.statSync(path.join(SCRAPED_DIR, d)).isDirectory())
    : [];

  const prSections: string[] = [
    "# Weekly card refresh",
    "",
    `_Generated by \`scripts/scrape/propose-changes.ts\` on ${new Date().toISOString()}._`,
    "",
    "Every change below was auto-extracted from a bank's published page.",
    "Review every figure before merging; the scraper is best-effort, not authoritative.",
    "",
  ];

  let totalChanges = 0;
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

      const draftYaml = draftToYaml(card.draft);
      const existing = readExistingCard(card.slug);
      prSections.push(compareSummary(existing, draftYaml));
      prSections.push("");

      // Write the draft to disk so reviewers can see it as a real file change.
      const out = path.join(CARDS_DIR, `${card.slug}.mdx`);
      if (!existing || existing.trim() !== draftYaml.trim()) {
        fs.writeFileSync(out, draftYaml);
        totalChanges++;
      }
    }
  }

  prSections.push("---");
  prSections.push("");
  prSections.push(`**Summary:** ${totalChanges} card file(s) changed, ${totalErrors} parser warning(s).`);
  prSections.push("");
  prSections.push("This PR is auto-opened by `.github/workflows/scrape.yml`. Never auto-merge — review every figure against the cited source URLs.");

  fs.writeFileSync(PR_BODY_PATH, prSections.join("\n"));
  console.log(`[propose] Wrote ${PR_BODY_PATH}: ${totalChanges} change(s), ${totalErrors} warning(s)`);
}

main().catch((err) => {
  console.error("[propose] Fatal:", err);
  process.exit(1);
});
