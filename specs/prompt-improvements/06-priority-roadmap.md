# 06 · Priority roadmap

Ordered remediation plan for the prompt-catalog issues identified in 01–05. Grouped into batches that are cleaner to ship as cohesive PRs than as 38 individual file edits.

## Aggregate counts

| Priority | Definition | Count |
|---|---|---|
| **P0** | Broken / wrong — would actively mislead users or fail at dispatch | 5 distinct issues across 6 files |
| **P1** | Notable gap — trigger quality, consistency, completeness | ~24 issues across ~22 files |
| **P2** | Polish — small wins that compound across the catalog | ~14 issues across ~16 files |

## Batches

The fastest path to a high-quality catalog is 5 sequential batches. Batches 1–3 are the critical path; 4–5 are polish.

---

### Batch 1 — Fix the broken references (P0)

**Goal:** make every cross-reference in the catalog point at an artifact that exists.

**Scope (6 files):**
- `agents/tier1/orchestrator.md` — replace 7-agent fictional roster + fix `Agent` → `Task` in `tools`
- `agents/tier1/pr-describer.md` — remove `changelog-curator` reference
- `agents/tier2/backend.md` — fix handoff `reviewer | tester` → `orchestrator | user`
- `agents/tier2/frontend.md` — same handoff fix
- `agents/tier2/mobile.md` — same handoff fix
- `skills/tier2/software-architect.md` — remove `architect` agent dispatch (inline RFC)
- `skills/tier2/receiving-code-review.md` — fix `code-reviewer` agent reference
- `skills/tier2/dispatching-parallel-agents.md` — fix `Agent` → `Task` + remove invalid `run_in_background`
- `skills/tier1/roadmap.md` — fix "six sections" → "eight sections" factual error

**Effort:** ~45 min. Each fix is a 1–5 line edit. The orchestrator rewrite is the longest at ~15 min.

**Why first:** these are the only issues that cause silent failure at runtime. Everything else is degraded quality, not broken.

**Suggested commit message:** `fix(catalog): repair broken cross-references and wrong tool names`

**Validation:** add `scripts/catalog-check.js` step that grep-asserts every agent/skill reference resolves to an existing file. Prevents regression.

---

### Batch 2 — Add `verification-before-completion` gate to ship-flow commands (P0)

**Goal:** `/commit-push-pr` and `/ship` should refuse to publish unverified code.

**Scope (2 files):**
- `commands/commit-push-pr.md` — add step 0 verification gate + refuse pushes from `main`
- `commands/ship.md` — invoke `verification-before-completion` as step 0, make security a blocker

**Effort:** ~30 min.

**Why P0:** a `/commit-push-pr` flow that pushes broken code is an active foot-gun. This is the highest blast-radius issue in the catalog.

**Suggested commit message:** `fix(commands): gate ship-flow on verification-before-completion`

---

### Batch 3 — Description rewrites (P1)

**Goal:** every skill description ≤2 sentences with embedded literal trigger phrases.

