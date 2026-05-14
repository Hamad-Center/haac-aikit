# audits/catalog-agents.md

Agents catalog quality review.

## Inventory

- **tier1 (always-on, 2 agents)**: orchestrator, pr-describer
- **tier2 (opt-in, 3 agents)**: backend, frontend, mobile

## Audit checklist

- [x] Every agent has frontmatter `name`, `description`, `model`, `tools` (list)
- [x] No duplicate agent names
- [x] `orchestrator` agent — pure dispatcher, never writes code directly
- [x] `pr-describer` agent — writes PR titles/bodies from git diff
- [x] Tier2 agents are shape-specialty (frontend/backend/mobile); install via `aikit add <name>`
- [x] No agents duplicate tier1 skill content (deduplicated in 0.12 audit)
- [ ] Manual: verify `model: claude-sonnet-4-6` references are current (Anthropic's latest Sonnet ID)

## Status

🟢 — minimal, deduplicated, well-shaped. The model ID is the only thing worth periodically refreshing.
