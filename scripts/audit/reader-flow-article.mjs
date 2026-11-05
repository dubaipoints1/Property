// Opt-in reader-flow regression. Run from the repository root after build.
// node scripts/audit/reader-flow-article.mjs [dist] [output-directory]
// Browser: DP_CHROME_PATH or the installed Playwright Chromium.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { startStaticServer } from './_lib.mjs';
const require=createRequire(import.meta.url);
const axeSource=require('axe-core').source;
const dist=process.argv[2]??'dist';
const out=process.argv[3]??'audit-output/reader-flow/articles';
await mkdir(out,{recursive:true});
const articleFiles=[];
for(const section of ['guides','news','deals']){
 for(const item of await readdir(`${dist}/${section}`,{withFileTypes:true})){
  if(item.isDirectory()){
   try{
    const html=await readFile(`${dist}/${section}/${item.name}/index.html`,'utf8');
    if(!html.includes('dp-reading-shell'))continue;
    const contextual=html.includes('data-reader-next');
    const fallback=html.includes('data-reader-latest');
    assert.notEqual(contextual,fallback,`${section}/${item.name}: exactly one continuation strategy`);
    assert.ok(html.includes('id="dp-latest-guides-heading"'),`${section}/${item.name}: old anchor preserved`);
    articleFiles.push({route:`/${section}/${item.name}/`,contextual,fallback});
   }catch(e){if(e.code!=='ENOENT')throw e;}
  }
 }
}
console.log(JSON.stringify({articleRoutes:articleFiles.length,contextual:articleFiles.filter(x=>x.contextual).length,fallback:articleFiles.filter(x=>x.fallback).length}));
const server=await startStaticServer({distDir:dist});
const browser=await chromium.launch({executablePath:process.env.DP_CHROME_PATH||undefined});
const samples=[
 ['/guides/uae-credit-card-eligibility-2026/','/cards/finder/'],
 ['/guides/paint-protection-film-dubai/','/guides/expat-starter-car-costs/'],
 ['/news/skywards-miles-expiry-birthday-month-rule-ends-2027/','/airlines/skywards/'],
 ['/news/emirates-nbd-salary-transfer-cashback-up-to-aed-6000-24-december/','/salary-transfer/'],
 ['/deals/citi-dnata-travel-5pct-citibank/','/banks/citi/'],
 ['/news/dubaipoints-newsroom-launch/',null],
];
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme,reducedMotion:'reduce'});
  await context.route('**/*',r=>r.request().url().startsWith(server.baseUrl+'/')?r.continue():r.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [route,expected] of samples){
   assert.equal((await page.goto(server.baseUrl+route,{waitUntil:'load'})).status(),200);
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
   const selector=expected?'[data-reader-next]':'[data-reader-latest]';
   const next=page.locator(selector);
   assert.equal(await next.count(),1);
   const anchor=expected?next.locator('a[data-reader-action]').first():next.locator('a').first();
   if(expected)assert.equal(await anchor.getAttribute('href'),expected);
   await next.scrollIntoViewIfNeeded();
   await anchor.focus();
   assert.ok(await anchor.evaluate(el=>el===document.activeElement));
   assert.equal(await anchor.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
   assert.ok((await anchor.boundingBox()).height>=44);
   const source=page.locator('.dp-article-sources');
   if(await source.count())assert.ok(await page.evaluate(()=>Boolean(document.querySelector('.dp-article-sources').compareDocumentPosition(document.querySelector('[data-reader-next],[data-reader-latest]'))&Node.DOCUMENT_POSITION_FOLLOWING)));
   for(const [width,height] of [[320,740],[390,844],[844,390],[1024,600],[1440,900],[390,844]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`${route} ${theme} ${width}`);
   }
   await page.setViewportSize({width:390,height:844});
   await next.scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${route.split('/').filter(Boolean).join('-')}-${theme}.png`});
   await page.evaluate(axeSource);
   const violations=await page.evaluate(async()=> (await axe.run(document.querySelector('[data-reader-next],[data-reader-latest]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
   assert.deepEqual(violations,[],`${route} ${theme} scoped axe`);
  }
  assert.deepEqual(errors,[]);
  await context.close();
 }
 const plain=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const page=await plain.newPage();await page.goto(server.baseUrl+samples[0][0]);
 assert.equal(await page.locator('[data-reader-action]').first().getAttribute('href'),'/cards/finder/');
 await plain.close();
 console.log('Article flow: 72 route/size/theme states, exact contextual destinations, evidence-first ordering, keyboard focus/tap targets, scoped axe and no-JS continuation passed.');
}finally{await browser.close();server.close();}
