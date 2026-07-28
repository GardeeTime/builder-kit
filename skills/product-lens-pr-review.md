---
name: product-lens-pr-review
description: "**Product-Lens PR Review**: A PR review process for reviewing someone else's PR from a product owner's seat — product experience first, then design consistency, then AI-attributed technical findings, then analytics coverage. Every posted finding is independently verified against the code, merge-blockers must survive two agents trying to refute them, and findings are posted as inline comments on the lines they're about rather than one wall of text at the bottom. MANDATORY TRIGGERS: PR review, do a PR review, review this PR, review the PR, product review, review this pull request, PR feedback, review the PRs on this ticket, take a look at this PR, is this PR good, can I approve this PR. Also trigger whenever the user references reviewing a pull request, a ticket's linked PRs, or asks for feedback on code someone else wrote. Trigger automatically on a pasted GitHub PR URL, or a ticket ID together with any review-shaped verb. DO NOT use feature-audit or a generic code-review command for these — feature-audit audits a branch the user built themselves, and a generic review discards the product lens, the analytics check, and the approval gates. Starts immediately on trigger; does not ask whether to begin."
---

# Product-Lens PR Review

Review someone else's PR from a product owner's seat, not an engineer's. A code-reviewer subagent finds the technical issues; this skill decides which of them are real, which are strong enough to block a merge, what reaches the PR, where on the PR it lands, in whose voice, and behind which gates.

Written for the case where the reviewer is **not** the strongest engineer in the room — a PM, a founder, a designer, a product owner. The premise is that the technical pass is the cheap part and can be delegated, but only if its output is verified before it reaches a colleague's PR, and only if it arrives in a form they can act on.

**On trigger, start executing at Step 1 immediately.** Do not ask whether to run this, do not summarize the pipeline for approval first. The gates are at the *end* — before anything is posted to GitHub. The only reason to stop early is a genuinely missing input (no PR number and no ticket ID), and then ask only for that one thing.

## Adapt this before you use it

This file ships with placeholders. Fill them in once, in your own copy:

| Placeholder | Replace with |
|---|---|
| `[YOUR_USERS]` | Who actually uses the product, and how technical they are. Be specific — "e-commerce marketers, non-technical" beats "users". |
| `[COMPARABLE_TOOLS]` | Two or three products your customers use daily. Lens 2 grades against these. |
| `[YOUR_REPOS]` | The repos a single ticket can span (e.g. API / web / workers). |
| `[YOUR_TRACKER]` | Linear, Jira, GitHub Issues — wherever tickets and linked PRs live. |
| `[YOUR_ANALYTICS]` | Your analytics tool and the path to your event catalog, if you keep one. |
| `[STRATEGIC_FEATURES]` | The bets where you always want funnel-level tracking. |
| `[TEAM_TEMPLATE]` | Path to your team's own review template, if one exists. Delete the reference if not. |

Everything else works as written.

## Why this exists

A general code-reviewer subagent is a good **finding engine** — it reads a commit range with a senior-engineer prompt and returns severity-ranked findings. But those prompts are written for reviewing *your own* in-progress work. They have no opinion about user experience, design consistency, analytics coverage, or who is qualified to sign off. They also end with a "ready to merge" verdict, which is the wrong conclusion for a product reviewer to post on someone else's work.

This skill wraps that engine in three things it doesn't have: **verification** (an independent reader re-opens the code behind every finding, and merge-blockers face two agents trying to refute them), a **product lens** nobody else on the PR is applying, and a **delivery contract** — one triaged list, anchored to the lines it's about, behind two explicit human gates.

## Step 1: Gather every PR on the ticket

Start here, immediately.

A single ticket routinely spans multiple repos (`[YOUR_REPOS]`). Reviewing one repo's PR in isolation produces confident comments about behavior the other half of the change already handles.

```bash
# from a ticket: pull it and every linked PR before reading any diff
# (via [YOUR_TRACKER] — fetch the issue, then read its attachments/links for PR URLs)

# per PR, fix the exact review range:
gh pr view <N> --repo <org>/<repo> --json title,body,baseRefOid,headRefOid,files,additions,deletions
gh pr diff <N> --repo <org>/<repo>
```

