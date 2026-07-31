---
name: product-lens-pr-review
description: "**Product-Lens PR Review**: A PR review process for reviewing someone else's PR from a product owner's seat — product experience first, then design consistency, then AI-attributed technical findings, then analytics coverage. Every technical claim is verified against the code before it's drafted, findings post as inline comments on the lines they're about rather than one wall of text at the bottom, and the human names the sign-off. MANDATORY TRIGGERS: PR review, do a PR review, review this PR, review the PR, product review, review this pull request, PR feedback, review the PRs on this ticket, take a look at this PR, is this PR good, can I approve this PR. Also trigger whenever the user references reviewing a pull request, a ticket's linked PRs, or asks for feedback on code someone else wrote. Trigger automatically on a pasted GitHub PR URL, or a ticket ID together with any review-shaped verb. DO NOT use feature-audit or a generic code-review command for these — feature-audit audits a branch the user built themselves, and a generic review discards the product lens, the analytics check, and the approval gates. Starts immediately on trigger; does not ask whether to begin."
---

# Product-Lens PR Review

Review someone else's PR from a product owner's seat, not an engineer's. Four sections, in priority order: what the user experiences, how it looks, what the code does, and whether you'll be able to measure it.

Written for the case where the reviewer is **not** the strongest engineer in the room — a PM, a founder, a designer. The premise is that the technical pass is the cheap part and can be delegated, but only if every claim is verified against the code before it reaches a colleague's PR.

**On trigger, start immediately.** Don't ask whether to run this or summarize the plan first. The gate is at the end, before anything posts. Stop early only for a genuinely missing input (no PR number and no ticket ID), and ask only for that.

## Adapt this before you use it

This file ships with placeholders. Fill them in once, in your own copy:

| Placeholder | Replace with |
|---|---|
| `[YOUR_USERS]` | Who actually uses the product, and how technical they are. Be specific — "e-commerce marketers, non-technical" beats "users". |
| `[COMPARABLE_TOOLS]` | Two or three products your customers use daily. Section 2 grades against these. |
| `[YOUR_REPOS]` | The repos a single ticket can span (e.g. API / web / workers). |
| `[YOUR_TRACKER]` | Linear, Jira, GitHub Issues — wherever tickets and linked PRs live. |
| `[YOUR_ANALYTICS]` | Your analytics tool, and the path to your event catalog if you keep one. |
| `[STRATEGIC_FEATURES]` | The bets where you always want funnel-level tracking. |
| `[YOUR_HANDLE]` | The reviewer's GitHub login, used to find their own prior reviews on a re-review. |

Everything else works as written.

## Why this is short

An earlier version of this file was five times longer. It ran a code-reviewer subagent as a finding engine, filtered its output by a self-reported confidence score, dispatched one verifier per surviving finding, made every merge-blocker survive two more agents trying to refute it, and capped the result at five findings inside a 2,500-character budget.

Then I measured it against the reviews I'd written before any of that existed.

On one PR, the short template-era review posted **three findings and all three were fixed**. Four rounds later, the machinery-era review on the same PR posted **about fifteen items and four were acted on** — five times the output at a third of the action rate. Worse, the single highest-impact bug in that whole arc was sitting in the round-one diff and took four rounds and seven days to find, because the pipeline was organized around sweeping code rather than walking the paths a customer takes.

Most of the machinery turned out to be regulating its own noise. Reviews got long, so I added a length cap; the cap forced real findings out, so I added an overflow rule; the overflow rule taxed good findings, so it needed an exemption. None of that loop touched review quality.

Two things from that version were worth keeping, and they're both below: **verify every technical claim against the actual code before it goes in the draft**, and **let the human name the sign-off**. The rest is the original template, which leaves the judgment calls to the model on purpose.

If you take one thing from this file, take that: with a capable model, the guardrails are worth less than the priority order.

---

**Before starting:** pull all linked PRs from `[YOUR_TRACKER]` — a ticket may span `[YOUR_REPOS]`. Review all of them before writing any comments. Reviewing one repo in isolation produces confident comments about behavior the other half already handles.

