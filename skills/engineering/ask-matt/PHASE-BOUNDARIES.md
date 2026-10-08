# Context boundaries

Keep useful primary context while it remains effective. Follow the runtime's actual context management and compaction behavior; do not impose a fixed token budget or forbid compaction mid-task.

- Continue when the current context still helps the next step.
- Clear only when the next task does not need the current reasoning and relevant decisions already have durable sources.
- Use `$handoff` when work moves to another session, directory, harness, or person and needs a portable summary. Include source pointers rather than duplicating whole documents.
- Delegate a bounded independent task when it improves the work and the current runtime and user authorize it. Being runnable unattended is not itself authorization or a reason to create another agent.
- Compact when the runtime requires it or accumulated context impedes progress. Preserve the goal, settled decisions, exact work state, evidence, and remaining work; then continue the same task.

Every summary is selective. Important decisions should remain traceable to their original specification, source, or conversation rather than becoming unsupported claims in a handoff.
