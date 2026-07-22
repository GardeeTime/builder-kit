# PRD: Mark Task Complete

**Author:** Jordan (PM) | **Date:** 2026-06-01 | **Status:** Approved
**Timebox:** 3 days | **Slices:** 1

---

## The Bet

**Problem:** Users can create tasks but have no way to mark them done — every list just grows forever. Three support tickets this month asked some version of "how do I check something off."

**Who:** Any logged-in user managing their own task list (see `personas.md`).

**Evidence:**
- 3 support tickets in the last 30 days asking for a "done" checkbox
- Dogfooding users manually delete tasks instead of completing them, losing their history
- Every comparable competitor tool treats this as table stakes

**Solution:** Add a "mark complete" action on each task. Completed tasks stay visible but visually distinct — no separate archive flow yet.

**Why Now:** Cheapest possible fix for the #1 recurring support complaint. Low complexity, high visible payoff.

**Success Looks Like:**
- Primary: % of active users completing ≥1 task/week rises
- Secondary: support tickets about "checking off tasks" drop to zero
- Guardrail: no regression to task list load time

**Risk of Not Shipping:** Support ticket volume keeps growing; users self-select toward a competitor with basic completion support.

---

## Validation Before Build

**Core Assumption to Test:** Users want an in-place "complete" toggle, not a separate archive flow.

**Quick Test:** Showed a static mock of the checkbox in this week's regularly-scheduled user interviews (no code written).

**Success Signal:** Unprompted positive reaction in ≥3/5 interviews.

**Kill Signal:** Users say they'd rather just delete tasks.

**Status:** [x] ✓ Validated - proceed

**Results:** 4 of 5 users reacted positively unprompted ("finally"); 1 neutral. Proceeding.

---

## What We're Shipping

### Slice 1 (MVP - Week 1)

**Delivers:** A working complete/incomplete toggle per task, persisted server-side.

**Requirements:**
- [ ] An endpoint marks a task complete
- [ ] Completing a task the current user doesn't own is rejected
- [ ] Completing a task ID that doesn't exist returns a clear error, not a silent success
- [ ] Completed tasks show a visually distinct "done" state in the list, not removed from it

**What We're NOT Doing:** No "un-complete" toggle yet. No bulk-complete. No completion timestamp shown in the UI yet.

**Scope Decisions:**

| Feature | In/Out | Why |
|---------|--------|-----|
| Mark complete | ✓ In | The actual ask |
| Un-complete | ✗ Out | Nobody's asked yet; add if requested |
| Bulk actions | ✗ Out | Different feature, different PRD |

### Slice 2+ (Future)

**Next:** Un-complete toggle, completion timestamps, bulk actions.

**Deferred:** Completion notifications.

---

## How We'll Measure

**Events to Track:**

| Event | When | Properties | Why |
|-------|------|------------|-----|
| `task_completed` | user marks a task done | `task_id` (string), `user_id` (string) | tracks the primary adoption metric above |

**Dashboard:** [internal analytics link]

---

## Launch

**Rollout:** Direct to 100% — low risk, no flag needed for a Slice 1 this small.

**Docs Needed:** One-line changelog entry.

**Champagne Feedback:** Ask the 5 interviewed users to try it first.

**Review:** 1 week after ship.

---

## Risks & Open Questions

**Risks:**
- Ownership needs to be checked correctly, or one user could complete another user's tasks — mitigation: an explicit requirement + a spec-locked test for it.

**Need to Figure Out:**
- [ ] Should completing someone else's task return a 403 or a 404? — Jordan

---

## Reference

**Designs:** [Figma link]

**Customer Quotes:**

> "Finally — I don't have to delete something just to feel done with it." - Sam, beta user

**Related:** [`../demo/`](../demo/) — this repo's own runnable version of this exact feature.
