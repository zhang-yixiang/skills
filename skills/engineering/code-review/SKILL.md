---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

Two-axis review of an exact declared change scope between a fixed point the user supplies and a selected head (`HEAD` by default):

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

The issue tracker should have been provided to you. If `docs/agents/issue-tracker.md` is missing, tell the user to invoke `$setup-matt-pocock-skills`.

## Process

### 1. Pin the exact change scope

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it. The head defaults to `HEAD` unless the user supplied another ref.

Declare the review scope before inspecting the diff:

- `committed` (default for a branch, PR, or "since X"): merge-base through the selected head.
- `worktree` (when the user asks to review work in progress or uncommitted work): committed, staged, unstaged, and untracked layers together.

Run the bundled preflight and growth report:

```bash
node <skill-dir>/scripts/file-growth-report.mjs <fixed-point> --head <head> --json
# Add --worktree only for the declared worktree scope.
```

The preflight rejects a missing, non-commit, or ambiguous ref; zero or multiple merge-bases; and `--worktree` against a head other than the current `HEAD`. Its versioned JSON pins `resolved.baseSha`, `resolved.headSha`, and `resolved.mergeBaseSha`, then partitions `paths.committed`, `paths.staged`, `paths.unstaged`, and `paths.untracked`.

Use those resolved SHAs and path lists as the single scope manifest for both sub-agents:

- committed diff: `git diff <mergeBaseSha> <headSha> --`
- staged diff, only for worktree scope: `git diff --cached --`
- unstaged diff, only for worktree scope: `git diff --`
- untracked files, only for worktree scope: read exactly the reported `paths.untracked` files
- commit list: `git log <mergeBaseSha>..<headSha> --oneline`

If a dirty layer is not in the declared scope, state that it is excluded. Confirm the declared scope is non-empty before spawning either sub-agent. Never let a report or prompt silently broaden or narrow it.

The report's `files` ranking covers both concentrated additions and already-large changed files. It is triage input, not a violation or a reason to split by itself.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Start with every applicable `AGENTS.md` — parent/root guidance plus any nested file governing a changed path — then include anything else in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

The Standards axis also reviews **file growth and responsibility placement**. Use the growth report to choose where to inspect, then read the relevant hunks and surrounding owner. Report a judgement-call finding only when the diff concentrates a distinct responsibility, state owner, external interaction, policy, or independently testable behaviour in a file that should not own it, or materially worsens Divergent Change. Line count alone is never a finding. Do not recommend splitting generated/data catalogues solely for size, and do not propose pass-through helpers, thin wrappers, or seams without a real variation boundary. A useful extraction has a small interface, owns meaningful implementation, and reduces what callers must understand.

The Standards axis also reviews **mechanism growth**. When the diff adds or expands an abstraction, state owner, fallback, compatibility path, guard, cache, configuration surface, or extension point, require at least one verified current need: a user/spec requirement, an applicable repo contract, or a reachable production consumer. Tests, examples, and historical implementation alone do not establish a production need. If none exists, report `possible Speculative Generality`, cite the evidence, and name the smaller complete alternative. This is always a judgement call; suppress it when a verified contract or consumer justifies the mechanism.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for a need neither the current spec, a repo contract, nor a reachable production consumer has. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Apply shared evidence discipline

Both axes use the following rules to substantiate findings within their own question; these rules do not create a third general-bug axis:

- **Trace both sides of changed interfaces.** Inspect the producer and every in-scope consumer, including serialization, adapters, and call sites; a type or helper in isolation does not prove the contract is wired correctly.
- **Trace full lifecycles.** For resources and asynchronous work, follow creation/start through ownership/use to cancellation, disposal, error recovery, and replacement. A finding must name a reachable path, not a theoretical interleaving.
- **Verify the shipped entry.** Confirm the changed behavior is reachable through the real runtime entry, registration, route, build input, or package export; helper-only and test-only paths are insufficient evidence.
- **Check test sensitivity.** A passing or present test is evidence only when its assertion observes the target invariant. For a claimed coverage gap, name the target regression or negative control the assertion would fail to catch; otherwise report an evidence gap, not confirmed protection.

### 5. Spawn both sub-agents in parallel

**Standards sub-agent prompt** — include:

- The exact scope manifest, all included layer commands/path lists, excluded dirty layers, and commit list.
- The file-growth report, explicitly labelled as triage rather than a threshold or finding.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The file-growth responsibility rule from step 3 pasted in full.
- The mechanism-growth rule from step 3 pasted in full.
- The shared evidence discipline from step 4 pasted in full.
- The brief: "Review only the declared scope. Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); (b) any baseline smell you spot: name it and quote the hunk; and (c) any responsibility-placement or unsupported mechanism-growth problem supported by the growth triage and inspected code. Use the shared evidence discipline to verify claims on this axis, not to start a separate general-bug review. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells, responsibility-placement findings, and mechanism-growth findings are always judgement calls, and a documented repo standard overrides the baseline. Never report line count alone or recommend a pass-through split. Skip anything tooling enforces. Do not invoke $code-review or spawn further agents; perform this axis directly. Under 400 words."

**Spec sub-agent prompt** — include:

- The exact scope manifest, all included layer commands/path lists, excluded dirty layers, and commit list.
- The path or fetched contents of the spec.
- The shared evidence discipline from step 4 pasted in full.
- The brief: "Review only the declared scope. Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Use the shared evidence discipline to verify claims on this axis, not to start a separate general-bug review. Quote the spec line and implementation evidence for each finding. Do not invoke $code-review or spawn further agents; perform this axis directly. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 6. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
