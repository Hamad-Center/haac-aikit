---
name: docs
description: Use when the user types "/docs", "update the docs", "document this", or when conversation just established a new feature/gotcha/architectural fact and the existing docs contradict it. Maintains an HTML doc tree at `docs/` with eye-comfort palette, light/dark themes, optional inline-SVG diagrams, and surgical marker-bounded section edits.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash(date:*)
  - AskUserQuestion
---

## When to use

- User runs `/docs` explicitly.
- Conversation just produced a documentable fact: a new feature was built, a module was refactored, a gotcha surfaced, an architectural decision was made and you've already used `/decide` to capture the choice itself.
- A doc is visibly stale (filename or section name appeared in conversation but the file's content contradicts what was just discussed).

Do **not** use for one-off explanations — those belong in chat, not docs.

## File layout

```
docs/
  index.html            ← rolled-up overview: short summary per linked doc + link
  architecture.html     ← one HTML file per area or feature
  auth.html
  db.html
  features/<slug>.html  ← per-feature deep dives (optional sub-folder)
```

Every HTML file uses the marker engine for sectioning:

```html
<!-- BEGIN:haac-aikit:section:overview -->
<section id="overview"><h2>Overview</h2>... </section>
<!-- END:haac-aikit:section:overview -->
```

Section IDs are kebab-case alphanumeric (`overview`, `data-flow`, `gotchas`, `adr-001`). They're stable across updates so the agent can find them.

## Update protocol — follow exactly

1. **Identify what changed.** From the recent conversation, name (a) the doc that's affected (`auth.html`, etc.) and (b) the section ID inside it (`overview`, `flow`, etc.). If the doc doesn't exist yet, plan to create it.
2. **Read only the section you'll edit.** Use the marker engine's `readSection(content, id, filePath)` — never load the whole file.
3. **Propose the change to the user in chat before writing.** One sentence: *"I'll update `<section>` in `docs/<file>.html` to reflect <change>. Okay?"* Wait for explicit confirmation. No silent writes.
4. **Write through the marker engine.** Use `writeSection` for replacing an existing section. Use `appendSection` to add a new one. Anything outside markers (user-authored prose, hand-edited content) is preserved automatically.
5. **Update `docs/index.html`** if you created a new file or materially changed an existing doc's purpose. Replace the matching summary inside its `<!-- BEGIN:haac-aikit:section:summary-<slug> -->` block.

## Starter template

When a doc doesn't exist yet, scaffold from `.aikit/templates/docs/starter.html` (synced from the catalog). The starter ships with:

- **Eye-comfort palette** — warm off-white `--bg` with warm-charcoal `--text`, moderate contrast (no pure white / pure black) to reduce strain across long reading sessions. Tokens: `--bg`, `--surface`, `--surface-alt`, `--text`, `--text-muted`, `--text-faint`, `--border`, `--code-bg`, `--accent`, `--link`, plus a matching `--diagram-*` set.
- **Reading-comfort fonts** — Atkinson Hyperlegible → Inter → IBM Plex Sans → system-ui in `--font-sans`; JetBrains Mono → IBM Plex Mono → ui-monospace in `--font-mono`. Body line-height `1.65`, headings `1.35`. Don't replace these unless the user asks.
- **Both themes by default** — `prefers-color-scheme: dark` plus a `[data-theme="dark|light"]` override and a fixed-position toggle button persisting the choice to `localStorage`.
- **A diagram slot** in the example section (`<figure class="diagram">` with inline SVG) showing the expected styling.
- Landmark roles (`<main>`, `<header>`), heading hierarchy, focus styles, and a print stylesheet.

Don't invent HTML structure from scratch — read the starter first. Don't override the color or font tokens per-doc; the tokens are repo-wide so every page looks the same.

### Theme prompt — first scaffold only

The very first time you scaffold a `docs/*.html` file in a repo (i.e. the file doesn't yet exist anywhere under `docs/`), ask the user once:

> *"Should the docs ship both light and dark mode (default), light only, or dark only?"*

Apply the answer to the starter you write:

- **both** *(default)* — keep the starter exactly as-is.
- **light only** — delete the `@media (prefers-color-scheme: dark)` block, the `:root[data-theme="dark"]` block, the `<button class="theme-toggle">`, and the trailing `<script>`. Also drop `<meta name="color-scheme" content="light dark">`.
- **dark only** — replace the `:root { ... }` light values with the dark values, then delete the `@media` block, the `[data-theme="dark"]` block, the toggle button, and the script. Set `<meta name="color-scheme" content="dark">`.

On subsequent scaffolds in the same repo, follow the convention already established by `docs/index.html` — don't re-ask.

## index.html maintenance

`docs/index.html` is the navigation hub. Each linked doc gets one summary card inside its own section:

```html
<!-- BEGIN:haac-aikit:section:summary-auth -->
<a href="auth.html"><h3>Authentication</h3>
<p>How sign-in, session, and token refresh work. 1-paragraph summary kept in sync with auth.html.</p></a>
<!-- END:haac-aikit:section:summary-auth -->
```

When you update `auth.html`'s overview, also update the matching `summary-auth` section in `index.html` so the rollup stays accurate.

## Diagrams — open each section with one when it earns its weight

Each `<section>` MAY open with a `<figure class="diagram">` containing an inline SVG. Lead with the picture, then the prose explains the picture. Readers skim diagrams first; a good one collapses three paragraphs of orientation into a glance.

### When to include a diagram

Add one if the section explains any of:

- **A flow** — request/response, data pipeline, build/deploy steps, user journey.
- **A topology** — components and the wires between them (services, modules, queues, stores).
- **A sequence** — ordered messages between two or more actors over time.
- **A state machine** — discrete states + the transitions between them.
- **A layered architecture** — three or more layers/tiers with a clear stack order.
- **Three or more concepts that relate spatially** — anything where "X sits between Y and Z" matters.

### When to skip the diagram entirely

Omit the `<figure>` (don't ship an empty placeholder) when:

- The section is a single paragraph of prose or a short list.
- A diagram would just restate a bulleted list as boxes.
- The topic is purely textual (naming conventions, terminology, decisions).

### SVG or HTML? Reach for SVG only when you need it

Both go inside `<figure class="diagram">` so the surrounding chrome is identical. The body is what differs.

**Use SVG** when the diagram needs something HTML can't do cleanly:

- Curved transitions, arcs, or non-orthogonal arrows
- Arrowheads with consistent styling
- Sequence diagrams with vertical lifelines and cross-lane messages
- State machines (circles + curved transitions)
- Anything with labels positioned on edges or at arbitrary coordinates

**Use HTML + CSS** when the diagram is just labeled boxes stacked or arranged on a grid. HTML wins here because:

- Real text in real DOM nodes — screen readers, find-in-page, and copy/paste just work.
- No `viewBox` math; flexbox/grid handles responsiveness for free.
- Far less code to maintain — a layered stack is ~5 lines of HTML vs. ~25 lines of SVG.
- Inherits the page's typography and color tokens automatically.

The starter ships two HTML-only patterns inside `figure.diagram`:

```html
<!-- Layered architecture: <div class="stack"> with <div class="row"> children -->
<figure class="diagram">
  <div class="stack">
    <div class="row"><span>CLI</span><span class="meta">src/cli.ts</span></div>
    <div class="row"><span>Render</span><span class="meta">src/render/</span></div>
  </div>
  <figcaption>Each layer depends only on the one below it.</figcaption>
</figure>

<!-- Numbered linear steps: <ol class="steps"> with <li> children -->
<figure class="diagram">
  <ol class="steps">
    <li>Identify the affected file + section id</li>
    <li>readSection() — never load the whole file</li>
    <li>Propose the change. Wait for "okay"</li>
    <li>writeSection() to replace, appendSection() to add</li>
  </ol>
  <figcaption>Five steps, no shortcuts.</figcaption>
</figure>
```

### How to draw (SVG path)

- **Inline SVG only** — no external image files, no Mermaid runtime, no canvas. SVG stays diff-able and loads with the page.
- **Use the starter's classes** — `.node` for shapes, `.edge` for connectors, `.arrowhead` on the marker path, `.muted` for sub-labels. They already pick up the shared tokens so the diagram re-themes automatically.
- **Label every node and every edge** with `<text>` elements — unlabeled boxes are visual noise.
- **A11y** — every figure carries `role="img"` and `aria-labelledby` pointing at a `<title>` inside the SVG. Add a `<figcaption>` when the picture needs a one-line caption beyond the title.
- **Size sensibly** — `viewBox` for scaling; aim for ≤ 600 wide so it fits the 760-px reading column without horizontal scroll on desktop.
- **One diagram per section, max.** If you need two, the section is two sections.

Code samples and tables follow the same "earn their weight" rule. Default to prose; add visuals only when they explain something prose can't.

## Anti-patterns to avoid

- **Loading the whole file to edit one section.** Defeats the token-cost mitigation; always use `readSection` / `writeSection`.
- **Silent writes.** Every update gets one-sentence confirmation in chat first. Docs are project-facing; surprise edits erode trust.
- **Editing content outside the markers.** That's user-authored prose; preserve it verbatim.
- **Inventing HTML from scratch.** Read the starter template first.
- **Drifting `index.html`.** When a doc's purpose changes, its summary in `index.html` MUST change too — same commit.
- **One giant doc.** Split per area; the rollup gives the single-page view if the user wants it.
- **Overriding the color or font tokens per-doc.** Tokens are repo-wide. If the palette feels off for one doc, the palette is the bug — change it once in the starter and let `sync` propagate.
- **Shipping an empty `<figure class="diagram">` placeholder.** If you don't have a real picture, delete the figure. An empty box is worse than no box.
- **Diagrams that restate a list.** Three labeled boxes connected by arrows must show a relationship a bulleted list can't capture (order, branching, feedback). Otherwise it's noise.
- **Reaching for SVG when HTML would do.** A stack of labeled boxes is `.stack` / `.steps` HTML. SVG is for curves, arrowheads, lifelines, state transitions — things HTML can't express cleanly. Don't pay the SVG tax (text in `<text>` nodes, viewBox math, no copy/paste) for a layered architecture or a numbered linear flow.
- **Re-asking the theme question.** The theme prompt is first-scaffold-only — subsequent docs follow the convention `docs/index.html` already established.