Record `baseRefOid` / `headRefOid` per PR — those pin the review to a specific range rather than a moving branch. Every later step cites that SHA.

If you keep a team review template (`[TEAM_TEMPLATE]`), read it too. **This skill owns the process** — ordering, filtering, verification, labeling, delivery, gating. A team template supplements it with local specifics. Where the two disagree on process, this file wins.

Note but don't stop for: a linked PR already merged (its diff is context, not review surface), or a PR stacked on another unmerged PR (review the base first, and say so).

### Scale the pipeline to the diff

Step 1's `--json` output already handed you `additions`, `deletions`, and `changedFiles`. Use them — **per PR**, not per ticket. One ticket routinely pairs a 12-line front-end tweak with a 600-line back-end change, and each takes its own path.

**Under roughly 50 changed lines across a handful of files, take the short path:** read the diff yourself and skip Steps 2 and 4. A diff that small fits in your context with room to spare, and reading it *is* the verification — an engine that reports a finding plus a verifier that re-opens the file to confirm it is three agents doing what one careful read already did. The lenses and the delivery contract are unchanged. Step 5 still applies to anything you'd call blocking; that stage's value doesn't scale with diff size.

**Small is not the same as low-risk, and the short path is not a lower bar.** A one-line timezone change is exactly the shape of bug that costs real customers real money. You aren't skipping the scrutiny — you're doing it yourself instead of delegating it.

**Run the full pipeline regardless of size** when the diff touches a migration, auth, money, anything that sends to customers, segmentation logic, cross-tenant reach, or a flag about to flip.

Say which path you took in the internal block.

## Step 2: Run the finding engine — and two passes alongside it

You need a senior-engineer code-review prompt. If you have the Superpowers plugin installed, invoke `superpowers:requesting-code-review` and use the template it carries, or resolve the file directly — never hardcode the version directory:

```bash
ls ~/.claude/plugins/cache/claude-plugins-official/superpowers/*/skills/requesting-code-review/code-reviewer.md
```

**If you don't have it, this skill still works.** Dispatch a `general-purpose` subagent with a senior-code-reviewer brief that returns findings grouped as **Critical / Important / Minor**, each with a `file:line`, what's wrong, and why it matters. Those three tiers are the only part the rest of this skill depends on. Disclose which engine ran.

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
> Keep your Strengths section to two sentences. It feeds a summary that has a hard length budget.
>
> If you could not establish a finding by reading the code — it depends on runtime behavior, real data shape, or a file outside this diff — write `Confidence: unverifiable` and state what you would need to check. Do not assert it as fact.

**Start these two at the same time as the engine, not after it.** Neither depends on its output, and sequencing them behind it is pure added wall-clock:

- **The decisions pass.** One narrow subagent looking for code that runs correctly and quietly made a product call. The engine will never report this class — there's no bug. `plan = row.plan || 'free'` isn't broken; it's a decision nobody asked the product owner about. Have it look for: default values on missing input, silent skips or drops of invalid data, fallback chains, tie-breaking and dedup strategy, silent clamping or coercion, swallowed errors resolving to an empty result, partial-failure handling in batches, magic-number thresholds and limits, and the behavior of whoever's left on the ungated path of a feature flag. Ask for **only the 3-5 that genuinely need a product call** — where the alternative is something a customer would notice. This category is where silent-fallback data loss comes from: a render fails, the code falls back to a default, an autosave writes the default over real user data, and no reviewer saw a bug because there wasn't one.
- **The phantom-event checks.** The `git log -S` sweep from Lens 4. Pure shell, no reason to wait.

The engine's context holds the diff; only findings come back. Don't also read the full diff yourself — you need your context for the lenses.

## Step 3: Filter what came back

In order:

