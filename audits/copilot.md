# audits/copilot.md

What we install when `copilot` is selected, per <https://code.visualstudio.com/docs/copilot/customization/custom-instructions>, <https://code.visualstudio.com/docs/copilot/customization/custom-chat-modes>, <https://code.visualstudio.com/docs/copilot/customization/prompt-files>.

## What we ship to a Copilot-only install

- `.github/copilot-instructions.md` — base instructions (always-on)
- `.github/instructions/<name>.instructions.md` × 25 (one per skill, `applyTo: '**'`)
- `.github/agents/<name>.agent.md` × 5 (one per installed agent, `user-invocable: true`)

## Audit checklist

### Format correctness
- [ ] `.instructions.md` frontmatter accepts `applyTo` + `description` — confirm no additional required fields
- [ ] `.agent.md` frontmatter — verify `name` is the right key (vs `title`?), and that `user-invocable` (with hyphen) is correct (vs `userInvocable`)
- [ ] `tools:` list — confirm YAML list form matches Copilot's expectation, not a comma-separated string

### Coverage gaps
- [ ] `applyTo` is currently always `'**'` (always-on). For per-language skills (e.g. `test-driven-development`), could use `'**/*.{test,spec}.{ts,js,py}'` — worth exploring
- [ ] `argument-hint` frontmatter field for agents — we don't ship a hint, users would benefit from one for the dispatch UX
- [ ] `handoffs` for cross-agent dispatch — we don't model handoffs in the catalog, but `orchestrator` agent literally exists to hand off. Worth wiring.
- [ ] `mcp-servers` per-agent — our MCP is workspace-scoped (one `.vscode/mcp.json` for everyone). Currently we don't ship `.vscode/mcp.json`. Should we?
- [ ] Agent-scoped `hooks` (preview) — could mirror our Claude hooks per-agent for Copilot
- [ ] Prompts at `.github/prompts/*.prompt.md` — we could translate skill commands (`/decide`, `/docs`) as prompts. Currently we ship skills only, no slash-style invocation in Copilot.

### MCP
- [ ] `.vscode/mcp.json` is the recognized location for Copilot MCP servers (per VS Code docs). We currently don't write this. Add to sync for `--tools=copilot`?

### Edge cases
- [ ] What if user has a pre-existing `.github/instructions/` directory with their own files — we coexist (different filenames), but verify
- [ ] What if user uses `.github/copilot-instructions.md` already (Copilot's primary file) — our sync overwrites via `safeWrite` (conflict prompt on second sync)
- [ ] Personal instructions vs Repo vs Organization precedence — our shipped repo instructions might be overridden by user's personal settings. Document.

### Tests
- [ ] Test that `agentToCopilotAgent` emits valid YAML frontmatter
- [ ] Test that `skillToCopilotInstruction` emits valid YAML frontmatter
- [ ] Integration test: full sync with `--tools=copilot` writes the expected file set

## Status

🟡 — generates the right files but missing `.vscode/mcp.json` and not wiring optional richer fields.

## Decision: what to fix before publish

(Filled in after research result arrives)
