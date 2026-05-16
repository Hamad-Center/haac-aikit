# Scoring rubric

Each criterion is **binary**. Score per scenario = `(criteria met / applicable criteria) × 100`.

| # | Criterion | Why it matters |
|---|---|---|
| 1 | Output contains all five sections by ID: `atmosphere`, `colors`, `typography`, `components`, `layout` | The `/design refine` subcommand depends on these IDs. Renaming or missing a section breaks future surgical edits. |
| 2 | Each section is wrapped in correct BEGIN/END markers: `<!-- BEGIN:haac-aikit:section:<id> -->` … `<!-- END:haac-aikit:section:<id> -->` | The marker engine matches by exact byte sequence. Anything outside markers is sacred. |
| 3 | Every color in the `colors` section has its hex code in inline `code` ticks (e.g., `` `#D97757` ``) | The showroom binds `<input type="color">` to hex codes parsed from `code` ticks. Bare hex or framework tokens (`bg-clay-500`) break the binding. |
| 4 | No Tailwind class names or design-token aliases in the reading path (`bg-blue-500`, `--color-primary-500`, `$accent`). Mentioning them inside fenced code blocks as implementation examples is allowed. | Tokens are downstream artifacts; the contract should describe the design, not the implementation. |
| 5 | Typography section names typefaces with full font stacks (e.g., `ui-serif, Georgia, "Times New Roman", serif`), not just "serif" or "sans" | A reader without the showroom open should be able to drop the stack into a stylesheet. |
| 6 | Layout section uses numerical specs (pixel widths, breakpoints, gaps) not adjectival hand-waving ("comfortable", "generous") | Layout decisions are quantitative; hand-waving leaks ambiguity. |
| 7 | Brief constraints honored — any negative constraint in the input ("no gray", "no shadows", "no gradients") is respected in the output | The freestyle baseline often adds excluded elements anyway. This is the most common gap. |

## Notes on scoring

- **Criterion 2 (markers)** is gated on criterion 1. If a section ID is wrong or missing, it can't satisfy markers either — score 0 for both.
- **Criterion 7 (brief adherence)** is N/A for scenarios with no negative constraints. Mark as such in the result; do not count toward denominator.
- **Strict reading** — borderline cases score 0. A section that says "use a serif typeface" without the full stack fails criterion 5, even though it's "almost right." The point is whether the AI's output is usable as-is.
