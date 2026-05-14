# haac-aikit

[![npm version](https://img.shields.io/npm/v/haac-aikit.svg)](https://www.npmjs.com/package/haac-aikit)
[![GitHub](https://img.shields.io/badge/github-Hamad--Center%2Fhaac--aikit-blue?logo=github)](https://github.com/Hamad-Center/haac-aikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A cross-tool AI-coding kit. Drops opinionated rules, skills, and safety hooks into any repo. Works with **Claude Code, Cursor, Copilot, Windsurf, Aider, Gemini, and Codex**.

## Quick start

```bash
npx haac-aikit
```

Interactive wizard picks your AI tools and writes everything. For CI / headless:

```bash
npx haac-aikit --yes --tools=claude
```

## HTML skills

Four skills that turn one AI prompt into a single self-contained HTML page. Easier to scan than walls of markdown, easier to commit than screenshots. Install all four at once:

```bash
aikit add --html
```

| Skill | When to use it | Output |
|---|---|---|
| **`/docs`** | Document a feature, module, or gotcha | `docs/<name>.html` |
| **`/decide`** | Pick between 2-4 technical options | `docs/decisions/<date>-<slug>.html` |
| **`/directions`** | Explore 2-4 visual design variants side by side | `docs/directions/<date>-<slug>.html` |
| **`/roadmap`** | Lay out an implementation plan to hand to an implementer | `docs/roadmaps/<date>-<slug>.html` |

Examples:

```
/decide      auth strategy: cookies vs JWT vs Clerk
/directions  empty state for the projects view
/roadmap     comment threads on task cards
/docs        the new auth refresh flow
```

Each command confirms the brief with you before writing, then drops a self-contained HTML file in git. Open it in a browser, share the link, commit it. No build step, no CDN, no dependencies.

Based on Thariq Shihipar's [Unreasonable Effectiveness of HTML for Claude Code](https://thariqs.github.io/html-effectiveness/).

## What else you get

**One file, all tools see it — and not just rules.** Write your project rules once in `AGENTS.md`. The kit translates them into each tool's native format — `.cursor/rules/*.mdc` for Cursor, `CLAUDE.md` for Claude, Aider conventions, Copilot instructions, and so on. **Skills, agents, hooks, and MCP servers also fan out per tool**: each Cursor user gets `.cursor/rules/skill-<name>.mdc` for every skill plus `.cursor/hooks.json` for safety hooks; each Copilot user gets `.github/instructions/` for skills and `.github/agents/` for agents; each Codex user gets `.codex/agents/*.toml`. Pick a tool, get only that tool's files. No cross-tool ballast.

**Safety hooks that fire before the AI can run anything.** Blocks force-push to `main`, accidental commits of `.env*` files, `rm -rf` on sensitive paths, and reads of `.ssh/` / `.aws/` / `secrets/`. Catches the mistake before the tool call, not after.

**See which rules actually work.** Telemetry tracks which rules get cited, which get violated, and which are dead weight. Run `aikit doctor --rules` to see a per-rule report. Prune the rules nobody follows.

**Process skills and specialist agents.** 14 always-on skills (TDD, debugging, brainstorming, code review, planning, etc.) plus 11 opt-in tier2 skills. 2 always-on agents (`orchestrator`, `pr-describer`) plus 3 shape-specialty agents (`frontend`, `backend`, `mobile`) installable via `aikit add <name>`.

**MCP + opt-in CI workflows.** A shared `.mcp.json` stub so every tool sees the same Model Context Protocol servers, plus three AI-aligned GitHub Actions: a `@claude` PR responder, an AGENTS.md sync-on-push workflow, and a rule-observability report runner.

## All commands

```
aikit                       interactive wizard
aikit add --html            install the HTML skill bundle (4 skills + templates)
aikit add <name>            add one skill / command / agent / hook
aikit sync                  regenerate per-tool files from .aikitrc.json
aikit update                pull latest templates, show diff
aikit diff                  show drift between current state and a fresh generation
aikit list                  show what's installed + the full catalog
aikit doctor [--rules]      sanity check / rule observability report
aikit report                rule-adherence summary (markdown or json)
```

## How it compares

Other kits (rulesync, ruler, claudekit) generate config files. **haac-aikit ships the content** — rules, hooks, skills, agents — and adds telemetry to tell you what's working. Plus idempotent `BEGIN:haac-aikit` / `END:haac-aikit` markers so re-running `sync` never clobbers your edits.

## Status

Pre-1.0. Holding 1.0 until at least three external teams have used the observability loop on real PRs. Expect breaking changes between minor versions.

- Site: <https://hamad-center.github.io/haac-aikit/>
- Try it / discussion: [issue #1](https://github.com/Hamad-Center/haac-aikit/issues/1)

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
