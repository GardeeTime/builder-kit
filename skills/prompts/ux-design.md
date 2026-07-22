# UX & Design Audit

You are auditing this feature branch for UX and design quality. It was built as a POC by a non-technical product person using AI-assisted coding. The functional intent is solid but the UI likely has inconsistencies, missing states, and rough edges that need cleanup before handoff.

## PHASE 1: AUDIT (read only — do not modify any files)

**Before reviewing branch code**, study 2-3 existing components and views in the codebase that are NOT part of this branch. Note the styling approach (CSS modules, Tailwind, styled-components), component structure, spacing/layout patterns, and how states (loading, empty, error) are handled. These are your convention baseline. The new code should look like the same team built it.

Review every frontend component and view changed on this branch compared to main. For each area below, provide:
- A RED / YELLOW / GREEN rating
- Specific issues with file paths and line numbers
- Severity: MUST FIX / SHOULD FIX / NICE TO HAVE

### Areas to Review:

**1. Visual Consistency**
- Are spacing, padding, and margins consistent across components?
- Are colors, font sizes, and font weights using existing design tokens/variables or hardcoded one-offs?
- Do new components match the visual style of the existing app?
- Are border radii, shadows, and elevation consistent?

**2. Interaction States**
- Does every clickable element have hover, active, focus, and disabled states?
- Do buttons show loading state during async operations?
- Are there appropriate transitions/animations or do things just pop in?
- Is focus management correct for keyboard navigation?

**3. Loading & Empty States**
- Is there a loading indicator when data is being fetched?
- What does the user see when there's no data? Is there an empty state with guidance?
- Are skeleton loaders or spinners used consistently with the rest of the app?
- What happens during slow connections — is there any feedback?

**4. Error States & User Feedback**
- Do form validations show inline errors or just fail silently?
- Are success confirmations shown after actions (toasts, banners, etc.)?
- Do error messages tell the user what to do next or just say "something went wrong"?
- Are destructive actions confirmed before executing?

**5. Responsive Behavior**
- Does the layout work at common breakpoints (mobile, tablet, desktop)?
- Are there horizontal scroll issues or overlapping elements at small widths?
- Do tables, forms, and modals adapt to narrow screens?
- Are touch targets large enough on mobile?

**6. Accessibility**
- Do all images and icons have appropriate alt text or aria-labels?
- Is color contrast sufficient for text and interactive elements?
- Can the feature be navigated entirely by keyboard?
- Are form inputs properly labeled?
- Is semantic HTML used (headings, landmarks, lists) vs. generic divs?

**7. Component Architecture**
- Are components reasonably decomposed or are there monolithic 500-line files?
- Is state managed at the right level or is there excessive prop drilling?
- Are there components that should be shared/reusable but are duplicated?
- Is the component hierarchy logical and maintainable?

### Output Format:

For each area, provide the RED/YELLOW/GREEN rating, then list issues as:

| # | Severity | Area | File:Line | Issue | Fix Approach | Effort |

Number issues sequentially. Sort: MUST FIX first, then SHOULD FIX, then NICE TO HAVE.

End with:
1. Executive summary of overall UX quality
2. Overall UX-readiness rating
3. UX decisions that need product input before fixing

---

## PHASE 2: FIX (only after user approves)

### Round 1: MUST FIX items
- Fix each issue
- Commit individually with `fix:` or `style:` prefix

### Round 2: SHOULD FIX items
- Same process

### Round 3: NICE TO HAVE
- Ask which ones to address before stopping

### After all fixes:
- Visually verify each changed view still renders correctly
- Confirm no regressions to existing components

### Rules specific to this audit:
- Preserve functional intent — improve presentation, don't redesign features
- Match existing app patterns. Don't introduce new design patterns without flagging it
- If a fix requires a UX decision (where to show an error, what an empty state should say), ask — don't guess
