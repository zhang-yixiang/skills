---
name: implement
description: Implement a bounded piece of work from a request, spec, or ticket, validate it, and complete local delivery. Also supports a worker inside implement-spec.
---

Implement the agreed observable behavior within the requested scope. If given a ticket reference, retrieve it using the configured tracker and state its title; ask only if the reference remains ambiguous. A direct request does not need an issue tracker.

Read applicable repository guidance and use existing owners and contracts. Use `$tdd` for behavior that benefits from a reproducible regression or test-first loop, at appropriate public boundaries. Do not add tests that merely restate an implementation or invent product scope.

Use the project's tiered validation rules, including their escalation conditions. Otherwise run relevant tests and type checks as appropriate; use the full suite when the change's scope or shared risk justifies it. After required checks pass, repeat or broaden only for new changes, failures, or unresolved concerns. Report skipped or unavailable checks accurately.

## Review owner

- **Standalone delivery:** run `$code-review` on the relevant change scope before the final local commit. Fix substantiated blockers and recheck the affected behavior. Reopen review only where fixes introduce new risk.
- **Orchestrated worker:** when the coordinator explicitly owns final review, implement and validate the assigned task and return scoped commits and evidence. Do not run an automatic second full review or orchestrate sibling tasks. Flag high-risk changes for the coordinator; a specifically requested focused review is still appropriate.

Commit the scoped work to the assigned local branch when authorized. Return the full SHA(s), behavior delivered, verification results, and unresolved boundaries. Follow existing authorization for external actions; implementation alone does not imply push, PR, deployment, or remote Issue changes.
