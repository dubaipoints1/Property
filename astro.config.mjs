import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  site: "https://dubaipoints.ae",
  output: "static",
  // Astro 7 defaults to JSX whitespace compression. Preserve the existing
  // HTML-aware behaviour during the major upgrade so inline copy does not
  // silently lose spaces between elements.
  compressHTML: true,
  // The site relies on rehype-slug for MDX jump links. Astro 7's native
  // Markdown pipeline does not execute rehype plugins, so retain the unified
  // processor explicitly until that plugin is ported.
  markdown: {
    processor: unified({ rehypePlugins: [rehypeSlug] }),
  },
  integrations: [
    preact(),
    // rehype-slug adds id="…" attributes to every heading so the
    // JumpToSection rail's <a href="#earn-rates"> anchors resolve.
    // Astro's getHeadings() already emits matching slugs in the
    // headings array; the plugin just makes the DOM match.
    mdx(),
    // Generates /sitemap-index.xml + /sitemap-0.xml on build. PR-D
    // (29 May 2026) closed the SEO audit's "no sitemap, no robots"
    // P0 finding. Filters out routes the editor doesn't want indexed
    // by Search Console (design spike, style guide, dev pages, 404).
    sitemap({
      filter: (page) =>
        !page.includes("/design-spike") &&
        !page.includes("/style-guide") &&
        !page.includes("/dev/") &&
        !page.includes("/404"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@astrojs/preact"],
    },
  },
});
