# haac-aikit

[![npm version](https://img.shields.io/npm/v/haac-aikit.svg)](https://www.npmjs.com/package/haac-aikit)
[![GitHub](https://img.shields.io/badge/github-Hamad--Center%2Fhaac--aikit-blue?logo=github)](https://github.com/Hamad-Center/haac-aikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**The batteries-included AI-agentic-coding kit — now with rule observability.**
One command drops a complete, opinionated, cross-tool setup into any repo — rules, skills, slash commands, subagents, safety hooks, MCP stub, CI templates, **and a feedback loop that measures whether your rules actually work**.

Works with: Claude Code · Cursor · GitHub Copilot · Windsurf · Aider · Gemini CLI · OpenAI Codex CLI

---

## What's new in 0.4.0 — the rule observability loop

Most AI-coding kits ship rules and pray. **haac-aikit is the first to measure them.**

| | What it does | New CLI |
|---|---|---|
| 🔭 **Phase 1 — Observability** | Telemetry hooks log every rule load + violation to `.aikit/events.jsonl`. Optional LLM judge verdicts whether each rule was followed. Local-only, gitignored. | `aikit doctor --rules`<br>`aikit report` |
| 🎨 **Phase 2 — Dialects** | Same canonical AGENTS.md, reformatted per tool. Cursor gets MDC frontmatter + emphasis tuning + paths hints — not a generic shim. Other tools follow. | _(automatic via `sync`)_ |
| 🌱 **Phase 3 — Learn from PRs** | Mines your team's PR review comments for repeated corrections, clusters by token similarity, proposes new rules in a paste-ready block. | `aikit learn` |

### The pitch in one example

After a few Claude Code sessions, run:

```bash
aikit doctor --rules
```

```
✓ Hot rules (working as intended)
  commit.conventional-commits — 47 loads
  security.no-sensitive-files — 12 loads
⚠ Disputed rules (>30% violation rate)
  code-style.no-console-log — 47 loads, 18 pattern violations
    Frequently violated — strengthen with IMPORTANT/YOU MUST or move to a hook.
✗ Dead rules (never observed)
  legacy.bounded-contexts
    Never loaded, cited, or violated — consider removing or rephrasing.
```

That's a real "fitness tracker for your CLAUDE.md". No other AI-coding kit gives you that.

---

## Quickstart

```bash
# Run in any repo directory
npx haac-aikit

# Or install globally
npm i -g haac-aikit
aikit
```

The interactive wizard takes under 30 seconds and leaves behind a `.aikitrc.json` you can commit.

### Headless (CI-friendly)

```bash
npx haac-aikit --yes --tools=claude,cursor,copilot --preset=standard
```

---

## What gets installed

### Scope: minimal
| File | Purpose |
|---|---|
| `AGENTS.md` | Single source of truth — project rules, conventions, gotchas |
| `CLAUDE.md` | 8-line shim: `@AGENTS.md` + Claude-specific overrides region |
| `.cursor/rules/000-base.mdc` | Cursor MDC — **dialect-translated from AGENTS.md** with emphasis + paths |
| `.github/copilot-instructions.md` | Copilot pointer |
| `GEMINI.md`, `CONVENTIONS.md`, `.windsurf/rules/project.md` | Per-tool shims |
| `.mcp.json` | MCP stub with filesystem + memory + fetch (3 safe defaults) |
| `.claude/settings.json` | Hardened permissions — deny list for secrets + destructive commands |
| `.aikitrc.json` | Versioned config for reproducible re-runs |

### Scope: standard (default) — adds
- **18 curated skills** (10 Tier-1 always-on + 8 Tier-2 default) — process skills, not stack-specific
- **8 subagents** — orchestrator, planner, researcher, implementer, reviewer, tester, security-auditor, devops
- **Safety hooks** — block dangerous bash, force-push to main, secret commits, sensitive file access
- **Quality hooks** — format on save, session context primer, pre-compaction state preservation
- **🔭 Observability hooks** — `log-rule-event.sh`, `check-pattern-violations.sh`, opt-in `judge-rule-compliance.sh`
- **`.claude/aikit-rules.json`** — starter pattern config (no console.log, no default exports, no `any`, etc.)
- **`docs/claude-md-reference.md`** — 2026 Anthropic memory reference for your team
- **`.claude/rules/example.md`** — starter path-scoped rule (loads only when relevant files are read)
- **CI workflows** — secret scanning (gitleaks), standard CI, `@claude` PR responder, optional rule-adherence PR comments

### Scope: everything — adds
- Domain-specialist agents (frontend, backend, mobile) based on your project shape
- Dev container, plugin wrapper, OTel exporter config, auto-sync CI workflow

---

## Commands

```
aikit                          Interactive wizard
aikit sync                     Re-generate from .aikitrc.json (idempotent)
aikit update                   Pull latest templates, show diff, prompt
aikit diff                     Show drift between current state and fresh generation
aikit add <item>               Add a single skill, command, agent, or hook
aikit list                     Show installed items + catalog availability
aikit doctor                   Sanity-check: schema, triggers, broken links
aikit doctor --rules           🔭 Rule observability — hot/disputed/dead/unmatched buckets
aikit report                   🔭 Markdown or JSON adherence summary (PR-comment ready)
aikit report --format=json     Structured output for CI / dashboards
aikit learn --limit=30         🌱 Mine PR review history; propose new rules
```

Every prompt has a `--flag` equivalent for headless use.

---

## How rule observability works

Three hooks, one log file, one report.

```
┌──────────────────────────────────────────────────────────────────────┐
│                  .aikit/events.jsonl  (local, gitignored)            │
└──────────────▲────────────▲────────────▲────────────────────────────┘
               │            │            │
   ┌───────────┴─────┐  ┌───┴────────┐  ┌┴────────────────────┐
   │ InstructionsLoad│  │ PostToolUse│  │ Stop / SubagentStop │
   │  log-rule-event │  │ check-     │  │ judge-rule-         │
   │                 │  │ pattern-   │  │ compliance          │
   │  scans rule IDs │  │ violations │  │ (opt-in, $0.001/turn│
   │  in loaded files│  │ regex hits │  │  via Claude Haiku)  │
   └─────────────────┘  └────────────┘  └─────────────────────┘
```

**Rule IDs** in your AGENTS.md look like `<!-- id: code-style.no-any emphasis=high paths=src/**/*.ts -->`.
HTML comments cost zero context tokens (Claude strips them) but give the hooks stable IDs to track.

**Privacy stance**: 100% local. `.aikit/events.jsonl` is auto-added to `.gitignore`. No remote upload, no dashboard, no telemetry sent to Anthropic or anyone else. The optional LLM judge calls the Anthropic API only with your explicit `AIKIT_JUDGE=1 ANTHROPIC_API_KEY=...`.

**Honest signaling**: `aikit report` returns `adherence_score: null, basis: "no-evidence"` when you haven't enabled the judge — instead of pretending we have data when we don't. Loaded events alone are not counted as positive evidence.

---

## Update safety — BEGIN/END markers

haac-aikit uses idempotent markers to manage only the content it owns:

```markdown
# My Project

My hand-written project notes — never touched by haac-aikit.

<!-- BEGIN:haac-aikit -->
...managed content...
<!-- END:haac-aikit -->

More of my notes — also never touched.
```

`aikit sync` regenerates only the region between the markers. Everything outside is yours.

---

## Token efficiency

haac-aikit is built on the evidence from four research passes:

- **~100 tokens per skill** at rest (metadata only — body loads only when triggered)
- **≤200 lines** AGENTS.md enforced in CI
- **Zero LLM-generated dumps** — every shipped artifact is human-curated (ETH Zurich 2026 found LLM dumps add cost, don't improve success rate)
- **3 MCP servers by default** — filesystem + memory + fetch only (5 servers = ~77K tokens of tool defs)
- **Rule-ID HTML comments cost zero context** — stripped by Claude before injection
- **Path-scoped rules in `.claude/rules/`** load only when matching files are read

---

## Why haac-aikit vs. the alternatives?

| | haac-aikit | rulesync | ruler | claudekit |
|---|---|---|---|---|
| Content included | ✅ 18 skills + 11 agents + hooks | ❌ Config manager only | ❌ Config manager only | ✅ Claude-only |
| Cross-tool | ✅ 7 tools | ✅ | ✅ | ❌ |
| Open Skills standard | ✅ agentskills.io | ❌ | ❌ | ❌ |
| Config file backed | ✅ `.aikitrc.json` | ❌ | ❌ | ❌ |
| Idempotent markers | ✅ | ❌ | ❌ (`.bak` backups) | ❌ |
| **🔭 Rule observability** | **✅ telemetry + judge + report** | ❌ | ❌ | ❌ |
| **🎨 Dialect translation** | **✅ per-tool emphasis tuning** | ❌ | ❌ | ❌ |
| **🌱 Learn from PR history** | **✅ `aikit learn`** | ❌ | ❌ | ❌ |

---

## Contributing

Issues and PRs welcome at [github.com/Hamad-Center/haac-aikit](https://github.com/Hamad-Center/haac-aikit).

**Looking for 3 beta-tester teams** to use the rule observability loop on real codebases — comment on [issue #1](https://github.com/Hamad-Center/haac-aikit/issues/1) to sign up. Your feedback directly shapes the 1.0 cut.

---

## License & attributions

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for adapted sources.
