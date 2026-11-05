import test from 'node:test';
import assert from 'node:assert/strict';
import { readerFamily, treatment } from '../../scripts/audit/reader-flow-coverage.mjs';

test('all route families have an explicit retained or changed treatment',()=>{
 const cases={
  '/':'homepage','/404.html':'recovery','/search/':'recovery',
  '/guides/uae-credit-card-eligibility-2026/':'editorial-article','/news/cash-or-miles/':'editorial-article','/deals/example/':'editorial-article',
  '/guides/':'editorial-directory','/news/airlines/':'editorial-directory','/deals/':'editorial-directory',
  '/airlines/':'programme-directory','/hotels/':'programme-directory','/airlines/skywards/':'programme-guide','/hotels/accor-all/':'programme-guide',
  '/cards/finder/':'card-decision-tool','/cards/compare/':'card-decision-tool','/cards/compare/a-vs-b/':'card-matchup',
  '/cards/salary/5000/':'card-discovery','/cards/perks/golf/':'card-discovery','/cards/miles/':'card-discovery','/cards/':'card-discovery','/cards/citi-cashback/':'card-review',
  '/banks/':'bank-directory','/banks/fab/':'bank-hub',
  '/salary-transfer/history/fab/':'salary-history','/salary-transfer/calculator/':'salary-calculator','/salary-transfer/':'salary-tracker','/salary-transfer/aed-5000-to-8000/':'salary-tracker','/salary-transfer/fab/':'salary-offer',
  '/calculator/':'reference-tool','/calculator/interest/':'reference-tool','/transfer-finder/':'reference-tool','/valuations/methodology/':'reference-tool',
  '/topics/':'topic-directory','/best-of/':'topic-directory','/about/':'trust-reference','/editorial-policy/how-we-score/':'trust-reference',
 };
 for(const [route,family] of Object.entries(cases)){assert.equal(readerFamily(route),family,route);assert.ok(treatment[family]);}
 assert.deepEqual([...new Set(Object.values(cases))].sort(),Object.keys(treatment).sort());
});
test('an unknown route fails rather than silently claiming site-wide coverage',()=>{
 assert.throws(()=>readerFamily('/new-unknown-section/'),/Unassigned/);
});
