---
name: design
description: Use when the user types "/design", asks to "codify the design system", "build a DESIGN.md", "set up the visual language", or pastes a screenshot/HTML/URL asking the AI to extract a design contract. Bootstraps a project-root `DESIGN.md` with five marker-bounded sections (atmosphere, colors, typography, components, layout) and renders an interactive HTML showroom for review and in-browser tweaking. Subcommand `/design refine "<change>"` updates one section without touching the rest.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Edit
  - Write
  - AskUserQuestion
  - WebFetch
  - Bash(date:*)
---

## When to use

- User runs `/design` explicitly to bootstrap a design contract for the project.
- User pastes a screenshot, HTML, or URL and asks the AI to "extract the design language" or "match this style."
- User runs `/design refine "<change>"` to update one section of an existing `DESIGN.md` without disturbing the rest.
- The project's UI surface is being established or revamped and you want every AI tool reading the same source of truth.

Do **not** use for:

- Pure backend / CLI / data projects with no visual surface — `/design` is opt-in for a reason. Suggest the user skip it.
- Asking the AI to *implement* a redesign — that's a follow-up step. `/design` codifies; building from the contract is a separate task.

## What the skill produces

```
DESIGN.md                    ← marker-bounded contract (the source of truth)
docs/design/index.html       ← interactive showroom (renders DESIGN.md visually)
.aikit/templates/design/     ← installed by aikit add design (the starter + showroom template)
```

`DESIGN.md` sits at the project root so every AI tool — Claude Code, Cursor, Copilot, etc. — picks it up alongside `AGENTS.md`.

## The five sections (do not rename)

Each section is wrapped in `<!-- BEGIN:haac-aikit:section:<id> --> … <!-- END:haac-aikit:section:<id> -->` markers. **The section IDs are stable across edits** — they are what `readSection` / `writeSection` use to surgically replace one block without touching the others.

| Section ID | Contents |
|---|---|
| `atmosphere` | One paragraph capturing the overall mood. Adjectives, not jargon. "Quiet, ivory, serif headlines, hand-set." |
| `colors` | Palette as a Markdown table or list with **hex codes in inline `code` ticks**. Each color labeled by role (background, ink, accent, etc.) and described in plain language. |
| `typography` | Typefaces, weights, scale. Mention the font stacks explicitly. Note when something is intentionally serif/mono. |
| `components` | Key UI primitives (buttons, cards, inputs, etc.) — describe shape, border weight, hover/active states. |
| `layout` | Spacing rhythm, container widths, grid columns, breakpoints. |

## Voice rules (the load-bearing part)

These rules exist because tools that *read* `DESIGN.md` need unambiguous instructions. Tailwind class names, design-token aliases, and framework jargon all leak abstraction the reader cannot resolve.

### YOU MUST

- **Quote every color as a hex code in inline `code` ticks.** Example: `the accent is \`#D97757\` — a warm terracotta clay`. The showroom uses these hex codes to bind color pickers; framework token names will not be detected.
- **Use descriptive language alongside hex.** Not just `#D97757`, but `#D97757 — a warm terracotta clay`. A reader without the showroom open should be able to picture the color.
- **Name typefaces explicitly with their full font stack.** `ui-serif, Georgia, "Times New Roman", serif` — not just "serif" or "default."
- **Describe layout numerically.** `672px content column with 24px gutters`, not "comfortable reading width."

### YOU MUST NOT

- **Use Tailwind class names in the reading path.** Never write `bg-clay-500`, `text-slate-700`, `rounded-lg`. The contract reads like a design *document*, not implementation. (Mentioning Tailwind tokens *inside fenced code blocks as implementation examples* is fine — just not as the canonical description.)
- **Use design-token aliases as the source of truth.** `--color-primary-500` and `$accent-clay` are downstream artifacts. The hex code is the source.
- **Hand-wave with "modern", "clean", "minimalist".** These adjectives describe a category, not this project. Replace with specifics: "ivory background, no shadows, hairline borders."
- **Reference outside design systems.** "Like Stripe" or "iOS-style cards" leaks an obligation to keep up with someone else's evolution. State the rule directly.

