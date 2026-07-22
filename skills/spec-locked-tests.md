---
name: spec-locked-tests
description: "**Spec-Locked Tests**: Converts an approved PRD requirements checklist into one concrete, failing test case per requirement — written and committed before a single line of implementation exists — then locks those tests so the only legal way to make them pass is fixing the code, never editing, loosening, or deleting the test. Built for the common failure mode where the same AI (or engineer) writes the code and then writes its own tests afterward, which structurally produces tests that confirm whatever the implementation already does, bugs included — a green suite that's really self-graded homework rather than proof anything works. Use this the moment a PRD's Slice 1 (MVP) Requirements checklist gets approved and before implementation starts, and again any time new requirement bullets get approved mid-project. Trigger on: 'lock the tests to the spec', 'write tests before we build this', 'spec-lock these requirements', 'generate tests from the PRD requirements', 'red tests before implementation starts', 'don't let the tests get rewritten to match the code', 'requirements are approved, write the test cases', 'test-first against the PRD'."
---

# Spec-Locked Tests

Turns an approved requirements checklist into tests that exist to catch the implementation, not to describe it. Every requirement bullet gets exactly one concrete test case — specific input, specific expected output, and a one-line note on what user-facing failure it's guarding against — written and committed while the implementation is still a stub, so it fails red for the right reason before it has any chance to fail green for the wrong one.

## Why this exists

Tests written after the code, by whoever (or whatever) wrote the code, tend to describe what the code does rather than what it was supposed to do. That's not a moral failing, it's structural: if the implementation has a bug, a test written by looking at the implementation's actual behavior will often encode the bug as "expected." A green suite produced this way is closer to self-graded homework than evidence the feature works.

Spec-locked tests flip the order. The test is derived from the requirement bullet, not from the code — and it's written, run (to confirm it fails), and committed *before* the implementation exists to look at. That ordering is the whole mechanism. Once a test is locked, "the test needs to change" becomes a five-alarm signal instead of a routine edit.

## When to run

- The moment a PRD's `## What We're Shipping` → `### Slice 1 (MVP...)` → `**Requirements:**` checklist changes from Draft to Approved (check the `**Status:**` line at the top of the PRD) — and **before** any implementation code is written.
- Any time a new requirement bullet gets approved mid-project (a Slice 2 pull-forward, a scope change) — run the same process against just the new bullet(s).
- Not for spikes or exploratory throwaway code with no approved requirements yet — there's nothing to lock against. If the PRD status is still `Draft`, stop and tell the user: "Requirements aren't approved yet — spec-locked tests need an approved checklist to lock against. Come back once Slice 1's requirements are marked Approved."

## How It Works

Two phases, run in order, never skipped or reordered:

- **PHASE 1: LOCK** — read-only against the codebase, write-only against a new test file and a stub implementation. Produces one committed, intentionally-failing test per requirement bullet.
- **PHASE 2: BUILD** — implementation happens here. Tests only move from red to green by changing implementation code. Any request to change a locked test is intercepted and escalated, never executed silently.

---

## PHASE 1: LOCK — turn approved requirements into failing tests

### 1. Find the approved requirements

Open the PRD (e.g. `prds/<feature-name>.md`). Confirm `**Status:**` is `Approved`, then extract every `- [ ]` bullet under `### Slice 1 (MVP...)` → `**Requirements:**`, verbatim. Each bullet becomes exactly one test case — don't merge two bullets into one test, and don't split one bullet into several unless the bullet is actually compound (if it is, flag that to the user — it probably should have been two requirements).

### 2. Generate one test case per requirement bullet

For each bullet, produce three things, in this order:

1. **Concrete input** — an actual value, payload, or sequence of actions. Not "a user submits the form" — "a user submits form X with field `email` = `a@b.com` at t=0, then submits the identical payload again at t=2s."
2. **Expected output/behavior** — the specific, checkable assertion. Not "it should be rejected" — "the second request returns HTTP 409 and no second record exists in [table/store]."
3. **What it protects** — one sentence naming the user-facing case this locks in, e.g. "protects against double-charging a customer who double-clicks submit."

