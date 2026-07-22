# PR Review — Mark Task Complete

Applying [`product-lens-pr-review.md`](../pr-review/product-lens-pr-review.md) and [`decision-mining-ledger.md`](../skills/decision-mining-ledger.md) to the actual diff in [`../demo/after/server.js`](../demo/after/server.js) — the same diff `demo/setup.sh` checks out as `feature/complete-task`.

---

## 1. Product Experience Review

- Completing a task returns an empty `200` with no response body — the frontend has nothing to update the row with. What does a user actually see happen when they click "complete"?
- No confirmation of any kind on success. Is a spinner-then-nothing the intended experience?

## 2. Product Taste & Design Consistency

N/A — this slice is backend-only; no UI changed in this diff.

## 3. Code & Technical Observations (Claude flagged)

- No test coverage added for the new endpoint.
- `id` is parsed with `Number(...)` with no validation — a non-numeric or absurd value doesn't get rejected explicitly, it just fails to match any task and falls through silently.
- Completing a task ID that doesn't exist returns `200`, not `404` — it silently no-ops instead of telling the caller anything went wrong.

## 4. Analytics & Event Tracking

- No `task_completed` event fires anywhere in this diff, despite the PRD naming it as the primary success metric (see [`01-prd.md`](01-prd.md), "How We'll Measure"). This ships with no way to measure the thing the PRD says it needs to measure.

---

## Decision-Mining Ledger

| # | Where | The Decision (as a question) | Ships Today If Left Alone | Approve / Reject |
|---|-------|-------------------------------|----------------------------|-------------------|
| 1 | `server.js`, PATCH handler | If the task ID doesn't exist, this silently returns success instead of a 404 — approve treating "complete a task that isn't there" as a quiet no-op, or should it error? | The caller has no way to know their request did nothing. | [ ] Approve &nbsp; [ ] Reject |
| 2 | `server.js`, PATCH handler | There's no check that the caller owns the task being completed — any caller can complete any task by ID. Approve leaving this open (no auth model exists yet), or should this block merge until ownership is added? | Any task can be completed by anyone who can guess or enumerate an ID — confirmed reproducible in [`../demo/README.md`](../demo/README.md). | [ ] Approve &nbsp; [ ] Reject |

Both of these are exactly what [`02-pre-code-gate.md`](02-pre-code-gate.md)'s adversarial pushback flagged, before a line of this code existed. See [`04-retro.md`](04-retro.md) for why they shipped anyway.