## Bootstrap flow

When the user invokes `/design` without arguments, or asks to set up a design system from scratch, drive this sequence:

1. **Detect input mode.** Look for:
   - A screenshot pasted in the conversation → image input
   - A URL → fetch and inspect HTML/CSS
   - HTML pasted directly → parse for color, font, layout cues
   - Pure brief ("warm, serif, ivory-and-terracotta") → synthesize from words

2. **Confirm gaps before writing.** If the input only specifies colors and atmosphere, ask the user about typography and components before guessing. Use `AskUserQuestion`. Don't invent five sections of opinion from a single sentence.

3. **Copy `starter-DESIGN.md` from `.aikit/templates/design/` to project root** as `DESIGN.md`. The starter has all five marker-bounded sections with placeholder content the AI then fills.

4. **Fill each section with `writeSection` from `src/render/markers.ts`**. This preserves the markers and lets future `/design refine` commands work surgically.

5. **Render the showroom.** Copy `template.html` from `.aikit/templates/design/` to `docs/design/index.html`. The template's JavaScript reads `DESIGN.md` data attributes and binds the live color pickers / font dropdowns.

6. **Report what shipped.** Show the path to both files and the install command if any companion artifacts need re-syncing.

## Refine subcommand

`/design refine "<change>"` is the surgical edit path. Examples:

- `/design refine "make the accent more muted, like #C2664D"` → updates only the `colors` section
- `/design refine "switch the headline typeface to a slab serif"` → updates only the `typography` section
- `/design refine "tighten the layout — 600px column"` → updates only the `layout` section

Implementation:

1. Read current `DESIGN.md` from project root with `readSection(content, "<id>", filePath)`.
2. Synthesize the new body for the targeted section, applying voice rules.
3. Write back with `writeSection(content, "<id>", newBody, filePath)`.
4. Confirm to the user which section changed; do not touch the others.

**Refine never re-runs bootstrap.** If the user asks for a refine but no `DESIGN.md` exists, abort and suggest `/design` (no arguments) to bootstrap first.

## Showroom template behaviors

The HTML showroom (`docs/design/index.html`) is **self-contained** — no CDN, no build step, no dependencies. Level-2 interactivity:

- **Color pickers** — every hex code in `code` ticks inside the `colors` section gets a sibling `<input type="color">` bound to a CSS custom property on a `.preview-stage` element. Changing the picker live-updates a sample of components rendered with that palette.
- **Font dropdowns** — the `typography` section's fonts are switchable via dropdowns whose options come from a curated specimen list. Each swap re-renders a sample paragraph live.
- **Copy Markdown** — a button at the top serializes the current showroom state back into a Markdown fragment the user can paste into `/design refine "..."`. This closes the loop: visual tweaks become specifications.
- **Light/dark toggle** — flips the `.preview-stage` between two CSS custom-property sets so designers can audit both modes without leaving the page.
- **No CDN, no build.** All JS inline. All CSS inline. The file opens off disk and works offline.

## Failure modes

- **DESIGN.md exists but has no markers.** Refuse to refine — the marker engine requires them. Offer to overwrite with the marker-bounded starter (`AskUserQuestion`).
- **Two sections share the same ID.** `validateSectionId` will reject this at write time. Repair by reading the content, choosing which copy is canonical, deleting duplicates manually.
- **Showroom template missing from `.aikit/templates/design/`.** Run `aikit add design` to install companion artifacts.

## Why this skill is opt-in (tier2)

Not every project has a visual surface. Backend services, CLI tools, and pipelines have no design language to codify, and shipping `/design` as tier1 would mean every user pays its context cost regardless of fit. Tier2 means a single `aikit add design` for projects that want it; the rest never load the skill.
