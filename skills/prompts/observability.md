# Observability Readiness Audit

You are auditing this feature branch for observability and debuggability. It was built as a POC by a non-technical product person using AI-assisted coding. It almost certainly has minimal logging, no metrics, and no way for the team to diagnose issues in production.

Before auditing, identify the actual stack used in this codebase — don't assume one.

## PHASE 1: AUDIT (read only — do not modify any files)

**Before reviewing branch code**, study how existing features in the codebase handle logging, error reporting, and monitoring. Note the log format, what gets logged at which level, whether there's an error tracking service (Sentry, Honeybadger, etc.), and any existing metrics/instrumentation patterns. These are your convention baseline.

Review every changed file on this branch compared to main. For each area below, provide:
- A RED / YELLOW / GREEN rating
- Specific issues with file paths and line numbers
- Severity: MUST FIX / SHOULD FIX / NICE TO HAVE

### Areas to Review:

**1. Logging**
- Are key operations logged (creation, updates, deletions, external API calls)?
- Do logs include enough context to trace a request (user ID, resource ID, action)?
- Are errors logged with stack traces and context, not just swallowed?
- Is anything being logged that shouldn't be (PII, secrets, tokens)?
- Are log levels appropriate (info vs warn vs error)?

**2. Error Tracking**
- Are exceptions reported to the error tracking service?
- Are there custom error classes where appropriate, or is everything a generic RuntimeError?
- Do error reports include enough context to reproduce the issue?
- Are expected errors (validation, user error) distinguished from unexpected ones?

**3. Request Traceability**
- Can a single user action be traced from frontend to backend to external service?
- Are request IDs or correlation IDs passed through the chain?
- If a customer reports "it didn't work," can the team find what happened?

**4. Key Metrics & Health Indicators**
- Are there operations that should have metrics tracked (processing time, success/failure rates, queue depth)?
- Can the team tell at a glance if this feature is healthy or degraded?
- Are there SLIs that matter for this feature (latency, error rate, throughput)?

**5. Alerting Considerations**
- What conditions should trigger an alert for this feature?
- Are there failure modes that would be silent without monitoring?
- What's the blast radius if this feature breaks — does it affect other features?

**6. Background Job Visibility**
- Are background jobs logged with start, completion, and failure states?
- Can stuck or slow jobs be identified?
- Are job queues and retry behavior visible?

### Output Format:

For each area, provide the RED/YELLOW/GREEN rating, then list issues as:

| # | Severity | Area | File:Line | Issue | Recommendation | Effort |

Number issues sequentially. Sort: MUST FIX first, then SHOULD FIX, then NICE TO HAVE.

End with:
1. Summary of current observability state
2. Overall observability-readiness rating
3. A "day one monitoring" checklist: minimum logging, metrics, and alerts before launch

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix each issue
- Commit individually with `observability:` or `fix:` prefix

### Round 2: SHOULD FIX items
- Same process

### Round 3: NICE TO HAVE
- Ask which ones to address before stopping

### After all fixes:
- Summary of what's now observable and recommended monitoring setup for launch day

### Rules specific to this audit:
- Match existing logging and monitoring patterns in the codebase — don't introduce new frameworks without flagging it
- Don't over-log. High-volume operations need sensible log levels, not info-level on every iteration
- If the codebase doesn't have error tracking or metrics infrastructure, flag it as a gap rather than trying to add one in this branch