**Important:** NEVER post PR comments directly. Always draft the full review for your human partner to read and approve before posting.

---

## 1. Product Experience Review (Primary Lens)

Evaluate from the end user's perspective (`[YOUR_USERS]`).

**Check for:**
- Intuitive flows — would one of your users understand this without explanation?
- UX edge cases — what happens on empty states, loading states, error states?
- Clear, action-oriented copy — no jargon, no ambiguity
- User feedback after actions — confirmation messages, progress indicators
- Unnecessary friction — extra clicks, confusing navigation, hidden options

**Standard:** Does it feel polished and cohesive, or bolted on? Flag "good enough" UX that could be great with a small change.

**Tone:** Frame product feedback as questions: "What happens if a user does X?" invites dialogue better than "You forgot X."

**Backend-only PRs:** this section still applies. Some of the worst bugs I've shipped came from diffs with no frontend files at all — a timezone bug that silently skipped a day's sends, and an auth change that could move a live session to the wrong tenant. The questions change, not the section:
- What does a customer see when this fails, and who finds out — them, support, or nobody?
- Does this change what an existing customer can already do today?
- What happens to someone mid-flow while this deploys?
- Where does the error copy this writes actually surface? Often that's the sibling frontend PR, not this one.

If there is genuinely no path to a customer, say so *and say why* — "this endpoint has no other call sites." That sentence is the finding, and it's what keeps a real-but-unreachable hazard from being labeled a blocker.

---

## 2. Product Taste & Design Consistency

**Check for:**
- Does the interaction feel modern and responsive?
- Are transitions/animations appropriate (not distracting, not absent)?
- Is layout/spacing intentional? Is information hierarchy clear?
- Would this hold up next to `[COMPARABLE_TOOLS]`?

**Standard:** Be specific — say what would make it better and why it matters for the user.

**This is the section that can legitimately be empty.** No rendered surface, no design review — write "N/A, nothing renders" and move on. Don't manufacture a design finding to fill the slot. Also: no design finding without actually looking at it. A diff can show a missing empty state; it can never show how something looks. Claiming otherwise is the one way this review can be confidently wrong in the area the product owner is the actual authority on.

---

## 3. Code & Technical Observations (AI-Assisted)

**Important:** Frame as the AI's findings, NOT the reviewer's. Use "Claude flagged..." or "Claude's analysis suggests..." so the engineer can weigh a model's diff read differently from a product owner's judgment.

**Check for:**
- Bugs or logic errors that would affect users
- Missing error handling that impacts UX
- Performance concerns (N+1 queries, unnecessary re-renders)
- Security issues
- Hardcoded values that should be configurable
- Missing test coverage for critical paths — including tests whose name claims more than the assertion checks
- Deploy-order and migration hazards — user-facing even though they look like infrastructure

**Do NOT:**
- Nitpick code style (linters handle that)
- Rewrite implementations (suggest outcomes instead)
- Bury UX issues under code observations — always prioritize by user experience impact

**Before labeling anything a merge-blocker, check that the file is actually in this PR's diff.** A real hazard in code the PR doesn't touch is a ticket, not a merge gate. This is the most common way a review overreaches: the finding is true, the attribution isn't.

---

## 4. Analytics & Event Tracking

Does this PR ship a measurable feature, and are the right events in place? "If it's not tracked, we can't measure adoption" — this applies to every new user flow, feature surface, or meaningful state change.

**Coverage check** (product lens — include in Section 1 if gaps are found):
- Does the PR add a new user flow, feature surface, or meaningful state change without any tracking calls? Flag as a product opportunity — you can't measure adoption of an untracked feature.
- Reference the current event catalog in `[YOUR_ANALYTICS]` to see what's already tracked and what patterns new events should follow.
- For `[STRATEGIC_FEATURES]`: these are strategic bets — assume you need funnel-level tracking unless the PR explicitly deprioritizes it.

