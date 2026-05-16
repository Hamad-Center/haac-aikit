Stage changed files and commit using the `writing-commits` skill. `$ARGUMENTS` may supply the commit message; otherwise draft one from the diff.

1. Run `git status` + `git diff --staged`; confirm no secrets, debug logs, or `.env*` files.
2. Apply `writing-commits` skill rules (Conventional Commits, ≤72 chars, imperative, body explains WHY).
3. If the change touches `src/` or `test/`, recommend `verification-before-completion` (run the project's test command) before committing.
4. Commit via HEREDOC; co-author = current Claude model name.
5. Report commit hash + message.
