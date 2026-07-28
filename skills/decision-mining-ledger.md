---
name: decision-mining-ledger
description: "**Decision Mining Ledger**: Runs a read-only subagent pass over a diff whose sole job is to mine implementation logic for implicit product decisions — every default value chosen, every silently-handled edge case, every place the code picked one reasonable behavior among several — the kind of judgment call a non-technical PM would otherwise merge without ever seeing. Translates each one into a plain-English question the PM must explicitly approve or reject, and outputs a decision ledger that has to be filled in before merge. Companion to product-lens-pr-review.md's Section 3, not a replacement for it — bugs, style, and technical quality still go through that template; this only surfaces decisions. Trigger on: 'mine this diff for decisions', 'what decisions is this code making', 'build a decision ledger', 'what am I actually approving in this PR', 'surface the hidden product decisions', 'what defaults did this code pick', 'find the implicit decisions in this diff', 'decision audit before merge'."
---

# Decision Mining Ledger

Runs a read-only pass over a diff to find the implicit **product** decisions buried in the implementation — the default chosen when a value is missing, the edge case that got silently resolved one way instead of another, the input that got quietly dropped instead of rejected. Converts each one into a plain-English question with an explicit approve/reject choice, and outputs a ledger the PM fills in before the PR merges.

## Why this exists

`skills/product-lens-pr-review.md` already has a section for AI-assisted technical findings — Section 3, Code & Technical Observations. That section catches bugs, missing error handling, performance issues. What it does not do, and was never designed to do, is notice the decisions that aren't bugs at all: code that runs fine, does something reasonable, and quietly made a product call along the way.

`if (!customer.email) return;` is not a bug. It compiles, it doesn't crash, tests probably pass. It is also a product decision — "customers without an email are silently excluded from this flow" — and nobody asked the PM if that's what should happen. A non-technical reviewer scanning the diff has no way to even notice that line made a choice, let alone weigh in on it. Multiply that by every default value, fallback, and silently-handled edge case in a typical PR, and a lot of product surface area ships without anyone who owns the product actually seeing it.

This skill exists to close that gap: mine the diff for exactly these moments, restate each one as a question a PM can actually answer, and force an explicit approve/reject before merge — so "the code just happened to do it that way" stops being how product decisions get made.

## What counts as a decision (and what doesn't)

Mine for these patterns. Each one is a case where the code chose behavior "B" when it could reasonably have chosen "A" or "C" instead, and nothing forced the choice — a person made it, deliberately or by default.

| Pattern | Example |
|---|---|
| **Default value on missing input** | `plan = row.plan \|\| 'free'`, `.get('role', 'viewer')`, `timeout ?? 30000` |
| **Silent skip / drop on invalid or missing data** | `rows.filter(r => r.email)`, a `continue` in a loop with no log, a guard clause that just `return`s |
| **Fallback chains across multiple sources** | `user.displayName \|\| user.email \|\| 'Anonymous'` |
| **Tie-breaking / first-vs-last / dedup strategy** | keeping the first match when a lookup returns multiple, or the last-write-wins on a merge |
| **Silent clamping or coercion** | `Math.min(qty, maxAllowed)` with no message to the user about why their input changed |
| **Swallowed errors resolving to an empty/default result** | `catch { return [] }` instead of surfacing the failure |
| **Partial-failure handling in batch operations** | skip the bad row and keep processing the rest of the batch, vs. abort the whole batch |
| **Magic-number thresholds, limits, retry counts** | `if (attempts > 3)`, `.slice(0, 10)`, `debounce(300)` |
| **Ordering decisions** | sort order applied before display, priority order when multiple rules match |
| **Flag-gated behavior that no-ops for the ungated path** | `if (!flags.newFlow) return legacyResult` — what happens to the group left on the old path? |

**Do NOT report as a decision:**
- Anything that will throw, crash, or produce an obviously wrong result — that's a bug, it belongs in `product-lens-pr-review.md` Section 3.
- Missing input validation that's a security or data-integrity gap (SQL injection, missing auth check) — Section 3.
- Code style, naming, formatting, dead code, unused imports — not this skill's job, not Section 3's either (linters handle it).
- Performance concerns (N+1 queries, re-renders) — Section 3.
- Test coverage gaps — Section 3.

