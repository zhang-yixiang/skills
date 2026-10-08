# Engineering

## User-invoked

Explicit-only skills keep their policy in `agents/openai.yaml`.

- **[ask-matt](./ask-matt/SKILL.md)**: Choose an appropriate skill or local development flow for the user's task without requiring unnecessary planning or delivery stages.
- **[grill-with-docs](./grill-with-docs/SKILL.md)**: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **[improve-codebase-architecture](./improve-codebase-architecture/SKILL.md)**: Inspect existing architecture for evidence-backed simplifications or better module boundaries. Use for over-design, duplication, ownership friction, and hard-to-test behavior.
- **[retro](./retro/SKILL.md)**: Review a development session for recurring failures, costly rework, or avoidable friction and propose the smallest improvement to the working environment.
- **[setup-matt-pocock-skills](./setup-matt-pocock-skills/SKILL.md)**: Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
- **[to-spec](./to-spec/SKILL.md)**: Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.
- **[to-tickets](./to-tickets/SKILL.md)**: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
- **[triage](./triage/SKILL.md)**: Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs.
- **[wayfinder](./wayfinder/SKILL.md)**: Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.

## Model-invoked

Available for matching user requests and authorized workflows.

- **[code-review](./code-review/SKILL.md)**: Review a declared committed or working-tree change for correctness, requested behavior, and applicable repository standards. Use for local review, a branch or PR, uncommitted work, or changes since a fixed point.
- **[codebase-design](./codebase-design/SKILL.md)**: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
- **[diagnosing-bugs](./diagnosing-bugs/SKILL.md)**: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
- **[domain-modeling](./domain-modeling/SKILL.md)**: Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a GLOSSARY.md, or recording or editing an ADR.
- **[implement](./implement/SKILL.md)**: Implement a bounded piece of work from a request, spec, or ticket, validate it, and complete local delivery. Also supports a worker inside implement-spec.
- **[implement-spec](./implement-spec/SKILL.md)**: Implement an agreed multi-task plan or spec with dependencies, coordinate independent workers, and integrate verified work locally. Use for delivering a whole task graph; use implement for a single task.
- **[pr](./pr/SKILL.md)**: Use when writing a PR body.
- **[prototype](./prototype/SKILL.md)**: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
- **[research](./research/SKILL.md)**: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
- **[tdd](./tdd/SKILL.md)**: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
- **[wizard](./wizard/SKILL.md)**: Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.
