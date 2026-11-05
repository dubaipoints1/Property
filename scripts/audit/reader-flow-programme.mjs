// Opt-in reader-flow regression. Run from the repository root after build.
// node scripts/audit/reader-flow-programme.mjs [dist] [output-directory]
// Browser: DP_CHROME_PATH or the installed Playwright Chromium.
import assert from 'node:assert/strict';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from './_lib.mjs';
const dist=path.resolve(process.argv[2]??'dist');
const out=path.resolve(process.argv[3]??'audit-output/reader-flow/programmes');
await mkdir(out,{recursive:true});
const hotels=new Set(['marriott-bonvoy','hilton-honors','accor-all','world-of-hyatt','ihg-one-rewards']);
const slugs=(await readdir('./src/content/programs')).filter(f=>f.endsWith('.mdx')).map(f=>f.slice(0,-4));
const server=await startStaticServer({distDir:dist});
const browser=await chromium.launch({executablePath:process.env.DP_CHROME_PATH||undefined});
let states=0;
const records=[];
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({colorScheme:theme,reducedMotion:'reduce',viewport:{width:390,height:844}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===server.baseUrl?r.continue():r.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const slug of slugs){
   const route=`/${hotels.has(slug)?'hotels':'airlines'}/${slug}/`;
   await page.setViewportSize({width:390,height:844});
   assert.equal((await page.goto(server.baseUrl+route,{waitUntil:'load'})).status(),200);
   await page.evaluate(()=>document.fonts.ready);
   for (const panel of await page.locator('.dp-reading-takeaways > div').all()) {
    assert.deepEqual(await panel.evaluate(el => ({ radius: getComputedStyle(el).borderRadius, background: getComputedStyle(el).backgroundColor })),
      { radius: '0px', background: 'rgba(0, 0, 0, 0)' }, route + ': the open takeaway treatment must actually win the CSS cascade');
   }
   assert.equal(await page.locator('nav[aria-label="Jump to section"]').count(),1,route);
   assert.equal(await page.locator('#programme-expiry').count(),1,route);
   const nav=page.locator('[data-programme-contents]');
   assert.equal(await nav.evaluate(el=>el.open),false,route);
   await nav.locator('summary').press('Space');
   assert.equal(await nav.evaluate(el=>el.open),true,route);
   for(const link of await nav.getByRole('link').all()){
    const href=await link.getAttribute('href');
    assert.equal(await page.locator(href).count(),1,route+' '+href);
   }
   const order=await page.locator('.dp-prog-prose').evaluate(prose=>{
    const children=[...prose.children];
    const refs=[...prose.querySelectorAll('.dp-prog-inline-reference')];
    const ending=[...prose.querySelectorAll('h2')].find(el=>['Bottom line','Related'].includes(el.textContent.trim()));
    return{lastHeading:[...prose.querySelectorAll('h2')].at(-1)?.textContent.trim(), allRefsBeforeEnding:refs.every(ref=>Boolean(ref.compareDocumentPosition(ending)&Node.DOCUMENT_POSITION_FOLLOWING))};
   });
   assert.ok(['Bottom line','Related'].includes(order.lastHeading),JSON.stringify({route,...order}));
   assert.ok(order.allRefsBeforeEnding,JSON.stringify({route,...order}));
   for(const [width,height] of [[320,740],[390,844],[844,390],[1024,768],[1440,390],[1440,900],[390,844]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false,route+' '+width);
    if(width>=1024)assert.equal(await nav.evaluate(el=>el.open),true,route);
    if(width>=1024&&height===390){
     await nav.getByRole('link').last().focus();
     const focus=await nav.getByRole('link').last().boundingBox();
     assert.ok(focus.y>=0&&focus.y+focus.height<=height,JSON.stringify({route,focus}));
    }
    states++;
   }
   const photo=page.locator('.dp-prog-figure img').first();
   assert.ok(await photo.evaluate(async img=>{await img.decode();return img.naturalWidth>0;}),route);
   assert.ok(await page.locator('.dp-prog-photo-credit').isVisible(),route);
   if(slug==='skywards'||slug==='etihad-guest'){
    await page.getByRole('link',{name:'Price your redemption',exact:true}).click();
    assert.equal(new URL(page.url()).hash,'#programme-calculator');
    assert.equal(await page.locator('#programme-calculator > details').evaluate(el=>el.open),true);
    await page.locator('#programme-calculator #dp-cm-cashFare').fill('1000');
    await page.locator('#programme-calculator #dp-cm-miles').fill('10000');
    await page.locator('#programme-calculator #dp-cm-awardFees').fill('100');
   }
   if(['skywards','marriott-bonvoy'].includes(slug)){
    for(const width of [390,1440]){
     await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
     await page.screenshot({path:path.join(out,`${slug}-${theme}-${width}.png`)});
    }
   }
   records.push({route,theme,navigationCount:1,resizeStates:7,ending:order.lastHeading,referencesBeforeEnding:order.allRefsBeforeEnding,photoDecoded:true,photoCreditVisible:true});
  }
  assert.deepEqual(errors,[]);
  await context.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await nojs.route('**/*',r=>new URL(r.request().url()).origin===server.baseUrl?r.continue():r.abort());
 const page=await nojs.newPage();await page.goto(server.baseUrl+'/airlines/skywards/');
 await page.locator('[data-programme-contents] > summary').press('Space');
 await page.getByRole('navigation',{name:'Jump to section'}).getByRole('link',{name:'Expiry mechanics',exact:true}).press('Enter');
 assert.equal(new URL(page.url()).hash,'#mile-expiry-mechanics');
 await page.locator('#programme-calculator > details > summary').press('Space');
 assert.equal(await page.locator('#programme-calculator > details').evaluate(el=>el.open),true);
 await nojs.close();
 const summary={programmeRoutes:slugs.length,themes:2,resizeStates:states,navigation:'one control; all targets resolve; native no-JS fallback',ordering:'reference facts precede true ending',calculators:'on-page action opens correct disclosure',screens:out};
 await writeFile(path.join(out,'programme-flow-evidence.json'),JSON.stringify({dist,summary,records},null,2)+'\n');
 console.log(JSON.stringify(summary));
}finally{await browser.close();server.close();}
