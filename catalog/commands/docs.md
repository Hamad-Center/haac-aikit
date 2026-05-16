Update the project's HTML documentation in `docs/` using the `docs` skill.

## Usage
`/docs $ARGUMENTS`

`$ARGUMENTS` is the change to document (e.g. `the new auth refresh flow`). Without args, infer from the last 5-10 turns of conversation.

## Steps
1. **Decide what changed.** Identify (a) the doc file (`docs/<slug>.html`) and (b) the section id inside it (`overview`, `flow`, `gotchas`, etc). If no doc fits, propose creating one.
2. **Invoke the `docs` skill** — it owns the section-scoped read/write helpers, theme prompts, diagram taxonomy, and starter-template fallback.
3. **Propose before writing.** One sentence in chat:
   > *"I'll update `<section>` in `docs/<file>.html` to reflect <change>. Okay?"*
   Wait for explicit yes. No silent edits.
4. **Write through the marker engine** — anything outside `<!-- BEGIN:haac-aikit:section:<id> -->` markers is preserved verbatim.
5. **Update `docs/index.html`** if you changed any `summary-<slug>` section content or created a new `docs/<slug>.html` file.
6. **Report** modified file paths + one-line summary of what changed.

## Fallback
If `.aikit/templates/docs/starter.html` is missing (project synced before this kit version), run `aikit sync` first.
