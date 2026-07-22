---
name: blast-radius-gate
description: "Blast Radius Gate: a pre-build checkpoint that runs after a PRD is approved and before an implementation plan is written, closing the gap that feature flags don't cover — lateral risk, i.e. what else silently breaks because it shares a model, table, component, or background job with the code about to be touched. Produces a concrete dependency map of everything that touches the same shared surface, uses that map to assign the change a risk tier (Tier 1 isolated, Tier 2 scoped/reversible, Tier 3 auth/billing/migration/cross-tenant/no-undo), and for Tier 3 requires a named engineer to pair BEFORE implementation starts rather than reviewing the diff after the fact. Run it on every feature that touches shared state, not just the ones that look risky — the whole point is that a non-engineer reading a diff alone can't see what else depends on it. Trigger on: 'run the blast radius gate', 'what else does this touch', 'check blast radius', 'dependency check before I build this', 'what shares this model', 'is this safe to build', 'lateral risk check', 'does this need a pairing session'."
---

# Blast Radius Gate

Maps everything that shares state with a proposed change, tiers the change by lateral risk, and — for the highest tier — requires a named engineer to confirm the approach before code gets written, not after.

## Why this exists

Feature flags answer one question: will users see this change, and can we turn it off if they don't like it. That's forward risk, and it's already well covered. Nothing in most repos answers the other question: what else — sharing a model, a table, a component, or a background job with the code being touched — breaks silently when this ships. That's lateral risk, and a flag wrapped around the new code does nothing to protect the old code sitting next to it in the same table or triggered by the same event.

A non-engineer reviewing a diff can tell that a form now has a new field. They cannot tell that the same `[ModelName]` row is also read by a nightly reconciliation job, or that the shared `[ComponentName]` component is rendered on three other screens with different assumptions about its props. This gate makes that visibility explicit and repeatable, before an implementation plan gets written — not as a "consider side effects" reminder, but as an actual artifact: a dependency list, a tier, and, for the riskiest tier, a named person who has agreed to the approach before a line of code exists.

## When to run

Run this once per PRD, immediately after the PRD is approved and before writing the implementation plan or milestone breakdown. Re-run it if the approach changes materially mid-build (e.g., the plan pivots from "add a column" to "backfill and drop a column").

Trigger it any time:
- A PRD has just been approved and you're about to break it into milestones
- The change touches a model/table, component, or job you know — or suspect — is shared
- Someone asks "what else does this touch" or "is this safe to build"

Skip it only for changes that are unambiguously additive and isolated — e.g., a brand-new page backed by its own new table, with no shared component in the render tree. If you're not sure whether it's isolated, that uncertainty is itself the reason to run the gate.

## Step 1: Name the surface area

Before mapping dependencies, write down — one line each — every distinct piece of surface the PRD's change will touch. Pull this straight from the PRD's stated scope, not from guessing at implementation:

- Model(s) / table(s) read or written
- Controller(s) / API endpoint(s) / route(s) added or modified
- Frontend component(s) added or modified
- Background job(s) / scheduled task(s) touched
- Event(s) / webhook(s) emitted or consumed

If the PRD doesn't specify this clearly enough to list it, that's a gap in the PRD — resolve it before proceeding. Don't guess at scope to keep moving.

## Step 2: Build the dependency map (the artifact)

For each item named in Step 1, actually walk the codebase and list what else depends on it. This is the deliverable of the gate — a short, specific list with real file paths, not a paragraph of caveats.

**1. Other features/controllers that touch the same model:**
```bash
grep -rln "[ModelName]" [app_dir] | grep -v [files_this_PRD_already_touches]
# or search the underlying table name directly if the model wraps it:
grep -rln "[table_name]" [app_dir]
```
(Add extension filters for your language if the directory mixes file types, e.g. `--include="*.[ext]"`.)
List each hit as `[file] — [what it does with the model: reads / writes / which field]`.

