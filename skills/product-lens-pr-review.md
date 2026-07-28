---
name: product-lens-pr-review
description: "**Product-Lens PR Review**: A PR review process for reviewing someone else's PR from a product owner's seat — product experience first, then design consistency, then AI-attributed technical findings, then analytics coverage. Every posted finding is independently verified against the code, and anything that would block a merge has to survive two agents trying to refute it. MANDATORY TRIGGERS: PR review, do a PR review, review this PR, review PR, review the PR, product review, review this pull request, PR feedback, review the PRs on this ticket, take a look at this PR, is this PR good, can I approve this PR. Also trigger whenever the user references reviewing a pull request, a ticket's linked PRs, or asks for feedback on code someone else wrote. Trigger automatically when the user pastes a GitHub PR URL, or a ticket ID together with any review-shaped verb. DO NOT use feature-audit or a generic code-review command for these — feature-audit is for auditing a branch the user built themselves, and a generic review is an engineer-voice review that discards the product lens, the analytics check, and the approval gates. This skill starts work immediately on trigger; it does not ask whether to begin."
---

# Product-Lens PR Review

Review someone else's PR from a product owner's seat, not an engineer's. A code-reviewer subagent finds the technical issues; this skill decides which of them are real, which are strong enough to block a merge, what reaches the PR, in what order, in whose voice, and behind which gates.

Written for the case where the reviewer is **not** the strongest engineer in the room — a PM, a founder, a designer, a product owner. The premise is that the technical pass is the cheap part and can be delegated, but only if its output is verified before it reaches a colleague's PR. An unverified AI finding costs the author more time to disprove than it cost to generate.

**On trigger, start executing at Step 1 immediately.** Do not ask whether to run this, do not summarize the pipeline for approval first. The gates in this skill are at the *end* — before anything gets posted to GitHub — not at the beginning. The only reason to stop early is a genuinely missing input (no PR number and no ticket ID), and then ask only for that one thing.

## Adapt this before you use it

This file ships with placeholders. Fill them in once, in your own copy:

| Placeholder | Replace with |
|---|---|
| `[YOUR_USERS]` | Who actually uses the product, and how technical they are. Be specific — "e-commerce marketers, non-technical" beats "users". |
| `[COMPARABLE_TOOLS]` | Two or three products your customers use daily. Section 2 grades against these. |
| `[YOUR_REPOS]` | The repos a single ticket can span (e.g. API / web / workers). |
| `[YOUR_TRACKER]` | Linear, Jira, GitHub Issues — wherever tickets and linked PRs live. |
| `[YOUR_ANALYTICS]` | Your analytics tool and the path to your event catalog, if you keep one. |
| `[STRATEGIC_FEATURES]` | The bets where you always want funnel-level tracking. |
| `[TEAM_TEMPLATE]` | Path to your team's own review template, if one exists. Delete the reference if not. |

Everything else works as written.

## Why this exists

A general code-reviewer subagent is a good **finding engine** — it reads a commit range with a senior-engineer prompt and returns severity-ranked findings. But those prompts are written for reviewing *your own* in-progress work. They have no opinion about user experience, design consistency, analytics coverage, or who is qualified to sign off. They also end with a "ready to merge" verdict, which is the wrong conclusion for a product reviewer to post on someone else's work.

The product-lens review below is the **output contract** — product experience first, technical findings attributed to the AI that found them, analytics as a first-class concern, two explicit human gates. It doesn't find anything by itself.

This skill wires the first into the second. The engine's calibration stays intact so findings match what your engineers would get from the same engine; ordering, framing, voice, and gating all come from the contract. Between the two sits the part that makes the findings trustworthy: an independent reader re-opens the code behind every finding before it can be posted, and anything that would block a merge has to survive two agents trying to refute it. The result is additive — nobody else reviewing this PR is checking Sections 1, 2, or 4.

## Step 1: Gather every PR on the ticket

Start here, immediately.

A single ticket routinely spans multiple repos (`[YOUR_REPOS]`). Reviewing one repo's PR in isolation produces confident comments about behavior the other half of the change already handles. This is the single most common source of a wrong review comment.

```bash
# from a ticket: pull it and every linked PR before reading any diff
# (via [YOUR_TRACKER] — fetch the issue, then read its attachments/links for PR URLs)

# per PR, fix the exact review range:
gh pr view <N> --repo <org>/<repo> --json title,body,baseRefOid,headRefOid,files,additions,deletions
gh pr diff <N> --repo <org>/<repo>
```

Record `baseRefOid` / `headRefOid` per PR — those pin the review to a specific range rather than a moving branch. Every later step cites that SHA.

