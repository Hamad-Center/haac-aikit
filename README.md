# haac-aikit

[![npm version](https://img.shields.io/npm/v/haac-aikit.svg)](https://www.npmjs.com/package/haac-aikit)
[![GitHub](https://img.shields.io/badge/github-Hamad--Center%2Fhaac--aikit-blue?logo=github)](https://github.com/Hamad-Center/haac-aikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

One command drops a working AI-coding setup into any repo — rules, skills, safety hooks, subagents, MCP stub, CI templates — for Claude Code, Cursor, Copilot, Windsurf, Aider, Gemini CLI, and Codex.

## Quickstart

```bash
npx haac-aikit
```

30-second wizard, writes a `.aikitrc.json` you can commit. Re-run anytime with `aikit sync`.

For CI or scripts:

```bash
npx haac-aikit --yes --tools=claude,cursor,copilot --preset=standard
```

## What you get

### Minimal scope

| File | Purpose |
|---|---|
| `AGENTS.md` | Canonical rules — your edits outside BEGIN/END markers are never touched |
| `CLAUDE.md` | Five-line shim that imports `@AGENTS.md` |
| `.cursor/rules/000-base.mdc` | Dialect-translated MDC (not a generic copy) |
| Per-tool shims | Copilot, Gemini, Windsurf, Aider |
| `.mcp.json` | MCP stub: filesystem, memory, fetch |
| `.claude/settings.json` | Hardened permissions: deny list for secrets and destructive commands |

### Standard scope adds

- **18 process skills** in `.claude/skills/` — TDD, brainstorming, debugging, git workflows, and more. Bodies load on demand, ~100 tokens at rest.
- **14 agents** in `.claude/agents/` — planner, reviewer, debugger, pr-describer, and more.
- **Safety hooks** — blocks force-push to main, secret commits, `rm -rf`, reads of `.env*` / `.ssh*` / `.aws*`. Fires before the tool call, doesn't rely on the model cooperating.
- **Rule observability hooks** — logs which rules load and which get violated, feeds `aikit doctor --rules`.
- **`/docs` skill** — keeps a small HTML documentation tree at `docs/` current. Section-bounded updates so the agent reads/edits one block, not the whole file.
- **`/decide` skill (opt-in)** — generates one rich HTML tradeoff page per decision under `docs/decisions/`. Plain-language pros/cons, recommended option marked, written so a non-engineer stakeholder can scan it.
- CI workflows: gitleaks, standard CI, optional `@claude` PR responder.

### Everything scope adds

Dev container, OTel exporter, plugin wrapper, auto-sync CI, shape-specific agents (frontend / backend / mobile).

## What makes it different

**Rule observability.** Telemetry hooks tell you which rules fire, which get violated, and which are dead weight. `aikit doctor --rules` shows the buckets; `aikit report` formats them for a PR comment. → [docs/observability.md](docs/observability.md)

**Dialect translation.** One canonical `AGENTS.md`, reformatted per tool — proper MDC frontmatter for Cursor, emphasis tokens for Claude, imperative phrasing for Aider. You stop maintaining four copies of the same rules. → [docs/dialects.md](docs/dialects.md)

**Learn from your PR history.** `aikit learn --limit=30` mines merged PR review comments for repeated corrections and proposes them as new rules. No ML — just regex, a stopword list, and Jaccard similarity. → [docs/learn.md](docs/learn.md)

## Why the HTML side stays small (one starter, not 20 templates)

An earlier version of this kit shipped 20 HTML templates — PR reviews, slide decks, design systems, prototype animations, feature-flag editors, prompt tuners. Beautiful catalog. **We deleted it.** Here's the honest reason:

- **Developers don't browse a 20-template catalog.** They open the skill, see the wall of patterns, scroll past it, and write whatever HTML they were going to write anyway. Most of those templates were never reached for in practice. A library nobody borrows from is just shelves.
- **A 205-line always-on skill is expensive to keep around.** Every agent invocation paid for that context, even when the user wasn't generating HTML at all. We were taxing every conversation to support a rare action.
- **Two real jobs, not twenty edge cases.** When we asked what people actually needed HTML for, two patterns kept surfacing: (1) **living project docs** they could share for handover, and (2) **tradeoff pages** when there's a decision to make. Everything else was a curated showcase, not a tool.

So `/html` got split into two focused skills:

- **`/docs`** — always-on, ~80-line skill, one starter HTML template. Maintains an HTML doc tree at `docs/` with section-bounded surgical updates.
- **`/decide`** — opt-in tier2, ~50-line skill, one rich tradeoff template. Each call writes a new dated file under `docs/decisions/`.

Both lean on the marker engine for section-level reads/writes (HTML stays cheap because the agent never reloads the whole file). The skill files together are smaller than the old single skill alone. **Less to read, less to maintain, more actual usage.**

If you want the deleted templates back, fork the previous release (`git checkout v0.10.0 -- catalog/templates/html-artifacts/`) — they're forks of [github.com/ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness) and still useful as reference material.

## Commands

```
aikit                         interactive wizard
aikit sync                    regenerate from .aikitrc.json (idempotent)
aikit update                  pull latest templates, show diff, prompt
aikit diff                    show drift between current state and a fresh sync
aikit add <item>              add a single skill, command, agent, or hook
aikit list                    show installed items + catalog availability
aikit doctor                  schema, triggers, broken-link checks
aikit doctor --rules          rule observability buckets
aikit report                  Markdown adherence summary
aikit report --format=json    same data, structured for CI
aikit learn --limit=30        propose rules from your PR review history
```

## How it compares

| | haac-aikit | rulesync | ruler | claudekit |
|---|---|---|---|---|
| Includes content (skills, agents, hooks) | yes | no | no | Claude-only |
| Cross-tool (7 tools) | yes | yes | yes | no |
| Rule observability | yes | no | no | no |
| Dialect translation | yes | no | no | no |
| Learn from PR history | yes | no | no | no |
| Idempotent BEGIN/END markers | yes | no | `.bak` backups | no |

## Status

0.11.0. Holding 1.0 until at least three external teams have used the observability loop on real PRs. Until then, expect breaking changes between minor versions.

Looking for teams to try it — feedback shapes 1.0. Comment on [issue #1](https://github.com/Hamad-Center/haac-aikit/issues/1).

## Contributing

Issues and PRs welcome at [github.com/Hamad-Center/haac-aikit](https://github.com/Hamad-Center/haac-aikit).

## License

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
