import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pending/stale verification text uses the readable trust-ink token, not decorative gold', () => {
  const source = readFileSync('src/components/cards/VerifiedStamp.astro', 'utf8');
  const rule = source.match(/\.dp-card-verified\.is-stale \.lbl\s*\{([^}]+)\}/)?.[1];
  assert.ok(rule);
  assert.match(rule, /color:\s*var\(--gold-ink\)/);
  assert.doesNotMatch(rule, /var\(--gold\)/);
  assert.match(source, /Source record \{fmt\(verifiedAt\)\} — terms pending/);
  assert.match(source, /Last verified \{fmt\(verifiedAt\)\} — pending re-audit/);
  assert.match(source, /\.dp-card-verified\.is-stale \.dot\s*\{\s*background:\s*var\(--gold\)/);
});