**Implementation check** (technical lens — include in Section 3 under AI findings):
- **Naming**: consistent case and tense across the catalog (e.g. `snake_case`, `noun_verb_past_tense` — `block_created`, not `clickCreateBlock`). Surface-prefixed when ambiguous.
- **Properties**: IDs as strings, booleans prefixed `has_` / `is_` / `can_` / `was_`, enum-like values as a single `mode` / `source` union rather than scattered boolean flags.
- **Safety**: use your app's hardened tracking wrapper, never the vendor SDK directly — the wrapper is what carries the try/catch. Never wrap a primary user action inside a try/catch that also handles analytics failure. Fire-and-forget: `track(...); doTheThing()`.
- **No PII** beyond what `identify()` already carries. Reject raw URLs with query tokens, subscriber-level data, third-party profile payloads.
- **Service correctness**: client events from the client, server-side outcomes from the server, job/worker events from the worker. An interaction that only happens in Slack should never be instrumented in the web app.

**Phantom event check** (critical — this catches a failure mode that has already burned us):
- For every new event name in the PR, verify it exists in committed code: `git log -S "'event_name'"` should return this PR's commit. If it doesn't, the event was likely fired from spike code that never shipped — it will show up in your analytics tool's autocomplete forever and never fire in production.
- This happened to us on a real PR: half a dozen event names appeared in the analytics UI but existed in no repo, branch, stash, or reflog. It cost an analyst days chasing data that did not exist.

**Tone:**
- Coverage gaps: frame as product questions in Section 1 ("How will we know customers actually use this once it ships?").
- Naming / safety / phantom issues: frame as AI findings in Section 3.

---

## Posting the Review

- Tone: direct, no hedging or fluff. Lead with what matters most for the user.
- Use `gh pr diff N --repo <org>/<repo>` to fetch diffs.
- **Verify every technical claim against the code before it goes in the draft.** Open the file at the PR's head commit and read the cited lines plus whatever they call. If a claim can't be settled by reading the code, it's a question, not a finding — say what you'd need to check. This is the one piece of machinery worth keeping: an unverified finding costs the author more to disprove than it cost to generate.
- **Put findings on the lines they're about.** `gh pr comment` dumps everything at the bottom — the wrong container for a finding that knows its `file:line`. Use the reviews endpoint so the body and the inline comments go up in one call:
  ```bash
  gh api --method POST repos/<org>/<repo>/pulls/N/reviews --input review.json
  ```
  ```json
  {
    "event": "COMMENT",
    "body": "<the four sections, plus any finding that can't be anchored, plus questions>",
    "comments": [
      { "path": "src/server.js", "line": 34, "side": "RIGHT",
        "body": "**Anyone can complete anyone else's task.** …" }
    ]
  }
  ```
  Body = the summary, the questions, and any finding pointing at a line the diff doesn't touch. Inline = everything else. `side: "RIGHT"` is the post-change line, and a single out-of-diff anchor rejects the entire call — check each target against `gh pr diff` first.
- **The human names the sign-off, every time** — `COMMENT`, `REQUEST_CHANGES`, or `APPROVE`. Never infer it: approving signs off on someone else's work, and requesting changes formally blocks the PR until it's dismissed. Ask it alongside the draft — *"Post it? And comment, request changes, or approve?"* Default to `COMMENT`; a review whose findings all landed inline doesn't need a blocking state to be read.
- **Re-reviews:** find your prior reviews (`gh api repos/<org>/<repo>/pulls/N/reviews --jq '.[] | select(.user.login=="[YOUR_HANDLE]")'`), check whether those items actually closed — read the behavior, not the line that changed — review the commits that are new since that pass, and stop there. Re-auditing the whole PR re-raises settled items and makes the author a moving target. Reply to still-open items in their existing threads (`--field in_reply_to=<comment_id>`) rather than restating them in a fresh body.
- When posting on behalf of a human, disclose the tooling: "I used Claude to help me review the code changes here."
