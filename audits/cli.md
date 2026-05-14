# audits/cli.md

CLI commands shipped in 0.12.

## Commands

| Command | Status | Notes |
|---|---|---|
| `aikit` (init/wizard) | 🟢 | Headless mode + flag parsing tested |
| `aikit sync` | 🟢 | Per-tool dispatch; conflict resolution; tier3 protection tested |
| `aikit update` | 🟡 | Untested for catalog version mismatch; quick path tested |
| `aikit diff` | 🟢 | No writes; reads + compares |
| `aikit add <name>` | 🟢 | Path-traversal guard added; tier3 persistence tested |
| `aikit add --html` | 🟢 | 12-file bundle install; idempotent |
| `aikit list` | 🟢 | Shows installed + catalog |
| `aikit doctor` | 🟡 | Basic checks pass; `--rules` observability path covered separately |
| `aikit report` | 🟡 | Tested; markdown + json formats work |

## Audit checklist

- [x] All 9 commands wired in `src/cli.ts` switch
- [x] `--help` output matches actual commands
- [x] Unknown command exits 1 with clear message
- [x] Removed commands (`learn`, `whatsnew`) are not referenced anywhere
- [x] No reference to deleted flags (`--scope`, `--preset`, `--limit`, `--all`, `--no-update-check`)
- [x] Headless mode (`--yes` + non-TTY) works
- [x] Argument-parser flags match `CliArgs` type
- [ ] `update` command tested end-to-end on a version mismatch (no test scenario today)
- [ ] All exit codes are documented (currently: 0 success, 1 unknown command / invalid name)

## Edge cases tested

- [x] Re-running init on existing `.aikitrc.json` short-circuits to sync
- [x] Dirty tree check works
- [x] `--skip-git-check` bypasses dirty-tree gate
- [x] `--dry-run` prevents writes
- [x] `--force` overrides conflict prompt

## Status

🟢 — production-ready. `update` would benefit from a regression test but isn't a blocker.
