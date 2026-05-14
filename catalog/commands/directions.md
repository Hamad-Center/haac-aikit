Render 2-4 visual design directions on a single self-contained HTML page using the `directions` skill.

## Usage
`/directions <surface>`

Examples:
- `/directions empty state for the projects view`
- `/directions hero section for the marketing landing`
- `/directions dashboard card — three density options`

## Steps

1. **Confirm the brief** with the user before writing. Say back: *"Directions page for `<surface>` with `<N>` variants emphasizing `<axes>` (e.g. minimal · illustrated · instructional). I'll render each live on light and dark stages. Okay?"* Wait for yes.

2. **Read the template** at `.aikit/templates/directions/template.html`. Copy its structure verbatim — design tokens, sticky toolbar, artboard grid, light/dark stage flip.

3. **Pick variants that differ in strategy, not detail.** Each direction should have a one-word personality (`Minimal`, `Illustrated`, `Playful`, `Instructional`, `Editorial`, `Technical`). A 1px font tweak isn't a direction.

4. **Render, don't describe.** Each variant's stage must contain real HTML/CSS that actually displays the design. A wall of bullet points describing the variant defeats the skill.

5. **Use the user's domain language.** Real copy ("New task", "No projects yet"), not lorem ipsum.

6. **Write the file** to `docs/directions/YYYY-MM-DD-<slug>.html` (today's date, kebab-case slug from the surface).

7. **Report.** Print the file path and suggest `open docs/directions/YYYY-MM-DD-<slug>.html` (macOS) / `xdg-open` (Linux). One-sentence summary of what each variant emphasizes.

## Fallback

If `.aikit/templates/directions/template.html` is missing, run `aikit sync` first.
