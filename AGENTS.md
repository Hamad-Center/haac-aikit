# haac-aikit

<!-- BEGIN:haac-aikit -->
Batteries-included AI-agentic-coding kit. A CLI that drops an opinionated, cross-tool setup (AGENTS.md, rules, skills, subagents, hooks, MCP, CI templates) into any repo in under 30 seconds. Supports Claude Code, Cursor, GitHub Copilot, Windsurf, Aider, Gemini CLI, and OpenAI Codex.

This repo dogfoods its own conventions: `AGENTS.md` is the single source of truth, and per-tool files (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, etc.) are thin shims that import it.

## Setup
- Node.js 20+
- `npm install`

## Commands
- Build:        `npm run build`        (tsup, ESM bundle to `dist/`)
- Dev:          `npm run dev`          (tsup watch)
- Test:         `npm test`             (vitest run, one-shot)
- Test (watch): `npm run test:watch`
- Typecheck:    `npm run typecheck`    (`tsc --noEmit`)
- Lint:         `npm run lint`         (`eslint src --ext .ts`)
- Catalog check:`npm run catalog:check`(validates shipped templates)

Run a single test: `npx vitest run test/path.test.ts -t "name"`.

## Project layout
- `src/cli.ts`       — entry point; routes 7 commands (`init`, `sync`, `update`, `diff`, `add`, `list`, `doctor`)
- `src/commands/`    — one file per command; loaded via dynamic `import()`
- `src/render/`      — BEGIN/END marker engine (4 dialects: markdown, JSON, YAML, shell)
- `src/catalog/`     — runtime loader for `catalog/` templates
- `src/detect/`      — git/CI state detection (guards destructive writes)
- `src/fs/`          — atomic file I/O, gitignore management, config read/write
- `src/types.ts`     — `AikitConfig`, `Tool`, `Scope`, `Integration`, `ProjectShape`
- `src/wizard.ts`    — `@clack/prompts` interactive setup
- `catalog/`         — shipped templates (rules, skills, agents, hooks, ci, mcp, settings)
- `test/`            — vitest specs (co-located by feature)
- `scripts/`         — repo tooling (`catalog-check.js`, etc.)

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
<!-- High-signal section. Things the agent repeatedly gets wrong in this codebase. HTML comments here are stripped before injection — see docs/claude-md-reference.md §3. -->

- **IMPORTANT — BEGIN/END markers are load-bearing.** `src/render/markers.ts` only rewrites content between `<!-- BEGIN:haac-aikit -->` and `<!-- END:haac-aikit -->`. **YOU MUST NOT** edit, rename, or remove these markers in templates — doing so silently breaks idempotent `sync` and clobbers user content on the next run. Path-scoped detail in `.claude/rules/markers.md`.
- **IMPORTANT — Catalog path resolution.** `src/catalog/loader` resolves `catalog/` via `import.meta.url` + `fileURLToPath`. After `tsup` bundling the anchor moves from `src/` → `dist/`. The relative path **MUST** work from both locations. Don't hardcode `__dirname`-style assumptions.
- **IMPORTANT — Dynamic command imports use `.js`, not `.ts`.** `await import("./commands/${cmd}.js")` — required for ESM resolution after bundling. `.ts` works in dev but breaks the published bundle.
- **Marker dialect is file-extension driven.** `.md` → `<!-- ... -->`, `.yml`/`.yaml` → `# `, `.json` → `// `, shell → `# `. Adding a new file type requires updating `markers.ts` AND a round-trip test.
- **`init` short-circuits to `sync`.** If `.aikitrc.json` already exists, `init` delegates to `sync`. Test both fresh-install and re-run paths when changing init flow.
- **Dirty-tree / git-repo guards.** `src/detect/` blocks writes when the tree is dirty or running in CI. `--yes` / `--force` bypass; `--dry-run` previews. Don't remove these guards casually — they're the safety net for the whole CLI.
- **AGENTS.md ≤200 lines.** Anthropic best-practice limit (and a self-imposed catalog rule). Push verbose docs into `docs/` or `catalog/skills/`.
- **Headless mode.** `--yes` + non-interactive stdin treats `init` as the default command. Tests covering CI invocation must exercise this path.
- **Tier system.** Skills are tiered: `tier1` (always-on), `tier2` (opt-in), `tier3` (custom). Don't promote tier2 → tier1 without considering token cost — every always-on skill is paid context for every user.

## When compacting
Always preserve: the full list of files modified this session, any failing test names + error messages, and the current task. (Anthropic guidance: nested CLAUDE.md files don't re-inject after `/compact` — only this root file does.)

## Further reading
- `docs/claude-md-reference.md` — full 2026 reference for CLAUDE.md/memory features and the rationale for this repo's setup.
- `.claude/rules/markers.md` — path-scoped rule for the marker engine (loads only when editing `src/render/**` or `catalog/**.tmpl`).
<!-- END:haac-aikit -->
