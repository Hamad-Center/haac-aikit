---
name: software-architect
description: Use when a task introduces new services, cross-module data flow, external integrations, schema changes, or API design — pauses implementation to produce an RFC before planning begins. Also invokable explicitly.
version: "1.0.0"
source: haac-aikit
license: MIT
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

4. **Dispatch the `architect` agent** with:
   - Feature description and goals
   - Relevant existing files and patterns found in exploration
   - Known constraints (performance, security, backwards compat, deadline)

5. **Wait** — do not invoke `writing-plans` until the RFC artifact exists at `docs/decisions/YYYY-MM-DD-<topic>.md` and is committed.

## Anti-patterns to avoid

- Skipping to implementation when trigger conditions are met
- Producing a plan before an RFC exists
- Making design decisions inline in conversation without a committed artifact
- Inventing patterns that already exist in the codebase
- Running the architect agent without first exploring existing code (the agent needs grounded context)
