# Product-Lens PR Review Template

A PR review process for product people (not just engineers) reviewing code — evaluate the user experience first, use AI to catch what you'd miss technically, and keep the tone collaborative.

Use this template when reviewing PRs for your product. Structure every review into these sections, in this order.

**Before starting:** If the change spans multiple repos, pull all linked PRs and review them together before writing any comments.

**Important:** Don't post PR comments directly on your first pass. Draft the full review, read it back, and only then post it.

---

## 1. Product Experience Review (Primary Lens)

Evaluate from the end user's perspective — not the engineer's.

**Check for:**
- Intuitive flows — would your actual end user understand this without explanation?
- UX edge cases — what happens on empty states, loading states, error states?
- Clear, action-oriented copy — no jargon, no ambiguity
- User feedback after actions — confirmation messages, progress indicators
- Unnecessary friction — extra clicks, confusing navigation, hidden options

**Standard:** Does it feel polished and cohesive, or bolted on? Flag "good enough" UX that could be great with a small change.

**Tone:** Frame product feedback as questions: "What happens if a user does X?" invites dialogue better than "You forgot X."

---

## 2. Product Taste & Design Consistency

**Check for:**
- Does the interaction feel modern and responsive?
- Are transitions/animations appropriate (not distracting, not absent)?
- Is layout/spacing intentional? Is information hierarchy clear?
- Would this hold up next to [the 2-3 products your users would naturally compare you to]?

**Standard:** Be specific — say what would make it better and why it matters for the user.

---

## 3. Code & Technical Observations (AI-Assisted)

**Important:** Frame this section as your AI assistant's findings, not your own — e.g. "Claude flagged..." This keeps the review honest about where the technical judgment came from, and keeps you focused on the product lens.

**Check for:**
- Bugs or logic errors that would affect users
- Missing error handling that impacts UX
- Performance concerns (N+1 queries, unnecessary re-renders)
- Security issues
- Hardcoded values that should be configurable
- Missing test coverage for critical paths

**Do NOT:**
- Nitpick code style (linters handle that)
- Rewrite implementations (suggest outcomes instead)
- Bury UX issues under code observations — always prioritize by user experience impact

---

## 4. Analytics & Event Tracking

Does this PR ship a measurable feature, and are the right events in place? "If it's not tracked, we can't measure adoption" applies to every new user flow, feature surface, or meaningful state change.

**Coverage check** (product lens — fold into Section 1 if gaps are found):
- Does the PR add a new user flow, feature surface, or meaningful state change without any tracking calls? Flag it as a product opportunity.
- Reference your team's existing event-naming conventions (naming pattern, property conventions, safety rules) so new events match what's already shipped.
- For strategic-bet features, assume you need funnel-level tracking unless the PR explicitly deprioritizes it.

**Implementation check** (technical lens — fold into Section 3):
- **Naming**: consistent casing and tense (e.g. `snake_case`, `noun_verb_past_tense`), prefixed by surface when ambiguous.
- **Properties**: IDs as strings, booleans prefixed `has_`/`is_`/`can_`/`was_`, enum-like values as a typed `mode`/`source` field rather than scattered booleans.
- **Safety**: tracking calls should never be able to break the primary user action — fire-and-forget, never inside a try/catch that also guards the real action.
- **No PII** beyond what your identify call already carries.
- **Phantom event check** (catches a real failure mode): for every new event name in the PR, confirm it's actually committed — `git log -S "'event_name'"` should return the PR's own commit. If it doesn't, the event was likely fired from code that never shipped: it'll show up in your analytics tool's autocomplete forever but never fire in production. This is a real failure mode worth checking every time — a phantom event can waste hours of an analyst's time chasing data that never existed.

**Tone:**
- Coverage gaps → frame as product questions in Section 1.
- Naming / safety / phantom issues → frame as AI-assisted findings in Section 3.

---

## Posting the Review

- Tone: direct, no hedging or fluff. Lead with what matters most for the user.
- Use `gh pr diff <N> --repo <org>/<repo>` to fetch diffs.
- Use `gh pr comment` to post once you've read back your own draft.
- If you used an AI assistant to help produce Section 3, say so when you post: "I used [Claude/tool] to help me review the code changes here."
