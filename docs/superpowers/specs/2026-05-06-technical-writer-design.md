# Design: Technical Writer Agent

**Date:** 2026-05-06
**Status:** Approved
**Outcome:** Adds a tier1 agent that produces user-facing and developer-facing documentation on explicit invocation.

---

## Problem Statement

After code ships, documentation rots. No existing agent writes README updates, API docs, or usage guides. `pr-describer` handles PR bodies only. `technical-writer` fills this gap — called explicitly to document any feature, module, or API.

---

## Pipeline Position

```
[user | orchestrator | architect] → technical-writer → docs committed → done
```

Terminal node. Nothing dispatches from it. Explicit-only — never auto-triggers.

---

## Deliverable

| Artifact | Path |
|----------|------|
| Agent | `catalog/agents/tier1/technical-writer.md` |

---

## Agent: `technical-writer`

**Model:** `claude-sonnet-4-6`
**Rationale:** Documentation is a writing + comprehension task, not a hard judgment call. Frequent explicit invocation makes Opus cost unjustified.

**Tools:** `Read, Grep, Glob, Write`
- No `WebSearch` — docs derived from local codebase only
- No `Agent` — terminal node, dispatches nothing

**Trigger:** Explicit only — "document this", "update the README", "write a guide for X"

---

## Modes

| Mode | Trigger phrase | Output location |
|------|---------------|----------------|
| `README` | "update the README", "document this project" | `README.md` |
| `API docs` | "document this API", "document these functions" | `docs/api/<topic>.md` |
| `guides` | "write a guide for X", "document how to use Y" | `docs/guides/<topic>.md` |

---

## Protocol

1. Identify mode — infer from invocation phrase; ask if ambiguous
2. Read the target — specific files, module, or feature being documented; not the whole codebase
3. Check existing docs — find and read any existing doc file before writing; never overwrite without diffing
4. Write — produce the doc file in the correct location
5. Emit handoff

## Hard Constraints

- Never document what you haven't read — no hallucinated API shapes
- Never overwrite existing content without reading it first
- Output is separate markdown files only — no inline docstrings

---

## Handoff Format

```
[technical-writer] → [user | orchestrator]
Mode: README | API docs | guides
Written: <file path>
Summary: <one-line description of what was documented>
Status: DONE | NEEDS_CLARIFICATION
```

`NEEDS_CLARIFICATION` fires when the target is ambiguous (e.g., multiple modules match the description).

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Artifact type | Agent only (no skill) | Explicit-only trigger means no protocol needed for when to activate |
| Trigger | Explicit only | Docs written before code go stale; auto-trigger produces low-quality output |
| Output | Separate doc files | Inline docstrings are out of scope; markdown files are durable and reviewable |
| Model | Sonnet | Writing task, not hard judgment; frequent invocation makes Opus cost unjustified |
| Modes | README / API docs / guides | Covers full spectrum from user-facing to developer-facing without over-engineering |
