# haac-aikit

[![npm](https://img.shields.io/npm/v/haac-aikit.svg)](https://www.npmjs.com/package/haac-aikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

One `AGENTS.md` config, seven AI coding tools see it. Plus four HTML skills that produce single-page artifacts instead of walls of markdown.

Works with **Claude Code · Cursor · Copilot · Windsurf · Aider · Gemini CLI · OpenAI Codex CLI**.

## Install

```bash
npx haac-aikit
```

30-second wizard. Headless: `npx haac-aikit --yes --tools=claude`.

## The four HTML skills

```bash
aikit add --html
```

| Skill | Use it when | Output |
|---|---|---|
| **`/docs`** | Documenting a feature or gotcha | `docs/<name>.html` |
| **`/decide`** | Picking between 2-4 technical options | `docs/decisions/<date>-<slug>.html` |
| **`/directions`** | Exploring visual design variants | `docs/directions/<date>-<slug>.html` |
| **`/roadmap`** | Handing an implementation plan to an implementer | `docs/roadmaps/<date>-<slug>.html` |

Each command writes one self-contained HTML file — no build step, no CDN, commit and share the link. Built on [Thariq Shihipar's "Unreasonable Effectiveness of HTML for Claude Code"](https://thariqs.github.io/html-effectiveness/).

## What else you get

- **Cross-tool fan-out.** Skills, agents, hooks, and MCP servers fan out per selected tool in its native format. Pick `--tools=cursor` and get `.cursor/rules/` + `.cursor/hooks.json` + `.cursor/mcp.json`. Pick `--tools=codex` and get `.codex/agents/*.toml` + `.codex/config.toml` with MCP servers.
- **Safety hooks.** Blocks force-push to `main`, secret commits, `rm -rf` on sensitive paths, reads of `.ssh/` / `.aws/` / `secrets/`.
- **Rule observability.** Telemetry tracks which rules fire, which are violated, which are dead weight. `aikit doctor --rules` shows the report.
- **Built-in skills + agents.** 14 always-on skills (TDD, debugging, brainstorming, planning, ...) + 11 opt-in. Specialist agents for orchestration and PR description.

## Commands

```
aikit                interactive wizard
aikit add --html     install the four HTML skills + templates
aikit add <name>     add a single skill / agent / hook
aikit sync           regenerate per-tool files from .aikitrc.json
aikit doctor --rules sanity check + observability report
aikit report         rule-adherence summary (markdown or json)
```

Full reference: `aikit --help`. Detailed audit per tool: [`AUDIT.md`](AUDIT.md).

## Status

Pre-1.0. Expect breaking changes between minor versions. **0.12.0** ships with cross-tool parity for 6 of 7 tools (Aider has no native rule loader; we ship a skills index in `CONVENTIONS.md` instead). All blockers from the [pre-publish audit](audits/) have been fixed.

- Site: <https://hamad-center.github.io/haac-aikit/>
- Try / discuss: [issue #1](https://github.com/Hamad-Center/haac-aikit/issues/1)

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
