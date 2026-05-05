# Design: Software Architect Role (SA)

**Date:** 2026-05-06
**Status:** Approved
**Outcome:** Adds a tier1 skill + agent pair that inserts an RFC-producing step between brainstorming and planning.

---

## Problem Statement

The haac-aikit pipeline jumps from `brainstorming → writing-plans` with no layer that makes high-level architectural decisions. The orchestrator dispatches; the planner sequences; nobody decides system boundaries, API shapes, or data flow before code is written. Wrong architecture decisions compound into every downstream file — they are the most expensive mistakes to fix because they invalidate plans and implementations already written.

---

## Pipeline Position

```
brainstorming (skill)
       ↓
software-architect (skill)  ← auto-triggers on complexity signals; can be invoked explicitly
       ↓
architect (agent, Opus)     ← explores codebase, evaluates options, writes RFC, emits handoff
       ↓
writing-plans (skill)
       ↓
orchestrator → implementer / reviewer / etc.
```

---

## Deliverables

| Artifact | Path | Purpose |
|----------|------|---------|
| Skill | `catalog/skills/tier1/software-architect.md` | Behavioral protocol: when to trigger, how to prepare context |
| Agent | `catalog/agents/tier1/architect.md` | Worker: Opus model, scoped tools, produces RFC, emits handoff |
| RFC output | `docs/decisions/YYYY-MM-DD-<topic>.md` | Architecture Decision Record committed before planning |

---

## Skill: `software-architect`

**Tier:** 1 (always-on)

**Auto-trigger conditions** (any one fires the skill):
- New service, module, or package being introduced
- Cross-module data flow or shared state
- New external integration (API, DB, queue, auth provider)
- Schema or data model changes
- API surface being designed (REST, GraphQL, events)
- Feature touches ≥ 3 files across different domains

**Explicit trigger:** user says "run the architect", "design this first", "RFC for X"

**Protocol:**
1. Pause — do not write code or a plan yet
2. Explore — read codebase for existing patterns relevant to the decision
3. Identify the 2-3 key architectural choices this feature requires
4. Dispatch the `architect` agent with: feature description, codebase findings, known constraints
5. Wait — do not invoke `writing-plans` until the RFC artifact is committed

**Hard constraints:**
- Never skip to implementation when trigger conditions are met
- Never produce a plan before an RFC exists
- Never invent patterns that already exist in the codebase

---

## Agent: `architect`

**Model:** `claude-opus-4-7`
**Rationale:** Wrong architecture decisions compound into every downstream file. This is the hardest judgment call in the pipeline.

**Tools:** `Read, Grep, Glob, WebSearch, Write`
- `Read/Grep/Glob` — verify existing patterns before designing
- `WebSearch` — look up external API docs, RFC examples, industry patterns
- `Write` — produce the RFC file

**Inputs (from dispatcher):**
- Feature description and goals
- Relevant existing files and patterns
- Known constraints (performance, security, backwards compat, deadline)

**Protocol:**
1. Confirm existing patterns (grep/read before designing)
2. Identify 2-3 key design decisions
3. Evaluate options — 2-3 concrete options per decision, scored against constraints
4. Recommend — explicit recommendation with rationale
5. Write RFC to `docs/decisions/YYYY-MM-DD-<topic>.md`
6. Emit handoff to `writing-plans`

**Hard constraints:**
- Do not write code
- Do not write a plan
- Emit `NEEDS_CLARIFICATION` if constraints make all options unacceptable

---

## RFC Format

```
# RFC: <topic>

## Problem Statement
## Constraints
## Options
### Option A — <name>
### Option B — <name>
### Option C — <name> ⭐ recommended
## Decision
## Consequences
## Open Questions
```

---

## Handoff Format

```
[architect] → [writing-plans]
RFC: docs/decisions/YYYY-MM-DD-<topic>.md
Decision: <one-line summary>
Key constraints for planner:
- <constraint>
Status: DONE | NEEDS_CLARIFICATION
```

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Artifact type | Skill + Agent pair | Skill handles protocol + auto-trigger; agent handles Opus model + tool scoping |
| RFC format | Full RFC (problem, constraints, options, decision, consequences) | Audience is downstream AI agents; structured format enables reliable handoff |
| Trigger mode | Both auto + explicit | Auto catches complex tasks; explicit handles edge cases |
| Tier | 1 (always-on) | Architecture decisions are too expensive to miss; opt-in gets skipped when most needed |
| Model | Opus | Wrong architecture decisions are the most expensive mistakes in the pipeline |

---

## Verification

1. `npm run catalog:check` passes
2. `npm test` passes
3. `npm run typecheck` passes
4. Both files have valid YAML frontmatter
5. `architect.md` has `model: claude-opus-4-7` and correct tool list
6. Frontmatter `description` fields are dispatch-routing-ready
