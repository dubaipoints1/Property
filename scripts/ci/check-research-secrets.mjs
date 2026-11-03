import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// This targeted recurrence guard complements GitHub secret scanning. It does
// not determine key ownership, validity or restrictions, and never calls an API.
export function inspectText(path, text) {
  const findings = [];
  const safePath = path.replace(/AIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])/g, '[REDACTED_GOOGLE_API_KEY]');
  if (/^candidates\/.*\.(?:html?|json)$/is.test(path)) {
    findings.push({ path: safePath, line: 1, rule: 'raw-research-capture' });
  }
  for (const match of text.matchAll(/AIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])/g)) {
    const line = text.slice(0, match.index).split('\n').length;
    findings.push({ path: safePath, line, rule: 'google-api-key' });
  }
  return findings;
}

export function inspectRepository(root, gitCommand = process.env.DP_GIT || 'git') {
  const paths = execFileSync(gitCommand, ['ls-files', '-z'], {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).split('\0').filter(Boolean);
  const findings = [];
  for (const path of paths) {
    const absolute = resolve(root, path);
    // Enforce capture paths even for symlinks and binary payloads. Do not
    // follow symlinks or enter submodules when examining file contents.
    const bytes = lstatSync(absolute).isFile() ? readFileSync(absolute) : null;
    const text = bytes && !bytes.includes(0) ? bytes.toString('utf8') : '';
    findings.push(...inspectText(path, text));
  }
  return findings;
}

export function formatFindings(findings) {
  // No captured text or matched credential is retained in a finding or log.
  return findings.map(({ path, line, rule }) => {
    const safePath = path.replace(/AIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])/g, '[REDACTED_GOOGLE_API_KEY]');
    return `${JSON.stringify(safePath)}:${line}: ${rule}`;
  }).join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const findings = inspectRepository(process.cwd());
    if (findings.length) {
      console.error(formatFindings(findings));
      console.error('Remove API keys and raw candidate captures before committing. See .council/sops/research-capture-hygiene.md.');
      process.exitCode = 1;
    } else {
      console.log('Research capture and API key guard: passed.');
    }
  } catch {
    console.error('Research capture and API key guard could not inspect every tracked file; check Git and file access.');
    process.exitCode = 1;
  }
}
