# GitHub native issue graph

For an existing GitHub parent with native sub-issues, use the bundled read-only helper instead of reconstructing issue dependencies from issue numbers or prose:

```sh
node <implement-spec-directory>/scripts/issue-graph.mjs --repo owner/name --parent 123
```

The helper uses the existing `gh` authentication and only reads repository metadata, the parent, paginated native children, and paginated `blocked_by` relationships. It does not create tasks, close issues, change permissions, or prove acceptance criteria. Read the relevant issue bodies, comments, and referenced contracts separately.

After independently verifying a child's implementation is integrated into the coordinator's current target branch, pass its number with `--satisfied 124,125`. This changes only the effective local dependency frontier; it leaves the GitHub state and `nativeDependencyReadyFrontier` visible and unchanged. Do not use `--satisfied` to bypass missing work or external blockers. The core skill defines the required commit and ancestry evidence.

`effectiveReadyFrontier` contains open, not-yet-satisfied children with no remaining open blockers. Dependency readiness is necessary but does not establish clear scope, acceptance, or an available verification environment. Closed GitHub issues also need their closing reason and relevant integration evidence checked before treating them as implemented.

If open work remains but the frontier is empty, inspect `blockedOpen` and the repository-qualified `blockedBy` objects. External blockers or dependency cycles require resolution, not invented readiness. The compact blocker-number lists are display aids; identities live in `blockedBy.repository` plus `number`.

The numeric CLI supports same-repository children only and rejects cross-repository child trees explicitly. External blockers are supported and cannot be satisfied by a same-number local child. Use repository-qualified task identities in the generic coordinator for multi-repository plans. A closed parent or invalid input exits 1; a parent without native children prints an empty graph and exits 2. Do not infer new child issues from that result. A supplied flat task list remains a valid input to the core skill without this helper.

Source: adapted from `zhang-yixiang/codex-personal-config`, commit `10cf28f`, `skills/ship-issue-tree/scripts/issue-graph.mjs`. The helper replaces that former standalone skill's read-only graph support; no separate orchestrator is required.
