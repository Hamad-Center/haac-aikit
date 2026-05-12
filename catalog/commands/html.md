Generate an HTML artifact for the current context using the html-artifacts skill.

## Usage
`/html [optional intent]`

## Steps

1. **Determine intent**
   - If called with args (e.g. `/html code review of today's PR`): use the args as the intent.
   - If called with no args: infer intent from the current conversation — what task is in progress, what was just discussed, what files are open.

2. **Pick the use-case pattern**
   Using the `html-artifacts` skill, identify which of the eight patterns fits:
   Spec/Planning, Code Review, Report/Research, Prototype, Custom Editor, Visual Explainer, Deck, or Design System.

3. **Generate the artifact**
   - Apply the built-in design system CSS tokens
   - If `docs/aikit-html-design-system.html` exists in the project, read it first and inherit its CSS variable values
   - Follow the structure guidance for the chosen pattern
   - Pure HTML/CSS/JS only — no external CDN dependencies
   - Include in `<head>`: `<title>`, `<meta name="description" content="...">`, and `<meta name="aikit-pattern" content="...">` (the pattern name from step 2) — required for the index

4. **Save and report**
   - Determine a short slug from the intent (e.g. `code-review-auth-pr`, `weekly-report`)
   - Determine `NN` by listing existing files in `.aikit/artifacts/` (excluding `index.html`) and incrementing the highest number; start at `01`
   - Save to `.aikit/artifacts/NN-<slug>.html` (e.g. `07-code-review-auth-pr.html`)
   - Regenerate `.aikit/artifacts/index.html` per the "Index page (gallery)" section of the `html-artifacts` skill
   - Print both paths
   - Suggest opening: `open .aikit/artifacts/index.html` (macOS) / `xdg-open .aikit/artifacts/index.html` (Linux)
