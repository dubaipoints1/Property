import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildReadinessReport, loadReadinessSources, main, renderReadinessMarkdown } from '../../scripts/analytics/readiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sources = () => loadReadinessSources(ROOT);
const item = (report: ReturnType<typeof buildReadinessReport>, id: string) => report.sourceChecks.find((entry: { id: string }) => entry.id === id)!;
function output() { const lines: string[] = []; return { lines, write: (value: string) => { lines.push(value); return true; } }; }

test('current real source recognises existing wiring without certifying live collection or clean audience data', () => {
  const report = buildReadinessReport(sources());
  assert.equal(report.mode, 'offline-source-readiness');
  assert.equal(report.state, 'measurement-source-present-external-evidence-unresolved');
  assert.equal(report.audienceReportRetrieved, false);
  assert.equal(report.liveDeliveryVerified, false);
  assert.equal(report.accountSettingsInspected, false);
  assert.equal(report.trackingSettingsChanged, false);
  assert.equal(report.botFreeMonthlyPeopleCountSupported, false);
  for (const id of ['shared-ga4-bootstrap', 'production-main-gate', 'standard-owner-config', 'cloudflare-env-gate']) assert.equal(item(report, id).status, 'recognised');
});

test('actual financial URL writers remain an explicit plausible risk; the proposal is not live protection', () => {
  const report = buildReadinessReport(sources());
  const risk = item(report, 'financial-query-risk');
  assert.equal(risk.status, 'plausible-source-risk');
  assert.deepEqual(risk.queryKeyNames, ['salary', 'cv_spend', 'st_salary']);
  assert.equal(risk.historyUpdatesObservedInSource, true);
  assert.equal(item(report, 'review-planner').status, 'proposal-not-live-wiring');
  assert.match(report.externalEvidence.find((entry: { id: string }) => entry.id === 'financial-query-and-history')!.nextAction, /independent Enhanced Measurement history events/);
});

test('unknown source is a review hold rather than a fictional privacy or tagging pass', () => {
  const report = buildReadinessReport({});
  assert.equal(report.state, 'source-wiring-needs-review');
  assert.equal(item(report, 'financial-query-risk').status, 'not-established-by-this-check');
  assert.match(item(report, 'financial-query-risk').detail, /No affirmative privacy clearance/);
  assert.equal(item(report, 'review-planner').status, 'manual-review-required');
  assert.equal(report.botFreeMonthlyPeopleCountSupported, false);
});

test('mutated production, preview, environment and standard-tag patterns fail recognition', () => {
  for (const [field, oldValue, newValue, id] of [
    ['gate', 'branch === "main"', 'branch !== "preview"', 'production-main-gate'],
    ['layout', 'pages: process.env.CF_PAGES', 'pages: "1"', 'production-main-gate'],
    ['layout', 'import.meta.env.PUBLIC_CF_BEACON_TOKEN as string', 'HARDCODED_BEACON as string', 'cloudflare-env-gate'],
    ['layout', 'set:html={googleTagBootstrapSource}', 'set:html={otherBootstrap}', 'shared-ga4-bootstrap'],
    ['bootstrap', 'window.gtag("config", id)', 'window.gtag("config", id, customOptions)', 'standard-owner-config'],
  ]) {
    const current = sources();
    assert.ok(current[field].includes(oldValue), 'mutation must hit actual source');
    current[field] = current[field].replace(oldValue, newValue);
    assert.equal(item(buildReadinessReport(current), id).status, 'unrecognised');
  }
});

test('source values, arbitrary identifiers and injected report-like inputs are never echoed or accepted as account proof', () => {
  const input = { ...sources(), privateReport: 'private@example.test salary=987654 token=do-not-print users=123456789' };
  input.layout += '\n<!-- private@example.test 987654 do-not-print -->';
  input.bootstrap += '\n// 123456789';
  const before = JSON.stringify(input);
  const report = buildReadinessReport(input);
  const serialised = JSON.stringify(report) + renderReadinessMarkdown(report);
  assert.doesNotMatch(serialised, /private@example|987654|do-not-print|123456789|G-VS2RL6KX46/);
  assert.equal(JSON.stringify(input), before, 'diagnostic must not mutate sources');
  assert.ok(report.externalEvidence.every((entry: { status: string }) => entry.status !== 'verified'));
});

test('account gaps, bot limits and metric distinctions remain visible in both output modes', () => {
  const report = buildReadinessReport(sources());
  const text = renderReadinessMarkdown(report);
  assert.match(text, /Google excludes known bots automatically/);
  assert.match(text, /Unknown automation/);
  assert.match(text, /Missing access is not zero organic traffic/);
  assert.match(text, /Total users and Active users are different/);
  assert.match(text, /Do not extrapolate a partial installation month/);
  assert.match(text, /Tracking settings are unchanged/);
  assert.match(text, /owner-and-browser-qa-exclusion: not-verified/);
  assert.match(text, /cloudflare-bot-filter-and-period: not-rechecked/);
});

test('CLI only reads its fixed repository sources and prints a diagnostic; no unsupported input is reflected', () => {
  const out = output(), err = output();
  assert.equal(main(['--json'], { root: ROOT, out, err }), 0);
  const report = JSON.parse(out.lines.join(''));
  assert.equal(report.mode, 'offline-source-readiness');
  assert.equal(err.lines.length, 0);
  const rejectedOut = output(), rejectedErr = output();
  assert.equal(main(['--token=do-not-print'], { root: ROOT, out: rejectedOut, err: rejectedErr }), 2);
  assert.equal(rejectedOut.lines.length, 0);
  assert.doesNotMatch(rejectedErr.lines.join(''), /do-not-print/);
  const missingOut = output(), missingErr = output();
  assert.equal(main([], { root: '/private/tmp/nonexistent-measurement-root', out: missingOut, err: missingErr }), 1);
  assert.equal(missingOut.lines.length, 0);
  assert.doesNotMatch(missingErr.lines.join(''), /nonexistent-measurement-root/);
});

test('implementation contains no execution, network, account, environment or write mechanism', () => {
  const source = readFileSync(new URL('../../scripts/analytics/readiness.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:fetch|sendBeacon|XMLHttpRequest|exec|execFile|spawn|eval|writeFileSync|appendFileSync|createWriteStream)\s*\(/);
  assert.doesNotMatch(source, /process\.env\[|process\.env\.\w+(?![\w\\])/); // Patterns are escaped regex source, not environment reads.
  assert.doesNotMatch(source, /node:(?:https?|child_process)|localStorage|sessionStorage|document\.cookie/);
});
