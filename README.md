# haac-aikit

**The batteries-included AI-agentic-coding kit.**  
One command drops a complete, opinionated, cross-tool setup into any repo — rules, skills, slash commands, subagents, safety hooks, MCP stub, and CI templates.

Works with: Claude Code · Cursor · GitHub Copilot · Windsurf · Aider · Gemini CLI · OpenAI Codex CLI

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
| `.cursor/rules/000-base.mdc` | Always-on Cursor rule pointing at AGENTS.md |
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
- **CI workflows** — secret scanning (gitleaks), standard CI, `@claude` PR responder

### Scope: everything — adds
- Domain-specialist agents (frontend, backend, mobile) based on your project shape
- Dev container, plugin wrapper, OTel exporter config, auto-sync CI workflow

---

## Commands

```
aikit                     Interactive wizard
aikit sync                Re-generate from .aikitrc.json (idempotent)
aikit update              Pull latest templates, show diff, prompt
aikit diff                Show drift between current state and fresh generation
aikit add <item>          Add a single skill, command, agent, or hook
aikit list                Show installed items + catalog availability
aikit doctor              Sanity-check: schema, triggers, broken links
```

Every prompt has a `--flag` equivalent for headless use.

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

---

## Why haac-aikit vs. the alternatives?

| | haac-aikit | rulesync | ruler | claudekit |
|---|---|---|---|---|
| Content included | ✅ 18 skills + 11 agents + hooks | ❌ Config manager only | ❌ Config manager only | ✅ Claude-only |
| Cross-tool | ✅ 7 tools | ✅ | ✅ | ❌ |
| Open Skills standard | ✅ agentskills.io | ❌ | ❌ | ❌ |
| Config file backed | ✅ `.aikitrc.json` | ❌ | ❌ | ❌ |
| Idempotent markers | ✅ | ❌ | ❌ (`.bak` backups) | ❌ |

---

## License & attributions

MIT. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for adapted sources.
