Run the full release checklist before tagging a release. `$ARGUMENTS` is the version tag (e.g. `v1.2.3`); prompt if missing.

0. **Verification gate** — invoke the `verification-before-completion` skill. It sets the bar that every numbered step below must clear.

1. **Tests**: project test command — all pass, 0 failures. (`npm test` / `pnpm test` / `cargo test` / `pytest` / `go test ./...` — detect from manifest.)
2. **Types**: project typechecker — clean. (`tsc --noEmit` / `mypy` / `cargo check`.)
3. **Lint**: project linter — clean. (`npm run lint` / `ruff check` / `cargo clippy`.)
4. **Security sweep**: run the `/security-review` command on changed files. Any ✗ (critical) **blocks** the ship.
5. **Changelog**: confirm CHANGELOG.md or release notes are updated.
6. **Version bump**: update the project's manifest (`package.json` for npm, `Cargo.toml` for Cargo, `pyproject.toml` for Poetry/PDM, `go.mod` for Go modules). Commit with `chore(release): vX.Y.Z`.
7. **Tag**:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"   # use -s instead of -a if commit.gpgsign=true
git push origin vX.Y.Z
```
8. **Publish** (matches package manager):
```bash
# npm:    npm publish --dry-run && npm publish
# Cargo:  cargo publish --dry-run && cargo publish
# PyPI:   python -m build && twine upload dist/*
# Go:     publishing happens via tag push — step 7 already did it
```
9. **Post-release**: create a GitHub release with the changelog entry.

10. **Smoke test**: install the published artifact in a temp dir and verify `--version` matches the tagged version.

Only mark shipped when all 10 steps are complete.