1. **Drop below 80 confidence.** Below that, a finding costs the author more to disprove than it cost to generate.
2. **Drop `unverifiable` assertions** the engine flagged as runtime-dependent — unless you can convert one into a question, which is usually its better home anyway.
3. **Drop anything a linter catches**, even if the engine ranked it Important.
4. **Route the merge verdict to your human partner, never to GitHub.** The engine's "Ready to merge: Yes / No / With fixes" goes into the internal block, verbatim with its reasoning — it's the single most decision-useful line for whether to approve. It never appears in the posted review: merge-readiness is the author's call, and a product reviewer posting a merge verdict claims a judgment they didn't independently reach.
5. **Re-sort by user impact, and keep the tier.** Order by user impact rather than the engine's severity — a Minor finding on a path every customer hits outranks a Critical one behind a flag that's off. But carry each finding's tier forward; it feeds the label.

Survivors go to Step 4. Nothing reaches the review straight from here.

## Step 4: Verify every survivor independently

The engine's `Confidence: NN` is self-scored — the same pass that generated a finding also graded it. **That is not verification.** The pass that hallucinates a finding will happily score it 95.

Dispatch one subagent per surviving finding, in parallel. Give it **only** the claim, the `file:line`, and the pinned SHA. Do not pass the engine's reasoning, its confidence score, or its severity — a verifier shown the argument will confirm the argument.

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

| Verdict | What happens |
|---|---|
| `CONFIRMED` | Becomes a finding; keep the verifier's quote to hand if the author pushes back |
| `NOT SUPPORTED` | Dropped — and **listed in the internal block**, so a broken or lazy verifier shows up as a suspicious pile of drops instead of silently emptying the review |
| `CAN'T TELL FROM CODE` | Demoted to a question |

**Don't wait for the whole batch.** The moment one verifier returns `CONFIRMED` on something you'd label `[Blocks merge]`, start its refuters — while the other verifiers are still running. Steps 4 and 5 are a per-finding pipeline, not two barriers; treating them as barriers adds a full stage of wall-clock for nothing.

If nearly everything comes back `NOT SUPPORTED`, that's a signal about the verifier, not a clean PR. Say so rather than posting an empty findings list.

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
| Both refute | Demoted to a question. Not posted as a defect. |
| One refutes | Stays `[Blocks merge]`, and the dissent goes in the internal block so your partner knows it's contested before approving. |
| Neither refutes | Posted as-is. Three independent passes couldn't knock it down. |

**Cap: the top 4 blockers by user impact.** If there are more than four, attack four and say in the internal block how many went unattacked. And more than four genuine blockers is itself the headline: the PR isn't close, and that belongs in the TLDR.

---

# The Review Itself

## The one architectural rule

**The lenses are how you look. The findings list is where everything goes.**

The failure this rule exists to prevent: an issue seen through two lenses becomes two entries, and a reader counting problems gets the wrong number. In a real 13,000-character review, one issue appeared three times — once as a user-facing consequence, once as a labeled technical finding, once as a decision to ratify — and the middle one opened with "Covered above." Three entries, one issue, and no way for the author to tell.

So: **one issue, one entry.** The product consequence and the code location belong in the same finding, not in two places that each tell half of it. If you're about to write "covered above," "as noted," or "see below," you already wrote the entry — delete the duplicate.

## The TLDR — first thing in the body, always

Not optional. Five lines, fixed shape, every number already known by the time you write it:

```
**Verdict:** <Approving | Not blocking — but read #1 | Needs a fix before this merges>
**Counts:** Blocks merge <n> · Fix before ship <n> · Your call <n> · Follow-up <n>
**The one thing:** <the single finding you'd want read if they read nothing else, with file:line>
**Verified:** <ran the branch, clicked X | diff only, no click-through> · <tests re-run or not>
**Scope:** <repos and commit range this covers, and what it deliberately doesn't>
```

`The one thing` is the load-bearing line. It forces a single pick out of everything the pipeline produced — if you can't choose, the review isn't finished thinking yet.

Without this, reviews open with round context and paragraphs of praise, and the first actionable item lands past the halfway mark. Measured on real reviews: 58% and 62% of the text sat ahead of the first labeled finding.

## The findings — one list, one entry per issue

Ordered by label, then by how many users the path touches. Not by lens, not by discovery order.

| Label | Means | Bar |
|---|---|---|
| `[Blocks merge]` | user-facing bug, security hole, or data-loss path on code that will run | survived two refuters in Step 5 |
| `[Fix before ship]` | real defect, but bounded — behind a flag that's off, or a path customers reach rarely | holds the flag flip, not the merge |
| `[Your call]` | not a defect. The code quietly made a product decision and you're the one who should make it | names the alternative *and* what ships if nobody answers |
| `[Follow-up]` | real, worth a ticket, not worth holding anything | — |

