Generate a single rich HTML decision page using the `decide` skill.

## Usage
`/decide <topic>`

Example: `/decide auth strategy: session cookies vs JWT vs Clerk`.

## Steps

1. **Confirm the options** with the user before writing. Say back: *"Decision page on `<topic>` with options `A`, `B`, `C` — okay? My pick will be `<X>` because `<one-sentence reason>`."* Wait for yes.

2. **Read the template** at `.aikit/templates/decide/template.html`. Copy its structure verbatim — design tokens, layout grid, callout patterns, voice + a11y conventions.

3. **Gather concrete inputs** for each option: real cost numbers, real performance figures, real code snippets if relevant. Don't fill cards with hand-waved pros/cons — use facts.

4. **Apply the voice rule** when writing prose: plain-language verb + concrete object, jargon in `<code>` chips not the reading path. Explain the technical bit like the reader is 15.

5. **Write the file** to `docs/decisions/YYYY-MM-DD-<slug>.html` (today's date, kebab-case slug).

6. **Report.** Print the file path and suggest `open docs/decisions/YYYY-MM-DD-<slug>.html` (macOS) / `xdg-open` (Linux).

## Fallback

If `.aikit/templates/decide/template.html` is missing, run `aikit sync` first.
