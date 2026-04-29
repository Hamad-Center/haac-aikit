# Project docs

This folder is the deep documentation for haac-aikit. The repo's top-level [README.md](../README.md) is the elevator pitch; these files are the reference material.

## Map

| File | What it covers |
|---|---|
| [observability.md](observability.md) | Rule observability — telemetry hooks, the `.aikit/events.jsonl` schema, the LLM judge, `aikit doctor --rules`, and `aikit report`. The flagship feature. |
| [dialects.md](dialects.md) | Per-tool translation system. Cursor MDC ships in 0.4.0; Claude / Aider / Copilot / Gemini are queued. Includes how to add a new translator. |
| [learn.md](learn.md) | `aikit learn` — mines PR review history for repeated correction patterns, clusters by token similarity, proposes rules. Tuning knobs and CI patterns included. |
| [agents.md](agents.md) | Tier system, roster, and model rationale for the 19 shipped agents. |
| [conflict-resolution.md](conflict-resolution.md) | What happens when `aikit sync` would overwrite a locally-modified file. |
| [claude-md-reference.md](claude-md-reference.md) | Anthropic's 2026 CLAUDE.md / memory features in one place. Source-of-truth for what the standard mechanisms are; `observability.md` covers haac-aikit's extensions on top. |

## Reading order

If you're new to the repo, this is the order that scales best:

1. [Top-level README](../README.md) — what it does, quickstart, what changes after install.
2. [`claude-md-reference.md`](claude-md-reference.md) — the standard CLAUDE.md model. Skim if you already know it.
3. [`observability.md`](observability.md) — the niche feature, where most of the design effort lives.
4. [`dialects.md`](dialects.md) and [`learn.md`](learn.md) — secondary innovations, smaller surface area.

If you're contributing, also read:

- [`AGENTS.md`](../AGENTS.md) — project rules, gotchas, code style.
- [`.claude/rules/markers.md`](../.claude/rules/markers.md) — path-scoped rules for the marker engine (loads only when editing `src/render/**`).

## What's not here

- **Per-skill documentation.** Each skill in `catalog/skills/` is self-documenting via its frontmatter `description`.
- **Per-subagent documentation.** Same — see `catalog/agents/<agent>.md` directly.
- **API docs.** This is a CLI; the `--help` output is the API.
- **Tutorials.** The README's "What changes after you install it" section walks through the install → observe → learn loop. We add longer tutorials only if real users ask for them.
