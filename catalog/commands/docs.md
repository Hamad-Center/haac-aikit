Update the project's HTML documentation in `docs/` using the `docs` skill.

## Usage
`/docs [optional intent]`

With args: use them as the change to document (e.g. `/docs the new auth refresh flow`).
Without args: infer from the last 5-10 turns of conversation what's worth documenting.

## Steps

1. **Decide what changed.** Identify (a) the doc file (`docs/<slug>.html`) and (b) the section id inside it (`overview`, `flow`, `gotchas`, etc). If no doc fits, propose creating one.

2. **Read only the affected section.** Use `readSection(content, id, filePath)` from `src/render/markers` — never load the whole file.

3. **Propose before writing.** One sentence in chat:
   > *"I'll update `<section>` in `docs/<file>.html` to reflect <change>. Okay?"*
   Wait for explicit yes. No silent edits.

4. **Write through the marker engine.** `writeSection` to replace, `appendSection` for new sections. Anything outside markers is preserved verbatim.

5. **Update `docs/index.html`** if you created a new doc or materially changed an existing one — refresh the matching `summary-<slug>` section.

6. **Report.** Print the modified file paths and one-line summary of what changed.

## Fallback

If `.aikit/templates/docs/starter.html` is missing (project synced before this kit version), run `aikit sync` first.
