import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function mdxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? mdxFiles(join(dir, entry.name)) : entry.name.endsWith(".mdx") ? [join(dir, entry.name)] : []);
}

/** MDX syntax compilation alone accepts an unbound component. The resulting
 * article then fails at render time. Keep explicitly authored components bound
 * rather than assuming that a successful content/schema check proves rendering. */
test("every authored MDX component has an explicit local/import binding", () => {
  const failures: string[] = [];
  for (const file of mdxFiles("src/content")) {
    const source = readFileSync(file, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
      .replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, "").replace(/`[^`\n]*`/g, "");
    const bindings = new Set<string>(["Fragment"]);
    for (const m of source.matchAll(/^import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/gm)) bindings.add(m[1]);
    for (const m of source.matchAll(/^import\s+\*\s+as\s+(\w+)\s+from/gm)) bindings.add(m[1]);
    for (const m of source.matchAll(/^import\s*(?:[\w$]+\s*,\s*)?\{([^}]+)\}\s*from/gm)) {
      for (const name of m[1].split(",")) bindings.add(name.trim().split(/\s+as\s+/).at(-1)!);
    }
    for (const m of source.matchAll(/^(?:export\s+)?(?:const|function|class)\s+(\w+)/gm)) bindings.add(m[1]);
    const missing = [...new Set([...source.matchAll(/<([A-Z][\w$]*)\b/g)].map(m => m[1]))].filter(name => !bindings.has(name));
    if (missing.length) failures.push(`${file}: ${missing.join(", ")}`);
  }
  assert.deepEqual(failures, [], failures.join("\n"));
});
