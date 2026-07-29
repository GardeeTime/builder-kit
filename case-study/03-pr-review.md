# PR Review — Mark Task Complete

Applying [`product-lens-pr-review.md`](../skills/product-lens-pr-review.md) and [`decision-mining-ledger.md`](../skills/decision-mining-ledger.md) to the actual diff in [`../demo/after/server.js`](../demo/after/server.js) — the same diff `demo/setup.sh` checks out as `feature/complete-task`.

The diff is 12 lines, so this took the **short path**: read directly, no finding engine, no per-finding verifiers. Step 5 still applied to the one blocker. What follows is the output shape the skill produces — a TLDR, one credit line, and a single labeled findings list, not one section per lens.

---

## What would be posted

**Verdict:** Needs a fix before this merges
**To approve:** (1) scope the PATCH to tasks the caller owns; (2) return the updated task in the response body.
**The one thing:** any caller can complete any task by guessing its ID — there's no ownership check, and it's reproducible with two curl calls.
**Verified:** ran the branch and reproduced the cross-caller complete · no tests exist for this endpoint to re-run
**Scope:** `demo/after/server.js` on `feature/complete-task`. Backend only — no UI changed in this diff.

The route matcher is the right shape: anchored, digits-only, and it returns rather than falling through, so the existing 404 at `server.js:43` still catches everything else.

**[Blocks merge] Anyone can complete anyone else's task.** `server.js:34` looks the task up by ID alone — `tasks.find(t => t.id === id)` — with nothing tying it to the caller. Enumerate IDs and you can mark any task in the system done. There's no auth model in this slice at all, which is why this needs an explicit call rather than a quiet assumption: either scope the lookup to the caller now, or make "any caller can complete any task" a stated, accepted limitation before this merges.

**[Fix before ship] A successful complete returns an empty body, so the UI has nothing to render.** `server.js:38-39` writes a bare `200`. The frontend gets no updated task back and has to either refetch the whole list or guess at optimistic state — and `POST /tasks` two handlers up already returns the created object (`:26`), so this endpoint is inconsistent with the one next to it. Returning the updated task costs one line and settles what the UI shows after a click.

**[Follow-up] Nothing covers this endpoint.** No test asserts that a valid ID flips `done`, that an unknown ID behaves as intended, or that a non-PATCH verb on the same path still 404s. The endpoint is small enough that the tests are smaller than the handler.

## Questions

1. `task_completed` doesn't fire anywhere in this diff, but [`01-prd.md`](01-prd.md) names it as the primary success metric under "How We'll Measure." Was that deliberately deferred, or missed? As written, the slice ships with no way to measure the thing the PRD says it's for.
2. What should the UI show between click and confirmation — is a spinner-then-nothing the intended experience, or should the row update immediately?

---

## What stayed in the internal block

Not posted. The decision below is a product call, so it goes to the product owner first — not to the author as an open shrug.

```
--- FOR YOU, NOT POSTED ---

**Round** — 1
**Path** — short: 12 lines read directly, no engine

**Decisions — need your pick before this posts**
- D1 — completing a task ID that doesn't exist returns 200, not 404: the `if (task)` guard at :35 skips
       the write and the response is identical either way. Silence ships the silent no-op.

**Lens 1 yield** — 2 findings (empty response body, no post-click feedback)
**Placement** — 3 inline · 0 body · 0 replies
---
```

D1 is the one worth dwelling on. It isn't a bug — the code does something reasonable — and no finding engine would report it, because nothing is broken. But it decides what a caller sees when they act on a task that's already been deleted, and that's a product question wearing implementation clothes. Whichever way it's answered, it gets posted as a directive in the reviewer's voice or as a numbered question; it never ships as a "your call" label for the author to ignore.

---

## Decision-Mining Ledger

The companion skill mines the same diff for decisions rather than defects, and formats them for explicit sign-off:

| # | Where | The Decision (as a question) | Ships Today If Left Alone | Approve / Reject |
|---|-------|-------------------------------|----------------------------|-------------------|
| 1 | `server.js`, PATCH handler | If the task ID doesn't exist, this silently returns success instead of a 404 — approve treating "complete a task that isn't there" as a quiet no-op, or should it error? | The caller has no way to know their request did nothing. | [ ] Approve &nbsp; [ ] Reject |
| 2 | `server.js`, PATCH handler | There's no check that the caller owns the task being completed — any caller can complete any task by ID. Approve leaving this open (no auth model exists yet), or should this block merge until ownership is added? | Any task can be completed by anyone who can guess or enumerate an ID — confirmed reproducible in [`../demo/README.md`](../demo/README.md). | [ ] Approve &nbsp; [ ] Reject |

Both of these are exactly what [`02-pre-code-gate.md`](02-pre-code-gate.md)'s adversarial pushback flagged, before a line of this code existed. See [`04-retro.md`](04-retro.md) for why they shipped anyway.
