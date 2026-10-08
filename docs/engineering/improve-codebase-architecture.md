## What it does

Find evidence-backed simplifications or clearer responsibility boundaries in existing code. A useful result may be that no change is justified.

## When to reach for it

Use for over-design, real duplication, or architecture friction. For a branch or working-tree review, use code-review.

## Common questions

**Does it always produce HTML?**
No. Concise text is the default. A diagram or optional HTML reference is useful only when the presentation helps the decision.

**What makes a deletion worthwhile?**
Check callers, domain contracts, ADRs, and the total maintenance surface. A fallback or guard may protect an external contract; removing lines is not itself a benefit.

**Does the audit start implementation?**
Only when implementation is already authorized. An investigation otherwise ends with candidates. A design interview is needed only for genuinely unsettled choices.

## It's working if

Recommendations name real owners and consumers, explain behavior trade-offs, and avoid replacing duplication with equally costly glue.

## Where it fits

See [ask-matt](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/ask-matt/SKILL.md) for the local workflow and [the skill source](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md) for execution instructions.
