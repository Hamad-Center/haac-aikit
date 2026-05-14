# haac-aikit

Batteries-included AI-coding kit. A CLI that drops an opinionated, cross-tool setup (AGENTS.md, rules, skills, subagents, hooks, MCP, CI templates) into any repo in under 30 seconds. Supports Claude Code, Cursor, GitHub Copilot, Windsurf, Aider, Gemini CLI, and OpenAI Codex.

This repo dogfoods its own conventions: `AGENTS.md` is the single source of truth, and per-tool files (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, etc.) are thin shims that import it.

## Setup
- Node.js 20+
- `npm install`

## Commands
- Build:         `npm run build`         (tsup, ESM bundle to `dist/`)
- Dev:           `npm run dev`           (tsup watch)
- Test:          `npm test`              (vitest run, one-shot)
- Test (watch):  `npm run test:watch`
- Typecheck:     `npm run typecheck`     (`tsc --noEmit`)
- Lint:          `npm run lint`          (`eslint src --ext .ts`)
- Catalog check: `npm run catalog:check` (validates shipped templates)

Run a single test: `npx vitest run test/path.test.ts -t "name"`.

## Project layout
- `src/cli.ts`           — entry point; routes the 8 commands (`init`, `sync`, `update`, `diff`, `add`, `list`, `doctor`, `report`)
- `src/commands/`        — one file per command; loaded via dynamic `import()`
- `src/render/`          — BEGIN/END marker engine (4 dialects: markdown, JSON, YAML, shell). Also exports named-section helpers (`readSection`, `writeSection`, `appendSection`) used by the `/docs` skill.
- `src/render/dialects/` — per-tool translators (Cursor MDC today; more queued)
- `src/catalog/`         — runtime loader for `catalog/` templates; exports `CATALOG_ROOT` resolved via walk-up search
- `src/detect/`          — git/CI state detection (guards destructive writes)
- `src/fs/`              — atomic file I/O, gitignore management, config read/write
- `src/types.ts`         — `AikitConfig`, `Tool`, `Integration`, `CliArgs`
- `src/wizard.ts`        — `@clack/prompts` interactive setup
- `catalog/rules/`       — `AGENTS.md.tmpl`, per-tool shims, `aikit-rules.json` (pattern config), `claude-rules/example.md`
- `catalog/hooks/`       — bash hooks: safety (block-*) + telemetry (log-rule-event, check-pattern-violations, judge-rule-compliance)
- `catalog/skills/`      — tier1 (always-on) and tier2 (opt-in) skills
- `catalog/agents/`      — tier1 (`orchestrator`, `pr-describer`) and tier2 (shape-specialty agents)
- `catalog/commands/`    — slash commands (one per HTML skill + commit / commit-push-pr / security-review / ship)
- `catalog/templates/`   — HTML templates: `docs/`, `decide/`, `directions/`, `roadmap/`
- `catalog/{ci,mcp,settings}/` — CI workflows, MCP stub, settings
- `test/`                — vitest specs (co-located by feature)
- `docs/`                — project-internal docs and the GitHub Pages landing
- `scripts/`             — repo tooling (`catalog-check.js`)

## Code style
- **Named exports only** — no `export default`.
- **Strict TypeScript** — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Target ES2022.
- **No `any`** — use `unknown` + type guards.
- **No `// @ts-ignore`** without an inline comment explaining why.
- **Async/await throughout** — no `.then()` chains.
- **No `console.log`** for debugging — remove before commit.
- **Business logic in `src/render/`, `src/fs/`, `src/detect/`** — not in command handlers, which should orchestrate only.
- **Don't add new deps** without checking existing ones first (`@clack/prompts`, `kleur`, `mri` cover most needs).

## Testing
- Framework: **vitest**. Specs live under `test/`, mirroring `src/` layout.
- `npm test` is the canonical CI command (one-shot run).
- For TUI/wizard logic, prefer pure-function extraction over snapshotting `@clack/prompts` output.
- Marker engine changes MUST add round-trip tests (write → read → re-write produces identical output).

## Commit & PR conventions
- Conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- PR title under 70 characters; body has Summary + Test Plan.
- Never force-push to `main`.
- Branch naming: `type/short-description`.

## Security
Never read, write, or commit:
- `.env*`, `secrets/`, `.ssh/`, `.aws/`, `*.pem`, `id_rsa*`

The CLI itself writes only inside the target repo and respects `--dry-run` / `--yes` semantics. Do not bypass the dirty-tree / git-repo guards in `src/detect/` without explicit user opt-in.

## Gotchas
- **IMPORTANT — BEGIN/END markers are load-bearing.** `src/render/markers.ts` only rewrites content between `<!-- BEGIN:haac-aikit -->` and `<!-- END:haac-aikit -->`. **YOU MUST NOT** edit, rename, or remove these markers in templates — doing so silently breaks idempotent `sync` and clobbers user content on the next run.
- **IMPORTANT — Catalog path resolution.** `src/catalog/index.ts` resolves `catalog/` via `import.meta.url` + a walk-up search. The relative path MUST work from both `src/` (dev) and `dist/` (bundled).
- **IMPORTANT — Dynamic command imports use `.js`, not `.ts`.** `await import("./commands/${cmd}.js")` — required for ESM resolution after bundling.
- **Marker dialect is file-extension driven.** `.md` → `<!-- ... -->`, `.yml`/`.yaml` → `# `, `.json` → `// `, shell → `# `. Adding a new file type requires updating `markers.ts` AND a round-trip test.
- **`init` short-circuits to `sync`.** If `.aikitrc.json` already exists, `init` delegates to `sync`.
- **Dirty-tree / git-repo guards.** `src/detect/` blocks writes when the tree is dirty or running in CI. `--yes` / `--force` bypass; `--dry-run` previews.
- **AGENTS.md ≤200 lines.** Anthropic best-practice limit. Push verbose docs into `docs/` or `catalog/skills/`.
- **Headless mode.** `--yes` + non-interactive stdin treats `init` as the default command.
- **Tier system.** Skills AND agents are tiered: `tier1` (always-on), `tier2` (opt-in), `tier3` (user-authored, sync-skipped). Every always-on item is paid context for every user.
- **Telemetry hooks must never block the parent tool call.** `log-rule-event.sh`, `check-pattern-violations.sh`, and `judge-rule-compliance.sh` always echo `{"decision":"approve"}` and exit 0, even on internal errors.
- **Rule IDs follow `topic.slug` format.** Regex `[a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+`. Required: starts with a letter, contains at least one dot.
- **`adherence_score` may be `null`.** `aikit report` returns `null` with `basis: "no-evidence"` when no `cited` events exist.
- **JSON output from hooks goes through `json.dumps`** — `printf` interpolation of arbitrary file paths produces invalid JSONL when paths contain `"` or `\`.

## When compacting
Always preserve: the full list of files modified this session, any failing test names + error messages, and the current task.

## Further reading
- `docs/README.md` — index of project-internal docs.
- `docs/observability.md` — deep dive on the rule observability loop.
- `docs/dialects.md` — dialect translation system.
- `.claude/rules/markers.md` — path-scoped rule for the marker engine (loads only when editing `src/render/**` or `catalog/**.tmpl`).
