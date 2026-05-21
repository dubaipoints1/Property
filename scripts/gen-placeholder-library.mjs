// One-shot script that produces 1600×900 placeholder JPGs for the
// 12 seed entries in src/assets/cards/library/. The real licensed
// images replace these per the LICENSE-CLEARANCE-STATUS table in
// LIBRARY.md. Run once with `node scripts/gen-placeholder-library.mjs`;
// the output JPGs are committed to the tree so the Astro build has
// real binaries to optimise.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "assets", "cards", "library");

// Filename → { background colour, label }. Colours are muted, dirham-
// numerate editorial tones — they slot into the warm-paper palette
// without screaming "this is a placeholder" while still being visibly
// solid-colour to anyone QA'ing the build.
const SEEDS = [
  ["emirates-a380-dxb.jpg", "#1f3a4d", "Emirates A380 at DXB"],
  ["emirates-cabin-business.jpg", "#2d4a5f", "Emirates Business cabin"],
  ["etihad-787-cabin.jpg", "#4a3a2e", "Etihad 787 cabin"],
  ["flydubai-boeing-738.jpg", "#5a4030", "flydubai 737-800"],
  ["marriott-hotel-exterior.jpg", "#3a3a3a", "Marriott hotel exterior"],
  ["dxb-airport-concourse.jpg", "#2a3540", "DXB Concourse B"],
  ["dubai-skyline-burj.jpg", "#6a5030", "Dubai skyline / Burj"],
  ["dubai-fine-dining.jpg", "#3a2a25", "Dubai fine dining"],
  ["dubai-mall-evening.jpg", "#4a3530", "Dubai Mall in the evening"],
  ["aed-banknotes-flat.jpg", "#2d6a52", "AED banknotes — flat lay"],
  ["yas-island-aerial.jpg", "#3a5060", "Yas Island aerial"],
  ["lulu-store-interior.jpg", "#4a4035", "LuLu store interior"],
];

const W = 1600;
const H = 900;

async function makeOne(filename, bg, label) {
  // Render a solid background + label text via SVG → sharp → JPEG.
  // The label is for QA only; real images swap in per LIBRARY.md.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" font-family="DM Sans, sans-serif"
        font-size="44" fill="#fbfaf6" text-anchor="middle"
        dominant-baseline="central" opacity="0.85">${label}</text>
  <text x="50%" y="${H - 40}" font-family="DM Sans, sans-serif"
        font-size="18" fill="#fbfaf6" text-anchor="middle"
        dominant-baseline="auto" opacity="0.55">placeholder · ${filename}</text>
</svg>`;
  const buf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await writeFile(join(OUT_DIR, filename), buf);
  console.log(`wrote ${filename} (${buf.length} bytes)`);
}

for (const [filename, bg, label] of SEEDS) {
  await makeOne(filename, bg, label);
}
console.log(`done — ${SEEDS.length} placeholders in ${OUT_DIR}`);
