Codify the project's visual language as a marker-bounded `DESIGN.md` and render an interactive HTML showroom, using the `design` skill.

## Usage

`/design $ARGUMENTS`

- **No args** → bootstrap mode. Look at the conversation context for input: a pasted screenshot, an HTML paste, a URL, or a verbal brief. If multiple input modes are present, ask which to use. Creates `DESIGN.md` at the project root and the showroom at `docs/design/index.html`.
- **`refine "<change>"`** → surgical edit mode. Identify which of the five sections (`atmosphere`, `colors`, `typography`, `components`, `layout`) the change belongs to, then update only that section via the marker engine. Examples:
  - `/design refine "muted accent, like #C2664D"` → updates `colors`
  - `/design refine "switch headlines to a slab serif"` → updates `typography`
  - `/design refine "tighter 600px content column"` → updates `layout`

## Steps

1. **Detect mode.** If args start with `refine`, route to refine. Otherwise bootstrap.
2. **Invoke the `design` skill** — it owns the voice rules, section structure, and marker engine wiring.
3. **For bootstrap:**
   - Confirm input mode (screenshot, HTML, URL, brief) before writing.
   - Copy `.aikit/templates/design/starter-DESIGN.md` to `DESIGN.md` at project root.
   - Fill each of the five sections via `writeSection` from `src/render/markers.ts`, respecting voice rules (hex codes in `code` ticks; descriptive language; no Tailwind jargon).
   - Copy `.aikit/templates/design/template.html` to `docs/design/index.html`.
   - Report both paths.
4. **For refine:**
   - Read the targeted section with `readSection(content, "<id>", "DESIGN.md")`.
   - Synthesize the new body; apply voice rules.
   - Write back with `writeSection`. Do not touch the other four sections.
   - Confirm which section changed; report the diff.
5. **Refuse cleanly** if `DESIGN.md` exists but has no markers (offer to re-bootstrap with `AskUserQuestion`), or if refine is called and no `DESIGN.md` exists yet.

## Fallback

If `.aikit/templates/design/` is missing (project synced before this kit version), run `aikit add design` to install companion artifacts, or `aikit sync` if the skill is already opted in.
