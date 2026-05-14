---
name: directions
description: Use when the user is exploring visual options for a UI surface and wants 2-4 design directions rendered side-by-side on a single self-contained HTML page they can scan, A/B compare on light/dark, and commit to the project's exploration log. Generates one HTML file per exploration under `docs/directions/YYYY-MM-DD-<slug>.html`. Opt-in only — do not invoke without user request.
version: "1.0.0"
source: haac-aikit
license: MIT
---

## When to use

Explicit invocation only: `/directions <surface>`, "use the directions skill", "show me design directions for X", "explore visual options for the empty state / hero / dashboard card".

Do **not** invoke proactively. This is divergent-exploration tooling — the user picks the moment they want options laid out. Silent generation creates noise and surprise files.

## What this skill is for (and what it isn't)

- **It is for**: rendering 2-4 visual *takes* on the same surface side by side so a human can pick by looking, not by reading.
- **It isn't for**: choosing between technical options (use `/decide`), writing a sequenced build plan (use `/roadmap`), or producing a finished design system page (use `/docs`).

The output is one HTML page; each variant is rendered live on its own "stage". The user picks one, mixes traits, or asks for round two.

## Structure of a directions page

Every page has the same five blocks. Order is load-bearing — first paint must let the reader see the variants without scrolling past explanations.

1. **Sticky toolbar** — light/dark toggle (and optional density/locale toggles). Variants must hold up on both surfaces; the toggle is how reviewers check.
2. **Page header** — eyebrow + h1 + a `prompt-box` echoing the user's original ask, so the page carries its own provenance.
3. **Artboard grid (2-4 cards)** — one card per variant. Each card has:
   - A monospace tag (e.g. `A — Minimal`, `B — Illustrated`).
   - A `stage` element with the variant rendered live (real HTML/CSS, not screenshots, not descriptions).
   - A one-paragraph `rationale` below the stage: what this direction emphasizes and when it's the right choice.
4. **Comparison row (optional)** — small chip grid or table summarizing the dimensions that matter (density, tone, motion, accessibility load).
5. **Pick guidance** — a short closing aside: "Pick A if X, pick B if Y. Mix A's typography with C's illustration if you want Z."

## Output

- Path: `docs/directions/YYYY-MM-DD-<slug>.html` (today's date, kebab-case slug from the surface name).
- Template: `.aikit/templates/directions/template.html` — read first, copy structure verbatim, fill placeholders.
- Self-contained: pure HTML/CSS/JS, no CDNs, no build step.
- Committed to git (permanent exploration log — round two often references round one).

## Variant rules (non-negotiable)

- **Render, don't describe.** Each variant must actually display — typography, colors, layout, motion if relevant. A wall of bullet points describing the variant defeats the point of the skill.
- **Theme-aware.** Variants use CSS custom properties scoped under `.stage`; `.stage.dark` flips the theme tokens. The toolbar's light/dark toggle just swaps a class.
- **Real content, not lorem.** Use the user's domain language ("New task", "Inbox empty", "No projects yet") so the comparison is meaningful.
- **2-4 variants.** Three is the sweet spot. One isn't an exploration; five becomes a catalog.
- **Each variant gets a one-word personality.** `Minimal`, `Illustrated`, `Playful`, `Instructional`, `Editorial`, `Technical`. The personality tag is the shortcut a reviewer uses to talk about it.

## Voice rule for rationale paragraphs

- One sentence on what the direction emphasizes.
- One sentence on when it's the right choice (the user persona or context it serves).
- Optionally one sentence on its tradeoff.
- Plain-language verbs, concrete objects. *"A small spot illustration anchors the eye and explains the object model"* beats *"Leverages illustration to communicate information architecture"*.

## A11y baseline (every directions page)

- `<title>`, exactly one `<h1>`, heading hierarchy never skips levels.
- Landmark roles: `<main>` for the artboard grid, the toolbar is a sticky `<nav>` or unstyled `<div>` with explicit `role` only if needed.
- Color contrast ≥ 4.5:1 for body text on both light and dark surfaces — design tokens already meet this; don't override per-variant.
- Inline SVG illustrations get `aria-hidden="true"` if purely decorative; meaningful diagrams get `<title>` + `aria-labelledby`.
- The light/dark toggle uses native radio inputs (already in the template) — don't replace with custom toggles that break keyboard navigation.

## Anti-patterns

- **Describing variants instead of rendering them.** This is the single most common failure. If a variant is "a card with a softer feel", that's a description — write the CSS that makes it softer and show it.
- **More than 4 variants.** Past four, the page becomes hard to scan and impossible to mentally diff. Pre-narrow.
- **Variants that are too similar.** A 1px font-size change isn't a direction; it's a tweak. Each direction should differ in *strategy* (typography-led, illustration-led, motion-led, density-led, etc.).
- **Silent generation.** Opt-in only. Wait for explicit `/directions`.
- **Skipping the date in the filename.** The directions log sorts chronologically; round-two filenames reference round-one slugs.
- **CDN dependencies.** The page must render offline. No `<link rel="stylesheet" href="https://...">`, no remote fonts (system stacks only).
