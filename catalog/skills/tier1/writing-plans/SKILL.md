---
name: writing-plans
description: Use when the user says "plan this", "let's plan", "make a plan", "/plan", or before entering plan mode on any multi-step task. Turns an approved approach into a numbered, atomic, verifiable sequence a second agent could execute without further clarification.
version: "1.0.0"
source: obra/superpowers
license: MIT
allowed-tools:
  - Read
  - AskUserQuestion
---

## When to use
- Any task that touches more than 2 files or has more than 3 steps
- Before running /execute or handing the plan off to an implementation subagent (`backend`, `frontend`, `mobile`, or a generic `Task`)
- When the human says "plan this" or "let's plan before we build"

## Plan structure

```
PLAN:
1. [concrete action] — [why: what it enables]
2. [concrete action] — [why: dependency or risk managed]
...
N. [concrete action] — [why]
→ Executing unless you redirect.
```

## Rules for a good plan

**Each step must be**:
- An action that produces a verifiable artifact (file created, test passes, function deleted)
- Independently reversible without undoing prior steps
- Executable by someone who hasn't read the previous steps

**Order steps by dependency**: if step N needs step N-1 to be done first, they are sequential. Steps with no dependency on each other can be done in parallel (mark them explicitly).

**Include a verification step** at the end: "Run tests; confirm no regressions."

## Before executing
Present the full plan to the human. Confirm they approve before taking any action. If they redirect, revise the plan before executing.

## Anti-patterns
- **Vague steps like "refactor the auth module".** Decompose until each step is atomic and verifiable.
- **Steps that say "figure out how X works".** That's exploration (use `codebase-exploration`), not a plan step.
- **Plans with more than 10 steps.** Split into phases; nobody verifies step 11 with the same rigor as step 1.
- **Padding a 2-step task into 8 fake steps to look thorough.** The user counts steps and trusts them — don't burn that trust.
- **Executing before the user confirms.** The gate exists because plans get redirected ~30% of the time.

When the approach isn't chosen yet, use `brainstorming` first. When the plan is approved, use `executing-plans`.
