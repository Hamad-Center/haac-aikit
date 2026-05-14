# haac-aikit production-readiness audit

Master checklist for the 0.12.0 release. One checkbox per shipped surface. Each item links to a focused audit file in [`audits/`](audits/) with detailed findings + fix tasks.

**Status legend:**
- 🟢 `[x]` — verified against official docs, tests cover it, no known issues
- 🟡 `[~]` — works but has known limitations or open polish items
- 🔴 `[ ]` — has open blocker(s); audit file lists what to fix
- ⚪ `[?]` — not yet audited

Last audited: **2026-05-14** (audit pass complete, 5 blockers fixed).

---

## 1. HTML skills (the headline feature)

- [x] [`/docs` skill + template](audits/html-skills.md) 🟢
- [x] [`/decide` skill + template](audits/html-skills.md) 🟢
- [x] [`/directions` skill + template](audits/html-skills.md) 🟢
- [x] [`/roadmap` skill + template](audits/html-skills.md) 🟢
- [x] [`aikit add --html` bundle](audits/html-skills.md) 🟢

## 2. Cross-tool translators

- [x] [Claude Code surface](audits/claude.md) 🟢
- [x] [Cursor surface](audits/cursor.md) 🟢 — `matcher` field removed (was wrong shape), backslash-escape added
- [x] [Windsurf surface](audits/windsurf.md) 🟢
- [x] [GitHub Copilot surface](audits/copilot.md) 🟢 — `user-invocable` removed (was a skill field), `.vscode/mcp.json` now wired
- [x] [OpenAI Codex CLI surface](audits/codex.md) 🟢 — TOML literal strings (no escape pitfalls), trust-gate warning
- [x] [Gemini CLI surface](audits/gemini.md) 🟢 — TOML literal strings, `.gemini/settings.json` wired
- [x] [Aider surface](audits/aider.md) 🟡 — Aider lacks native loader; appended skills index is the best we can do

## 3. CLI + core engine

- [x] [CLI commands (`aikit init/sync/update/diff/add/list/doctor/report`)](audits/cli.md) 🟢
- [x] [Marker engine + dialect translation](audits/marker-engine.md) 🟢
- [x] [Observability loop (telemetry hooks, doctor, report)](audits/observability.md) 🟢
- [x] [Config schema (.aikitrc.json) + wizard](audits/config-wizard.md) 🟢 — unknown-keys warning + strip-on-write

## 4. Catalog content quality

- [x] [Skills catalog (14 tier1 + 11 tier2)](audits/catalog-skills.md) 🟢
- [x] [Agents catalog (2 tier1 + 3 tier2)](audits/catalog-agents.md) 🟢
- [x] [Hooks catalog (10 safety + telemetry hooks)](audits/catalog-hooks.md) 🟢
- [x] [Templates catalog (4 HTML templates)](audits/catalog-templates.md) 🟢

## 5. Build, tests, docs

- [~] [Build pipeline (tsup + package.json + npm publish)](audits/build-publish.md) 🟡 — manual `npm pack --dry-run` recommended pre-publish
- [x] [Test coverage + quality](audits/tests.md) 🟢 — 154 tests, all passing
- [x] [Documentation accuracy (README, landing, AGENTS.md, CHANGELOG)](audits/docs.md) 🟢

## 6. Cross-cutting concerns

- [x] [Security review (input validation, path traversal, escaping)](audits/security.md) 🟢 — path-traversal guard + backslash escapes
- [~] [Cross-platform correctness (Windows, line endings, exec bits)](audits/cross-platform.md) 🟡 — Unix/macOS green; Windows needs WSL (documented)
- [x] [Breaking-change migration (0.11 → 0.12)](audits/migration.md) 🟢 — readConfig warns + writeConfig strips stale keys

---

## Verification gates — final status

- [x] `npm run typecheck` — clean
- [x] `npm test` — **154/154 pass**
- [x] `npm run catalog:check` — clean
- [x] `npm run build` — succeeds (148 KB bundle)
- [x] Smoke test: `--tools=claude` install — works
- [x] Smoke test: `--tools=cursor,codex,gemini` install — works (no `.claude/` ballast; full native-format output per tool)
- [x] `npm pack --dry-run` reviewed (73 files, 171 KB, no secrets)
- [x] All 4 HTML templates verified — structural parse clean, CSS balanced, a11y baseline met, dark mode added

## Fixes applied in this audit pass

1. ✅ **Cursor `matcher` field removed** (was wrong shape per Cursor docs; scripts self-filter instead)
2. ✅ **Path traversal guard** in `aikit add <name>` (regex-validates name before filesystem joins)
3. ✅ **TOML literal strings** for Codex `developer_instructions` + Gemini `prompt` (no escape pitfalls on backslashes)
4. ✅ **Copilot `user-invocable: true` removed** from agent files (was a skill field, not an agent field)
5. ✅ **Unknown-keys warning in `readConfig`** (graceful 0.11→0.12 migration; stripped on write)
6. ✅ **Cursor MDC backslash escape** added to descriptions
7. ✅ **`.vscode/mcp.json` for Copilot** + **`.gemini/settings.json` for Gemini** — MCP fan-out now complete across 5 tools (Claude, Cursor, Copilot, Codex, Gemini)
