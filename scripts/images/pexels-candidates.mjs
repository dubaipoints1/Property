// Download the first five Pexels results for each query into
// candidates/<key>-<n>.jpg so an editor can look before choosing a
// --pick for fetch-stock.ts. Writes nothing to the manifest.
// Usage: PEXELS_API_KEY=... node scripts/images/pexels-candidates.mjs queries.json
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const queries = JSON.parse(readFileSync(process.argv[2], "utf8"));
mkdirSync("candidates", { recursive: true });
const key = process.env.PEXELS_API_KEY;
const index = [];
for (const { key: k, query } of queries) {
  const u = new URL("https://api.pexels.com/v1/search");
  u.searchParams.set("query", query);
  u.searchParams.set("orientation", "landscape");
  u.searchParams.set("per_page", "5");
  const r = await fetch(u, { headers: { Authorization: key } });
  const j = await r.json();
  for (const [n, p] of (j.photos ?? []).entries()) {
    const img = await fetch(p.src.medium);
    writeFileSync(`candidates/${k}-${n}.jpg`, Buffer.from(await img.arrayBuffer()));
    index.push({ key: k, n, query, id: p.id, url: p.url, alt: p.alt });
  }
}
writeFileSync("candidates/index.json", JSON.stringify(index, null, 2));
