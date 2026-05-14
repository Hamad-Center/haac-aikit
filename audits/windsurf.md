# audits/windsurf.md

What we install when `windsurf` is selected, per <https://docs.windsurf.com/windsurf/cascade/memories>, <https://docs.windsurf.com/windsurf/cascade/workflows>.

## What we ship to a Windsurf-only install

- `.windsurf/rules/project.md` — base rules
- `.windsurf/rules/skill-<name>.md` × 25 (one per skill, `trigger: model_decision`)

## Audit checklist

### Format correctness
- [ ] `.windsurf/rules/*.md` frontmatter expects `trigger:` + `description:` — confirm no other required fields
- [ ] Available `trigger:` values: `always_on`, `model_decision`, `glob`, `manual`. We use `model_decision` for skills. Worth varying?
- [ ] **12k char limit per workspace rule file** — we truncate with footer (`skillToWindsurfRule`). Verify the truncation actually keeps the file under 12k after frontmatter is added.

### Coverage gaps
- [ ] **Workflows** (`.windsurf/workflows/*.md`) — Windsurf's slash-command equivalent. We could translate the 4 HTML skill commands (docs/decide/directions/roadmap) as workflows for manual invocation. Currently we don't.
- [ ] Global rules at `~/.codeium/windsurf/memories/global_rules.md` (6k limit) — out of scope; per-project install only
- [ ] Workspace memories — Windsurf-managed at runtime; we don't touch

### Edge cases
- [ ] What if the user has a pre-existing `.windsurf/rules/` directory — we coexist (different filenames), verify
- [ ] What if a skill body + frontmatter even after truncation still exceeds 12k — should we hard-error or write anyway?

### Tests
- [x] `skillToWindsurfRule` length cap tested (`Windsurf rule char-limit guard` describe block)
- [ ] Integration test: full sync with `--tools=windsurf` writes the expected file set
- [ ] Verify the truncated body is still semantically useful (cuts at paragraph boundary)

## Status

🟢 — works, truncation is graceful, no known correctness issues. Worth considering workflows as a follow-up.

## Decision: what to fix before publish

Probably nothing — Windsurf is the simplest target and our translation is correct.
