# /design — benchmark harness

Reproducible head-to-head evaluation of the `/design` skill against the freestyle
baseline. Used to validate the **+25 percentage points** claim documented in the
v0.13.0 changelog.

## Methodology

Each scenario is run twice:

1. **With `/design`** — the subagent receives the full `catalog/skills/tier2/design/SKILL.md`
   contents as part of its prompt, then performs the task.
2. **Freestyle** — the subagent receives only the task description, with no
   skill context.

Both subagents are otherwise identical (same model, same scenario input, same
output instructions). The orchestrator scores each output against a binary
rubric per scenario.

## Scenarios

| ID | Name | Tests |
|---|---|---|
| 01 | `from-html` | Extract a design system from pasted HTML |
| 02 | `from-brief` | Synthesize a design system from a verbal brief |
| 03 | `from-screenshot` | Build a design system from a described screenshot |

A 4th scenario (`refine-preserve`) tested the surgical-edit subcommand in
the original eval pass. It is omitted here because both conditions scored
100% in the prior run — refine is bottlenecked on the marker engine, which
both conditions can use once shown the existing markers.

## Scoring rubric

A single binary criterion list shared across scenarios (see `rubric.md`).
Per-scenario score = `(criteria met / total applicable criteria) × 100`,
rounded to nearest integer percent. The aggregate score across all
scenarios is the arithmetic mean.

## Re-running

```bash
# (When a runner script exists)
node evals/design/run.mjs

# Or, manually: dispatch a subagent per scenario × condition,
# capture each subagent's DESIGN.md output, score against rubric.md.
```

Results land in `results/<date>-<sha>.md`.

## Why this exists

The original v0.13.0 benchmark methodology was lost when the working-tree
state was wiped. This harness recreates it from the documented hints in
the changelog (marker presence, hex codes in code ticks, brief adherence)
and the voice rules in `SKILL.md`. Subsequent runs are reproducible from
the scenario files alone.
