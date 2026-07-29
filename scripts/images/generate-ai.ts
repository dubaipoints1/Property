// fal.ai-backed illustration generator (2026-07-29 Charter amendment).
//
// Sibling of fetch-stock.ts. Where that script *finds* a photograph,
// this one *makes* an illustration — and the difference is the whole
// point of the amendment, so the two write to different directories
// (public/images/ai/ vs public/images/stock/) and the manifest keeps
// them apart with source: "ai-generated". <ImageCredit> renders the
// "not a photograph" label off that field.
//
// Usage:
//   npm run gen:ai -- --slug guide-fx-fees-concept \
//     --prompt "flat editorial illustration, abstract currency exchange, warm paper background, navy and gold" \
//     --alt "Abstract illustration of currency exchange" \
//     --model fal-ai/flux/dev
//
// Set FAL_KEY=skip for a dry run (no network, no file write, no spend).
//
// ── What this script will NOT generate ──────────────────────────────
// Per the amendment's permit/ban line, AI imagery may illustrate but
// never document. The guard below refuses prompts naming a real
// issuer, carrier, hotel brand or product surface — a card face, a
// named cabin, a named property, a bank branch, a real person. Those
// come from the issuer's press library or they do not run. The guard
// is a tripwire for the obvious cases, not a substitute for the
// editor's judgement: an image that could be mistaken for evidence is
// a §10 kill whether or not the regex caught it.
//
// Per Charter §6: this script is deterministic plumbing. The model
// generates a picture; it never supplies a number, a fee, or a fact.

import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

interface CliArgs {
  slug: string;
  prompt: string;
  alt: string;
  model?: string;
  size?: string;
  seed?: number;
  usage?: string;
  replace?: boolean;
}

interface ManifestEntry {
  slug: string;
  source: "pexels" | "unsplash" | "editorial" | "ai-generated";
  source_url?: string;
  source_id?: string;
  query?: string;
  photographer: string;
  photographer_url?: string;
  licence: string;
  licence_url?: string;
  file: string;
  width: number;
  height: number;
  alt: string;
  fetched_at: string;
  usage_hint?: string;
  generator?: string;
  prompt?: string;
}

interface Manifest {
  version: 1;
  entries: ManifestEntry[];
}

interface FalImage {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

interface FalResponse {
  images?: FalImage[];
  seed?: number;
  detail?: string;
}

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "data/stock/manifest.json");
const AI_DIR = path.join(REPO_ROOT, "public/images/ai");

const DEFAULT_MODEL = "fal-ai/flux/dev";
const DEFAULT_SIZE = "landscape_16_9";

// Delivery budget. The stock library averages ~250KB; a raw fal render
// arrives at 1.7MB and 1820px wide, which is a real page-weight
// regression on a site whose images are its heaviest asset. Renders are
// resized down to MAX_WIDTH and re-encoded before they land.
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;

// Negative prompting is standard practice — "no logos, no text" is how
// an editor asks for clean illustration, and it must not read as a
// request for a logo.
//
// Rather than stripping words (which is both too greedy and not greedy
// enough — it either eats a banned subject sitting after the negated
// clause, or stops short of a second item in an "x or y" list), each
// MATCH is tested for whether a negator governs it: scan back from the
// match within the same clause, stopping at any , . or ; boundary. A
// rule fires unless every one of its matches is negated. So
// "Emirates cabin, no logos" still fires on the carrier, and
// "no text, photorealistic bank statement" still fires on the
// document — the negator only covers what it actually governs.
const NEGATOR = /\b(?:no|not|without|avoid(?:ing)?|excluding|free of)\b[^,.;]*$/i;

function isNegated(subject: string, matchIndex: number): boolean {
  const clauseStart = Math.max(
    subject.lastIndexOf(",", matchIndex),
    subject.lastIndexOf(".", matchIndex),
    subject.lastIndexOf(";", matchIndex),
  );
  const preceding = subject.slice(clauseStart + 1, matchIndex);
  return NEGATOR.test(preceding);
}

/** True when the rule matches at least once un-negated. */
function firesOn(pattern: RegExp, subject: string): boolean {
  const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  let match: RegExpExecArray | null;
  while ((match = global.exec(subject)) !== null) {
    if (!isNegated(subject, match.index)) return true;
    if (match.index === global.lastIndex) global.lastIndex++; // zero-width guard
  }
  return false;
}

