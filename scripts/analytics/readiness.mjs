// Offline source-readiness report only. Does not read credentials, accounts,
// visitor exports or environment values; does not request, write or configure.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOURCE_FILES = Object.freeze({
  layout: 'src/layouts/BaseLayout.astro',
  gate: 'src/lib/googleTag.mjs',
  bootstrap: 'src/lib/deferredGoogleTag.mjs',
  journey: 'src/lib/readerJourneyState.ts',
  tracker: 'src/components/islands/SalaryTransferTracker.tsx',
  calculator: 'src/components/islands/SalaryTransferCalculator.tsx',
  planner: 'src/lib/analyticsReview.ts',
});

const REFERENCES = Object.freeze({
  users: 'https://support.google.com/analytics/answer/12253918?hl=en',
  bots: 'https://support.google.com/analytics/answer/9888366?hl=en',
  pageviews: 'https://developers.google.com/analytics/devguides/collection/ga4/views',
  search: 'https://support.google.com/webmasters/answer/7576553?hl=en',
});

/** Fixed source files only; never follows a file outside the selected repo. */
export function loadReadinessSources(root) {
  let canonicalRoot;
  try { canonicalRoot = realpathSync(root); } catch { throw new Error('Repository source root unavailable'); }
  return Object.fromEntries(Object.entries(SOURCE_FILES).map(([key, relative]) => {
    try {
      const file = realpathSync(path.resolve(canonicalRoot, relative));
      if (!file.startsWith(canonicalRoot + path.sep)) throw new Error();
      const stat = statSync(file);
      if (!stat.isFile() || stat.size > 512_000) throw new Error();
      return [key, readFileSync(file, 'utf8')];
    } catch {
      // Do not echo arbitrary file paths, file contents or underlying errors.
      throw new Error('Expected measurement source missing, unreadable or outside repository');
    }
  }));
}

/**
 * Recognises the current house wiring, not arbitrary JavaScript semantics.
 * An unrecognised pattern is a review hold, never evidence of safe collection.
 * No source excerpts, query values, account IDs or visitor totals are returned.
 */