If you keep a team review template (`[TEAM_TEMPLATE]`), read it too. **This skill owns the process** — ordering, filtering, verification, labeling, gating. A team template supplements it with section content and local specifics. Where the two disagree on process, this file wins. The sections here are the floor, not the ceiling.

Note but don't stop for: a linked PR already merged (its diff is context, not review surface), or a PR stacked on another unmerged PR (review the base first, and say you're doing that).

## Step 2: Run the finding engine (one subagent per repo, in parallel)

You need a senior-engineer code-review prompt. If you have the Superpowers plugin installed, invoke `superpowers:requesting-code-review` and use the template it carries, or resolve the file directly — never hardcode the version directory, it changes on every update:

```bash
ls ~/.claude/plugins/cache/claude-plugins-official/superpowers/*/skills/requesting-code-review/code-reviewer.md
```

**If you don't have it, this skill still works.** Dispatch a `general-purpose` subagent with a senior-code-reviewer brief that returns findings grouped as **Critical (Must Fix) / Important (Should Fix) / Minor (Nice to Have)**, each with a `file:line`, what's wrong, and why it matters. Those three tiers are the only part the rest of this skill depends on. Disclose which engine ran.

Dispatch one subagent per PR. Fill its placeholders:

- `DESCRIPTION` — the PR title and body, plus what the ticket says the change is for. Not your summary of the diff; you haven't read it yet.
- `PLAN_OR_REQUIREMENTS` — the ticket's acceptance criteria or linked spec. If neither exists, say so explicitly in the prompt ("no written requirements exist; evaluate against the PR's own stated intent") rather than leaving it blank, which invites the reviewer to invent a spec and grade against it.
- `BASE_SHA` / `HEAD_SHA` — from Step 1.

Append to the engine's prompt:

> Additionally: this review feeds a product owner's review, not an engineer's. Do not report code style, formatting, naming preferences, import order, or anything a linter or formatter would catch — those will be discarded. Do report anything that changes what a user experiences, including error paths that surface badly, states that render empty or broken, and behavior that differs from what the PR description claims.
>
> Keep your Output Format exactly as specified above, including the Critical / Important / Minor headings — do not collapse, rename, or merge them. Under each individual issue, after the existing file:line / what / why lines, add these two lines:
>
> `Confidence: NN` — 0-100, how confident you are that this issue is real.
> `Evidence: <file>:<line>` — the single most specific line in the diff that demonstrates it, followed by a short quote of that line.
>
> If you could not establish a finding by reading the code — it depends on runtime behavior, real data shape, or a file outside this diff — write `Confidence: unverifiable` and state what you would need to check. Do not assert it as fact.

The engine's context holds the diff; only findings come back. Don't also read the full diff yourself — you need your context for Sections 1 and 2.

## Step 3: Filter what came back

In order:

1. **Drop below 80 confidence.** Below that, a finding costs the author more to disprove than it cost to generate.
2. **Drop `unverifiable` assertions** the engine flagged as runtime-dependent — unless you can convert one into a Section 1 question ("what happens when X is empty?"), which is usually its better home anyway.
3. **Drop anything a linter catches**, even if the engine ranked it Important.
4. **Route the merge verdict to your human partner, never to GitHub.** These are two different things and it's easy to conflate them. The engine's "Ready to merge: Yes / No / With fixes" goes into the internal block below, verbatim with its reasoning — it's the single most decision-useful line for whether to approve. It never appears in the posted review body: merge-readiness is the author's call, and a product reviewer posting a merge verdict claims a judgment they didn't independently reach.
5. **Re-sort by user impact, and keep the tier.** Order by user impact rather than the engine's severity — a Minor finding on a path every customer hits outranks a Critical one behind a flag that's off. But carry each finding's engine tier forward; it feeds the posted label in Section 3. Re-sorting is not a reason to throw the severity away.

Survivors go to Step 4. Nothing reaches the review straight from here.

## Step 4: Verify every survivor independently

The engine's `Confidence: NN` is self-scored — the same pass that generated a finding also graded it. **That is not verification.** The pass that hallucinates a finding will happily score it 95.

Dispatch one cheap subagent per surviving finding, in parallel. Give it **only** the claim, the `file:line`, and the pinned SHA. Do not pass the engine's reasoning, its confidence score, or its severity — a verifier shown the argument will confirm the argument.