// Subjects an AI image may not depict — the documentation side of the
// amendment's line. Matched case-insensitively against the prompt.
// Note the `s?` suffixes: a guard that catches "logo" but waves
// "logos" through is not a guard.
const BANNED_SUBJECTS: Array<{ pattern: RegExp; why: string }> = [
  {
    pattern: /\b(credit|debit)\s+cards?\s+(faces?|art|designs?|mockups?|renders?)|\bcard\s+plastic\b/i,
    why: "card art / plastic of a real product — a card face is a factual claim; source it from the issuer",
  },
  {
    pattern: /\b(emirates|etihad|qatar airways|flydubai|air arabia|saudia|wizz|british airways|singapore airlines)\b/i,
    why: "a named carrier — cabins, seats, liveries and lounges come from the carrier's media library",
  },
  {
    pattern: /\b(marriott|bonvoy|hilton|honors|hyatt|accor|ihg|atlantis|jumeirah|address hotels|rotana)\b/i,
    why: "a named hotel brand or property — use the operator's press library",
  },
  {
    pattern: /\b(fab|first abu dhabi|emirates nbd|adcb|mashreq|hsbc|rakbank|dib|adib|emirates islamic|standard chartered|citibank|citi)\b/i,
    why: "a named bank — branches, branded environments and documents are not illustratable",
  },
  {
    pattern: /\b(bank statements?|fee schedules?|screenshots?|app screens?|receipts?|invoices?|passports?|emirates id|visa stamps?)\b/i,
    why: "a document or screenshot — readers read these as records",
  },
  {
    pattern: /\b(portraits?|headshots?|photorealistic (man|men|woman|women|person|people)|ceo|executives?)\b/i,
    why: "a real or realistic person presented as one",
  },
  {
    pattern: /\b(burj khalifa|burj al arab|palm jumeirah|dxb terminal|dubai international airport|sheikh zayed (grand )?mosque)\b/i,
    why: "an identifiable landmark that reads as a documentary record — use a licensed photograph",
  },
  {
    pattern: /\b(logos?|logotypes?|wordmarks?|brand marks?|emblems?|branding)\b/i,
    why: "a brand mark — AI-generated logos are banned outright (2026-05-29 amendment)",
  },
];

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key === "replace") {
      args.replace = true;
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    i++;
    if (key === "slug") args.slug = next;
    else if (key === "prompt") args.prompt = next;
    else if (key === "alt") args.alt = next;
    else if (key === "model") args.model = next;
    else if (key === "size") args.size = next;
    else if (key === "seed") args.seed = Number(next);
    else if (key === "usage") args.usage = next;
  }
  if (!args.slug) throw new Error("Required: --slug <kebab-case-id>");
  if (!args.prompt) throw new Error('Required: --prompt "<generating prompt>"');
  if (!args.alt) throw new Error('Required: --alt "<descriptive alt text>"');
  if (!/^[a-z0-9-]+$/.test(args.slug)) throw new Error("--slug must be kebab-case [a-z0-9-]+");
  return args as CliArgs;
}

/** Refuse prompts that would produce documentation rather than
 *  illustration. Returns the reasons, empty when the prompt is clean. */
export function bannedSubjects(prompt: string): string[] {
  return BANNED_SUBJECTS.filter((rule) => firesOn(rule.pattern, prompt)).map((rule) => rule.why);
}

function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) return { version: 1, entries: [] };
  const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as Manifest;
  if (parsed.version !== 1) throw new Error(`Unsupported manifest version: ${parsed.version}`);
  return parsed;
}

function saveManifest(manifest: Manifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

/** Human-facing model name for the rendered credit line. */
function generatorLabel(model: string): string {
  const short = model.replace(/^fal-ai\//, "").replace(/\//g, " ");
  return `${short} via fal.ai`;
}

async function falGenerate(args: CliArgs, model: string, key: string): Promise<FalResponse> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: args.prompt,
      image_size: args.size ?? DEFAULT_SIZE,
      num_images: 1,
      ...(args.seed !== undefined ? { seed: args.seed } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`fal.ai request failed: ${res.status} ${res.statusText} — ${body.slice(0, 300)}`);
  }
  return (await res.json()) as FalResponse;
}

