# haac-aikit

[![npm version](https://img.shields.io/npm/v/haac-aikit.svg)](https://www.npmjs.com/package/haac-aikit)
[![GitHub](https://img.shields.io/badge/github-Hamad--Center%2Fhaac--aikit-blue?logo=github)](https://github.com/Hamad-Center/haac-aikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Docs that update themselves.** A cross-tool AI-coding kit (Claude Code, Cursor, Copilot, Windsurf, Aider, Gemini, Codex) that drops opinionated rules + skills + safety hooks into any repo. Headline feature: two new skills that maintain your project's HTML documentation and decision log as the code changes.

```bash
npx haac-aikit
```

## The two headline skills (v0.11)

- **`/docs`** — keeps a living HTML documentation tree at `docs/` current. The agent reads only the section it needs (via marker-bounded blocks), proposes the edit in chat, writes after you confirm. Your README stops going stale.
- **`/decide`** — generates one rich HTML tradeoff page per architectural choice, saved to `docs/decisions/YYYY-MM-DD-<slug>.html`. Options as cards, pros/cons as colored dots, technical bit explained in plain language. A permanent decision log accumulates.

Built on Thariq Shihipar's [Unreasonable Effectiveness of HTML for Claude Code](https://thariqs.github.io/html-effectiveness/) — generating HTML instead of markdown gives you scannable, interactive output. We took the insight and built the workflows that compound the longest.

## What else you get

Beyond `/docs` and `/decide`, a `standard` install drops in:

- **Cross-tool rules** — one canonical `AGENTS.md`, dialect-translated per tool (proper MDC for Cursor, emphasis tokens for Claude, imperative phrasing for Aider). Stop maintaining four copies.
- **Safety hooks** — block force-push to main, secret commits, `rm -rf`, reads of `.env*` / `.ssh*` / `.aws*`. Fires before the tool call.
- **Rule observability** — telemetry tells you which rules fire, get violated, or are dead weight. `aikit doctor --rules` shows the buckets.
- **Learn from PR history** — `aikit learn --limit=30` mines merged PR reviews for repeated corrections, proposes them as new rules.
- **18 process skills + 14 agents** — TDD, brainstorming, debugging, planner, reviewer, debugger, pr-describer, more.
- **CI templates** — gitleaks, standard CI, optional `@claude` PR responder.

Run `npx haac-aikit` for the wizard, or `npx haac-aikit --yes --tools=claude --preset=standard` for headless / CI.

## How it compares

| | haac-aikit | rulesync | ruler | claudekit |
|---|---|---|---|---|
| Includes content (skills, agents, hooks) | yes | no | no | Claude-only |
| Cross-tool (7 tools) | yes | yes | yes | no |
| Rule observability | yes | no | no | no |
| Dialect translation | yes | no | no | no |
| Learn from PR history | yes | no | no | no |
| Living HTML docs (`/docs`) + decision log (`/decide`) | yes | no | no | no |
| Idempotent BEGIN/END markers | yes | no | `.bak` backups | no |

## Commands

```
aikit                       interactive wizard
aikit sync                  regenerate from .aikitrc.json
aikit update                pull latest templates, show diff
aikit add <item>            add a single skill / command / agent / hook
aikit list                  show installed items + catalog
aikit doctor [--rules]      sanity / observability check
aikit report [--format=...] adherence summary (markdown or json)
aikit learn --limit=30      propose rules from your PR review history
```

## Status & links

**0.11.0** — holding 1.0 until at least three external teams have used the observability loop on real PRs. Expect breaking changes between minor versions until then.

- Site: <https://hamad-center.github.io/haac-aikit/>
- Discussion / try-it sign-up: [issue #1](https://github.com/Hamad-Center/haac-aikit/issues/1)
- Why we cut the old 20-template HTML skill: [the landing page](https://hamad-center.github.io/haac-aikit/) explains it — short version: developers don't browse a 20-template menu, two real workflows do 100% of the job. Recover the deleted templates with `git checkout v0.10.0 -- catalog/templates/html-artifacts/` if you want them.

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
