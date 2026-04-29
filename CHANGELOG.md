# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
