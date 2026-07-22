---
name: pre-code-gate
description: "**Pre-Code Gate**: The concrete mechanism behind 'interrogate the codebase before you touch it' and 'read the plan critically' — runs a fixed interrogation checklist against the real codebase before any implementation plan gets written, scores the resulting plan against a checkable rubric (scope creep, assumption audit, reversibility, blast-radius disclosure, effort mismatch), then forces every plan step to be tagged VERIFIED or ASSUMED and spawns an independent adversarial subagent — given only the tagged plan, no chat history — to attack the single weakest ASSUMED step before a human signs off. Trigger on: 'before we start building', 'interrogate the codebase first', 'critique this plan', 'is this plan solid', 'sanity check this implementation plan', 'poke holes in this plan', 'run the pre-code gate', 'am I about to over-scope this'."
---

# Pre-Code Gate

Builder-kit's workflow calls out two steps that, until now, were just prose:

3. **Interrogate the codebase before you touch it.** Ask your AI assistant what already exists, where things live, and what patterns to follow — before assuming you need to build something new.
4. **Read the plan critically.** If your tool has a plan mode, use it — and actually read the plan before approving it. This is the gate that catches bad assumptions before they become bad code.

This skill is the mechanism for both. It doesn't replace judgment — it gives judgment something concrete to check.

## How It Works

Three phases, always in this order, always before a line of implementation code is written:

- **PHASE 1 — Codebase Interrogation.** Run a fixed checklist against the real codebase. Produces answers, not a plan.
- **PHASE 2 — Plan Critique.** Once an implementation plan exists (plan mode or otherwise), score it against a checkable rubric and tag every step VERIFIED or ASSUMED.
- **PHASE 3 — Adversarial Pushback.** Spawn an independent subagent that sees only the tagged plan. Its one job: attack the weakest ASSUMED step and report back.

A human reads the Phase 3 pushback report — not the raw plan prose — to decide whether to proceed.

## When to run

- Phase 1: as soon as a feature/fix is framed, before drafting any implementation plan.
- Phase 2 + 3: the moment a plan exists, before approving it or letting an AI assistant start editing files.
- Skip the whole gate only for genuinely trivial, no-risk changes (see Global Rules for the exact bar) — don't skip it because the plan "feels obvious."

---

## PHASE 1: Codebase Interrogation Checklist

Run every item below against the actual codebase — not memory, not the PRD, not what you assume is true. Each item names what to actually do and what a good vs. bad answer looks like.

### 1. Show existing examples of the pattern
**Do:** Ask "Show me 2-3 existing examples of [the pattern this feature needs] in this codebase" and/or run `grep -rn "[pattern keyword]" [src dir]` or use the repo's find-references tooling.
- **Good answer:** Cites specific `file:line` references, describes what the examples have in common, and flags the one place they diverge.
- **Bad answer:** "I don't see existing examples, so I'll design something new" — without having actually searched. If the assistant hasn't shown you real file paths, it hasn't looked.

### 2. What's the closest existing feature, and why not extend it?
**Do:** Ask "What's the closest existing feature to this, and why would we build something new instead of extending it?"
- **Good answer:** Names a specific existing feature/module and gives a concrete tradeoff — e.g., "extending [X] would mean touching [shared table/service] used by [N] other features; a new path isolates the blast radius but duplicates [specific logic]."
- **Bad answer:** "Nothing similar exists" with no search shown, or a reason that's just a vibe ("cleaner this way") with no named cost of either option.

### 3. What's the riskiest or most shared piece of code this could touch?
**Do:** Ask "What's the riskiest or most shared piece of code this could touch?" then verify with `grep -rn "[ClassOrModuleName]"` or the equivalent find-references command to count actual call sites.
- **Good answer:** Names a specific shared module/table/service and a real count of other consumers ("used by 4 other call sites: [list them]").
- **Bad answer:** "Should be fine" or no named risk at all — every non-trivial change touches *something* shared; if the assistant can't name it, it hasn't looked.

