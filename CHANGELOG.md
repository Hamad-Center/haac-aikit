# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2026-05-14

A two-axis release: **catalog trim** (sharper kit, less always-on token cost) and **cross-tool parity** (skills, agents, hooks, MCP now fan out to every selected tool in its native format — not just Claude Code). Plus two new HTML skills.

### Added
- **`/directions` skill** (`catalog/skills/tier1/directions.md`) — renders 2-4 visual design variants side by side on a single self-contained HTML page, with a light/dark stage toggle. Output: `docs/directions/<date>-<slug>.html`. Based on the visual exploration pattern in [Thariq Shihipar's HTML effectiveness gallery](https://thariqs.github.io/html-effectiveness/).
- **`/roadmap` skill** (`catalog/skills/tier1/roadmap.md`) — single-page implementation plan: milestones, SVG data-flow diagram, mockups, key code, risk table, open questions. Output: `docs/roadmaps/<date>-<slug>.html`. For hand-off to a human implementer (the AI-executable text plan is `writing-plans`).
- **`aikit add --html`** — single-shot install of the four HTML-artifact skills (`docs`, `decide`, `directions`, `roadmap`) plus their slash commands and templates. 12 files in one command.
- **Cross-tool translators** (`src/render/translators.ts`) — convert catalog skill / agent / hook / MCP content into each selected tool's native loader format. New per-tool installation surface:
  - **Cursor**: `.cursor/rules/skill-<name>.mdc` for each skill (description-triggered auto-load), `.cursor/hooks.json` with 10 wired events (safety with `failClosed: true` + `matcher` regex scoping, plus telemetry parity: `preToolUse`/`postToolUse`/`subagentStart`/`subagentStop`/`preCompact`/`stop`/`afterFileEdit`), `.cursor/mcp.json` for MCP servers.
  - **Windsurf**: `.windsurf/rules/skill-<name>.md` for each skill with `trigger: model_decision`. Built-in 12k-char guard truncates gracefully at paragraph boundaries and appends a pointer to the canonical body.
  - **Copilot**: `.github/instructions/<name>.instructions.md` for skills (`applyTo: '**'`), `.github/agents/<name>.agent.md` for agents (with `user-invocable: true` so `@<agent>` dispatch works).
  - **Codex**: `.codex/agents/<name>.toml` for subagents, `.codex/config.toml` with `[features] codex_hooks = true`, `[agents]` concurrency caps (max_threads / max_depth / job_max_runtime_seconds), and `[mcp_servers.*]` translated from `.mcp.json`.
  - **Gemini**: `.gemini/commands/<name>.toml` for manual `/skill` invocation. HTML skills (`docs`, `decide`, `directions`, `roadmap`) are namespaced under `html/` → invoked as `/html:docs`, `/html:decide`, etc.
  - **Aider**: appended skills index in `CONVENTIONS.md` (no native rule loader; user copies a skill body into chat when its `When to use` clause matches).
- **Codex trust warning** — post-sync info line flags that Codex silently drops `.codex/*` in untrusted projects, so users see the requirement instead of debugging silent failure later.
- **Decision artifact** (`docs/decisions/2026-05-14-pre-publish-cleanup.html`) — dogfoods the `/decide` skill to document the trim choices made for this release.

### Changed
- **`/decide` skill promoted tier2 → tier1** alongside `/docs`, `/directions`, `/roadmap`. All four HTML skills now always-on.
- **Demoted rarely-firing skills tier1 → tier2** (-282 lines always-on context): `api-design`, `software-architect`, `performance-profiling`, `incident-response`. All four were already opt-in by description, so demotion changes only their preload status.
- **Per-tool installation surface reorganized**: previously skills/agents/hooks/commands always wrote to `.claude/` regardless of tool selection. Now each tool block in `sync.ts` is self-contained — pick `--tools=cursor` and get only `.cursor/`, no `.claude/` ballast.
- **`aikit-rules.json` patterns trimmed** — was 4 TypeScript-specific rules; now ships one universal `security.no-hardcoded-secrets` pattern plus one TS example to demonstrate the schema. Less locked into a single language.
- **`AGENTS.md.tmpl` skills + templates section rewritten** to reference the four current HTML skills (`docs`, `decide`, `directions`, `roadmap`) instead of the now-removed `html-artifacts` and `aikit scaffold html` references.
- **README + GitHub Pages landing redesigned** — single-column scannable layout, three SVG diagrams (HTML skills fan-out, cross-tool dialect translation, observability loop), 6 tier1 chip rows for the catalog, plain-English feature descriptions with category tags.

### Removed (breaking — pre-1.0)
- **17 redundant agents.** Tier1 dropped from 13 → 2 (`orchestrator`, `pr-describer`). 8 agents that duplicated skills (debugger/planner/implementer/reviewer/tester/researcher/security-auditor/architect — pick the cross-tool skill, lose the Claude-only agent), 3 niche specialists (data-migration/devops/technical-writer), 6 tier2 (changelog-curator/dependency-upgrader/evals-author/flake-hunter/prompt-engineer/simplifier).
- **6 thin slash-command shims**: `/debug`, `/explore`, `/plan`, `/tdd`, `/execute`, `/review` — each was a 5-15 line file that said "use the X skill." Tier1 skills are already auto-loaded; the shim added zero value.
- **`aikit learn` command** + `src/commands/learn.ts` (298 lines). PR-mining + clustering for rule proposals — substantial machinery for a workflow no real user had validated. Better to add back when someone asks for it.
- **`aikit whatsnew` command** + `src/commands/whatsnew.ts` (96 lines) + `catalog/release-notes.json`. Generic release-notes viewer; GitHub Releases already does this.
- **`src/notify.ts`** (159 lines) — once-per-day npm registry update banner. Niche; no other comparable kit ships one.
- **Scope system** (`minimal` / `standard` / `everything`) — fully removed from `AikitConfig`, wizard, sync logic. Single default install + `aikit add` for extras.
- **Project-shape system** (`web` / `mobile` / `fullstack` / `backend` / `library`) — fully removed. Shape-derived agent install (`SHAPE_AGENTS` map) deleted; agent selection now goes through `agents.tier2` explicit list or `"all"`.
- **Integration values dropped**: `devcontainer`, `husky`, `plugin`, `otel`. The corresponding `catalog/devcontainer/`, `catalog/husky/`, `catalog/plugin/` directories are gone. Generic CI workflows (`ci.yml`, `secret-scan.yml`) removed; AI-aligned workflows (`claude.yml` `@claude` responder, `aikit-rules.yml`, `agents-md-sync.yml`) retained.
- **`claude-md-improver` skill** — Claude-specific in a cross-tool kit. Out of scope.
- **`docs/claude-md-reference.md`** + `catalog/docs/claude-md-reference.md` + `claudeMdReference()` catalog getter — Claude-specific Anthropic 2026 reference doc. Better hosted upstream than bundled.
- **`format-on-save.sh` hook** — generic dev tooling, not AI-specific.
- **`docs/learn.md`** — companion doc for the removed `aikit learn` command.
- **`shape-agents.ts`** + its test.

### Migration
1. **Upgrade**: `npm install -g haac-aikit@0.12.0` (or `npx haac-aikit@0.12.0`).
2. **Re-run the wizard**: `npx haac-aikit` — your existing `.aikitrc.json` will fail schema validation because `scope`, `shape`, and the four removed `integrations` keys are gone. Re-running writes a fresh config in the new shape.
3. **Clean stale outputs**: if your project has `.devcontainer/`, `.husky/`, `.claude/plugin/` directories from previous installs and you don't use them outside of haac-aikit, remove them manually — they're orphaned.
4. **Pick your tools**: each selected tool now gets its own native files, not a shared `.claude/`. `--tools=cursor` → 37 files in `.cursor/`. `--tools=codex` → 6 files in `.codex/`. `--tools=claude,cursor,codex` → all three surfaces installed.
5. **Slash commands that disappeared**: if you previously used `/debug`, `/explore`, `/plan`, `/tdd`, `/execute`, `/review` — the underlying skills (`systematic-debugging`, `codebase-exploration`, `writing-plans`, `test-driven-development`, `executing-plans`, `requesting-code-review`) are still tier1 and auto-trigger from prompts. The shim wasn't carrying weight.

### Stats
- Source: **4,182 → 2,802 lines** (-33%)
- CLI bundle: **160 KB → 148 KB** (-7%)
- Tier1 skills: 18 → 14
- Tier1 agents: 13 → 2
- Catalog files: ~120 → ~80
- Tests: 168 → 144 (24 deleted for cut features; **14 new translator tests**)
- All quality gates green: typecheck, catalog-check, **144/144 tests**, build, smoke test

## [0.11.1] - 2026-05-13

### Docs
- Rewrote the GitHub Pages landing (`docs/index.html`): new hero ("Docs that update themselves."), without/with comparison block (✗ pains vs ✓ outcomes), Thariq Shihipar's article elevated from footnote to a clay-bordered pull-quote attribution.
- Trimmed `README.md` from 114 → 66 lines: pulled `/docs` and `/decide` to the top as the headline feature with the article credit inline, removed the duplicate "what makes it different" prose section in favor of the comparison table, merged Status/Contributing/License into one footer block.

### Notes
- Same code surface as 0.11.0 — pure docs patch. The tag for 0.11.0 ended up one commit behind the latest README rewrite at publish time; 0.11.1 fixes that alignment so `git checkout v0.11.1` shows the same docs that ship in the tarball.

## [0.11.0] - 2026-05-13

### Breaking
- **`/html` skill removed.** Replaced by two focused skills: `/docs` (always-on, tier1) for living project documentation and `/decide` (opt-in, tier2) for one-page decision artifacts. Diagnosis: the old skill was 205 lines of always-on context with 9 patterns and 20 templates, and the dual scaffolding paths (agent + CLI) plus the dedicated init scope were infrastructure-for-a-feature. Two skills with one job each replaces 20 templates doing 20 jobs at 60%.
- **`aikit init html` scope removed.** The `Scope` type loses the `html` variant; pass `--scope minimal | standard | everything`.
- **`aikit scaffold html` command removed.** No replacement — the `/docs` and `/decide` skills read their templates directly from `.aikit/templates/`.
- **`docs/aikit-html-design-system.html` no longer synced.** The new `/docs` and `/decide` templates inline their own design tokens, so the standalone reference file is gone. If you customized it, copy the tokens into your project before running `aikit sync`.

### Added
- **`/docs` skill (`catalog/skills/tier1/docs.md`, ~80 lines)** + **`/docs` slash command** — maintains an HTML documentation tree at `docs/`: many small per-area files plus a rolled-up `docs/index.html`. Reads/writes single sections through marker-bounded `<!-- BEGIN:haac-aikit:section:<id> -->` blocks so updates stay surgical and cheap.
- **`/decide` skill (`catalog/skills/tier2/decide.md`, ~50 lines)** + **`/decide` slash command** — generates a single rich HTML page comparing 2-4 options when the user is about to make a decision. Each invocation writes a new dated file under `docs/decisions/`. Opt-in (tier2) so it doesn't load on every agent turn.
- **`catalog/templates/docs/starter.html`** — minimal starter scaffold for `/docs` with design tokens, landmark roles, a11y baseline, and one example sectioned block to copy.
- **`catalog/templates/decide/template.html`** — single rich tradeoff template for `/decide`: option cards, pros/cons grid, side-by-side comparison, plain-language technical block, recommendation callout.
- **Marker engine: named-section helpers.** `src/render/markers.ts` now exports `readSection`, `writeSection`, `appendSection`, `hasSection` for `<!-- BEGIN:haac-aikit:section:<id> -->` blocks. Round-trip tested in `test/markers-section.test.ts` (19 cases). The existing `BEGIN:haac-aikit` block is untouched and still load-bearing.

### Migration
- Run `aikit sync` to pull the new `/docs` and `/decide` templates into `.aikit/templates/`.
- The old `aikit-html-design-system.html` and `.aikit/templates/html-artifacts/` will be flagged as orphaned — delete them manually if you don't have local edits worth keeping.
- `aikit init html` callers should switch to `aikit init --scope minimal --yes` and add `/docs` from the catalog explicitly via `aikit add` (or accept the standard scope which includes it).

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
