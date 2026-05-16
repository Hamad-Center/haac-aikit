---
name: requesting-code-review
description: Use when the user says "review this", "can you review", "ready for review", or after completing a feature/fix/refactor and before opening a PR. Dispatches a review subagent via the `Task` tool with diff + intent + intentional tradeoffs so the review surfaces real issues rather than generic style nits.
version: "1.0.0"
source: obra/superpowers
license: MIT
allowed-tools:
  - Task
  - Read
  - Bash(git diff:*)
  - Bash(git log:*)
---

## When to use
- After completing a feature, fix, or refactor
- Before creating a PR
- When the human says "review this"

## Review request format

Dispatch via the `Task` tool with `subagent_type: "general-purpose"` (or a project-specific review agent if one is shipped). Brief the subagent with:

```
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

## Anti-patterns
- **Asking for review without naming intentional tradeoffs.** The reviewer flags deliberate choices, you waste cycles defending them. Name the tradeoffs upfront.
- **Pasting the whole diff without a one-line "what this change does".** The reviewer has to reverse-engineer intent. State the intent first.
- **Marking findings "resolved" without making the change.** Every resolution must point at a commit or an explicit explanation of why it's intentional.
- **Requesting review on unverified code.** Run tests + `verification-before-completion` first. Review is for design and quality, not "does it compile".

Prerequisite: `verification-before-completion`. Follow-up: `writing-commits` (if review surfaced changes), then opening the PR.
