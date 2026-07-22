# Case Study: Mark Task Complete

A single small feature, walked through the whole builder-kit pipeline — the exact same feature seeded in [`../demo/`](../demo/). Nothing here is a hypothetical dressed up as an example: the PRD, the Pre-Code Gate pass, and the PR review below are run against the real diff you can clone and inspect yourself in `demo/`.

The honest part: in this case study, Pre-Code Gate got skipped under deadline pressure — which is exactly how the bug sitting in [`../demo/after/server.js`](../demo/after/server.js) actually made it out the door. Read these in order:

1. [`01-prd.md`](01-prd.md) — the approved PRD, which *names the exact risk* that ends up shipping anyway
2. [`02-pre-code-gate.md`](02-pre-code-gate.md) — what the gate would have caught, had it been run
3. [`03-pr-review.md`](03-pr-review.md) — the product-lens review + decision ledger, run against the real diff
4. [`04-retro.md`](04-retro.md) — what actually happened, and why having the gates in a repo isn't the same as using them

This is what "documented, not just imagined" looks like for this toolkit — including the part where the process didn't get followed.
