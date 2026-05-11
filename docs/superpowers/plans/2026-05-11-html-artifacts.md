# HTML Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an `html-artifacts` tier1 skill, a `/html` command, and a `html-design-system.html` base template that teach agents when and how to produce rich HTML output instead of markdown.

**Architecture:** Three new catalog files (skill, command, design system HTML) plus two src/ lines to wire the design system into the catalog loader and sync command — same pattern used by `claude-md-reference.md`. The skill and command are picked up automatically by existing sync globs; only the `docs/` file needs explicit wiring.

**Tech Stack:** TypeScript (src/), plain markdown (skill + command), HTML/CSS/JS (design system template), vitest (tests)

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `catalog/skills/tier1/html-artifacts.md` | Philosophy skill — when/how to generate HTML artifacts |
| Create | `catalog/commands/html.md` | `/html` slash command |
| Create | `catalog/docs/html-design-system.html` | Base template shipped to downstream repos |
| Modify | `src/catalog/index.ts:42` | Expose `htmlDesignSystem` loader function |
| Modify | `src/commands/sync.ts:46` | Scope-gated write of design system to `docs/` |
| Modify | `test/sync-claude.test.ts` | Tests for design system shipping behaviour |

Note: **No gitignore change needed** — `.aikit/` is already in `src/fs/gitignore.ts`'s ENTRIES, which covers `.aikit/artifacts/`.

---

## Task 1: Write failing tests for design system shipping

**Files:**
- Modify: `test/sync-claude.test.ts`

- [ ] **Step 1: Open `test/sync-claude.test.ts` and append a new `describe` block**

Add this block at the end of the file, after the closing `});` of the existing describe:

```typescript
describe("sync — HTML design system", () => {
  it("ships docs/aikit-html-design-system.html at scope=standard with claude", async () => {
    writeConfig(baseConfig);

    await runSync({ _: ["sync"] });

    expect(existsSync("docs/aikit-html-design-system.html")).toBe(true);
    const html = readFileSync("docs/aikit-html-design-system.html", "utf8");
    expect(html).toContain("--color-bg");
    expect(html).toContain("Customize the CSS variables above");
  });

  it("does NOT ship docs/aikit-html-design-system.html at scope=minimal", async () => {
    writeConfig({ ...baseConfig, scope: "minimal" });

    await runSync({ _: ["sync"] });

    expect(existsSync("docs/aikit-html-design-system.html")).toBe(false);
  });

  it("does NOT ship docs/aikit-html-design-system.html when claude is not selected", async () => {
    writeConfig({ ...baseConfig, tools: ["cursor"] });

    await runSync({ _: ["sync"] });

    expect(existsSync("docs/aikit-html-design-system.html")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```bash
cd /Users/mersall/Desktop/HAAC/haac-aikit && npx vitest run test/sync-claude.test.ts
```

Expected: 3 failures — `TypeError: catalog.htmlDesignSystem is not a function`

- [ ] **Step 3: Commit the failing tests**

```bash
git add test/sync-claude.test.ts
git commit -m "test(html): add failing tests for design-system shipping"
```

---

## Task 2: Wire up the catalog loader and sync command

**Files:**
- Create: `catalog/docs/html-design-system.html` (minimal stub — full content in Task 3)
- Modify: `src/catalog/index.ts:42`
- Modify: `src/commands/sync.ts:46`

- [ ] **Step 1: Create a minimal `catalog/docs/html-design-system.html` stub**

```html
<!-- Customize the CSS variables above. The model reads this file when generating HTML artifacts. -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
:root {
  --color-bg: #0f1117;
}
</style>
</head>
<body>
<p>Design system stub — will be replaced in Task 3.</p>
</body>
</html>
```

Save to `catalog/docs/html-design-system.html`.

- [ ] **Step 2: Add `htmlDesignSystem` to `src/catalog/index.ts`**

In `src/catalog/index.ts`, find the `loadCatalog` return object (around line 31). Add one line after `claudeMdReference`:

```typescript
// Before (line 42):
    claudeMdReference: () => read("docs/claude-md-reference.md"),

// After:
    claudeMdReference: () => read("docs/claude-md-reference.md"),
    htmlDesignSystem: () => read("docs/html-design-system.html"),
