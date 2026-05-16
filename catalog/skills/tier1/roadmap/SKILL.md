---
name: roadmap
description: Use when the user types "/roadmap <feature>", "draw up a roadmap for X", or "give me a one-page implementation doc" — the approach is already settled and they want milestones + data-flow diagram + mockups + key code + risks + open questions on one committed HTML page. Output: `docs/roadmaps/YYYY-MM-DD-<slug>.html`. Opt-in only.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Write
  - Bash(date:*)
  - AskUserQuestion
---

## When to use

Explicit invocation only: `/roadmap <feature>`, "use the roadmap skill", "draw up a roadmap for X", "I want a one-page implementation doc for the new comments feature".

Do **not** invoke proactively. Roadmaps are committed artifacts — they go in git and get referenced in PRs. Surprise generation creates noise.

## Roadmap vs. adjacent skills

- **Use `/decide`** when you're picking *which* approach (option A vs B vs C). `/roadmap` assumes the approach is settled.
- **Use `/directions`** when you're exploring *visual* options. `/roadmap` is structural and engineering-facing.
- **Use `writing-plans`** when you want a text plan an AI agent will execute step by step. `/roadmap` is for humans — implementers reading on a phone, reviewers skimming on a Monday.
- **Use `/docs`** when the feature is already built and you're recording how it works for the team. `/roadmap` is forward-looking; `/docs` is backward-looking.

## Structure of a roadmap page

Every page has the same eight sections. Order matters: a phone reader scans top-to-bottom and should know the shape by the time they reach milestones.

1. **Header + prompt-box** — eyebrow + h1 + a `prompt-box` echoing the user's original ask, so the page carries its own provenance.
2. **Summary strip (4 cells)** — at-a-glance: `Effort` (e.g. `~2 weeks`), `Surfaces touched` (e.g. `3 packages`), one concrete unit (e.g. `New tables: 2`), and feature-flag/ramp identifier. These are the numbers a manager will quote in standup.
3. **Milestones** — vertical timeline with 3-5 slices. Each slice has a *when* (Week 1 · Mon–Tue), a dot (`done` filled, future hollow), a title, a one-paragraph description, and tag chips for packages/surfaces touched. Slices should be independently reviewable.
4. **Data flow** — inline SVG diagram. Boxes are components/services; arrows are calls; solid lines = request path, dashed clay = realtime/async/fan-out. Always include a one-line caption distinguishing the two.
5. **Mockups (2 panels)** — two mock cards in a 2-up grid showing the *most ambiguous surfaces* (the comment thread + the digest, the editor + the toast, etc.). Render as real HTML, not screenshots. These exist to lock down nesting, placement, and copy — not pixel-final.
6. **Key code** — two side-by-side code blocks for *the two pieces most likely to be done wrong* (e.g. the migration and the optimistic mutation). Syntax-highlighted via classed spans (`.kw`, `.str`, `.cm`, `.fn`). Don't dump entire files; show the load-bearing 15-30 lines.
7. **Risks & mitigations table** — three columns (Risk · Severity · Mitigation). Severity chips: `HIGH` clay-pink, `MED` oat, `LOW` olive-pale. Three rows max for v1; more becomes noise.
8. **Open questions** — clay-bordered callouts. Each: question title, one-paragraph context, owner line (`Decide with · design, before slice 2`). These force the document to admit what's unsettled.

## Output

- Path: `docs/roadmaps/YYYY-MM-DD-<slug>.html` (today's date, kebab-case slug from the feature).
- Template: `.aikit/templates/roadmap/template.html` — read first, copy structure verbatim, fill placeholders.
- Self-contained: pure HTML/CSS/SVG, no CDNs, no build step.
- Committed to git (permanent implementation record).

## Content rules (non-negotiable)

- **Concrete numbers, not vibes.** "~2 weeks" beats "moderate effort". "3 packages" beats "a few surfaces". If you don't have a number, ask the user — don't invent one.
- **Real package and file names** in tags and labels. `packages/db`, `apps/web`, `migration 0042`. Generic labels like `frontend` and `backend` are anti-signal.
- **Real risks, not platitudes.** "Realtime duplicate when socket append races the HTTP response" is a risk. "Things might be slow" is not. If you can't write the mitigation in one sentence, the risk isn't sharp enough.
- **Open questions are required.** Every non-trivial feature has at least one unsettled point. A roadmap with zero open questions is hiding something — flag it.
- **Code blocks are illustrative, not complete.** 15-30 lines of the load-bearing logic. Use ellipsis or comments for omitted boilerplate; the reader is a senior engineer, not a copy-paste consumer.

## Voice rule

- Plain-language verbs + concrete objects in body prose. *"Ship in four slices, each independently reviewable, each behind the flag"* beats *"Leverage a phased rollout strategy"*.
- Jargon lives in `<code>` chips or table cells, never in main body prose.
- Section intros are one sentence. The point of the artifact is the *content*, not the prose explaining the content.

## A11y baseline

- `<title>`, exactly one `<h1>`, heading hierarchy never skips levels.
- Each section gets `<section>` with an `aria-labelledby` linking to its heading.
- Inline SVG diagrams get `<title>` + `<desc>` and `aria-labelledby`; the caption underneath also describes the diagram in prose for screen readers.
- Severity chips have text content (`HIGH`, `MED`, `LOW`), not just color — color is reinforcement, never the only signal.
- Color contrast ≥ 4.5:1 — design tokens already meet this; don't override.

## Anti-patterns

- **One giant milestone.** If your timeline has a single 3-week slice, the artifact has no shape. Split into 3-5 reviewable pieces.
- **Mockups that are screenshots.** Render as HTML. Screenshots rot the moment a class name changes; HTML mocks update with the design system.
- **Code dumps.** A roadmap with 200 lines of code in one block is a draft PR, not a roadmap. Show only the parts most likely to be done wrong.
- **Risk table with HIGH for everything.** Severity loses meaning. If three risks are HIGH, the project shouldn't ship in the proposed shape — escalate instead.
- **Zero open questions.** No real feature has zero ambiguity. If the answer is genuinely "nothing unsettled", state that explicitly with one sentence on why ("All API contracts already exist; this is purely UI assembly").
- **Silent generation.** Opt-in only. Wait for explicit `/roadmap`.
