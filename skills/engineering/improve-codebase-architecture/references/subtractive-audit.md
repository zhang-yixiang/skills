# Subtractive audit

Find evidence-backed ways to remove, collapse, or replace existing machinery. Inspect the requested area and its current contracts; do not expand an audit into implementation without authorization.

For each promising candidate:

1. Identify the fact, state, behavior, or invariant the mechanism owns.
2. Trace current consumers. Distinguish production paths, tests/examples, and uncertain usage. Absence of a caller is a lead, not permission to remove a supported contract.
3. Check repository guidance and ADRs. A fallback, concurrency guard, security check, or compatibility path may protect a contract outside the immediate file.
4. Describe the smallest complete alternative and any observable change.
5. Compare net maintenance cost across code, tests, docs, configuration, migration, and new glue. Reject changes that merely move complexity or cost more than they remove.

Report concrete locations and call paths, the governing contract, the proposed simplification, its trade-off, and confidence. Keep only candidates worth acting on or investigating. Mention justified mechanisms that should remain when that helps explain the result. If none survive, say so.

This is a diagnosis, not a review gate or a demand to delete code. Do not generate TODOs, edit contracts, or start a design interview just to complete the audit.
