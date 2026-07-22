# Task Tracking Template — lessons.md

A running log of corrections and confirmed patterns from working with an AI coding assistant, so you stop repeating the same mistake — and stop re-litigating decisions that already worked.

## Format

Title the file `# Lessons Learned` with a one-line purpose statement, e.g.:
> Patterns and corrections to avoid repeating mistakes. Updated after every correction. Reviewed at the start of every session.

Then a flat list of `##` category headings — pick categories that match how you actually work, e.g.:
- PR Reviews
- Writing specs/PRDs
- Doc conventions
- Git operations
- Communication style
- Engineering / code quality

Each category holds a bulleted list of lessons. Default entry format is one bullet:

> **[The rule, stated as a bolded, actionable imperative].** [1-3 sentences of context: what triggered it, the source (a ticket, a person, a doc), and the concrete failure mode it prevents.]

For one meaty incident worth its own heading, expand into a small structured note instead:

> **What happened:** [1-2 sentence incident summary]
> **Rule:** [the generalized rule extracted from it, phrased as a check to run next time]

## Example

```markdown
## Engineering / Code Quality

- **Don't apply an admin-only authorization gate to a customer-facing feature without a product review.** If an automated suggestion proposes adding a role/permission check to an endpoint, first check where that gate is used elsewhere in the codebase — it may be reserved for internal tooling only. Applying it to a customer-facing feature locks out regular users and creates real friction, which is what happened here in [month/year].

## Silent scope creep (2026-0X-XX)
**What happened:** A stakeholder flagged the same issue three times; each fix looked correct by the letter of the request but missed the actual intent.
**Rule:** Before calling a fix done, restate the original complaint in your own words and check the fix actually addresses that — not just the literal words used.
```

Why this matters more with AI assistants than with humans: a human teammate remembers a correction from last week. An AI assistant doesn't, unless you give it a file to read. This file is that memory.
