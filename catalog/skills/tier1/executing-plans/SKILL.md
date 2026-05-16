---
name: executing-plans
description: Use when executing an approved implementation plan — phrases like "execute", "go ahead", "implement it", "ship it", "run the plan". Enforces one-step-at-a-time with verification between each so unverified intermediate state can't compound into a broken end state.
version: "1.0.0"
source: obra/superpowers
license: MIT
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
  - Task
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

## Anti-patterns
- **Skipping verification to save time.** Unverified steps compound; step 7 fails because step 3's "probably fine" was actually broken.
- **Silently adapting from the approved plan.** If the plan needs to change, surface it and get approval — don't quietly improvise.
- **Continuing past a failed step** without explicit human direction. STOP means stop.
- **Marking a step done because the file changed.** Done means the verification (test, typecheck, or command output) confirmed the intended effect.

Prerequisite: `writing-plans` (the plan being executed). Follow-up: `verification-before-completion` before reporting done.
