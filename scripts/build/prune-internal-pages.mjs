import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const INTERNAL_ROUTE_DIRS = ["dev", "design-spike", "style-guide"];

export async function pruneInternalPages(distDir) {
  const root = path.resolve(distDir);
  for (const route of INTERNAL_ROUTE_DIRS) {
    const target = path.resolve(root, route);
    if (!target.startsWith(`${root}${path.sep}`)) {
      throw new Error(`Refusing to prune outside build output: ${target}`);
    }
    await rm(target, { recursive: true, force: true });
  }
}
const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isMain) {
  const distDir = fileURLToPath(new URL("../../dist/", import.meta.url));
  await pruneInternalPages(distDir);
  console.log(
    `[build] Removed internal routes: ${INTERNAL_ROUTE_DIRS.map((route) => `/${route}/`).join(", ")}`,
  );
}
