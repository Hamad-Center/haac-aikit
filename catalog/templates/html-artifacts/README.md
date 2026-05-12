# html-artifacts templates

Twenty self-contained HTML reference templates that demonstrate the patterns from the [`html-artifacts` skill](../../skills/tier1/html-artifacts.md). Each template is a complete, working HTML file with inline CSS and JS — no build step, no external dependencies.

## What this is for

These templates are **starting points**, not finished documents. The aikit workflow:

1. **Pick a template** that matches the pattern of work you're doing (PR review, status report, design-system reference, etc.).
2. **Scaffold it into your project** via `aikit scaffold html <slug>` (CLI) or by asking your agent to read the template directly.
3. **Let the agent fill it with project context** — real git diffs, real file paths, real metrics — while preserving the visual structure (severity badges, risk maps, timeline dots, etc.).
4. **Save the filled artifact** to `.aikit/artifacts/NN-<slug>.html`; the gallery index regenerates automatically.

## Attribution & license

Templates forked with permission from [github.com/ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness) on **2026-05-12**. Created by [Thariq Shihipar](https://github.com/ThariqS); see [thariqs.github.io/html-effectiveness](https://thariqs.github.io/html-effectiveness/) for the rendered originals.

Adapted for cross-tool agent scaffolding under haac-aikit's MIT license. The pattern taxonomy and technique inventory in `catalog/skills/tier1/html-artifacts.md` are derived from the same source.

## The 20 templates

Grouped by the source's nine categories. See [`MANIFEST.json`](./MANIFEST.json) for the machine-readable index.

### Exploration & Planning
- `01-exploration-code-approaches.html` — side-by-side comparison of N solutions with trade-offs
- `02-exploration-visual-designs.html` — multiple layout/palette directions rendered live
- `16-implementation-plan.html` — milestones, data flow, mockups, key code, risk table

### Code Review & Understanding
- `03-code-review-pr.html` — annotated diff with margin notes, severity tags
- `17-pr-writeup.html` — author's writeup: motivation, before/after, file-by-file tour
- `04-code-understanding.html` — module map with boxes/arrows, hot path highlighted

### Design
- `05-design-system.html` — color / type / spacing tokens as live, copyable swatches
- `06-component-variants.html` — every size/state/intent of one component on a single sheet

### Prototyping
- `07-prototype-animation.html` — animation sandbox with easing presets, keyframe timeline
- `08-prototype-interaction.html` — clickable flow with design notes inline

### Illustrations & Diagrams
- `10-svg-illustrations.html` — inline SVG figures with download-each-as-standalone buttons
- `13-flowchart-diagram.html` — interactive flowchart with click-to-detail sidebar

### Decks
- `09-slide-deck.html` — full-screen slides with scroll-snap, invert variants, decision cards

### Research & Learning
- `14-research-feature-explainer.html` — TL;DR + collapsible steps + tabbed snippets + FAQ
- `15-research-concept-explainer.html` — live interactive widget + comparison table + hover-linked glossary

### Reports
- `11-status-report.html` — 4-card metric band, shipped table, velocity chart, carryover
- `12-incident-report.html` — sev/status pills, dark TL;DR, timeline, root cause, action items

### Custom Editing Interfaces
- `18-editor-triage-board.html` — drag-and-drop kanban with copy-as-markdown export
- `19-editor-feature-flags.html` — toggles with dependency warnings, copy-diff button
- `20-editor-prompt-tuner.html` — editable template + live preview of sample inputs

## Fill-from-context model

These templates intentionally ship **pristine** (matching upstream). There's no placeholder syntax, no template engine. The agent reads a template's structure and produces a new artifact in that style, populated with the current project's facts.

For example, when an agent is asked to "produce a PR review for this branch":

1. Read `.aikit/templates/html-artifacts/03-code-review-pr.html` for the structural reference.
2. Run `git diff main...HEAD` to get the actual diff.
3. Classify each file's risk (`safe` / `worth a look` / `needs attention`).
4. Emit a new HTML file matching the template's visual structure but populated with real file names, real diff hunks, and real review observations.

The skill at [`catalog/skills/tier1/html-artifacts.md`](../../skills/tier1/html-artifacts.md) documents the full set of patterns and the techniques to preserve.

## Updating from upstream

If the source repo gains new templates or updates existing ones, re-run the fork:

```sh
# from repo root
cd catalog/templates/html-artifacts
curl -sSL https://thariqs.github.io/html-effectiveness/index.html -o index.html
# ...repeat for each NN-*.html file
# then update MANIFEST.json to reflect any new entries
npm run catalog:check
```

Record the new fetch date and upstream commit (if available) in `MANIFEST.json`'s `source.fetchedAt` field.
