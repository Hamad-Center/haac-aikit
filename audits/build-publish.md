# audits/build-publish.md

Build pipeline + npm publishing readiness.

## Audit checklist

### package.json
- [x] Version `0.12.0` — set
- [x] `bin` points to `dist/cli.mjs` for both `aikit` and `haac-aikit` aliases
- [x] `engines.node >= 20`
- [x] `files` allowlist: `dist/`, `catalog/` — only what's needed ships
- [x] `type: module` — ESM throughout
- [x] No `devDependencies` accidentally listed as runtime deps
- [x] `scripts`: build, dev, test, typecheck, lint, catalog:check all work

### Build (tsup)
- [x] `tsup` config targets node20 ESM
- [x] `define.HAAC_AIKIT_VERSION` substitutes the version from package.json at build time
- [x] Single-file bundle (148 KB)
- [x] Sourcemap emitted (327 KB)
- [x] Build is reproducible (deterministic output)

### npm publish dry-run
- [ ] Run `npm pack --dry-run` and verify tarball contents
- [ ] Verify no `.env`, `.npmrc`, `node_modules` leak in
- [ ] Verify `catalog/` directory complete (rules, skills, agents, hooks, commands, ci, mcp, settings, templates)
- [ ] Verify version banner matches release tag

### CI
- [ ] `npm test` runs in GitHub Actions on PRs
- [ ] `npm run catalog:check` runs on PRs
- [ ] `npm run typecheck` runs on PRs
- [ ] Release workflow auto-publishes on tag push (or document the manual flow)

## Status

🟡 — code is build-ready; final npm pack verification + CI gating still need a manual pass before publish.
