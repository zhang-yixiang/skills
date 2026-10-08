## What it does

Coordinate an agreed dependency graph and integrate verified work on the chosen local branch. Local integration state drives readiness; remote Issue closure does not.

## When to reach for it

Use it for multiple actionable tasks with dependencies, including existing tracker tickets or a parent Issue. It is discoverable and can be invoked directly. A single bounded change belongs to implement.

## Common questions

**Do I need a PR or GitHub?**
No. A spec, local plan, or configured tracker can supply tasks and acceptance. After to-tickets, delivery can proceed directly here. The configured tracker provides the source; use the bundled GitHub helper when applicable.

**Does every task run in parallel?**
Only independent tasks with a usable verification environment. Shared interfaces may need sequencing. A worktree without required ignored fixtures cannot claim acceptance from skipped tests.

**Who reviews?**
The coordinator owns final local review; workers implement and validate. Reuse useful earlier evidence and inspect new combination risks. Small fixes receive focused rechecks; substantive new changes receive appropriate review.

**What happens at completion?**
Report local commits, checks, and unresolved boundaries. Push, PRs, Issue updates, and cleanup follow actual authorization, not a default closing ritual.

## It's working if

Tasks advance when their predecessors are verified on the target branch; no duplicate orchestrator or automatic per-worker/full-parent review cycle appears.

## Where it fits

See [ask-matt](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/ask-matt/SKILL.md) for the local workflow and [the skill source](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/implement-spec/SKILL.md) for execution instructions.
