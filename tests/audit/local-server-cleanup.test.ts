import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { startStaticServer } from "../../scripts/audit/_lib.mjs";

test("the audit-owned server answers readiness and closes idempotently with bounded teardown", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "dp-audit-server-"));
  let server;
  try {
    await writeFile(path.join(directory, "index.html"), "<!doctype html><title>Audit fixture</title>");
    server = await startStaticServer({ distDir: directory });
    const response = await fetch(server.baseUrl);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Audit fixture/);
    server.close();
    server.close();
    await new Promise((resolve) => setTimeout(resolve, 1800));
    await assert.rejects(fetch(server.baseUrl, { signal: AbortSignal.timeout(2000) }));
  } finally {
    server?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
