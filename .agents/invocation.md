# Skill invocation

Codex UI and discovery policy live in each skill's `agents/openai.yaml`. `allow_implicit_invocation: false` excludes automatic discovery but leaves explicit user invocation available. Preserve that choice unless the workflow deliberately changes it. Local delivery skills `implement` and `implement-spec` allow discovery and can be used by an authorized coordinating workflow.

Use supported SKILL.md frontmatter: required `name` and `description`, with supported optional fields such as `metadata` (including attribution). Do not add Claude-only `disable-model-invocation` or `argument-hint` fields to this Codex-oriented fork.

Use `$skill-name` to identify a skill in Codex. Read the skill's actual instructions and use the capabilities provided by the current runtime; do not require a tool literally named `Skill`. Invocation never overrides the user's scope or the platform's authorization rules. If a required skill is unavailable, report that limitation instead of pretending it ran.

Reading `GLOSSARY.md` for vocabulary is a document lookup. Invoke domain-modeling for active naming or modeling work, not every read.