Each entry:

- **Opens with one bolded sentence naming the user-visible consequence** — not the mechanism. "Single-account tokens never bind, so a later invite can move a live session" beats "`account_id` stays NULL on the fallback path."
- Then the mechanism, with **the full `file.ext:line`**. Never a bare `:166` continuing from the previous sentence — a reader scanning can't resolve it, and an inline comment can't anchor to it.
- **Technical findings are attributed to the AI that found them** — "Claude flagged…". The author needs to know which comments came from a product owner's judgment versus a subagent's diff read in order to weigh them correctly. Product and design findings are yours and don't get the attribution.
- **`[Your call]` entries** phrase it as: *"If [condition], this [does X] instead of [named alternative] — is X what we want?"* Always name the alternative; a decision can't be weighed against nothing. Always state what ships if nobody answers, because that's the real default.

**Do NOT:**
- Nitpick code style — linters handle it
- Rewrite the implementation — describe the outcome you want, let them pick the approach
- Post anything that didn't clear Step 4
- Restate a finding that already appears in the list under a different lens

## The four lenses — how you find things, not how you organize them

Run all four. Everything they surface becomes one entry in the single list above.

### Lens 1: Product experience (primary)

Evaluate from the end user's perspective — `[YOUR_USERS]`. Not the engineer's.

- **Intuitive flows** — would one of your users understand this without explanation?
- **Edge cases** — what happens on empty, loading, and error states?
- **Clear, action-oriented copy** — no jargon, no ambiguity. Copy the user actually sees counts double: an error message the UI never renders is dead copy, and the raw machine code reaches the customer instead.
- **User feedback after actions** — confirmation, progress, and *who* finds out when something fails. The person who caused a failure is often the one person the system never tells.
- **Unnecessary friction** — extra clicks, confusing navigation, hidden options
- **Demoted findings** — anything Step 4 couldn't establish from code, or that two refuters knocked down, becomes a question rather than a stated defect

**Standard:** does it feel polished and cohesive, or bolted on? Flag "good enough" UX that a small change would make good.

**Tone:** frame product feedback as questions. "What happens if a user does X?" invites dialogue better than "You forgot X."

**On what a diff can and can't tell you:** a diff supports flows with no empty/loading/error state, actions with no feedback, copy visible in the change, added clicks, and options behind unclear affordances. It does *not* support whether an interaction *feels* right. Either run the branch and look, or frame it as a question — never assert it from source. **Your human partner's own click-through findings are primary input and outrank anything derived from reading code.**

**If this lens produced nothing, that's a signal you didn't look** — not a signal the PR is clean. Say so in the internal block rather than shipping a review that's all Lens 3.

### Lens 2: Design consistency

- Does the interaction feel modern and responsive?
- Are transitions and animations appropriate — not distracting, not absent?
- Is layout and spacing intentional? Is information hierarchy clear?
- Would this hold up next to `[COMPARABLE_TOOLS]` — the products these customers use daily?
- Do two surfaces that answer the same question answer it the same way? Three places deciding the same thing by three different rules is a design finding even when each one is individually correct.

**Standard:** be specific. Say what would make it better and why it matters to the user. "Feels off" is not a review comment.

### Lens 3: Code and technical (AI-assisted)

Survivors of Steps 3-5 only. Nothing skips verification.

- Bugs or logic errors that would affect users
- Missing error handling that affects UX
- Performance concerns (N+1 queries, unnecessary re-renders)
- Security issues
- Hardcoded values that should be configurable
- Missing test coverage for critical paths — including tests whose name claims more than the assertion checks
- Deploy-order and migration-sequencing hazards, which are user-facing even though they look like infrastructure

### Lens 4: Analytics and event tracking

"If it's not tracked, we can't measure adoption" applies to every new user flow, feature surface, or meaningful state change.

