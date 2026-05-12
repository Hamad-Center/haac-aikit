---
name: html-artifacts
description: Use when producing structured output that benefits from rich layout, comparison, drill-in, or interaction — specs, plans, PR reviews, design systems, prototypes, diagrams, decks, research explainers, reports, and custom editors. Scaffolds from 20 forked reference templates at `.aikit/templates/html-artifacts/` and fills them with project context. Maintains a gallery at `.aikit/artifacts/index.html`.
version: "2.1.0"
source: haac-aikit
license: MIT
inspired-by: https://thariqs.github.io/html-effectiveness (templates forked with permission, 2026-05-12)
---

## When to use
- Output is comparison, drill-in, or interactive — not linear prose
- Task is a spec, plan, review, report, prototype, design system, diagram, deck, explainer, or editor
- User says "share", "review", "scan", "click through", "demo", "tune"
- Output would otherwise be > ~80 lines of markdown

Default to markdown for linear prose. HTML earns its weight only when structure or interaction is the point.

## Proactive offer rule
When conditions match but the user didn't ask for HTML, say one sentence and wait:

> "I can produce this as an interactive HTML artifact (scaffolded from a template) — want that?"

## Cross-cutting techniques (apply to ALL patterns)
- **Design tokens** in `:root`: `--clay #D97757`, `--slate #141413`, `--ivory #FAF9F5`, `--oat #E3DACC`, `--olive #788C5D`, `--gray-150 #F0EEE6`, `--gray-300 #D1CFC5`, `--gray-500 #87867F`, `--gray-700 #3D3D3A`, `--white #FFFFFF`
- **Font stack**: `system-ui, -apple-system, "Segoe UI", Roboto` for sans; `ui-serif, Georgia` for `--serif`; `ui-monospace, "SF Mono"` for `--mono`
- **Layout**: CSS Grid for structure; flex + gap for toolbars and rows
- **Sticky**: toolbars / TOCs / column headers use `position: sticky; top: 0; z-index: 1`
- **Responsive type**: `font-size: clamp(min, Nvw, max)` for headings — no breakpoint jumps
- **Microinteractions**: `:hover { transform: translateY(-1px) }`, `:active { transform: translateY(1px) }`, transitions 120–600ms with explicit properties — **never `transition: all`**
- **Semantic HTML**: `<details>`, `<summary>`, native `<button>`, native `<input>` — **never div-button hacks**
- **Mobile**: at least one `@media (max-width: 960px)` breakpoint per artifact
- **Dot indicators**: small colored circles via `::before` pseudo-elements (severity, ownership, status)
- **Shadows**: subtle only — `0 1px 3px rgba(20, 20, 19, 0.06)`; never heavy drop shadows
- **Anchors**: every section heading has an `id`; `scroll-margin-top: 28px` on sections
- **Provenance footer**: every generated artifact ends with `Sources: … — generated <ISO timestamp>`
- **AUTO-GENERATED pill**: top-right badge on agent-produced artifacts so readers know the origin
- **Prompt callout**: exploration / planning artifacts preserve the originating user request in a cream-tinted box at top
- **Density-adaptive rendering**: when the artifact's total visible items (milestones + risks + cards + rows across all sections) is ≤ 6, drop decorations designed for dense pages — section numbers, tag chips, colored dot indicators, multi-column summary cards. These visuals were tuned for ~12-item artifacts; on sparse content they read as noise instead of hierarchy. The point of structure is signal; if there's little content, decoration buries it.

## Pattern playbook (9 patterns, aligned with the source)

### 1. Exploration & Planning
**Templates**: `01-exploration-code-approaches.html`, `02-exploration-visual-designs.html`, `16-implementation-plan.html`
**Use for**: comparing N approaches, exploring visual directions, handing off a plan
**Concrete techniques**: numbered approach badges (`01`/`02`/`03`) in oat chips · equal-width code blocks for visual symmetry · pro/con tables with colored dot bullets (olive=pro, clay=con) · chip metrics footer (bundle, testability, reuse, SSR safety) · recommendation callout with left clay border + serif 22px · light/dark toggle via single `:root` swap · numbered milestone rows with date columns on left · phase cards with package chips · risks table (RISK / SEV / MITIGATION) · "Decide with · person · before slice N" footer on open questions
**Must-haves**: preserve the originating prompt as a top callout; numbered section dots if > 4 sections

