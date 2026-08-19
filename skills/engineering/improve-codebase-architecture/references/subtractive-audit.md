# Subtractive audit

## Objective

Find a small number of evidence-backed ways to remove, collapse, or replace existing machinery without inventing a new architecture. This is a read-only diagnosis of the current codebase, not a review gate or an implementation pass.

A successful audit may conclude that there are **no justified simplifications** in scope. Prefer that conclusion over filling the report with weak guesses.

## Scope and authority

- Inspect the current working tree and the area the user named. If the request is to review a branch, pull request, or diff from a fixed point, hand it to `$code-review` instead.
- Read the applicable `AGENTS.md` files, `CONTEXT.md`, ADRs, owner documents, and repo-local skills before judging a mechanism. Those sources define the repository's contracts; this audit does not replace them.
- Treat historical specs, tests, examples, and comments as evidence. They do not, by themselves, prove that a production consumer or current product contract exists.
- Trace current call sites and reachable flows. Classify every consumer as **production**, **non-production** (tests, fixtures, examples, docs, scripts), or **ambiguous**.
- Keep exploration broad enough to find the real owner, but keep the report inside the user's requested scope.

## Evidence loop

For each suspected mechanism:

1. Name the mechanism and the fact, state, or invariant it currently owns.
2. Find its callers and consumers, then classify them as production, non-production, or ambiguous.
3. Identify the repository contract that requires it, if one exists.
4. Describe the smallest direct shape that could replace it.
5. Compare net maintenance surface: code, tests, docs, configuration, migration work, and new glue.
6. Apply the deletion test: does the change remove complexity, or merely move it into callers?

Useful signals include:

- no production consumer, with references only from tests, fixtures, examples, or docs;
- multiple representations or owners of the same fact;
- an unused seam, wrapper, adapter, configuration surface, or extension point;
- speculative generality for callers or variants that do not exist;
- a fallback, compatibility path, or defensive state with no reachable or documented contract;
- duplicated validation, lifecycle handling, or invariant protection;
- a maintained dependency or platform primitive that would yield a clear net deletion.

Signals are leads, not verdicts. Reject or downgrade a candidate when:

- a production caller makes removal a product or compatibility decision;
- an applicable ADR, repository rule, or current contract justifies the complexity;
- the proposed replacement adds comparable glue, state, configuration, or migration cost;
- the deletion test fails because complexity only moves elsewhere;
- consumer evidence is ambiguous; or
- the saving is too small to justify churn.

Do not assume a fallback, compatibility branch, concurrency guard, or security check is over-defensive from its shape alone. These mechanisms often protect contracts that live outside the immediate file.

## Report

Return a concise text report. Start with the inspected scope and the contract sources consulted. Include only `Strong` and `Worth exploring` candidates; do not add speculative filler.

For each candidate, report:

- **Signal** — what suggested unnecessary complexity.
- **Evidence** — concrete `file:line` references, call sites, and reachable flows.
- **Owner and consumers** — the current owner plus production, non-production, and ambiguous consumers.
- **Repository contract** — the local rule, ADR, or product behavior that constrains the decision.
- **Simplification** — the smallest complete removal, collapse, or replacement.
- **Behavior trade-off** — anything observable that would disappear or change.
- **Net reduction** — what code, tests, docs, configuration, or glue would actually go away.
- **Confidence** — `Strong` or `Worth exploring`, with the uncertainty stated.
- **Decision owner** — who must authorize any behavior or contract change.

End with **Retained mechanisms**: representative items that looked suspicious but are justified by a production consumer or repository contract. If no candidate survives the evidence loop, say **No justified simplifications found in scope** and explain the strongest reasons.

## Boundaries and completion

This mode does not:

- edit code, tests, configuration, TODOs, specs, `CONTEXT.md`, or ADRs;
- generate the HTML deepening report or start a grilling loop;
- classify findings as blocking review failures;
- create a second review workflow alongside `$code-review`; or
- change repository contracts on the user's behalf.

Stop after the report. Implementation, contract changes, or a deeper design session require a new explicit request from the user.
