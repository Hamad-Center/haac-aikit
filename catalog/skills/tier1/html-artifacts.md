---
name: html-artifacts
description: Use when generating output that would benefit from rich formatting — specs, plans, reports, code review explainers, design prototypes, or custom editors. Teaches when to proactively offer HTML instead of markdown and how to structure each artifact type.
version: "1.0.0"
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

## Five use-case patterns

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
- Save to `.aikit/artifacts/<slug>-<timestamp>.html` (this path is gitignored)
- After saving, print the path and suggest: `open <path>` (macOS) or `xdg-open <path>` (Linux)
- Pure HTML/CSS/JS only — no external CDN dependencies, no build step
- Mobile-responsive: use `max-width` + `padding` on body, `<meta name="viewport">`

## Markdown-first rule
Existing brainstorming and planning skills stay markdown-first. Only switch to HTML when the user accepts the proactive offer or explicitly requests it (e.g. via `/html`). This preserves cross-tool compatibility.
