# PR Review — Mark Task Complete

Applying [`product-lens-pr-review.md`](../skills/product-lens-pr-review.md) and [`decision-mining-ledger.md`](../skills/decision-mining-ledger.md) to the actual diff in [`../demo/after/server.js`](../demo/after/server.js) — the same diff `demo/setup.sh` checks out as `feature/complete-task`.

Twelve lines, and **no frontend files at all**. That makes it a useful demonstration of the two rules that trip people up: Section 1 still applies to a backend-only diff, and Section 2 is the one allowed to come up empty.

---

## What would be posted

### 1. Product Experience

Nothing renders in this diff, so the question isn't what the screen looks like — it's who eventually feels this, and how they find out.

**Anyone can complete anyone else's task.** `server.js:34` looks the task up by ID alone — `tasks.find(t => t.id === id)` — with nothing tying it to the caller. Enumerate IDs and you can mark any task in the system done. There's no auth model in this slice at all, which is why this needs an explicit call rather than a quiet assumption: either scope the lookup to the caller now, or make "any caller can complete any task" a stated, accepted limitation before this merges.

**A successful complete returns an empty body, so the UI has nothing to render.** `server.js:38-39` writes a bare `200`. The frontend gets no updated task back and has to either refetch the whole list or guess at optimistic state. What does a user see between the click and the confirmation? Right now the answer depends entirely on what the frontend decides to do with nothing.

**Completing a task that doesn't exist looks identical to completing one that does.** The `if (task)` guard at `:35` skips the write and returns the same `200`. A caller acting on a task someone else deleted gets told it worked. Nobody finds out — not the user, not support, not a log.

### 2. Product Taste & Design Consistency

N/A, nothing renders.

### 3. Code & Technical Observations (Claude-assisted)

*Verified against `demo/after/server.js` at the head of `feature/complete-task`; the ownership hole is reproducible with two curl calls, documented in [`../demo/README.md`](../demo/README.md).*

**Claude flagged an inconsistency with the handler two above it.** `POST /tasks` returns the created object at `:26`. This endpoint returns nothing. Same file, same resource, two different contracts — returning the updated task costs one line and settles what the UI shows after a click.

The route matcher is the right shape and worth saying so: anchored, digits-only, and it returns rather than falling through, so the existing 404 at `server.js:43` still catches everything else.

**Nothing covers this endpoint.** No test asserts that a valid ID flips `done`, that an unknown ID behaves as intended, or that a non-PATCH verb on the same path still 404s. The endpoint is small enough that the tests are shorter than the handler.

### 4. Analytics & Event Tracking

**`task_completed` doesn't fire anywhere in this diff**, but [`01-prd.md`](01-prd.md) names it as the primary success metric under "How We'll Measure." As written, the slice ships with no way to measure the thing the PRD says it's for. Deliberately deferred, or missed?

## Questions

1. Is the silent no-op on a missing task ID intended, or should it 404?
2. What should the UI show between click and confirmation — a spinner then nothing, or an immediately updated row?

---

## What doesn't get posted

The missing-task-ID behavior isn't a bug. The code does something reasonable, and no finding engine would report it, because nothing is broken. But it decides what a caller sees when they act on a task that's already been deleted — a product question wearing implementation clothes.

That kind of item goes to the product owner **before** the review posts, not to the author as an open shrug. It comes back as either a directive in the reviewer's own voice or a numbered question, and it never ships as a "your call" label for the author to ignore. Here it came back as Question 1.

---

## Decision-Mining Ledger

The companion skill mines the same diff for decisions rather than defects, and formats them for explicit sign-off:

| # | Where | The Decision (as a question) | Ships Today If Left Alone | Approve / Reject |
|---|-------|-------------------------------|----------------------------|-------------------|
| 1 | `server.js`, PATCH handler | If the task ID doesn't exist, this silently returns success instead of a 404 — approve treating "complete a task that isn't there" as a quiet no-op, or should it error? | The caller has no way to know their request did nothing. | [ ] Approve &nbsp; [ ] Reject |
| 2 | `server.js`, PATCH handler | There's no check that the caller owns the task being completed — any caller can complete any task by ID. Approve leaving this open (no auth model exists yet), or should this block merge until ownership is added? | Any task can be completed by anyone who can guess or enumerate an ID — confirmed reproducible in [`../demo/README.md`](../demo/README.md). | [ ] Approve &nbsp; [ ] Reject |

Both of these are exactly what [`02-pre-code-gate.md`](02-pre-code-gate.md)'s adversarial pushback flagged, before a line of this code existed. See [`04-retro.md`](04-retro.md) for why they shipped anyway.
