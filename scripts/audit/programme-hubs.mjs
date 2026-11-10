// Opt-in local build QA. Blocks all third-party requests, including analytics.
import assert from 'node:assert/strict';
import { readdir, mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from './_lib.mjs';

const dist = path.resolve(process.argv[2] ?? 'dist');
const out = path.resolve(process.argv[3] ?? 'audit-output/programme-hubs');
await mkdir(out, { recursive: true });
const slugs = (await readdir('src/content/programs')).filter(file => file.endsWith('.mdx')).map(file => file.slice(0, -4));
const hotels = new Set(['marriott-bonvoy', 'hilton-honors', 'accor-all', 'world-of-hyatt', 'ihg-one-rewards']);
const axe = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
const server = await startStaticServer({ distDir: dist });
const browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });
const records = [];
const accessibility = [];
const errors = [];
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme: theme, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === server.baseUrl ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const slug of slugs) {
      const route = `/${hotels.has(slug) ? 'hotels' : 'airlines'}/${slug}/`;
      assert.equal((await page.goto(server.baseUrl + route, { waitUntil: 'load' })).status(), 200, route);
      await page.evaluate(() => document.fonts.ready);
      const hub = page.locator(`[data-programme-hub="${slug}"]`);
      assert.equal(await hub.count(), 1, route);
      assert.equal(await page.locator('nav[aria-label="Jump to section"]').count(), 1, route);
      const more = hub.locator('[data-programme-more]');
      if (await more.count()) assert.equal(await more.evaluate(node => node.open), false, route + ': extended coverage must not displace the guide initially');
      assert.ok(await hub.locator('.dp-programme-news > li').count() <= 3);
      assert.ok(await hub.locator('[data-programme-live-offers] > li').count() <= 3);
      const anchors = await hub.locator('a[href^="#"]').evaluateAll(links => links.map(link => {
        const id = decodeURIComponent(link.hash.slice(1));
        return { id, targets: document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length };
      }));
      assert.ok(anchors.every(anchor => anchor.targets === 1), JSON.stringify({ route, anchors }));
      for (const [width, height] of [[320, 740], [390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [390, 844]]) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, route + ' ' + width);
        const hubBox = await hub.boundingBox();
        if (width === 390) assert.ok(hubBox.height < 900, route + ': compact initial hub height ' + hubBox.height);
        records.push({ route, theme, width, height, documentOverflow: false, initialHubHeight: Math.round(hubBox.height) });
      }
      if (await more.count()) {
        await more.locator('summary').press('Space');
        assert.equal(await more.evaluate(node => node.open), true, route + ': native coverage disclosure opens');
      }
      await page.addScriptTag({ content: axe });
      const a11y = await page.evaluate(async () => {
        const result = await window.axe.run('#programme-hub', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return { violations: result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), incomplete: result.incomplete.map(item => item.id) };
      });
      assert.deepEqual(a11y.violations, [], JSON.stringify({ route, theme, a11y }));
      accessibility.push({ route, theme, width: 390, height: 844, ...a11y });
      if (['skywards', 'world-of-hyatt'].includes(slug)) {
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await hub.screenshot({ path: path.join(out, `${slug}-${theme}-${width}-expanded.png`) });
          if (await more.count()) await more.locator('summary').press('Space');
          await hub.screenshot({ path: path.join(out, `${slug}-${theme}-${width}.png`) });
          if (await more.count()) await more.locator('summary').press('Space');
        }
      }
      if (await more.count()) {
        await more.locator('summary').press('Space');
        assert.equal(await more.evaluate(node => node.open), false);
      }
      if (slug === 'skywards' || slug === 'etihad-guest') {
        await hub.getByRole('link', { name: /Cash or points\?/ }).press('Enter');
        assert.equal(new URL(page.url()).hash, '#programme-calculator');
        assert.equal(await page.locator('#programme-calculator > details').evaluate(node => node.open), true);
      }
      await hub.getByRole('link', { name: 'Go to the full guide' }).press('Enter');
      assert.equal(new URL(page.url()).hash, '#programme-guide');
    }
    await context.close();
  }
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await nojs.route('**/*', route => new URL(route.request().url()).origin === server.baseUrl ? route.continue() : route.abort());
  const page = await nojs.newPage();
  await page.goto(server.baseUrl + '/airlines/skywards/');
  assert.equal(await page.locator('[data-programme-hub]').count(), 1);
  const nojsMore = page.locator('[data-programme-more]');
  if (await nojsMore.count()) {
    await nojsMore.locator('summary').press('Space');
    assert.equal(await nojsMore.evaluate(node => node.open), true, 'native extended coverage works without JavaScript');
  }
  await page.locator('[data-programme-hub]').getByRole('link', { name: 'Go to the full guide' }).press('Enter');
  assert.equal(new URL(page.url()).hash, '#programme-guide');
  await nojs.close();
  assert.deepEqual(errors, []);
  const summary = { programmeRoutes: slugs.length, themes: 2, viewportStates: records.length, scopedAxeStates: accessibility.length, scopedAxeViolations: 0, noJavaScript: 'guide navigation and native extended coverage operable', privateDraftsImported: false };
  await writeFile(path.join(out, 'evidence.json'), JSON.stringify({ dist, summary, records, accessibility }, null, 2) + '\n');
  console.log(JSON.stringify(summary));
} finally { await browser.close(); server.close(); }
