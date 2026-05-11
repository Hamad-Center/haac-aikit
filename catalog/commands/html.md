Generate an HTML artifact for the current context using the html-artifacts skill.

## Usage
`/html [optional intent]`

## Steps

1. **Determine intent**
   - If called with args (e.g. `/html code review of today's PR`): use the args as the intent.
   - If called with no args: infer intent from the current conversation — what task is in progress, what was just discussed, what files are open.

2. **Pick the use-case pattern**
   Using the `html-artifacts` skill, identify which of the five patterns fits:
   Spec/Planning, Code Review, Report/Research, Prototype, or Custom Editor.

3. **Generate the artifact**
   - Apply the built-in design system CSS tokens
   - If `docs/aikit-html-design-system.html` exists in the project, read it first and inherit its CSS variable values
   - Follow the structure guidance for the chosen pattern
   - Pure HTML/CSS/JS only — no external CDN dependencies

4. **Save and report**
   - Determine a short slug from the intent (e.g. `code-review-auth-pr`, `weekly-report`)
   - Save to `.aikit/artifacts/<slug>-<timestamp>.html`
   - Print the full path
   - Suggest opening: `open <path>` (macOS) / `xdg-open <path>` (Linux)
