---
name: writing-commits
description: Use when the user explicitly asks to commit — phrases like "commit this", "git commit", "ship a commit", "let's commit", "make a commit". Enforces Conventional Commits format, blocks committing secrets or debug artifacts, and uses HEREDOC so multiline bodies survive shell quoting. Never commit without an explicit ask.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git add:*)
  - Bash(git commit:*)
  - Bash(git log:*)
---

## Commit format

```
type(scope): description

[optional body: one paragraph explaining WHY, not WHAT]

Co-Authored-By: Claude <current-model-name> <noreply@anthropic.com>
```

**Types**: `feat` `fix` `refactor` `test` `docs` `chore` `perf`
**Scope**: the module, file group, or feature area (e.g. `auth`, `api`, `cli`)
**Description**: imperative mood, ≤72 chars, no period

## Pre-commit checklist

Before staging:
1. `git diff --staged` — confirm no `.env*`, `secrets/`, `*.pem`, `id_rsa*` files
2. No `console.log` / debug output left in
3. No `// @ts-ignore` added without a comment explaining why
4. No TODO comments pointing at unresolved issues introduced in this commit

## Creating the commit

Always use HEREDOC to preserve newlines:
```bash
git commit -m "$(cat <<'EOF'
feat(auth): add refresh token rotation

Refresh tokens are now single-use; each use issues a new token pair.
This prevents replay attacks from stolen refresh tokens while keeping
sessions alive without re-authentication.

Co-Authored-By: Claude <current-model-name> <noreply@anthropic.com>
EOF
)"
```

## Anti-patterns

- **Using `git commit --amend` on a commit that has been pushed.** Rewrites history others may have pulled.
- **Using `--no-verify` to bypass a failing hook.** The hook is failing for a reason — fix the underlying issue, re-stage, create a NEW commit.
- **Force-pushing to `main`/`master`/`develop`.** Never. To any shared branch — only with explicit user opt-in.
- **Staging with `git add .` or `git add -A` when secrets might be untracked.** Add specific files by name.
- **Committing because the task feels done.** Only commit when the user explicitly asks.

Run `verification-before-completion` before staging. After the commit, follow with `requesting-code-review` or open a PR.
