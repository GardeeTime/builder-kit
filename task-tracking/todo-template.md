# Task Tracking Template — todo.md

A single running file that tracks active and queued work with an AI coding assistant. Keep it at the root of your task-tracking location (e.g. `tasks/todo.md`) and treat it as the shared source of truth for "what are we building and what's already decided."

## Format

Organize as a stack of initiative sections, separated by `---`, newest/active work at the top.

Each initiative gets an H1 heading naming its status and identifier:
- `# Current Task` — the one thing actively being worked on
- `# Done: [TICKET-ID] — [short name]`
- `# Queued: [TICKET-ID] — [short name]`

Under each heading:
- A short intro paragraph: one line describing the initiative, an approval note (who approved it and when), and a link to a fuller plan/spec doc if one exists.
- A **Branches:** line — which git branch(es), in which repo(s), cut from where.
- A **Key decisions:** line — a semicolon-separated list of locked product/technical decisions, so they don't get re-litigated later.
- One or more `## M[n]` milestone headings, each a markdown checklist of specific, concrete deliverables. Mark completed milestones with `— DONE [date] (commit/branch ref)`.
- A closing `## Results` section once work is done — commits/tests/verification status, what was verified end-to-end, and what's left for a human decision (manual click-through, go/no-go call).

## Example

```markdown
# Queued: PROJ-123 — Bulk export

**Plan approved by [you] on [date]** → full build spec in [`tasks/proj-123-implementation-plan.md`](proj-123-implementation-plan.md).

Branches: `you/proj-123-bulk-export` in `app` and `app-ui`, cut fresh from `origin/main`.

Key decisions: export runs behind a feature flag; capped at 10k rows per run; large-account edge case deferred to a follow-up ticket.

## Milestones (details in the plan doc)
- [ ] Backend M1 — export job + storage
- [ ] Backend M2 — rate limiting + tests
- [ ] UI M3 — export button + progress state
- [ ] Verify end-to-end locally → click-through → iterate → PRs

---
```

Why this format works: it survives context resets. A new session — human or AI — can read the top of the file and know exactly what's active, what's decided, and what's next, without re-deriving it from chat history.
