Stage changed files, draft a Conventional Commits message, and commit using the writing-commits skill.

1. Run `git status` to see what's changed.
2. Run `git diff --staged` — confirm no secrets, debug logs, or `.env*` files.
3. Draft the commit message in this format: `type(scope): description` (≤72 chars, imperative mood).
4. Commit using HEREDOC format:
```bash
git commit -m "$(cat <<'EOF'
type(scope): description

[optional body explaining WHY]

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
5. Report: commit hash + message.
