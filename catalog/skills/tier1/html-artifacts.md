---
name: html-artifacts
description: Use when generating output that would benefit from rich formatting — specs, plans, reports, code review explainers, prototypes, decks, design-system pages, visual explainers, or custom editors. Maintains a gallery index at .aikit/artifacts/index.html so artifacts compound into a navigable project archive. Inspired by Thariq Shihipar's "Unreasonable Effectiveness of HTML" (Anthropic, 2026).
version: "1.1.0"
source: haac-aikit
license: MIT
---

## When to use
- Output is > ~80 lines of content
- Task involves comparison, multiple options, or visual layout
- User asks for a spec, plan, report, PR explainer, or prototype
- User mentions "share", "send to team", or "easy to read"

## Proactive offer rule
When conditions above are met but the user didn't explicitly ask for HTML, say one sentence before proceeding:

> "I can generate this as an HTML artifact for easier reading — want that?"

Wait for a yes/no. If yes, proceed with HTML. If no, use markdown.

## Use-case patterns

### 1. Spec / Planning
**Trigger:** Long spec, multiple options to compare  
**Structure:** Tabs per option, decision log section, embedded mockup slots  
**Don't:** Skip the decision rationale — that's the whole point of the doc

### 2. Code Review
**Trigger:** PR explainer, diff walkthrough, architecture audit  
**Structure:** Rendered diff with color, severity badges (ok/warn/error), inline margin annotations  
**Don't:** Show a raw unified diff without color — unreadable

### 3. Report / Research
**Trigger:** Status report, incident summary, research synthesis  
**Structure:** Executive summary at top, SVG diagrams, section anchors for navigation  
**Don't:** Bury the conclusion — lead with it

### 4. Prototype
**Trigger:** Animation tuning, layout exploration, parameter tweaking  
**Structure:** Sliders/knobs for live adjustment, preview pane, "copy params" export button  
**Don't:** Ship without an export mechanism — the params need to go somewhere

### 5. Custom Editor
**Trigger:** Ticket triage, config editing, dataset curation  
**Structure:** Drag/sort or form UI, constraint warnings, "copy as JSON/prompt" export button  
**Don't:** Let the editor be the only output — always export

### 6. Visual Explainer
**Trigger:** Explaining a concept, system, or workflow where a diagram beats prose  
**Structure:** One hero inline `<svg>` with labelled regions, short text blocks anchored to those regions, "view source" toggle that reveals the underlying data  
**Don't:** Use raster images or external icon CDNs — keep SVG inline so the artifact stays self-contained and editable

### 7. Deck
**Trigger:** Slide presentation, talk preview, pitch, "walk me through this"  
**Structure:** One slide per viewport (`100vh`), large body type (≥32px), arrow-key navigation, single idea per slide, speaker notes hidden behind a key press  
**Don't:** Generate scrolling content — if the user would scroll, it's a Report, not a Deck

### 8. Design System
**Trigger:** Building or documenting a design system, component library reference, token palette  
**Structure:** Live component samples beside their source HTML/CSS, swatches for color/spacing/type tokens, copy-on-click for each token value  
**Don't:** Use screenshots of components — the components on the page must be the real, live HTML

## Built-in design system

Inject this CSS block into every artifact. If the project has `docs/aikit-html-design-system.html`, read it first and use those variable values instead.

```css
:root {
  --color-bg:      #0f1117;
  --color-surface: #1a1d27;
  --color-border:  #2e3143;
  --color-text:    #e2e8f0;
  --color-muted:   #8892a4;
  --color-accent:  #6366f1;
  --color-ok:      #22c55e;
  --color-warn:    #f59e0b;
  --color-error:   #ef4444;
  --radius:        6px;
  --font-sans:     system-ui, -apple-system, sans-serif;
  --font-mono:     "JetBrains Mono", "Fira Code", monospace;
  --space:         4px;
}
```

Pre-built components available: `.card`, `.badge` (`.badge-ok/warn/error/info`), `.tabs` + `.tab` + `.tab-panel`, `.code-block`, `.diff-block` + `.diff-line` + `.diff-line-add/del/ctx`.

## Output rules
- Save to `.aikit/artifacts/NN-<slug>.html` where `NN` is a zero-padded sequence (`07-auth-spec.html`). This path is gitignored.
- Determine `NN` by listing existing files in `.aikit/artifacts/` (ignore `index.html`) and incrementing the highest number; start at `01`.
- Every artifact MUST include `<meta name="aikit-pattern" content="...">` in `<head>` with one of: `Spec`, `Code Review`, `Report`, `Prototype`, `Editor`, `Visual Explainer`, `Deck`, `Design System`. The index uses this to group entries.
- Every artifact MUST include `<title>` and `<meta name="description">` — the index renders these.
- Pure HTML/CSS/JS only — no external CDN dependencies, no build step.
- Mobile-responsive: use `max-width` + `padding` on body, `<meta name="viewport">`.
- After saving, also rewrite `.aikit/artifacts/index.html` (see below), then print both paths and suggest: `open .aikit/artifacts/index.html` (macOS) or `xdg-open` (Linux).

## Index page (gallery)
The index is auto-maintained. After every artifact write, regenerate `.aikit/artifacts/index.html` from scratch — do not try to surgically edit it:

1. List `.aikit/artifacts/*.html` excluding `index.html` itself
2. For each file, read `<title>`, `<meta name="description">`, and `<meta name="aikit-pattern">`
3. Group entries by pattern (Spec, Code Review, Report, Prototype, Editor, Visual Explainer, Deck, Design System)
4. Render each group as a section with cards: filename badge, title, one-line description, link to the file
5. Reuse the built-in design system CSS so the gallery matches the artifacts

Drop empty groups. Sort entries within a group by filename (which is by `NN`). The index itself uses `<meta name="aikit-pattern" content="Index">` so future tooling can recognize it but it is excluded from its own listing.

## Markdown-first rule
Existing brainstorming and planning skills stay markdown-first. Only switch to HTML when the user accepts the proactive offer or explicitly requests it (e.g. via `/html`). This preserves cross-tool compatibility.
