---
name: requesting-code-review
description: Use when implementation is complete and ready for review. Dispatches a code-reviewer subagent with precise context about what changed, what was intentional, and what to focus on. Produces actionable review feedback rather than generic observations.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- After completing a feature, fix, or refactor
- Before creating a PR
- When the human says "review this"

## Review request format

```
Dispatching code-reviewer with context:
- Files changed: [list]
- What the change does: [1-2 sentences]
- Intentional tradeoffs: [list things reviewer might question but were deliberate]
- Focus areas: [specific concerns, or "general review"]
- Constraints: [test coverage requirement, performance budget, etc.]
```

## What to provide to the reviewer

1. **The diff** — `git diff main...HEAD` or the specific files
2. **The context** — why this change was made (not what it does — the diff shows that)
3. **Exclusions** — "ignore the formatting changes in X; those are auto-generated"
4. **Decision log** — "I chose approach A over B because..."

## What to do with review output

- For each finding: acknowledge, then either fix + confirm fix, or explain why it's intentional
- Do not mark a finding as resolved without making the change
- Do not argue with findings — if you disagree, say so once and defer to the human's judgment
- Implement all agreed-upon changes before claiming review is addressed
