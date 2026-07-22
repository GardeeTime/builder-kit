# Builder Kit

**A working product manager's toolkit for shipping real, production code with AI.**

I'm a Director of Product, not an engineer. I can't debug a stack trace and I still don't fully know what `git` is doing half the time. But I've shipped real PRs to production — planned with a PRD, reviewed in Claude Code's plan mode, built locally, and merged by an actual engineering team. I wrote about how that happened [here](https://www.backstroke.com/blog/just-a-pm-who-shipped-to-production).

This repo is the toolkit that came out of doing that repeatedly: the PRD format that forces me to validate before I build, the PR review process that keeps me useful without pretending to be an engineer, the task-tracking system that gives an AI assistant persistent memory across sessions, and the Claude Code skills that catch what I'd miss on my own.

None of it is tied to any one company or stack — it's genericized so you can grab whatever's useful, whether you're a PM trying to close the gap between "we should build this" and "here's what users think," or an engineer trying to give your product partner a real, safe way to ship.

**Star it if it's useful. Fork it if you want to make it yours. PR it if you've built something better — I plan to keep adding to this as I learn.**

## The workflow this toolkit supports

1. **Think out loud first.** Voice mode, a notes app, whatever — get the shape of the problem out of your head before you write anything down formally.
2. **Draft a PRD, then pressure-test it with AI.** Use [`prds/prd-template.md`](prds/prd-template.md) — it forces a validation step *before* anyone writes code.
3. **Interrogate the codebase before you touch it.** Ask your AI assistant what already exists, where things live, and what patterns to follow — before assuming you need to build something new.
4. **Read the plan critically.** If your tool has a plan mode, use it — and actually read the plan before approving it. This is the gate that catches bad assumptions before they become bad code.
5. **Test locally, then hand off through a real PR.** Use [`pr-review/product-lens-pr-review.md`](pr-review/product-lens-pr-review.md) to review it — or have it reviewed — from a product lens, not just a code-quality one.

The core insight underneath all of it: the bottleneck in most product orgs isn't ideas, it's the time between "here's what I think we should build" and "here's what happened when users touched it." Every piece of this kit exists to shrink that gap.

## What's inside

| Folder | What it is |
|---|---|
| [`prds/`](prds/) | A PRD template built around a "Validation Before Build" gate and a "Champagne Feedback" launch step — designed to stop you from spending three weeks on a bet nobody asked for. |
| [`pr-review/`](pr-review/) | A 4-lens PR review template for product people: user experience, design taste, AI-assisted code findings, and analytics coverage — in that priority order. |
| [`task-tracking/`](task-tracking/) | Two file formats (`todo.md`, `lessons.md`) that give an AI coding assistant persistent memory of what's active, what's decided, and what's already gone wrong once. |
| [`skills/`](skills/) | Claude Code skills/commands: a 6-lens feature-branch audit suite (production readiness, UX, user flow, copy, integrations, observability) for POC-to-engineering handoffs, plus a Rails `schema.rb` cleanup tool. |

## How to use it

- **Docs** (`prds/`, `pr-review/`, `task-tracking/`): copy the file into your own repo or notes tool and fill in the brackets.
- **Skills** (`skills/`): drop the contents of `skills/` into your `~/.claude/commands/` (personal, works everywhere) or a project's `.claude/commands/` (shared with your team). They show up as slash commands, and Claude Code will also auto-trigger `feature-audit` on phrases like "is this ready" or "audit this branch."

## How I actually work with AI (the short version)

- **Simplicity first.** Every change should be as small as it can be. Three similar lines beat a premature abstraction.
- **Find root causes.** If something's wrong, fix the actual thing — don't paper over it with a workaround.
- **Plan before acting.** For anything non-trivial, get the plan reviewed before a single line of code gets written.
- **Verify before calling it done.** "It compiles" isn't "it works." Click through it, don't just trust the diff.
- **Demand clarity.** If a reviewer or teammate wouldn't understand a comment or a PRD section without more context, rewrite it.

## Recommended companion tools

Not mine, but they pair well with this kit if you're using Claude Code — available through the official Claude Code plugin marketplace (`claude-plugins-official`):
- **`frontend-design`** — guidance for building UI that doesn't look like a template default.
- **`claude-md-management`** — audits and improves your `CLAUDE.md` files.
- **`slack`** — skills for composing messages, using the Slack CLI, and working with Block Kit.

## Contributing

This is a living toolkit, not a one-time dump — I'll keep adding to it as I build. If you've got a template, a skill, or a process that's earned its keep, open a PR. If something here doesn't work for your context, open an issue and tell me what broke.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, ship it.
