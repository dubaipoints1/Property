#!/usr/bin/env node
// PostToolUse: after any Edit/Write to src/data/cards.json, load it through
// the real Zod schema in src/lib/cardsData.ts. The module already fails fast
// on schema drift at build time; this surfaces the same failure at the edit.
// Exit 2 feeds stderr back to Claude so it fixes the file before moving on.
import { spawnSync } from "node:child_process";
import path from "node:path";

const input = JSON.parse(await new Response(process.stdin).text() || "{}");
const file = input?.tool_input?.file_path ?? "";
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
if (path.resolve(root, file) !== path.resolve(root, "src/data/cards.json")) process.exit(0);

const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "-e", "await import('./src/lib/cardsData.ts')"],
  { cwd: root, encoding: "utf8", timeout: 60_000 },
);
if (r.status === 0) process.exit(0);
process.stderr.write(
  "src/data/cards.json no longer passes the schema in src/lib/cardsData.ts — " +
  "the build will fail. Fix the entry before continuing.\n\n" +
  zodIssues(r.stderr || r.stdout || "") + "\n",
);
process.exit(2);

// Pull the ZodError issue list out of the stack trace; fall back to the raw tail.
function zodIssues(out) {
  const i = out.indexOf("ZodError: ");
  if (i === -1) return out.split("\n").slice(-40).join("\n");
  const body = out.slice(i + "ZodError: ".length);
  const end = body.indexOf("\n]");
  try {
    const issues = JSON.parse(body.slice(0, end + 2));
    return issues.slice(0, 20).map((x) => `- ${x.path.join(".")}: ${x.message}`).join("\n");
  } catch {
    return body.split("\n").slice(0, 40).join("\n");
  }
}
