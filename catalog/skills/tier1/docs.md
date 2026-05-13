---
name: docs
description: Use when the project's documentation is out of sync with the code or conversation just established a new architectural fact, feature, or gotcha worth recording. Maintains an HTML documentation tree at `docs/` — many small per-area files plus a rolled-up `docs/index.html`. Reads and writes single sections through marker-bounded `<!-- BEGIN:haac-aikit:section:<id> -->` blocks so updates are surgical and cheap.
version: "1.0.0"
source: haac-aikit
license: MIT
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

When a doc doesn't exist yet, scaffold from `.aikit/templates/docs/starter.html` (synced from the catalog). The starter has:

- Design tokens in `:root` (`--clay`, `--slate`, `--ivory`, `--oat`, `--olive`, `--gray-*`)
- Landmark roles (`<main>`, `<nav>`, `<aside>`)
- One example sectioned block to copy
- A11y baseline: `<title>`, heading hierarchy, native form controls only

Don't invent HTML structure from scratch — read the starter first.

## index.html maintenance

`docs/index.html` is the navigation hub. Each linked doc gets one summary card inside its own section:

```html
<!-- BEGIN:haac-aikit:section:summary-auth -->
<a href="auth.html"><h3>Authentication</h3>
<p>How sign-in, session, and token refresh work. 1-paragraph summary kept in sync with auth.html.</p></a>
<!-- END:haac-aikit:section:summary-auth -->
```

When you update `auth.html`'s overview, also update the matching `summary-auth` section in `index.html` so the rollup stays accurate.

## Visual content

HTML allows inline SVG diagrams, code samples, and graphs when they earn their weight. Default to prose; add a diagram only when it explains something prose can't (a flow, a topology, a sequence).

## Anti-patterns to avoid

- **Loading the whole file to edit one section.** Defeats the token-cost mitigation; always use `readSection` / `writeSection`.
- **Silent writes.** Every update gets one-sentence confirmation in chat first. Docs are project-facing; surprise edits erode trust.
- **Editing content outside the markers.** That's user-authored prose; preserve it verbatim.
- **Inventing HTML from scratch.** Read the starter template first.
- **Drifting `index.html`.** When a doc's purpose changes, its summary in `index.html` MUST change too — same commit.
- **One giant doc.** Split per area; the rollup gives the single-page view if the user wants it.
