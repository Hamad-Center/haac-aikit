Commit all staged changes, push to the current branch, and open a pull request.

1. Run the `/commit` flow (stage, draft message, commit).
2. Push: `git push -u origin HEAD`
3. Open a PR using the writing-pull-requests skill:
   - Title: ≤70 chars, Conventional Commits format
   - Body: Summary bullets + Test plan checklist
```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- [what changed]

## Test plan
- [ ] [how to verify]
- [ ] Full suite passes: `npm test`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
4. Report the PR URL.
