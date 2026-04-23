---
name: writing-plans
description: Use when starting a multi-step implementation task, before entering plan mode, or when the human asks you to plan. Turns an approved approach into a sequenced, bite-sized plan that a second agent could execute without further clarification.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- Any task that touches more than 2 files or has more than 3 steps
- Before running /execute or dispatching an implementer agent
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

## What not to include
- Vague steps like "refactor the auth module" — decompose until atomic
- Steps that say "figure out how X works" — that's exploration, not a plan step
- More than 10 steps — if the plan is longer, split into phases

## Before executing
Present the full plan to the human. Confirm they approve before taking any action. If they redirect, revise the plan before executing.
