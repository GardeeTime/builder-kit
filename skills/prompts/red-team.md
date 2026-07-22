---
name: red-team
description: "**Red Team / Attack Simulation Audit**: The 7th audit in the feature-audit suite, and the only one that runs the branch instead of reading it. Boots the local stack for the branch under audit and actually attacks the running feature: replays and resends requests after they've already succeeded, double-submits and fires concurrent/simultaneous requests at the same endpoint to expose race conditions, substitutes another tenant's or user's ID into requests that should be scoped to the current user, submits malformed or oversized payloads, and tampers with client-side values that should be server-validated. Every finding ships with the literal repro (the exact request/input used) instead of a risk rating, so a broken case is proven by execution, not guessed at from reading the diff. Trigger on: 'red team this', 'try to break this', 'attack test this branch', 'can this be abused', 'pentest this feature', 'stress test this before shipping', 'try to exploit this flow', 'run the red team audit'."
---

# Red Team Audit

You are attacking this feature branch, not reading it. Every other audit in this suite is a static read-through of code — this one boots the branch and actually attacks it. A hallucinated API call, a missing tenant scope, or a race condition all look completely plausible on the page; they only fail when someone actually invokes them. That's this audit's job. Identify the actual stack used in this codebase before you start — don't assume one.

## PHASE 1: AUDIT (NOT read-only — this phase requires actually running the app)

Every other audit in this suite is read-only in Phase 1. This one isn't: you are expected to execute commands, boot the local stack, seed test data, and fire real requests at a running server. You are still **not** allowed to edit application source files during Phase 1 — fixing anything happens in Phase 2, after the user approves. If getting the app to boot requires installing dependencies, setting an env var, or seeding data, do that; don't touch application code to make it boot.

### Step 1: Identify the attack surface

```bash
git diff main..HEAD --name-only
git diff main..HEAD -- '*routes*' '*controller*' '*handler*' '*api*'
```

Build an explicit target list from the diff: every new or changed route/endpoint/form, its HTTP method, its auth requirement, and what it's supposed to be scoped to (current user, current tenant, current account, etc.). This list is what you attack — don't go attack the whole app, attack what this branch changed. Only widen scope if time allows and the user asks for it.

### Step 2: Boot the local stack

Check for this project's own dev-setup instructions first — [README.md], [CONTRIBUTING.md], [docs/dev-setup.md], or a project CLAUDE.md/AGENTS.md — and use whatever they say. Don't guess a generic command if one is documented. If nothing is documented, infer the boot command from what's actually in the repo ([package.json scripts, docker-compose.yml, Procfile, Makefile, bin/ scripts]).

Confirm the stack is actually up — hit a health-check route or load a real page/response, don't just confirm a process started and assume it's healthy.

If it won't boot: stop. Report that as the top finding on its own — a branch that can't run has failed this audit before a single attack was attempted. Don't spend Phase 1 debugging the boot process beyond straightforward fixes (missing env var, missing `bundle install`/`npm install`); if it needs an actual code fix to boot, that's a MUST FIX finding for Phase 2, not something to patch silently now.

### Step 3: Prepare attack fixtures

Seed at least two distinct users/tenants/accounts — throwaway, never real customer data — so tenant-substitution attacks have a second identity to substitute in. Capture a valid authenticated session/token/cookie for at least one of them; you'll reuse it across attacks.

### Step 4: Run each attack category below against every item on the attack-surface list from Step 1

For each attack, capture: the literal request you sent (method, URL, headers, body — the actual values, not a description of them), the literal response you got back (status code, body), and anything relevant in server-side logs/console output. A "broke" case sometimes returns a clean-looking response to the client while an unhandled exception is silently logged and swallowed server-side — check logs for every attack, not just the HTTP status.

Classify every attempt as one of:
- **BROKE** — the attack succeeded: a side effect happened that shouldn't have, data leaked across a boundary that should've blocked it, or the server errored/crashed instead of rejecting cleanly.
- **HANDLED GRACEFULLY** — the attack was cleanly rejected (sensible 4xx, idempotent no-op, no unintended side effect) with no rough edges.
- **UNCLEAR** — you couldn't get a conclusive result (e.g., a race window too narrow to reliably trigger, or a response that looked fine but you couldn't verify server-side state). Say exactly what you tried and why it was inconclusive — don't force a verdict.

#### 1. Replay / resend

