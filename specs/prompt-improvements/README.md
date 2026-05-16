# Prompt Improvements

This folder documents how the prompt files shipped by `haac-aikit` (skills, agents, slash commands) compare to the conventions used by the official Claude Code CLI, and what to change to bring them into alignment.

It is **not** a project mission, tech-stack, or roadmap doc — it is a focused audit + remediation plan for the prompt catalog under `catalog/skills/`, `catalog/agents/`, and `catalog/commands/`.

## Audit scope

| Surface | Path | Files |
|---|---|---|
| Always-on skills | `catalog/skills/tier1/` | 14 |
| Opt-in skills | `catalog/skills/tier2/` | 11 |
| Always-on agents | `catalog/agents/tier1/` | 2 |
| Opt-in agents | `catalog/agents/tier2/` | 3 |
| Slash commands | `catalog/commands/` | 8 |
| **Total** | | **38** |

## Index

| # | Document | Purpose |
|---|---|---|
| 00 | [Conventions reference](./00-conventions.md) | The Claude Code skill/agent/command conventions used as the audit baseline. Read this first if you want to know **why** something was flagged. |
| 01 | [Skills · tier1](./01-skills-tier1.md) | Per-file improvements for all 14 always-on skills. |
| 02 | [Skills · tier2](./02-skills-tier2.md) | Per-file improvements for all 11 opt-in skills. |
| 03 | [Agents](./03-agents.md) | Per-file improvements for both tier1 and tier2 agents (5 total). |
| 04 | [Commands](./04-commands.md) | Per-file improvements for all 8 slash commands. |
| 05 | [Cross-cutting issues](./05-cross-cutting.md) | Problems that span multiple files: broken cross-references, wrong tool names, DRY violations, missing patterns. |
| 06 | [Priority roadmap](./06-priority-roadmap.md) | Ordered remediation plan (P0/P1/P2) with effort estimates and suggested PR grouping. |

## Headline findings

The catalog is **well-aligned in shape** (consistent frontmatter, "Use when…" descriptions, tier system, terse procedural commands) but has **a small number of load-bearing inaccuracies** that would silently fail in real use:

1. **`orchestrator` agent dispatches 7 specialist agents that don't exist** (`planner`, `researcher`, `implementer`, `reviewer`, `tester`, `security-auditor`, `devops`). The only agents shipped are `backend`, `frontend`, `mobile`, `pr-describer`. → P0
2. **`software-architect` skill dispatches a non-existent `architect` agent.** → P0
3. **`dispatching-parallel-agents` skill uses the wrong tool name** (`Agent` instead of `Task`). → P0
4. **`security-review` skill and `/security-review` command duplicate ~30 lines of OWASP content** — the command should delegate. → P1
5. **Many tier1 skills lack literal user-phrase triggers** in their descriptions, weakening auto-load probability. → P1

See [05-cross-cutting.md](./05-cross-cutting.md) for the full list and [06-priority-roadmap.md](./06-priority-roadmap.md) for the suggested fix order.

## How to use this folder

- **If you want to fix one file**: open its category doc (01–04), find the file's entry, and apply the per-file improvements list.
- **If you want to plan a remediation PR**: read [06-priority-roadmap.md](./06-priority-roadmap.md). It groups fixes by blast radius and suggests batching.
- **If you want to write a new skill/agent/command**: read [00-conventions.md](./00-conventions.md) first so you don't reintroduce these issues.

## Format used in 01–04

Every per-file entry uses the same structure so they are scannable and diff-friendly:

```
### `<path>`
**Current state:** 1 sentence + line count + alignment summary.
**Issues identified:**
- Specific issue with line number reference
**Improvements:**
1. Concrete change (before/after when useful)
**Priority:** P0 (broken/wrong) | P1 (notable gap) | P2 (polish)
**Estimated effort:** S (≤5 min) | M (~15 min) | L (>30 min)
```

`P0` = something is broken/wrong/fictional and would actively mislead users.
`P1` = a real gap in trigger quality, consistency, or completeness.
`P2` = polish — small wins that compound across the catalog.
