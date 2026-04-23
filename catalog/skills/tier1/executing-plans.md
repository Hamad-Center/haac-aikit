---
name: executing-plans
description: Use when executing an approved implementation plan. Ensures each step is verified before moving to the next, surfaces blockers early, and prevents compounding errors from unverified intermediate states.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- After a plan has been written and approved
- When the human says "execute", "go ahead", or "implement it"
- When running steps from a plan file

## Execution protocol

1. **Read the full plan** before starting. Identify which steps are sequential vs. parallelisable.

2. **Execute one step at a time** — do not batch multiple steps unless they are explicitly parallel.

3. **Verify after each step**:
   - File changes: confirm the diff matches intent
   - Code changes: run the relevant test / typecheck
   - State changes: check the state (e.g. `git status`, output of a command)

4. **Report progress**: after each step, one line: `Step N done: [what changed]`.

5. **Pause on blocking issues**: if a step fails or reveals new information that invalidates subsequent steps, STOP. Report the situation and revised options. Do not barrel through.

6. **Final verification**: after the last step, run the full test suite and report: pass/fail count and any regressions.

## Do not
- Skip verification to save time — unverified steps compound
- Silently adapt from the approved plan — if the plan needs to change, say so
- Continue past a failed step without explicit human direction
