# Demo: try a skill in under 2 minutes

This is a tiny, intentionally imperfect feature branch — a toy task-list API with one new endpoint added. No PRD, no real codebase, no `npm install` required. It exists so you can point one of the skills in [`../skills/`](../skills/) at *something real* and get actual output instead of imagining what it would say.

## Setup

```bash
./setup.sh
cd demo-repo
```

This creates a fresh git repo two commits deep: `main` (a working task API) and `feature/complete-task` (a branch that adds a "mark task complete" endpoint). You're left checked out on the feature branch, ready to audit `git diff main..HEAD`.

Run `node server.js` in either commit if you want to actually hit the API with `curl` while you look at it.

## Try it

From inside `demo-repo/`, with Claude Code pointed at this repo (drop [`../../skills/`](../../skills/) into your `.claude/commands/` first, or reference the files directly):

- **`feature-audit`** (`quick` or `full`) — should surface at least one production-readiness gap and one missing-test flag on the new endpoint
- **`red-team`** (the 7th audit) — actually attacks the running server rather than reading it; try completing a task ID that isn't yours and see what happens
- **`decision-mining-ledger`** — there's a decision buried in the new endpoint about what happens when the task ID doesn't exist. See if it catches it, and whether you'd have approved that behavior if someone had asked you directly.

Nobody's told you what's wrong on purpose. That's the point — see what the skills actually find on their own, then go read `server.js` and judge for yourself whether they were right.