**2. Other jobs that read/write the same table:**
```bash
grep -rln "[ModelName]\|[table_name]" [jobs_or_workers_dir]
```
For each job found, note whether it runs on a schedule, on an event, or on-demand — a scheduled job that runs nightly and silently reads stale or half-migrated data is a materially different risk than a job a user triggers and can watch fail.

**3. Other frontend components that render the same shared component:**
```bash
grep -rln "[ComponentName]" [frontend_src_dir]
```
For each usage found, note the parent screen or flow — a shared component that changes props or behavior for one caller can silently break another caller's assumptions.

**4. Other listeners on the same webhook/event:**
```bash
grep -rln "[event_name]" [app_dir]
```
List every listener, not just the one this PRD adds. An event with three consumers means the change is really four changes if the payload shape moves.

Consolidate the results into one table. This table is the artifact — the thing you produced, not a description of a process you ran:

| Shared surface | What else touches it | Risk if it breaks |
|---|---|---|
| `[ModelName]` model | `[FeatureX]` controller, `[JobY]` (nightly) | [one line: what a user or downstream process would actually experience] |
| `[ComponentName]` component | `[ScreenA]`, `[ScreenB]` | [one line] |
| `[event_name]` event | `[ListenerA]`, `[ListenerB]` | [one line] |

If you can't fill a row's "what else touches it" column with actual file paths or job names, Step 2 isn't finished — grep more, don't leave it as "TBD" or "probably fine."

## Step 3: Assign a risk tier

Use the dependency map from Step 2 to classify the change into exactly one tier. The tier is set by the map, not by a gut feeling about how hard the code looks to write.

**Tier 1 — UI-only / read-only / fully isolated**
- No writes to any model/table shared with another feature
- Any shared component touched is read-only (rendered, not modified) or the change is purely additive (new optional prop with a safe default)
- No job, webhook, or event is touched
- *Example: adding a new filter to an existing read-only list view.*

**Tier 2 — writes to shared state, but scoped and reversible**
- Writes to a shared model/table, but the write is additive (new column, new row type) or scoped to rows this feature owns exclusively
- A shared component is modified, but the change is backward-compatible for every other caller found in Step 2
- Any job or event touched is idempotent or has a clear, cheap rollback if the new behavior is wrong
- *Example: adding a new status value to an existing enum, where existing code already treats unrecognized values as a no-op.*

