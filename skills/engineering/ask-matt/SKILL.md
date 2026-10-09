---
name: ask-matt
description: Choose an appropriate skill or local development flow for the user's task without requiring unnecessary planning or delivery stages.
---

# Ask Matt

Before describing another skill's behavior or recommending a step be skipped, read its actual SKILL.md. These summaries only orient you. Use the smallest flow that delivers the user's request; a clear task needs no interview, tracker, PR, or retrospective by default.

## Local delivery

- **One bounded task:** `$implement` handles implementation, relevant validation, independent review, and a scoped local commit by default, unless the user asks to leave changes uncommitted.
- **An agreed multi-task plan with dependencies:** `$implement-spec` coordinates independent work and owns local integration and final review.
- **Existing tracker tickets or a parent Issue with children:** `$implement-spec` reads the configured tracker and the existing graph directly. No external personal adapter is required. After `$to-tickets`, continue to `$implement-spec` when the user has requested delivery; planning alone is not authorization to implement.

Read the runtime's invocation and delegation rules and respect the user's authorization. Routing a request does not independently authorize an external action. Local delivery stops at the chosen branch and commits; push, PR, deployment, remote Issue updates, or destructive cleanup require appropriate authorization already in the session.

## Planning only when needed

- Unsettled requirements in a repo: `$grill-with-docs`, using `$grilling` and `$domain-modeling` as needed. No persistent workspace: `$grill-me`.
- A question needs a runnable example: `$prototype` for UI or logic. Use `$handoff` when work truly crosses sessions/directories, not at every phase.
- Settled discussion needs a durable spec: `$to-spec`; an agreed plan needs dependency-aware tickets: `$to-tickets`. These do not force sequential delivery; choose the execution flow from the graph and shared risks.
- A large effort still has unresolved decisions: `$wayfinder`. Resolve the uncertainty before treating decision tickets as implementation tickets.
- Raw incoming reports: `$triage`. Already agreed implementation tickets do not need triage again.

## Investigation and review

- A difficult bug: `$diagnosing-bugs` establishes a tight failing feedback loop and a regression check. Consider `$retro` only if the incident reveals recurring or costly process friction.
- Local or committed change review: `$code-review` runs independent Standards and Spec sub-agents in parallel; evidence depth follows the actual risk.
- Existing architecture friction: `$improve-codebase-architecture` for evidence-backed simplification or better ownership; `$codebase-design` for module/interface vocabulary. An audit does not automatically generate HTML or start implementation.
- Test-first behavior: `$tdd`, through meaningful public boundaries. Do not introduce low-value tests just to follow a ritual.

## Supporting skills

- `$domain-modeling`: agree domain terms in `GLOSSARY.md` and consequential decisions in ADRs. Reading terminology alone does not need an interview.
- `$research`: primary-source investigation; use delegation only when authorized and useful.
- `$to-questionnaire`: prepare questions for someone whose knowledge is missing.
- `$wizard`: a guided script for steps that genuinely require a human.
- `$wait-what`: explain the current point more clearly using shared domain terms.
- `$teach`: stateful learning in the user's chosen workspace.
- `$writing-for-agents`: concise instructions and references for agents.
- `$setup-matt-pocock-skills`: configure tracker and domain-doc conventions when a workflow actually needs setup.
- `$retro`: an explicitly requested look at recurring failures or expensive rework, not an automatic last step.
- `$pr`: optional PR-body formatting reference for users who request a PR workflow. It is not part of local delivery and may not be installed.

For a real context boundary, [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) explains continue, clear, handoff, delegate, and compact. Follow the current environment's context management rather than fixed token-budget assumptions.
