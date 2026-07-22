# Copy & Content Audit

You are auditing this feature branch for copy and content quality. It was built as a POC by a non-technical product person using AI-assisted coding. The functionality works but the user-facing text likely has placeholder copy, inconsistent terminology, developer-facing language, and missing microcopy.

Before auditing, figure out who actually uses this product — check the app's existing copy, its docs, or ask if it's unclear — and calibrate tone to them. A B2B admin tool, a consumer app, and an internal ops dashboard all call for different voices; don't assume one.

## PHASE 1: AUDIT (read only — do not modify any files)

**Before reviewing branch code**, read user-facing copy in existing features (button labels, error messages, empty states, help text). Note the tone, capitalization style, terminology, and how the app refers to key concepts. These are your convention baseline — new copy should sound like it was written by the same person.

Review every user-facing string on this branch. For each area below, provide:
- Specific issues with file paths and line numbers
- The current text and suggested replacement
- Severity: MUST FIX / SHOULD FIX / NICE TO HAVE

### Areas to Review:

**1. Terminology Consistency**
- Is the same concept referred to by different names in different places?
- Does new terminology match what the rest of the app already uses?
- Are there developer terms leaking through (e.g. "record," "payload," "null")?

**2. Button & Action Labels**
- Are CTAs clear about what will happen ("Save Campaign" vs "Submit")?
- Are destructive actions clearly labeled ("Delete Campaign" vs "Remove")?
- Is the verb tense consistent across similar actions?

**3. Error Messages**
- Do error messages explain what went wrong AND what to do about it?
- Are they written for the actual end user, not a developer?
- Are there generic "Something went wrong" messages that need specifics?

**4. Help Text & Tooltips**
- Are form fields that need explanation accompanied by help text?
- Do tooltips add value or just restate the label?
- Is there any missing context where a user might get confused?

**5. Empty States & Onboarding**
- Do empty states guide the user toward the next action?
- Is placeholder text still present that should be real copy?
- Are "getting started" messages helpful and specific?

**6. Confirmation & Success Messages**
- Do success messages confirm what happened ("Campaign saved" vs "Success")?
- Is the tone appropriate — not robotic, not overly casual?
- Are there missing confirmations after important actions?

**7. AI-Generated Placeholder Text**
This branch was built with AI coding tools. Specifically look for:
- Generic placeholder text that slipped through as real content ("Your description here", "Lorem ipsum", "Example title")
- Overly verbose or unnaturally formal text that sounds AI-generated rather than human-written
- Inconsistent voice or tone across components (suggesting different prompting sessions)
- Help text or tooltips that are technically accurate but not written for the actual end user
- Sample data or example values in UI that should be dynamic

**8. Grammar & Formatting**
- Are there typos, grammatical errors, or awkward phrasing?
- Is capitalization consistent (Title Case vs Sentence case)?
- Are numbers, dates, and lists formatted consistently?

### Output Format:

Issue table, numbered sequentially:

| # | Severity | Area | File:Line | Current Text | Suggested Text | Rationale |

Sort: MUST FIX first, then SHOULD FIX, then NICE TO HAVE.

End with:
1. Summary of overall copy quality
2. Copy decisions that need product input (e.g. "what should we call this concept?")

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix each issue
- Commit individually with `copy:` prefix

### Round 2: SHOULD FIX items
- Same process

### Round 3: NICE TO HAVE
- Ask which ones to address before stopping

### After all fixes:
- Summary of what changed and any terminology decisions to document for consistency

### Rules specific to this audit:
- If a term is used elsewhere in the app, match the existing convention even if suboptimal — flag it separately as a broader rename suggestion
- Don't rewrite copy that's already clear and correct just to make it "better"
- If a copy change has product implications (naming a concept, setting user expectations), ask first
