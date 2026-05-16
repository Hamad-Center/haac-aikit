Commit all staged changes, push to the current branch, and open a pull request.

Uses the `writing-commits` and `writing-pull-requests` skills; gated by `verification-before-completion`. `$ARGUMENTS` may supply the PR title; otherwise draft one from the diff.

0. **Verification gate** — invoke the `verification-before-completion` skill. Detect the test command from the project manifest (`package.json` → `npm test` / `pnpm test`, `Cargo.toml` → `cargo test`, `pyproject.toml` → `pytest`, `go.mod` → `go test ./...`). If tests fail, **STOP** and report — do not commit broken code.

1. **Branch guard** — if `git branch --show-current` returns `main` / `master`, refuse and ask the user to create a feature branch first (naming convention: `type/short-description`).

2. **Commit** — run the `/commit` flow (stage, draft message via `writing-commits` skill, commit).

3. **Push** — `git push -u origin HEAD` (no `--force`; if the remote already has commits, stop and surface the conflict).

4. **Open PR** — invoke the `writing-pull-requests` skill. Title is `$ARGUMENTS` if provided, otherwise drafted from the diff (≤70 chars, Conventional Commits format). Body:

```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- [what changed]

## Test plan
- [ ] [how to verify]
- [ ] Full suite passes: <detected test command>
EOF
)"
```

5. **Report** the PR URL.
