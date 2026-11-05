// Completeness guard for the reader-flow pass. It records template coverage;
// it does not pretend that sharing CSS is a visual or usability test.
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { routeFromHtmlPath } from './_lib.mjs';

export function readerFamily(route) {
  if (route === '/') return 'homepage';
  if (route === '/404.html' || route === '/search/') return 'recovery';
  if (/^\/(?:guides|news|deals)\/(?!$)/.test(route) && !/^\/news\/(?:airlines|banking|hotels)\/$/.test(route)) return 'editorial-article';
  if (/^\/(?:guides|news|deals)\/$/.test(route) || /^\/news\/(?:airlines|banking|hotels)\/$/.test(route)) return 'editorial-directory';
  if (/^\/(?:airlines|hotels)\/$/.test(route)) return 'programme-directory';
  if (/^\/(?:airlines|hotels)\/[^/]+\/$/.test(route)) return 'programme-guide';
  if (route === '/cards/finder/' || route === '/cards/compare/') return 'card-decision-tool';
  if (/^\/cards\/compare\/[^/]+\/$/.test(route)) return 'card-matchup';
  if (/^\/cards\/(?:salary|perks)\//.test(route) || /^\/cards\/(?:cashback|miles|islamic|fees)\/$/.test(route) || route === '/cards/') return 'card-discovery';
  if (/^\/cards\/[^/]+\/$/.test(route)) return 'card-review';
  if (route === '/banks/') return 'bank-directory';
  if (/^\/banks\/[^/]+\/$/.test(route)) return 'bank-hub';
  if (/^\/salary-transfer\/history\/[^/]+\/$/.test(route)) return 'salary-history';
  if (route === '/salary-transfer/calculator/') return 'salary-calculator';
  if (route === '/salary-transfer/' || /^\/salary-transfer\/aed-[^/]+\/$/.test(route)) return 'salary-tracker';
  if (/^\/salary-transfer\/[^/]+\/$/.test(route)) return 'salary-offer';
  if (/^\/calculator(?:\/|$)/.test(route) || route === '/transfer-finder/' || /^\/valuations\//.test(route)) return 'reference-tool';
  if (route === '/topics/' || route === '/best-of/') return 'topic-directory';
  if (/^\/(?:about|corrections|editorial-policy|glossary|how-we-make-money|partnership|press|team|tip)\//.test(route)) return 'trust-reference';
  throw new Error(`Unassigned route: ${route}`);
}

export const treatment = {
  homepage: 'Preserved hero, reel and content composition; shared tool-navigation grouping only. Separate reel/browser regression.',
  recovery: 'Paper canvas, retained search/404 recovery and keyboard links; no unrelated recommendation module.',
  'editorial-article': 'Open reading layout and metadata-related next actions; full sources and disclosures retained.',
  'editorial-directory': 'Lighter preview/rail frames; Deals feature explicitly ending-first and no repeated lead in urgency rail.',
  'programme-directory': 'Retained licensed feature/rail and destinations; inherits open discovery canvas.',
  'programme-guide': 'Single contents control, contextual reference facts and true ending; existing anchors preserved.',
  'card-decision-tool': 'Compact Finder summary and bounded spending/shortlist handoff to reviews and Compare.',
  'card-matchup': 'Retained aligned financial comparison; inherits open canvas. No verdict or formula change.',
  'card-discovery': 'Retained computed shortlists, fee tables and eligibility; shared rhythm without concealing qualifying terms.',
  'card-review': 'Explicit same-profile handoff between Finder, review and comparison; all financial evidence retained.',
  'bank-directory': 'Open preview/rail treatment and retained bank/salary task routes.',
  'bank-hub': 'Cards first, then offer/rewards/reference, with related reading and contacts at the end.',
  'salary-history': 'Retained archive chronology and expired labels; shared reference rhythm, no live-offer implication.',
  'salary-calculator': 'Validated salary context and return to the same offer shortlist; calculations unchanged.',
  'salary-tracker': 'Validated band/filter/offer URL context and connected detail/calculator destinations.',
  'salary-offer': 'Context-preserving calculator and return links; issuer terms and timelines retained.',
  'reference-tool': 'Open tool/reference rhythm; existing inputs, methodologies and native tables retained.',
  'topic-directory': 'Lighter directory separators and retained honest destinations.',
  'trust-reference': 'Shared open reading rhythm; legal/disclosure copy, related routes and contact details retained.',
};

function nodes(html) {
  const out=[];
  const walk=n=>{out.push(n);for(const c of n.childNodes??[])walk(c);};
  walk(parse(html)); return out;
}
const attrs=n=>Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));
const textOf=n=>(n.childNodes??[]).map(x=>x.value??textOf(x)).join('');

export async function auditCoverage(dist, baseline) {
  const files=(await readdir(dist,{recursive:true,withFileTypes:true})).filter(x=>x.isFile()&&x.name.endsWith('.html')).map(x=>path.relative(dist,path.join(x.parentPath,x.name))).sort();
  const previous=(await readdir(baseline,{recursive:true,withFileTypes:true})).filter(x=>x.isFile()&&x.name.endsWith('.html')).map(x=>path.relative(baseline,path.join(x.parentPath,x.name))).sort();
  assert.deepEqual(files,previous,'The flow pass must not silently lose, add or rename routes');
  const rows=[];
  for(const file of files){
    const [html,before]=await Promise.all([readFile(path.join(dist,file),'utf8'),readFile(path.join(baseline,file),'utf8')]);
    const route=routeFromHtmlPath(file), family=readerFamily(route), current=nodes(html), old=nodes(before);
    const title=textOf(current.find(n=>n.tagName==='title'));
    const issues=[];
    if(current.filter(n=>n.tagName==='h1').length!==1)issues.push('Expected exactly one H1');
    const headSignals=list=>list.filter(n=>n.tagName==='title'||(n.tagName==='meta'&&['description','robots'].includes(attrs(n).name))||(n.tagName==='link'&&attrs(n).rel==='canonical')||(n.tagName==='script'&&attrs(n).type==='application/ld+json')).map(n=>[n.tagName,attrs(n),textOf(n)]);
    if(JSON.stringify(headSignals(current))!==JSON.stringify(headSignals(old)))issues.push('Metadata or structured data changed');
    const currentIds=new Set(current.map(n=>attrs(n).id).filter(Boolean));
    const priorHeadingIds=old.filter(n=>/^h[1-6]$/.test(n.tagName??'')).map(n=>attrs(n).id).filter(Boolean);
    for(const id of priorHeadingIds)if(!currentIds.has(id))issues.push(`Missing prior heading anchor: ${id}`);
    const links=current.filter(n=>n.tagName==='link'&&attrs(n).rel==='stylesheet').map(n=>attrs(n).href);
    if((family!=='homepage')!==links.some(h=>h?.includes('reader-flow.')))issues.push('Incorrect flow stylesheet scope');
    rows.push({route,family,title,treatment:treatment[family],issues});
  }
  return rows;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const dist=path.resolve(process.argv[2]??'dist'), baseline=path.resolve(process.argv[3]??'../reader-flow-before-dist'), out=path.resolve(process.argv[4]??'audit-output/reader-flow');
  const rows=await auditCoverage(dist,baseline);
  await mkdir(out,{recursive:true});
  const groups=Map.groupBy(rows,r=>r.family);
  const md=['# Reader-flow route coverage','',`Candidate only. ${rows.length} HTML routes; ${groups.size} page families. This records inherited implementation and static invariants, not a rendered QA pass. Separate resize, keyboard, accessibility and journey evidence is required.`,'',...Array.from(groups,([family,members])=>[`## ${family} (${members.length})`,'',treatment[family],'','| Route | Static invariants |','|---|---|',...members.map(r=>`| \`${r.route}\` | ${r.issues.length?r.issues.join('; '):'Pass'} |`),'']).flat()];
  await writeFile(path.join(out,'coverage.md'),md.join('\n'));
  await writeFile(path.join(out,'coverage.json'),JSON.stringify(rows,null,2)+'\n');
  console.log(JSON.stringify({routes:rows.length,families:groups.size,issues:rows.filter(r=>r.issues.length)}));
  if(rows.some(r=>r.issues.length))process.exitCode=1;
}
