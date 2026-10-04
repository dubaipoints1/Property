---
name: 21st-design-sync
description: >-
  Look at the current project's design (its shadcn / Tailwind CSS variables and
  color tokens) and publish it to the 21st.dev community as a shareable theme,
  using `21st publish-theme`. Use when the user says "publish my theme",
  "share our design as a 21st theme", "sync my design to 21st", "turn my
  globals.css into a theme", "залей наш дизайн темой", "опубликуй тему". This is
  the 21st equivalent of design-sync: it reads the project's design tokens and
  syncs them into the public theme library.
---

> **dubaipoints.ae house rules.** Vendored from `21st-dev/claude-code-plugin`
> at `f76b07a` (9 September 2026, Apache-2.0, see
> `.claude/skills/21st-ui-build/LICENSE-21st`), installed on Chairman direction
> 4 October 2026. They override anything below:
>
> 1. **21st output is a mockup** (2026-07-25 amendment). This site is Astro +
>    Preact with CSS custom-property tokens and `.dp-*` classes, not React +
>    shadcn. Never run `npx shadcn add`, never add React/shadcn/Radix
>    dependencies, never paste generated JSX or Tailwind palette utilities.
>    Rebuild the chosen pattern in the house idiom.
> 2. **No invented figures** in prompts, demos or sample cards (Charter §6).
> 3. **Publishing is outward-facing.** `21st publish`, `publish-theme`, and any
>    registry write need the Chairman's explicit approval for that specific
>    publish, every time.
> 4. **Key**: read from `API_KEY_21ST`; never pasted into chat or committed.
>    `21st.dev` is egress-blocked in web sessions until allowlisted.
> 5. Review anything built with `web-design-guidelines` at Stage 5.5.

# 21st Design Sync — publish your project's design as a theme

Take the design a project already ships (its light + dark CSS variables) and
publish it to the **public** 21st.dev theme library so anyone can preview,
bookmark, and apply it. Under the hood this is one CLI call:
`21st publish-theme <file.css> --name "…"`.

## Pre-flight (always)

1. **Auth needs a real API key.** `publish-theme` is a management endpoint: it
   accepts a `21st_sk_…` key **only**, not a `21st login` session token. Get one
   at **https://21st.dev/mcp** (or **https://21st.dev/settings/api-keys**) and pass it via
   `--api-key 21st_sk_…` or the `TWENTYFIRST_TOKEN` / `API_KEY_21ST` env var. If
   the user has no key, point them there — don't try to mint one.
2. The CLI is the unified `@21st-dev/cli` (bin `21st`). Use `npx @21st-dev/cli`
   if it isn't installed.
3. **Publishing is public and outward-facing.** A published theme is immediately
   `is_public` in the community library (there is no unlisted/private option for
   themes). Confirm with the user before publishing.

---

## Step 1 — Find the project's design tokens

Locate the file that defines the shadcn/Tailwind theme variables. Check, in order:

- `app/globals.css`, `src/app/globals.css`
- `src/index.css`, `styles/globals.css`, `app/styles/globals.css`

You're looking for a `:root { … }` block of CSS custom properties
(`--background`, `--foreground`, `--card`, `--primary`, `--secondary`,
`--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, the
`--chart-*` / `--sidebar-*` tokens, `--radius`) and a matching `.dark { … }`
block. Values may be `hsl(...)`, `oklch(...)`, hex, or raw channels — keep them
exactly as the project wrote them.

Tailwind v4 projects usually keep the same `:root` / `.dark` blocks plus an
`@theme inline` mapping; you only need the `:root` and `.dark` token values,
not the `@theme` mapping.

## Step 2 — Assemble a valid theme CSS file

The publish endpoint parses `--name: value;` pairs out of a `:root { … }` block
and a `.dark { … }` block, and **requires both to be non-empty**. So the file
you publish must contain both.

- Copy the project's `:root` and `.dark` blocks into a standalone file
  (e.g. `project-theme.css`). Nothing else is required.
- **If the project has only a light `:root` and no `.dark`** (or an empty one),
  generate a dark variant before publishing — don't ship a theme with an empty
  dark mode. Reuse the `add-dark-mode` / `oklch-skill` approach: invert
  lightness while preserving hue/chroma so the dark set stays on-brand. Keep the
  same token names.
- Keep the token names shadcn-standard so the theme previews correctly on the
  card and applies cleanly for others.

Minimal shape:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 4%;
  --primary: 240 6% 10%;
  /* …the rest of the project's light tokens… */
  --radius: 0.5rem;
}
.dark {
  --background: 240 10% 4%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  /* …the rest of the project's dark tokens… */
}
```

## Step 3 — Name & tag it

- **Name** (required, ≤ 50 chars): infer from the project — the product/brand
  name from `package.json`, the repo, or the site title. Ask the user if it's
  ambiguous.
- **Tags** (optional): a few descriptors that match how people browse themes,
  e.g. `dark`, `minimal`, `neutral`, `vibrant`, `saas`. Pass comma-separated.

## Step 4 — Publish

```bash
21st publish-theme ./project-theme.css \
  --name "Acme" \
  --tags dark,minimal \
  --api-key 21st_sk_…            # or set TWENTYFIRST_TOKEN
```

The command prints the live theme URL (`https://21st.dev/community/themes/<slug>`).
Share it with the user.

## Updating vs re-publishing

- **Each `publish-theme` creates a NEW theme** (there's no upsert-by-slug like
  components have). Running it twice = two themes in the library.
- To change **name/tags/visibility** on an existing theme, edit it in place:
  `21st edit <theme-id> --type theme [--name "…"] [--tags a,b]`.
- To change the **colors**, publish a fresh file and remove the old one:
  `21st delete <theme-id> --type theme --yes` (soft-unpublish, reversible).

## When NOT to use this

- Syncing a component **library** to a Claude Design project → that's the
  built-in `/design-sync` skill, a different destination.
- Publishing a **component** (not a color theme) → use `21st-registry`.
