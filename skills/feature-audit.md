---
name: feature-audit
description: "**Feature Branch Audit Suite**: Deploys specialized audit agents against the current feature branch to evaluate production readiness, UX quality, user flow completeness, copy/content quality, integration contract integrity, and observability. MANDATORY TRIGGERS: audit, production readiness, code review, handoff, ready for handoff, QA, quality check, feature review, is this ready, evaluate this branch, vet this code, check this branch. Also trigger when the user says things like 'run the audits', 'deploy the agents', 'is this shippable', 'prep this for handoff', 'check if this is production ready', 'review my POC', 'evaluate this feature', or references preparing a feature branch for engineering handoff. Trigger whenever the user mentions wanting a CTO review, architect review, designer review, or QA review of a branch they've been working on."
---

# Feature Branch Audit Suite

Deploy one or more specialized audit agents against the current feature branch. Built for POC-to-production handoffs where a non-technical builder needs an honest assessment before the engineering team takes over.

## How It Works

Each audit is a self-contained prompt in `~/.claude/commands/prompts/`. They all follow the same two-phase pattern:
- **Phase 1: AUDIT** — read-only review, produces a numbered issue table
- **Phase 2: FIX** — works through approved issues, one commit per fix

You run the audits, review the consolidated findings, decide what to fix by number, and Claude does the rest.

## Step 0: Convention Discovery & Scope Check

Before running any audits, do two things:

### Learn the codebase conventions
Study the existing (non-branch) code to establish the baseline for how this team builds. Look at 2-3 existing examples of each relevant pattern:

- **Controllers/API endpoints** — routing style, param handling, authorization pattern, response format, error handling approach
- **Models** — validation style, callback usage, scope patterns, association conventions
- **React components** — file structure, state management approach (hooks vs context vs redux), styling method (CSS modules, Tailwind, styled-components), naming conventions
- **Services/interactors** — how business logic is organized outside models/controllers
- **Tests** — framework (RSpec/Minitest, Jest/RTL), what gets tested, fixture/factory patterns, how integration tests are structured
- **Frontend API calls** — how the app talks to the backend (fetch wrapper, axios, React Query, etc.)

Store these conventions mentally. Every audit should judge the branch code against **how this specific codebase does things**, not generic best practices. The goal is for the new code to look like the existing team wrote it.

### Check branch scope
Run `git diff main..HEAD --stat` and count the changed files. If the diff touches more than ~40 files or ~1500 lines added, flag it to the user before proceeding:
- Note the scope is large enough that it may be worth splitting into multiple PRs
- Suggest logical split points if obvious (e.g., "backend models + API" as one PR, "frontend UI" as another)
- Let the user decide whether to continue auditing as-is or split first

Then proceed to Step 1.

## Step 1: Ask What to Run

When triggered, ask the user which audit set to run:

- **full** — all six audits (best for handoff prep)
- **code** — production readiness + integration contracts + observability
- **experience** — UX/design + user flow + copy/content
- **quick** — production readiness only (fastest sanity check)
- Or name specific audits: `production`, `ux`, `flow`, `copy`, `integration`, `observability`

If the user just says "audit this" or "is this ready," default to **full**.

## Step 2: Run the Audits

Read each selected prompt file from `~/.claude/commands/prompts/`:

| Audit | Prompt File | What It Covers |
|-------|-------------|----------------|
| Production Readiness | `~/.claude/commands/prompts/production-readiness.md` | Code quality, DB, security, errors, performance, tests, types, deployment |
| UX & Design | `~/.claude/commands/prompts/ux-design.md` | Visual consistency, interaction states, loading/empty/error states, responsive, accessibility |
| User Flow Completeness | `~/.claude/commands/prompts/user-flow.md` | Happy path, back/navigation, empty states, permissions, interruption recovery, boundaries |
| Copy & Content | `~/.claude/commands/prompts/copy-content.md` | Terminology, button labels, error messages, help text, empty states, grammar |
| Integration Contracts | `~/.claude/commands/prompts/integration-contracts.md` | Frontend↔backend, backend↔third-party, webhooks, timeouts, data mapping, type safety |
| Observability | `~/.claude/commands/prompts/observability.md` | Logging, error tracking, traceability, metrics, alerting, background job visibility |

**Phase 1 audits are read-only and independent — run them in parallel using the Agent tool.** Spawn one agent per selected audit, each reading its own prompt file and executing Phase 1 only. This is critical for performance; sequential execution is unnecessarily slow.

When consolidating results in Step 3, present findings in this logical order:
1. Production readiness (structural foundation)
2. User flow completeness (missing paths)
3. UX & design (visual/interaction quality)
4. Copy & content (user-facing text)
5. Integration contracts (API boundaries)
6. Observability (debuggability)

Every audit is Phase 1 only on the first pass — do NOT fix anything yet.

## Step 3: Consolidate

After all selected audits complete Phase 1, produce a **single consolidated report** with:

1. **Executive Summary** — 3-4 sentences covering overall state. A non-technical person should be able to forward this.
2. **Overall Readiness Rating** — RED / YELLOW / GREEN
3. **Effort Estimate** — S / M / L to get production-ready
4. **Consolidated Issue Table** — merge all audit findings, deduplicated, numbered sequentially:

| # | Severity | Audit | Area | File:Line | Issue | Fix Approach | Effort |

Where Audit is tagged like [Prod], [UX], [Flow], [Copy], [Integration], [Obs].
Sort: MUST FIX → SHOULD FIX → NICE TO HAVE.

5. **Conflicting Recommendations** — if two audits disagree on approach, call it out
6. **Architectural Decisions Needing Team Input** — things Claude shouldn't decide alone
7. **Critical-Path Tests** — the tests that must exist before merge

Present this report and STOP. Ask for approval before any Phase 2 work. Remind the user they can approve/skip items by number (e.g. "fix all MUST FIX, skip #4 and #12, do SHOULD FIX except #18").

## Step 4: Fix

Once the user approves, work through fixes following the Phase 2 instructions in each prompt file. The order is:

### Round 1: MUST FIX items
- Fix each issue
- One commit per fix, prefixed with the audit tag: `fix(prod):`, `fix(ux):`, `style(copy):`, etc.

### Round 2: SHOULD FIX items
- Same process

### Round 3: Tests
- Write tests for all critical-path cases
- Commit with `test:` prefix

### Round 4: NICE TO HAVE items
- Ask the user which ones to address before stopping

### After all fixes:
- Run the full test suite and report results
- Run the linter/formatter and fix violations
- Confirm the app boots and describe manual steps to verify the happy path
- Give the user a final summary of what was fixed, what remains, and known trade-offs

## Global Rules

These apply across ALL audits:

- **Phase 1 is READ ONLY.** Do not modify any files during the audit phase.
- **Do not amend, squash, or rebase existing commits.** All fix commits go on top.
- **Never combine multiple fixes in one commit.**
- **Don't refactor working code for style.** Focus on correctness, safety, and maintainability.
- **If an issue has multiple valid approaches, don't pick one.** Flag it for the team.
- **If a fix could break existing functionality, ask before proceeding.**
- **When in doubt about intent, ask — don't assume.**
- **Compare against main.** Use `git diff main..HEAD --name-only` to identify changed files. Only audit those files.
