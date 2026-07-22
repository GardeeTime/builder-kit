# Pre-Code Gate — Mark Task Complete

*This is what running [`pre-code-gate`](../skills/pre-code-gate.md) against this feature's implementation plan would have produced, before any code was written. See [`04-retro.md`](04-retro.md) for why this didn't actually happen before the feature shipped.*

## Phase 1: Codebase Interrogation (condensed)

1. **Existing pattern:** grepped for similar per-resource update endpoints elsewhere in the app — none found. This is a new pattern, not an extension of something that already exists.
2. **Closest existing feature:** task creation (`POST /tasks`) — doesn't share logic with a per-resource update; building new is reasonable here.
3. **Riskiest shared code:** the in-memory `tasks` array is read by every endpoint. There is no per-user ownership field on tasks *at all* today.
4. **Already exists in some form:** no.
5. **Callers:** none yet — this is a new endpoint with no existing consumers.
6. **Baseline:** no test suite currently exists for `server.js` (greenfield app).

## Phase 2: Plan Critique

**Plan as submitted:** "Add `PATCH /tasks/:id/complete`. Find the task by id, set `done = true`, return `200`. Effort: S."

| # | Check | Verdict |
|---|-------|---------|
| Scope-creep check | Pass — one file, matches the plan |
| Assumption audit | **FAIL** — the plan has no step for verifying the caller owns the task, and Phase 1 confirmed tasks have no owner field today. "Does this user own this task" isn't even answerable yet, let alone checked. |
| Reversibility | Pass — toggling `done` is trivially reversible |
| Blast-radius disclosure | Pass — no other consumers exist yet |
| Effort-mismatch flag | **FAIL** — plan calls this "S," but Phase 1 shows there's no ownership model on tasks at all. Adding one is not the same size as flipping a boolean. |

## Phase 3: VERIFIED/ASSUMED Tagging + Adversarial Pushback

```
1. [VERIFIED — grepped codebase] No existing per-resource update endpoint pattern to extend.
2. [VERIFIED — read tasks array definition] Tasks currently have no userId or owner field.
3. [ASSUMED] It's fine to ship "complete" without an ownership check for Slice 1, since
   there's no auth/multi-user model wired up to check against yet anyway.
```

**Adversarial pushback, attacking step 3:**

> This is the plan's riskiest step, and it's ASSUMED, not VERIFIED. As written, any caller can complete any task by guessing or incrementing an ID — and with sequential integer IDs (confirmed in `server.js`), enumerating every task ID is trivial, not theoretical. "No auth model exists yet" is being used here to justify skipping the check, but that's backwards: no auth model existing yet means this ships wide open, not that the risk doesn't apply. Verify cheaply before writing code: does this slice need a minimal `userId` field added to tasks, or is that explicitly out of scope for Slice 1 — in which case the PRD's own open question ("403 or 404 when a task isn't yours") needs an answer *before* the endpoint is built, not discovered afterward in review.

## Outcome (as it should have gone)

Plan sent back with one addition before implementation starts: either (a) add a minimal `userId` field and an ownership check in this slice, or (b) explicitly descope ownership to a fast-follow ticket and say so in the PRD — but not silently ship neither.

See [`03-pr-review.md`](03-pr-review.md) for what actually happens when this step gets skipped and the code ships as originally planned anyway.
