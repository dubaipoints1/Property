// Council sign-off gate — Charter §7.
//
// "No pull request merges to `main` without a `## Council sign-off`
// section in its body declaring which specialists reviewed it. […] A PR
// missing the sign-off block is not mergeable, no exceptions."
//
// Until now that was enforced editorially and CLAUDE.md said so outright:
// "The CI `validate` workflow does not (yet) parse this block […] A future
// GitHub Action may grep PR bodies for the section header to hard-fail PRs
// without it." This is that action.
//
// Deliberately a pure function plus a thin CLI, so the rules are unit
// tested in tests/ci/signoff.test.ts rather than being inline shell that
// nobody can exercise. A gate that silently stops gating is worse than no
// gate, because everyone assumes it is working.
//
// Usage (CLI): PR_BODY="$(cat body.md)" node scripts/ci/check-signoff.mjs
// Exit 0 = pass, 1 = fail with reasons on stderr.

/** The header that opens the block. */
const SECTION_RE = /^##\s+Council sign-off\s*$/im;

/** `**Tier**: T2` — bold optional, spacing loose, T1/T2/T3 only. */
const TIER_RE = /\*{0,2}Tier\*{0,2}\s*:\s*\*{0,2}\s*(T[123])\b/i;

/**
 * Split a markdown table row into trimmed cells.
 * "| a | b | c |" -> ["a", "b", "c"]
 * Returns [] for anything that is not a table row.
 */
function cells(line) {
  const t = line.trim();
  if (!t.startsWith("|")) return [];
  return t
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Strip bold/italic/backticks so "**approved**" compares as "approved". */
function plain(cell) {
  return cell.replace(/[*`_]/g, "").trim().toLowerCase();
}

/**
 * Validate a PR body against the Charter's sign-off requirements.
 *
 * @param {string|null|undefined} body Raw PR description markdown.
 * @returns {{ok: boolean, errors: string[], tier: string|null}}
 */
export function checkSignoff(body) {
  const errors = [];
  const text = typeof body === "string" ? body : "";

  if (text.trim() === "") {
    return {
      ok: false,
      tier: null,
      errors: [
        "The pull request body is empty. Charter §7 requires a `## Council sign-off` section declaring which specialists reviewed the change.",
      ],
    };
  }

  if (!SECTION_RE.test(text)) {
    return {
      ok: false,
      tier: null,
      errors: [
        "No `## Council sign-off` section found in the PR body. Charter §7: a PR missing the sign-off block is not mergeable, no exceptions. Copy the template from CLAUDE.md (§\"PR body template\").",
      ],
    };
  }

  const tierMatch = text.match(TIER_RE);
  const tier = tierMatch ? tierMatch[1].toUpperCase() : null;
  if (!tier) {
    errors.push(
      'No tier declared. Add a line reading `**Tier**: T1`, `T2` or `T3` — the tier decides which specialists must sign off. When in doubt, escalate; under-tiering is a discipline failure.',
    );
  }

  // Find the Chairman row. Charter: the Chairman's `approved` status is
  // mandatory on EVERY tier, so this is the one row we always require.
  const chairmanRows = text
    .split("\n")
    .map(cells)
    .filter((c) => c.length >= 2 && /chairman/i.test(c[0]));

  if (chairmanRows.length === 0) {
    errors.push(
      "No Chairman row found in the sign-off table. The Chairman's status is mandatory on every tier — add `| Chairman (Stage 7) | **approved** | … |`.",
    );
  } else {
    // Read the STATUS cell specifically, not the whole row: a Notes cell
    // saying "approved the brief on 5 Aug" must not satisfy the gate.
    const approved = chairmanRows.some((c) => plain(c[1]) === "approved");
    if (!approved) {
      const seen = chairmanRows.map((c) => `"${c[1]}"`).join(", ");
      errors.push(
        `Chairman status is ${seen}, not "approved". Charter §"Non-negotiables" 3: the Chairman is the only publish gate. This check goes green when the status cell reads **approved** — edit the PR body and it re-runs automatically.`,
      );
    }
  }

  return { ok: errors.length === 0, errors, tier };
}

// ── CLI ──────────────────────────────────────────────────────────────
// Guarded so importing this module for tests neither reads env nor exits.
if (process.argv[1] && process.argv[1].endsWith("check-signoff.mjs")) {
  const result = checkSignoff(process.env.PR_BODY);
  if (result.ok) {
    console.log(`Council sign-off present. Tier: ${result.tier}. Chairman: approved.`);
    process.exit(0);
  }
  console.error("Council sign-off check FAILED (Charter §7):\n");
  for (const e of result.errors) console.error(`  · ${e}\n`);
  console.error("See CLAUDE.md → “PR body template — Council sign-off”.");
  process.exit(1);
}
