# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The CLI surfaces these notes via `aikit whatsnew` (reads `catalog/release-notes.json`) and, when a newer version is on npm, prints a one-line banner once per 24h.

## [0.9.0] - 2026-05-12

### Added
- **`aikit scaffold html [<slug>]`** — new top-level command. Drops one of 20 forked HTML reference templates into the current directory. Supports interactive picker, `--list`, `--name`, `--dry-run`, `--force`. Numeric (`03`) and slug (`pr-review`) identifiers both resolve.
- **`catalog/templates/html-artifacts/`** — vendored 20 HTML templates forked with permission from [github.com/ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness), plus an `index.html` gallery, `MANIFEST.json`, and `README.md` with attribution. Synced to `.aikit/templates/html-artifacts/` on every `aikit sync`.
- **`aikit whatsnew`** — explicit command for release notes; reads `catalog/release-notes.json`. `--all` shows full history.
- **Update-available banner** — runs once per 24h, checks the npm registry, prints a one-line notice if a newer version is available. Skipped in CI, headless, `--help`/`--version`, and when `AIKIT_NO_UPDATE_CHECK=1` is set.
- **`--no-update-check` flag** — opt out of the update banner for the current invocation.

### Changed
- **`html-artifacts` skill — complete v1.1.0 → v2.0.0 rewrite.** 9 patterns aligned with the source's official categories (including the previously misnamed `Custom Editing Interfaces`), new cross-cutting techniques section (15 patterns), new failure-modes section, mandatory template-read protocol with `YOU MUST NOT invent HTML structure from scratch`. 110 → 155 lines.
- **`/html` slash command** — rewritten to invoke the new scaffolding protocol; references the 20 templates and the MANIFEST.
- **`AGENTS.md.tmpl`** — new `## Skills and templates` section inside the marker region propagates skill discovery to all six non-Claude tools via the existing render pipeline.
- **`aikit list`** — gained a `HTML artifact templates` category; surfaces all 20 templates.
- **`aikit sync`** — extended with a `syncTemplates()` pass that copies `catalog/templates/` into `.aikit/templates/`.
- **`.gitignore` policy** — now ignores only `.aikit/artifacts/` (generated content), not the whole `.aikit/` directory. Templates and other reference content in `.aikit/` are now committable.
- **`scripts/catalog-check.js`** — validates `MANIFEST.json` ↔ files round-trip.

### Migration
- After upgrading, run `aikit sync` to pull the new templates into `.aikit/templates/html-artifacts/`.
- If you customized the `html-artifacts` skill in your project, the catalog version has changed substantially — `aikit sync` will flag a conflict; choose `replace` for the new content or `keep` to preserve yours (and accept that templates won't be referenced).
- Templates are now tracked by git in your project — they appear in `git status` after sync.

## [0.7.1] - 2026-04-30

### Fixed
- `husky` integration silently failed: enabling it had no effect because `runSync` lacked a handler. Now correctly writes `.husky/pre-commit`, `.husky/commit-msg`, etc. with the executable bit set.
- `plugin` integration silently failed: enabling it had no effect. Now correctly writes `.claude/plugin/plugin.json` with `projectName` interpolated.
- Hook scripts shipped with the wrong file mode — installed hooks were not executable, so Claude Code could not invoke them. The catalog source now has the executable bit set, and `copyAction` defensively re-applies `0o755` to any `.sh` file or any file under `.claude/hooks/` or `.husky/`.
- `inferTier3Slot` would have matched any path containing `/agents/` or `/skills/`. Now requires the `.claude/` prefix.

### Internal
- `WriteResult.src` is now populated on all `copyAction` return branches (was conflict-only) for consistency with future code that may need the catalog source path.
- `syncDir(...)` now treats an empty `extensions` array as "match all files".

## [0.7.0] - 2026-04-29

### Added
- Interactive conflict resolution: `aikit sync` and `aikit update` now prompt before overwriting locally-modified template files (agents, skills, commands, hooks). Five options: Replace (recommended default), Keep + tier3 (auto-protects future syncs for agents/skills), Show diff, Replace all, Skip all.
- `src/fs/diff.ts` — inline colorized unified diff helper backed by the `diff` package.
- `src/fs/conflict.ts` — `interactivePrompt` (default `ConflictPrompt`) + `inferTier3Slot()` path-to-tier3-slot mapper.
- `docs/conflict-resolution.md` — full walkthrough of the prompt UX and headless behavior.

### Changed
- `copyAction()` in `src/commands/sync.ts` now returns `WriteResult.action === "conflict"` (parity with `safeWrite`) when destination differs from incoming and `--force` is not set.
- `WriteResult` interface gains an optional `src` field carrying the catalog source path for copy-style writes.

### Headless behavior (no change for CI)
- `--force` overwrites all conflicts silently (existing behavior).
- `--yes` (without `--force`) skips conflicts with a warning (existing behavior).
- Non-TTY environments behave like `--yes` — never block.

### Known limitations
- v1 has no per-file hash tracking, so legitimate catalog updates will sometimes trigger conflict prompts even for files you didn't modify. Hash tracking is planned for 0.8.0.
- Commands and hooks have no tier3 protection — "Keep" preserves them for the run only.

## [0.6.0] - 2026-04-29

### Added
- Tiered agent system (`catalog/agents/tier1/`, `catalog/agents/tier2/`) mirroring the existing skills tier layout.
- 8 new agents: `debugger`, `pr-describer` (tier1); `flake-hunter`, `simplifier`, `prompt-engineer`, `evals-author`, `changelog-curator`, `dependency-upgrader` (tier2).
- Wizard step for specialty-agent multi-select; headless defaults follow `scope` (none for minimal/standard, all for everything).
- Optional `agents:` block in `.aikitrc.json` (`tier1`, `tier2`, `tier3`).
- `scripts/catalog-check.js` validation script (the `catalog:check` npm script was previously broken — referenced a missing file).
- `docs/agents.md` reference doc covering tier model, full roster, and configuration.

### Changed
- `researcher` agent downgraded from `claude-sonnet-4-6` to `claude-haiku-4-5` (read-only role).
- `catalog/agents/` is now organised by tier; `catalog-check` rejects `.md` files at the root.
- Default model distribution across the roster: 4 opus / 12 sonnet / 3 haiku.
- `aikit list`, `aikit diff`, and `aikit add` are now tier-aware for agents.

### Fixed
- `aikit diff` was silently broken for agents (reported nothing) due to the now-empty flat `catalog/agents/` directory; replaced with tier-walk.

### Migration
- Existing 0.5.x configs (no `agents:` block) keep all previously-installed agents and additionally pick up the two new tier1 agents (`debugger`, `pr-describer`). No file is removed and no schema change is required.
