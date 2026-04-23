---
name: finishing-a-development-branch
description: Use when a feature or fix is complete and needs to be merged. Guides the merge/PR/cleanup decision tree to ensure branches land cleanly, CI passes, and the branch is removed after merging.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- "I think this is ready to merge"
- "How do I finish this branch?"
- After verification-before-completion confirms the implementation is correct

## Decision tree

### 1. Is the branch up to date with the base?
```bash
git fetch origin
git log HEAD..origin/main --oneline
```
If behind: `git rebase origin/main` (preferred over merge for feature branches).

### 2. Are all tests passing?
Run the full suite. If not: fix before merging.

### 3. Is the diff clean?
```bash
git diff main...HEAD --stat
```
- No unintended files (build artifacts, `.env*`, debug code)
- Commit messages are conventional and meaningful

### 4. Create or update the PR
If no PR exists: use the `writing-pull-requests` skill.
If PR exists: push, confirm CI is green before requesting review.

### 5. After merge
```bash
git checkout main
git pull
git branch -d feature/my-feature        # local cleanup
git push origin --delete feature/my-feature  # remote cleanup (if not auto-deleted)
```

## Protected branch rules
- Never merge directly to `main`/`master` without a PR unless the repo explicitly allows it
- Never `git push --force` to a protected branch
- If a PR is squash-merged, the feature branch commits disappear — that's expected
