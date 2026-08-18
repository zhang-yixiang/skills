---
"mattpocock-skills": patch
---

Standardize cross-skill invocation on Codex's explicit `$skill-name` syntax instead of bare `/skill`-style prose, across `code-review`, `diagnosing-bugs`, `grill-with-docs`, `grill-me`, `improve-codebase-architecture`, `tdd`, `to-spec`, `to-tickets`, `triage`, and `wayfinder`.

- A skill that names another skill in prose ("run the `/grilling` skill") does not reliably cause it to load — this is the documented rough edge behind `grill-with-docs`'s most-reported problem. Codex's explicit `$grilling` syntax is intended to raise the hit rate.
- A step needing more than one skill now says so as ordered invocations ("Use `$grilling`, then `$domain-modeling`"), not one combined call.
- Documents the convention in `.agents/invocation.md` for future skills to follow.