**Tier 3 — no easy undo, or touches a high-blast-radius domain**
A change is Tier 3 if it hits **any one** of these, regardless of how small the diff looks:
- Touches auth, permissions, or session handling
- Touches billing, payments, or usage metering
- Requires a migration that changes or drops existing columns/tables, rather than adding new ones
- Touches cross-tenant or cross-account data access or isolation
- Modifies a shared model, component, or job in a way that is **not** backward-compatible for at least one other caller found in Step 2
- Writes data with no realistic rollback (sent communications, external API calls that can't be un-sent, financial records)
- The Step 2 map turned up three or more other features/jobs reading or writing the same shared surface

One bullet applying is sufficient — the others not applying does not downgrade it.

Record the tier next to the dependency map along with the specific bullet(s) that produced it. "Tier 3 — modifies `[ModelName].status` non-backward-compatibly for `[SyncJob]`" is a valid, checkable record. "Tier 3 — feels risky" is not.

## Step 4: Tier 3 pairing requirement

Tier 1 and Tier 2: proceed straight to the implementation plan.

Tier 3: **a named engineer must pair before implementation starts.** Not "loop them in on the PR," not "tag them as a reviewer" — a conversation that happens before the implementation plan is finalized, while the approach is still changeable.

Concretely, "pairing before" means:
1. Identify the specific engineer who owns or knows the shared surface from the Step 2 map — the model, the job, the component — not "an engineer," a named person.
2. Schedule or start a real-time conversation (a call, a huddle, in person — not an async written thread) of roughly 15 minutes.
3. Walk them through the dependency map and the tier reasoning from Step 3, then propose the intended approach.
4. Get an explicit go/no-go — "yes, that's safe" or "no, do X instead" — before the implementation plan is written. If they propose a different approach, that becomes the plan.
5. Record the engineer's name, the date, and the agreed approach at the top of the implementation plan: `Paired with [Engineer Name] on [date] — approach confirmed: [one-line summary].`

Why after-the-fact review doesn't substitute for this: by the time a Tier 3 change is a diff on a pull request, the risky decision — which table to write to, whether the migration is additive or destructive, whether the job stays idempotent — is already baked into the code. A reviewer at that point is choosing between "approve something risky" or "ask for a rewrite," and the pressure to ship pushes toward the former. Pairing before implementation catches the decision while it's still just a decision, not a diff someone has to unwind.

If the named engineer is unavailable and the Tier 3 change is time-sensitive, do not downgrade the tier to route around this requirement. Wait, or find another engineer with equivalent context on the shared surface.

## Worked Example

**PRD one-liner:** "Let account admins bulk-archive campaigns older than 90 days from a new button on the campaigns list."

**Step 1 — surface area:**
- Model: `[Campaign]` (write: `status` field)
- Controller: new `bulk_archive` action on the existing campaigns controller
- Frontend: new button on the existing `[CampaignsList]` component
- Job: none added directly, but archiving flips a field also read by an existing job
- Event: none emitted

**Step 2 — dependency map:**

| Shared surface | What else touches it | Risk if it breaks |
|---|---|---|
| `[Campaign]` model, `status` field | `[SyncJob]` (nightly — reads non-archived campaigns to push to `[external system]`); `[ReportingController]` (reads status for dashboard counts); `[DuplicateAction]` (copies status when duplicating a campaign) | If `SyncJob` isn't updated to skip archived campaigns, it keeps syncing them nightly after the user believes they're archived — silent, hard to notice until a customer asks why an "archived" campaign is still sending |
| `[CampaignsList]` component | Also rendered read-only inside `[TemplateGalleryModal]` | If the new button isn't gated behind a prop, it becomes reachable inside a modal where bulk-archive was never meant to appear |

**Step 3 — tier:** Tier 3. Two other features (`SyncJob`, `ReportingController`) read the same `status` field this change writes, and `SyncJob` isn't in the current plan's scope to update — that's a non-backward-compatible change to a shared surface, and the failure mode (stale sync after "archive") has no clean rollback once the external system has already acted on stale data.

**What happens next:** The implementation plan is not written yet. The PRD owner identifies the engineer who owns `SyncJob`, has a 15-minute conversation covering the dependency map above, and proposes "add `status != archived` to the sync query." The engineer confirms that's correct and flags that `ReportingController`'s dashboard count also needs the same filter. Both go into the plan. The plan's first line reads: `Paired with [Engineer Name] on [date] — approach confirmed: exclude archived campaigns from SyncJob query and ReportingController counts.` Only then does milestone breakdown begin.

## Global Rules

- **The dependency map is mandatory, not optional.** If Step 2 turns up nothing, that claim must be backed by the actual grep output showing no other hits — not skipped because the change "seems small."
- **Tier is derived from the map, never asserted first.** Don't decide the tier and then go looking for supporting evidence — build the map, then let the tier fall out of it.
- **Never downgrade a tier to avoid the pairing requirement.** Schedule pressure on a Tier 3 change is a reason to pair sooner, not a reason to reclassify it.
- **Pairing is a conversation, not a comment.** A written chat message or PR comment that says "heads up, touching shared state" does not satisfy Step 4 — it must be a real-time exchange with an explicit go/no-go.
- **Re-run the gate if the approach changes.** A plan that pivots from an additive column to a destructive migration moves tiers — treat it as a new gate, not an amendment to the old one.
- **This gate runs once per PRD, before the implementation plan — not once per pull request.** If a Tier 3 PRD splits into multiple PRs across repos, the pairing conversation covers the whole approach up front; individual PRs don't each need their own session unless the approach changes mid-build.