> Open `<file>` at commit `<HEAD_SHA>` and read the code around line `<line>`, plus whatever it calls, until you can answer.
>
> Claim: "`<the finding, stated plainly>`"
>
> Return exactly one verdict, and quote the specific lines you based it on:
>
> - `CONFIRMED` — the code does say this. Quote the lines that show it.
> - `NOT SUPPORTED` — the code does not say this, or something outside the cited lines already handles it. Quote what you found instead.
> - `CAN'T TELL FROM CODE` — deciding needs runtime behavior, real data shape, or a file that isn't in this repo. State what you'd need.
>
> Do not evaluate whether the issue matters, and do not soften a `NOT SUPPORTED` into a maybe. You are checking one fact.

Then:

| Verdict | What happens |
|---|---|
| `CONFIRMED` | Stays in Section 3; keep the verifier's quote to hand if the author pushes back |
| `NOT SUPPORTED` | Dropped from the posted review — and **listed in the internal block**, so a broken or lazy verifier shows up as a suspicious pile of drops instead of silently emptying the review |
| `CAN'T TELL FROM CODE` | Demoted to a Section 1 question, where runtime-dependent claims already belong |

If nearly everything comes back `NOT SUPPORTED`, that's a signal about the verifier, not a clean PR. Say so rather than posting an empty Section 3.

## Step 5: Attack anything that would block a merge

Confirmed by one reader is enough for a follow-up note. It is not enough for a comment that tells a colleague to stop shipping.

For each finding you'd label `[Blocks merge]` — and only those — dispatch **two refuters in parallel**, each prompted to disprove it:

> Below is a claim about this PR that survived a first-pass verification. Your job is to refute it: find the reason it is wrong, overstated, or already handled. Look for guards upstream of the cited line, existing validation, a caller that never passes the problematic input, a framework or library default that covers it, or a test that already pins the behavior.
>
> Claim: "`<the finding>`" at `<file>:<line>`, commit `<HEAD_SHA>`.
>
> Return `refuted: true|false`, the code you based it on, and one sentence of reasoning. **If you cannot establish it either way, return `refuted: true`** — the bar for telling someone to stop shipping is high, and a claim you can't confirm doesn't clear it.

| Outcome | What happens |
|---|---|
| Both refute | Demoted to a Section 1 question. It is not posted as a defect. |
| One refutes | Stays `[Blocks merge]`, and the dissent goes in the internal block so your partner knows it's contested before approving. |
| Neither refutes | Posted as-is. Three independent passes couldn't knock it down. |

**Cap: the top 4 blockers by user impact.** If there are more than four, attack four and state in the internal block how many went unattacked — a silent cap reads as full coverage. And more than four genuine blockers is itself the headline: the PR isn't close, which belongs in Section 1, not buried in Section 3.

---

# The Review Itself

Write it in this section order. The order is the argument: technical findings buried under UX is correct, UX buried under technical findings is the failure this whole pipeline exists to prevent.

## The internal block — for your human partner, never posted

The draft you show opens with this. It is not part of the review body and is stripped before any `gh` command runs.

```
--- FOR YOU, NOT POSTED ---
Engine merge verdict:  <Yes | No | With fixes> — <the engine's reasoning, verbatim>
Branch actually run:   <yes, and what I clicked | no — diff only>
Findings dropped:      <n> failed verification — <one line each: the claim, then what the verifier found instead>
Contested blockers:    <finding> — 1 of 2 refuters disagreed: <their reasoning>
Blockers unattacked:   <n — only if the Step 5 cap was hit>
---
```

Every line is something the reviewer needs in order to weigh approval and cannot get from the posted review. The dropped-findings line is the audit trail on Step 4 — if it's long, distrust the review, not the PR.

## Section 1: Product Experience Review (Primary Lens)

Evaluate from the end user's perspective — `[YOUR_USERS]`. Not the engineer's.

**Check for:**
- **Intuitive flows** — would one of your users understand this without explanation?
- **UX edge cases** — what happens on empty states, loading states, error states?
- **Clear, action-oriented copy** — no jargon, no ambiguity
- **User feedback after actions** — confirmation messages, progress indicators
- **Unnecessary friction** — extra clicks, confusing navigation, hidden options
- **Analytics coverage gaps** (routed here from Section 4) — a new flow or surface with no tracking is a product problem, not a technical one
- **Demoted technical findings** (routed here from Steps 4 and 5) — anything that couldn't be established from code, or that two refuters knocked down, belongs here as an open question rather than a stated defect

**Standard:** Does it feel polished and cohesive, or bolted on? Flag "good enough" UX that could be great with a small change.

**Tone:** Frame product feedback as questions. "What happens if a user does X?" invites dialogue better than "You forgot X."

