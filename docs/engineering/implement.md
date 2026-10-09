## What it does

Implement one agreed task, validate its observable behavior, obtain independent review, and commit the scoped work locally.

## When to reach for it

Use directly for a bounded task, or as a worker under implement-spec. Invocation can be automatic when the request fits.

## Common questions

**Does implementation include a commit?**
Yes. Using implement includes a local commit unless you explicitly ask to leave changes uncommitted. The final response reports the commit SHA. Push, PRs, and deployment still follow separate authorization.

**Must every change use TDD?**
Use a meaningful regression or test-first loop when it provides independent evidence. Avoid tautological tests and unnecessary ceremony for low-impact changes.

**Who owns review in a task graph?**
The coordinator. A worker returns scoped commits and validation; it does not automatically repeat full review. Standalone implementation runs code-review with independent Standards and Spec [subagents](https://www.aihero.dev/ai-coding-dictionary/subagent) before the final commit.

**Do I always run the full suite?**
Follow project validation rules. Without them, select checks by the changed behavior and shared risk; expand when evidence requires it.

## It's working if

The task delivers the requested behavior, validation is tied to the actual code, and independent review reports are available. Unless you requested uncommitted changes, the final response includes the local commit SHA and distinguishes verified and unverified boundaries.

## Where it fits

See [ask-matt](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/ask-matt/SKILL.md) for the local workflow and [the skill source](https://github.com/zhang-yixiang/skills/blob/main/skills/engineering/implement/SKILL.md) for execution instructions.