export function buildReadinessReport(sources = {}) {
  const text = key => typeof sources?.[key] === 'string' ? sources[key] : '';
  const layout = text('layout'), bootstrap = text('bootstrap'), journey = text('journey');
  const ga4Layout = /import\s*\{\s*googleTagBootstrapSource\s*\}\s*from\s*["']~\/lib\/deferredGoogleTag\.mjs["']/.test(layout)
    && /\{googleTagEnabled\s*&&\s*\([\s\S]*?<script\s+is:inline\s+set:html=\{googleTagBootstrapSource\}/.test(layout);
  const ga4Gate = /return\s+production\s*===\s*true\s*&&\s*pages\s*===\s*["']1["']\s*&&\s*branch\s*===\s*["']main["']\s*;/.test(text('gate'))
    && /const\s+googleTagEnabled\s*=\s*shouldLoadGoogleTag\s*\(\s*\{\s*production:\s*import\.meta\.env\.PROD\s*,\s*pages:\s*process\.env\.CF_PAGES\s*,\s*branch:\s*process\.env\.CF_PAGES_BRANCH\s*\}\s*\)/.test(layout);
  const standardConfig = /window\.gtag\s*\(\s*["']config["']\s*,\s*id\s*\)/.test(bootstrap);
  const cfGate = /const\s+cfBeaconToken\s*=\s*import\.meta\.env\.PUBLIC_CF_BEACON_TOKEN/.test(layout)
    && /import\.meta\.env\.PROD\s*&&\s*cfBeaconToken\s*&&\s*\([\s\S]*?src=["']https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js["']/.test(layout);
  const financialKeys = ['salary', 'cv_spend', 'st_salary'].filter(key =>
    new RegExp(`out\\.set\\(\\s*["']${key}["']\\s*,`).test(journey));
  const historyUpdates = [text('tracker'), text('calculator')].some(source => /history\.(?:replaceState|pushState)\s*\(/.test(source));
  const planner = /buildAnalyticsReviewPlan/.test(text('planner'));
  // The static proposal does not control the live standard bootstrap.
  const livePlannerWiring = /analyticsReview|buildAnalyticsReviewPlan|sanitiseAnalyticsReviewPage/.test(layout + bootstrap);
  const plausibleQueryRisk = ga4Layout && standardConfig && financialKeys.length > 0;
  const recognised = ga4Layout && ga4Gate && standardConfig && cfGate;

  return {
    schemaVersion: 1,
    mode: 'offline-source-readiness',
    state: recognised ? 'measurement-source-present-external-evidence-unresolved' : 'source-wiring-needs-review',
    audienceReportRetrieved: false,
    liveDeliveryVerified: false,
    accountSettingsInspected: false,
    trackingSettingsChanged: false,
    botFreeMonthlyPeopleCountSupported: false,
    sourceChecks: [
      { id: 'shared-ga4-bootstrap', status: ga4Layout ? 'recognised' : 'unrecognised', detail: 'Source wiring only; not a fresh delivery or reporting test.' },
      { id: 'production-main-gate', status: ga4Gate ? 'recognised' : 'unrecognised', detail: 'Recognises the existing production/main source predicate; no preview or account is contacted.' },
      { id: 'standard-owner-config', status: standardConfig ? 'recognised' : 'unrecognised', detail: 'Existing standard Google configuration; no new event, consent controller or minimisation is installed.' },
      { id: 'cloudflare-env-gate', status: cfGate ? 'recognised' : 'unrecognised', detail: 'Production/environment source gate recognised; environment value and hosting-side injection are not inspected.' },
      { id: 'financial-query-risk', status: plausibleQueryRisk ? 'plausible-source-risk' : 'not-established-by-this-check',
        detail: plausibleQueryRisk
          ? 'Financial-input query keys coexist with the standard tag. Google page location normally includes the query; actual visitor transmission was not captured.'
          : 'No affirmative privacy clearance: changed or unrecognised source needs manual review.',
        queryKeyNames: financialKeys, historyUpdatesObservedInSource: historyUpdates },
      { id: 'review-planner', status: planner && !livePlannerWiring ? 'proposal-not-live-wiring' : 'manual-review-required',
        detail: 'A separate proposal or sanitiser test must not be represented as controlling automatic tag or history events.' },
    ],
    externalEvidence: [
      { id: 'ga4-report-and-window', status: 'not-retrieved', nextAction: 'Read the existing property with one explicit period, timezone, hostname scope and Total users metric; do not sum daily or page user rows.' },
      { id: 'known-bots', status: 'documented-service-limit-not-all-bots', nextAction: 'Google excludes known bots automatically. Unknown automation and human deduplication are not certified.' },
      { id: 'owner-and-browser-qa-exclusion', status: 'not-verified', nextAction: 'Keep internal/developer/QA exclusion unverified unless actual report/filter evidence is obtained; no setting is changed by this report.' },
      { id: 'cloudflare-bot-filter-and-period', status: 'not-rechecked', nextAction: 'For each dashboard read explicitly retain Exclude bots = Yes and the same complete period/scope; visits and views are not people.' },
      { id: 'search-console-property', status: 'not-retrieved', nextAction: 'Property access and query/click/impression reports are not established by source inspection. Missing access is not zero organic traffic; no account or ownership change is attempted.' },
      { id: 'financial-query-and-history', status: 'not-network-tested', nextAction: 'Retain the source risk. A future approved fictional-value test and complete configuration review must cover independent Enhanced Measurement history events; settings remain unchanged.' },
    ],
    metricRules: [
      'GA4 Total users and Active users are different metrics; a user estimate is not an exact count of natural persons.',
      'Cloudflare visits and page views must retain their own labels, scope and bot-filter limits.',
      'Do not extrapolate a partial installation month, reconstruct pre-tag days or label a rolling period a calendar month.',
      'Search clicks, navigation, applications, approvals, commission and received income are different outcomes.',
    ],
    references: REFERENCES,
    limits: 'Offline pattern recognition only: no source execution, network, environment/credential read, visitor input, report export, account access, write, settings change or production certification.',
  };
}

export function renderReadinessMarkdown(report) {
  return [
    '# Measurement readiness — offline source check',
    '',
    `State: ${report.state}. No fresh account or visitor report was retrieved.`,
    'Tracking settings are unchanged. This report does not support an exact bot-free monthly people count.',
    '',
    '## Recognised source patterns and risks',
    ...report.sourceChecks.map(item => `- ${item.id}: ${item.status}. ${item.detail}`),
    '',
    '## Evidence still required',
    ...report.externalEvidence.map(item => `- ${item.id}: ${item.status}. ${item.nextAction}`),
    '',
    '## Metric discipline',
    ...report.metricRules.map(item => `- ${item}`),
    '',
    report.limits,
    '',
  ].join('\n');
}

export function main(args = process.argv.slice(2), { root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), out = process.stdout, err = process.stderr } = {}) {
  if (args.length > 1 || args.some(arg => arg !== '--json')) {
    err.write('Usage: node scripts/analytics/readiness.mjs [--json]\n');
    return 2;
  }
  try {
    const report = buildReadinessReport(loadReadinessSources(root));
    out.write(args.includes('--json') ? JSON.stringify(report, null, 2) + '\n' : renderReadinessMarkdown(report));
    // Unresolved external evidence is reported, not a failing CI claim or waiver.
    return 0;
  } catch {
    err.write('Measurement readiness source check could not complete; no account or source change was made.\n');
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main();