Do this for every bullet before writing any test code — it's much easier to catch a vague or untestable requirement at this stage (in prose) than after it's half-coded as a test.

If a requirement bullet can't be turned into a concrete input/output pair (e.g. "the UI should feel fast"), that's a sign the bullet itself isn't testable as written — flag it to the user and ask for a measurable version (e.g. "response renders within [X]ms") rather than silently skipping it or inventing your own vague test.

### 3. Stub the implementation just enough to run red

Create (or extend) the implementation file(s) with a stub: a function signature, route, or component that exists and is importable, but does nothing real yet — returns a placeholder, throws `NotImplementedError`, or returns a hardcoded wrong value. The goal is that the test suite can find and run the test; it should fail on the *assertion*, not error out on a missing import or undefined route.

```
# generic — adapt paths/commands to your actual stack
[test runner command, e.g. `npm test`, `bin/rails test`, `pytest`] path/to/new/spec
```

### 4. Confirm every new test fails for the right reason

Run the new tests. Every one of them must fail with an **assertion failure against stub behavior** — not a collection error, import error, or syntax error. A test that can't even run doesn't prove the harness is wired correctly; a test that runs and fails cleanly does.

- ✅ Correct red: `expected 409, got 200` (stub always returns 200)
- ❌ Not proof of anything: `ModuleNotFoundError: cannot import 'submitForm'`

If you see the second kind, fix the stub/import wiring — don't move on until every new test is red for a real assertion mismatch.

### 5. Commit the red tests — before writing real implementation

```bash
git add path/to/new/spec [stub implementation files]
git commit -m "test(spec-lock): <requirement short name> — red, pending implementation"
```

One commit (or one clean batch of commits) per requirement, or per logical group of requirements if several are tightly related. This commit is the artifact of record — what the requirement checklist bullet literally means, translated into code, captured before implementation bias can creep in.

### 6. Confirm the mapping with the human before implementation starts

Present the full table — requirement bullet → concrete input → expected output → what it protects → test file/line — and ask directly: "Do these test cases match what you actually meant by each requirement bullet?" This is the one point in the whole process where a human should catch a mis-specified test, because after this it becomes the thing implementation is graded against. Don't start Phase 2 without this confirmation.

---

## PHASE 2: BUILD — make tests pass by changing code, never the test

### 7. Implement against the locked tests

Write the real implementation. Run the locked test suite continuously. The only acceptable way to turn a locked test green is by changing the implementation code that it exercises.

### 8. The Lock: what to do if a test looks like it needs to change

If, at any point during implementation, it looks like a locked test needs to change — a different expected value, a different input, a loosened assertion, a skip/`xfail`, a comment-out to "unblock the build" — **stop. Do not edit the test.** Surface it to the human explicitly, using language like:

> "This test was derived directly from an approved requirement and now looks like it needs to change. That usually means one of two things: either (1) the requirement itself changed — go back to the PRD and get the bullet re-approved, or (2) the implementation is about to route around what was actually asked for. Which is it?"

This flag is loud and blocking on purpose. Never resolve it by quietly loosening the assertion, deleting the test, adding a skip, or commenting it out "temporarily" — any of those is a silent edit even though a diff technically exists. If the human confirms the requirement genuinely changed, go update the PRD bullet first, get it re-approved, then update the test as a new, visible step (not folded into the implementation diff) — then resume Phase 2.

**One narrow exception:** you may edit a locked test without stopping to ask if the *only* change is fixing a bug in the test's own harness code (wrong import, wrong helper call, a typo in setup) that does **not** touch the input, the expected output, or the requirement it maps to. Even then, commit it separately and visibly: `test(spec-lock-fix): <reason, no assertion changed>` — never bundled into the same commit as implementation changes.

