// Inline the exact compiled style cascade on the tracker index only.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformSalaryTrackerStyles } from "./home-style-delivery.mjs";
import { inlineExactRouteStyles, STYLE_IDENTITY_TOKEN } from "./programme-style-delivery.mjs";

export const SALARY_TRACKER_STYLE_ROUTE = "/salary-transfer/";
const bodyToken = new RegExp(STYLE_IDENTITY_TOKEN.source + "|<noscript\\b[^>]*>[\\s\\S]*?<\\/noscript\\s*>", "gi");

export function inlineSalaryTrackerStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: [SALARY_TRACKER_STYLE_ROUTE],
    label: "Salary Tracker",
    transform: transformSalaryTrackerStyles,
    isExpectedBody(body) {
      return [...body.matchAll(bodyToken)].filter(([token]) =>
        /^<section\b/i.test(token) && /\sclass="dpst dpst-responsive"/.test(token) &&
        /\saria-label="UAE salary-transfer offer tracker"/.test(token)).length === 1;
    },
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineSalaryTrackerStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(([item]) => console.log(`[salary-tracker-style-delivery] ${item.route} ${item.inlinedCount} exact styles; ${item.cssBytes}B; ${item.fingerprint}`))
    .catch(error => { console.error(`[salary-tracker-style-delivery] ${error.message}`); process.exitCode = 1; });
}
