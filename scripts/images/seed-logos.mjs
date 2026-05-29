// Seed real brand logos over the placeholder text-marks (2026-05-29).
//
// Why this script exists (mirrors scripts/images/fetch-stock.ts):
//   The Claude sandbox is blocked from reaching image / Wikimedia hosts at
//   the network allowlist layer. GitHub Actions runners are not, so this
//   downloader runs cleanly from .github/workflows/seed-logos.yml.
//
// What it does:
//   For each entry in LOGOS, downloads the source asset and overwrites the
//   placeholder at public/logos/<dir>/<slug>.svg, then refreshes the source
//   row in public/logos/LICENSES.md.
//
// Sourcing (Charter §10): each logo is sourced from either the issuer's own
// brand-assets page or Wikimedia Commons. Every Commons entry below is
// tagged {{PD-textlogo}} on its File: page — "consists only of simple
// geometric shapes or text... does not meet the threshold of originality
// needed for copyright protection" — i.e. not copyrightable; the marks
// remain the trademarks of their issuers and are used here nominatively to
// identify the products the publication reviews, per the §10 amendment.
//
// Commons download uses the stable Special:FilePath endpoint, which 302-
// redirects to the hashed upload URL (resolved at fetch time on the runner)
// so we never hard-code an MD5 path that could rot.
//
// The 4 airline/programme slugs use the PARENT brand mark (Emirates for
// Skywards, Etihad for Etihad Guest, Qatar Airways for Privilege Club,
// Marriott for Bonvoy) — standard editorial practice; the programme has no
// distinct freely-licensed mark.
//
// NOT seeded (no clean free source): emirates-nbd (official asset is PNG
// only — needs a format decision), dib, adib, cbd, emirates-islamic,
// rakbank. These keep their text-mark placeholders.

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "..",
);
const LOGOS_DIR = path.join(REPO_ROOT, "public/logos");
const LICENSES_PATH = path.join(LOGOS_DIR, "LICENSES.md");

const COMMONS = (file) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
const COMMONS_PAGE = (file) =>
  `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, "_")}`;
const PD = (issuer) =>
  `Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of ${issuer}, used nominatively`;

const LOGOS = [
  // ── Banks ──────────────────────────────────────────────────────────────
  {
    slug: "fab", dir: "banks", file: "First Abu Dhabi Bank Logo.svg",
    issuer: "First Abu Dhabi Bank",
  },
  {
    slug: "adcb", dir: "banks", file: "Abu Dhabi Commercial Bank logo.svg",
    issuer: "Abu Dhabi Commercial Bank",
  },
  {
    slug: "hsbc", dir: "banks", file: "HSBC logo (2018).svg",
    issuer: "HSBC Holdings",
  },
  {
    slug: "citi", dir: "banks", file: "Citi.svg",
    issuer: "Citigroup",
  },
  {
    slug: "standard-chartered", dir: "banks", file: "Standard Chartered (2021).svg",
    issuer: "Standard Chartered PLC",
  },
  // ── Airline / loyalty programmes (parent-brand marks) ───────────────────
  {
    slug: "qatar-privilege-club", dir: "airlines", file: "Qatar Airways logo.svg",
    issuer: "Qatar Airways", note: "parent-airline mark for the Privilege Club programme",
  },
  {
    slug: "etihad-guest", dir: "airlines", file: "Etihad-airways-logo.svg",
    issuer: "Etihad Airways", note: "parent-airline mark for the Etihad Guest programme",
  },
  {
    slug: "skywards", dir: "airlines", file: "Emirates logo.svg",
    issuer: "Emirates", note: "parent-airline mark for the Emirates Skywards programme",
  },
  {
    slug: "marriott-bonvoy", dir: "airlines", file: "Marriott Logo.svg",
    issuer: "Marriott International", note: "parent-brand mark for the Marriott Bonvoy programme",
  },
];

async function download(url) {
  // Wikimedia returns 403 to requests without a descriptive User-Agent
  // (their UA policy). Send a real one identifying the publication.
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "DubaiPoints-logo-seed/1.0 (https://dubaipoints.ae; editorial brand-logo fetch) node-fetch",
      Accept: "image/svg+xml,*/*",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const text = await res.text();
  if (!/<svg[\s>]/i.test(text)) {
    throw new Error(`Downloaded asset is not an SVG: ${url}`);
  }
  return text;
}

function updateLicenses(rows) {
  let md = fs.readFileSync(LICENSES_PATH, "utf-8");
  const today = new Date().toISOString().slice(0, 10);
  for (const r of rows) {
    const key = `${r.dir}/${r.slug}`;
    // Replace the existing source-log row (placeholder) for this slug.
    const rowRe = new RegExp(
      `^\\| ${key.replace(/[/-]/g, "\\$&")} \\|.*$`,
      "m",
    );
    const sourceCell = r.pageUrl;
    const newRow = `| ${key} | ${sourceCell} | ${today} | ${r.licence}${r.note ? " — " + r.note : ""} |`;
    if (rowRe.test(md)) {
      md = md.replace(rowRe, newRow);
    } else {
      md = md.trimEnd() + "\n" + newRow + "\n";
    }
  }
  fs.writeFileSync(LICENSES_PATH, md, "utf-8");
}

async function main() {
  const done = [];
  for (const logo of LOGOS) {
    const url = COMMONS(logo.file);
    process.stdout.write(`Fetching ${logo.slug} ← ${logo.file} ... `);
    const svg = await download(url);
    const dest = path.join(LOGOS_DIR, logo.dir, `${logo.slug}.svg`);
    fs.writeFileSync(dest, svg, "utf-8");
    console.log(`ok (${svg.length} bytes → public/logos/${logo.dir}/${logo.slug}.svg)`);
    done.push({
      slug: logo.slug,
      dir: logo.dir,
      pageUrl: COMMONS_PAGE(logo.file),
      licence: PD(logo.issuer),
      note: logo.note,
    });
  }
  updateLicenses(done);
  console.log(`\nSeeded ${done.length} logos + refreshed LICENSES.md source log.`);
}

main().catch((err) => {
  console.error("seed-logos failed:", err.message);
  process.exit(1);
});
