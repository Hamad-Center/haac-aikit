---
name: using-git-worktrees
description: Use when starting work on a new feature, experiment, or large refactor that should be isolated from the current working tree. Prevents clobbering in-progress work and enables parallel development across multiple branches simultaneously.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- Starting a feature that will take multiple sessions
- Running a risky refactor you might want to abandon
- Exploring an approach in parallel with the current code
- When the human says "try this in isolation" or "don't touch the main branch"

## Setup

```bash
# Create a new worktree for a feature branch
git worktree add ../my-repo-feature feature/my-feature

# Work in the isolated tree
cd ../my-repo-feature

# When done, remove the worktree
cd ../my-repo
git worktree remove ../my-repo-feature
```

## Rules

1. **Name worktrees clearly**: `<repo>-<branch-slug>` in a sibling directory, not a subdirectory of the main repo.

2. **One branch per worktree**: git enforces this — the same branch cannot be checked out in two worktrees simultaneously.

3. **Don't commit from the wrong tree**: confirm `git branch` shows the expected branch before committing.

4. **Clean up after merging**: `git worktree list` shows dangling worktrees; remove them with `git worktree remove`.

5. **Shared objects, separate index**: changes in a worktree do not affect the main tree's index or stash. You can run tests, build, and experiment without touching the main tree's state.

## When NOT to use
- Small, low-risk changes — a worktree adds overhead for a 5-minute fix
- When you need the full IDE toolchain to be pointed at the worktree (some tools don't follow worktrees well)