**Coverage** → usually a `[Your call]` or `[Follow-up]` entry, framed as a product question: "How will we know whether customers actually use this once it ships?" Reference your event catalog (`[YOUR_ANALYTICS]`). For `[STRATEGIC_FEATURES]`, assume funnel-level tracking is needed unless the PR explicitly deprioritizes it.

**Implementation** → findings, attributed to the AI. Adjust the conventions to your own, but keep them *checkable* — vague guidance produces vague review comments:
- **Naming:** one casing and one grammar, enforced. A worked example: `snake_case`, `noun_verb_past_tense` (`block_created`, not `clickCreateBlock`), surface-prefixed when ambiguous.
- **Properties:** IDs as strings (cast when numeric); booleans prefixed `has_`/`is_`/`can_`/`was_`; enum-like values as typed unions rather than scattered boolean flags.
- **Safety:** events go through your own wrapper, never the raw vendor SDK — the wrapper is where the try/catch lives. Never wrap a primary user action in a try/catch that also handles analytics failure. Fire-and-forget: `track(...); doTheThing()`.
- **No PII** beyond what your identify call already carries. Reject raw URLs with query tokens, per-subscriber data, third-party profile payloads.
- **Service correctness:** client events from the client, server-side outcomes from the server, background/ML events from the worker.

**Phantom event check** — run every time, concurrent with the engine:

```bash
git log -S "'<event_name>'" --oneline
```

If that doesn't return the PR's own commit, the event was likely fired from spike code that never shipped. It will live in your analytics tool's autocomplete forever and never fire in production — an analyst builds a funnel on it, sees zero, and spends a day hunting a bug that doesn't exist.

## Questions — collected, numbered, at the end of the body

Anything you're genuinely asking the author goes here as a numbered list. Not embedded mid-paragraph.

One real review asked twelve questions scattered across 13,000 characters. That is zero answered questions with extra steps. Numbered, an author can reply "2 and 4: yes, 3: no." Buried, they reply to none of them.

If a question is really a finding, make it a finding. Keep this list short — if it's longer than the findings list, you're asking the author to do your thinking.

## The internal block — for your human partner, never posted

The draft you show opens with this. It is not part of the review and is stripped before any request goes out.

```
--- FOR YOU, NOT POSTED ---
Path:                  <full pipeline | short — <n> lines, read directly, no engine>
Engine merge verdict:  <Yes | No | With fixes> — <the engine's reasoning, verbatim>   (n/a on short path)
Findings dropped:      <n> failed verification — <one line each: the claim, then what the verifier found instead>
Contested blockers:    <finding> — 1 of 2 refuters disagreed: <their reasoning>
Blockers unattacked:   <n — only if the Step 5 cap was hit>
Lens 1 yield:          <n findings | nothing surfaced — flag if the diff is user-facing>
Inline vs body:        <n> anchored inline, <n> in body because their line isn't in the diff
---
```

Every line is something the reviewer needs in order to weigh approval and cannot get from the posted review.

**None of it goes in the posted review — the dropped-findings line least of all.** Publishing it ("three findings got killed when I had them independently re-read") tells the author about problems that don't exist and reads as process theater. What survived is the review. What didn't is between you and your partner.

---

## Step 6: Voice

- **Direct. No hedging, no fluff, no trailing summary** of what the review covered.
- **Praise: two sentences, maximum.** Accurate praise earns trust, and the engine is told to keep its Strengths section short for this reason. But when 60% of a review sits ahead of the first actionable item — mostly praise and round context — a real fix ends up below the fold. Lead with the TLDR; put the credit in a line, not three paragraphs.
- **Suggestions over mandates.** Product feedback as questions.
- **Skip anything a linter would catch.**
- **On a round-2-or-later review**, the reader wants what changed since last round and what's still open. Confirm the previous round's items closed in one line each. Don't re-litigate your own earlier reasoning — a paragraph explaining what you had backwards last time costs the author more than it's worth.
- **Disclose the tooling:** "I used Claude to help me review the code changes here." Reviewing someone's work with an AI and not saying so is the kind of thing that only has to be discovered once.

## Step 7: Post one review, with findings on the lines they're about

`gh pr comment` drops everything in one block at the bottom. That is the wrong container: a finding that already knows its `file:line` belongs *on* that line. It is also what every other reviewer on the PR is already doing — human and bot alike — so a bottom-comment review is the odd one out.