### 4. Does this already exist in some form?
**Do:** Grep for the feature's likely names, including disabled/dead paths: `grep -rn "[feature_name]\|[likely_flag_name]"` across the codebase, and check the feature-flag system for a flag that's off or unused.
- **Good answer:** An explicit yes/no with evidence — "grepped for these 5 terms, found a disabled `[method_name]` behind flag `[flag]` from [date/PR], never fully wired up" or "confirmed no match on any of these terms."
- **Bad answer:** "I don't remember seeing that" — memory isn't evidence; the grep has to actually run.

### 5. Who actually calls the code path this touches?
**Do:** Trace callers, not just the definition — `grep -rn "\.method_name(\|methodName("` or use LSP find-references. List every call site.
- **Good answer:** A concrete list of call sites with file paths, and a note on whether each one would be affected by the change.
- **Bad answer:** Only describing what the changed code *does*, never who *calls* it. This is the input Phase 2's blast-radius check depends on — do it here, not later.

### 6. What's the baseline — does the current test suite pass before any change?
**Do:** Run the existing test suite (or the relevant subset) for the area you're about to touch, before editing anything.
- **Good answer:** A reported pass/fail count from an actual run, so any new failure after the change can be attributed correctly.
- **Bad answer:** Assuming the suite is green because CI was green last week. Local state (uncommitted migrations, env drift) can differ — run it.

If any answer in this checklist can't be backed by an actual command output or file reference, treat it as unanswered — go run the command before moving to Phase 2.

---

## PHASE 2: Plan Critique Rubric

Once an implementation plan exists, run it against every row below before approving. Each check is meant to be answerable with a yes/no from something you can point at — not a feeling.

| # | Check | What to run / ask | Pass looks like | Fail looks like |
|---|-------|--------------------|------------------|------------------|
| 1 | **Scope-creep check** | If code exists already: `git diff main..HEAD --stat`. If plan-only: verify every file/module the plan names actually exists at the layer claimed, via `grep`/`find`. | Every file in the real (or dry-run) diff is named in the plan; nothing new snuck in mid-build without the plan being updated. | The diff touches files, tables, or modules the plan never mentioned — especially ones added partway through without a revision. |
| 2 | **Assumption audit** | Count VERIFIED vs. ASSUMED tags (see Phase 3). Identify the single highest-consequence step — the one whose failure is hardest to detect or undo. | That step is VERIFIED, or it's ASSUMED and has already been through the Phase 3 adversarial pass with a documented resolution. | The highest-consequence step is ASSUMED and hasn't been pushback-tested, or the plan doesn't distinguish VERIFIED from ASSUMED at all. |
| 3 | **Reversibility** | Ask: "For each step, if this turns out to be wrong after shipping, is undoing it a revert, or something worse?" | Plan explicitly separates revertible steps (code-only, no data mutation, no external side effect) from non-revertible ones, and proposes a safeguard for the latter (dry-run, backup, flag, staged rollout). | Plan is silent on irreversible actions — backfills, destructive migrations, emails/webhooks sent to real users, paid third-party API calls — treating them like any other code change. |
| 4 | **Blast-radius disclosure** | Ask: "What else reads or writes the [table/module/API] this touches? List every other caller." (Answer should already exist from Phase 1, item 5.) | Plan names the other consumers of any shared resource it touches and states whether each is affected. | Plan describes the change only in terms of the new feature, with zero mention of existing consumers Phase 1 already surfaced. |
| 5 | **Effort-mismatch flag** | Check whether the stated effort (S/M/L, hours, "quick fix") matches the number of shared systems, repos, or irreversible steps actually described. | Effort estimate accounts for every repo/system touched and any migration/rollout complexity in the plan. | Plan calls itself "quick"/"small" while describing a schema migration, a cross-repo change, or a change to shared/retried code — or the inverse: heavy effort estimated for what's actually a one-line config change. |