/** Download, normalise for delivery, and report the TRUE dimensions of
 *  what actually landed on disk.
 *
 *  Dimensions are measured, never assumed. fal's response omits
 *  width/height on some models (recraft-v3 among them), and an earlier
 *  version of this script fell back to a per-preset lookup table — which
 *  recorded 1344x768 for a file that was really 1820x1024, so every
 *  <img> got a wrong intrinsic size. The file is the only honest source
 *  for its own dimensions. */
async function downloadImage(
  url: string,
  dest: string,
): Promise<{ width: number; height: number; bytes: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const raw = Buffer.from(await res.arrayBuffer());

  const { default: sharp } = await import("sharp");
  const source = sharp(raw);
  const meta = await source.metadata();

  const processed = await source
    .resize({ width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();

  const final = await sharp(processed).metadata();
  if (!final.width || !final.height) {
    throw new Error("Could not read dimensions from the generated image");
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, processed);
  return { width: final.width, height: final.height, bytes: processed.length };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.FAL_KEY;
  const model = args.model ?? DEFAULT_MODEL;

  if (!key) {
    console.error("ERROR: FAL_KEY env var not set.");
    console.error("Create a key at https://fal.ai/dashboard/keys and add it to .env");
    console.error("(or use FAL_KEY=skip for a dry-run policy + schema check)");
    process.exit(1);
  }

  const violations = bannedSubjects(args.prompt);
  if (violations.length > 0) {
    console.error("REFUSED — this prompt asks for documentation, not illustration:");
    for (const why of violations) console.error(`  · ${why}`);
    console.error("");
    console.error("Per the 2026-07-29 Charter amendment, AI imagery may illustrate a");
    console.error("concept but may never depict a real, verifiable thing. Source this");
    console.error("from the issuer's press library or licensed stock instead.");
    process.exit(1);
  }

  const manifest = loadManifest();
  const existing = manifest.entries.find((e) => e.slug === args.slug);
  if (existing && !args.replace) {
    console.log(`SKIP: slug "${args.slug}" already in manifest at ${existing.file} — pass --replace to regenerate.`);
    return;
  }

  if (key === "skip") {
    console.log(`[dry-run] prompt passes the subject guard`);
    console.log(`[dry-run] would generate with ${model} → slug="${args.slug}"`);
    console.log(`[dry-run] would write public/images/ai/${args.slug}.jpg`);
    console.log(`[dry-run] would append manifest entry (source: ai-generated)`);
    return;
  }

  console.log(`Generating with ${model}: "${args.prompt}"`);
  const result = await falGenerate(args, model, key);
  const image = result.images?.[0];
  if (!image?.url) {
    throw new Error(`fal.ai returned no image${result.detail ? ` — ${result.detail}` : ""}`);
  }

  const filename = `${args.slug}.jpg`;
  const file = `images/ai/${filename}`;
  const dest = path.join(AI_DIR, filename);

  console.log(`Downloading result → public/${file}`);
  const { width, height, bytes } = await downloadImage(image.url, dest);
  const label = generatorLabel(model);

  const entry: ManifestEntry = {
    slug: args.slug,
    source: "ai-generated",
    // The generating model stands where the photographer stands: it is
    // what the rendered credit names as the origin of the image.
    photographer: label,
    licence: "AI-generated illustration — created for DubaiPoints, labelled on every rendered page",
    file,
    width,
    height,
    alt: args.alt,
    fetched_at: new Date().toISOString().slice(0, 10),
    usage_hint: args.usage,
    generator: label,
    prompt: args.prompt,
  };

  if (existing) {
    manifest.entries = manifest.entries.map((e) => (e.slug === args.slug ? entry : e));
  } else {
    manifest.entries.push(entry);
  }
  manifest.entries.sort((a, b) => a.slug.localeCompare(b.slug));
  saveManifest(manifest);

  console.log(`✓ ${args.slug} (${entry.width}×${entry.height}, ${Math.round(bytes / 1024)}KB) — ${label}`);
  console.log(`  Renders as: "Illustration: generated with ${label} · not a photograph"`);
  console.log(`  Manifest: ${MANIFEST_PATH}`);
}

// Importable for tests without firing the CLI.
if (process.argv[1] && process.argv[1].endsWith("generate-ai.ts")) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
