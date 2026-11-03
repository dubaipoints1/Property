# Research capture hygiene

Raw website HTML can carry API keys and application configuration even when
the page is public. Logo research does not require committing that payload.

- Keep raw captures in local, ignored `candidates/` or a temporary directory.
- Commit only the source URL, access date and relevant sanitised excerpt in
  `.council/research/`; remove embedded scripts and credential values first.
- Move accepted imagery into its normal asset directory with the required
  provenance and licence record. This changes no imagery licence rule.
- Before pushing, run `node scripts/ci/check-research-secrets.mjs`. It inspects
  tracked text for Google-style API keys and refuses HTML/JSON under root
  `candidates/`. It logs file paths, line numbers and rule names only.
- GitHub secret scanning and push protection remain enabled. This small
  deterministic check complements them; it is not a complete secret scanner.
- A key found in a third-party capture is not automatically a DubaiPoints
  credential. Identify its source and owner without exercising the key. Do
  not call a key revoked unless its owner or provider confirms that status.

For alert #1 (2026-11-03), the historical capture contains the same Maps key
still served by dnata Travel's public homepage; comparison used hashes and
made no Google API calls. No Google-style key was found at any fetched branch
tip. The historical commit remains retrievable. Record third-party-source
disposition honestly; do not label a real captured key a false positive or
claim that closing an alert invalidates it.
