## What it does

`improve-codebase-architecture` surveys existing code in two distinct modes. You choose the question; the skill chooses the matching process.

| Mode | The question it answers | Output | Where it stops |
| --- | --- | --- | --- |
| **Subtractive audit** | "Which existing mechanisms can we remove, collapse or replace for a real net reduction?" | A concise text report grounded in owners, consumers and repository contracts. | After the report, with no files changed. "No justified simplifications" is a valid result. |
| **Deepening survey** | "Which shallow modules should become deeper so this code is easier to test and change?" | A self-contained HTML report with visual before/after candidates. | At your choice of candidate; it then [grills](https://www.aihero.dev/ai-coding-dictionary/grilling) through that idea only if you continue. |

Neither mode implements a refactor. The subtractive audit is entirely read-only. The deepening survey first writes one HTML file in your OS temp directory; if you later choose a candidate, its decision conversation may sharpen `CONTEXT.md` or offer an ADR, while product-code changes still happen in a separate [session](https://www.aihero.dev/ai-coding-dictionary/session) through the normal build flow.

Both modes start from the repository's own rules, domain model and ADRs. Generic signs such as an unused wrapper or a defensive branch are only leads: current production consumers and local contracts decide whether a mechanism is removable. Both also apply the **deletion test** — does the proposed change actually concentrate or eliminate complexity, or merely spread it across callers?

## When to reach for it

You invoke this by typing `/improve-codebase-architecture` — the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) will not reach for it on its own.

It sits outside the build loop — it is not a mandatory step in the main loop but something you run deliberately to queue up better work. The situations it gets used in:

| Situation | How it is used |
| --- | --- |
| Simplification audit | Ask explicitly for over-design, duplicate owners, dead machinery, unnecessary fallbacks or speculative abstractions. This selects the read-only subtractive mode. |
| Routine architecture upkeep | Use the deepening survey every few days, or whenever a spare moment appears, to stop structure rotting between features. |
| Before a big build | Point the deepening survey at the [spec](https://www.aihero.dev/ai-coding-dictionary/spec): "how can we make this change easy?" |
| Brownfield audit | Choose the question first: subtractive for net deletion, deepening for better seams in a large, unstructured or [vibe-coded](https://www.aihero.dev/ai-coding-dictionary/vibe-coding) repo. |
| Legacy test work | Use the deepening survey to find missing seams before writing tests against untestable code. |

Where it is confusable with siblings:

- For designing one module you have already chosen, use [codebase-design](https://aihero.dev/skills-codebase-design) — that is the bench, this is the survey that finds what to put on it.
- For reviewing a branch, pull request or diff since a fixed point, use [code-review](https://aihero.dev/skills-code-review). The subtractive audit is about existing-code diagnosis, not a second review gate.
- For a whole effort too big to hold in one session, use [wayfinder](https://aihero.dev/skills-wayfinder).
- For "this specific thing is broken," use [diagnosing-bugs](https://aihero.dev/skills-diagnosing-bugs). It hands back here when the real finding is that there is no good seam to lock the bug down.

## Prerequisites

None to run it. It reads `CONTEXT.md` and any ADRs in `docs/adr/` if they exist, and speaks in your domain's own nouns when they do — a candidate reads as "deepen the Order intake module," not "refactor the FooBarHandler."

The subtractive mode writes nowhere: it returns a text report in the conversation and stops. The deepening report goes to `<tmpdir>/architecture-review-<timestamp>.html`, outside the repo. During its later grilling loop it may add or sharpen terms in `CONTEXT.md`, creating that file if it does not exist, and offer to record a rejected candidate as an ADR so a future run does not re-suggest it.

## Subtractive mode: evidence before deletion

Subtractive mode looks for mechanisms whose maintenance cost no longer buys a current contract: no production consumer, two owners for one fact, an unused seam or extension point, speculative configuration, duplicated invariant protection, or a custom mechanism that a maintained dependency can replace with a genuine net deletion.

Shape alone is never enough. A fallback may protect browser support; a concurrency guard may protect a reachable interaction; a compatibility layer may have an external consumer. The audit traces call sites, classifies consumers as production, non-production or ambiguous, and checks the applicable repository rules and ADRs before recommending anything.

Each surviving candidate states the signal, concrete evidence, current owner and consumers, repository contract, smallest complete simplification, observable behavior trade-off, net reduction, confidence and decision owner. It reports only `Strong` or `Worth exploring` items, followed by representative mechanisms it retained and why. If nothing survives, it says so directly instead of manufacturing cleanup work.

It does not edit code, TODOs, specs, tests, `CONTEXT.md` or ADRs; it does not generate HTML, start a grilling loop, label review blockers or compete with [code-review](https://aihero.dev/skills-code-review). Any implementation or contract change begins only after a new explicit request.

## Deepening mode: depth, and the report that hunts for it

The skill turns on one idea: **depth**. A deep module puts a lot of behaviour behind a small, stable interface. A shallow one leaks its implementation through an interface nearly as wide as the code beneath it. The report is a hunt for shallowness — pure functions extracted only for testability while the real bugs live in how they are called (no **locality**), modules leaking across their **seams**, a concept you cannot understand without opening five files — and a proposal for the deepening that fixes it.

Each candidate is a card: the files involved, the friction, a plain-English solution, the benefit stated in terms of **locality** and **leverage**, a before/after diagram, and a strength badge.

| Badge | What it means for you |
| --- | --- |
| `Strong` | The deletion test passes clearly and the friction is real. Take these seriously. |
| `Worth exploring` | Plausible deepening, but the payoff depends on where the code is going next. |
| `Speculative` | Surfaced for completeness. Most of these are safe to ignore. |

The report ends with a **Top recommendation** — the one it would tackle first — and then the skill stops and asks which candidate you want to explore. Nothing has been decided at that point, and no code has moved.

## What happens after you pick a deepening candidate

Picking a candidate starts a [grilling](https://aihero.dev/skills-grilling) session over it: constraints, what sits behind the seam, which tests survive, what the deepened interface should look like. The output of that session is a decision, not a diff. From there the normal flow applies — take the decision into [to-spec](https://aihero.dev/skills-to-spec), then [to-tickets](https://aihero.dev/skills-to-tickets), then [implement](https://aihero.dev/skills-implement).

## Common questions

**It grilled me for an hour about one idea instead of showing me options. Can I turn that off?**

Yes. The subtractive mode never grills: ask for a "read-only subtractive audit" and it returns the evidence report, then stops. In deepening mode, the HTML report must come first and the grill starts only after you choose a candidate; say "stop after the report" if you do not want that follow-up. This explicit split addresses the recurring failure where a [model](https://www.aihero.dev/ai-coding-dictionary/model) interviewed the user about its first idea instead of presenting options.

**The report opened as unstyled raw HTML with no diagrams. What happened?**

The report loads Tailwind and Mermaid from CDNs, so it needs network access when you open it, and it breaks silently when something blocks those scripts. The filed case was a security hook demanding SRI hashes: the agent added them, the CDN served different bytes to the browser than to the `curl` used to compute the hash, and the browser blocked the script. Offline and locked-down environments hit the same wall. The agent cannot see this, because it never renders the page. The workaround is to ask for inline CSS and hand-built SVG diagrams instead of the CDN scaffold. This is an open issue and a real rough edge.

**It gave me twelve candidates. Do I work through them in the same session or start a new one?**

Subtractive mode should not do that: it is required to keep only `Strong` and `Worth exploring` candidates and prefer "no justified simplifications" over thin guesses. For a deepening report, take one candidate per session. Working through several in one conversation fills the [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) with the report, the grilling, the domain-model edits and the code changes all at once. Carry the chosen candidate into `/to-spec`, and turn the rest into [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket) you can pick up independently later.

**How should I prompt it?**

Name both the mode and the area. For reduction work, try "run a read-only subtractive audit of our authentication adapters; find only simplifications with current consumer evidence." Before a big build, point the deepening survey at the spec and ask "how can we make this change easy?" An unqualified invocation keeps the original deepening behavior, but naming a direction makes either report more actionable.

**Does it work on a large legacy codebase?**

Partly. It is strong on big existing codebases lacking consistent structure, and it is the recommended upkeep mechanism after any one-time structural setup. The honest counterweight: users with genuinely out-of-control projects report it "helped a little but still doesn't seem to cut it," and one developer with an eight-year legacy codebase reported the model going in circles where the same skill produces a clean graph on a tidy repo. There is no dedicated `/refactor` skill for that case yet. If the codebase has no shared vocabulary at all, [grill-with-docs](https://aihero.dev/skills-grill-with-docs) to establish one first tends to make this skill's output much better.

**How is this different from `/codebase-design`?**

`/codebase-design` is a reference, not a session driver. It supplies the vocabulary — module, interface, depth, seam, adapter, leverage, locality — and this skill borrows it. Pointing a fresh agent at `/codebase-design` as the thing to "do" is a known failure: with no process of its own to follow, the agent invents one, re-explores code and runs for a very long time before asking you anything. Drive with this skill; consume that one.

**Will it ever tell me the codebase is fine?**

Yes. The subtractive audit must return **No justified simplifications found in scope** when no candidate survives its consumer, contract and net-reduction checks. That is a successful result, not a failure to complete the task. Deepening mode still has a discovery bias; an HTML report whose candidates are all `Speculative` is weak evidence for taking action.

**Does it work in Codex or another harness?**

The instructions are [harness](https://www.aihero.dev/ai-coding-dictionary/harness)-neutral. Subtractive mode names no delegation API. Deepening mode asks for a sub-agent without naming a vendor-specific tool, so each harness can use its own mechanism; without delegation, the scan has to run in the main context and broad surveys may be less thorough.

**How do I actually implement deep modules in TypeScript?**

There is no good answer shipped with the skill. The recurring request is for a `TYPESCRIPT.md` giving concrete file and module layouts for the principles, and it does not exist. The skill will tell you where a deepening belongs and what should sit behind the seam; translating that into a package or directory structure is currently on you.

## It's working if

- The selected mode is obvious from the output, and a branch or diff review is redirected to `code-review`.
- Subtractive candidates cite current owners, classified consumers and repository contracts, and demonstrate a net reduction rather than moving complexity elsewhere.
- Subtractive mode changes no files, stops after its text report, and is willing to return "No justified simplifications found in scope."
- Deepening candidates name your domain's concepts, cluster in actively changing code, and explain the payoff as locality or leverage rather than merely saying "this is cleaner."
- Deepening mode writes only the HTML report before asking which candidate you want; it does not begin grilling on its own.
- Rejecting a deepening candidate for a durable reason gets you an offer to record an ADR, so the next run does not re-suggest it.

## Where it fits

`improve-codebase-architecture` is **intentional codebase maintenance**, outside the feature-build chain. Subtractive mode is the read-only lens for existing complexity; deepening mode is the periodic survey that queues up better seams. A chosen idea re-enters the main build flow at [grill-with-docs](https://aihero.dev/skills-grill-with-docs) or [to-spec](https://aihero.dev/skills-to-spec), while changes already present in a diff go to [code-review](https://aihero.dev/skills-code-review).

Its neighbours remain [codebase-design](https://aihero.dev/skills-codebase-design), which owns the depth-and-seam vocabulary, [grilling](https://aihero.dev/skills-grilling), which walks a selected deepening decision, and [domain-modeling](https://aihero.dev/skills-domain-modeling), which keeps `CONTEXT.md` and ADRs current as that decision settles. For which mode or sibling fits a situation, [ask-matt](https://aihero.dev/skills-ask-matt) is the router over the whole set.
