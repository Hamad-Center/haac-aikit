Generate a thorough single-page implementation roadmap as HTML using the `roadmap` skill.

## Usage
`/roadmap <feature>`

Examples:
- `/roadmap comment threads on task cards`
- `/roadmap migrate session store from cookies to Redis`
- `/roadmap add real-time presence to the editor`

## Steps

1. **Confirm the shape** with the user before writing. Say back: *"Roadmap for `<feature>`. I'll lay out ~`<N>` milestones, a data-flow diagram, mockups of `<surfaces>`, code for the migration and the `<key piece>`, and a risk table. Anything I should change before I write?"* Wait for yes.

2. **Read the template** at `.aikit/templates/roadmap/template.html`. Copy its structure verbatim — design tokens, summary strip, milestone timeline, SVG diagram pattern, mockup grid, code panel, risk table, open-questions callouts.

3. **Gather concrete inputs**: real package/file names, real effort estimates, real risks. If you don't know a number, ask — don't invent one.

4. **Render mockups as HTML**, not screenshots. Use the project's real domain language and component names.

5. **Code blocks are illustrative.** 15-30 lines of the load-bearing logic per block (migration + the optimistic mutation, say). Don't dump entire files.

6. **Every roadmap needs at least one open question.** If you genuinely can't think of one, state explicitly *why* the design is fully settled in a one-sentence aside.

7. **Write the file** to `docs/roadmaps/YYYY-MM-DD-<slug>.html` (today's date, kebab-case slug from the feature).

8. **Report.** Print the file path and suggest `open docs/roadmaps/YYYY-MM-DD-<slug>.html` (macOS) / `xdg-open` (Linux). One-sentence summary of milestone count, surfaces touched, and severity-high risks.

## Fallback

If `.aikit/templates/roadmap/template.html` is missing, run `aikit sync` first.
