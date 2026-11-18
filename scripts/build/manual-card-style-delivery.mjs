// Exact compiled CSS of specifically reviewed card profiles and issuer hubs.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformManualCardStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";
import { MANUAL_CARD_STYLE_ROUTES } from "./manual-card-style-routes.mjs";

const bodyToken = new RegExp(STYLE_IDENTITY_TOKEN.source +
  "|<noscript\\b[^>]*>[\\s\\S]*?<\\/noscript\\s*>|<h1\\b[^>]*>[\\s\\S]*?<\\/h1\\s*>", "gi");

export function inlineManualCardStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: Object.keys(MANUAL_CARD_STYLE_ROUTES),
    label: "Manual card",
    transform: transformManualCardStyles,
    isExpectedBody(body, route) {
      const tokens = [...body.matchAll(bodyToken)].map(match => match[0]);
      const headings = tokens.filter(token => /^<h1\b/i.test(token));
      const articles = tokens.filter(token => /^<article\b/i.test(token));
      if (headings.length !== 1 || articles.length !== 1) return false;
      const text = headings[0].replace(/^<h1\b[^>]*>|<\/h1\s*>$/gi, "").trim();
      const name = MANUAL_CARD_STYLE_ROUTES[route];
      if (route.startsWith("/banks/")) {
        return text === name && /\sclass="dp-bank-body"(?=[\s>])/.test(articles[0]) &&
          tokens.filter(token => /^<section\b/i.test(token) && /\sid="bank-cards"(?=[\s>])/.test(token)).length === 1;
      }
      return (text === name || text.startsWith(name + " ")) &&
        /\sclass="dp-cr-body"(?=[\s>])/.test(articles[0]);
    },
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineManualCardStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(rows => {
      for (const row of rows) console.log("[manual-card-style-delivery] " + row.route + " " + row.inlinedCount + " exact styles");
    })
    .catch(error => { console.error("[manual-card-style-delivery] " + error.message); process.exitCode = 1; });
}