**On what a diff can and can't tell you:** a diff supports flows with no empty/loading/error state, actions with no feedback, copy visible in the change, added clicks, and options hidden behind unclear affordances. It does *not* support whether an interaction *feels* right. Either run the branch and look, or frame it as a question — never assert it from source. Your human partner's own click-through findings are primary input here and outrank anything derived from reading code; if they tested it and something felt wrong, that leads the review even if the diff looks clean.

## Section 2: Product Taste & Design Consistency

**Check for:**
- Does the interaction feel modern and responsive?
- Are transitions/animations appropriate — not distracting, not absent?
- Is layout/spacing intentional? Is information hierarchy clear?
- Would this hold up next to `[COMPARABLE_TOOLS]` — the products these customers use every day?

**Standard:** Be specific — say what would make it better and why it matters for the user. "Feels off" is not a review comment.

## Section 3: Code & Technical Observations (AI-Assisted)

**Attribute every finding in this section to the AI that found it** — "Claude flagged…" / "Claude's analysis suggests…". Not out of modesty: the author needs to know which comments came from a product owner's judgment versus a subagent's diff read in order to weigh them correctly. Hiding it also means the first wrong finding damages your credibility rather than the tool's.

**Label every finding with what you want done about it.** A severity tier like "Important" still doesn't tell a non-engineer whether to hold the merge, so the labels are actions, not severities:

- `[Blocks merge]` — a user-facing bug, security hole, or data-loss path on code that will actually run. Survived Step 5.
- `[Fix before ship]` — a real defect, but bounded: behind a flag that's still off, or on a path customers reach rarely. Doesn't hold the merge; does hold the flag flip.
- `[Follow-up]` — real, worth a ticket, not worth holding anything.

Order within the section stays by user impact, so a `[Fix before ship]` on the main flow can sit above a `[Blocks merge]` on a dark path. The label carries urgency; the position carries reach.

**Include (survivors of Steps 3-5 only — nothing skips the verification):**
- Bugs or logic errors that would affect users
- Missing error handling that impacts UX
- Performance concerns (N+1 queries, unnecessary re-renders)
- Security issues
- Hardcoded values that should be configurable
- Missing test coverage for critical paths
- Analytics naming / safety / phantom-event issues (routed here from Section 4)

**Do NOT:**
- Nitpick code style — linters handle it
- Rewrite the implementation — describe the outcome you want, let them pick the approach
- Bury UX issues here — always prioritize by user experience impact
- Post anything that didn't clear Step 4

### Section 3b: Decisions worth your sign-off

The engine will not report this class of thing — its brief is bugs, architecture, and tests, so code that runs correctly and quietly made a product call passes straight through. `plan = row.plan || 'free'` is not a bug. It's a product decision nobody asked the product owner about.

This category is worth its own pass because it's where silent-fallback incidents come from: a render fails, the code falls back to a default, an autosave writes the default over real user data, and no reviewer ever saw a bug because there wasn't one.

Dispatch one narrow subagent for this — always a subagent, never an inline read, since your own context stays reserved for Sections 1 and 2. Have it look for: default values on missing input, silent skips or drops of invalid data, fallback chains, tie-breaking and dedup strategy, silent clamping or coercion, swallowed errors resolving to an empty result, partial-failure handling in batches, magic-number thresholds and limits, and the behavior of whoever's left on the ungated path of a feature flag.

Surface **only the 3-5 that genuinely need a product call** — where the alternative is something a customer would notice. Phrase each as: *"If [condition], this [does X] instead of [named alternative] — is X what we want?"* Always name the alternative; a decision can't be weighed against nothing. Always state what ships if nobody says anything, because that's the real default answer.

These are decisions, not defects — they don't take Section 3 labels and they don't go through Step 5. Nothing here is being called wrong.

> If a diff is dense enough with these that 3-5 doesn't cover it, the companion `decision-mining-ledger` skill does an exhaustive checkbox version. Invoke it deliberately — don't let a PR review auto-escalate into it, or the common case turns into a ledger exercise.

## Section 4: Analytics & Event Tracking

Does this PR ship a measurable feature, and are the right events in place? "If it's not tracked, we can't measure adoption" applies to every new user flow, feature surface, or meaningful state change.

Run both halves, route them to different sections.

**Coverage check** → **Section 1**:
- Does the PR add a new user flow, feature surface, or meaningful state change with no tracking calls at all? Frame as a product question: "How will we know whether customers actually use this once it ships?"
- Reference your event catalog (`[YOUR_ANALYTICS]`) for what's already tracked and what patterns new events should follow.
- For `[STRATEGIC_FEATURES]`: these are strategic bets. Assume funnel-level tracking is needed unless the PR explicitly deprioritizes it.

