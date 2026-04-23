---
name: writing-commits
description: Use when creating a git commit. Enforces Conventional Commits format, prevents committing secrets or debug artifacts, and ensures the commit message explains why rather than what. Never use --no-verify or --amend on published commits.
version: "1.0.0"
source: haac-aikit
license: MIT
---

## Commit format

```
type(scope): description

[optional body: one paragraph explaining WHY, not WHAT]

Co-Authored-By: Claude <noreply@anthropic.com>
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

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Safety rules

- **Never** `git push --force` to `main`/`master`/`develop`
- **Never** `git commit --no-verify`
- **Never** `git commit --amend` on a commit that has been pushed
- If a pre-commit hook fails: fix the underlying issue, re-stage, create a NEW commit
