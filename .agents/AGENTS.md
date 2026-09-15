# .agents/AGENTS.md

## Scope

- These rules govern only `.agents/**`.
- Write agent-facing Markdown in English and treat all content except this file and repo-local skills as non-authoritative work state or history.
- Do not duplicate root policy, project facts, public copy, or detailed runtime documentation here.

## Owners

- `execplans/active/`: current bounded plans, with at most one file per outcome.
- `execplans/archive/`: non-current plans; never execute them as current instructions.
- `research/`: reusable advisory synthesis, never accepted project truth.
- `evidence/`: retained proof, never normative decisions.
- `deferred/`: inactive project-owned future work; use `$deferred-note-steward` and never treat it as current.
- `skills/`: narrowly triggered repo-local workflows.

Create optional folders only with their first qualifying artifact.

## Maintenance

- Create a durable plan only when the user requests one or interacting, cross-cutting, or risky work needs a persistent execution contract. Use `$goal-checklist-builder` to author or materially revise it.
- Every active plan needs an immutable ISO 8601 `created_at` timestamp with an explicit UTC offset.
- Before reading or resuming active plans, move every file at least 24 hours old to archive, add `archived_at`, and never move it back. Continuing work gets a fresh active successor containing only remaining work.
- When a plan finishes earlier, promote accepted truth to `docs/**`; delete the plan if it has no lasting continuity value, otherwise archive it as history.
- Active progress lives only in the active plan. Archived plans, research, evidence, and reports cannot override `docs/PROJECT.md` or another canonical owner.
- Promote durable conclusions to `docs/PROJECT.md` or the detailed canonical owner and resolve material contradictions before consequential work.
