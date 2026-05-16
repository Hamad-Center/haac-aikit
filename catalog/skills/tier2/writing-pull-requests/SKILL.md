---
name: writing-pull-requests
description: Use when the user says "create a PR", "open a PR", "/ship", "/commit-push-pr", or after `finishing-a-development-branch` confirms the branch is ready. Produces a <70-char Conventional Commits title and a Summary + Test plan body via `gh pr create`.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Bash(gh:*)
  - Bash(git:*)
  - Read
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
2. `gh pr list --head "$(git branch --show-current)" --state open` — confirm no duplicate open PR
3. CI is green on the branch (check with `gh pr checks`)

## Anti-patterns
- **Title > 70 chars.** GitHub truncates in the UI; reviewers can't scan.
- **Body as a prose paragraph instead of bullets.** Bullets force you to extract the load-bearing facts; prose hides them.
- **Test plan that just says "all tests pass".** That's a result, not a plan. The reviewer needs to know *how to verify* — specific commands, manual steps.
- **Including the full commit history in the body.** GitHub already shows commits; the body is for what's not in the commits.
- **Force-pushing after CI passes to "clean up" history.** Invalidates the green check; reviewers re-run from zero.

See `finishing-a-development-branch` for the pre-PR rebase / clean-diff checks.
