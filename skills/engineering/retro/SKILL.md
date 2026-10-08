---
name: retro
description: Review a development session for recurring failures, costly rework, or avoidable friction and propose the smallest improvement to the working environment.
---

# Retrospective

Run when the user requests a retrospective, especially after a repeated error or expensive failure. It is not a required delivery gate. Read the relevant session evidence and distinguish observed events, user corrections, and inferences. Do not turn one historical request into a permanent preference.

Identify the cause and cost before suggesting a rule. Consider navigation, missing facts, inadequate checks, tool friction, and instructions that caused unnecessary work. Look for existing checks or guidance that were not used or were broken before proposing a replacement.

Mechanical failures belong in a reliable existing lint/check/test path where practical. Judgement calls may need a concise rule or clearer ownership. Prefer repairing, simplifying, or deleting a mechanism over adding a parallel one. A missing hook or CI job alone is not proof that a local workflow needs one.

For each worthwhile change explain the evidence, smallest remedy, likely recurring benefit, and maintenance cost. Consider whether an obsolete rule can be removed at the same time. A valid conclusion is that no durable change is justified. Do not impose quotas, a new ledger, or a universal checklist.

Present proposals. If the user already authorized a specific improvement, implement that scoped change and validate it; otherwise do not edit global settings, install tools, add hooks, publish, or broaden permissions. Use `$writing-for-agents` when rewriting instructions. Report the remaining uncertainty rather than claiming that a prose rule guarantees behavior.