### 2. Code Review & Understanding
**Templates**: `03-code-review-pr.html`, `17-pr-writeup.html`, `04-code-understanding.html`
**Use for**: PR reviews, author writeups, module / architecture explainers
**Concrete techniques**: PR header card (repo · PR# · title · author avatar · branch arrow `→` · `+lines / -lines` · file count) · risk map: horizontal chip cluster with 3-state legend (safe / worth a look / needs attention) · per-file expandable `<details>` with severity badge + line-count chip · diff grid `[line# | mark | code]` on dark slate, `.add/.del/.ctx/.hunk` states at 15% opacity · review comment bubble: left accent + `::before` triangle pointer + line# tag + BLOCKING (clay) / NIT (gray) label · "Suggested next steps" checkbox list at the end · for module maps: inline SVG with hot path in clay, right sidebar with "Key files" + "Gotchas" panels · `<details>` "show source" toggle on long code blocks
**Must-haves**: severity color coding; collapsed files at the end; clickable jump links between sections

### 3. Design
**Templates**: `05-design-system.html`, `06-component-variants.html`
**Use for**: design system references, component-variant matrices
**Concrete techniques**: color groups in named bands (PRIMARY / NEUTRAL / SEMANTIC) · each swatch shows 64×64 chip + hex + token name · typography table with shared specimen text repeated at each scale, size/leading/weight as right-aligned monospace meta · vertical spacing-bar ruler (`overflow-x: auto`) · radius + elevation showcase cards · core-components stage with `<Button />`-style XML labels above each section · for variants: live control panel (slider + segmented + checkbox) affecting all variants live · "best for: ..." rationale below each variant · hovered-variant code-preview pane
**Must-haves**: tokens have both hex AND name; components on the page are real HTML, not images

### 4. Prototyping
**Templates**: `07-prototype-animation.html`, `08-prototype-interaction.html`
**Use for**: animation tuning, interaction prototypes
**Concrete techniques**: stage area with the actual interactive element + "click to toggle" caption · right-side knob panel: easing presets as selectable cards with `cubic-bezier(...)` formulas visible · keyframe timeline strip with milestone markers (`fill 0ms · check 80ms · strike 120ms · confetti 200ms · collapse 600ms`) · copy-paste CSS panel below stage with commented sections · for interactions: 2-col layout with stage left, "What you're feeling" design-notes right, "Open questions" deferral panel below
**Must-haves**: explicit "design decisions baked in" annotations; explicit "open questions" deferred to reviewer; exportable CSS/params

### 5. Illustrations & Diagrams
**Templates**: `10-svg-illustrations.html`, `13-flowchart-diagram.html`
**Use for**: SVG figure sheets, interactive flowcharts
**Concrete techniques**: inline SVG with CSS-var theming (`fill="var(--panel)"`, `stroke="var(--line)"`) · per-figure card with download-each-as-standalone button · "Palette & rules" section at bottom (palette swatches + stroke/radius/label rules) · for flowcharts: process rectangles · decision diamonds · terminal rounded nodes (✅ green for success) · failure paths drawn dashed clay · edge labels on arrows (pass / fail / healthy) · legend at bottom (process step / decision / terminal success / failure path) · click-to-detail right sidebar showing clicked node's metadata
**Must-haves**: every figure self-contained with its own `<style>` block (downloadable standalone); legend visible for non-trivial diagrams

### 6. Decks
**Template**: `09-slide-deck.html`
**Use for**: slide presentations, walkthroughs, pitches
**Concrete techniques**: `width: 100vw; height: 100vh` per slide · `scroll-snap-type: y mandatory` on body, `scroll-snap-stop: always` on `.slide` · responsive type `font-size: clamp(40px, 6vw, 64px)` · invert variant (`.slide.invert { bg slate; color ivory }`) for decision slides · large-serif metric values (52px) · slide counter top-right (`N / total`) · uppercase mono eyebrow on each slide ("SHIPPED THIS WEEK", "DECISION NEEDED", "ON DECK") · decision card with option chips prefixed `A —` / `B —` · footnote at bottom (absolute, monospace 11px)
**Must-haves**: arrow-key nav (or scroll-snap); one idea per slide; if user would scroll inside a slide, it's a Report not a Deck

### 7. Research & Learning
**Templates**: `14-research-feature-explainer.html`, `15-research-concept-explainer.html`
**Use for**: explaining a feature in your repo, teaching a concept
**Concrete techniques**: sticky left "ON THIS PAGE" TOC (200px) with nested children · "FILES READ" panel below TOC for provenance · TL;DR callout with clay left border · collapsed `<details>` step rows that expand on click · file:line tags right-aligned in step headers · tabbed code blocks (e.g., `limits.yaml` / `route.ts` / `client response`) for the same concept in different views · ★ tip callouts with cream background distinct from • bullets · for concepts: live interactive widget (manipulable, not just diagram) · hover-linked glossary terms underlined in prose, defined in right sidebar · comparison table with color-coded values (red=bad, green=good)
**Must-haves**: TL;DR at the very top; clickable TOC; explicit "FILES READ" provenance for repo-specific explainers

### 8. Reports
**Templates**: `11-status-report.html`, `12-incident-report.html`
**Use for**: weekly status, sprint reviews, incident post-mortems
**Concrete techniques**: 4-card metric band with delta sub-labels ("+3 vs wk10", "±0", "SEV-2 · 47m") · incident pills (SEV-2 clay / Resolved olive / Duration / Detected / Owner) · dark TL;DR box at top of incidents · vertical timeline with colored dots (clay = impact, olive = mitigated) and monospace time chips · shipped table with PR# / TITLE / AUTHOR / RISK columns and colored risk badges · velocity bar chart with the spike day colored · carryover items prefixed with status pills (IN REVIEW / BLOCKED / SLIPPED) · impact table (Requests failed / Peak error rate / Users affected / Data loss / SLA breach) · action-items checklist with avatar + due date · footer cites sources ("git log main..HEAD · CI dashboard · deploy log") and generation timestamp · "AUTO-GENERATED" pill top-right
**Must-haves**: provenance footer; quantified impact for incidents; action items with owners + dates

### 9. Custom Editing Interfaces
**Templates**: `18-editor-triage-board.html`, `19-editor-feature-flags.html`, `20-editor-prompt-tuner.html`
**Use for**: throwaway editors for tasks that are hard to describe — kanban, flag configs, prompt tuning
**Concrete techniques**: native drag-and-drop (`draggable="true"` + `dragstart` / `dragover` / `drop`) with `.dragover` 2px dashed outline · 4-col kanban grid with `data-col` attribute → colored `border-top: 3px` per column · sticky column headers · filter toggle: `display: none` → `inline-block` on `.on` · live summary row that updates on drag · checkbox-based toggle switches with large click targets · dependency warning banners (`display: none` → `flex` on `.show`) · 2-col layout with sticky 320px right control panel · for prompt tuners: editable textarea left + sample-input panels right that re-render live
**Must-haves**: **always end with an export button** — "Copy as markdown" / "Copy diff" / "Copy params" — that turns the in-UI state back into something pasteable to the next prompt or committable to the repo

## Failure modes (anti-patterns)
- `transition: all` — animates layout shifts and lags; use explicit property lists
- Div-based button hacks — breaks keyboard nav; use native `<button>`
- Unlabeled colors — every swatch and badge needs hex AND token AND role
- Desktop-only layouts — every artifact needs at least one `@media` breakpoint
- Hover-only critical info — invisible on touch; use `<details>` or always-visible cards
- Static code blocks for diffs — color and structure are the point; render `.add`/`.del`/`.ctx` states
- Walls of prose where structure would earn its weight — re-evaluate; default to markdown
- Missing `scroll-margin-top` — anchors land under sticky headers
- Neglected `:active` feedback — clicks feel dead without `translateY(1px)`
- Missing keyboard nav for editors — native form controls, not div-clicks
- Missing AUTO-GENERATED badge on agent-produced artifacts — readers deserve to know
- Missing provenance footer — "where did these numbers come from?" should always be answerable

## Template scaffolding

**YOU MUST NOT invent HTML structure from scratch.** Reference templates are the ground truth. Reading one before writing is mandatory.

**Template location**: `.aikit/templates/html-artifacts/` (synced from the catalog). Manifest at `.aikit/templates/html-artifacts/MANIFEST.json` maps `slug` → `category` → `file`.

### Scaffolding protocol (agent-driven — follow exactly)

1. **Read the manifest first**: `Read .aikit/templates/html-artifacts/MANIFEST.json`. Find the entry whose `category` matches the pattern from the playbook above and whose `slug` best matches the user's intent.
2. **Read the matching template**: `Read .aikit/templates/html-artifacts/<file>.html` (the `file` field from the manifest entry). This is non-optional. If the file is missing, ask the user to run `aikit sync`; do not proceed without it.
3. **Gather real project context**: run the appropriate commands — `git diff main...HEAD`, `git log --since=...`, read files mentioned in the prompt, etc. Replace the template's placeholder content with these real facts.
4. **Prune irrelevant sections before filling**. Scan the template's `<section>` blocks; for any not required by the user's intent, OMIT them from the filled artifact entirely (don't render them with empty placeholders). Aim for the minimum sections that carry signal — keeping all sections "just in case" forces the reader to skim each one to decide whether it's relevant. Section-keep guide:

   | Templates | Always include | Optional (only if relevant) |
   | --- | --- | --- |
   | `01`, `02`, `16` (Exploration & Planning) | Milestones / Approaches + Risks | Data flow §02 (only if client↔server movement) · Mockups §03 (only if UI work) · Key code §04 (only if specific patterns to highlight) |
   | `03`, `17`, `04` (Code Review) | PR header · Per-file details · Comments | Risk map (only if multiple severities) · Module-map SVG (only for arch reviews) |
   | `11`, `12` (Reports) | Metric band + main table | Velocity chart (only if time series) · Incident timeline (only for incidents) |
   | `18`, `19`, `20` (Editors) | Real columns + export button | Dependency warnings (only if dependencies) |
   | All others | Core content sections of the pattern | Any section where placeholders would carry no signal |

5. **Preserve structure verbatim** when writing the filled artifact:
   - All `:root` CSS variables (`--clay`, `--slate`, `--ivory`, `--oat`, `--olive`, `--gray-*`)
   - All class names, layout grids, and microinteraction conventions
   - All cross-cutting techniques (sticky positioning, `scroll-margin-top`, `<details>` collapsibles, native form controls)
   - The pattern's visual language (severity colors, badge styles, dot indicators, monospace meta text)
6. **Add required `<head>` elements**: `<title>`, `<meta name="description">`, and `<meta name="aikit-pattern" content="...">` with one of: `Exploration`, `Code Review`, `Design`, `Prototype`, `Illustrations`, `Deck`, `Research`, `Report`, `Editor`.
7. **Add AUTO-GENERATED pill** top-right and **provenance footer** (`Sources: ... — generated <ISO timestamp>`).
8. **Save** to `.aikit/artifacts/NN-<slug>.html` (increment `NN` from existing files).
9. **Regenerate gallery index** per the protocol below.

### User-driven scaffolding (alternative)

When the user wants a pristine starter to look at first: `aikit scaffold html <slug>` drops the template into the current directory unmodified. Slugs match the manifest: `code-approaches`, `visual-designs`, `pr-review`, `pr-writeup`, `code-understanding`, `design-system`, `component-variants`, `animation`, `interaction`, `slide-deck`, `svg-illustrations`, `status-report`, `incident-report`, `flowchart`, `feature-explainer`, `concept-explainer`, `implementation-plan`, `triage-board`, `feature-flags`, `prompt-tuner`. Numbers (`03`) and `--list` also work.

## Output rules
- Save filled artifacts to `.aikit/artifacts/NN-<slug>.html` (`NN` zero-padded; increment from existing files; start at `01`). This path is gitignored.
- Every artifact MUST include `<meta name="aikit-pattern" content="...">` in `<head>`. Valid values match the 9-pattern playbook: `Exploration`, `Code Review`, `Design`, `Prototype`, `Illustrations`, `Deck`, `Research`, `Report`, `Editor`. The gallery groups by this.
- Every artifact MUST include `<title>` and `<meta name="description">` — the gallery renders these.
- Pure HTML / CSS / JS only — no CDNs, no build step. Inline `<style>` and `<script>` blocks are fine.
- After saving, **regenerate `.aikit/artifacts/index.html` from scratch** (see Gallery protocol below), then print both paths and suggest `open .aikit/artifacts/index.html`.

## Gallery index protocol
After every artifact write, rebuild `.aikit/artifacts/index.html`:

1. List `.aikit/artifacts/*.html` excluding `index.html`.
2. For each file read `<title>`, `<meta name="description">`, `<meta name="aikit-pattern">`.
3. Group by pattern; drop empty groups; sort within a group by filename (`NN` order).
4. Render each group as a section with cards: filename badge, title, one-line description, link.
5. Reuse the cross-cutting design tokens so the gallery matches the artifacts.
6. The gallery itself uses `<meta name="aikit-pattern" content="Index">` so future tooling can recognize it; it is excluded from its own listing.

## Markdown-first rule
Existing brainstorming, debugging, and planning skills stay markdown-first. Only switch to HTML when the user accepts the proactive offer or explicitly invokes `/html`. Cross-tool compatibility depends on this.

## Attribution
Templates forked with permission from [github.com/ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness) (2026-05-12). The pattern taxonomy, sub-types, and technique inventory above are derived from the same source. Adapted for cross-tool agent scaffolding under haac-aikit's MIT license.