### 9. Verify green for the right reasons

Once all locked tests pass, spot-check that each is passing for a real reason, not by accident:

- Would this test still pass if the underlying bug were reintroduced? (Mentally revert the fix and confirm the test would go red again.)
- Is any assertion trivially true (e.g. asserting a value against itself, or a mock that stubs out the exact behavior the test is supposed to verify)?

Then run the project's full test suite and linter as normal — spec-locked tests supplement the existing suite, they don't replace it.

### 10. Handoff note

In the PR/commit description, include a table mapping each requirement bullet → its test name → final status, so a reviewer (or future engineer) can trace requirement → test → code without re-deriving any of it.

---

## Worked Example

**Requirement bullet (from an approved PRD Slice 1):**
`- [ ] Duplicate form submissions within 5 seconds of the first are rejected (409), not double-processed.`

**Test case generated in Phase 1:**

| | |
|---|---|
| Input | Submit payload `{idempotency_key: "abc123", amount: 42}` at t=0s. Submit the identical payload again at t=2s. |
| Expected | First request → `200`, record created. Second request → `409`, no second record created, exactly 1 row exists in [orders table / store]. |
| Protects | A user double-clicking submit (slow network, impatience) doesn't get double-charged or double-processed. |

This gets written as a real test against a stub `createOrder()` that currently always returns `200` — confirmed red (`expected 409, got 200`) — and committed as `test(spec-lock): reject duplicate submissions within 5s — red, pending implementation`.

**The failure mode this prevents:** implementation ships without any dedupe/idempotency check. If tests are written *after*, by the same AI that wrote the implementation, the natural move when it notices the second submission returns `200` and creates a second row is to write the test to match: assert two records are created, or drop the timing assertion entirely, because "that's what the code does." The suite goes green, the duplicate-charge bug ships, and nothing ever pointed at it. With the test locked *first*, that path is closed — the 409 assertion already exists and is already committed, so the only way to reach green is to actually add the dedupe check.

**Second example — an authorization requirement:**
`- [ ] Only users with [admin role] can revoke a pending [invite/resource]; other roles get 403 and the [invite/resource] stays pending.`

Locked test: a non-admin user calls the revoke endpoint on a pending invite → expect `403`, invite status unchanged. If the authorization check is simply forgotten during implementation, a post-hoc test written by looking at actual behavior would see a `200` and an invite that got revoked — and, written after the fact, might "pass" by asserting exactly that, silently erasing the security requirement. Because the `403` assertion was locked in before the endpoint existed, the only way to go green is to actually add the check.

## Global Rules

- **Tests are written and committed before real implementation exists, every time.** If implementation code for a requirement was written first, the process was skipped — go back and do Phase 1 properly rather than writing tests that describe what's already there.
- **A locked test changes only through the loud-flag path in Step 8.** No silent edits, no "just this once," no skip/xfail as a workaround.
- **One test case per requirement bullet, traceable by name.** If you can't point at which bullet a test derives from, it isn't a spec-locked test — it's just a test.
- **Every locked test must show a real red before implementation, and a real green after.** A test that errors instead of asserting-false proves nothing; a test that passes by coincidence proves nothing either.
- **Never bundle a test-harness fix (Step 8's narrow exception) with implementation changes in the same commit.** Keep the audit trail clean — someone should be able to look at history and see "test added red" → "test-harness typo fixed, no assertion changed" → "implementation made it pass," in that order.
- **This process supplements the project's existing test suite and conventions (RSpec/Jest/pytest or your actual framework) — it doesn't replace them.** Locked tests live alongside normal tests; they're just the subset that came from approved requirements and carry the extra protection in Step 8.
- **If a requirement bullet can't be made concrete (no checkable input/output), don't force a test — flag the bullet back to the PRD.** A vague test is worse than no test: it looks like coverage without providing any.
