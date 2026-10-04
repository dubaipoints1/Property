---
name: 21st-ui-review
description: Review existing UI against the project's design context, accessibility expectations, responsive behavior, interaction quality, and high-confidence production rules. Use for UI audits, design QA, frontend review, accessibility review, consistency checks, or requests to find and safely fix visual defects. Trigger for requests such as "review this UI", "audit this page", "find design issues", "check responsiveness", or "fix obvious UX problems". Use 21st-ui-build when the request is primarily to create new UI.
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

# Review UI with evidence

Separate deterministic defects from subjective design recommendations.

## Workflow

1. Read `.21st/design.json`, project instructions, and the relevant source.
2. Run the deterministic review first:

   ```bash
   21st review <path>
   21st review <path> --json
   ```

3. Inspect the actual component composition and runtime states. Validate claims
   against code rather than inferring behavior from names.
4. Group findings into:
   - deterministic defects;
   - design-system drift;
   - accessibility and interaction defects;
   - responsive risks;
   - subjective product/design recommendations.
5. Prioritize by user impact and include exact file and line attribution.
6. Use `21st review <path> --fix` only for deterministic, low-ambiguity fixes.
   Never silently redesign, change brand identity, or alter product behavior.
7. Run relevant project tests after fixes and rerun review to prove resolution.

## Review priorities

- semantic controls and accessible names;
- keyboard access, focus visibility, and dialog/menu behavior;
- image alternatives and meaningful labels;
- touch target size and disabled/loading states;
- responsive overflow and fixed-width assumptions;
- reduced-motion handling;
- hardcoded visual values that conflict with project tokens;
- duplicate primitives instead of existing components;
- inconsistent typography, radius, spacing, shadows, and icons;
- fake data, placeholder copy, or missing empty/error states.

## Output

Lead with actionable findings ordered by severity. Keep subjective suggestions
clearly labeled. If no issue is proven, say so and state what was inspected.
