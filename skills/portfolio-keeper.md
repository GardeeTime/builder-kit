---
name: portfolio-keeper
description: "Keep a personal work/career portfolio up to date, so you're never stuck trying to reconstruct months of shipped work from memory when a promo case, a LinkedIn update, a personal site, or a job search suddenly needs it. Flags staleness relative to actual finished work, audits/redacts sensitive info before anything leaves your machine, and can upgrade a claim from a self-reported story into a verified proof chain with a calibration track record. Trigger on: 'log this to my portfolio', 'add this to my portfolio', 'update my portfolio', 'is my portfolio stale', 'portfolio audit', 'prep my portfolio for sharing', 'is my portfolio safe to share', 'redact my portfolio', 'scrub my portfolio', 'help me update my LinkedIn', 'build my promo case', 'what have I shipped this quarter', 'what should go on my personal site', 'verify my portfolio', 'build my track record', 'how good have my predictions been'."
---

# Portfolio Keeper

Keeps a running work/career portfolio file current and safe to share. Three independent jobs — run whichever one the user is asking for.

## Why this exists

The work worth bragging about almost always happens mid-sprint, not at review time. Three months later, when a promo packet, a LinkedIn update, a personal site refresh, or a job search actually needs the details, most of it is gone — the sharp metric, the exact customer quote, the clever workaround, the real scope of what you owned. Reconstructed from memory, it comes out vague ("helped ship a few features") instead of specific ("owned X end-to-end, cut Y by Z%").

This skill exists to close that gap: capture the entry while it's still fresh, so when one of these moments hits, you're pulling from a running record instead of trying to remember:

- **A promotion case** — concrete, dated evidence of scope and impact, not a scramble the week before calibration
- **LinkedIn / a personal site** — a backlog of real accomplishments to draw from, already in your own words
- **A job search** — interview stories and a resume that don't depend on remembering what happened two jobs ago

The catch: the same detail that makes an entry good evidence — real numbers, real customer names, real internal context — is often exactly what shouldn't leave the building unredacted. That's why Workflow 3 exists: "documented" and "safe to share" are two different steps, not one.

## What this skill does

1. **Capture** — log a finished piece of work as a new entry, in a consistent format.
2. **Freshness check** — flag when the portfolio hasn't been updated relative to work that's actually shipped.
3. **Sharing scrub** — audit entries for information that shouldn't leave your machine, and produce a redacted export that's actually safe to hand to someone else.
4. **Verified evidence & calibration** — upgrade an entry from a self-reported story into a proof chain (PRD → merged PR → real metric), and track how well your own predictions have actually called it over time.

## File conventions

- Find the portfolio file at a path the user names, or a common default: `work-portfolio.md`, `career-portfolio.md`, or `portfolio.md` at the home directory or a repo root. If none exists and the user wants to start one, create it using the entry format below.
- Treat this file as **private by default**. Never commit it, or an unredacted export of it, to a public repo. If it ever lives inside a git repo, check that `.gitignore` covers it — add it if not.
- Every entry carries a **Visibility** tag (see format below). Default new entries to `Needs review` — never assume something is safe to share just because the user is excited about it.

## Entry format

```markdown
## [Project/Initiative Name] — [Month Year]

**Role:** [Your role/title at the time]
**Company/Context:** [Company or team — can be blanked out later for a public version]
**Visibility:** Private | Cleared for external sharing | Needs review

**Situation:** [1-2 sentences: what was the problem/opportunity?]
**Action:** [1-3 sentences: what did you specifically do?]
**Result:** [Impact — metrics if you have them, qualitative outcome if you don't]

**Skills demonstrated:** [tags, e.g. "cross-functional leadership", "0-to-1 build", "AI-assisted engineering"]
**Evidence:** [link to PR, doc, launch post — private links are fine, this file isn't going anywhere by itself]
```

## Workflow 1: Capture a new entry

1. Gather what was built, the role, the timeframe, and the result — ask directly, or pull from conversation context. If there's a task-tracking file (e.g. a `todo.md` following the `##  Results` convention) for a just-finished initiative, offer to draft the entry from that instead of starting from scratch.
2. Draft the entry in the format above. Default **Visibility: Needs review** — even if the user says "this one's fine to share," ask once ("sure this doesn't reference anything confidential — figures, unreleased names, other people?") before setting it to `Cleared`.
3. Append it to the portfolio in whatever order the existing file uses (most files read newest-first — check before assuming).
4. Don't rewrite or "improve" older entries while doing this. Stay scoped to the new one.

## Workflow 2: Freshness check