**Scope (~16 files):**
- All skills with 3+ sentence descriptions (9 files — see [05-cross-cutting.md §3](./05-cross-cutting.md#3--description-bloat-p1--affects-11-files))
- All skills missing literal trigger phrases (~12 files — see [05-cross-cutting.md §4](./05-cross-cutting.md#4--missing-literal-trigger-phrases-p1--affects-12-files))
- Overlap: most of these are the same files.

**Effort:** ~90 min. Each rewrite is a 2-line edit but needs the trigger phrases researched per skill (the per-file docs 01/02 give the rewrites verbatim).

**Why third:** highest leverage for actual model behaviour. Skills only fire when the description matches user phrasing.

**Suggested commit message:** `refactor(catalog): tighten descriptions + embed literal trigger phrases`

**Validation:** add a catalog-check rule: `description` field must be ≤300 chars and must contain at least one quoted phrase.

---

### Batch 4 — Add `## Anti-patterns` sections + agent disclaimers (P1)

**Goal:** every skill has ≥3 anti-patterns under a consistently-named heading; every agent declares its memory boundary + capability.

**Scope (~17 files):**
- 12 skills missing or mis-named `## Anti-patterns` ([§6](./05-cross-cutting.md#6--missing-anti-patterns-sections-p1--affects-7-skills))
- 5 agents missing memory/capability disclaimers ([§10](./05-cross-cutting.md#10--memory--capability-disclaimers-missing-on-agents-p1--affects-5-files))

**Effort:** ~60 min. Anti-patterns templates are in 01/02; agent disclaimer template is in [00-conventions.md §2.2](./00-conventions.md#22-body-structure).

**Why fourth:** improves model behaviour under edge cases; works best after descriptions (Batch 3) so the right skill loads first.

**Suggested commit message:** `feat(catalog): add anti-patterns + agent memory/capability disclaimers`

---

### Batch 5 — DRY collapse between commands and skills (P1)

**Goal:** every command whose job is "invoke skill X" becomes a 5-line shim instead of duplicating the skill body.

**Scope (4 command/skill pairs — 8 files):**
- `/security-review` ↔ `skills/tier2/security-review`
- `/commit` ↔ `skills/tier1/writing-commits`
- `/commit-push-pr` ↔ `skills/tier2/writing-pull-requests`
- HTML commands `/decide` `/directions` `/roadmap` `/docs` ↔ matching tier1 skills

**Effort:** ~45 min.

**Why fifth:** depends on the skill bodies being correct (Batches 1–4 first).

**Suggested commit message:** `refactor(commands): collapse skill-duplicating commands to thin shims`

---

### Batch 6 — Polish (P2)

**Goal:** consistency wins that compound across the catalog.

**Scope (~16 files):**
- Section heading consistency ([§7](./05-cross-cutting.md#7--section-heading-inconsistency-p2--affects-8-files))
- Language/framework hardcoding ([§8](./05-cross-cutting.md#8--hardcoded-language--framework-assumptions-p2--affects-5-files))
- Co-Authored-By trailer drift ([§9](./05-cross-cutting.md#9--co-authored-by-trailer-drift-p2--affects-2-files))
- `$ARGUMENTS` placeholders in commands ([§11](./05-cross-cutting.md#11--missing-arguments-in-commands-p2--affects-6-files))

**Effort:** ~45 min.

**Suggested commit message:** `polish(catalog): heading consistency + de-hardcode language/framework`

---

## Time-budget summary

| Batch | Files | Effort | Cumulative |
|---|---|---|---|
| 1 — Fix broken refs (P0) | 9 | 45 min | 45 min |
| 2 — Ship-flow verification gate (P0) | 2 | 30 min | 1h 15m |
| 3 — Descriptions + triggers (P1) | ~16 | 90 min | 2h 45m |
| 4 — Anti-patterns + disclaimers (P1) | ~17 | 60 min | 3h 45m |
| 5 — Command/skill DRY collapse (P1) | 8 | 45 min | 4h 30m |
| 6 — Polish (P2) | ~16 | 45 min | 5h 15m |

Roughly **5–6 hours** of focused editing to bring the catalog from B+ to A across all 38 files.

## Dependencies between batches

```
1 ─┬─→ 4 ─→ 5
   │
2 ─┘
3 ─→ 4

6 (polish) — depends on 1–5 being settled, but can be interleaved with 5
```

- Batch 4 depends on 1 (anti-patterns can't reference fictional skills) and 3 (anti-patterns belong below descriptions).
- Batch 5 depends on 4 (don't shim to an incomplete skill body).
- Batch 2 (ship-flow gate) is independent — can ship parallel to Batch 1.

## What this folder does NOT cover

- **The `catalog/hooks/` bash scripts.** Audit them separately — they're code, not prompts.
- **`catalog/templates/`** (HTML templates). Audited only where a skill/command references the template; the templates themselves are out of scope.
- **`catalog/rules/AGENTS.md.tmpl`.** The shipped AGENTS.md skeleton — would benefit from a separate consistency check vs. the project's own AGENTS.md.
- **`catalog/mcp/`, `catalog/ci/`, `catalog/settings/`** — out of scope (config, not prompts).

## Validation checklist post-merge

After the 6 batches land:

- [ ] `scripts/catalog-check.js` passes with the new reference-resolution rule
- [ ] No skill description exceeds 300 chars
- [ ] No skill description has fewer than 2 quoted trigger phrases
- [ ] Every agent body contains the literal string "no memory of the parent conversation"
- [ ] Every skill body contains a `## Anti-patterns` (or `## Anti-patterns to avoid`) section with ≥3 items
- [ ] `grep -rn "Agent" catalog/{agents,skills}/` returns no results referring to the Claude Code tool
- [ ] `grep -rn "planner\|researcher\|implementer\|reviewer\|tester\|security-auditor\|devops\|architect\|code-reviewer\|changelog-curator" catalog/` returns no results
- [ ] `commands/commit-push-pr.md` and `commands/ship.md` both invoke `verification-before-completion` by name
