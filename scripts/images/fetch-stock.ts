// Pexels-backed stock-image fetcher (Phase E, May 2026 image-forward redesign).
//
// Usage:
//   npm run fetch:stock -- --slug homepage-hero-cabin --query "business class cabin window sunset" \
//                          --orientation landscape --alt "Window seat in a premium cabin at sunset"
//
// Or, set PEXELS_API_KEY=skip to dry-run (no network, no file write).
//
// What it does:
//   1. Calls https://api.pexels.com/v1/search with the query.
//   2. Picks the top result (or --pick=N for the N-th).
//   3. Downloads the "large2x" size to public/images/stock/<slug>.jpg.
//   4. Appends a manifest entry to data/stock/manifest.json.
//
// Idempotency: if a slug already exists in the manifest the script
// refuses to overwrite — pass --replace to force.
//
// Per Charter §6 (LLM-extraction policy): this script is deterministic.
// It uses the Pexels REST API directly; no LLM extraction in the loop.

import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

interface CliArgs {
  slug: string;
  query: string;
  alt: string;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
  pick?: number;
  usage?: string;
  replace?: boolean;
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

interface ManifestEntry {
  slug: string;
  source: "pexels" | "unsplash" | "editorial";
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
}

interface Manifest {
  version: 1;
  entries: ManifestEntry[];
}

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "data/stock/manifest.json");
const STOCK_DIR = path.join(REPO_ROOT, "public/images/stock");

const PEXELS_LICENCE = "Pexels Licence — free for commercial use, no attribution required";
const PEXELS_LICENCE_URL = "https://www.pexels.com/license/";

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (key === "replace") {
        args.replace = true;
        continue;
      }
      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      i++;
      if (key === "pick") args.pick = Number(next);
      else if (key === "slug") args.slug = next;
      else if (key === "query") args.query = next;
      else if (key === "alt") args.alt = next;
      else if (key === "orientation") args.orientation = next as CliArgs["orientation"];
      else if (key === "size") args.size = next as CliArgs["size"];
      else if (key === "usage") args.usage = next;
    }
  }
  if (!args.slug) throw new Error("Required: --slug <kebab-case-id>");
  if (!args.query) throw new Error("Required: --query \"<search string>\"");
  if (!args.alt) throw new Error("Required: --alt \"<descriptive alt text>\"");
  if (!/^[a-z0-9-]+$/.test(args.slug)) throw new Error("--slug must be kebab-case [a-z0-9-]+");
  return args as CliArgs;
}

function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { version: 1, entries: [] };
  }
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Manifest;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported manifest version: ${parsed.version}`);
  }
  return parsed;
}

function saveManifest(manifest: Manifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

async function pexelsSearch(query: string, orientation: string, key: string): Promise<PexelsSearchResponse> {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", "5");
  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
  });
  if (!res.ok) {
    throw new Error(`Pexels search failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as PexelsSearchResponse;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.PEXELS_API_KEY;

  if (!key) {
    console.error("ERROR: PEXELS_API_KEY env var not set.");
    console.error("Get a free key at https://www.pexels.com/api/ and add it to .env");
    console.error("(or use PEXELS_API_KEY=skip for a dry-run schema check)");
    process.exit(1);
  }

  const manifest = loadManifest();
  const existing = manifest.entries.find((e) => e.slug === args.slug);
  if (existing && !args.replace) {
    console.error(`ERROR: slug "${args.slug}" already in manifest at ${existing.file}`);
    console.error("Pass --replace to overwrite.");
    process.exit(1);
  }

  if (key === "skip") {
    console.log(`[dry-run] would fetch query="${args.query}" → slug="${args.slug}"`);
    console.log(`[dry-run] would write public/images/stock/${args.slug}.jpg`);
    console.log(`[dry-run] would append manifest entry`);
    return;
  }

  console.log(`Searching Pexels: query="${args.query}", orientation=${args.orientation ?? "landscape"}`);
  const result = await pexelsSearch(
    args.query,
    args.orientation ?? "landscape",
    key,
  );
  if (result.photos.length === 0) {
    console.error(`No results for "${args.query}"`);
    process.exit(1);
  }

  const idx = args.pick ?? 0;
  const photo = result.photos[idx];
  if (!photo) {
    console.error(`--pick=${idx} out of range (got ${result.photos.length} results)`);
    process.exit(1);
  }

  const downloadUrl = photo.src.large2x;
  const filename = `${args.slug}.jpg`;
  const file = `images/stock/${filename}`;
  const dest = path.join(STOCK_DIR, filename);

  console.log(`Downloading ${downloadUrl} → public/${file}`);
  await downloadFile(downloadUrl, dest);

  const entry: ManifestEntry = {
    slug: args.slug,
    source: "pexels",
    source_url: photo.url,
    source_id: String(photo.id),
    query: args.query,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    licence: PEXELS_LICENCE,
    licence_url: PEXELS_LICENCE_URL,
    file,
    width: photo.width,
    height: photo.height,
    alt: args.alt,
    fetched_at: new Date().toISOString().slice(0, 10),
    usage_hint: args.usage,
  };

  if (existing) {
    manifest.entries = manifest.entries.map((e) => (e.slug === args.slug ? entry : e));
  } else {
    manifest.entries.push(entry);
  }
  manifest.entries.sort((a, b) => a.slug.localeCompare(b.slug));
  saveManifest(manifest);

  console.log(`✓ ${args.slug} (${photo.width}×${photo.height}) by ${photo.photographer}`);
  console.log(`  Manifest: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
