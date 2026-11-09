// Source recurrence guard. The built-browser check separately opens,
// closes, restores and resizes actual tracker rows in both themes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("src/components/islands/SalaryTransferTracker.tsx", "utf8");

test("closed tracker details do not ship duplicate full content in both responsive views", () => {
  assert.equal((source.match(/\{isOpen && <Detail o=\{o\} \/>\}/g) ?? []).length, 2);
  assert.equal((source.match(/<Detail o=\{o\} \/>/g) ?? []).length, 2);
});

test("closed controlled containers and accessible disclosure IDs remain stable", () => {
  for (const view of ["desktop", "mobile"]) {
    assert.ok(source.includes(`aria-controls={\`dpst-${view}-\${o.id}\`}`));
    assert.ok(source.includes(`id={\`dpst-${view}-\${o.id}\`} hidden={!isOpen}`));
  }
  assert.equal((source.match(/aria-expanded=\{isOpen\}/g) ?? []).length, 2);
  assert.match(source, /if \(state\.offer && offers\.some\(offer => offer\.id === state\.offer\)\) setOpen/);
  assert.match(source, /salaryJourneyHref\(`\/salary-transfer\/\$\{offer\.bankSlug\}\/`/,
    "individual offer-detail links must remain present in server-rendered rows");
});