The line: if leaving the code exactly as-is produces a *reasonable-looking result that a user or reviewer could plausibly not question*, it's a decision. If leaving it as-is produces a *broken* result, it's a bug. When genuinely unsure which bucket something falls in, report it here anyway with a note — a decision the PM didn't need to weigh in on is a wasted line in the ledger; a decision that quietly shipped because nobody flagged it is the actual failure mode this skill exists to prevent.

## Step 1: Scope the diff

```bash
git diff main...HEAD --stat                  # or: gh pr diff <N> --repo <org>/<repo> --stat
git diff main...HEAD --name-only
```

Exclude from mining: test files, config/lockfiles, migrations (schema shape, not runtime decisions), pure markup/styling files with no branching logic, generated files. Keep everything with conditionals, loops, defaults, or data transforms — controllers, services, handlers, model methods, frontend logic, background jobs.

If the diff is empty of any files with branching/transform logic (e.g. it's docs-only or pure styling), stop and report: "No implementation logic in this diff — nothing to mine."

## Step 2: Run the mining pass (subagent, read-only)

Spawn **one subagent via the Agent tool** and hand it the diff plus the exact instructions below verbatim. Do not run this pass in the main conversation — it needs to stay narrowly scoped to mining, and a subagent keeps it from blending into whatever else is being discussed about the PR.

> **Subagent prompt:**
>
> You are reviewing a code diff for one thing only: implicit product decisions buried in the implementation logic. You are NOT reviewing for bugs, style, security, performance, or test coverage — a separate process already covers those, and flagging them here is out of scope and will be discarded.
>
> A decision is any place the code picked one reasonable behavior among several when handling a default, an edge case, missing/invalid input, a fallback, a tie-break, a threshold, or a partial failure — see the pattern table in `skills/decision-mining-ledger.md` for the exact categories.
>
> For each decision found, report:
> 1. **File and line number(s)**
> 2. **The exact code snippet** (1-4 lines, verbatim)
> 3. **One factual sentence** describing what the code does — no opinion on whether it's right or wrong, just what happens. E.g. "When `plan` is absent on the input row, the customer is assigned to the `free` plan."
>
> Do not rank, rate, or editorialize. Do not suggest a fix. Do not flag anything that would crash, error, or produce an obviously broken result — that's a bug report, not a decision, and belongs to a different review. If you're not sure whether something is a bug or a decision, include it and say so.
>
> Read every changed file in the diff. Do not skip files because they look boilerplate — defaults and fallbacks hide in boilerplate more than anywhere else. Output a flat numbered list, one entry per decision, in file order.

## Step 3: Translate into PM-facing questions

Take the subagent's factual findings and rewrite each one as a plain-English question with an explicit approve/reject framing. This translation is the actual product of this skill — a raw finding is useless to a PM until it's phrased as a choice they can make.

**Rules for the rewrite:**
- No jargon. Replace `null`/`undefined`/`nil` → "missing" or "blank." Replace `coalesce`/`fallback chain` → "falls back to." Replace `catch`/`swallow` → "if this fails."
- Always phrased as: *"If [condition], this [does X] instead of [the alternative] — approve this, or should it [alternative]?"*
- Always name the alternative(s), even if obvious. A PM can't reject a behavior they can't picture the alternative to.
- State what actually ships today if the PM does nothing — this is what makes "approve/reject" meaningful instead of decorative. If nobody fills in the ledger, the default answer is whatever the code already does; say so explicitly per entry.
- One decision per row. Don't bundle two decisions into one question even if they're on adjacent lines.

## Step 4: Output the decision ledger

Produce a markdown table, one row per decision, in file order:

| # | Where | The Decision (as a question) | Ships Today If Left Alone | Approve / Reject | Notes |
|---|-------|-------------------------------|----------------------------|-------------------|-------|
| 1 | `[file:line]` | [plain-English approve/reject question] | [what happens by default] | [ ] Approve &nbsp; [ ] Reject | |

- Number sequentially, no re-sorting by severity — there's no "severity" here, only decisions, and re-ordering implies some are less worth the PM's attention than others.
- Leave the Approve/Reject cell as literal unchecked checkboxes (`[ ] Approve  [ ] Reject`) — the PM checks one before merge. Do not pre-fill a recommendation; that would substitute your judgment for theirs on a product call that is explicitly theirs to make.
- Post this as its own artifact — a PR comment, or appended under its own heading in the PR description — separate from the Section 3 technical findings. Don't merge the two tables; they answer different questions (is this correct vs. is this what we want).
- If every row ends up Approved with no edits, that's a fine outcome — the point was never to force changes, it was to force the PM to actually look.

## Worked example

**Diff snippet** (`lib/import_customers.js`):

```javascript
function importCustomers(rows) {
  return rows
    .filter(r => r.email)                                 // (1)
    .map(r => ({
      email: r.email.trim().toLowerCase(),
      plan: r.plan || 'free',                              // (2)
      signupDate: r.signupDate ? new Date(r.signupDate)
                                : new Date(),               // (3)
    }));
}
```

**Mining pass output (Step 2, factual only):**
1. `lib/import_customers.js:3` — Rows with no `email` value are removed from the import before any further processing.
2. `lib/import_customers.js:6` — When `plan` is absent on the input row, the customer is assigned to the `free` plan.
3. `lib/import_customers.js:7-8` — When `signupDate` is absent, the customer's signup date is set to the current time (import time), not left blank.

**Resulting decision ledger:**

| # | Where | The Decision (as a question) | Ships Today If Left Alone | Approve / Reject | Notes |
|---|-------|-------------------------------|----------------------------|-------------------|-------|
| 1 | `lib/import_customers.js:3` | If a row in the import has no email address, this silently drops that customer from the import instead of stopping the import or reporting which rows were skipped. Approve dropping them silently, or should skipped rows be counted and shown to the person running the import? | The customer is dropped with no record anywhere that it happened. | [ ] Approve &nbsp; [ ] Reject | |
| 2 | `lib/import_customers.js:6` | If a row doesn't specify a plan, this puts the customer on the `free` plan instead of leaving it unset or requiring the uploader to specify one. Approve defaulting to free, or should a missing plan block that row from importing? | Every customer with a blank plan column silently starts on free. | [ ] Approve &nbsp; [ ] Reject | |
| 3 | `lib/import_customers.js:7-8` | If a row doesn't include a signup date, this backdates it to right now (whenever the import runs) instead of leaving it blank or rejecting the row. Approve using import time as the signup date, or should this be flagged for manual entry instead? | The customer's recorded signup date becomes the import date, not their real signup date — this will skew any cohort or tenure analysis built on that field. | [ ] Approve &nbsp; [ ] Reject | |

Three lines of unremarkable-looking code, three product decisions, none of which a PM scanning the diff would have had any way to notice on their own.

## Global Rules

- **This pass is read-only.** Never edit code, never fix anything found here — the mining subagent's only output is the ledger. If a PM rejects an entry, that becomes a follow-up ticket or a comment asking the engineer to change the behavior; this skill doesn't implement the fix itself.
- **Never merge this into the Section 3 technical table.** Decisions and bugs get judged on different axes (correct vs. desired) and mixing them buries the product calls under technical noise — the exact problem this skill exists to fix.
- **Don't editorialize in the ledger.** No "we recommend approving this" — state the alternative, not a preference. The PM's job is the call; this skill's job is making sure they see it.
- **Don't invent decisions that aren't there.** If a piece of logic has genuinely only one sane behavior (e.g. throwing on a null required parameter with no plausible default), it's not a decision — skip it. Padding the ledger with non-choices trains the PM to stop reading it.
- **Re-run per PR, not per repo.** This mines a diff, not a codebase — don't try to retroactively ledger every decision already living in `main`.
- **If the diff is large** (more than roughly 15-20 files with logic changes), consider splitting the mining pass by directory or feature area rather than one subagent trying to hold the whole thing — accuracy drops on very large diffs.
- **Compare against main.** Use `git diff main...HEAD --name-only` (or the PR's diff via `gh pr diff <N>`) to fix the exact file set before spawning the subagent — mining files outside the diff produces noise the PM didn't ask for and can't act on in this PR anyway.
