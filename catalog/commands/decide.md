Generate a single rich HTML decision page using the `decide` skill.

## Usage
`/decide $ARGUMENTS`

`$ARGUMENTS` is the decision topic + options (e.g. `auth strategy: session cookies vs JWT vs Clerk`).

## Steps
1. **Confirm the options** with the user before writing. Say back: *"Decision page on `<topic>` with options `A`, `B`, `C` — okay? My pick will be `<X>` because `<one-sentence reason>`."* Wait for yes.
2. **Invoke the `decide` skill** — it loads `.aikit/templates/decide/template.html`, design tokens, voice rules, and a11y baseline.
3. **Write** to `docs/decisions/YYYY-MM-DD-<slug>.html` (use `date +%Y-%m-%d` for local-zone date).
4. **Report** the file path; suggest `open` (macOS) / `xdg-open` (Linux).

## Fallback
If `.aikit/templates/decide/template.html` is missing, run `aikit sync` first.
