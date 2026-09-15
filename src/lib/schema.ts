// Structured-data helpers for the templates that carried only the default
// WebSite + Organization graph until 15 September 2026 (audit F-035, the
// "no ruling needed" half of Chairman ruling R6: CollectionPage +
// BreadcrumbList on the directories, BreadcrumbList on the tracker
// family). The reconciled §9 spec is drafted separately; nothing here
// pre-empts it — these are the entities both candidate specs already agree
// on. Per Charter §6 no figure is emitted here: names, URLs and
// descriptions only.

export type Crumb = { name: string; path: string };

/** Site origin without a trailing slash, from Astro.site with the
 * production fallback BaseLayout already uses. */
export function siteUrlFrom(site: URL | undefined): string {
  return site?.toString().replace(/\/$/, "") ?? "https://dubaipoints.ae";
}

function abs(siteUrl: string, path: string): string {
  return path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** BreadcrumbList for a page; `crumbs` runs from the site root down to
 * the page itself, "Home" is prepended automatically. */
export function breadcrumbList(siteUrl: string, crumbs: Crumb[]) {
  const trail: Crumb[] = [{ name: "Home", path: "/" }, ...crumbs];
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(siteUrl, c.path),
    })),
  };
}

/** Graph for a directory / index route: CollectionPage + BreadcrumbList. */
export function collectionPageGraph(opts: {
  siteUrl: string;
  path: string;
  name: string;
  description: string;
  crumbs: Crumb[];
}) {
  const url = abs(opts.siteUrl, opts.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: opts.name,
        description: opts.description,
        inLanguage: "en-AE",
        isPartOf: { "@id": `${opts.siteUrl}/#website` },
      },
      breadcrumbList(opts.siteUrl, opts.crumbs),
    ],
  };
}

/** Graph for a page that needs only a breadcrumb trail (tracker family). */
export function breadcrumbGraph(siteUrl: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumbList(siteUrl, crumbs)],
  };
}
