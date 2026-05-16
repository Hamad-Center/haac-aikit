---
name: performance-profiling
description: Use when the user says "slow", "timeout", "latency spike", "high memory", "bundle too large", "CI is slow", "build taking forever", "profile this", or "why is this slow". Runs a five-phase measure-first protocol (Measure → Identify → Fix → Verify → Report) and commits `docs/performance/YYYY-MM-DD-<topic>.md`.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

## When to use

Auto-trigger on: "slow", "timeout", "latency spike", "high memory", "bundle too large", "CI is slow", "build taking forever"

Explicit: "profile this", "why is this slow", "performance issue with X"

## Phase 1 — Measure

Record baseline before touching anything. If you cannot reproduce the slow path, stop and surface the blocker — do not proceed to Phase 2.

```
□ Runtime:      response time, memory usage, query count, CPU %
□ Build/bundle: build duration, bundle size, chunk sizes
```

## Phase 2 — Identify

Pinpoint the specific cause. Do not guess — name the exact line, function, query, or step responsible.

**Runtime:**
```
□ Trace the slow code path from entry point to bottleneck
□ Check for N+1 queries, missing indexes, unbounded loops
□ Check for unnecessary re-renders, redundant computations, memory leaks
□ Name the single line or function responsible
```

**Build/bundle:**
```
□ Identify largest bundle chunks and their source
□ Check for duplicate dependencies, unoptimized imports, missing tree-shaking
□ Check CI step durations — identify the single slowest step
□ Name the specific package, import, or step responsible
```

## Phase 3 — Fix

One focused change per commit. Do not combine multiple fixes.

```
□ Make one targeted change
□ Explain why this change addresses the root cause from Phase 2
```

## Phase 4 — Verify

Re-run the exact same measurements from Phase 1. Confirm improvement is real and no regressions introduced.

```
□ Measure again using the same method as Phase 1
□ Confirm measurable improvement (not just "feels faster")
□ Confirm no regressions in adjacent functionality
```

## Phase 5 — Report

Write and commit a brief performance report.

```
□ Save to docs/performance/YYYY-MM-DD-<topic>.md
□ Template: Symptom | Baseline | Root Cause | Fix | Result
```

### Report template

```markdown
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

## Anti-patterns to avoid

- Fixing before measuring — you cannot confirm improvement without a baseline
- Combining multiple fixes in one commit — makes it impossible to attribute the improvement
- Closing without verifying — "should be faster" is not a result
- Guessing the bottleneck without tracing — profiling means finding, not assuming
