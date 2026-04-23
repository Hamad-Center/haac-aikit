Run the full release checklist before tagging a release.

1. **Tests**: `npm test` — all pass, 0 failures.
2. **Types**: `tsc --noEmit` — clean.
3. **Lint**: `npm run lint` — clean.
4. **Security sweep**: run the `/security-review` command on changed files.
5. **Changelog**: confirm CHANGELOG.md or release notes are updated.
6. **Version bump**: update `package.json` version, commit with `chore(release): vX.Y.Z`.
7. **Tag**:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```
8. **Publish** (if npm package):
```bash
npm publish --dry-run   # inspect first
npm publish
```
9. **Post-release**: create a GitHub release with the changelog entry.

Only mark shipped when all 9 steps are complete.
