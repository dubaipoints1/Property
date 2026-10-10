#!/usr/bin/env node
// PreToolUse: refuse Edit/Write on files CLAUDE.md says must not change by hand.
//  - data/monitor/monitors.json, data/news-monitor/state.json: frozen migration
//    seeds on main; the live copies are on the automation-state branch.
//  - package-lock.json: regenerate with npm, never hand-edit.
// Exit 2 blocks the call and tells Claude why.
import path from "node:path";

const FROZEN = {
  "data/monitor/monitors.json":
    "frozen migration seed — current values live on the automation-state branch (CLAUDE.md, 'The automation-state branch').",
  "data/news-monitor/state.json":
    "frozen migration seed — current values live on the automation-state branch (CLAUDE.md, 'The automation-state branch').",
  "package-lock.json": "generated file — change it with npm install, never by hand.",
};

const input = JSON.parse(await new Response(process.stdin).text() || "{}");
const file = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? "";
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join("/");
if (FROZEN[rel]) {
  process.stderr.write(`Blocked: ${rel} is a ${FROZEN[rel]}\n`);
  process.exit(2);
}
process.exit(0);
