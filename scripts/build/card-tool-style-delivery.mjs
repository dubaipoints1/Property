// Preserve the full compiled cascade on Finder and Compare only.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformCardToolStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

export const CARD_TOOL_STYLE_ROUTES = Object.freeze(["/cards/finder/", "/cards/compare/"]);
const bodyToken = new RegExp(STYLE_IDENTITY_TOKEN.source + "|<noscript\\b[^>]*>[\\s\\S]*?<\\/noscript\\s*>", "gi");

export function inlineCardToolStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: CARD_TOOL_STYLE_ROUTES,
    label: "Card tool",
    transform: transformCardToolStyles,
    isExpectedBody(body, route) {
      const tokens = [...body.matchAll(bodyToken)].map(([token]) => token);
      const shell = tokens.filter(token => /^<body\b/i.test(token) &&
        /\sclass="(?:[^"]+\s)?dp-system-typography(?=[\s"])/.test(token));
      const routeMarker = route === "/cards/finder/" ? /\sclass="dp-finder"(?=[\s>])/ : /\sid="dp-compare-grid"(?=[\s>])/;
      return shell.length === 1 &&
        tokens.filter(token => /^<section\b/i.test(token) && routeMarker.test(token)).length === 1;
    },
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineCardToolStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(results => {
      for (const { route, inlinedCount, cssBytes, fingerprint } of results) {
        console.log(`[card-tool-style-delivery] ${route} ${inlinedCount} exact styles; ${cssBytes}B; ${fingerprint}`);
      }
    })
    .catch(error => { console.error(`[card-tool-style-delivery] ${error.message}`); process.exitCode = 1; });
}
