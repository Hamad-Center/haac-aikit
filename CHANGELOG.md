# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
