// Use the existing exact CSS delivery pipeline for /cards/ alone.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformCardsStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

export const CARDS_STYLE_ROUTE = "/cards/";

export function inlineCardsStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: [CARDS_STYLE_ROUTE],
    label: "Cards",
    transform: transformCardsStyles,
    isExpectedBody(body) {
      const sections = [...body.matchAll(STYLE_IDENTITY_TOKEN)].map(match => match[0])
        .filter(token => /^<section\b/i.test(token));
      return sections.filter(token => /\sclass="cards-top-picks"(?=[\s>])/.test(token) &&
        /\sdata-top-picks(?=[\s>])/.test(token)).length === 1 &&
        sections.filter(token => /\sclass="cards-compare-section"(?=[\s>])/.test(token)).length === 1;
    },
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineCardsStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(([result]) => console.log("[cards-style-delivery] " + result.route + " " + result.inlinedCount +
      " exact styles; " + result.cssBytes + "B; " + result.fingerprint))
    .catch(error => { console.error("[cards-style-delivery] " + error.message); process.exitCode = 1; });
}
