# audits/cursor.md

What we install when `cursor` is selected, and whether it matches what Cursor 1.7+ actually expects (per <https://cursor.com/docs/context/rules>, <https://cursor.com/docs/agent/hooks>, <https://cursor.com/docs/context/mcp>).

## What we ship to a Cursor-only install

- `.cursor/rules/000-base.mdc` — translated from canonical AGENTS.md via `parseRuleSet` + `translateForCursor`
- `.cursor/rules/skill-<name>.mdc` × 25 (one per installed skill)
- `.cursor/hooks/<name>.sh` × 9 (safety + telemetry shell scripts)
- `.cursor/hooks.json` — 10 wired events, `failClosed: true` on safety, regex `matcher` scoping where useful
- `.cursor/mcp.json` — same shape as Claude `.mcp.json`

## Audit checklist

### Format correctness
- [ ] MDC frontmatter parses cleanly under Cursor's parser — double-quoted `description` confirmed legal (verified by `skillToCursorMdc` test + manual paste into Cursor)
- [ ] No reserved YAML characters break our `description` field (we currently escape `"` but not `\n` — check whether multi-line YAML quoted strings need a folded scalar `>` or block `|`)
- [ ] `alwaysApply: false` is the right value for description-triggered skills (vs `null` or omitted)
- [ ] Subdirectory rules (`skill-*.mdc` could be `skills/<name>.mdc`) — does Cursor walk subdirs? **Worth checking; we currently flatten under .cursor/rules/**

### Hooks correctness
- [ ] `hooks.json` shape `{version: 1, hooks: {<event>: [{command, failClosed, matcher}]}}` matches Cursor's parser
- [ ] `command` path: `.cursor/hooks/<name>.sh` — verify whether path is resolved from workspace root or `.cursor/` directory
- [ ] `matcher` regex syntax: confirm Cursor uses JavaScript regex syntax (we wrote `^git\\s+push` — escapes correct)
- [ ] `failClosed: true` — confirm Cursor blocks tool on hook error/timeout
- [ ] Hook scripts ship with executable bit set (chmod 0755 via copyAction) — verify on cross-platform
- [ ] On Windows, `.sh` files won't run. Add a doc note or generate `.cmd` shim?

### Coverage gaps
- [ ] **21 events available; we wire 10** — the 11 we don't use: sessionEnd, postToolUseFailure, afterShellExecution, afterMCPExecution, beforeSubmitPrompt, afterAgentResponse, afterAgentThought, beforeTabFileRead, afterTabFileEdit, workspaceOpen. Identify any with real value to wire.
- [ ] `loop_limit` field on hook entries (Cursor doc default = 5). Should we set explicitly for telemetry hooks to prevent recursion?
- [ ] MCP variable interpolation (`${env:NAME}`, `${workspaceFolder}`) — currently our `.cursor/mcp.json` doesn't use these. Add a comment in the file or a doc?

### Edge cases
- [ ] What happens if user already has a `.cursor/rules/` populated with non-aikit rules — do we coexist or conflict?
- [ ] What if user has Cursor < 1.7 — does our `hooks.json` cause an error or silent skip?
- [ ] Path-scoped skills via `globs:` — currently every skill is `alwaysApply: false` (description-trigger only). For e.g. `test-driven-development`, could attach `globs: ["**/*.test.*"]` for path-trigger. Worth exploring.

### Tests
- [ ] Unit test that `skillToCursorMdc` produces valid YAML frontmatter (parse roundtrip)
- [ ] Unit test that `buildCursorHooksJson` produces valid JSON Cursor would accept
- [ ] Integration test: full sync with `--tools=cursor` writes the expected file set

### Documentation accuracy
- [ ] README + landing page parity matrix correctly reflects Cursor's capabilities
- [ ] `aikit list` output shows skill-translated rules where applicable

## Status

Currently 🟡 — works (smoke-tested in fresh repo), but: format-validation by Cursor's actual parser is not automated, subdir nesting not explored, no Windows handling for shell hooks.

## Decision: what to fix before publish

(Filled in after research result arrives)
