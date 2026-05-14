# audits/config-wizard.md

`.aikitrc.json` schema + interactive wizard.

## Audit checklist

### Schema
- [x] Top-level keys: `$schema`, `version`, `projectName`, `projectDescription`, `tools`, `integrations`, `skills`, `agents`, `canonical`
- [x] No removed fields (`scope`, `shape`) accepted on write — stripped by `writeConfig`
- [x] `integrations.{husky,devcontainer,plugin,otel}` not in current type — warn on read
- [x] Unknown top-level keys → stderr warning on read
- [x] `version: 1` enforced on read
- [x] `tools` array validated against `Tool` union

### Wizard
- [x] Three prompts only: projectName, projectDescription, tools (removed scope/shape/integrations/specialty)
- [x] Headless mode (`--yes`) returns full defaults
- [x] Default tools list = all 7
- [x] `--tools=<csv>` parses correctly
- [x] `--tools=none` returns empty array
- [x] `--tools=all` returns full list

### Defaults
- [x] All integrations default to `true` (mcp, hooks, commands, subagents, ci)
- [x] Skills tier1/tier2: `"all"`
- [x] Agents tier1: `"all"`, tier2: `"all"`

## Status

🟢 — schema is honest about its current shape, wizard is minimal, migration is graceful.
