// Change delivery for one existing news route, not the shared article template.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformMyFamilyStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

export const MY_FAMILY_STYLE_ROUTE = "/news/skywards-my-family-pooling-pause/";

export function inlineMyFamilyStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: [MY_FAMILY_STYLE_ROUTE],
    label: "My Family article",
    transform: transformMyFamilyStyles,
    isExpectedBody(body) {
      return [...body.matchAll(STYLE_IDENTITY_TOKEN)].filter(([token]) =>
        /^<article\b/i.test(token) && /\sclass="dp-reading-shell"(?=[\s>])/.test(token)).length === 1;
    },
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineMyFamilyStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(([result]) => console.log(`[my-family-style-delivery] ${result.route} ${result.inlinedCount} exact styles; ${result.cssBytes}B; ${result.fingerprint}`))
    .catch(error => { console.error(`[my-family-style-delivery] ${error.message}`); process.exitCode = 1; });
}
