import { test } from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbGraph,
  breadcrumbList,
  collectionPageGraph,
  siteUrlFrom,
} from "../../src/lib/schema";

const SITE = "https://dubaipoints.ae";

test("siteUrlFrom strips the trailing slash and falls back to production", () => {
  assert.equal(siteUrlFrom(new URL("https://example.test/")), "https://example.test");
  assert.equal(siteUrlFrom(undefined), SITE);
});

test("breadcrumbList prepends Home and numbers positions from 1", () => {
  const list = breadcrumbList(SITE, [
    { name: "Salary-transfer tracker", path: "/salary-transfer/" },
    { name: "RAKBANK", path: "/salary-transfer/rakbank/" },
  ]);
  assert.equal(list["@type"], "BreadcrumbList");
  assert.deepEqual(
    list.itemListElement.map((i) => [i.position, i.name, i.item]),
    [
      [1, "Home", `${SITE}/`],
      [2, "Salary-transfer tracker", `${SITE}/salary-transfer/`],
      [3, "RAKBANK", `${SITE}/salary-transfer/rakbank/`],
    ],
  );
});

test("collectionPageGraph emits CollectionPage tied to the site's WebSite node", () => {
  const g = collectionPageGraph({
    siteUrl: SITE,
    path: "/deals/",
    name: "UAE bank & card deals",
    description: "Dated, sourced deals.",
    crumbs: [{ name: "Deals", path: "/deals/" }],
  });
  assert.equal(g["@context"], "https://schema.org");
  const [page, crumbs] = g["@graph"] as Array<Record<string, unknown>>;
  assert.equal(page["@type"], "CollectionPage");
  assert.equal(page["@id"], `${SITE}/deals/#collection`);
  assert.equal(page.url, `${SITE}/deals/`);
  assert.deepEqual(page.isPartOf, { "@id": `${SITE}/#website` });
  assert.equal(crumbs["@type"], "BreadcrumbList");
});

test("breadcrumbGraph wraps a single BreadcrumbList", () => {
  const g = breadcrumbGraph(SITE, [{ name: "Guides", path: "/guides/" }]);
  assert.equal(g["@graph"].length, 1);
  assert.equal(g["@graph"][0]["@type"], "BreadcrumbList");
});
