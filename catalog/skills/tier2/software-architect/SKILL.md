---
name: software-architect
description: Use when the user says "run the architect", "design this first", "RFC for X", or introduces a new service / cross-module data flow / external integration / schema change / feature touching 3+ domains. Produces `docs/decisions/YYYY-MM-DD-<topic>.md` (RFC) before any plan or implementation begins.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - AskUserQuestion
---

## When to use

Auto-trigger when ANY of:
- New service, module, or package being introduced
- Cross-module data flow or shared state
- New external integration (API, DB, queue, auth provider)
- Schema or data model changes
- API surface being designed (REST, GraphQL, events)
- Feature touches ≥ 3 files across different domains

Explicit trigger: user says "run the architect", "design this first", "RFC for X"

## Process

1. **Pause** — do not write code or a plan yet.

2. **Explore** — read the codebase for existing patterns relevant to the decision; identify files, modules, and conventions already in use. Never design around patterns you haven't verified exist.

3. **Identify decisions** — surface the 2-3 key architectural choices this feature requires. Name each one explicitly.

4. **Write the RFC** directly to `docs/decisions/YYYY-MM-DD-<topic>.md` using the template below. Capture the chosen direction, the alternatives rejected, and the risks. Commit before proceeding.

5. **Wait** — do not invoke `writing-plans` until the RFC is committed.

## RFC template

```markdown
# <topic>

## Decision
One sentence: what we are doing.

## Context
Why this is being decided now (constraint, deadline, incident, new requirement).
Link the originating issue / conversation.

## Options considered
- **Option A — <name>.** One paragraph. Tradeoffs.
- **Option B — <name>.** One paragraph. Tradeoffs.
- **Option C — <name>.** One paragraph. Tradeoffs.

## Choice & rationale
Which option and why. Be explicit about what we are accepting / giving up.

## Risks
- Risk 1 — concrete failure mode + mitigation.
- Risk 2 — concrete failure mode + mitigation.

## Rollback
How we undo this if it goes wrong, and by when we'd know.
```

For **API-surface design** specifically, delegate to the `api-design` skill after this RFC commits — that skill owns spec generation (OpenAPI / GraphQL / AsyncAPI).

## Anti-patterns to avoid

- Skipping to implementation when trigger conditions are met
- Producing a plan before an RFC exists
- Making design decisions inline in conversation without a committed artifact
- Inventing patterns that already exist in the codebase
- Drafting the RFC without first exploring existing code (the RFC needs grounded context, not speculation)