**Implementation check** → **Section 3**. Adjust the conventions to your own, but keep them *checkable* — vague guidance produces vague review comments:
- **Naming**: one casing and one grammar, enforced. A worked example: `snake_case`, `noun_verb_past_tense` (`block_created`, not `clickCreateBlock`), surface-prefixed when ambiguous.
- **Properties**: IDs as strings (cast when the source is numeric); booleans prefixed `has_`/`is_`/`can_`/`was_`; enum-like values as typed unions rather than scattered boolean flags.
- **Safety**: events go through your own wrapper, never the raw vendor SDK — the wrapper is where the try/catch lives. Never wrap a primary user action inside a try/catch that also handles analytics failure. Fire-and-forget: `track(...); doTheThing()`.
- **No PII** beyond what your identify call already carries. Reject raw URLs with query tokens, per-subscriber data, third-party profile payloads.
- **Service correctness**: client events from the client, server-side outcomes from the server, background/ML events from the worker. An interaction that only ever happens server-side should never be instrumented in the UI.

**Phantom event check** — run every time. This catches a failure mode that is easy to hit and expensive to diagnose:

```bash
# for each new event name in the PR:
git log -S "'<event_name>'" --oneline
```

If that doesn't return the PR's own commit, the event was likely fired from spike code that never shipped. It will appear in your analytics tool's autocomplete forever and never fire in production — so an analyst builds a funnel on it, sees zero, and spends a day looking for the bug. There is no bug; the event never existed. Flag as an AI finding in Section 3.

---

## Step 6: Voice

- **Direct. No hedging, no fluff, no trailing summary** of what the review covered.
- **Suggestions over mandates.** Product feedback as questions.
- **Lead with what matters most to the user.**
- **Skip anything a linter would catch.**
- When posting, disclose the tooling: "I used Claude to help me review the code changes here." Reviewing someone's work with an AI and not saying so is the kind of thing that only has to be discovered once.

## Step 7: Two gates, both explicit

Separate, and neither is ever inferred:

1. **Post the comments?** Show the complete assembled draft first, internal block included. Your partner answering a question *about* the draft is not approval to post it.
2. **Formally approve the PR?** A separate ask, always. Never run `gh pr review --approve` unless the answer to this specific question was yes.

Ask as one question with two parts: *"Post it? And comments only, or approve too?"*

Then, and only then — strip the internal block from the draft file first; it carries the merge verdict and the dropped findings, neither of which belongs on the PR:

```bash
gh pr comment <N> --repo <org>/<repo> --body-file <draft>
# only on an explicit yes to gate 2:
gh pr review <N> --repo <org>/<repo> --approve
```

On a multi-repo ticket, post per-repo comments scoped to that repo's changes — not the same combined review pasted into three PRs.

## Global Rules

- **Start on trigger.** Don't ask permission to begin, don't describe the pipeline before running it. The gates are at the end.
- **Nothing reaches the PR unverified.** Every posted finding survived an independent read of the code at the cited line (Step 4); every `[Blocks merge]` finding also survived two refuters (Step 5). Self-reported engine confidence is not verification.
- **Never post or approve without its own explicit yes.** Two gates, no inference. Approval is a named human's sign-off on someone else's work; it isn't yours to grant by implication. (This rule is here because it was learned the hard way — a pair of stacked PRs approved without a go, both of which had to be dismissed.)
- **The merge verdict goes to your human partner, never to GitHub.** Always.
- **Never claim more verification than happened.** If you read the diff but didn't run the branch, the review must not imply a click-through, and the internal block must say `no — diff only`.
- **Disclose every cap and drop.** Blockers left unattacked, findings killed in Step 4, subagents that failed — all of it goes in the internal block. A silent omission reads as coverage.
- **All PRs on the ticket before any comment on any of them.** The cross-repo half of a change is where confident wrong comments come from.
- **Don't pad.** Three real findings beats three real findings plus nine nits. Volume trains people to skim.
- **Sections 1 and 2 are the point.** If a review comes out with a thin Section 1 and a fat Section 3, it failed — that's a code review wearing this template's headings. The technical pass is the cheap part and anyone can run it; the product lens is the part only the product owner brings.
- **Wrong-tool check:** the PR is your partner's own and an engineer is inheriting it → `pre-merge-handoff-gate`. The question is "what else does this touch" → `blast-radius-gate`. Auditing a branch your partner built themselves → `feature-audit`. This skill reviews someone else's finished work.
