// Exact compiled CSS delivery for the ten existing programme landing pages.
// No selector purge, async/onload CSS, URL rewrite, visual or tracking change.
// All route/asset validation completes before any output is written.
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformProgrammeStyles } from "./home-style-delivery.mjs";

export const PROGRAMME_STYLE_ROUTES = Object.freeze([
  "/airlines/air-arabia-airrewards/", "/airlines/etihad-guest/",
  "/airlines/qatar-privilege-club/", "/airlines/saudia-alfursan/",
  "/airlines/skywards/", "/hotels/accor-all/", "/hotels/hilton-honors/",
  "/hotels/ihg-one-rewards/", "/hotels/marriott-bonvoy/",
  "/hotels/world-of-hyatt/",
]);

const decode = bytes => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
// Consume comments/raw-text elements first so a quoted example cannot stand
// in for the actual rendered canonical or programme section.
export const STYLE_IDENTITY_TOKEN = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<template\b[^>]*>[\s\S]*?<\/template\s*>|<\/?head\b[^>]*>|<(?:body|link|section|article)\b[^>]*>/gi;

async function regularFile(file, root) {
  const info = await lstat(file);
  const resolved = await realpath(file);
  if (!info.isFile() || info.isSymbolicLink() || resolved !== file
    || !resolved.startsWith(root + path.sep)) {
    throw Error("Exact style input must be a regular contained file without symlinks");
  }
  return readFile(file);
}

/** Each caller supplies its explicit routes, identity check and exact transformer. */
export async function inlineExactRouteStyles(distDir, { routes, isExpectedBody, transform, label }) {
  const input = path.resolve(distDir);
  const info = await lstat(input);
  if (!info.isDirectory() || info.isSymbolicLink()) throw Error(`${label} dist must be a real directory`);
  const root = await realpath(input);
  const assets = new Map();
  const pending = [];
  for (const route of routes) {
    if (!/^\/(?:[a-z0-9-]+\/)+$/.test(route)) throw Error("Invalid exact style route");
    const file = path.join(root, route.slice(1), "index.html");
    const bytes = await regularFile(file, root);
    const html = decode(bytes);
    const headMatch = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html);
    const tokens = [...html.matchAll(STYLE_IDENTITY_TOKEN)];
    const headTokens = tokens.filter(token => /^<\/?head\b/i.test(token[0]));
    const bodyTokens = tokens.filter(token => /^<body\b/i.test(token[0]));
    const headEnd = headMatch && headMatch.index + headMatch[0].length;
    if (!headMatch || headTokens.length !== 2 || headTokens[0].index !== headMatch.index
      || !/^<\/head\s*>$/i.test(headTokens[1][0])
      || headTokens[1].index + headTokens[1][0].length !== headEnd
      || bodyTokens.length !== 1 || bodyTokens[0].index < headEnd) {
      throw Error(`${label} route identity mismatch: ${route}`);
    }
    const head = headMatch[1];
    const canonicals = [...head.matchAll(STYLE_IDENTITY_TOKEN)].map(match => match[0])
      .filter(token => /^<link\b/i.test(token) && /\brel\s*=\s*(?:"canonical"|'canonical'|canonical(?=[\s>]))/i.test(token));
    const bodyStart = bodyTokens[0].index;
    if (canonicals.length !== 1 || canonicals[0] !== `<link rel="canonical" href="https://dubaipoints.ae${route}">`
      || !isExpectedBody(html.slice(bodyStart), route)) {
      throw Error(`${label} route identity mismatch: ${route}`);
    }
    // Only discover candidate local paths here. The shared pure transform
    // subsequently validates every attribute, URL and complete CSS body.
    for (const match of head.matchAll(/<link\b[^>]*href="(\/_astro\/[A-Za-z0-9_.-]+\.css)"[^>]*>/gi)) {
      const href = match[1];
      if (assets.has(href)) continue;
      const assetFile = path.join(root, href.slice(1));
      assets.set(href, { file: assetFile, bytes: await regularFile(assetFile, root) });
    }
    const result = transform(html, href => {
      const asset = assets.get(href);
      if (!asset) throw Error(`Missing validated ${label} CSS asset`);
      return decode(asset.bytes);
    });
    if (!result.html.endsWith(html.slice(bodyStart))) {
      throw Error(`${label} body changed during exact-style delivery`);
    }
    pending.push({ route, file, bytes, result });
  }
  // Detect an intervening build/asset change before beginning output writes.
  // An I/O failure during writes still fails the build; no deployment follows.
  for (const item of [...pending, ...assets.values()]) {
    if (!(await regularFile(item.file, root)).equals(item.bytes)) throw Error(`${label} input drift before delivery`);
  }
  for (const item of pending) {
    if (item.result.inlinedCount) await writeFile(item.file, item.result.html, "utf8");
  }
  return pending.map(({ route, result }) => ({ route, ...result, html: undefined }));
}

/** Explicit allowlist only; homepage and every other output remain untouched. */
export function inlineProgrammeStyles(distDir) {
  return inlineExactRouteStyles(distDir, {
    routes: PROGRAMME_STYLE_ROUTES,
    label: "Programme",
    transform: transformProgrammeStyles,
    isExpectedBody(body, route) {
      const slug = route.split("/").filter(Boolean).at(-1);
      const hubs = [...body.matchAll(STYLE_IDENTITY_TOKEN)].map(match => match[0])
        .filter(token => /^<section\b/i.test(token) && new RegExp(`\\sdata-programme-hub="${slug}"(?=[\\s>])`).test(token));
      return hubs.length === 1;
    },
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  inlineProgrammeStyles(process.argv[2] ?? path.join(root, "dist"))
    .then(results => {
      for (const item of results) console.log(`[programme-style-delivery] ${item.route} ${item.inlinedCount} exact styles; ${item.cssBytes}B; ${item.fingerprint}`);
    })
    .catch(error => { console.error(`[programme-style-delivery] ${error.message}`); process.exitCode = 1; });
}
