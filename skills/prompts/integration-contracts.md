# Integration Contract Audit

You are auditing this feature branch for integration contract integrity. It was built as a POC by a non-technical product person using AI-assisted coding. The integrations work in the happy path but likely have gaps in error handling, payload validation, and contract alignment between frontend, backend, and third-party services.

Before auditing, identify the actual stack and third-party integrations used in this codebase — don't assume a stack. Note what languages/frameworks are in play and which third-party services (payment processors, ESPs, CRMs, etc.) the backend talks to.

## PHASE 1: AUDIT (read only — do not modify any files)

**Before reviewing branch code**, study how existing integrations in the codebase handle API calls, error responses, timeouts, and retries. Note the HTTP client patterns, serialization approach, and how third-party interactions are structured. These are your convention baseline.

Review every API boundary on this branch — frontend-to-backend, backend-to-third-party, and any incoming webhooks. For each area, provide:
- A RED / YELLOW / GREEN rating
- Specific issues with file paths and line numbers
- Severity: MUST FIX / SHOULD FIX / NICE TO HAVE

### Areas to Review:

**1. Frontend ↔ Backend API Contract**
- Do request payloads the frontend sends match what the backend expects?
- Do response shapes the backend returns match what the frontend parses?
- Are there fields the frontend assumes exist that the backend might not always include?
- Are error response formats consistent and handled on the frontend?

**2. Backend ↔ Third-Party Contract**
- Are API request payloads formatted per each third-party service's current documentation?
- Are all possible API response codes handled (rate limits, auth failures, validation errors, 500s)?
- Are there hardcoded assumptions about a third-party's data shapes that could break?
- Are API versions pinned or could upstream changes silently break us?

**3. Webhook Handling**
- Are incoming webhook payloads validated before processing?
- Are webhook handlers idempotent (safe to receive the same event twice)?
- Is there signature/authentication verification on incoming webhooks?
- What happens when a webhook payload doesn't match the expected shape?

**4. Timeout & Retry Behavior**
- Are there timeouts set on all outbound HTTP requests?
- What happens when a third-party API is slow or unresponsive?
- Are retries implemented with appropriate backoff?
- Can a retry storm cause problems (duplicate data, rate limiting)?

**5. Data Mapping & Transformation**
- Are there data transformations between systems that could lose or corrupt data?
- Are enum values, IDs, and identifiers mapped correctly between systems?
- Are timezone, date format, and encoding differences handled?

**6. Transactional Consistency & Partial Failure**
- What happens if the external API call succeeds but the local DB write fails (or vice versa)?
- Are multi-step operations wrapped in transactions where appropriate?
- If a background job fails after partial completion, is the state recoverable?
- Are there operations that should be idempotent but aren't (safe to retry without side effects)?

**7. Type Safety Across Boundaries**
- Are API request/response types defined in TypeScript matching actual backend serialization?
- Are there shared types or is each side defining shapes independently?
- Could a backend change break the frontend silently (no type error, just bad data)?

### Output Format:

Present as:
1. A map of every integration boundary found on this branch
2. Overall integration-readiness rating (RED/YELLOW/GREEN)
3. Issue table, numbered sequentially:

| # | Severity | Boundary | File:Line | Issue | Fix Approach | Effort |

Sort: MUST FIX first, then SHOULD FIX, then NICE TO HAVE.

End with:
1. Contract decisions that need team input

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix each issue
- Commit individually with `fix:` prefix

### Round 2: SHOULD FIX items
- Same process

### Round 3: Tests
- Write integration tests for every boundary identified
- Test both happy path and failure modes (timeouts, bad payloads, auth failures)
- Commit with `test:` prefix

### Round 4: NICE TO HAVE
- Ask which ones to address before stopping

### After all fixes:
- Summary of what was fixed and integration risks to monitor after launch

### Rules specific to this audit:
- Don't mock third-party responses in ways that hide real contract mismatches
- If unsure what a third-party's actual response looks like, flag it rather than guessing
- If a fix requires changes to both frontend and backend, make them in the same commit to keep the contract aligned
