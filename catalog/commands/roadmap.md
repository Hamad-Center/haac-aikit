Generate a thorough single-page implementation roadmap as HTML using the `roadmap` skill.

## Usage
`/roadmap $ARGUMENTS`

`$ARGUMENTS` is the feature (e.g. `comment threads on task cards`, `migrate session store from cookies to Redis`).

## Steps
1. **Confirm the shape** with the user before writing. Say back:
   - *Roadmap for `<feature>`.*
   - *I'll lay out `~<N>` milestones, a data-flow diagram, mockups of `<surfaces>`, code for the migration and the `<key piece>`, and a risk table.*
   - *Anything to change before I write?*
   Wait for yes.
2. **Invoke the `roadmap` skill** — it owns template loading, the eight-section structure, mockup-as-HTML rules, code-block sizing, and open-questions enforcement.
3. **Gather concrete inputs**: real package/file names, real effort estimates, real risks. If you don't know a number, ask — don't invent one.
4. **Write** to `docs/roadmaps/YYYY-MM-DD-<slug>.html` (use `date +%Y-%m-%d` for local-zone date).
5. **Report** the file path + one-sentence summary of milestone count, surfaces touched, and severity-high risks.

## Fallback
If `.aikit/templates/roadmap/template.html` is missing, run `aikit sync` first.
