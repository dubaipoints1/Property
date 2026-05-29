import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  site: "https://dubaipoints.ae",
  output: "static",
  integrations: [
    preact(),
    // rehype-slug adds id="…" attributes to every heading so the
    // JumpToSection rail's <a href="#earn-rates"> anchors resolve.
    // Astro's getHeadings() already emits matching slugs in the
    // headings array; the plugin just makes the DOM match.
    mdx({ rehypePlugins: [rehypeSlug] }),
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
