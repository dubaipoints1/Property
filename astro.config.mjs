import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
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
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@astrojs/preact"],
    },
  },
});