Capture one valid state-changing request (POST/PUT/PATCH/DELETE) that already completed successfully. Wait for it to fully finish, then resend the exact same request unmodified — same body, same auth, same idempotency key if one exists.
- HANDLED: server recognizes it (idempotency key, dedup check) and returns a no-op or the original result without a second side effect.
- BROKE: the side effect happens again (duplicate record, double charge, a second email/notification sent, a counter decremented twice).

#### 2. Double-submit

Fire the same state-changing request twice back-to-back with no coordination — simulating a user double-clicking "submit"/"pay" — rather than resending a stale, already-completed request later (that's #1). If the client normally mints a fresh idempotency key per submission, generate one fresh per request here too; that's the realistic case.
- BROKE: two records/effects from what was meant to be one user action.
- HANDLED: the second submission is rejected, deduped, or disabled client-side AND server-side.

#### 3. Concurrent / simultaneous requests (race conditions)

Fire two or more truly simultaneous requests at the same endpoint (background/parallel shell jobs, or a short parallel script) against a resource with a race-prone constraint: limited quantity, "claim once" action, unique-constraint insert, balance decrement.
```bash
curl -X POST http://localhost:[port]/[endpoint] -d '[payload]' & \
curl -X POST http://localhost:[port]/[endpoint] -d '[payload]' & \
wait
```
- BROKE: both requests succeed when only one should have (oversold inventory, double-claimed coupon/slot, a balance that went negative, a duplicate row a unique constraint should have blocked).
- HANDLED: one wins cleanly, the other gets a conflict response and leaves no partial side effect.

#### 4. Tenant / user ID substitution (IDOR)

Using tenant/user A's valid auth, swap the resource ID in the URL, request body, or query string for a resource that belongs to tenant/user B.
- BROKE: the request succeeds and returns or mutates tenant B's data.
- HANDLED: a clean 403/404 and nothing about tenant B's data is returned or changed.

#### 5. Malformed / oversized payloads

For each field the endpoint accepts, try: wrong type (string where an int is expected, object where a string is expected), a missing required field, `null` where non-nullable, an empty string, a negative number where positive is expected, an oversized value (very long string, large array, deeply nested object), and a wrong `Content-Type` header.
- BROKE: an unhandled exception (500), a stack trace or internal error leaked to the client, a server hang/crash, or the malformed value gets stored/used downstream without being rejected.
- HANDLED: a clean 4xx with a sensible error message and nothing malformed persists.

#### 6. Client-side value tampering

Identify any value the client sends that the server should independently derive or validate: price, quantity, discount, a permission/role flag, an `is_admin`-style boolean, a computed total, a disabled/read-only form field. Edit that value in the actual request before it's sent (modify the JSON body directly, or unlock a disabled field via devtools) and submit it.
- BROKE: the server trusts the tampered value (checkout completes at the tampered price, the action executes with the tampered permission).
- HANDLED: the server recomputes/re-validates server-side and the tampered value has no effect on the outcome.

### Worked example

Branch adds `POST /api/[resource]/:id/invite`, guarded by `current_user`.

1. **Attack surface** (Step 1): new route + controller action, found in `git diff main..HEAD`.
2. **Attack attempted**: tenant substitution (#4). Logged in as User A (tenant 1), captured their auth token. Resource `482` belongs to tenant 2, not tenant 1.
   ```bash
   curl -X POST https://localhost:[port]/api/[resource]/482/invite \
     -H "Authorization: Bearer <tenant-1-token>" \
     -H "Content-Type: application/json" \
     -d '{"email":"outsider@example.com"}'
   ```
3. **Result**: BROKE — `200 OK`, invite email queued against tenant 2's resource. Server log shows the controller loading via `Resource.find(params[:id])` instead of `current_account.resources.find(params[:id])` — no tenant scope applied at all.
4. **Severity**: MUST FIX (cross-tenant write, not just a read leak).
5. **Repro steps**: the curl command above, plus the prerequisite of two seeded tenants where tenant 2 owns resource `482`.

### Output Format

For each attack category, provide:
- A rating: **BROKE** (at least one attempt in this category succeeded in breaking something) / **HANDLED** (every attempt in this category was cleanly rejected or was a safe no-op) / **NOT ATTEMPTED** (nothing on the attack-surface list applied to this category — say why).
- Every attempt in that category listed in the table below — log HANDLED GRACEFULLY results too, not just breaks. A clean pass is evidence, not silence.

List every attempt as:

| # | Severity | Attack Attempted | Result | Repro Steps | Fix Approach | Effort |

Severity is derived directly from the Result, not judgment-called separately:
- Result = BROKE → Severity = **MUST FIX**
- Result = UNCLEAR → Severity = **SHOULD FIX** (needs a human, or a follow-up attempt with better tooling, to resolve)
- Result = HANDLED GRACEFULLY → Severity = **PASS** (no action needed), unless the handling itself is sloppy (e.g., correctly rejects but leaks a stack trace or internal ID in the 4xx body) — then **NICE TO HAVE**

The Result cell must state exactly what happened — the actual status code and behavior you observed — not a hypothetical risk assessment ("could be exploited") or a generic recommendation ("should add validation"). If it didn't break, say what you tried and that it held.

Number issues sequentially. Sort: MUST FIX → SHOULD FIX → NICE TO HAVE → PASS.

End with:
1. Executive summary (2-3 sentences — what actually broke, in plain language)
2. Overall rating: **RED** (something broke) / **YELLOW** (nothing broke, but results were UNCLEAR or handling was inconsistent) / **GREEN** (every attack attempted was cleanly handled)
3. Engineering effort estimate (S/M/L)
4. Architectural decisions needing team input (e.g., "should double-submit be prevented via a client-generated idempotency key, a server-side lock, or both?")
5. Critical-path regression tests that must exist before merge — one per MUST FIX finding, written directly from its repro steps

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix the root cause of each broken attack — not a band-aid (e.g., don't just wrap the failing call in a rescue block; add the missing tenant scope, the missing idempotency check, the missing server-side validation).
- Write the regression test in the **same commit** as the fix, built directly from the repro steps captured in Phase 1. An authorization or race-condition fix shipped without a codified regression test is trivially reintroduced by the next refactor.
- Commit individually with `fix:` (or `fix(security):` if this codebase uses scoped prefixes)

### Round 2: SHOULD FIX items (UNCLEAR results)
- Investigate until the result is provably BROKE or provably HANDLED, then treat it as Round 1 or drop it with a one-line note on why it's resolved as fine.
- Same commit/test discipline as Round 1.

### Round 3: Remaining tests
- Any critical-path regression test not already written as part of Round 1/2.
- Commit with `test:` prefix.

### Round 4: NICE TO HAVE items
- Ask which ones to address before stopping.

### After all fixes:
- **Re-run every attack previously classified BROKE, using the exact same repro steps**, against the fixed code. Confirm each one now returns HANDLED GRACEFULLY. Don't take the fix's plausibility on faith — the entire point of this audit is proof by execution, and that applies to verifying the fix too.
- Run the full test suite, report results.
- Run the linter/formatter, fix violations.
- Confirm the app still boots and describe manual verification steps for a human.

## Safety Notes

- **This is the one audit in the suite that isn't read-only in Phase 1.** You may execute commands, boot servers, seed data, and send real requests. You may not edit application source files during Phase 1 — only in Phase 2, after approval.
- **Local/dev environment only.** Never point any attack at a staging or production URL, even if credentials happen to be on hand. Confirm the base URL you're attacking before firing the first request.
- **No real customer data.** Seed throwaway users/tenants for tenant-substitution attacks. If the local database already contains real or copied production data, stop and ask before running attacks that write to it.
- **Clean up what you create.** Successful attacks often leave rows behind (duplicate orders, spam invites, claimed coupons) in a database other branches or agents may share locally — delete or roll back anything you created once the repro is captured.
- **Check server-side logs for every attack, not just the HTTP status.** A response can look clean to the client while an exception is silently caught and logged server-side.
- **Don't over-invest in exotic race conditions.** If triggering a true race reliably would require custom timing infrastructure, attempt the straightforward version (fire requests as close to simultaneously as your tooling allows) and mark it UNCLEAR with what you tried, rather than building a bespoke harness.
- **If this branch touches migrations**, run this project's schema-cleanup step (if one exists) before/after seeding attack fixtures so leftover attack data doesn't leak into an unrelated schema diff.
- **Scope the attack surface with `git diff main..HEAD --name-only` first.** Attack what this branch changed before attacking anything pre-existing.
- **If the app won't boot at all, that's the top MUST FIX finding.** Report it and stop rather than attempting a real code fix mid-Phase-1.
