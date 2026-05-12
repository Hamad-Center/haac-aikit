Produce an HTML artifact for the current context using the `html-artifacts` skill and the forked reference templates.

## Usage
`/html [optional intent]`

## Steps

1. **Determine intent**
   - With args (e.g. `/html code review of today's PR`): use the args as the intent.
   - Without args: infer from the current conversation — what task is in progress, what was just discussed, what files are open.

2. **Pick the pattern**
   Match the intent to one of the **9 patterns** in `.claude/skills/html-artifacts.md`:
   - Exploration & Planning (code approaches · visual directions · implementation plans)
   - Code Review & Understanding (PR review · PR writeup · module map)
   - Design (design system · component variants)
   - Prototyping (animation · interaction)
   - Illustrations & Diagrams (SVG figures · flowcharts)
   - Decks (slide presentations)
   - Research & Learning (feature explainer · concept explainer)
   - Reports (status · incident)
   - Custom Editing Interfaces (triage board · feature flags · prompt tuner)

3. **Look up the template**
   Read `.aikit/templates/html-artifacts/MANIFEST.json`. Find the entry whose `category` matches the pattern from step 2 and whose `slug` matches the intent best (e.g. for a PR review intent → slug `pr-review`).

4. **Read the template**
   Use the Read tool on `.aikit/templates/html-artifacts/<file>.html` for that entry. This is the structural ground truth — copy its CSS variables, class names, layout grids, and visual conventions **verbatim**.

5. **Gather project context**
   Pull real facts the artifact needs to display:
   - For Code Review: `git diff main...HEAD`, file list with classifications
   - For Reports: `git log --since=...`, deploy logs, incident notes
   - For Design System: read `docs/aikit-html-design-system.html` if it exists, else use the tokens from the template
   - For Research/Explainer: read the source files the explainer covers
   - For Implementation Plan: milestones, packages affected, risky code

6. **Produce the filled artifact**
   Write a new HTML file that mirrors the template's structure but with the gathered context replacing the placeholder content. Preserve:
   - All CSS `:root` design tokens
   - All class names and layout grids
   - All cross-cutting techniques (sticky toolbars, scroll-margin-top, microinteractions, `<details>` collapsibles)
   - The visual language: severity colors, badge styles, dot indicators, monospace meta text
   Required in `<head>`:
   - `<title>` and `<meta name="description">`
   - `<meta name="aikit-pattern" content="...">` — exactly one of: `Exploration`, `Code Review`, `Design`, `Prototype`, `Illustrations`, `Deck`, `Research`, `Report`, `Editor`
   Add an `AUTO-GENERATED` pill top-right and a provenance footer (`Sources: ... — generated <ISO timestamp>`).

7. **Save with sequential numbering**
   - Slug from intent: e.g. `code-review-auth-pr`, `weekly-status-mar-10`
   - Determine `NN` by listing `.aikit/artifacts/*.html` (excluding `index.html`) and incrementing the highest number; start at `01`
   - Save to `.aikit/artifacts/NN-<slug>.html`

8. **Regenerate the gallery index**
   Rebuild `.aikit/artifacts/index.html` from scratch per the "Gallery index protocol" in the skill. List all artifacts, group by `<meta name="aikit-pattern">`, drop empty groups.

9. **Report**
   Print both paths and suggest: `open .aikit/artifacts/index.html` (macOS) / `xdg-open .aikit/artifacts/index.html` (Linux).

## Fallback
If `.aikit/templates/html-artifacts/` does not exist (e.g. project synced before this kit version), run `aikit sync` first, or use the user-driven path: `aikit scaffold html <slug>` to drop a starter, then ask the agent to fill it.
