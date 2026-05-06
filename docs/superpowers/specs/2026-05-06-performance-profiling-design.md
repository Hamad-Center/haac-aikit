# Design: Performance Profiling Skill

**Date:** 2026-05-06
**Status:** Approved
**Outcome:** Adds a tier1 skill with a five-phase measure-first protocol covering both runtime and build/bundle performance.

---

## Problem Statement

No existing skill covers performance investigation. Engineers (and AI agents) commonly skip measurement, guess at root causes, and apply fixes that don't address the actual bottleneck. A measure-first protocol enforces the discipline that separates real fixes from placebo changes.

---

## Pipeline Position

```
[auto-trigger on perf signals | explicit invocation] → performance-profiling skill → [fix committed + report]
```

---

## Deliverable

| Artifact | Path |
|----------|------|
| Skill | `catalog/skills/tier1/performance-profiling.md` |
| Report output | `docs/performance/YYYY-MM-DD-<topic>.md` |

---

## Skill: `performance-profiling`

**Tier:** 1 (always-on)
**Trigger:** Auto on signals ("slow", "timeout", "latency spike", "bundle too large", "high memory") + explicit ("profile this", "why is this slow")
**Coverage:** Runtime performance + build/bundle performance
**Output:** Fix applied first, brief report committed second

---

## Five-Phase Protocol

### Phase 1 — Measure (baseline before touching anything)
- Record current state: response time, memory, query count, CPU % (runtime) or build duration, bundle size, chunk sizes (build/bundle)
- Reproduce the slow path reliably — if unreproducible, stop and surface the blocker

### Phase 2 — Identify (pinpoint the bottleneck, don't guess)

**Runtime sub-track:**
- Trace the slow code path from entry point to bottleneck
- Check for N+1 queries, missing indexes, unbounded loops
- Check for unnecessary re-renders, redundant computations, memory leaks
- Name the single line or function responsible

**Build/bundle sub-track:**
- Identify largest bundle chunks and their source
- Check for duplicate dependencies, unoptimized imports, missing tree-shaking
- Check CI step durations — identify the single slowest step
- Name the specific package, import, or step responsible

### Phase 3 — Fix (one targeted change)
- Make one focused change — do not combine multiple fixes in one commit
- Explain why the change addresses the root cause from Phase 2

### Phase 4 — Verify (measure again)
- Re-run the same measurement from Phase 1
- Confirm measurable improvement (not just "feels faster")
- Confirm no regressions in adjacent functionality

### Phase 5 — Report
- Write brief report to `docs/performance/YYYY-MM-DD-<topic>.md`
- Template: Symptom | Baseline | Root Cause | Fix | Result

---

## Report Template

```
# Performance: <topic>

## Symptom
[What was slow/large and how it was reported]

## Baseline
[Measurements taken before any changes]

## Root Cause
[The specific line, query, import, or step responsible]

## Fix Applied
[What was changed and why it addresses the root cause]

## Result
[Measurements after the fix — improvement percentage]
```

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Coverage | Runtime + build/bundle | Both types share the same measure-first discipline; sub-tracks handle specifics |
| Trigger | Auto + explicit | Auto catches obvious signals; explicit handles nuanced requests |
| Output | Fix first, report second | Commits the value immediately; report creates a baseline for future comparison |
| Structure | Five phases | Measure → Identify → Fix → Verify → Report enforces discipline; skipping any phase is an anti-pattern |
| Sub-tracks | Inside Phase 2 only | Runtime and build/bundle share Phase 1, 3, 4, 5; only identification differs |
