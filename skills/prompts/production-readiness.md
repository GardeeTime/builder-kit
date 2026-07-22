# Production Readiness Audit

You are auditing this feature branch for production readiness. It was built as a POC by a non-technical product person using AI-assisted coding. It needs to be handed off to the engineering team for production deployment. Identify the actual stack used in this codebase before auditing — don't assume one.

## PHASE 1: AUDIT (read only — do not modify any files)

**Before reviewing branch code**, study 2-3 existing examples of controllers, models, services, and tests in the codebase that are NOT part of this branch. These are your convention baseline. Judge the branch code against how this team actually builds — not generic best practices.

Review every changed file on this branch compared to main. For each area below, provide:
- A RED / YELLOW / GREEN rating
- Specific issues with file paths and line numbers
- Severity: MUST FIX (blocks merge), SHOULD FIX (do before merge if possible), NICE TO HAVE (fast-follow)

### Areas to Review:

**1. Code Quality & Structure**
- Does the code follow this codebase's existing conventions (backend and frontend)?
- Anti-patterns, dead code, duplication?
- Hardcoded values, secrets, API keys?
- Naming consistency?
- Debug artifacts left behind? (console.log, binding.pry, debugger, pp, puts)
- Commented-out code blocks that should be removed?

**2. Database & Data Integrity**
- Are migrations production-safe? Specifically check for:
  - Adding columns with defaults on large tables (table lock risk)
  - Adding NOT NULL to existing columns without a default
  - Irreversible migrations missing a `down` method
  - Data backfills inside migrations (should be rake tasks or post-deploy scripts)
  - Schema changes that can't be rolled back without data loss
- Missing indexes on queried/filtered columns?
- N+1 query risks?
- Foreign keys and constraints?
- Soft delete vs hard delete — is there a pattern in the codebase? Does this branch follow it?

**3. Security**
- SQL injection, XSS, CSRF vulnerabilities?
- API endpoints authenticated and authorized?
- Input validation on both frontend and backend?
- Sensitive data in logs or responses?

**4. Error Handling & Edge Cases**
- Graceful error handling or silent failures?
- Unhandled promise rejections, bare rescue blocks?
- External service failure handling?

**5. Performance**
- Unbounded queries, missing pagination?
- Work that should be in background jobs?
- Frontend re-render issues, bundle size?

**6. Test Coverage**
- What tests exist vs. what's missing?
- List critical-path test cases that must exist before merge
- Flag any logic particularly risky to ship untested

**7. TypeScript & Type Safety**
- `any` types that need proper typing?
- Component props well-defined?
- API response types match backend?

**8. Multi-tenancy & Data Scoping**
- Is all customer data properly scoped?
- Can one tenant access another's data through any endpoint?

**9. Production Deployment**
- New ENV vars, feature flags, third-party services needed?
- Is the feature behind a feature flag (if this codebase uses one) for controlled rollout? If not, flag it.
- Deploy order dependencies (migrations, etc.)?
- Breaking changes to existing APIs or data models?

**10. Dependencies**
- Were new gems or npm packages added? List them.
- Are they actively maintained (check last publish date, open issues)?
- Are there known security vulnerabilities? (run `bundle audit` / `npm audit` if available)
- Are any new dependencies pulling in far more than what's actually needed?
- Could the functionality be achieved with existing dependencies instead?

**11. AI-Assisted Code Artifacts**
This branch was built with AI coding tools. Specifically check for:
- Methods or API calls that look plausible but don't actually exist in the library/framework (hallucinated APIs)
- Inconsistent patterns suggesting the AI changed approach mid-build (e.g., two different state management patterns, mixing REST and GraphQL, inconsistent error handling styles)
- TODO, FIXME, HACK, or "placeholder" comments left behind
- Unused imports, requires, or variable declarations
- Over-engineered abstractions for simple one-off operations
- Hardcoded URLs (localhost, staging domains) instead of environment-based configuration
- Boilerplate code that was generated but never actually called

### Output Format:

For each area, provide the RED/YELLOW/GREEN rating, then list issues as:

| # | Severity | Area | File:Line | Issue | Fix Approach | Effort |

Number issues sequentially. Sort: MUST FIX first, then SHOULD FIX, then NICE TO HAVE.

End with:
1. Executive summary (2-3 sentences)
2. Overall production-readiness rating
3. Engineering effort estimate (S/M/L)
4. Architectural decisions needing team input
5. Critical-path tests that must exist before merge

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix each issue
- Commit individually with `fix:` or `refactor:` prefix

### Round 2: SHOULD FIX items
- Same process

### Round 3: Tests
- Write tests for critical-path cases
- Commit with `test:` prefix

### Round 4: NICE TO HAVE
- Ask which ones to address before stopping

### After all fixes:
- Run full test suite, report results
- Run linter/formatter, fix violations
- Confirm app boots and describe manual verification steps
