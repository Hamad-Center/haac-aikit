---
name: decide
description: Use when the user is about to make a non-trivial choice with 2-4 viable options and wants the tradeoffs visualized as a single rich HTML page they can scan, share, and commit to the project's decision log. Generates one self-contained HTML file per decision under `docs/decisions/YYYY-MM-DD-<slug>.html`. Opt-in only — do not invoke without user request.
version: "1.0.0"
source: haac-aikit
license: MIT
---

## When to use

Explicit invocation only: `/decide <topic>`, "use the decide skill", "make me a decision page on X".

Do not invoke proactively. The user picks the moment they need a tradeoff laid out — silent generation creates noise.

## Structure of a decision page

Every page has the same five blocks. Order matters: decision-makers should never have to scroll to find what they're approving.

1. **Decision needed callout** — the question in one sentence at the top. Recommended option marked with `★`.
2. **Option cards (2-4)** — each card has: title, one-line summary, pros (olive dots), cons (clay dots), how-it-works in 2-3 plain-language sentences.
3. **Comparison row** — a small table or chip grid putting the options side by side on the dimensions that matter (cost, complexity, reversibility, performance — pick what's relevant).
4. **Technical bit, explained 15-year-old simple** — one paragraph per option. Plain verbs + concrete objects. Jargon goes in `<code>` chips, not the reading path.
5. **Recommendation + reasoning** — clay-bordered callout. State the pick, the one-sentence reason, the conditions under which the recommendation flips.

## Output

- Path: `docs/decisions/YYYY-MM-DD-<slug>.html` (today's date, kebab-case slug from the topic)
- Template: `.aikit/templates/decide/template.html` — read first, copy structure verbatim, fill placeholders
- Self-contained: pure HTML/CSS, no CDNs, no build step
- Committed to git (permanent decision log)

## Voice rule (non-negotiable)

- One concept per sentence.
- Plain-language verb + concrete object: *"Load images only when the reader scrolls to them"* beats *"Implement lazy-loading via IntersectionObserver."*
- Jargon lives in `<code>` chips or collapsed `<details>`, never in main prose.
- Concrete first, abstract term in parens: *"Make sure failed requests retry safely (idempotent)"*.

## A11y baseline (every decision page)

- `<title>`, exactly one `<h1>`, heading hierarchy never skips levels.
- Landmarks: `<main>`, `<nav>` if linking to other decisions, `<aside>` for the recommendation callout.
- Color contrast ≥ 4.5:1 for body text — design tokens already meet this; don't override.
- Inline SVG diagrams get `<title>` + `aria-labelledby`. Decorative icons get `aria-hidden="true"`.

## Anti-patterns

- **More than 4 options.** Decision pages with 5+ options become catalogs; pre-narrow the field.
- **Recommendation buried below the fold.** First paint must show the recommendation.
- **Jargon-heavy prose.** If a non-technical stakeholder can't read it, rewrite it.
- **Silent generation.** This skill is opt-in. Wait for explicit `/decide`.
- **Skipping the date in the filename.** The decision log sorts chronologically; dates are required.
