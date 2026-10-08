---
name: implement-spec
description: Implement an agreed multi-task plan or spec with dependencies, coordinate independent workers, and integrate verified work locally. Use for delivering a whole task graph; use implement for a single task.
---

# Implement Spec

The outcome is the agreed work implemented and reviewed on the chosen local branch. A task graph may come from a spec, local plan, or issue tracker. A tracker and PR are not prerequisites. A small task without meaningful dependencies goes to `$implement` directly.

## Establish the work

Read the task inputs, applicable repository instructions, acceptance criteria, and shared contracts. For existing tracker tickets or a parent Issue, use the configured tracker instructions and available tools to read the actual tasks and dependency relationships. For GitHub native sub-issues, follow [the GitHub graph reference](references/github.md) and its bundled read-only helper. If the graph is already available, reuse it and refresh only when needed. Reuse settled decisions; clarify only gaps that change scope, behavior, or authorization. If no actionable tasks exist, define the necessary breakdown with the user rather than inventing deliverables.

Confirm the target checkout, branch, current HEAD, and existing edits. Preserve unrelated work. Use the current local branch or an already chosen integration branch; create a branch only when isolation or the user's workflow needs it. One coordinator owns integration into that branch.

Record a compact execution state: task, dependencies, baseline, worker, status, commits, and validation. No separate ledger file or per-ticket model matrix is required. Use the user's authorized settings or runtime defaults; changing model/effort or creating tasks must follow the current tool's authorization contract.

## Execute the ready tasks

- A task is ready when its required predecessors are integrated and its acceptance and external prerequisites are actionable. Track local integration separately from remote Issue closure. Refresh the graph when needed and provide only verified integrated tasks as locally satisfied; remote closure alone is not implementation evidence.
- Parallelize independent work when the runtime and user authorize delegation. Use separate writable checkouts for concurrent code writers. Confirm each worker starts at the recorded integrated baseline. If it does not, inspect existing work before correcting it; never discard edits to force the baseline.
- Check shared interfaces and resources before dispatch. Agree the small shared contract or sequence coupled changes. Do not introduce an abstraction just to make tasks parallel.
- A worktree may lack ignored fixtures, credentials, or databases. Confirm the task's relevant checks can actually execute there. Provide the required environment when authorized, or run that task sequentially in the suitable checkout. A skipped acceptance check is not a pass.
- Give each worker the task, non-goals, source pointers, baseline, and expected validation. Use `$implement` in **worker mode**, with final review owned by the coordinator. Workers return scoped commits (full SHAs), behavior changes, actual checks/results, and unresolved boundaries. They do not start another orchestrator or automatically push, open PRs, or modify remote Issues.
- Use an exploration worker only when shared discovery would otherwise be repeated. Return source pointers and findings, not a second copy of the spec. A separate merger worker is unnecessary for routine integration.

## Integrate and advance

Verify the returned commits derive from the recorded baseline, inspect the actual diff against the task, and integrate completed work serially. A completion message alone does not satisfy dependencies. Mark a task integrated only when its changes are present on the target branch and the required integration checks pass; recheck ancestry when resuming an older execution record.

Workers need not continually merge the integration tip. If their shared contract has changed or integration conflicts, have the owner reconcile intent and validate the affected behavior. Do not invent new behavior to resolve a conflict. If the intents cannot be reconciled safely, stop that integration and settle the design. Independent tasks may continue.

For failures, distinguish an introduced regression from a baseline defect, environment problem, or flaky check using evidence. Return task defects to their owner. Newly discovered work enters the plan only when it is necessary for the agreed acceptance or the user expands scope. Do not fix unrelated code merely to obtain a green run.

## Local review and completion

Use `$code-review` on the final relevant scope. Earlier focused reviews may be reused; inspect new integration risks instead of repeating every worker's review. Fix actionable blockers, then recheck the fixes and required behavior. Major refactoring, semantic conflict resolution, or a changed shared contract warrants review of the newly affected scope; a small fix does not automatically restart broad discovery.

Follow repository validation rules and the actual combination risk. Reuse evidence only when the relevant code and environment remain applicable; rerun affected checks when integration changes them. Complete when the agreed acceptance and required checks hold, no substantiated blocker remains, and the local commits/integration are recorded. Report final SHA, actual checks, remaining non-blocking findings, and unverified external boundaries.

Local delivery does not itself authorize push, PR creation, deployment, remote Issue changes, or destructive cleanup. Reuse any explicit authorization already given; do not repeatedly ask for ordinary steps already covered. Retrospective is optional, not another delivery gate.
