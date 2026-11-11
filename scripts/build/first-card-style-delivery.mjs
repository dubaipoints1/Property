// One existing guide only. Preserve each compiled stylesheet byte and
// cascade position, including any script or preload between style links.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformFirstCardStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

export const FIRST_CARD_STYLE_ROUTE = "/guides/expat-starter-first-credit-card/";

export function inlineFirstCardStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: [FIRST_CARD_STYLE_ROUTE],
    label: "First-card guide",
    transform: transformFirstCardStyles,
    isExpectedBody(body) {
      const articles = [...body.matchAll(STYLE_IDENTITY_TOKEN)].map(match => match[0])
        .filter(token => /^<article\b/i.test(token) && /\sclass="dp-reading-shell"(?=[\s>])/.test(token));
      return articles.length === 1;
    },
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineFirstCardStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(([result]) => console.log(`[first-card-style-delivery] ${result.route} ${result.inlinedCount} exact styles; ${result.cssBytes}B; ${result.fingerprint}`))
    .catch(error => { console.error(`[first-card-style-delivery] ${error.message}`); process.exitCode = 1; });
}
