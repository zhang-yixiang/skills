## What it does

Build behavior through a tight red-to-green loop at public boundaries, with expected results independent of the implementation. Refactor within scope when it improves the result without changing behavior.

## When to reach for it

Use for a meaningful regression or test-first implementation. Routine test boundaries can follow the task and repository; materially different coverage or cost needs an explicit trade-off.

## Common questions

**Must every seam be approved again?**
No. Reuse agreed boundaries. Explain what a newly proposed boundary catches and misses when a decision is needed.

**How do tests survive refactoring?**
Assert observable behavior and stable interfaces, not private state, copied algorithms, or incidental DOM structure.

**Does a green test prove the behavior is protected?**
Only if its assertion observes that behavior. For a bug, establish the relevant failure first; when forcing a red by mutation, verify that the mutation actually landed.

## It's working if

The test fails for the intended reason before the fix and passes after it; equivalent internal restructuring does not force widespread test rewrites.

## Where it fits

[implement](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/implement/SKILL.md) chooses relevant validation; [code-review](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/code-review/SKILL.md) checks the resulting change.
