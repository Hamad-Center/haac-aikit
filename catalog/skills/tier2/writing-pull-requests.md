---
name: writing-pull-requests
description: Use when creating a pull request. Produces a PR title under 70 characters and a body with Summary and Test Plan sections that give reviewers everything they need without having to read the full diff.
version: "1.0.0"
source: haac-aikit
license: MIT
---

## When to use
- After finishing a branch and all tests pass
- When the human says "create a PR" or "open a PR"

## PR format

```bash
gh pr create --title "<type>(scope): short description" --body "$(cat <<'EOF'
## Summary
- [What changed — bullet per logical unit]
- [Why it was needed]
- [Any breaking changes or migration steps]

## Test plan
- [ ] [How to verify behaviour 1]
- [ ] [How to verify behaviour 2]
- [ ] Full suite: `npm test` passes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Title rules
- ≤70 characters
- Conventional Commits format: `type(scope): description`
- Imperative mood: "add auth middleware", not "added" or "adds"
- Describes the change, not the solution: "fix session expiry bug", not "fix tokenStore.refresh logic"

## Body rules
- Summary is bullets — not prose paragraphs
- Test plan is a checklist the reviewer can actually run
- Include migration steps if there are schema changes, config changes, or required env vars
- Do not include the full commit history or a timeline of how you got here

## Pre-create checklist
1. `git log main...HEAD --oneline` — confirm commits are clean
2. `gh pr list --head $(git branch --show-current)` — confirm no duplicate PR
3. CI is green on the branch (check with `gh pr checks`)
