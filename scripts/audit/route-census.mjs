// Opt-in audit: inventory every emitted HTML route, then resize each live
// document through portrait, landscape, desktop and wide views in both themes.
// Usage: node scripts/audit/route-census.mjs [dist] [output-directory]
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { routeFromHtmlPath, startStaticServer } from './_lib.mjs';

const dist = path.resolve(process.argv[2] ?? 'dist');
const output = path.resolve(process.argv[3] ?? 'audit-output/census');
const viewports = [[390,844], [320,740], [844,390], [768,1024], [1024,768], [1440,900], [1920,1080], [2560,1080], [390,844]];
const htmlFiles = (await readdir(dist, { recursive: true, withFileTypes: true }))
  .filter(item => item.isFile() && item.name.endsWith('.html'))
  .map(item => path.relative(dist, path.join(item.parentPath, item.name))).sort();
assert.ok(htmlFiles.length > 100, 'Use a complete, post-processed DubaiPoints build');
const sitemapFiles = (await readdir(dist)).filter(file => /^sitemap-\d+\.xml$/.test(file));
assert.ok(sitemapFiles.length, 'Build is missing its generated sitemap');
const sitemap = new Set((await Promise.all(sitemapFiles.map(file => readFile(path.join(dist, file), 'utf8'))))
  .flatMap(xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname)));
const rows = htmlFiles.map(file => {
  const route = routeFromHtmlPath(file);
  return { route, file, family: route.split('/')[1] || 'homepage', inSitemap: sitemap.has(route), title: '', canonical: '', themes: {}, issues: [] };
});
await mkdir(output, { recursive: true });
const server = await startStaticServer({ distDir: dist });
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });
  const queue = [...rows];
  let finished = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route('**/*', request => new URL(request.request().url()).origin === server.baseUrl ? request.continue() : request.abort());
    const page = await context.newPage();
    let active;
    page.on('pageerror', error => active?.issues.push({ kind: 'script', message: error.message }));
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === server.baseUrl) {
        active?.issues.push({ kind: 'local response', status: response.status(), path: new URL(response.url()).pathname });
      }
    });
    try {
      for (let row; (row = queue.shift()); ) {
        active = row;
        for (const theme of ['light', 'dark']) {
          row.themes[theme] = [];
          try {
            await page.emulateMedia({ colorScheme: theme });
            await page.setViewportSize({ width: 390, height: 844 });
            const response = await page.goto(server.baseUrl + row.route, { waitUntil: 'load', timeout: 15000 });
            assert.equal(response?.status(), 200, 'Local HTML must load');
            await page.evaluate(() => document.fonts.ready.then(() => null));
            row.title = await page.title();
            row.canonical = await page.locator('link[rel="canonical"]').getAttribute('href', { timeout: 2000 }).catch(() => '') ?? '';
            assert.ok(row.title, 'Missing document title');
            await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme, { timeout: 2500 });
            for (const [width, height] of viewports) {
              await page.setViewportSize({ width, height });
              const measured = await page.evaluate(async () => {
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const { clientWidth, scrollWidth } = document.documentElement;
                const main = document.querySelector('main');
                const offenders = scrollWidth <= clientWidth + 1 ? [] : [...document.querySelectorAll('body *')]
                  .filter(node => {
                    const rect = node.getBoundingClientRect();
                    return rect.width > 0 && rect.right > clientWidth + 1 && !node.closest('[aria-hidden="true"]');
                  }).slice(0, 10).map(node => `${node.localName}${node.id ? `#${node.id}` : ''}${[...node.classList].slice(0,2).map(x => `.${x}`).join('')}`);
                return { clientWidth, scrollWidth, height: innerHeight, mainWidth: Math.round(main?.getBoundingClientRect().width ?? 0), offenders };
              });
              row.themes[theme].push({ width, height, ...measured });
              if (measured.clientWidth !== width || measured.height !== height || measured.mainWidth <= 0 || measured.scrollWidth > width + 1) {
                row.issues.push({ kind: 'reflow', theme, width, height, ...measured });
              }
            }
          } catch (error) {
            row.issues.push({ kind: 'load', theme, message: error.message });
          }
        }
        finished += 1;
        if (finished % 40 === 0) console.error(`Reflow: ${finished}/${rows.length} routes measured`);
        active = null;
      }
    } finally {
      await context.close();
    }
  }));
} finally {
  await browser?.close();
  server.close();
}

const metadata = { browser: 'Chrome / Playwright', viewports, sameDocumentResize: true, crossOriginRequests: 'blocked', routes: rows.length,
  measurements: rows.reduce((n,r) => n + Object.values(r.themes).flat().length, 0), affectedRoutes: rows.filter(r => r.issues.length).length,
  sitemapOnly: [...sitemap].filter(route => !rows.some(r => r.route === route)).sort() };
const escape = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');
const groups = Map.groupBy(rows, r => r.family);
const markdown = [
  '# DubaiPoints — full route inventory and resize audit', '',
  `Local built candidate. ${rows.length} HTML routes; ${rows.filter(r=>r.inSitemap).length} listed in the sitemap; ${metadata.measurements} browser measurements across light and dark.`, '',
  `Viewports (CSS px): ${viewports.map(([w,h])=>`${w}×${h}`).join(', ')}. The final phone view is a return resize without reload.`, '',
  'A pass means the local route loaded and reflowed without document-level horizontal overflow, detected local HTTP failures or uncaught script errors in these states. It is not a manual visual, physical-device or accessibility certification. Intentional horizontal scrolling inside tables is not document overflow.', '',
  'This inventories emitted HTML, not arbitrary query-string combinations or off-site destinations. Route paths below are relative to the site root.', '',
  ...[...groups].flatMap(([family, members]) => [
    `## ${family} (${members.length})`, '', '| Route | Browser title | In sitemap | Reflow result |', '|---|---|---|---|',
    ...members.map(r => `| \`${r.route}\` | ${escape(r.title)} | ${r.inSitemap ? 'Yes' : 'No'} | ${r.issues.length ? `Review (${r.issues.length})` : 'Pass'} |`), '',
  ]),
];
await Promise.all([
  writeFile(path.join(output, 'responsive-route-inventory.md'), markdown.join('\n')),
  writeFile(path.join(output, 'responsive-route-evidence.json'), JSON.stringify({ metadata, rows }, null, 2) + '\n'),
]);
console.log(JSON.stringify(metadata));
if (metadata.affectedRoutes || metadata.sitemapOnly.length) process.exitCode = 1;
