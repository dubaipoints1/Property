import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  INTERNAL_ROUTE_DIRS,
  pruneInternalPages,
} from "../../scripts/build/prune-internal-pages.mjs";

test("production pruning removes internal routes and preserves public pages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dubaipoints-dist-"));
  try {
    await mkdir(path.join(root, "cards"), { recursive: true });
    await writeFile(path.join(root, "cards", "index.html"), "public");

    for (const route of INTERNAL_ROUTE_DIRS) {
      await mkdir(path.join(root, route), { recursive: true });
      await writeFile(path.join(root, route, "index.html"), "internal");
    }

    await pruneInternalPages(root);

    assert.equal(await readFile(path.join(root, "cards", "index.html"), "utf8"), "public");
    for (const route of INTERNAL_ROUTE_DIRS) {
      await assert.rejects(readFile(path.join(root, route, "index.html"), "utf8"));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
