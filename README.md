# haac-aikit

[![npm version](https://img.shields.io/npm/v/haac-aikit.svg)](https://www.npmjs.com/package/haac-aikit)
[![GitHub](https://img.shields.io/badge/github-Hamad--Center%2Fhaac--aikit-blue?logo=github)](https://github.com/Hamad-Center/haac-aikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A CLI that drops a working AI-coding setup into any repo — rules, skills, safety hooks, subagents, MCP stub, CI templates — and then helps you figure out which of those rules are actually doing anything.

Works with Claude Code, Cursor, GitHub Copilot, Windsurf, Aider, Gemini CLI, and OpenAI Codex CLI.

## Quickstart

```bash
npx haac-aikit
```

The wizard takes about 30 seconds and writes a `.aikitrc.json` you can commit. Re-run later with `aikit sync`.

For CI or scripts:

```bash
npx haac-aikit --yes --tools=claude,cursor,copilot --preset=standard
```

## Why this exists

Every AI tool now wants its own rules file: CLAUDE.md, `.cursor/rules/`, `copilot-instructions.md`, AGENTS.md. They all do roughly the same thing — tell the model how your team writes code — but you end up maintaining four copies, none of which you can tell are working.

You write 30 rules and pray. The kit you cloned last quarter ships a CLAUDE.md with rules about Python even though you write Go. You never delete the dead ones because you can't tell they're dead.

haac-aikit gives you the curated baseline like other kits do (skills, hooks, agents, etc.), and on top of that it adds three things no other kit ships:

1. **Observability** — telemetry hooks log which rules are loaded and violated, so `aikit doctor --rules` can tell you which to keep, strengthen, or delete.
2. **Dialect translation** — Cursor's MDC, Claude's emphasis tokens, Aider's imperative phrasing all want different things. Same canonical AGENTS.md, reformatted per tool.
3. **`aikit learn`** — mines your team's PR review comments for repeated corrections and proposes them as new rules.

## What you get

### Minimal scope

| File | Purpose |
|---|---|
| `AGENTS.md` | The canonical project rules — your edits outside the BEGIN/END markers are never touched |
| `CLAUDE.md` | Five-line shim that imports `@AGENTS.md` plus a Claude-only override block |
| `.cursor/rules/000-base.mdc` | Cursor MDC, dialect-translated from AGENTS.md (not a generic shim) |
| `.github/copilot-instructions.md`, `GEMINI.md`, `CONVENTIONS.md`, `.windsurf/rules/project.md` | Per-tool shims |
| `.mcp.json` | MCP stub with filesystem, memory, fetch — three servers, ~1k tokens of tool defs |
| `.claude/settings.json` | Hardened permissions: deny list for secrets and destructive commands |
| `.aikitrc.json` | Versioned config so re-runs are deterministic |

### Standard scope (default) adds

- 18 process skills, organised into Tier 1 (always-on) and Tier 2 (opt-in). Skill bodies only load when triggered, so the at-rest cost is roughly 100 tokens each.
- 8 subagents: orchestrator, planner, researcher, implementer, reviewer, tester, security-auditor, devops.
- Safety hooks that block dangerous bash, force-push to main, secret commits, and reads of sensitive files.
- Observability hooks (see below).
- A starter `.claude/aikit-rules.json` with regex patterns for common things like no `console.log`, no default exports, no `any`.
- `docs/claude-md-reference.md` — a 2026 reference doc on Anthropic's memory features for your team.
- `.claude/rules/example.md` — a starter path-scoped rule that only loads when matching files are read.
- CI workflows: gitleaks, standard CI, optional `@claude` PR responder, optional rule-adherence PR comment.

### Everything scope adds

Dev container, OTel exporter, plugin wrapper, auto-sync CI, and shape-specific agents (frontend / backend / mobile, picked based on the project shape you select in the wizard).

## Rule observability

After a few Claude Code sessions:

```
$ aikit doctor --rules

Hot rules (working as intended)
  commit.conventional-commits — 47 loads
  security.no-sensitive-files — 12 loads

Disputed rules (>30% violation rate)
  code-style.no-console-log — 47 loads, 18 pattern violations
    Frequently violated. Strengthen with IMPORTANT/YOU MUST or move to a hook.

Dead rules (never observed)
  legacy.bounded-contexts
    Never loaded, cited, or violated. Consider removing or rephrasing.
```

This comes from three small hooks shipped at standard scope:

- **`log-rule-event.sh`** runs on `InstructionsLoaded`. It scans loaded files for `<!-- id: code-style.no-any -->` markers and writes one event per rule per session.
- **`check-pattern-violations.sh`** runs on `PostToolUse` for Edit/Write. It reads `.claude/aikit-rules.json` and flags any pattern matches in the file Claude just wrote.
- **`judge-rule-compliance.sh`** runs on `Stop`. It's opt-in. If you set `AIKIT_JUDGE=1` and `ANTHROPIC_API_KEY`, it asks Claude Haiku to verdict whether each loaded rule was cited or violated this turn (~$0.001/turn). Without both env vars it returns immediately and does nothing.

All three hooks append to `.aikit/events.jsonl`, which `sync` adds to `.gitignore`. Nothing leaves your machine unless you opt in to the judge.

`aikit report` formats the same data as Markdown (PR-comment ready) or JSON (`--format=json`, for CI). Without judge data, the adherence score is `null` with `basis: "no-evidence"` rather than a fake number derived from load counts.

### Adding observability to your own rules

In any rule file, add a stable HTML-comment ID:

```markdown
- <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts --> Use `unknown` and type guards, not `any`.
```

The `id` is required for telemetry. `emphasis` and `paths` are optional metadata read by the dialect translators. HTML comments cost zero context tokens — Claude strips them before injection — so this is free observability.

## Dialect translation

Other multi-tool kits copy the same content into every per-tool file. haac-aikit reformats per dialect.

For Cursor that means: `.cursor/rules/000-base.mdc` gets proper MDC frontmatter, **bold** emphasis on rules tagged `emphasis=high`, and a paths hint surfaced inline. Rule IDs are preserved so the observability hooks see them load alongside AGENTS.md.

Claude, Aider, Copilot, and Gemini translators are the next thing on the roadmap.

## Learn from your PR history

```
$ aikit learn --limit=30
```

Pulls the last 30 merged PRs via `gh`, scans review and issue comments for correction phrases ("we always", "don't here", "actually let's", "nit:"), tokenises them, clusters by Jaccard similarity, and prints proposals in a paste-ready block:

```
<!-- BEGIN:learned -->
## Learned conventions
- <!-- id: learned.use-named-exports --> we always use named exports here, not default
- <!-- id: learned.validate-input-boundary --> please validate inputs at the API boundary
<!-- END:learned -->
```

Review the suggestions, paste the keepers into AGENTS.md. The similarity threshold is intentionally permissive — false positives are easy to reject, missed signal is harder to recover. There are no ML dependencies; it's regex, a stopword list, and a five-line stemmer.

## Update safety

haac-aikit owns content between BEGIN/END markers. Everything outside is yours.

```markdown
# My Project

My own notes — never touched by aikit.

<!-- BEGIN:haac-aikit -->
managed content
<!-- END:haac-aikit -->

More of my notes — also never touched.
```

`aikit sync` is idempotent: running it twice produces the same files. `aikit diff` shows what would change. `aikit update` shows the diff and prompts before writing.

The marker engine handles four dialects automatically (`.md` → `<!-- ... -->`, `.yml` → `# `, `.json` → `// `, shell → `# `). If a downstream user removes a marker by accident, the hook refuses to silently re-append — it errors out so you can investigate.

## Commands

```
aikit                         interactive wizard
aikit sync                    regenerate from .aikitrc.json (idempotent)
aikit update                  pull latest templates, show diff, prompt
aikit diff                    show drift between current state and a fresh generation
aikit add <item>              add a single skill, command, agent, or hook
aikit list                    show installed items + catalog availability
aikit doctor                  schema, triggers, broken-link checks
aikit doctor --rules          rule observability buckets
aikit report                  Markdown adherence summary
aikit report --format=json    same data, structured for CI
aikit learn --limit=30        propose rules from your PR review history
```

Most prompts have a `--flag` equivalent for headless use.

## Design choices, in case they help you decide

- **Skills are ~100 tokens at rest.** Bodies load only when the skill is triggered. A kit with 30 always-on skill bodies eats your context window before you've started.
- **AGENTS.md is canonical, CLAUDE.md is a 5-line shim that imports it.** One source of truth across all tools.
- **Three MCP servers by default.** Five servers can be ~77K tokens of tool definitions. Most projects don't need a search engine *and* a database *and* a filesystem in every conversation.
- **Marker-protected templates.** This was the first thing I broke in my own setup before adding the marker engine. Your edits outside the markers survive every `sync`.
- **No LLM-generated content in the catalog.** Every shipped skill / hook / agent is human-curated. ETH Zurich's 2026 study on LLM-augmented context found dumps add cost without improving success rate.

## How haac-aikit compares

| | haac-aikit | rulesync | ruler | claudekit |
|---|---|---|---|---|
| Includes content (skills, agents, hooks) | yes | no — config manager only | no — config manager only | Claude-only |
| Cross-tool | 7 tools | yes | yes | no |
| Open Skills standard (agentskills.io) | yes | no | no | no |
| Config file backed | `.aikitrc.json` | no | no | no |
| Idempotent BEGIN/END markers | yes | no | `.bak` backups | no |
| Rule observability | yes | no | no | no |
| Dialect translation | yes | no | no | no |
| Learn from PR history | yes | no | no | no |

## Status

This is 0.4.0. The strategy plan reserves 1.0 until at least three external teams have used the observability loop on real PRs — until then, expect breaking changes between minor versions. The Cursor dialect translator is the only one shipping in 0.4.0; Claude, Aider, Copilot, and Gemini translators are next.

## Contributing

Issues and PRs welcome at [github.com/Hamad-Center/haac-aikit](https://github.com/Hamad-Center/haac-aikit).

I'm looking for **three teams** to try the observability loop on a real codebase. Your feedback shapes 1.0. Comment on [issue #1](https://github.com/Hamad-Center/haac-aikit/issues/1) if you're up for it.

## License

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for the list of adapted sources.
