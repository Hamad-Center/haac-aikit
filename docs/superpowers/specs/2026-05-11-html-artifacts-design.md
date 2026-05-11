# HTML Artifacts — Design Spec

**Date:** 2026-05-11  
**Status:** Approved  
**Scope:** Additive — no changes to existing catalog files

---

## Problem

Markdown is the current default output format for agent-generated artifacts (specs, plans, reports, code review explainers). Files over ~100 lines go unread. There is no way to share a rendered output without a Markdown viewer. Agents resort to ASCII diagrams and unicode color approximations when richer communication would be clearer.

HTML solves this: it is natively renderable in any browser, supports tables, SVG, color, interactivity, and responsive layout, and can be shared as a single file link.

---

## What Gets Shipped

Three new catalog files, purely additive:

```
catalog/
  skills/
    tier1/
      html-artifacts.md           ← philosophy skill (always-on)
  commands/
    html.md                       ← /html slash command
  docs/
    html-design-system.html       ← base template (scope ≥ standard)
```

One gitignore addition: `.aikit/artifacts/` added to `catalog/rules/` gitignore template.

---

## Skill: `html-artifacts.md` (tier1)

**Purpose:** Teach the model when to use HTML, how to structure each artifact type, and provide a consistent design system so output looks coherent without the model reinventing styles each time.

### Trigger conditions (proactive offer)
The model offers HTML (one sentence, before proceeding) when:
- Output is > ~80 lines of content
- Task involves comparison, multiple options, or visual layout
- User asks for a spec, plan, report, PR explainer, or prototype
- User mentions "share", "send to team", or "easy to read"

Offer phrasing: *"I can generate this as an HTML artifact for easier reading — want that?"*

### Five use-case patterns

| Pattern | Trigger | Key structure | One "don't" |
|---|---|---|---|
| Spec/Planning | Long spec, multiple options | Tabs per option, decision log, embedded mockups | Don't skip the decision rationale section |
| Code Review | PR explainer, diff walkthrough | Rendered diff, severity color badges, inline margin annotations | Don't show raw unified diff without color |
| Report/Research | Status report, incident summary, research synthesis | SVG diagrams, section anchors, executive summary at top | Don't bury the conclusion — lead with it |
| Prototype | Animation tuning, layout exploration | Sliders/knobs, live preview, "copy params" export button | Don't ship without an export mechanism |
| Custom Editor | Ticket triage, config editing, dataset curation | Drag/sort or form UI, constraint warnings, "copy as JSON/prompt" button | Don't let the editor be the only output — always provide an export |

### Built-in design system (CSS block)

A minimal CSS custom-properties block injected into every artifact:

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

Pre-built components: `.card`, `.badge`, `.tabs`, `.code-block`, `.diff-line`.

### Markdown-first rule
Existing brainstorming and planning skills stay markdown-first. HTML is opt-in via the proactive offer or explicit `/html` command. This preserves cross-tool compatibility (Cursor, Aider, Gemini users don't always have a browser) and avoids 2-4x token cost increase for all users.

---

## Command: `html.md`

**Path:** `catalog/commands/html.md`  
**Invocation:** `/html [optional intent]`

### Behavior

1. **With args** (`/html report of today's git changes`) — treat args as intent, generate immediately using the `html-artifacts` skill
2. **Without args** — infer intent from conversation context (current task, recent discussion, open files)
3. Generate artifact using the skill's use-case patterns and design system tokens
4. Save to `<project-root>/.aikit/artifacts/<slug>-<timestamp>.html`
5. Print the path and suggest opening: `open <path>` (macOS) / `xdg-open <path>` (Linux)

### Constraints
- No server, no hot-reload, no framework dependency
- Pure HTML/CSS/JS — opens in any browser
- Output path is always inside `.aikit/artifacts/` (gitignored)

---

## Design System File: `html-design-system.html`

**Path (downstream):** `docs/aikit-html-design-system.html`  
**Shipped at:** scope ≥ `standard`

Two purposes:
1. **Model reference** — when generating artifacts, model reads this file to stay visually consistent. Users can retheme by editing CSS custom properties at the top; all future artifacts inherit those changes.
2. **Living example** — showcases every built-in component (card, badge, tabs, code block, diff view, SVG diagram slot) so users know what's available.

Top comment: `<!-- Customize the CSS variables above. The model reads this file when generating HTML artifacts. -->`

---

## Integration Details

### Gitignore
Add `.aikit/artifacts/` to `catalog/rules/` gitignore template. Generated HTML files are ephemeral build artifacts — not source.

### Sync behavior
Two small `src/` changes required to wire up the design system file (same pattern as `claude-md-reference.md`):

1. **`src/catalog/index.ts`** — add `htmlDesignSystem: () => read("docs/html-design-system.html")`
2. **`src/commands/sync.ts`** — add a scope-gated write inside the `if (config.scope !== "minimal")` block:
   ```ts
   results.push(safeWrite("docs/aikit-html-design-system.html", catalog.htmlDesignSystem(), { ...opts, useMarkers: false }));
   ```

The skill and command files in `catalog/skills/tier1/` and `catalog/commands/` are picked up automatically by existing sync logic — no src/ changes needed for those.

### Catalog check
`npm run catalog:check` validates all shipped templates. The three new files are covered by existing validation. No changes to `scripts/catalog-check.js` required.

### Cross-tool scope
Skills and commands are Claude Code–native artifacts in the sync logic. Cursor/Aider/Gemini users receive them only if they opted in to `skills`/`commands` integrations in `.aikitrc.json`.

---

## Out of Scope

- No upload/hosting integration (S3, Vercel, etc.) — out of scope for v1
- No hot-reload dev server
- No changes to existing brainstorming, planning, or report skills
- No new `src/` commands or features — only 2 lines added to wire up the design system file