### Worked Examples

**Example 1 — scope creep + effort mismatch**
> Plan: "Add optional discount code field to checkout. Files: `CheckoutForm.[ext]`, `checkout_controller.[ext]`. Effort: S (~2 hrs)."
> Actual diff once built: 14 files, including the shared `Order` model, `pricing_engine.[ext]`, `admin/reports_controller.[ext]`, and a migration.
> **Verdict:** Fails checks #1 and #5 — the plan named 2 files, the real change touched 14 including a migration to a shared model, and the effort estimate was never revised once the pricing engine got pulled in.

**Example 2 — reversibility + blast radius**
> Plan: "Step 4: backfill `users.plan_tier` for all existing rows based on current subscription state, run directly against the production DB."
> **Verdict:** Fails check #3 — a one-time production backfill with no dry-run flag and no backup step; if the derived tier logic is wrong, there's no clean undo short of a restore. Also fails check #4 — the plan doesn't mention that `plan_tier` is read live by the billing cron and the admin dashboard, both of which start seeing new values mid-backfill.

**Example 3 — assumption audit**
> Plan: "Step 2 [ASSUMED]: the `notify_user` webhook is idempotent, so retrying on failure is safe."
> **Verdict:** Fails check #2 — this is the plan's riskiest step (an automatic retry loop hitting an external webhook) and it's tagged ASSUMED, not VERIFIED. Nobody read the webhook handler to confirm idempotency before deciding retries were safe to add.

---

## PHASE 3: VERIFIED/ASSUMED Tagging + Adversarial Pushback

### Tag every step

Every step in the implementation plan gets exactly one tag:

- **`[VERIFIED — <how>]`** — confirmed by actually reading the real code, running a command, or checking real data. Cite what was checked: a file:line, a grep, a console query.
- **`[ASSUMED]`** — an inference, a guess, or a "probably true" that hasn't been checked against the actual codebase.

```
1. [VERIFIED — read app/jobs/sync_worker.rb:12-40] SyncWorker#perform already accepts
   a resume_from param; it's defined but unused by any current caller.
2. [VERIFIED — grep for "SyncWorker.perform_later"] 3 existing call sites: cron.rb,
   webhook_controller.rb, admin/resync_controller.rb — none pass resume_from today.
3. [ASSUMED] Calling perform_later with resume_from while a prior run of the same
   job is still in flight will not double-process overlapping records.
```

If a step can't honestly be marked VERIFIED, it's ASSUMED — don't split the difference.

### Spawn the adversarial subagent

Once every step is tagged, spawn a second, independent subagent (the Agent/Task tool) with these constraints:

- **Input:** the tagged plan text only. Not the chat history that produced it, not the Phase 1 interrogation transcript, nothing else. It should be reading the plan cold, the way a skeptical reviewer would.
- **Mandate:** find the single ASSUMED step that is most consequential if wrong — not every ASSUMED step, just the weakest one — and produce a short pushback report:
  1. Quote the step under attack.
  2. What could concretely be wrong (a specific failure scenario, not "this might not work").
  3. How to verify it cheaply before building — a specific command, grep, or test, checkable in minutes.
- **Length:** a few sentences. If the subagent comes back with a full re-plan, it wasn't scoped tightly enough — ask it to redo with the "one weakest step" mandate.

The requesting agent (or the human) reads this pushback report to decide whether to proceed — not the original plan prose. Three outcomes:

