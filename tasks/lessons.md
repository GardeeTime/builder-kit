# Lessons Learned

Patterns and corrections to avoid repeating mistakes on this repo. Updated after every correction. Reviewed at the start of every session.

## Repo scope & safety

- **Grep every new or changed file for company-specific terms before every commit.** This repo is public and personal-brand-facing; source material genericized from real internal process docs needs the check every time, not just the first time. Standing step before every push, not an optional one.
- **Never fabricate proof (metrics, links, terminal recordings) to make the repo look more polished than it actually is.** When a proof-of-work idea called for a terminal-capture demo, the right move was to flag it as a manual step for a human to record themselves, not synthesize a fake one. An honestly-missing piece is more credible than a fabricated one — same principle `portfolio-keeper`'s calibration ledger applies to career claims applies here too.

## Content quality

- **Directly author flagship, voice-critical docs (README, the PR review template, the PRD template) rather than fully delegating them, even when using AI subagents for other parts of the same task.** Multiple independent AI passes on content meant to read as one voice will drift in tone. Reserve parallel delegation for genuinely independent, mechanically separable pieces — e.g. five new skills that each define a self-contained mechanism — not for anything meant to read as a single coherent voice.
- **When brainstorming "what's missing," run genuinely independent, blind angles before synthesizing — a single brainstorm pass misses convergent signal.** Two independent lenses agreeing on the same gap, without seeing each other's output, is much stronger evidence than either lens alone, or than one pass trying to cover every angle at once.