Use the reviews endpoint, which carries a body and inline comments in one call:

```bash
gh api --method POST repos/<org>/<repo>/pulls/<N>/reviews --input review.json
```

```json
{
  "event": "COMMENT",
  "body": "<TLDR, then any finding that can't be anchored, then questions>",
  "comments": [
    { "path": "src/controllers/authorizations_controller.rb",
      "line": 165, "side": "RIGHT",
      "body": "**[Fix before ship] Single-account tokens never bind.** …" }
  ]
}
```

**Inline** — every finding whose `file:line` is in this PR's diff. Most of them, since Step 4 already made the verifier cite the line it confirmed against.

**Body** — the TLDR, the questions, and any finding pointing at a line the diff doesn't touch. Those are real and often important: a finding about a file the PR never modified is frequently the whole point of the finding. It cannot be anchored; it goes in the body.

Two mechanics that will bite:

- `side: "RIGHT"` is the post-change line. **Check every target line against `gh pr diff` before adding it inline** — an out-of-diff anchor rejects the entire call, so one bad line loses every comment rather than just its own. Demote anything you can't place.
- One atomic call means you cannot post half a review. That makes the draft the only place your partner can catch anything.

**Multi-repo: each finding is posted once, in the repo where the fix lands.** Two PRs on the same ticket, posted 28 seconds apart, once carried the same four findings between them — so the author read each one twice and had to work out whether it was one ask or two. Put the finding where the fix goes; in the other PR, one line pointing at it.

## Step 8: Two gates, both explicit

Separate, and neither is ever inferred:

1. **Post the review?** Show the complete assembled draft first — the internal block, the body as it will render, and a list of `path:line → label + first line` for each inline comment. Your partner answering a question *about* the draft is not approval to post it.
2. **Formally approve the PR?** A separate ask, always. Never approve unless the answer to this specific question was yes.

Ask as one question with two parts: *"Post it? And comments only, or approve too?"*

Then, and only then — strip the internal block first:

```bash
# gate 1
gh api --method POST repos/<org>/<repo>/pulls/<N>/reviews --input review.json
# gate 2, only on an explicit yes:
gh pr review <N> --repo <org>/<repo> --approve
```

## Global Rules

- **Start on trigger.** Don't ask permission to begin, don't describe the pipeline before running it. The gates are at the end.
- **One issue, one entry.** The lenses are how you look, not where things go. "Covered above" means you wrote a duplicate.
- **One finding, one repo.** On a multi-repo ticket, post each finding where the fix lands and cross-reference from the other. Never say the same thing twice in two PRs.
- **Nothing reaches the PR unverified.** Every posted finding survived an independent read of the code at the cited line — Step 4's verifier on the full pipeline, your own read on the short path. Every `[Blocks merge]` finding also survived two refuters.
- **Never post or approve without its own explicit yes.** Two gates, no inference. Approval is a named human's sign-off on someone else's work; it isn't yours to grant by implication. (This rule is here because it was learned the hard way — a pair of stacked PRs approved without a go, both of which had to be dismissed.)
- **The merge verdict and the dropped findings go to your human partner, never to GitHub.** Always.
- **Never claim more verification than happened.** If you read the diff but didn't run the branch, the review must not imply a click-through, and the TLDR's `Verified:` line must say `diff only`.
- **Disclose every cap and drop** in the internal block. A silent omission reads as coverage.
- **All PRs on the ticket before any comment on any of them.** The cross-repo half of a change is where confident wrong comments come from.
- **Don't pad.** Three real findings beats three real findings plus nine nits. Volume trains people to skim — in practice the most useful review is usually the shortest one.
- **Lens 1 is the point.** A review that comes out all Lens 3 failed — that's a code review wearing this skill's headings. The technical pass is the cheap part and anyone can run it; the product lens is the part only the product owner brings.
- **Wrong-tool check:** the PR is your partner's own and an engineer is inheriting it → `pre-merge-handoff-gate`. The question is "what else does this touch" → `blast-radius-gate`. Auditing a branch your partner built themselves → `feature-audit`. This skill reviews someone else's finished work.