- Proceed as-is (the pushback report didn't find anything that changes the plan).
- Amend the flagged step, then proceed (e.g., add a concurrency guard, add a dry-run flag).
- Go back to Phase 1 to verify the flagged assumption before continuing.

If there are zero ASSUMED steps, say so explicitly and skip Phase 3 — there's nothing to attack.

---

## Worked Example: End-to-End

**Feature:** Add a "Retry Sync" button to the [integration] settings page that re-triggers a failed background sync job.

**Phase 1 (condensed):**
1. Existing pattern: found 2 existing retry buttons elsewhere (failed export, failed import) — VERIFIED via grep on `retry_`.
2. Closest existing feature: the current "Resync" action restarts from scratch; retry should differ by resuming from the last synced record.
3. Riskiest shared code: `SyncWorker`, used by 4 other triggers (cron, webhook, manual admin action, and this new button).
4. Already exists in some form: found a disabled `retry_sync` method behind an unused flag from a prior attempt — never fully wired up.
5. Callers: 3 call sites of `SyncWorker.perform_later`, listed with file paths.
6. Baseline: `SyncWorker` test suite passes, 12/12, run just now.

**Phase 2 — tagged plan:**
```
1. [VERIFIED — read sync_worker.rb:12-40] SyncWorker#perform accepts a resume_from
   param, defined but unused.
2. [VERIFIED — grep] 3 existing callers of SyncWorker.perform_later; none pass
   resume_from today.
3. [ASSUMED] Enqueuing a retry with resume_from while a prior run of the same job
   is still in flight will not double-process overlapping records.
4. [VERIFIED — existing endpoint] POST /api/integrations/:id/resync fully restarts;
   no partial-resume path exists yet, confirming this is new behavior, not a dupe.
```
Rubric pass: scope matches (2 files touched, both named); blast radius is disclosed (4 callers of `SyncWorker` listed); reversibility is fine (button click, no destructive action); effort matches (labeled M, matches the shared-worker complexity). Assumption audit fails: step 3 is the single riskiest step (concurrent double-processing) and it's ASSUMED.

**Phase 3 — adversarial subagent, given only the tagged plan above:**
> Attacking step 3. If a user clicks "Retry Sync" while the cron-triggered sync for the same integration is still running, two `SyncWorker` jobs could process overlapping record ranges concurrently, producing duplicate writes — the plan never checked whether the job has a lock or idempotency guard. Verify cheaply: `grep -n "lock\|mutex\|idempotent\|status ==" sync_worker.rb`. If nothing turns up, add a `job_status == 'running'` check before enqueuing the retry (disable the button or return 409) as an explicit plan step before this ships.

**Outcome:** the flagged step gets amended — a running-status guard is added to the plan as step 3a — before any code is written.

---

## Global Rules

- **Phase 1 is read-only.** Interrogation produces answers, not edits.
- **The adversarial subagent must not see chat history or the Phase 1 transcript** — only the tagged plan. If your tooling can't isolate context that cleanly, at minimum re-read the plan cold as if seeing it for the first time, and flag that the isolation guarantee is weaker than intended.
- **A VERIFIED tag with no cited command or file reference is worse than an honest ASSUMED** — it's fabricated confidence. Spot-check at least one VERIFIED tag per plan by re-running what it claims to cite.
- **If Phase 1 turns up that the feature already exists in some form (item 4), stop and surface it before any plan gets written.** Don't let that finding sit unused while a redundant plan gets drafted anyway.
- **If more than half the plan's steps are ASSUMED, that's a Phase 2 failure on its own** (assumption audit) — send it back to Phase 1 for more interrogation. Tagging a mostly-guessed plan and running Phase 3 on it wastes the adversarial pass on a plan that isn't ready for one.
- **Never skip Phase 3 because "the plan looks fine."** The plan looking fine to whoever wrote it is not evidence of anything — that's the entire reason the pass is independent.
- **Skip the whole gate only for genuinely trivial, no-risk changes** — a one-line config value, a copy fix with no logic change, a change with no shared code and no data mutation. If you're unsure whether something qualifies as trivial, it doesn't — run Phase 1.
- **Don't let this gate replace `pr-review/`** — this is a pre-build gate for the plan; the PR review template is a post-build gate for the shipped code. Both apply; neither substitutes for the other.
