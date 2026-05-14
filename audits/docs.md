# audits/docs.md

Documentation accuracy across all surfaces.

## Audit checklist

### README.md
- [x] Quick start command works
- [x] HTML skills table matches current state (4 skills, 4 output paths)
- [x] `aikit add --html` documented
- [x] Cross-tool fan-out described correctly
- [x] Command table lists current commands only (no `learn` or `whatsnew`)
- [x] No reference to removed `--scope` / `--preset` flags
- [x] Comparison paragraph honest about haac-aikit's differentiation
- [x] Thariq Shihipar attribution preserved

### docs/index.html (GitHub Pages landing)
- [x] Headline + tagline accurate
- [x] TOC chips match section anchors
- [x] HTML skills table matches reality
- [x] CLI commands table — 9 commands, no removed ones
- [x] Skills chips: 14 tier1 + 11 tier2 (correct after demotions)
- [x] Agents chips: 2 tier1 + 3 tier2 (correct after trim)
- [x] Hooks list: 10 (no format-on-save)
- [x] 3 SVG diagrams — fan-out, cross-tool dialect, observability loop
- [x] Parity matrix shows real capability per tool
- [x] Thariq attribution preserved
- [ ] Manual: open the landing in a browser, verify dark mode, mobile viewport, copy-button

### CHANGELOG.md
- [x] 0.12.0 entry added with Added/Changed/Removed/Migration/Stats
- [x] Stale "aikit whatsnew" reference removed from header
- [x] Migration section walks user through upgrade
- [x] Stats numbers match reality (-33% src, -7% bundle, 144→149 tests)

### AGENTS.md (project dev doc)
- [x] Rewritten to reflect lean 0.12 reality
- [x] Project layout matches new src structure
- [x] Gotchas section preserves load-bearing rules (marker engine, telemetry-hooks-never-block, JSON.dumps, rule ID regex)
- [x] No reference to removed features (whatsnew, learn, notify, scope, shape)

### catalog/rules/AGENTS.md.tmpl (shipped to users)
- [x] Skills section references current 4 HTML skills (docs, decide, directions, roadmap)
- [x] No stale `html-artifacts` skill or `aikit scaffold html` references
- [x] Output paths section lists `docs/{decisions,directions,roadmaps}/`
- [x] No `claude-md-reference.md` link (file removed)

### docs/observability.md / docs/dialects.md / docs/agents.md
- [x] No references to removed features
- [x] Internal docs index updated (`docs/README.md`)

### Per-feature audit files
- [x] AUDIT.md master inventory (this initiative)
- [x] One audit file per surface in `audits/`
- [x] Each audit has actionable checklist, not theatre

## Status

🟢 — comprehensive. The remaining manual check (browser sanity on landing page) is recommended pre-publish.
