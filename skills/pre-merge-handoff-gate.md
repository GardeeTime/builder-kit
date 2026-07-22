---
name: pre-merge-handoff-gate
description: "**Pre-Merge Handoff Gate**: Runs a read-only conformance check right before merge that verifies the process a repo's tracker claims happened actually happened — a PRD linked from the task tracker, a real 'Plan approved by [name] on [date]' line, a Results section that's actually filled in (not left as a bracket placeholder), and the product-lens PR review template actually used on the PR — then, separately, walks the PM and the receiving engineer through negotiating and co-signing a short ownership contract covering what was built, what corners were knowingly cut and why, who owns what happens next, and a first-response runbook. The conformance check is a mirror, not a blocker: it reports pass/fail per item without judgment. The ownership contract is the opposite: it is the one thing this skill actually gates on, because it can't be written by one person alone. Trigger on: 'is this ready to merge', 'pre-merge check', 'merge gate', 'ready to hand off', 'draft the ownership contract', 'what am I on the hook for', 'who owns this if it breaks', 'the engineer is picking this up', 'can I merge this yet', 'handoff gate'."
---

# Pre-Merge Handoff Gate

Two independent checks that run at the merge boundary, for PM-built features about to become someone else's problem.

## Why this exists

A PRD gets referenced, a plan gets "approved," a todo.md gets a Results section, a PR review template exists — but under deadline pressure, any of these can get skipped while the tracker still *reads* like they happened. Nobody catches this because nobody checks it against reality before merge.

Separately: a technical findings table from a PR review tells an engineer what's wrong with the code. It never tells them what they're personally now on the hook for once they hit merge. That gap — not the code quality — is the real source of dread around inheriting a PM-built feature. A findings table is not an ownership agreement.

If your workflow already has a gate before code starts (a plan-mode review, an explicit "plan approved by" step), this is that gate's mirror at the other end of the pipeline. It doesn't re-review the code. It checks whether the process you documented for getting here actually happened, and it makes sure the human inheriting the code knows exactly what they're inheriting — because they helped write that part down.

## How It Works

- **Part A — Conformance check (read-only, not a blocker).** Verifies documented process against actual repo/PR state. Reports PASS / FAIL / PARTIAL / N/A per item, plainly, with evidence. No commentary, no "you should have." A FAIL here doesn't stop anything — it feeds directly into Part B.
- **Part B — Ownership contract (negotiated, and this one *is* a gate).** A short document drafted as a starting point, then reviewed and edited *with* the receiving engineer — not handed to them finished. It isn't final until both people explicitly sign off. This skill's one enforceable rule: don't merge before both signatures exist.

## Step 0: Gather Inputs

Before running anything, establish:

- **Tracker path** — where this repo's todo.md-style tracker lives, e.g. `tasks/todo.md`. If unsure, check the repo root and common task-tracking directories.
- **Ticket/initiative identifier** — the ticket ID or feature name used as the tracker's H1 heading (`# Done: [TICKET-ID] — [short name]`).
- **PRD directory** — where PRDs live, e.g. `prds/`.
- **PR number and repo** — `[org]/[repo]`, needed for `gh` calls.
- **Receiving engineer's name** — required for Part B; Part A can run without it.

```bash
TRACKER_PATH="[path to your todo.md-style tracker, e.g. tasks/todo.md]"
PRD_DIR="[path to your PRD directory, e.g. prds/]"
PR_NUMBER="[PR number]"
REPO="[org]/[repo]"
```

If the tracker file doesn't exist at all, don't guess at a substitute — report that as a Part A result (see Global Rules) and move on.

---

## PART A: Automated Conformance Check

Read-only. Do not edit the tracker, the PRD, or the PR while running this part.

### 1. Locate the initiative block

```bash
grep -n "^# " "$TRACKER_PATH"
```

