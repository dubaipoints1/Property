// Opt-in reader-flow regression. Run from the repository root after build.
// node scripts/audit/reader-flow-tools.mjs [dist] [output-directory]
// Browser: DP_CHROME_PATH or the installed Playwright Chromium.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startStaticServer } from './_lib.mjs';
const server = await startStaticServer({ distDir: process.argv[2] ?? 'dist' });
const browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });
const errors=[];
try {
 for(const colorScheme of ['light','dark']) {
  const ctx=await browser.newContext({viewport:{width:390,height:844},colorScheme,reducedMotion:'reduce'});
  await ctx.route('**/*',r=>r.request().url().startsWith(server.baseUrl+'/')?r.continue():r.abort());
  const page=await ctx.newPage(); page.on('pageerror',e=>errors.push(e.message));
  const go=async href=>{const r=await page.goto(server.baseUrl+href,{waitUntil:'load'});assert.equal(r.status(),200);await page.evaluate(()=>document.fonts.ready);};
  await go('/cards/finder/?salary=15000&prefer=cashback&spend=groceries&cv_spend=12345');
  await page.waitForFunction(()=>document.querySelector('[data-card-value-spend]').value==='12345');
  const tiles=page.locator('#finder-grid > .dp-finder-tile:not([hidden])');
  assert.equal(await tiles.count(),6);
  const first=tiles.first();
  const slug=await first.getAttribute('data-slug');
  const expected=await first.locator('[data-card-value-first]').textContent();
  const review=await first.getByRole('link',{name:/^Read review/}).getAttribute('href');
  const reviewUrl=new URL(review,server.baseUrl);
  for(const [k,v] of [['salary','15000'],['prefer','cashback'],['spend','groceries'],['cv_spend','12345'],['via','finder']]) assert.equal(reviewUrl.searchParams.get(k),v);
  // Reading a review is not a deliberate comparison selection. Only the
  // comparison destination may suggest cards when no boxes were selected.
  assert.equal(reviewUrl.searchParams.has('cards'),false);
  assert.equal(await page.locator('[data-card-selection-tray]').isVisible(),false);
  const brief=first.locator('.dp-finder-card-details');
  assert.equal(await brief.getAttribute('open'),null);
  await brief.locator(':scope > summary').press('Enter');
  await first.locator('.dp-finder-match summary').press('Enter');
  assert.ok(await first.locator('[data-finder-filters]').isVisible());
  for(const [width,height] of [[320,740],[844,390],[768,1024],[1440,900],[390,844]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  }
  await go(review);
  const back=page.locator('[data-card-journey-back]');
  assert.ok(await back.isVisible());
  const compare=await page.locator('.dp-utility-actions').getByRole('link',{name:'Compare cards',exact:true}).getAttribute('href');
  const compareUrl=new URL(compare,server.baseUrl);
  assert.equal(compareUrl.searchParams.get('cv_spend'),'12345');
  assert.ok(compareUrl.searchParams.get('cards').split(',').includes(slug));
  await go(compare);
  await page.waitForFunction(()=>document.querySelector('[data-card-value-spend]').value==='12345');
  const compared=page.locator(`.dp-compare-col[data-slug='${slug}']`);
  assert.equal(await compared.locator('[data-card-value-first]').textContent(),expected);
  assert.equal(await page.locator('.dp-compare-picker-form input[type=hidden][name=cv_spend]').inputValue(),'12345');
  const returnFinder=await page.locator('[data-card-journey-back]').getAttribute('href');
  await go(returnFinder);
  assert.equal(await page.locator('#finder-form input[name=salary]').inputValue(),'15000');
  console.log(colorScheme,'Finder → review → same-profile Compare → same-filter Finder; disclosure/resize passed');

  await go('/cards/finder/?salary=15000&prefer=cashback&spend=groceries&cv_spend=12345');
  await page.waitForFunction(()=>document.querySelector('[data-card-selection-tray]')?.dataset.selectionReady==='true');
  const picks=page.locator('#finder-grid > .dp-finder-tile:not([hidden])');
  const selected=[];
  for(const tile of [picks.nth(1),picks.first()]) {
    selected.push(await tile.getAttribute('data-slug'));
    await tile.locator('[data-card-select]').check();
  }
  assert.equal(new URL(page.url()).searchParams.get('cards'),selected.join(','));
  const explicitReview=await picks.first().getByRole('link',{name:/^Read review/}).getAttribute('href');
  assert.equal(new URL(explicitReview,server.baseUrl).searchParams.get('cards'),selected.join(','));
  await go(explicitReview);
  const curated=page.locator('.dp-utility-actions').getByRole('link',{name:'Compare cards',exact:true});
  const curatedBase=new URL(await curated.getAttribute('data-card-journey-base'),server.baseUrl);
  const curatedTarget=new URL(await curated.getAttribute('href'),server.baseUrl);
  assert.equal(curatedTarget.searchParams.get('cards'),curatedBase.searchParams.get('cards')??selected.join(','));
  assert.equal(curatedTarget.searchParams.get('cv_spend'),'12345');
  // A review's explicitly curated alternatives remain its own destination;
  // the review's back link and Finder tray retain the reader-owned selection.
  const explicitBack=await page.locator('[data-card-journey-back]').getAttribute('href');
  assert.equal(new URL(explicitBack,server.baseUrl).searchParams.get('cards'),selected.join(','));
  await go(explicitBack);
  await page.waitForFunction(()=>document.querySelector('[data-card-selection-tray]')?.dataset.selectionReady==='true');
  const explicitCompare=await page.locator('[data-selection-compare]').getAttribute('href');
  assert.equal(new URL(explicitCompare,server.baseUrl).searchParams.get('cards'),selected.join(','));
  await go(explicitCompare);
  await page.waitForFunction(()=>document.querySelector('[data-card-value-spend]').value==='12345');
  assert.deepEqual(await page.locator('.dp-compare-col[data-slug]:not([hidden])').evaluateAll(nodes=>nodes.sort((a,b)=>Number(a.style.order)-Number(b.style.order)).map(node=>node.dataset.slug)),selected);
  await go(await page.locator('[data-card-journey-back]').getAttribute('href'));
  await page.waitForFunction(()=>document.querySelector('[data-card-selection-tray]')?.dataset.selectionReady==='true');
  assert.equal(await page.locator('[data-card-select]:checked').count(),2);
  await page.locator('[data-selection-clear]').click();
  assert.equal(new URL(page.url()).searchParams.has('cards'),false);
  assert.equal(await page.locator('[data-card-selection-tray]').isVisible(),false);
  assert.equal(await page.locator('#finder-form input[name=salary]').inputValue(),'15000');
  assert.equal(await page.locator('[data-card-value-spend]').inputValue(),'12345');
  const clearedReview=await picks.first().getByRole('link',{name:/^Read review/}).getAttribute('href');
  assert.equal(new URL(clearedReview,server.baseUrl).searchParams.has('cards'),false);
  console.log(colorScheme,'Explicit selection order survives review/back/tray/Compare/return; curated review alternatives stay explicit; clear removes only selection');

  await go('/salary-transfer/?st_band=aed-15000-to-30000&st_cash=true&st_sort=expiry');
  await page.waitForFunction(()=>document.querySelector('.dpst-band[aria-pressed=true]'));
  const bank=page.locator('.dpst-cards .dpst-bank-name').first();
  const href=await bank.getAttribute('href');
  const detailUrl=new URL(href,server.baseUrl);
  assert.equal(detailUrl.searchParams.get('st_band'),'aed-15000-to-30000');
  assert.equal(detailUrl.searchParams.get('st_cash'),'true');
  assert.equal(detailUrl.searchParams.get('st_sort'),'expiry');
  assert.ok(detailUrl.searchParams.get('st_offer'));
  await go(href);
  assert.ok(await page.locator('[data-salary-journey]').isVisible());
  const calc=await page.locator('[data-salary-journey] a').filter({hasText:'Calculate your reward'}).getAttribute('href');
  await go(calc);
  await page.waitForFunction(()=>document.querySelector('#dpsc-salary').value==='0');
  assert.equal(await page.locator('.dpsc-best').count(),0);
  assert.equal(await page.locator('.dpsc-rows').isVisible(),false);
  assert.match(await page.locator('.dpsc-empty').innerText(),/exact salary/i);
  await page.locator('#dpsc-salary').fill('17500.50');
  await page.waitForFunction(()=>new URLSearchParams(location.search).get('st_salary')==='17500.5');
  assert.ok(await page.locator('.dpsc-rows').isVisible());
  await page.locator('#dpsc-salary').fill('');
  await page.waitForFunction(()=>document.querySelector('.dpsc-rows').hidden && !new URLSearchParams(location.search).has('st_salary'));
  assert.equal(await page.locator('.dpsc-best').count(),0);
  assert.equal(new URL(page.url()).searchParams.has('st_salary'),false);
  await page.locator('#dpsc-salary').fill('17500.50');
  await page.waitForFunction(()=>new URLSearchParams(location.search).get('st_salary')==='17500.5');
  const row=page.locator('.dpsc-row').first();
  const conditions=page.getByRole('link',{name:'Read offer conditions →'}).first();
  const conditionHref=await conditions.getAttribute('href');
  assert.equal(new URL(conditionHref,server.baseUrl).searchParams.get('st_salary'),'17500.5');
  assert.ok(await conditions.getAttribute('data-salary-offer'));
  assert.equal(new URL(conditionHref,server.baseUrl).searchParams.get('st_offer'),await conditions.getAttribute('data-salary-offer'));
  await go(conditionHref);
  const returnTracker=await page.locator('[data-salary-journey-back]').getAttribute('href');
  await go(returnTracker);
  await page.waitForFunction(()=>document.querySelector('.dpst-band[aria-pressed=true]'));
  assert.match(await page.locator('.dpst-band[aria-pressed=true]').innerText(),/15k/);
  if(await page.locator('.dpst-options').getAttribute('open')===null) await page.locator('.dpst-options > summary').press('Enter');
  assert.equal(await page.getByRole('checkbox',{name:'Cash only',exact:true}).isChecked(),true);
  assert.ok(await page.locator('.dpst-cards .dpst-card.is-open').count());
  console.log(colorScheme,'Tracker → offer → band-only calculator → exact salary → offer → restored tracker passed');
  for (const search of ['?st_cash=true', '?st_salary=invalid']) {
    await go('/salary-transfer/calculator/' + search);
    await page.waitForFunction(()=>document.querySelector('.dpsc-rows').hidden);
    assert.equal(await page.locator('.dpsc-best').count(),0);
    assert.match(await page.locator('.dpsc-empty').innerText(),/valid exact salary/i);
  }
  await go('/salary-transfer/calculator/?st_unknown=anything');
  await page.waitForFunction(()=>document.querySelector('#dpsc-salary'));
  assert.equal(await page.locator('#dpsc-salary').inputValue(),'20000');
  assert.equal(await page.locator('[data-salary-journey]').isVisible(),false);
  await ctx.close();
 }
 const nojs=await browser.newContext({viewport:{width:320,height:740},javaScriptEnabled:false});
 const p=await nojs.newPage(); await p.goto(server.baseUrl+'/cards/finder/');
 assert.equal(await p.locator('.dp-finder-tile:not([hidden])').count(),6);
 const d=p.locator('.dp-finder-tile:not([hidden]) .dp-finder-card-details').first();
 await d.locator(':scope > summary').press('Enter'); assert.equal(await d.getAttribute('open'),'');
 assert.ok(await p.locator('.dp-finder-tile:not([hidden])').first().getByRole('link',{name:/^Read review/}).isVisible());
 await nojs.close();
 assert.deepEqual(errors,[]);console.log('No-JS shortlist/disclosures and zero page errors passed');
}finally{await browser.close();server.close();}
