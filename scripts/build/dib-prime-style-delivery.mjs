// The DIB hub and three verified Prime reviews only. Leave other card
// profiles, the homepage, Finder and the CSS assets themselves untouched.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformDibPrimeStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

const headings = Object.freeze({
  "/banks/dib/": "Dubai Islamic Bank",
  "/cards/dib-prime-gold/": "DIB Prime Gold Card",
  "/cards/dib-prime-signature/": "DIB Prime Signature Card",
  "/cards/dib-prime-infinite/": "DIB Prime Infinite Card",
});
export const DIB_PRIME_STYLE_ROUTES = Object.freeze(Object.keys(headings));
// Skip comments, raw text, templates and noscript fallback content, rather
// than accepting an example identity as the active page heading or article.
const BODY_TOKEN = new RegExp(STYLE_IDENTITY_TOKEN.source +
  "|<noscript\\b[^>]*>[\\s\\S]*?<\\/noscript\\s*>|<h1\\b[^>]*>[\\s\\S]*?<\\/h1\\s*>", "gi");

export function inlineDibPrimeStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: DIB_PRIME_STYLE_ROUTES,
    label: "DIB Prime",
    transform: transformDibPrimeStyles,
    isExpectedBody(body, route) {
      const tokens = [...body.matchAll(BODY_TOKEN)].map(match => match[0]);
      const heading = tokens.filter(token => /^<h1\b/i.test(token));
      const articles = tokens.filter(token => /^<article\b/i.test(token));
      const text = heading[0]?.replace(/^<h1\b[^>]*>|<\/h1\s*>$/gi, "").trim();
      if (heading.length !== 1 || articles.length !== 1) return false;
      const name = headings[route];
      if (route === "/banks/dib/") {
        return text === name && /\sclass="dp-bank-body"(?=[\s>])/.test(articles[0])
          && tokens.filter(token => /^<section\b/i.test(token) && /\sid="bank-cards"(?=[\s>])/.test(token)).length === 1;
      }
      return (text === name || text?.startsWith(name + " "))
        && /\sclass="dp-cr-body"(?=[\s>])/.test(articles[0]);
    },
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineDibPrimeStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(results => {
      for (const item of results) console.log(`[dib-prime-style-delivery] ${item.route} ${item.inlinedCount} exact styles; ${item.cssBytes}B; ${item.fingerprint}`);
    })
    .catch(error => { console.error(`[dib-prime-style-delivery] ${error.message}`); process.exitCode = 1; });
}
