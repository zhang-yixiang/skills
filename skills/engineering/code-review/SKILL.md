---
name: code-review
description: Review a declared committed or working-tree change for correctness, requested behavior, and applicable repository standards. Use for local review, a branch or PR, uncommitted work, or changes since a fixed point.
---

# Code Review

Standards and Spec are reviewed by independent parallel sub-agents. Review the actual change and report actionable findings supported by a reachable scenario or applicable contract.

## Pin the scope

Resolve the requested fixed point and head (`HEAD` by default). For uncommitted work use current `HEAD` as the fixed point unless the user requests a wider scope. Infer an unambiguous baseline from the task or repository; ask when multiple plausible baselines change the review.

Declare `committed` (merge-base through selected head) or `worktree` (also staged, unstaged, and untracked). Record resolved base/head/merge-base SHAs, exact path layers, and excluded dirty work. Compare those SHAs, not moving branch labels. Reject invalid or ambiguous refs, missing or multiple merge-bases, and worktree scope on a head other than current HEAD. Confirm the scope is non-empty.

The bundled helper computes this manifest and optional file-growth triage:

```bash
node <skill-dir>/scripts/file-growth-report.mjs <fixed-point> --head <head> --json
# Add --worktree for the declared working-tree scope.
```

Use it when the scope is complex or growth/ownership needs inspection. For a simple diff, equivalent Git checks suffice. Growth ranking is navigation, never a finding or a threshold for splitting files. If the checkout changes during review, identify the changed layers and update the affected evidence before concluding.

## Read the sources

Search for applicable parent/root/nested `AGENTS.md`, `CODING_STANDARDS.md`, `CONTRIBUTING.md`, and the repository's referenced rules. Do not populate the list from memory alone. Read only sources relevant to the changed paths.

The spec may be the user's request, agreed conversation, a supplied file, or an issue. Follow the project's tracker pointer when fetching an issue; do not hardcode a tracker-doc path or require setup for a local review. State missing acceptance evidence without inventing requirements; ask only when the ambiguity blocks a useful conclusion.

## Inspect according to risk

- Check requested behavior and scope against the spec, and the change against applicable standards. Repo contracts override generic preferences. Do not rerun deterministic tooling merely to report rules it already checks.
- For interface changes, trace producer and affected consumers, serialization, and the shipped entry. For asynchronous/resource changes, trace relevant ownership, cancellation, replacement, and failure paths. A hypothetical interleaving alone is not a defect.
- For tests or claimed regression protection, verify the assertion observes the intended behavior and has an independent expected result. Existing green tests alone do not prove compatibility with a real API or runtime contract.
- For abstractions, state, fallbacks, caches, or extension points, identify a current requirement, repository contract, or reachable production need. If none is evidenced, explain the smaller complete alternative and uncertainty. Tests or examples alone do not establish a production requirement.
- For responsibility changes, inspect actual owners and coupling. Duplication, speculative generality, message chains, and divergent change are leads, not automatic violations. Do not split files solely for length or replace duplication with pass-through wrappers.

Spawn two independent sub-agents in parallel, including for small changes: one checks Standards against applicable repository rules, and one checks Spec against the requested behavior and scope. Give both the same pinned change scope and the sources relevant to their axis; instruct them to return findings directly without further review delegation. Wait for both reports before aggregating. The parent agent's self-review does not replace either sub-agent. If no spec or user acceptance request is available, run Standards and explicitly report Spec as skipped. If required delegation is unavailable or prohibited by a higher-priority instruction, report the blocker and leave independent review incomplete.

## Report and recheck

Deduplicate findings and order by impact. For each actionable finding give the location, supported failure scenario or violated requirement, consequence, and smallest useful remedy. Distinguish blocking defects from non-blocking improvements or nits and identify whether the basis is behavior/spec or standards. Judgement calls are not automatically blockers. Say when no substantiated findings remain; do not fill a quota.

When repairs are authorized, recheck the original finding and affected behavior. A major refactor, semantic conflict resolution, or new integration risk warrants reviewing the newly affected scope. Small repairs do not restart a broad search automatically, and there is no absolute one-review ceiling. Stop when acceptance and required checks hold and no substantiated blocker remains; report remaining limitations.
