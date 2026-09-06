---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
---

Implement the work described by the user in the spec or tickets.

Use `$tdd` where possible, at pre-agreed seams.

Use the project's tiered validation rules when they exist, including the checks and escalation conditions they require. Otherwise, run typechecking and relevant test files during implementation, then the full test suite once at the end. After the required checks pass, repeat or broaden validation only for new changes, failures, or unresolved concerns.

Once done, use `$code-review` to review the work.

Commit your work to the current branch.
