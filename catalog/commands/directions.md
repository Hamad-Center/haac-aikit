Render 2-4 visual design directions on a single self-contained HTML page using the `directions` skill.

## Usage
`/directions $ARGUMENTS`

`$ARGUMENTS` is the surface to design (e.g. `empty state for the projects view`, `hero section for the marketing landing`).

## Steps
1. **Confirm the brief** with the user before writing. Say back: *"Directions page for `<surface>` with `<N>` variants emphasizing `<axes>` (e.g. minimal · illustrated · instructional). I'll render each live on light and dark stages. Okay?"* Wait for yes.
2. **Invoke the `directions` skill** — it owns template loading, the one-word personality vocabulary, the variant-strategy rules, and the domain-language requirement.
3. **Preserve dark-mode tokens.** The template ships light + dark CSS — do not strip the `:where(:root[data-theme="dark"])` rules.
4. **Write** to `docs/directions/YYYY-MM-DD-<slug>.html` (use `date +%Y-%m-%d` for local-zone date).
5. **Report** the file path + one-sentence summary of what each variant emphasizes.

## Fallback
If `.aikit/templates/directions/template.html` is missing, run `aikit sync` first.
