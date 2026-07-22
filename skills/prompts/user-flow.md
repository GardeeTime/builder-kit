# User Flow Completeness Audit

You are auditing this feature branch for user flow completeness. It was built as a POC by a non-technical product person using AI-assisted coding. The happy path works but edge cases, alternate paths, and defensive behaviors are likely missing.

## PHASE 1: AUDIT (read only — do not modify any files)

**Before reviewing branch code**, look at how existing features in the app handle navigation, empty states, error recovery, and permissions. These are your convention baseline for expected flow behavior.

Map every user-facing flow on this branch. For each flow, evaluate:
- Does the happy path work end to end?
- What alternate and error paths exist? Which ones are handled?
- Severity: MUST FIX / SHOULD FIX / NICE TO HAVE

### Areas to Review:

**1. Happy Path Completeness**
- Can a user complete the primary flow from start to finish?
- Are all steps connected or are there dead ends?
- Does the final state make sense (correct redirects, confirmation, data saved)?

**2. Navigation & Back Behavior**
- What happens when the user hits the browser back button mid-flow?
- Can the user navigate away and return without losing work?
- Are there breadcrumbs, back links, or cancel buttons where needed?
- Does deep-linking work (can someone share a URL to a specific state)?

**3. Fresh & Empty States**
- What does a brand new user see with zero data?
- Is there onboarding guidance or does the feature look broken when empty?
- What happens if required related data doesn't exist yet?

**4. Concurrent & Stale State**
- What happens if two users edit the same thing simultaneously?
- What if the data changes server-side while the user has a stale view?
- Are there optimistic updates that could get out of sync?

**5. Permissions & Role-Based Access**
- Can every user type that should access this feature actually access it?
- Are users who shouldn't see this properly blocked?
- What happens if a user's permissions change mid-session?
- Are there UI elements visible that a user can see but not act on?

**6. Interruption Recovery**
- What happens on page refresh mid-flow?
- What if the user's session expires during a multi-step process?
- What if a network request fails halfway through a multi-step save?
- Are there unsaved changes warnings where appropriate?

**7. Destructive Actions & Reversibility**
- Can deletions be undone? Is there soft delete, an undo window, or is it permanent?
- Are users warned before destructive actions with clear consequences ("This will permanently delete X and all associated Y")?
- What happens to related/child data when a parent is deleted? Orphaned records?
- Is there a way to recover if a user accidentally deletes something important?

**8. Boundary Conditions**
- What happens with very long text inputs, very large datasets, or zero-length inputs?
- Are there pagination or infinite scroll boundaries that break?
- What about special characters, emoji, or non-English text?

### Output Format:

Present as:
1. A flow map listing every user path identified (happy path + alternates)
2. For each path: works / partially works / missing entirely
3. Issue table, numbered sequentially:

| # | Severity | Flow | Issue | Current Behavior | Expected Behavior | Effort |

Sort: MUST FIX first, then SHOULD FIX, then NICE TO HAVE.

End with:
1. Summary of flow coverage
2. Flow decisions that need product input (e.g. "should users be able to X?")

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix each issue
- Commit individually with `fix:` prefix

### Round 2: SHOULD FIX items
- Same process

### Round 3: NICE TO HAVE
- Ask which ones to address before stopping

### After all fixes:
- Walk through every flow path again and confirm it works

### Rules specific to this audit:
- If a missing flow requires a product decision, ask — don't invent behavior
- Prioritize flows real users will actually hit over theoretical edge cases
- If implementing a flow properly requires significant backend changes, flag it rather than hacking around it
