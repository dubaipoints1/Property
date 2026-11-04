// Generate delivery copies only for URLs emitted in the static build.
// Originals and their licence records stay in public/ and are never edited.
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const project = new URL("../../", import.meta.url);
const compactUrl = /\/(images\/(?:stock|ai)\/compact\/[a-z0-9-]+-(?:240|400|800|960)\.webp|logos\/(?:partners|banks)\/compact\/[a-z0-9-]+-(?:192|360)\.png)(?=[ ,"'&<])/g;

export function referencedCompactAssets(html) {
  return Array.from(html.matchAll(compactUrl), (match) => match[1]);
}

async function collectHtml(dir, assets) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const location = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectHtml(location, assets);
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      for (const src of referencedCompactAssets(await readFile(location, "utf8"))) assets.add(src);
    }
  }
}

export function assetJob(asset, entries) {
  const photo = /^(images\/(?:stock|ai))\/compact\/([a-z0-9-]+)-(240|400|800|960)\.webp$/.exec(asset);
  if (photo) {
    const [, dir, slug, widthString] = photo;
    const entry = entries.get(slug);
    const width = Number(widthString);
    if (!entry || path.posix.dirname(entry.file) !== dir || entry.width <= width) {
      throw Error(`No eligible manifest original for /${asset}`);
    }
    return { source: entry.file, width };
  }
  const logo = /^logos\/(partners|banks)\/compact\/([a-z0-9-]+)-(192|360)\.png$/.exec(asset);
  if (logo && (logo[1] === "partners" || logo[3] === "192")) {
    return { source: `logos/${logo[1]}/${logo[2]}.png`, width: Number(logo[3]), logo: true };
  }
  throw Error(`Unexpected compact asset /${asset}`);
}

export default function compactAssets() {
  return {
    name: "dubaipoints-compact-assets",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const assets = new Set();
        await collectHtml(dist, assets);
        if (!assets.size) return;
        const manifest = JSON.parse(await readFile(new URL("data/stock/manifest.json", project), "utf8"));
        const entries = new Map(manifest.entries.map((entry) => [entry.slug, entry]));
        const pending = Array.from(assets).sort();
        const publicDir = fileURLToPath(new URL("public/", project));
        let bytes = 0;
        await Promise.all(Array.from({ length: 3 }, async () => {
          for (let asset; (asset = pending.shift()) !== undefined;) {
            const job = assetJob(asset, entries);
            const output = path.join(dist, asset);
            await mkdir(path.dirname(output), { recursive: true });
            let pipeline = sharp(path.join(publicDir, job.source));
            if (job.logo) {
              // Resize the approved artwork only, retaining proportions
              // and alpha with lossless encoding in the original format.
              pipeline = pipeline.resize({ width: job.width, withoutEnlargement: true })
                .png({ compressionLevel: 9 });
            } else {
              pipeline = pipeline.rotate().resize({ width: job.width, withoutEnlargement: true })
                .webp({ quality: 72, effort: 5 });
            }
            const info = await pipeline.toFile(output);
            if (info.width !== job.width) throw Error(`Incorrect srcset width for /${asset}`);
            bytes += info.size;
          }
        }));
        logger.info(`Generated ${assets.size} local delivery images (${Math.round(bytes / 1024)} KB in build)`);
      },
    },
  };
}
