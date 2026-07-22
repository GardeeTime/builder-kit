# Done: BK-2 — Gates expansion

**Approved by Adam on 2026-07-22** → sourced from a 5-independent-lens brainstorm (skeptical engineer / career-driven PM / GitHub discovery-and-virality / completeness critic / anti-genericism), synthesized and ranked by conviction.

Branches: n/a — built directly on `master`, no branching used for this repo.

Key decisions: build all 8 ranked ideas, in ranked order, in one push; Pre-Code Gate is the highest-conviction pick because two independent lenses (completeness critic and anti-genericism) converged on the exact same gap without seeing each other's output — the README calls step 4 "the critical gate" and delivers nothing behind it.

## M1 — New skills (parallel authoring)
- [x] `skills/pre-code-gate.md` — codebase interrogation + plan-critique rubric + VERIFIED/ASSUMED adversarial pushback — DONE 2026-07-22
- [x] `skills/blast-radius-gate.md` — dependency mapping + risk tiers + pairing requirement — DONE 2026-07-22
- [x] `skills/decision-mining-ledger.md` — surfaces implicit product decisions buried in a diff — DONE 2026-07-22
- [x] `skills/spec-locked-tests.md` — one test per PRD requirement, written before implementation — DONE 2026-07-22
- [x] `skills/pre-merge-handoff-gate.md` — conformance check + negotiated ownership contract — DONE 2026-07-22
- [x] `skills/prompts/red-team.md` — 7th audit, execution-based instead of static; wired into `feature-audit.md` — DONE 2026-07-22

## M2 — Extend existing skills
- [x] `skills/portfolio-keeper.md` — Workflow 4: Verified Evidence & Calibration Ledger — DONE 2026-07-22

## M3 — Proof-of-work
- [x] `case-study/` — redacted, concrete end-to-end worked example (PRD → Pre-Code Gate → PR review → retro), tied directly to `demo/`'s real seeded bug rather than an unrelated fictional one — DONE 2026-07-22
- [x] `demo/` — tiny runnable mini-repo (`setup.sh`), smoke-tested: confirmed `PATCH /tasks/999/complete` returns `200` instead of `404` — DONE 2026-07-22
- [x] Dogfood the kit on itself — this file is the first instance

## M4 — Wrap
- [x] Update README's "What's inside" table + workflow narrative for the expanded skill set — DONE 2026-07-22
- [ ] Grep every new/changed file for leaked company-specific references
- [ ] Commit + push

## Results
All 8 ranked ideas shipped. `feature-audit` is now 7 audits with a fresh-context/adversarial-framing rule added to Phase 1. `case-study/` and `demo/` are linked to each other rather than being independent examples — the case study's PRD names the exact risk that ships anyway in the demo's seeded bug, and the retro is honest that having a gate in the repo isn't the same as running it.

---

# Done: BK-1 — v1 launch

**Shipped 2026-07-22.**

Branches: n/a — built directly on `master`.

Key decisions: every artifact genericized from real, battle-tested internal process; anything containing real company/customer/financial specifics was left out entirely rather than redacted-in-place; MIT licensed; public from day one.

## M1 — Core templates
- [x] PRD template ("The Bet" framework + Validation Before Build gate)
- [x] Product-lens PR review template (4-lens rubric)
- [x] Task-tracking templates (`todo-template.md` + `lessons-template.md` formats)

## M2 — Skills
- [x] `feature-audit` suite (6 audits), ported from personal `.claude/commands/`
- [x] `schema-scrub`, ported from an already-genericized version
- [x] `portfolio-keeper` — new skill, built from scratch, later given a "Why this exists" section tying it to promo cases / LinkedIn / job search

## Results
Repo live at [github.com/GardeeTime/builder-kit](https://github.com/GardeeTime/builder-kit). Every file grepped clean for company-specific leaks before every push.

---
