## What it does

Review a pinned change for requested behavior, correctness, and repository standards. Standards and Spec are perspectives rather than a mandatory two-agent topology.

## When to reach for it

Use for local working-tree review, committed work, or a branch/PR. The request supplies scope; the skill does not require an issue tracker.

## Common questions

**Is the growth report mandatory?**
No. It combines deterministic scope checks and useful triage for broad changes. Simple diffs can use equivalent Git checks. File length alone is not a finding.

**How many reviewers?**
One is enough for a small scope. Split substantial independent risks when delegation helps, then wait for real results and deduplicate them.

**What evidence matters?**
Read applicable rules, verify changed interfaces and their consumers, inspect lifecycles when relevant, and use real runtime contracts. Passing tests alone do not establish coverage of a particular regression.

**Can a fix trigger another review?**
Yes, if it creates material new risk. Recheck small repairs directly; review new refactors, conflict resolutions, or shared-contract changes in their affected scope. There is neither an infinite full-review loop nor a one-round ceiling.

## It's working if

Findings identify an actual scenario or requirement, are sorted by impact, and do not turn speculative improvements into blockers.

## Where it fits

See [ask-matt](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/ask-matt/SKILL.md) for the local workflow and [the skill source](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/code-review/SKILL.md) for execution instructions.
