---
name: improve-codebase-architecture
description: Inspect existing architecture for evidence-backed simplifications or better module boundaries. Use for over-design, duplication, ownership friction, and hard-to-test behavior.
---

# Improve Codebase Architecture

Read the applicable repository guidance, domain glossary (`GLOSSARY.md` or its explicit project pointer), and relevant ADRs. Local contracts take priority over generic architecture preferences.

For over-design or removal opportunities, use the **subtractive audit** in [references/subtractive-audit.md](references/subtractive-audit.md). For better test boundaries or module shape, consult `$codebase-design` and inspect the real owners and callers. A branch or working-tree review belongs to `$code-review` instead.

Follow the user's area; otherwise use recent changes and concrete friction to choose a useful scope. Look for responsibilities callers must understand unnecessarily, duplicate owners of one fact, shallow indirection, or behavior that cannot be tested through a stable public boundary. Check whether a proposed simplification removes complexity rather than moving it into callers.

Return the strongest evidence-backed candidates in concise prose: current problem and callers, proposed responsibility change, benefit, behavior trade-off, and uncertainty. Representative retained mechanisms can explain why a tempting deletion is wrong. No candidate is a valid outcome. Do not optimize line count or invent a new abstraction just to remove similar-looking code.

Use a diagram only when it clarifies the decision; generate an HTML report only when requested or useful for the user's chosen presentation, using [HTML-REPORT.md](HTML-REPORT.md) as an optional reference. A text investigation does not require an artifact or a subagent.

An audit ends with its findings. When the user has already authorized a specific implementation, proceed within that scope; otherwise leave candidates for selection. Use `$grilling` only for unresolved design decisions, not as a mandatory ceremony. Use `$domain-modeling` when agreed domain terms actually change; do not create ADRs or glossary entries merely because an audit ran.
