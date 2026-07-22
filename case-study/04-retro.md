# Retro: What Actually Happened

The PRD ([`01-prd.md`](01-prd.md)) named the ownership question as an open risk. The Pre-Code Gate pass ([`02-pre-code-gate.md`](02-pre-code-gate.md)) would have caught it before a single line of code was written. Neither stopped the bug from shipping — the feature went out Friday afternoon, Pre-Code Gate got skipped because "it's just flipping a boolean," and the PR review ([`03-pr-review.md`](03-pr-review.md)) above is being run for this case study, not before the original merge.

This is exactly the gap [`pre-merge-handoff-gate.md`](../skills/pre-merge-handoff-gate.md)'s Corners Cut table exists to catch — not "the code has a bug," but "a documented safety step got skipped under deadline pressure, and normally nobody would have written that down anywhere." Here it is, written down instead of quietly forgotten:

| Corner Cut | Why | Risk if it bites |
|------------|-----|-------------------|
| Pre-Code Gate skipped | Felt like "just flip a boolean," deadline was Friday | The exact ownership gap the plan critique would have caught shipped anyway |
| No `task_completed` event added | Ran out of time once the endpoint worked | Can't measure the PRD's own stated success metric |

**The point of this case study isn't "look how thorough this process is."** It's closer to the opposite: even with every one of these gates sitting right in this repo, they only do anything if you actually run them. [`../demo/`](../demo/) ships with these exact gaps still in it, on purpose. If you want the honest version of this exercise, go find them yourself with `feature-audit` or `red-team` before reading this file — then come back and see whether you found the same two things Pre-Code Gate would have caught for free, three days earlier, for less effort than writing the bug in the first place.