Find the heading matching this feature (`# Current Task`, `# Done: [TICKET-ID] — ...`, or `# Queued: [TICKET-ID] — ...`). Read everything between that heading and the next `---` separator — that's the block every subsequent check runs against.

### 2. Check: PRD linked from the tracker

**PASS** — the initiative's intro paragraph contains a reference (markdown link or plain path) to a file under `$PRD_DIR`, and that file actually exists on disk.
**FAIL** — no PRD reference in the block, or the reference points to a file that doesn't exist.
**N/A** — only if the block explicitly states no PRD was needed and says why (e.g. "No PRD — trivial config change"). An undisclosed absence is a FAIL; a disclosed one is N/A.

```bash
grep -o "$PRD_DIR[A-Za-z0-9_/-]*\.md" "$TRACKER_PATH"
# then confirm each match resolves:
ls [matched PRD path]
```

### 3. Check: plan approval line present

**PASS** — a line matching `Plan approved by [Name] on [Date]` (or this tracker's equivalent phrasing) with a real name and a real date.
**FAIL** — no such line, OR the line still contains literal bracket text (`[name]`, `[date]`, `[you]`) — proof the template was copied but never filled in.

```bash
grep -n "approved by" "$TRACKER_PATH"
grep -n "approved by.*\[" "$TRACKER_PATH"   # any hit here is an automatic FAIL
```

### 4. Check: Results section actually filled in

**PASS** — the `## Results` heading under this initiative is followed by concrete language naming what was verified end-to-end and what's left for a human call.
**FAIL** — the heading is missing, the content underneath is empty, or it's still a placeholder (`[Fill after test]`, `TODO`, `TBD`, or equivalent).

```bash
grep -n -A 3 "^## Results" "$TRACKER_PATH"
```

Any bracket placeholder, `TODO`, or `TBD` in that output is an automatic FAIL — treat it identically to a blank section. A Results section that just says "looks good" with no specifics is also a FAIL — it names nothing that was actually verified.

### 5. Check: PR review template actually used

**PASS** — the PR has a comment containing the section headers (or clearly equivalent language) from the product-lens PR review template — Product Experience Review, Product Taste & Design Consistency, Code & Technical Observations, Analytics & Event Tracking (or this team's equivalent sections).
**PARTIAL** — some sections present, others missing. Name exactly which ones are missing.
**FAIL** — no PM-authored review comment at all, or only a generic approval ("LGTM," a thumbs-up reaction) with no section content.

```bash
gh pr view "$PR_NUMBER" --repo "$REPO" --json comments,reviews \
  --jq '.comments[].body, .reviews[].body' > /tmp/pr_review_text.txt

grep -c "Product Experience" /tmp/pr_review_text.txt
grep -c "Product Taste" /tmp/pr_review_text.txt
grep -c "Code & Technical" /tmp/pr_review_text.txt
grep -c "Analytics" /tmp/pr_review_text.txt
```

### 6. Report the conformance table

```
#  Check                              Status    Evidence
1  PRD linked from tracker            PASS      prds/[file].md exists, linked in intro
2  Plan approval line present         PASS      "Plan approved by [Name] on [Date]"
3  Results section filled in          FAIL      Still reads literal "[Fill after test]"
4  PR review template fully used      PARTIAL   Sections 1+3 present; 2 (Taste) and 4 (Analytics) absent
```

State the fact and the evidence line. Don't add judgment ("you should have run the review properly") — that's not this part's job. Every FAIL and PARTIAL here carries straight into Part B's Corners Cut table — a skipped process step is itself a cut corner, disclosed the same way a code shortcut is.

---

## PART B: Negotiated Ownership Contract

This is not a report Claude/the PM writes and hands over. Two sections of it — "Engineering owns going forward" and the runbook — cannot be finalized without the receiving engineer's own input.

### 1. Draft (labeled DRAFT, not final)

Pull the PR diff, the tracker block, the PRD, and every Part A FAIL/PARTIAL:

```bash
gh pr diff "$PR_NUMBER" --repo "$REPO"
```

Populate the template below. Auto-seed the Corners Cut table with any Part A gaps (missing Results detail, skipped review sections, etc.) alongside genuine scope/implementation cuts. Header the doc:

```
STATUS: DRAFT — not yet reviewed with [engineer name]
```

### 2. Ownership contract template

```markdown
# Ownership Contract: [Feature Name] ([TICKET-ID])

**Drafted by:** [PM name] | **Reviewed with:** [Engineer name] | **Date:** [Date]

## What Was Built
[2-4 sentences, plain language — what actually shipped]

## Corners Cut (and why)
| Corner Cut | Why | Risk if it bites |
|---|---|---|
| [thing not done / process step skipped] | [reason] | [what breaks, how bad] |

## Who Owns What Next
**PM commits to fix personally:**
- [ ] [specific, checkable commitment]

**Engineering owns going forward:**
- [ ] [specific item — confirmed by the engineer, not assumed by the PM]

## If This Breaks, Check First
1. [first concrete thing to check — dashboard, log, flag, queue]
2. [second thing]
3. [who to page if 1-2 don't resolve it, and why they're the right person]

## Sign-off
- [ ] PM ([name]): read and commits to the items above. — [date]
- [ ] Engineer ([name]): read and accepts ownership of the items above. — [date]
```

### 3. Review with the engineer — not just notify them

Share the draft (PR comment, PR description addendum, or a message with a link to the file) and ask the engineer to edit or confirm, specifically:
- **Who Owns What Next → Engineering owns going forward** — this is their list to write or approve, not the PM's guess at what engineering would say.
- **If This Breaks, Check First** — the engineer usually knows the real first move better than the PM does.

If the engineer hasn't weighed in yet, the contract stays `STATUS: DRAFT`. Say so plainly — don't present a one-sided draft as if it were agreed.

### 4. Finalize and co-sign

Once the engineer's edits are in, both people sign off explicitly. Two mechanisms — pick whichever the team already uses:
- **PR comments**: PM comments "PM sign-off: [confirmation]", engineer comments "Eng sign-off: [confirmation]", both on the PR the contract is linked from.
- **Checkbox pair**: both boxes in the contract's Sign-off section, checked by the respective person — not checked on their behalf.

Park the contract file next to the tracker (e.g. `tasks/handoff-[ticket-id]-ownership.md`) or as a PR description section — either works; consistency across the repo matters more than the specific location.

### 5. Gate the merge

Unlike Part A, Part B is a real gate: don't merge until both sign-off lines exist with real names and dates, not placeholders. If asked to merge before both signatures exist, say so and stop.

---

## Worked Example

### The feature

**PROJ-482 — Saved Search Alerts.** Ships an opt-in daily email digest when a user's saved search has new matching results.

Tracker excerpt (`tasks/todo.md`):

```markdown
# Done: PROJ-482 — Saved search alerts

Ships email notifications when a saved search gets new matches.
Plan approved by Dana on 2026-06-02 → see prds/proj-482-saved-search-alerts.md.

Branches: `pm/proj-482-saved-alerts` in `app` and `app-worker`, cut from `origin/main`.

Key decisions: alerts batch into a daily digest, not real-time; rate-limited to
1 email/day/user; no in-app notification center yet (deferred to PROJ-510).

## M1 — Backend
- [x] Alert subscription model + migration — DONE 2026-06-10 (a1b2c3d)
- [x] Daily digest job — DONE 2026-06-12 (d4e5f6a)

## M2 — Frontend
- [x] "Get alerts" toggle on search results — DONE 2026-06-14 (f7a8b9c)

## Results
[Fill after test]

---
```

### Part A result

```
#  Check                              Status    Evidence
1  PRD linked from tracker            PASS      prds/proj-482-saved-search-alerts.md exists, linked in intro
2  Plan approval line present         PASS      "Plan approved by Dana on 2026-06-02"
3  Results section filled in          FAIL      Still reads literal "[Fill after test]" — never replaced
4  PR review template fully used      PARTIAL   PR #214 comment covers Section 1 (Product Experience) and
                                                 Section 3 (Code & Technical); Sections 2 (Taste) and
                                                 4 (Analytics) are absent
```

Two disclosed gaps carry into Part B: the Results section was never actually filled in (no recorded end-to-end click-through before merge), and the review skipped Taste and Analytics — meaning the new `search_alert_enabled` event was never checked for phantom-event risk.

### Part B — Ownership Contract

```markdown
# Ownership Contract: Saved Search Alerts (PROJ-482)

**Drafted by:** Dana (PM) | **Reviewed with:** Priya (Engineer) | **Date:** 2026-06-16

## What Was Built
Saved searches support an opt-in daily email digest when new matching results
appear. Digest batches once per day, capped at 1 email/user/day, delivered via
the existing notification worker. No in-app notification center — email only.

## Corners Cut (and why)
| Corner Cut | Why | Risk if it bites |
|---|---|---|
| No per-search rate limit, only a per-user/day cap | Timebox — Slice 1 ships digest-only; per-search throttling deferred to PROJ-510 | A user with 20 saved searches gets one combined email — could look sparse, won't spam |
| Results section in todo.md never filled in before merge | Deadline pressure on the 2026-06-16 ship date | No documented evidence the happy path was manually verified beyond unit tests |
| PR review skipped Product Taste and Analytics sections | Reviewer (Dana) ran out of time before the ship deadline | `search_alert_enabled` tracking event was never confirmed — may be a phantom event |

## Who Owns What Next
**PM commits to fix personally:**
- [ ] Click through the happy path in production within 24 hours of merge, record it in todo.md Results
- [ ] Confirm `search_alert_enabled` fires in the analytics tool within 48 hours; file a bug if it's phantom

**Engineering owns going forward:**
- [ ] Per-search rate limiting (PROJ-510)
- [ ] Alerting on digest job queue depth

## If This Breaks, Check First
1. Digest job queue depth — stuck jobs usually mean the worker crashed on a malformed saved-search payload
2. Feature flag `saved_search_alerts` state — confirm it's still enabled for the intended rollout percentage
3. If neither explains it, page Priya (built the digest job) before touching the notification worker — it's shared with three other features

## Sign-off
- [x] PM (Dana): read and commits to the items above. — 2026-06-16
- [x] Engineer (Priya): read and accepts ownership of the items above. — 2026-06-16
```

Merged only after both boxes above were actually checked by their respective owner.

---

## Global Rules

- **Part A is read-only and non-judgmental.** Report PASS / FAIL / PARTIAL / N/A with evidence. No "you should have" language, no editorializing, no blocking anything.
- **Every Part A FAIL/PARTIAL must land somewhere in Part B's Corners Cut table.** A skipped process step is a cut corner — disclose it the same way a code shortcut gets disclosed, don't let it quietly disappear.
- **Never fabricate evidence to flip a check.** Don't add a "Plan approved by" line to the tracker just to make Part A pass. Report what's actually there, even if that means every check fails.
- **"Engineering owns going forward" and the runbook must be written or explicitly confirmed by the receiving engineer.** A PM-only draft of these two sections is a starting point, never the final version.
- **Part B's sign-off is the one real gate in this skill.** Don't merge until both a PM sign-off and an engineer sign-off exist with real names and dates — not placeholder text, not "should be fine."
- **If no tracker or PR review template exists in the repo at all, don't invent one on the spot.** Report "N/A — no tracker found" (or equivalent) as a Part A result, and carry the absence itself into Part B as a disclosed gap.
- **Compare against real repo/PR state, not memory.** Use `gh`, `grep`, and the actual file contents — don't rely on what the chat thinks happened earlier in the session.
- **Keep the contract to one screen.** It's a handoff document, not a second PRD. If it's growing past what fits without scrolling, cut it back to the essentials.
