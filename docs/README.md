# Project docs

This folder is the deep documentation for haac-aikit. The repo's top-level [README.md](../README.md) is the elevator pitch; these files are the reference material.

## Map

| File | What it covers |
|---|---|
| [observability.md](observability.md) | Rule observability — telemetry hooks, the `.aikit/events.jsonl` schema, the LLM judge, `aikit doctor --rules`, and `aikit report`. The flagship feature. |
| [dialects.md](dialects.md) | Per-tool translation system. Cursor MDC ships today; Claude / Aider / Copilot / Gemini are queued. Includes how to add a new translator. |
| [agents.md](agents.md) | Tier system, roster, and model rationale for the shipped agents. |
| [conflict-resolution.md](conflict-resolution.md) | What happens when `aikit sync` would overwrite a locally-modified file. |

## Reading order

If you're new to the repo:

1. [Top-level README](../README.md) — what it does, quickstart, what changes after install.
2. [`observability.md`](observability.md) — the niche feature, where most of the design effort lives.
3. [`dialects.md`](dialects.md) — secondary innovation, smaller surface area.

If you're contributing, also read:

- [`AGENTS.md`](../AGENTS.md) — project rules, gotchas, code style.
- [`.claude/rules/markers.md`](../.claude/rules/markers.md) — path-scoped rules for the marker engine (loads only when editing `src/render/**`).

## What's not here

- **Per-skill documentation.** Each skill in `catalog/skills/<tier>/<name>/SKILL.md` is self-documenting via its frontmatter `description`.
- **Per-subagent documentation.** Same — see `catalog/agents/<agent>.md` directly.
- **API docs.** This is a CLI; the `--help` output is the API.
