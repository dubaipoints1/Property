import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name: string) => readFileSync(new URL(`../../.github/workflows/${name}`, import.meta.url), "utf8");
const scrape = read("scrape.yml");
const triggers = scrape.match(/^on:\n([\s\S]*?)^jobs:/m)![1];

test("scrape no longer runs from any push or pull-request event", () => {
  assert.doesNotMatch(triggers, /^\s+(?:push|pull_request|pull_request_target):/m);
  assert.deepEqual([...triggers.matchAll(/^  ([a-z_]+):/gm)].map(match => match[1]), ["schedule", "workflow_dispatch"]);
});

test("existing quarterly backstop, manual bank override and scrape job remain intact", () => {
  assert.match(triggers, /cron: "0 23 1 1,4,7,10 \*"/);
  assert.match(triggers, /workflow_dispatch:[\s\S]*?inputs:[\s\S]*?bank:[\s\S]*?required: false\n\s+default: "all"\n\s+type: string/);
  assert.match(scrape, /ref: main/);
  assert.match(scrape, /INPUT="\$\{\{ github\.event\.inputs\.bank \}\}"/);
  assert.match(scrape, /for BANK in \$BANKS; do/);
  assert.match(scrape, /FIRECRAWL_API_KEY: \$\{\{ secrets\.FIRECRAWL_API_KEY \}\}/);
});

test("monitor still dispatches the existing targeted scrape bank input", () => {
  const monitor = read("monitor.yml");
  assert.match(monitor, /name: Dispatch targeted scrape for changed banks/);
  assert.match(monitor, /if: steps\.poll\.outputs\.banks != ''/);
  assert.match(monitor, /gh workflow run scrape\.yml -f bank="\$BANKS"/);
});