```

- [ ] **Step 3: Add the scope-gated write in `src/commands/sync.ts`**

In `src/commands/sync.ts`, find the `if (config.scope !== "minimal")` block inside `if (config.tools.includes("claude"))` (around line 45). Add one line after the `claudeMdReference` write:

```typescript
// Before:
    if (config.scope !== "minimal") {
      results.push(safeWrite("docs/claude-md-reference.md", catalog.claudeMdReference(), { ...opts, useMarkers: false }));
      results.push(safeWrite(".claude/aikit-rules.json", catalog.aikitRulesJson(), { ...opts, useMarkers: false }));

// After:
    if (config.scope !== "minimal") {
      results.push(safeWrite("docs/claude-md-reference.md", catalog.claudeMdReference(), { ...opts, useMarkers: false }));
      results.push(safeWrite("docs/aikit-html-design-system.html", catalog.htmlDesignSystem(), { ...opts, useMarkers: false }));
      results.push(safeWrite(".claude/aikit-rules.json", catalog.aikitRulesJson(), { ...opts, useMarkers: false }));
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
npx vitest run test/sync-claude.test.ts
```

Expected: all tests pass including the 3 new ones.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit the wiring**

```bash
git add catalog/docs/html-design-system.html src/catalog/index.ts src/commands/sync.ts
git commit -m "feat(html): wire html-design-system into catalog loader and sync"
```

---

## Task 3: Build out the design system HTML file

**Files:**
- Modify: `catalog/docs/html-design-system.html`

- [ ] **Step 1: Replace the stub with the full design system reference**

Overwrite `catalog/docs/html-design-system.html` with:

```html
<!-- Customize the CSS variables above. The model reads this file when generating HTML artifacts. -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>haac-aikit HTML Design System</title>
<style>
/* ─── Design tokens ────────────────────────────────────────────────────────
   Edit these variables to retheme all HTML artifacts generated by the model.
   ──────────────────────────────────────────────────────────────────────── */
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

/* ─── Reset & base ─────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  padding: calc(var(--space) * 8);
  max-width: 900px;
  margin: 0 auto;
}
h1, h2, h3 { font-weight: 600; margin-bottom: calc(var(--space) * 3); }
h1 { font-size: 1.5rem; margin-bottom: calc(var(--space) * 6); }
h2 { font-size: 1.1rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: calc(var(--space) * 10); }
p { color: var(--color-muted); margin-bottom: calc(var(--space) * 4); }
section { margin-bottom: calc(var(--space) * 12); }

/* ─── Card ──────────────────────────────────────────────────────────────── */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: calc(var(--space) * 5);
  margin-bottom: calc(var(--space) * 4);
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge-ok    { background: color-mix(in srgb, var(--color-ok) 15%, transparent);    color: var(--color-ok); }
.badge-warn  { background: color-mix(in srgb, var(--color-warn) 15%, transparent);  color: var(--color-warn); }
.badge-error { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }
.badge-info  { background: color-mix(in srgb, var(--color-accent) 15%, transparent); color: var(--color-accent); }

/* ─── Tabs ──────────────────────────────────────────────────────────────── */
.tabs { border-bottom: 1px solid var(--color-border); display: flex; gap: calc(var(--space) * 1); margin-bottom: calc(var(--space) * 4); }
.tab {
  padding: calc(var(--space) * 2) calc(var(--space) * 4);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 500;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}
.tab:hover { color: var(--color-text); }
.tab.active { border-bottom-color: var(--color-accent); color: var(--color-text); }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* ─── Code block ────────────────────────────────────────────────────────── */
.code-block {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: calc(var(--space) * 4);
  font-family: var(--font-mono);
  font-size: 12px;
  overflow-x: auto;
  white-space: pre;
  color: var(--color-text);
  margin-bottom: calc(var(--space) * 4);
}

/* ─── Diff ──────────────────────────────────────────────────────────────── */
.diff-block { font-family: var(--font-mono); font-size: 12px; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; margin-bottom: calc(var(--space) * 4); }
.diff-line { display: flex; padding: 2px calc(var(--space) * 3); }
.diff-line-add { background: color-mix(in srgb, var(--color-ok) 10%, transparent); }
.diff-line-del { background: color-mix(in srgb, var(--color-error) 10%, transparent); }
.diff-line-ctx { color: var(--color-muted); }
.diff-gutter { user-select: none; color: var(--color-muted); min-width: 32px; text-align: right; margin-right: calc(var(--space) * 3); }
.diff-sign { min-width: 12px; color: var(--color-muted); }
.diff-line-add .diff-sign { color: var(--color-ok); }
.diff-line-del .diff-sign { color: var(--color-error); }
</style>
</head>
<body>

<h1>haac-aikit HTML Design System</h1>
<p>Reference file for HTML artifacts generated by the model. Edit the CSS custom properties at the top of this file to retheme all output.</p>

<section>
  <h2>Card</h2>
  <div class="card">
    <strong>Card title</strong>
    <p>Use cards to group related content. Nest inside grid or flex containers for multi-column layouts.</p>
  </div>
</section>

<section>
  <h2>Badges</h2>
  <span class="badge badge-ok">ok</span>
  <span class="badge badge-warn">warn</span>
  <span class="badge badge-error">error</span>
  <span class="badge badge-info">info</span>
</section>

<section>
  <h2>Tabs</h2>
  <div class="tabs" id="demo-tabs">
    <button class="tab active" data-panel="p1">Option A</button>
    <button class="tab" data-panel="p2">Option B</button>
    <button class="tab" data-panel="p3">Option C</button>
  </div>
  <div id="p1" class="tab-panel active"><div class="card">Content for Option A.</div></div>
  <div id="p2" class="tab-panel"><div class="card">Content for Option B.</div></div>
  <div id="p3" class="tab-panel"><div class="card">Content for Option C.</div></div>
  <script>
    document.querySelectorAll('.tabs').forEach(tabGroup => {
      tabGroup.addEventListener('click', e => {
        const btn = e.target.closest('.tab');
        if (!btn) return;
        tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const panelId = btn.dataset.panel;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(panelId).classList.add('active');
      });
    });
  </script>
</section>

<section>
  <h2>Code block</h2>
  <div class="code-block">const greeting = "hello, world";
console.log(greeting);</div>
</section>

<section>
  <h2>Diff</h2>
  <div class="diff-block">
    <div class="diff-line diff-line-ctx"><span class="diff-gutter">1</span><span class="diff-sign"> </span><span>import { foo } from './foo';</span></div>
    <div class="diff-line diff-line-del"><span class="diff-gutter">2</span><span class="diff-sign">-</span><span>const x = foo();</span></div>
    <div class="diff-line diff-line-add"><span class="diff-gutter">3</span><span class="diff-sign">+</span><span>const x = await foo();</span></div>
    <div class="diff-line diff-line-ctx"><span class="diff-gutter">4</span><span class="diff-sign"> </span><span>export { x };</span></div>
  </div>
</section>

</body>
</html>
```

- [ ] **Step 2: Run the tests to confirm they still pass**

```bash
npx vitest run test/sync-claude.test.ts
```

Expected: all tests pass (the test checks for `--color-bg` and `Customize the CSS variables above`, both present).

- [ ] **Step 3: Commit**

```bash
git add catalog/docs/html-design-system.html
git commit -m "feat(html): add html-design-system.html catalog template"
```

---

## Task 4: Create the html-artifacts skill

**Files:**
- Create: `catalog/skills/tier1/html-artifacts.md`

- [ ] **Step 1: Create the skill file**

```markdown
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
```

Save to `catalog/skills/tier1/html-artifacts.md`.

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass. (`catalog:check` only validates agents, not skills — this is the right regression check.)

- [ ] **Step 3: Commit**

```bash
git add catalog/skills/tier1/html-artifacts.md
git commit -m "feat(html): add html-artifacts tier1 skill"
```

---

## Task 5: Create the /html command

**Files:**
- Create: `catalog/commands/html.md`

- [ ] **Step 1: Create the command file**

```markdown
Generate an HTML artifact for the current context using the html-artifacts skill.

## Usage
`/html [optional intent]`

## Steps

1. **Determine intent**
   - If called with args (e.g. `/html code review of today's PR`): use the args as the intent.
   - If called with no args: infer intent from the current conversation — what task is in progress, what was just discussed, what files are open.

2. **Pick the use-case pattern**
   Using the `html-artifacts` skill, identify which of the five patterns fits:
   Spec/Planning, Code Review, Report/Research, Prototype, or Custom Editor.

3. **Generate the artifact**
   - Apply the built-in design system CSS tokens
   - If `docs/aikit-html-design-system.html` exists in the project, read it first and inherit its CSS variable values
   - Follow the structure guidance for the chosen pattern
   - Pure HTML/CSS/JS only — no external CDN dependencies

4. **Save and report**
   - Determine a short slug from the intent (e.g. `code-review-auth-pr`, `weekly-report`)
   - Save to `.aikit/artifacts/<slug>-<timestamp>.html`
   - Print the full path
   - Suggest opening: `open <path>` (macOS) / `xdg-open <path>` (Linux)
```

Save to `catalog/commands/html.md`.

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass. (`catalog:check` validates agents only, not commands.)

- [ ] **Step 3: Commit**

```bash
git add catalog/commands/html.md
git commit -m "feat(html): add /html slash command"
```

---

## Task 6: Final validation

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass with no regressions.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no type errors.

- [ ] **Step 3: Run catalog check**

```bash
npm run catalog:check
```

Expected: passes.

- [ ] **Step 4: Verify the design system ships correctly with a dry-run**

Create a temp config and run sync dry-run to confirm the file appears in the output:

```bash
echo '{"version":1,"projectName":"test","tools":["claude"],"scope":"standard","shape":["library"],"integrations":{"mcp":false,"hooks":false,"commands":true,"subagents":false,"ci":false,"husky":false}}' > /tmp/test-aikitrc.json && node dist/cli.mjs sync --dry-run --config /tmp/test-aikitrc.json 2>&1 | grep -E "html|design"
```

Expected: output contains `docs/aikit-html-design-system.html` and `.claude/commands/html.md` and `.claude/skills/html-artifacts.md`.

> Note: run `npm run build` first if `dist/cli.mjs` is stale.

- [ ] **Step 5: Final commit (if any loose files)**

```bash
git status
```

If clean: done. If any unstaged changes, add and commit with `chore(html): final cleanup`.
