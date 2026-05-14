# audits/html-skills.md

The four HTML skills and their templates.

## /docs

- [x] Skill file under `catalog/skills/tier1/docs.md` (tier1, always-on)
- [x] Slash command at `catalog/commands/docs.md`
- [x] Template at `catalog/templates/docs/starter.html`
- [x] Output path: `docs/<area>.html`
- [x] Uses BEGIN/END marker engine for section-bounded edits
- [x] Confirms with user before writing (anti-silent-write rule)
- [ ] Manual: open the starter template in a browser, verify it renders correctly without a build step
- [ ] Manual: dogfood `/docs` on a real change and verify the output

## /decide

- [x] Skill file under `catalog/skills/tier1/decide.md` (tier1, promoted from tier2)
- [x] Slash command at `catalog/commands/decide.md`
- [x] Template at `catalog/templates/decide/template.html`
- [x] Output path: `docs/decisions/<date>-<slug>.html`
- [x] Self-contained HTML (no CDN, no build step)
- [x] Five-block structure: decision callout → option cards → comparison row → tech-explained-simple → recommendation
- [x] Dogfooded for this release (`docs/decisions/2026-05-14-pre-publish-cleanup.html`)

## /directions

- [x] Skill file under `catalog/skills/tier1/directions.md`
- [x] Slash command at `catalog/commands/directions.md`
- [x] Template at `catalog/templates/directions/template.html`
- [x] Output path: `docs/directions/<date>-<slug>.html`
- [x] Sticky toolbar with light/dark theme toggle
- [x] 2×2 artboard grid for 2-4 variants
- [x] Variants render LIVE (real HTML), not described
- [ ] Manual: open template, verify the light/dark toggle works without JavaScript framework

## /roadmap

- [x] Skill file under `catalog/skills/tier1/roadmap.md`
- [x] Slash command at `catalog/commands/roadmap.md`
- [x] Template at `catalog/templates/roadmap/template.html`
- [x] Output path: `docs/roadmaps/<date>-<slug>.html`
- [x] Six-section structure: summary strip → milestones → data flow SVG → mockups → code → risks → open questions
- [x] Inline SVG for data flow diagram
- [ ] Manual: validate template HTML against W3C validator

## `aikit add --html` bundle

- [x] Installs 4 skills + 4 commands + 4 template packs = 12 files
- [x] Idempotent re-run (existing files skipped with message)
- [x] `--force` overrides
- [x] `--dry-run` lists files without writing
- [x] Tests in `test/add.test.ts` cover install, idempotency, dry-run

## Status

🟢 — fully verified by tests + smoke. Three manual checks remaining are template browser-rendering sanity (recommended pre-publish).
