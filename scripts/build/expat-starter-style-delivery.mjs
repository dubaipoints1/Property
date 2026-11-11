// Embed compiled CSS on the existing Expat Starter guide only.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformExpatStarterStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

export const EXPAT_STARTER_STYLE_ROUTE = "/guides/expat-starter/";

export function inlineExpatStarterStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: [EXPAT_STARTER_STYLE_ROUTE],
    label: "Expat Starter guide",
    transform: transformExpatStarterStyles,
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
  inlineExpatStarterStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(([result]) => console.log(`[expat-starter-style-delivery] ${result.route} ${result.inlinedCount} exact styles; ${result.cssBytes}B; ${result.fingerprint}`))
    .catch(error => { console.error(`[expat-starter-style-delivery] ${error.message}`); process.exitCode = 1; });
}
