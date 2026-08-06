# Deliberate negative test — Council sign-off gate

This branch and its pull request exist to prove that the `council-signoff`
gate actually REFUSES a pull request, and that branch protection on `main`
actually blocks the merge when it does.

Everything up to this point had only ever been observed passing. A gate
nobody has watched say "no" is an assumption, and this session already
produced one workflow that silently never ran at all.

**This PR is never merged.** It is opened with the Chairman row set to
`pending`, observed to fail and to block, then flipped to `approved` to
confirm the recovery path, then closed. The branch is deleted afterwards.

If you are reading this file on `main`, something went wrong — it was
supposed to be discarded with the branch.
