# audits/migration.md

Breaking-change migration from 0.11 → 0.12.

## Audit checklist

- [x] **Old `scope`/`shape` fields warn on read** — `readConfig` flags them and prints a clear migration message to stderr
- [x] **Old `integrations.{husky,devcontainer,plugin,otel}` warn on read** — same migration message
- [x] **`writeConfig` strips unknown keys** — re-emits only known-good fields so a stale field can't silently round-trip
- [x] **Removed CLI commands** (`learn`, `whatsnew`) — exit 1 with "Unknown command" if a user scripts them
- [x] **Removed slash commands** (`/debug`, `/explore`, `/plan`, `/tdd`, `/execute`, `/review`) — equivalent skills are tier1 and auto-trigger
- [x] **README + CHANGELOG migration section** — clear upgrade steps documented
- [ ] **No prune** — orphaned `.claude/hooks/format-on-save.sh`, `.devcontainer/`, `.husky/`, `.claude/plugin/` directories from <0.12 stay on disk after upgrade. Migration step in CHANGELOG tells user to `rm -rf` them manually.

## Status

🟢 — clean migration path. Stale-file prune would be polish (could add `aikit doctor --prune-orphans` in a future release).