1. Find the most recent entry's date.
2. Ask the user (or check recent git history / task-tracking files if pointed at a specific repo) what's shipped since then that isn't captured yet.
3. List what's missing as candidate entries — don't draft them yet, just flag them — and ask which ones are worth capturing.
4. This is a nudge, not an automatic write. Never add entries without the user confirming what to include.

## Workflow 3: Sharing scrub — PHASE 1: AUDIT (read only)

Before any part of this file goes external (a recruiter, a personal site, a LinkedIn post, a public repo), audit every entry currently marked `Cleared for external sharing` or `Needs review` for:

- **Exact financial figures** — revenue, ARR, pricing, funding amounts, specific customer counts — unless already publicly announced by the company
- **Unannounced product or feature names** — anything not yet publicly launched
- **Named customers or partners** without confirmed public permission (case study, testimonial, press release)
- **Named coworkers or leadership** in any context that could embarrass them or reveal internal disagreement
- **Internal tool, system, or architecture names** that reveal more about how the company builds than is public
- **Security-relevant details** — auth patterns, infra layout, anything that reads like a blueprint
- **Credentials, tokens, or internal URLs** — if you find any of these, stop and flag it immediately rather than quietly redacting and continuing

For each flagged entry, produce a table:

| Entry | Flagged Text | Why | Suggested Redaction |

Only list flagged entries — don't relist clean ones. End with a summary: how many entries are safe to export as-is vs. need a redaction, and whether anything triggered the credentials/tokens stop-condition above.

## Workflow 3: Sharing scrub — PHASE 2: FIX (only after user approves)

- Apply approved redactions to a **separate export file** (e.g. `portfolio-public.md`) — never overwrite the private master file.
- Generalize rather than delete where possible: "grew a key adoption metric by double digits" beats losing the achievement entirely.
- Re-run the Phase 1 audit against the export before calling it done.
- Remind the user: the export is only as safe as the last audit. Re-run this before every new share, not just the first one — a portfolio changes, and yesterday's clean entry can pick up something sensitive on the next edit.

## Workflow 4: Verified Evidence & Calibration Ledger

Trigger phrases: "verify my portfolio," "build my track record," "add proof to this entry," "how good have my predictions been."

A Situation/Action/Result entry is self-reported — exactly the format a skeptical promo committee, hiring manager, or your own future self already discounts by default. This workflow upgrades an entry from a claim into something a reader can actually click through and check.

1. **Assemble the proof chain.** For the initiative behind an entry, find and link: the originating PRD (if one exists — see [`prds/prd-template.md`](../prds/prd-template.md)), the merged PR(s) across whichever repos touched it, and — if the PRD had a "Success Looks Like" metric — a real query or screenshot comparing that metric before vs. after the ship date.
2. **Flag what's missing, don't fabricate it.** If there's no PRD, no merged PR, or the metric was never actually pulled (just assumed to have gone well), say so explicitly on the entry rather than quietly treating the claim as proven. An entry marked "metric not verified" is more credible long-term than one silently overstated.
3. **Score it against its own prediction.** If the originating PRD had a stated success/kill signal, mark the outcome: `Hit` (metric met target), `Partial` (moved the right direction, missed the target), `Miss` (target metric didn't move, or the kill signal fired), or `Not measured`.
4. **Roll it up into a calibration summary.** Across enough entries, this becomes an actual track record: how often did you correctly predict what would work before building it? That calibration — not the raw count of things shipped — is the harder-to-fake signal of senior product judgment. Keep a running summary line at the top of the portfolio file, separate from individual entries, e.g. "14 bets: 8 hit, 3 partial, 2 miss, 1 not measured."

### Entry format addition

Add these two fields to any entry that's gone through this workflow:

```markdown
**Proof chain:** PRD: [link] | PR(s): [link(s)] | Metric: [before] → [after], measured [date]
**Outcome vs. prediction:** Hit | Partial | Miss | Not measured
```

## Safety notes

- This file is a personal record, not a deliverable. Never commit it (or an unredacted export) to a public repo. If it's ever tracked in a git repo, confirm `.gitignore` covers it.
- Never mark an entry `Cleared for external sharing` on the user's behalf — that's always their call.
- If you find live credentials, API keys, or tokens anywhere in the file, stop and flag it immediately rather than proceeding with the rest of the audit.
- Treat every new entry as `Needs review` until the user says otherwise.
- Never fabricate a metric or a link to make a proof chain look complete. An honestly incomplete entry (marked `Not measured`) is more valuable long-term than a fabricated one — if you can't verify something, say so instead of guessing.
